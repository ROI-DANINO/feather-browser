// tests/integration/api-flow.integration.test.ts
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
let sessionId: string;

async function api(method: string, path: string, body?: object) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json", "X-Feather-Token": token },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-int-api-"));
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

describe("Full API flow: launch → navigate → snapshot → extract → screenshot → debug-bundle → close", () => {
  it("Test 1: POST /v1/sessions returns 200 with sessionId and state 'running'", async () => {
    const { status, body } = await api("POST", "/v1/sessions", {
      workspaceId: "api-flow-ws",
      profile: { kind: "persistent" },
      browserMode: "chromium-headless-shell",
      viewport: { width: 1280, height: 800 },
    });

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.sessionId).toBeTruthy();
    expect(body.data.state).toBe("running");
    sessionId = body.data.sessionId;
  });

  it("Test 2: GET /v1/sessions/:id returns session with pages array and state 'running'", async () => {
    const { status, body } = await api("GET", `/v1/sessions/${sessionId}`);

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.sessionId).toBe(sessionId);
    expect(body.data.state).toBe("running");
    expect(Array.isArray(body.data.pages)).toBe(true);
    expect(body.data.pages.length).toBeGreaterThanOrEqual(1);
  });

  it("Test 3: POST /v1/sessions/:id/navigate to https://example.com returns url and status", async () => {
    const { status, body } = await api("POST", `/v1/sessions/${sessionId}/navigate`, {
      url: "https://example.com",
      waitUntil: "domcontentloaded",
      timeoutMs: 30000,
    });

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.url).toContain("example.com");
    expect(typeof body.data.status).toBe("number");
  });

  it("Test 4: POST /v1/sessions/:id/snapshot returns text, links, title", async () => {
    const { status, body } = await api("POST", `/v1/sessions/${sessionId}/snapshot`, {});

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(typeof body.data.text).toBe("string");
    expect(body.data.text.length).toBeGreaterThan(0);
    expect(Array.isArray(body.data.links)).toBe(true);
    expect(typeof body.data.title).toBe("string");
    expect(body.data.title.length).toBeGreaterThan(0);
  });

  it("Test 5: POST /v1/sessions/:id/extract with h1 selector returns heading field", async () => {
    const { status, body } = await api("POST", `/v1/sessions/${sessionId}/extract`, {
      recipe: {
        fields: {
          heading: { selector: "h1", type: "text" },
        },
      },
    });

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(typeof body.data.heading).toBe("string");
    expect(body.data.heading.length).toBeGreaterThan(0);
  });

  it("Test 6: POST /v1/sessions/:id/screenshot returns artifactId and path (file exists on disk)", async () => {
    const { status, body } = await api("POST", `/v1/sessions/${sessionId}/screenshot`, {
      fullPage: false,
    });

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(typeof body.data.artifactId).toBe("string");
    expect(body.data.artifactId.length).toBeGreaterThan(0);
    expect(typeof body.data.path).toBe("string");

    // The path is relative to featherDir; check from tmpDir
    const absPath = path.isAbsolute(body.data.path)
      ? body.data.path
      : path.join(tmpDir, body.data.path.replace(/^\.feather\//, ""));
    const exists = await fs.promises
      .access(absPath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });

  it("Test 7: POST /v1/sessions/:id/debug-bundle returns manifest path (file exists on disk)", async () => {
    const { status, body } = await api("POST", `/v1/sessions/${sessionId}/debug-bundle`, {});

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(typeof body.data.manifest).toBe("string");

    const absManifest = path.isAbsolute(body.data.manifest)
      ? body.data.manifest
      : path.join(tmpDir, body.data.manifest.replace(/^\.feather\//, ""));
    const exists = await fs.promises
      .access(absManifest)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });

  it("Test 8: DELETE /v1/sessions/:id returns { sessionId, state: 'closed' }", async () => {
    const { status, body } = await api("DELETE", `/v1/sessions/${sessionId}`, { force: false });

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.sessionId).toBe(sessionId);
    expect(body.data.state).toBe("closed");
  });

  it("Test 9: GET /v1/sessions after close returns empty array", async () => {
    const { status, body } = await api("GET", "/v1/sessions");

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(0);
  });
});
