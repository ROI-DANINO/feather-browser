import type { FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "crypto";

export function injectRequestId(request: FastifyRequest): void {
  (request as any).requestId = `req_${randomUUID().slice(0, 8)}`;
}

export function createTokenAuth(token: string) {
  return async function tokenAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const provided = request.headers["x-feather-token"];
    if (provided !== token) {
      await reply.status(401).send({
        ok: false,
        requestId: (request as any).requestId ?? "unknown",
        error: { code: "UNAUTHORIZED", message: "Invalid or missing X-Feather-Token." },
      });
    }
  };
}
