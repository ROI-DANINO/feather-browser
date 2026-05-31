// tests/integration/profile-lock.integration.test.ts
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

async function api(method: string, path: string, body?: object) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json", "X-Feather-Token": token },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-int-lock-"));
  await ensureDirs(tmpDir);
  const paths = new FeatherPaths(tmpDir);
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

describe("Profile lock enforcement", () => {
  const workspaceId = "lock-test-ws";
  let firstSessionId: string;

  it("Test 1: Launch persistent workspace session succeeds", async () => {
    const { status, body } = await api("POST", "/v1/sessions", {
      workspaceId,
      profile: { kind: "persistent" },
      browserMode: "chromium-headless-shell",
    });

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.state).toBe("running");
    firstSessionId = body.data.sessionId;
  });

  it("Test 2: Launch ANOTHER persistent session with SAME workspaceId returns 409 with code PROFILE_LOCKED", async () => {
    const { status, body } = await api("POST", "/v1/sessions", {
      workspaceId,
      profile: { kind: "persistent" },
      browserMode: "chromium-headless-shell",
    });

    expect(status).toBe(409);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("PROFILE_LOCKED");
  });

  it("Test 3: Close first session succeeds (lock released)", async () => {
    const { status, body } = await api("DELETE", `/v1/sessions/${firstSessionId}`, { force: false });

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.state).toBe("closed");
  });

  it("Test 4: Launch workspace again after close succeeds (lock available)", async () => {
    const { status, body } = await api("POST", "/v1/sessions", {
      workspaceId,
      profile: { kind: "persistent" },
      browserMode: "chromium-headless-shell",
    });

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.state).toBe("running");

    // Clean up this session
    await api("DELETE", `/v1/sessions/${body.data.sessionId}`, { force: true });
  });
});
