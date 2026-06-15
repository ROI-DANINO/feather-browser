import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import http from "node:http";
import { FeatherPaths, ensureDirs } from "../../src/fs-layout";
import { startHttpServer } from "../../src/transport/http";
import { IdentityStore } from "../../src/identity/store";
import { IdentityManager } from "../../src/identity/manager";
import { FeatherLogger } from "../../src/logs/logger";
import type { SessionManager } from "../../src/sessions/manager";
import type { FastifyInstance } from "fastify";

// Identity Model (Phase 5a) over real HTTP. CRUD + warm + mark-warm are FS-only; the warm route
// uses a mock SessionManager so no real Chromium spawns. (identityId→workspace resolution at launch
// is unit-covered in tests/unit/sessions/manager.test.ts.)

let tmpDir: string;
let server: FastifyInstance;
let token: string;
let port: number;

function request(opts: { method?: string; path: string; headers?: Record<string, string>; body?: string }): Promise<{ status: number; json: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: "127.0.0.1", port, path: opts.path, method: opts.method ?? "GET", headers: opts.headers ?? {} }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => { let json: any; try { json = JSON.parse(data); } catch { json = undefined; } resolve({ status: res.statusCode ?? 0, json }); });
    });
    req.on("error", reject);
    if (opts.body !== undefined) req.write(opts.body);
    req.end();
  });
}

function authed() {
  return { "x-feather-token": token, "content-type": "application/json" };
}

function mockSessions(): SessionManager {
  return {
    launch: async () => ({ sessionId: "ses_fake" } as any),
    list: () => [],
    get: () => { throw Object.assign(new Error("nope"), { code: "SESSION_NOT_FOUND" }); },
    close: async () => {},
  } as unknown as SessionManager;
}

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-identity-it-"));
  await ensureDirs(tmpDir);
  const paths = new FeatherPaths(tmpDir);
  const manager = mockSessions();
  const identityManager = new IdentityManager(new IdentityStore(paths.identitiesDir()), paths, manager, new FeatherLogger(paths));
  const started = await startHttpServer("127.0.0.1", 0, manager, paths, identityManager);
  server = started.server; token = started.token; port = started.port;
});

afterAll(async () => {
  await server.close();
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe("identity API (integration)", () => {
  it("creates, reads, lists, marks warm, and deletes an identity", async () => {
    const create = await request({ method: "POST", path: "/v1/identities", headers: authed(), body: JSON.stringify({ id: "roi-linkedin", name: "Roi – LinkedIn", vaultRef: "keyring://x" }) });
    expect(create.status).toBe(200);
    expect(create.json.data.id).toBe("roi-linkedin");
    expect(create.json.data.warmStatus).toBe("cold");
    expect(create.json.data.vaultRef).toBeUndefined();    // S5 redaction over the wire
    expect(create.json.data.hasVaultRef).toBe(true);

    const get = await request({ method: "GET", path: "/v1/identities/roi-linkedin", headers: authed() });
    expect(get.status).toBe(200);
    expect(get.json.data.defaultWorkspaceId).toBe("roi-linkedin");

    const list = await request({ method: "GET", path: "/v1/identities", headers: authed() });
    expect(list.json.data.map((r: { id: string }) => r.id)).toContain("roi-linkedin");

    const markWarm = await request({ method: "POST", path: "/v1/identities/roi-linkedin/mark-warm", headers: authed() });
    expect(markWarm.status).toBe(200);
    expect(markWarm.json.data.warmStatus).toBe("warm");

    const del = await request({ method: "DELETE", path: "/v1/identities/roi-linkedin", headers: authed() });
    expect(del.status).toBe(200);
    expect(del.json.data).toEqual({ deleted: true });

    const after = await request({ method: "GET", path: "/v1/identities/roi-linkedin", headers: authed() });
    expect(after.status).toBe(404);
  });

  it("rejects a duplicate id with 409", async () => {
    await request({ method: "POST", path: "/v1/identities", headers: authed(), body: JSON.stringify({ id: "dupe", name: "Dupe" }) });
    const second = await request({ method: "POST", path: "/v1/identities", headers: authed(), body: JSON.stringify({ id: "dupe", name: "Dupe" }) });
    expect(second.status).toBe(409);
    expect(second.json.error.code).toBe("IDENTITY_ALREADY_EXISTS");
  });

  it("warm on an unknown identity is 404; warm on a known one returns a sessionId", async () => {
    const miss = await request({ method: "POST", path: "/v1/identities/nobody/warm", headers: authed() });
    expect(miss.status).toBe(404);
    expect(miss.json.error.code).toBe("IDENTITY_NOT_FOUND");

    await request({ method: "POST", path: "/v1/identities", headers: authed(), body: JSON.stringify({ id: "warmable", name: "Warmable" }) });
    const warm = await request({ method: "POST", path: "/v1/identities/warmable/warm", headers: authed() });
    expect(warm.status).toBe(200);
    expect(warm.json.data).toEqual({ sessionId: "ses_fake" });
  });

  it("requires the API token", async () => {
    const noAuth = await request({ method: "GET", path: "/v1/identities" });
    expect(noAuth.status).toBe(401);
  });
});
