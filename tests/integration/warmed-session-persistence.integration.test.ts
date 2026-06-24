// tests/integration/warmed-session-persistence.integration.test.ts
//
// The Cookie-Mine contract: a persistent ("warmed") profile must RETAIN cookies + localStorage across
// separate sessions, and that state must NOT leak into a different profile. These are the two
// properties the whole product rests on, and they had no explicit test before Phase 1b. Self-hosted
// local origin → no network dependency, deterministic.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as http from "http";
import type { Page } from "playwright";
import { FeatherPaths, ensureDirs } from "../../src/fs-layout";
import { ProfileLock } from "../../src/profiles/lock";
import { WorkspaceMetadata } from "../../src/profiles/workspace";
import { SessionManager } from "../../src/sessions/manager";

let manager: SessionManager;
let paths: FeatherPaths;
let tmpDir: string;
let server: http.Server;
let origin: string;

const permOf = (p: string): number => fs.statSync(p).mode & 0o777;

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-int-warm-"));
  await ensureDirs(tmpDir);
  paths = new FeatherPaths(tmpDir);
  manager = new SessionManager(paths, new ProfileLock(paths), new WorkspaceMetadata(paths));

  server = http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<!doctype html><html><body>warm</body></html>");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const addr = server.address();
  if (!addr || typeof addr === "string") throw new Error("local origin server has no address");
  origin = `http://127.0.0.1:${addr.port}/`;
});

afterAll(async () => {
  await Promise.allSettled(manager.list().map((s) => manager.close(s.sessionId, { force: true })));
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

/** Launch a persistent session on `workspaceId`, navigate to the local origin, run `fn`, then close. */
async function onWarmedProfile<T>(workspaceId: string, fn: (page: Page) => Promise<T>): Promise<T> {
  const session = await manager.launch({
    workspaceId,
    profile: { kind: "persistent" },
    browserMode: "chromium-headless-shell",
  } as any);
  try {
    const page = await (async () => {
      try {
        return session.getPage().page;
      } catch {
        return (await session.openTab()).page;
      }
    })();
    await page.goto(origin);
    return await fn(page);
  } finally {
    await manager.close(session.sessionId, { force: false });
  }
}

describe("Warmed-session persistence and isolation", () => {
  const WARM = "warm-persist-ws";
  const OTHER = "warm-isolate-ws";
  const farFuture = 4102444800; // ~year 2100, so the cookie is persistent, not a session cookie

  it("retains localStorage + cookies across two sessions on the SAME persistent profile (reuse)", async () => {
    await onWarmedProfile(WARM, async (page) => {
      await page.evaluate(() => localStorage.setItem("feather_warm", "persisted-value"));
      await page.context().addCookies([
        { name: "feather_session", value: "warm-cookie", url: origin, expires: farFuture },
      ]);
    });

    const seen = await onWarmedProfile(WARM, async (page) => {
      const ls = await page.evaluate(() => localStorage.getItem("feather_warm"));
      const cookies = await page.context().cookies();
      return { ls, cookie: cookies.find((c) => c.name === "feather_session")?.value };
    });

    expect(seen.ls).toBe("persisted-value");
    expect(seen.cookie).toBe("warm-cookie");
  });

  it("creates the warmed-profile directory itself owner-only (0700) — the actual cookie jar", async () => {
    // The profile dir holds Chromium's Cookies / Login Data / Local Storage — the most credential-bearing
    // dir in the system. It must not depend on an ancestor's mode for owner-only protection.
    await onWarmedProfile(WARM, async () => {});
    expect(permOf(paths.profileDir(WARM))).toBe(0o700);
  });

  it("does NOT leak that state into a DIFFERENT persistent profile (isolation)", async () => {
    const seen = await onWarmedProfile(OTHER, async (page) => {
      const ls = await page.evaluate(() => localStorage.getItem("feather_warm"));
      const cookies = await page.context().cookies();
      return { ls, cookie: cookies.find((c) => c.name === "feather_session")?.value };
    });

    expect(seen.ls).toBeNull();
    expect(seen.cookie).toBeUndefined();
  });
});
