// tower/core/server.ts
import Fastify, { type FastifyInstance } from "fastify";
import { DetectorReport } from "./types";

export interface ServerDeps {
  /** Called with a validated, nonce-matched detector report from the out-of-band sink. */
  onReport: (report: DetectorReport) => void;
}

const PLACEHOLDER_HTML = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Tower</title></head>
<body><main><h1>Tower placeholder level</h1>
<p>This page is a stand-in. Real challenge levels arrive in Chunk 3.</p></main></body></html>`;

/** The Tower control plane + page host. No CDP/Playwright — it never drives the measured browser. */
export function buildServer(deps: ServerDeps): FastifyInstance {
  const app = Fastify();

  app.get("/health", async () => ({ ok: true }));

  app.post("/sink/:nonce", async (req, reply) => {
    const { nonce } = req.params as { nonce: string };
    const parsed = DetectorReport.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ ok: false, error: "invalid DetectorReport" });
    }
    if (parsed.data.nonce !== nonce) {
      return reply.code(400).send({ ok: false, error: "nonce mismatch" });
    }
    deps.onReport(parsed.data);
    return reply.code(200).send({ ok: true });
  });

  app.get("/levels/placeholder", async (_req, reply) => {
    return reply.code(200).type("text/html").send(PLACEHOLDER_HTML);
  });

  return app;
}
