import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import http from "node:http";
import { FeatherPaths, ensureDirs } from "../../src/fs-layout";
import { startHttpServer } from "../../src/transport/http";
import type { SessionManager } from "../../src/sessions/manager";
import type { FastifyInstance } from "fastify";

// A0 transport hardening: the global Origin/Referer/Host guard must reject DNS-rebind (foreign Host)
// and cross-origin CSRF (foreign Origin on unsafe methods) while leaving every legitimate request —
// the agent's tokenful calls, /health, the same-origin resume POST — untouched.
//
// NOTE: requests go through raw node:http, not fetch — undici's fetch silently rewrites the Host
// header from the URL, which would defeat the whole point of the rebind test.

function makeMockManager(): SessionManager {
  const record = {
    sessionId: "ses_a0",
    toRecord: () => ({ sessionId: "ses_a0", state: "running" }),
    getPageInfoList: async () => [],
  };
  return {
    list: () => [record as any],
    get: () => record as any,
    close: async () => {},
  } as unknown as SessionManager;
}

let tmpDir: string;
let server: FastifyInstance;
let token: string;
let port: number;

function request(opts: {
  method?: string;
  path?: string;
  headers?: Record<string, string>;
  body?: string;
}): Promise<{ status: number; json: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path: opts.path ?? "/health",
        method: opts.method ?? "GET",
        headers: opts.headers ?? {},
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          let json: any;
          try { json = JSON.parse(data); } catch { json = undefined; }
          resolve({ status: res.statusCode ?? 0, json });
        });
      },
    );
    req.on("error", reject);
    if (opts.body !== undefined) req.write(opts.body);
    req.end();
  });
}

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-a0-test-"));
  await ensureDirs(tmpDir);
  const paths = new FeatherPaths(tmpDir);
  const result = await startHttpServer("127.0.0.1", 0, makeMockManager(), paths);
  server = result.server;
  port = result.port;
  token = result.token;
});

afterAll(async () => {
  await server.close();
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe("A0 — legitimate requests stay green", () => {
  it("GET /health (loopback Host, no Origin) → 200", async () => {
    const res = await request({ path: "/health" });
    expect(res.status).toBe(200);
  });

  it("authenticated GET /v1/sessions (loopback Host, token, no Origin) → 200", async () => {
    const res = await request({ path: "/v1/sessions", headers: { "X-Feather-Token": token } });
    expect(res.status).toBe(200);
    expect(res.json.ok).toBe(true);
  });

  it("same-origin POST is allowed by the Origin check (not a 403)", async () => {
    const res = await request({
      method: "POST",
      path: "/v1/sessions",
      headers: {
        "Content-Type": "application/json",
        "X-Feather-Token": token,
        Origin: `http://127.0.0.1:${port}`,
      },
      body: JSON.stringify({ profile: { kind: "disposable" } }),
    });
    // Whatever the launch outcome, the guard must NOT have rejected it.
    expect(res.status).not.toBe(403);
  });
});

describe("A0 — DNS-rebind (foreign Host) is rejected", () => {
  it("spoofed Host with a valid token → 403 FORBIDDEN_HOST", async () => {
    const res = await request({
      path: "/v1/sessions",
      headers: { "X-Feather-Token": token, Host: "evil.com" },
    });
    expect(res.status).toBe(403);
    expect(res.json.error.code).toBe("FORBIDDEN_HOST");
  });
});

describe("A0 — cross-origin CSRF (foreign Origin) is rejected", () => {
  it("foreign-Origin POST with a valid token → 403 FORBIDDEN_ORIGIN (fires before token auth)", async () => {
    const res = await request({
      method: "POST",
      path: "/v1/sessions",
      headers: {
        "Content-Type": "application/json",
        "X-Feather-Token": token,
        Origin: "https://evil.com",
      },
      body: JSON.stringify({ profile: { kind: "disposable" } }),
    });
    expect(res.status).toBe(403);
    expect(res.json.error.code).toBe("FORBIDDEN_ORIGIN");
  });

  it("foreign-Origin GET is NOT rejected (safe method — human opening a link)", async () => {
    const res = await request({ path: "/health", headers: { Origin: "https://evil.com" } });
    expect(res.status).toBe(200);
  });
});
