import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { FeatherPaths, ensureDirs } from "../../src/fs-layout";
import { startHttpServer } from "../../src/transport/http";
import { emitBusEvent } from "../../src/logs/bus";
import type { FastifyInstance } from "fastify";

function makeMockManager() {
  return {
    launch: async () => ({}),
    list: () => [],
    get: () => {
      throw Object.assign(new Error("SESSION_NOT_FOUND"), { code: "SESSION_NOT_FOUND" });
    },
    close: async () => {},
  } as any;
}

let tmpDir: string;
let paths: FeatherPaths;
let serverInstance: FastifyInstance;
let baseUrl: string;
let testToken: string;

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-sse-test-"));
  await ensureDirs(tmpDir);
  paths = new FeatherPaths(tmpDir);
  const manager = makeMockManager();
  const result = await startHttpServer("127.0.0.1", 0, manager, paths);
  serverInstance = result.server;
  baseUrl = `http://127.0.0.1:${result.port}`;
  testToken = result.token;
});

afterAll(async () => {
  await serverInstance.close();
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe("GET /v1/events", () => {
  it("without token returns 401", async () => {
    const res = await fetch(`${baseUrl}/v1/events`);
    expect(res.status).toBe(401);
  });

  it("with wrong token returns 401", async () => {
    const res = await fetch(`${baseUrl}/v1/events`, {
      headers: { "X-Feather-Token": "wrong-token" },
    });
    expect(res.status).toBe(401);
  });

  it("with correct token returns 200 text/event-stream", async () => {
    const ac = new AbortController();
    try {
      const res = await fetch(`${baseUrl}/v1/events`, {
        headers: { "X-Feather-Token": testToken },
        signal: ac.signal,
      });
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/event-stream");
    } finally {
      ac.abort();
    }
  });

  it("lifecycle event emitted on bus appears in SSE stream", async () => {
    const ac = new AbortController();
    const timeoutId = setTimeout(() => ac.abort(), 4000);

    try {
      const res = await fetch(`${baseUrl}/v1/events`, {
        headers: { "X-Feather-Token": testToken },
        signal: ac.signal,
      });
      expect(res.status).toBe(200);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      // wait for the generator to start and subscribe to the bus
      await new Promise((r) => setTimeout(r, 50));

      // emit a lifecycle event directly on the bus
      emitBusEvent({
        event: "session.launch.completed",
        sessionId: "ses_sse_test",
        ts: "2026-06-02T00:00:00.000Z",
      });

      // read stream until we see the event or the timeout aborts
      let buffer = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          if (buffer.includes("session.launch.completed")) break;
        }
      } finally {
        reader.cancel();
      }

      expect(buffer).toContain("event: session.launch.completed");
      expect(buffer).toContain('"sessionId":"ses_sse_test"');
    } finally {
      clearTimeout(timeoutId);
      ac.abort();
    }
  });

  it("non-lifecycle event is NOT forwarded to SSE stream", async () => {
    const ac = new AbortController();
    const timeoutId = setTimeout(() => ac.abort(), 4000);

    try {
      const res = await fetch(`${baseUrl}/v1/events`, {
        headers: { "X-Feather-Token": testToken },
        signal: ac.signal,
      });
      expect(res.status).toBe(200);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      // wait for the generator to start and subscribe to the bus
      await new Promise((r) => setTimeout(r, 50));

      // emit a non-lifecycle event — should be filtered out
      emitBusEvent({
        event: "page.navigate.completed",
        sessionId: "ses_sse_test",
        ts: "2026-06-02T00:00:00.000Z",
      });

      // wait 200ms — nothing should arrive
      let buffer = "";
      const readPromise = reader.read().then(({ value }) => {
        if (value) buffer += decoder.decode(value);
      });
      await Promise.race([readPromise, new Promise((r) => setTimeout(r, 200))]);
      reader.cancel();

      expect(buffer).not.toContain("page.navigate.completed");
    } finally {
      clearTimeout(timeoutId);
      ac.abort();
    }
  });
});
