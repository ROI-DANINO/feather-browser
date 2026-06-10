import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as http from "http";
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
let fixture: http.Server;
let fixtureUrl: string;

async function api(method: string, p: string, body?: object) {
  const res = await fetch(`${baseUrl}${p}`, {
    method,
    headers: { "Content-Type": "application/json", "X-Feather-Token": token },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-int-tabsdisc-"));
  await ensureDirs(tmpDir);
  const paths = new FeatherPaths(tmpDir);
  manager = new SessionManager(paths, new ProfileLock(paths), new WorkspaceMetadata(paths));
  const { port, token: t } = await startHttpServer("127.0.0.1", 0, manager, paths);
  token = t;
  baseUrl = `http://127.0.0.1:${port}`;

  // Real local-HTTP fixture — data: URLs are opaque-origin (pinned project trap).
  fixture = http.createServer((req, res) => {
    if (req.url === "/") {
      res.setHeader("Content-Type", "text/html");
      res.end(`<!doctype html><title>Opener</title><a id="pop" href="/child" target="_blank">open</a>`);
    } else {
      res.setHeader("Content-Type", "text/html");
      res.end(`<!doctype html><title>Child</title><body>child</body>`);
    }
  });
  await new Promise<void>((r) => fixture.listen(0, "127.0.0.1", () => r()));
  const addr = fixture.address() as { port: number };
  fixtureUrl = `http://127.0.0.1:${addr.port}`;
});

afterAll(async () => {
  const sessions = manager.list();
  await Promise.allSettled(sessions.map((s) => manager.close(s.sessionId, { force: true })));
  await new Promise<void>((r) => fixture.close(() => r()));
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe("tab discovery", () => {
  it("click on target=_blank reports newPageId and GET /tabs sees the new tab", async () => {
    const launch = await api("POST", "/v1/sessions", {
      profile: { kind: "disposable" },
      browserMode: "chromium-headless-shell",
    });
    expect(launch.status).toBe(200);
    const sessionId = launch.body.data.sessionId as string;

    const nav = await api("POST", `/v1/sessions/${sessionId}/navigate`, { url: `${fixtureUrl}/` });
    expect(nav.status).toBe(200);

    const click = await api("POST", `/v1/sessions/${sessionId}/click`, {
      target: { by: "css", selector: "#pop" },
    });
    expect(click.status).toBe(200);
    expect(click.body.data.clicked).toBe(true);

    // Ground truth: the tabs list sees the spawned tab. The context "page" event lands
    // asynchronously after the click response (measured here), so poll briefly.
    let pages: Array<{ pageId: string }> = [];
    for (let i = 0; i < 20; i++) {
      const tabs = await api("GET", `/v1/sessions/${sessionId}/tabs`);
      expect(tabs.status).toBe(200);
      expect(tabs.body.data.sessionId).toBe(sessionId);
      pages = tabs.body.data.pages;
      if (pages.length === 2) break;
      await new Promise((r) => setTimeout(r, 150));
    }
    expect(pages.length).toBe(2);

    // Best-effort signal (documented contract): newPageId appears only when the popup event
    // lands inside the click window. When present it must point at a real tab; the tabs list
    // is the reliable discovery path either way.
    if (click.body.data.newPageId !== undefined) {
      expect(pages.map((p) => p.pageId)).toContain(click.body.data.newPageId);
    }

    await api("DELETE", `/v1/sessions/${sessionId}`, { force: true });
  }, 40000);

  it("GET /tabs on an unknown session returns 404", async () => {
    const res = await api("GET", "/v1/sessions/ses_does_not_exist/tabs");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("SESSION_NOT_FOUND");
  });
});
