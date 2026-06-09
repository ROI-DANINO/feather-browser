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

async function api(method: string, p: string, body?: object) {
  const res = await fetch(`${baseUrl}${p}`, {
    method,
    headers: { "Content-Type": "application/json", "X-Feather-Token": token },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-int-observe-"));
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

describe("POST /v1/sessions/:sessionId/observe", () => {
  it("returns actions + observeId; bad ref → REF_EXPIRED 409", async () => {
    const launch = await api("POST", "/v1/sessions", {
      workspaceId: "observe-ws", profile: { kind: "persistent" }, browserMode: "chromium-headless-shell",
    });
    const sessionId = launch.body.data.sessionId as string;
    await api("POST", `/v1/sessions/${sessionId}/navigate`,
      { url: "data:text/html,<button>Hi</button>", waitUntil: "domcontentloaded" });

    const obs = await api("POST", `/v1/sessions/${sessionId}/observe`, {});
    expect(obs.status).toBe(200);
    expect(Array.isArray(obs.body.data.actions)).toBe(true);
    expect(typeof obs.body.data.observeId).toBe("string");

    const bad = await api("POST", `/v1/sessions/${sessionId}/click`,
      { target: { by: "ref", ref: "e999" } });
    expect(bad.status).toBe(409);
    expect(bad.body.error.code).toBe("REF_EXPIRED");
  }, 40000);
});
