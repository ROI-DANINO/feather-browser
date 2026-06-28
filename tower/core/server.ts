// tower/core/server.ts
import Fastify, { type FastifyInstance } from "fastify";
import { join } from "node:path";
import { DetectorReport } from "./types";
import { readRuns } from "./store";
import { renderRun } from "./render";

export interface ServerDeps {
  /** Called with a validated, nonce-matched detector report from the out-of-band sink. */
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

  app.get("/", async (_req, reply) => {
    const runs = readRuns(resultsFile);
    return reply.code(200).type("text/html").send(renderRun(runs.at(-1) ?? null));
  });

  app.get("/health", async () => ({ ok: true }));

  app.post("/sink/:nonce", async (req, reply) => {
    const { nonce } = req.params as { nonce: string };
    const parsed = DetectorReport.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ ok: false, error: "invalid DetectorReport" });
    }
    // TODO(chunk-2): validate nonce against a per-run registry — currently any caller controlling both params + body passes.
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
