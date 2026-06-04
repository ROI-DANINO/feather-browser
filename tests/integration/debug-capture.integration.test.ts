import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { FeatherPaths, ensureDirs } from "../../src/fs-layout";
import { ProfileLock } from "../../src/profiles/lock";
import { WorkspaceMetadata } from "../../src/profiles/workspace";
import { SessionManager } from "../../src/sessions/manager";
import { startHttpServer } from "../../src/transport/http";

let baseUrl: string;
let token: string;
let manager: SessionManager;
let paths: FeatherPaths;
let tmpDir: string;

async function api(method: string, p: string, body?: object) {
  const res = await fetch(`${baseUrl}${p}`, {
    method,
    headers: { "Content-Type": "application/json", "X-Feather-Token": token },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-int-dbgcap-"));
  await ensureDirs(tmpDir);
  paths = new FeatherPaths(tmpDir);
  const lock = new ProfileLock(paths);
  const workspace = new WorkspaceMetadata(paths);
  manager = new SessionManager(paths, lock, workspace);
  const { port, token: t } = await startHttpServer("127.0.0.1", 0, manager, paths);
  token = t;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  const sessions = manager.list();
  await Promise.allSettled(sessions.map((s) => manager.close(s.sessionId, { force: true })));
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe("DebugCapture wiring — real Chromium end-to-end", () => {
  it("produces a valid trace.zip and network-summary.jsonl in the debug dir after close", async () => {
    // Launch a real session with tracing enabled via the debug input.
    const launch = await api("POST", "/v1/sessions", {
      workspaceId: "debug-capture-ws",
      profile: { kind: "persistent" },
      browserMode: "chromium-headless-shell",
      debug: { trace: true },
    });
    expect(launch.status).toBe(200);
    const sessionId = launch.body.data.sessionId as string;

    // Navigate so there is real network + page activity for capture to record.
    await api("POST", `/v1/sessions/${sessionId}/navigate`, {
      url: "https://example.com",
      waitUntil: "domcontentloaded",
      timeoutMs: 30000,
    });

    // Close — DebugCapture.finalize() runs before context.close().
    const close = await api("DELETE", `/v1/sessions/${sessionId}`, { force: false });
    expect(close.status).toBe(200);

    const debugDir = paths.debugDir(sessionId);

    // network-summary.jsonl must exist (capture wired and finalized).
    const summaryPath = path.join(debugDir, "network-summary.jsonl");
    const summaryExists = await fs.promises
      .access(summaryPath)
      .then(() => true)
      .catch(() => false);
    expect(summaryExists).toBe(true);

    // trace.zip must exist AND be a real zip (PK magic bytes) — proves
    // tracing actually ran, not just that a file was touched.
    const tracePath = path.join(debugDir, "trace.zip");
    const traceStat = await fs.promises.stat(tracePath);
    expect(traceStat.size).toBeGreaterThan(0);
    const fd = await fs.promises.open(tracePath, "r");
    const { buffer } = await fd.read(Buffer.alloc(2), 0, 2, 0);
    await fd.close();
    expect(buffer.toString("latin1")).toBe("PK");
  }, 40000);
});
