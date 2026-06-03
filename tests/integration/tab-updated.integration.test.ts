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
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-int-tabupd-"));
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

describe("TAB_UPDATED over SSE on real navigation", () => {
  it("emits tab.updated with a settled title after navigating an opened tab", async () => {
    // Launch a real session.
    const launch = await api("POST", "/v1/sessions", {
      workspaceId: "tab-updated-ws",
      profile: { kind: "persistent" },
      browserMode: "chromium-headless-shell",
    });
    expect(launch.status).toBe(200);
    const sessionId = launch.body.data.sessionId as string;

    // Open a new tab so it flows through context.on("page") and gets the
    // framenavigated handler attached.
    const tab = await api("POST", `/v1/sessions/${sessionId}/tabs`, {});
    expect(tab.status).toBe(200);
    const pageId = tab.body.data.pageId as string;

    // Subscribe to the SSE stream BEFORE navigating.
    const ac = new AbortController();
    const timeoutId = setTimeout(() => ac.abort(), 15000);
    try {
      const res = await fetch(`${baseUrl}/v1/events`, {
        headers: { "X-Feather-Token": token },
        signal: ac.signal,
      });
      expect(res.status).toBe(200);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      // Let the generator subscribe to the bus.
      await new Promise((r) => setTimeout(r, 100));

      // Navigate the opened tab — triggers framenavigated → TAB_UPDATED.
      await api("POST", `/v1/sessions/${sessionId}/navigate`, {
        pageId,
        url: "https://example.com",
        waitUntil: "domcontentloaded",
        timeoutMs: 30000,
      });

      // Read the stream until the settled example.com title arrives or we
      // time out. Break on the title (not on the first "tab.updated"): a new
      // tab's initial about:blank may emit its own tab.updated first.
      let buffer = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          if (buffer.includes("Example Domain")) break;
        }
      } finally {
        reader.cancel();
      }

      expect(buffer).toContain("event: tab.updated");
      // The settled title for example.com is "Example Domain".
      expect(buffer).toContain("Example Domain");
      expect(buffer).toContain(`"pageId":"${pageId}"`);
    } finally {
      clearTimeout(timeoutId);
      ac.abort();
    }
  }, 40000);
});
