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
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-int-dismiss-"));
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

describe("POST /v1/sessions/:sessionId/dismiss", () => {
  it("dismisses an Accept-all overlay and leaves zero overlays after", async () => {
    const launch = await api("POST", "/v1/sessions", {
      workspaceId: "dismiss-ws",
      profile: { kind: "persistent" },
      browserMode: "chromium-headless-shell",
    });
    expect(launch.status).toBe(200);
    const sessionId = launch.body.data.sessionId as string;

    // A full-screen fixed overlay with a dismissable button
    const overlayHtml = `<!DOCTYPE html><html><body>
<p id="content">Page content</p>
<div id="overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center">
  <div style="background:white;padding:40px;text-align:center">
    <p>We use cookies</p>
    <button id="accept" onclick="document.getElementById('overlay').remove()">Accept all</button>
  </div>
</div>
</body></html>`;

    const encoded = encodeURIComponent(overlayHtml);
    await api("POST", `/v1/sessions/${sessionId}/navigate`, {
      url: `data:text/html,${encoded}`,
      waitUntil: "domcontentloaded",
    });

    // POST /dismiss — should click "Accept all" and report it
    const res = await api("POST", `/v1/sessions/${sessionId}/dismiss`, {});
    expect(res.status).toBe(200);
    expect(res.body.data.dismissed.length).toBeGreaterThan(0);
    expect(res.body.data.dismissed[0].name).toBe("Accept all");

    // Observe again — overlay removed from DOM => overlays.length === 0
    const after = await api("POST", `/v1/sessions/${sessionId}/observe`, {});
    expect(after.status).toBe(200);
    expect(after.body.data.overlays.length).toBe(0);

    await api("DELETE", `/v1/sessions/${sessionId}`, { force: false });
  }, 60000);
});
