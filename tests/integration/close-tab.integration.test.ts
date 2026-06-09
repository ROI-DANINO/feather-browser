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
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-int-closetab-"));
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

describe("DELETE /v1/sessions/:sessionId/tabs/:pageId", () => {
  it("closes one tab, refuses the last, reaps the initial tab, and 404s unknown ids", async () => {
    const launch = await api("POST", "/v1/sessions", {
      workspaceId: "closetab-ws",
      profile: { kind: "persistent" },
      browserMode: "chromium-headless-shell",
    });
    expect(launch.status).toBe(200);
    const sessionId = launch.body.data.sessionId as string;
    const initialPageId = launch.body.data.pages[0].pageId as string;

    const tabA = await api("POST", `/v1/sessions/${sessionId}/tabs`, {});
    const tabB = await api("POST", `/v1/sessions/${sessionId}/tabs`, {});
    const a = tabA.body.data.pageId as string;
    const b = tabB.body.data.pageId as string;

    // 3 tabs open; close A.
    const closeA = await api("DELETE", `/v1/sessions/${sessionId}/tabs/${a}`);
    expect(closeA.status).toBe(200);
    expect(closeA.body.data.closedPageId).toBe(a);
    expect(closeA.body.data.pages.map((p: any) => p.pageId)).not.toContain(a);
    expect(closeA.body.data.pages.length).toBe(2);

    // Unknown pageId -> 404 PAGE_NOT_FOUND.
    const bogus = await api("DELETE", `/v1/sessions/${sessionId}/tabs/page_does_not_exist`);
    expect(bogus.status).toBe(404);
    expect(bogus.body.error.code).toBe("PAGE_NOT_FOUND");

    // Close the INITIAL tab (proves the listener fix reaps it). 2 -> 1.
    const closeInitial = await api("DELETE", `/v1/sessions/${sessionId}/tabs/${initialPageId}`);
    expect(closeInitial.status).toBe(200);
    expect(closeInitial.body.data.pages.map((p: any) => p.pageId)).toEqual([b]);

    // Closing the last tab is refused.
    const closeLast = await api("DELETE", `/v1/sessions/${sessionId}/tabs/${b}`);
    expect(closeLast.status).toBe(409);
    expect(closeLast.body.error.code).toBe("CANNOT_CLOSE_LAST_TAB");

    // Session is still alive with its one tab.
    const get = await api("GET", `/v1/sessions/${sessionId}`);
    expect(get.status).toBe(200);
    expect(get.body.data.state).toBe("running");

    await api("DELETE", `/v1/sessions/${sessionId}`, { force: false });
  }, 40000);

  it("closing a session tears down all tabs and releases the lock", async () => {
    const launch = await api("POST", "/v1/sessions", {
      workspaceId: "closetab-ws-2",
      profile: { kind: "persistent" },
      browserMode: "chromium-headless-shell",
    });
    expect(launch.status).toBe(200);
    const sessionId = launch.body.data.sessionId as string;
    await api("POST", `/v1/sessions/${sessionId}/tabs`, {});
    await api("POST", `/v1/sessions/${sessionId}/tabs`, {});

    const close = await api("DELETE", `/v1/sessions/${sessionId}`, { force: false });
    expect(close.status).toBe(200);

    // Registry entry gone -> GET 404.
    const get = await api("GET", `/v1/sessions/${sessionId}`);
    expect(get.status).toBe(404);

    // Lock released -> the same workspace can be launched again.
    const relaunch = await api("POST", "/v1/sessions", {
      workspaceId: "closetab-ws-2",
      profile: { kind: "persistent" },
      browserMode: "chromium-headless-shell",
    });
    expect(relaunch.status).toBe(200);
    await api("DELETE", `/v1/sessions/${relaunch.body.data.sessionId}`, { force: false });
  }, 40000);
});
