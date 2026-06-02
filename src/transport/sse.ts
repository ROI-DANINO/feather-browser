import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { FastifySSEPlugin } from "fastify-sse-v2";
import { onBusEvent } from "../logs/bus";
import type { BusEvent } from "../logs/bus";
import type { EventName } from "../logs/events";

const LIFECYCLE_EVENTS = new Set<EventName>([
  "session.launch.requested",
  "session.launch.completed",
  "session.launch.failed",
  "session.close.requested",
  "session.close.completed",
  "session.close.failed",
  "tab.opened",
  "tab.created",
  "tab.closed",
]);

async function* sseSource(
  signal: AbortSignal,
): AsyncGenerator<{ id: string; event: string; data: string }> {
  const queue: BusEvent[] = [];
  let notify: (() => void) | null = null;

  const unsubscribe = onBusEvent((evt) => {
    if (LIFECYCLE_EVENTS.has(evt.event)) {
      queue.push(evt);
      notify?.();
      notify = null;
    }
  });

  let counter = 0;
  try {
    while (!signal.aborted) {
      while (queue.length > 0) {
        const evt = queue.shift()!;
        yield {
          id: String(counter++),
          event: evt.event,
          data: JSON.stringify({
            sessionId: evt.sessionId,
            ts: evt.ts,
            ...(evt.data !== undefined ? { data: evt.data } : {}),
          }),
        };
      }
      if (signal.aborted) break;
      await new Promise<void>((resolve) => {
        notify = resolve;
        signal.addEventListener("abort", () => resolve(), { once: true });
      });
    }
  } finally {
    unsubscribe();
  }
}

export async function registerSsePlugin(app: FastifyInstance): Promise<void> {
  await app.register(FastifySSEPlugin);
}

type TokenAuthHandler = (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

export function registerSseRoute(
  app: FastifyInstance,
  tokenAuth: TokenAuthHandler,
): void {
  app.get("/v1/events", { preHandler: [tokenAuth] }, async (request, reply) => {
    const ac = new AbortController();
    request.socket.on("close", () => ac.abort());
    reply.sse(sseSource(ac.signal));
  });
}
