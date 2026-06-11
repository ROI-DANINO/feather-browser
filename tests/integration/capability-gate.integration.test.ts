import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import http from "node:http";
import { FeatherPaths, ensureDirs } from "../../src/fs-layout";
import { startHttpServer } from "../../src/transport/http";
import type { SessionManager } from "../../src/sessions/manager";
import type { FastifyInstance } from "fastify";

// Gate A / A1 slice 3: the full capability loop over HTTP — request → human approve → consume at the
// cookie-export door, plus the refusals (disabled, no-grant, deny, revoke-on-close). The agent never
// receives the approval token; the test reads it from the console line (the human's real channel),
// exactly as a person would.

const FAKE_COOKIES = [
  { name: "sessionid", value: "secret-login-token", domain: ".example.com", path: "/", expires: -1, httpOnly: true, secure: true, sameSite: "Lax" as const },
];

function makeMockManager(): SessionManager {
  const context = { cookies: async () => FAKE_COOKIES };
  const record = { sessionId: "ses_cap", toRecord: () => ({ sessionId: "ses_cap", state: "running" }), getContext: () => context };
  return {
    list: () => [record as any],
    get: (id: string) => { if (id !== "ses_cap") throw Object.assign(new Error("nope"), { code: "SESSION_NOT_FOUND" }); return record as any; },
    close: async () => {},
  } as unknown as SessionManager;
}

function request(opts: { method?: string; path: string; headers?: Record<string, string>; body?: string }): Promise<{ status: number; json: any; text: string; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: "127.0.0.1", port, path: opts.path, method: opts.method ?? "GET", headers: opts.headers ?? {} }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => { let json: any; try { json = JSON.parse(data); } catch { json = undefined; } resolve({ status: res.statusCode ?? 0, json, text: data, headers: res.headers }); });
    });
    req.on("error", reject);
    if (opts.body !== undefined) req.write(opts.body);
    req.end();
  });
}

let tmpDir: string;
let server: FastifyInstance;
let token: string;
let port: number;
let consoleLines: string[];
const origLog = console.log;

function authed(extra?: Record<string, string>) {
  return { "x-feather-token": token, "content-type": "application/json", ...(extra ?? {}) };
}

async function requestGrant(): Promise<void> {
  await request({ method: "POST", path: "/v1/sessions/ses_cap/grants", headers: authed(), body: JSON.stringify({ capability: "cookie-export" }) });
}

function lastApprovalToken(): string {
  const line = [...consoleLines].reverse().find((l) => l.includes("/v1/approvals/"));
  if (!line) throw new Error("no approval URL printed");
  return line.match(/\/v1\/approvals\/([^\s]+)/)![1];
}

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-cap-test-"));
  await ensureDirs(tmpDir);
  process.env.FEATHER_DANGEROUS_CAPABILITIES = "cookie-export";
  const paths = new FeatherPaths(tmpDir);
  const started = await startHttpServer("127.0.0.1", 0, makeMockManager(), paths);
  server = started.server; token = started.token; port = started.port;
  console.log = (...args: unknown[]) => { consoleLines.push(args.join(" ")); };
});

afterAll(async () => {
  console.log = origLog;
  delete process.env.FEATHER_DANGEROUS_CAPABILITIES;
  await server.close();
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

beforeEach(() => { consoleLines = []; });

describe("capability gate — cookie-export door", () => {
  it("a grant request never returns the approval token or URL to the agent", async () => {
    const res = await request({ method: "POST", path: "/v1/sessions/ses_cap/grants", headers: authed(), body: JSON.stringify({ capability: "cookie-export" }) });
    expect(res.status).toBe(200);
    expect(res.json.data.grant.status).toBe("requested");
    expect(res.text).not.toContain("/v1/approvals/");
    expect(res.text.toLowerCase()).not.toContain("humantoken");
  });

  it("export is refused with GRANT_REQUIRED when no grant has been approved", async () => {
    const res = await request({ method: "POST", path: "/v1/sessions/ses_cap/cookies/export", headers: authed(), body: "{}" });
    expect(res.status).toBe(403);
    expect(res.json.error.code).toBe("GRANT_REQUIRED");
  });

  it("full loop: request → approve on the page → export returns the cookies exactly once", async () => {
    await requestGrant();
    const humanToken = lastApprovalToken();

    const page = await request({ path: `/v1/approvals/${humanToken}` });
    expect(page.status).toBe(200);
    expect(page.headers["content-security-policy"]).toContain("default-src 'none'");
    const csrf = page.text.match(/csrf=([^&"]+)/)![1];

    const approve = await request({ method: "POST", path: `/v1/approvals/${humanToken}?csrf=${csrf}&action=approve` });
    expect(approve.text).toContain("Approved");

    const exp = await request({ method: "POST", path: "/v1/sessions/ses_cap/cookies/export", headers: authed(), body: "{}" });
    expect(exp.status).toBe(200);
    expect(exp.json.data.cookies[0].value).toBe("secret-login-token");

    const again = await request({ method: "POST", path: "/v1/sessions/ses_cap/cookies/export", headers: authed(), body: "{}" });
    expect(again.status).toBe(403);
  });

  it("deny on the page leaves the door shut", async () => {
    await requestGrant();
    const humanToken = lastApprovalToken();
    const page = await request({ path: `/v1/approvals/${humanToken}` });
    const csrf = page.text.match(/csrf=([^&"]+)/)![1];

    const deny = await request({ method: "POST", path: `/v1/approvals/${humanToken}?csrf=${csrf}&action=deny` });
    expect(deny.text).toContain("Denied");

    const exp = await request({ method: "POST", path: "/v1/sessions/ses_cap/cookies/export", headers: authed(), body: "{}" });
    expect(exp.status).toBe(403);
  });

  it("a wrong CSRF nonce cannot approve", async () => {
    await requestGrant();
    const humanToken = lastApprovalToken();
    const bad = await request({ method: "POST", path: `/v1/approvals/${humanToken}?csrf=forged&action=approve` });
    expect(bad.text).not.toContain("Approved");

    const exp = await request({ method: "POST", path: "/v1/sessions/ses_cap/cookies/export", headers: authed(), body: "{}" });
    expect(exp.status).toBe(403);
  });

  it("closing the session revokes an approved-but-unused grant before it can be spent", async () => {
    await requestGrant();
    const humanToken = lastApprovalToken();
    const page = await request({ path: `/v1/approvals/${humanToken}` });
    const csrf = page.text.match(/csrf=([^&"]+)/)![1];
    await request({ method: "POST", path: `/v1/approvals/${humanToken}?csrf=${csrf}&action=approve` });

    await request({ method: "DELETE", path: "/v1/sessions/ses_cap", headers: authed() });

    const exp = await request({ method: "POST", path: "/v1/sessions/ses_cap/cookies/export", headers: authed(), body: "{}" });
    expect(exp.status).toBe(403);
    expect(exp.json.error.code).toBe("GRANT_REQUIRED");
  });

  it("writes a durable audit trail of the lifecycle", async () => {
    const auditFile = path.join(tmpDir, "logs", "audit", "grants.jsonl");
    const audit = fs.readFileSync(auditFile, "utf8");
    expect(audit).toContain("grant.requested");
    expect(audit).toContain("grant.granted");
    expect(audit).toContain("grant.used");
    expect(audit).not.toMatch(/secret-login-token/);
  });
});
