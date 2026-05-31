import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { FeatherPaths, ensureDirs } from "../../src/fs-layout";
import { startHttpServer } from "../../src/transport/http";
import type { SessionManager } from "../../src/sessions/manager";
import type { FastifyInstance } from "fastify";

const MOCK_SESSION = {
  sessionId: "ses_test_01",
  workspaceId: "default",
  profileKind: "persistent" as const,
  browserMode: "chromium-new-headless" as const,
  state: "running" as const,
  profilePath: ".feather/profiles/default/profile",
  debugDir: ".feather/debug/ses_test_01",
  proxy: null,
  startedAt: "2026-05-31T00:00:00.000Z",
  pages: [],
  profileLocked: true,
};

function makeMockManager(): SessionManager {
  return {
    launch: async () => {
      const session = {
        sessionId: MOCK_SESSION.sessionId,
        toRecord: () => ({ ...MOCK_SESSION }),
        getPageInfoList: async () => [],
      };
      return session as any;
    },
    list: () => [{ sessionId: MOCK_SESSION.sessionId, toRecord: () => ({ ...MOCK_SESSION }), getPageInfoList: async () => [] } as any],
    get: (sessionId: string) => {
      if (sessionId === MOCK_SESSION.sessionId) {
        return { sessionId: MOCK_SESSION.sessionId, toRecord: () => ({ ...MOCK_SESSION }), getPageInfoList: async () => [] } as any;
      }
      const err = new Error(`Session not found: ${sessionId}`);
      (err as any).code = "SESSION_NOT_FOUND";
      throw err;
    },
    close: async () => {},
  } as unknown as SessionManager;
}

let tmpDir: string;
let paths: FeatherPaths;
let serverInstance: FastifyInstance;
let baseUrl: string;
let testToken: string;

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-transport-test-"));
  await ensureDirs(tmpDir);
  paths = new FeatherPaths(tmpDir);
  const manager = makeMockManager();
  const result = await startHttpServer("127.0.0.1", 0, manager, paths);
  serverInstance = result.server;
  baseUrl = `http://127.0.0.1:${result.port}`;
  testToken = result.token;
});

afterAll(async () => {
  await serverInstance.close();
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe("GET /health", () => {
  it("returns 200 with ok: true and no token required", async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("ok");
  });
});

describe("Token authentication", () => {
  it("POST /v1/sessions without token returns 401", async () => {
    const res = await fetch(`${baseUrl}/v1/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: { kind: "persistent" }, workspaceId: "default" }),
    });
    expect(res.status).toBe(401);
    const body = await res.json() as any;
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("POST /v1/sessions with wrong token returns 401", async () => {
    const res = await fetch(`${baseUrl}/v1/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Feather-Token": "wrong-token-value" },
      body: JSON.stringify({ profile: { kind: "persistent" }, workspaceId: "default" }),
    });
    expect(res.status).toBe(401);
    const body = await res.json() as any;
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});

describe("Authenticated routes", () => {
  it("GET /v1/sessions with correct token returns 200 with ok: true", async () => {
    const res = await fetch(`${baseUrl}/v1/sessions`, {
      headers: { "X-Feather-Token": testToken },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data.sessions)).toBe(true);
  });

  it("POST /v1/sessions with valid body and correct token returns session", async () => {
    const res = await fetch(`${baseUrl}/v1/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Feather-Token": testToken },
      body: JSON.stringify({ workspaceId: "default", profile: { kind: "persistent" }, browserMode: "chromium-new-headless" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.data.sessionId).toBe(MOCK_SESSION.sessionId);
    expect(typeof body.requestId).toBe("string");
    expect(body.requestId.startsWith("req_")).toBe(true);
  });

  it("GET /v1/sessions/:sessionId with unknown sessionId returns 404", async () => {
    const res = await fetch(`${baseUrl}/v1/sessions/ses_does_not_exist`, {
      headers: { "X-Feather-Token": testToken },
    });
    expect(res.status).toBe(404);
    const body = await res.json() as any;
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("SESSION_NOT_FOUND");
  });

  it("POST /v1/sessions/:sessionId/navigate with invalid body returns 400", async () => {
    const res = await fetch(`${baseUrl}/v1/sessions/${MOCK_SESSION.sessionId}/navigate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Feather-Token": testToken },
      body: JSON.stringify({ pageId: "page_01" }), // missing required url
    });
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
