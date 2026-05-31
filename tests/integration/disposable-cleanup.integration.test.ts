// tests/integration/disposable-cleanup.integration.test.ts
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
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-int-disp-"));
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

describe("Disposable session profile cleanup", () => {
  let sessionId: string;
  let profileDir: string;

  it("Test 1: Launch disposable session — profile dir exists at .feather/tmp/sessions/<id>/profile", async () => {
    const { status, body } = await api("POST", "/v1/sessions", {
      workspaceId: "disposable-test",
      profile: { kind: "disposable" },
      browserMode: "chromium-headless-shell",
    });

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.state).toBe("running");
    sessionId = body.data.sessionId;

    // Build the expected profile dir path
    profileDir = paths.disposableProfileDir(sessionId);
    const exists = await fs.promises
      .access(profileDir)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });

  it("Test 2: Delete (close) disposable session — profile dir is removed", async () => {
    const { status, body } = await api("DELETE", `/v1/sessions/${sessionId}`, { force: false });

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.state).toBe("closed");

    // Profile dir should be gone
    const exists = await fs.promises
      .access(profileDir)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(false);
  });

  it("Test 3: Verify GET /v1/sessions returns empty after close", async () => {
    const { status, body } = await api("GET", "/v1/sessions");

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(0);
  });
});
