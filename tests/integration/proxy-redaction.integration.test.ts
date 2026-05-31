// tests/integration/proxy-redaction.integration.test.ts
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
let tmpDir: string;
let paths: FeatherPaths;

async function api(method: string, path: string, body?: object) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json", "X-Feather-Token": token },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-int-proxy-"));
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

describe("Proxy credential redaction", () => {
  const proxyPassword = "secret";
  let sessionId: string;

  it("Test 1: Launch session with proxy credentials (non-existent server) — launch succeeds", async () => {
    // A non-existent proxy server is fine at launch time; Playwright accepts the config.
    // Navigation will fail but that is not tested here.
    const { status, body } = await api("POST", "/v1/sessions", {
      workspaceId: "proxy-test-ws",
      profile: { kind: "disposable" },
      browserMode: "chromium-headless-shell",
      proxy: {
        server: "http://127.0.0.1:9999",
        username: "user",
        password: proxyPassword,
      },
    });

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.state).toBe("running");
    sessionId = body.data.sessionId;
  });

  it("Test 2: GET /v1/sessions/:id → proxy has hasCredentials: true and server, but NO username/password", async () => {
    const { status, body } = await api("GET", `/v1/sessions/${sessionId}`);

    expect(status).toBe(200);
    expect(body.ok).toBe(true);

    const proxy = body.data.proxy;
    expect(proxy).not.toBeNull();
    expect(proxy.server).toBe("http://127.0.0.1:9999");
    expect(proxy.hasCredentials).toBe(true);
    expect(proxy).not.toHaveProperty("username");
    expect(proxy).not.toHaveProperty("password");
  });

  it("Test 3: JSONL log file for session does NOT contain the string 'secret'", async () => {
    const logPath = paths.sessionLog(sessionId);

    // Wait briefly for the log file to be flushed — it should exist after session launch
    await new Promise((resolve) => setTimeout(resolve, 200));

    const logExists = await fs.promises
      .access(logPath)
      .then(() => true)
      .catch(() => false);
    expect(logExists).toBe(true);

    const logContent = await fs.promises.readFile(logPath, "utf8");
    expect(logContent).not.toContain(proxyPassword);
  });

  it("Test 4: Close session", async () => {
    const { status, body } = await api("DELETE", `/v1/sessions/${sessionId}`, { force: true });

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.state).toBe("closed");
  });
});
