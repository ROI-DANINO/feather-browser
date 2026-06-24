// tests/integration/security/schema-abuse.integration.test.ts
//
// Input-fuzz of the agent-facing routes. The contract under test is narrow and absolute: NO hostile
// request body may produce a 5xx, crash the server, or pollute Object.prototype. A malformed body must
// always come back as a clean `{ ok:false, error }` envelope with a 4xx status. Zod parse runs before
// any session work, so a placeholder sessionId is fine — the schema rejects first.
//
// See ./README.md for the "new agent-facing route ⇒ add it here" rule.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { FeatherPaths, ensureDirs } from "../../../src/fs-layout";
import { ProfileLock } from "../../../src/profiles/lock";
import { WorkspaceMetadata } from "../../../src/profiles/workspace";
import { SessionManager } from "../../../src/sessions/manager";
import { startHttpServer } from "../../../src/transport/http";

let baseUrl: string;
let token: string;
let manager: SessionManager;
let tmpDir: string;

async function rawPost(routePath: string, rawBody: string) {
  const res = await fetch(`${baseUrl}${routePath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Feather-Token": token },
    body: rawBody,
  });
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    /* a non-JSON body is itself a finding — leave body null and let the assertion fail loudly */
  }
  return { status: res.status, body };
}

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-int-abuse-"));
  await ensureDirs(tmpDir);
  const paths = new FeatherPaths(tmpDir);
  manager = new SessionManager(paths, new ProfileLock(paths), new WorkspaceMetadata(paths));
  const { port, token: t } = await startHttpServer("127.0.0.1", 0, manager, paths);
  token = t;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await Promise.allSettled(manager.list().map((s) => manager.close(s.sessionId, { force: true })));
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

// Agent-facing routes whose body is schema-validated. A bogus sessionId is intentional — the schema
// parse fires before the handler's session lookup, so these exercise validation, not session state.
const ROUTES = [
  "/v1/sessions",
  "/v1/sessions/ses_fuzz/navigate",
  "/v1/sessions/ses_fuzz/click",
  "/v1/sessions/ses_fuzz/type",
  "/v1/sessions/ses_fuzz/extract",
  "/v1/sessions/ses_fuzz/select-option",
  "/v1/sessions/ses_fuzz/grants",
];

const HOSTILE_BODIES: { label: string; raw: string }[] = [
  { label: "null", raw: "null" },
  { label: "bare string", raw: '"pwned"' },
  { label: "number", raw: "42" },
  { label: "array", raw: "[1,2,3]" },
  { label: "empty object", raw: "{}" },
  { label: "wrong-typed fields", raw: JSON.stringify({ url: 123, profile: "nope", target: 5, text: 9, value: false }) },
  { label: "deeply nested", raw: JSON.stringify({ a: { b: { c: { d: { e: { f: 1 } } } } } }) },
  { label: "prototype pollution", raw: '{"__proto__":{"polluted":"yes"},"constructor":{"prototype":{"polluted2":"yes"}}}' },
];

describe("agent-facing schema abuse surface", () => {
  for (const route of ROUTES) {
    for (const { label, raw } of HOSTILE_BODIES) {
      it(`rejects [${label}] on POST ${route} with a clean 4xx envelope (no 5xx)`, async () => {
        const { status, body } = await rawPost(route, raw);
        expect(status, `unexpected status for ${label} on ${route}`).toBeGreaterThanOrEqual(400);
        expect(status, `server error (5xx) for ${label} on ${route}`).toBeLessThan(500);
        expect(body?.ok).toBe(false);
        expect(body?.error?.code).toBeTruthy();
      });
    }
  }

  // Cheap regression guard: Fastify's secure-json-parse + JSON.parse already make __proto__ an own
  // property, so this is parser-guaranteed today — it exists to catch a future switch to an unsafe
  // deep-merge, not as proof of an active in-app defense.
  it("never pollutes Object.prototype via a hostile body", () => {
    expect(({} as any).polluted).toBeUndefined();
    expect(({} as any).polluted2).toBeUndefined();
    expect((Object.prototype as any).polluted).toBeUndefined();
  });

  it("keeps the server alive after the abuse barrage", async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });
});
