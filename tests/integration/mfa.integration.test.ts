import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import http from "node:http";
import { FeatherPaths, ensureDirs } from "../../src/fs-layout";
import { startHttpServer } from "../../src/transport/http";
import type { SessionManager } from "../../src/sessions/manager";
import type { FastifyInstance } from "fastify";

// 5b MFA over HTTP: the push happy path (create → serve page → submit → resolved), input validation,
// and the security refusals (wrong humanToken, missing humanToken on the local page). No Chromium —
// a mock manager supplies a stub page so the manager's origin-capture has a URL to read.

function makeMockManager(): SessionManager {
  const page = { url: () => "https://accounts.example/login" };
  const record = {
    sessionId: "ses_mfa",
    toRecord: () => ({ sessionId: "ses_mfa", state: "running" }),
    getPage: () => ({ pageId: "page_1", page }),
  };
  return {
    list: () => [record as any],
    get: (id: string) => {
      if (id !== "ses_mfa") throw Object.assign(new Error("nope"), { code: "SESSION_NOT_FOUND" });
      return record as any;
    },
    close: async () => {},
  } as unknown as SessionManager;
}

function request(opts: {
  method?: string;
  path: string;
  headers?: Record<string, string>;
  body?: string;
}): Promise<{ status: number; json: any; text: string; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port, path: opts.path, method: opts.method ?? "GET", headers: opts.headers ?? {} },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          let json: any;
          try { json = JSON.parse(data); } catch { json = undefined; }
          resolve({ status: res.statusCode ?? 0, json, text: data, headers: res.headers });
        });
      },
    );
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
function form() {
  return { "content-type": "application/x-www-form-urlencoded" };
}

/** The human's real channel: pull the humanToken from the URL the ConsoleNotifier printed. */
function lastHumanUrl(): string {
  const line = [...consoleLines].reverse().find((l) => l.includes("/v1/mfa/"));
  if (!line) throw new Error("no mfa URL printed");
  return line.match(/(http:\/\/[^\s]+\/v1\/mfa\/[^\s]+)/)![1];
}

async function createPush(): Promise<{ challengeId: string; localUrl: string; agentText: string }> {
  const res = await request({
    method: "POST",
    path: "/v1/sessions/ses_mfa/mfa/challenge",
    headers: authed(),
    body: JSON.stringify({ type: "push", prompt: "Google sign-in" }),
  });
  expect(res.status).toBe(200);
  return { challengeId: res.json.data.challengeId, localUrl: res.json.data.localUrl, agentText: res.text };
}

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-mfa-test-"));
  await ensureDirs(tmpDir);
  const paths = new FeatherPaths(tmpDir);
  const started = await startHttpServer("127.0.0.1", 0, makeMockManager(), paths);
  server = started.server;
  token = started.token;
  port = started.port;
  console.log = (...args: unknown[]) => { consoleLines.push(args.join(" ")); };
});

afterAll(async () => {
  console.log = origLog;
  await server.close();
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

beforeEach(() => { consoleLines = []; });

describe("MFA over HTTP — push happy path", () => {
  it("create returns a token-less agent localUrl (the humanToken never reaches the agent)", async () => {
    const { challengeId, localUrl, agentText } = await createPush();
    expect(localUrl).toContain(`/v1/mfa/${challengeId}`);
    expect(localUrl).not.toContain("?t=");
    expect(agentText).not.toContain("?t=");
  });

  it("serves the human page only with a valid humanToken, then resolves on submit", async () => {
    const { challengeId } = await createPush();
    const humanUrl = lastHumanUrl();
    const humanToken = new URL(humanUrl).searchParams.get("t")!;

    // wrong/missing token → 404, no page
    const denied = await request({ path: `/v1/mfa/${challengeId}` });
    expect(denied.status).toBe(404);

    // valid token → the page, with a strict CSP and the hidden fields
    const page = await request({ path: `/v1/mfa/${challengeId}?t=${humanToken}` });
    expect(page.status).toBe(200);
    expect(page.headers["content-security-policy"]).toContain("default-src 'none'");
    expect(page.text).toContain("Approve");
    const csrfNonce = page.text.match(/name="csrfNonce" value="([^"]+)"/)![1];

    // status pending before submit
    const before = await request({ path: `/v1/sessions/ses_mfa/mfa/${challengeId}`, headers: authed() });
    expect(before.json.data.status).toBe("pending");

    // the browser form submit (urlencoded) resolves it
    const submit = await request({
      method: "POST",
      path: `/v1/mfa/${challengeId}/submit`,
      headers: form(),
      body: new URLSearchParams({ humanToken, csrfNonce }).toString(),
    });
    expect(submit.status).toBe(200);
    expect(submit.json.ok).toBe(true);

    const after = await request({ path: `/v1/sessions/ses_mfa/mfa/${challengeId}`, headers: authed() });
    expect(after.json.data.status).toBe("resolved");
  });

  it("rejects a submit with the wrong humanToken (MFA_FORBIDDEN)", async () => {
    const { challengeId } = await createPush();
    const bad = await request({
      method: "POST",
      path: `/v1/mfa/${challengeId}/submit`,
      headers: form(),
      body: new URLSearchParams({ humanToken: "WRONG" }).toString(),
    });
    expect(bad.status).toBe(403);
    expect(bad.json.error.code).toBe("MFA_FORBIDDEN");
  });
});

describe("MFA over HTTP — validation", () => {
  it("rejects a totp challenge with no target", async () => {
    const res = await request({
      method: "POST",
      path: "/v1/sessions/ses_mfa/mfa/challenge",
      headers: authed(),
      body: JSON.stringify({ type: "totp", prompt: "x" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns MFA_NOT_FOUND for an unknown challenge id", async () => {
    const res = await request({ path: "/v1/sessions/ses_mfa/mfa/mfa_nope", headers: authed() });
    expect(res.status).toBe(404);
    expect(res.json.error.code).toBe("MFA_NOT_FOUND");
  });
});
