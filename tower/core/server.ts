// tower/core/server.ts
import Fastify, { type FastifyInstance } from "fastify";
import { join } from "node:path";
import { DetectorReport } from "./types";
import type { SinkRegistry } from "./sink-registry";
import { readRuns } from "./store";
import { renderRun } from "./render";
import { runtimeEnablePage } from "../levels/runtime-enable/page";

export interface ServerDeps {
  /** The nonce lifecycle store the sink consults for the status→HTTP mapping (arm/record/await). */
  registry: SinkRegistry;
  /** Called with a validated report once the registry has *recorded* it (status `recorded`). */
  onReport: (report: DetectorReport) => void;
  /** Append-only run log GET / renders. Defaults to the path serve.ts writes. */
  resultsFile?: string;
}

const PLACEHOLDER_HTML = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Tower</title></head>
<body><main><h1>Tower placeholder level</h1>
<p>This page is a stand-in. Real challenge levels arrive in Chunk 3.</p></main></body></html>`;

/** The Tower control plane + page host. No CDP/Playwright — it never drives the measured browser. */
export function buildServer(deps: ServerDeps): FastifyInstance {
  const app = Fastify();
  const resultsFile = deps.resultsFile ?? join(__dirname, "..", "results", "runs.jsonl");

  // navigator.sendBeacon posts text/plain, not application/json. Register a text/plain parser that
  // JSON.parses the string body so a beacon flush is interchangeable with the fetch keepalive JSON.
  // (application/json keeps Fastify's built-in parser.) Malformed JSON surfaces as 400, not 500.
  app.addContentTypeParser("text/plain", { parseAs: "string" }, (_req, body, done) => {
    try {
      done(null, JSON.parse(body as string));
    } catch {
      done(Object.assign(new Error("invalid JSON body"), { statusCode: 400 }));
    }
  });

  app.get("/", async (_req, reply) => {
    const runs = readRuns(resultsFile);
    return reply.code(200).type("text/html").send(renderRun(runs.at(-1) ?? null));
  });

  app.get("/health", async () => ({ ok: true }));

  app.post("/sink/:nonce", async (req, reply) => {
    const { nonce } = req.params as { nonce: string };
    const parsed = DetectorReport.safeParse(req.body);
    if (!parsed.success) {
      // Malformed report never touches the registry — an armed nonce stays consumable.
      return reply.code(400).send({ ok: false, error: "invalid DetectorReport" });
    }
    // The registry owns the nonce state machine; the handler is a thin status→HTTP mapping.
    const result = deps.registry.record(nonce, parsed.data);
    switch (result.status) {
      case "recorded":
        deps.onReport(parsed.data);
        return reply.code(200).send({ ok: true });
      case "unknown": // never armed
        return reply.code(410).send({ ok: false, error: "unknown nonce" });
      case "expired": // armed but past its deadline
        return reply.code(410).send({ ok: false, error: "expired nonce" });
      case "consumed": // single-use replay
        return reply.code(409).send({ ok: false, error: "nonce already consumed" });
      case "mismatch": // body.nonce ≠ :nonce
        return reply.code(400).send({ ok: false, error: "nonce mismatch" });
    }
  });

  app.get("/levels/placeholder", async (_req, reply) => {
    return reply.code(200).type("text/html").send(PLACEHOLDER_HTML);
  });

  // The L2 detectability challenge page. Registered on THIS same-origin instance so the page's
  // POST /sink/:nonce beacon is loopback→loopback (no CORS/PNA) and the level's task.url resolves
  // against the real server (not a 404). Design §3.2: buildServer hosts the level page plugins.
  app.register(runtimeEnablePage);

  return app;
}
