// tests/integration/mfa-resolve-banner.integration.test.ts
//
// The local MFA channel: a banner on the watched page whose button carries NO token, and which makes
// Feather open the token-bearing resolve tab over CDP. The security contract: the watched (possibly
// hostile) page never sees the humanToken; Feather opens the new tab itself.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as http from "http";
import { FeatherPaths, ensureDirs } from "../../src/fs-layout";
import { ProfileLock } from "../../src/profiles/lock";
import { WorkspaceMetadata } from "../../src/profiles/workspace";
import { SessionManager } from "../../src/sessions/manager";
import { startResolveBanner } from "../../src/mfa/resolve-banner";
import { RESOLVE_BANNER_ID } from "../../src/browser/pause-banner";

let manager: SessionManager;
let tmpDir: string;
let server: http.Server;
let origin: string;
const TOKEN = "SECRET_TOKEN_abc123";

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-int-banner-"));
  await ensureDirs(tmpDir);
  const paths = new FeatherPaths(tmpDir);
  manager = new SessionManager(paths, new ProfileLock(paths), new WorkspaceMetadata(paths));
  server = http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<!doctype html><html><body><h1>watched page</h1></body></html>");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const addr = server.address();
  if (!addr || typeof addr === "string") throw new Error("no server address");
  origin = `http://127.0.0.1:${addr.port}/`;
});

afterAll(async () => {
  await Promise.allSettled(manager.list().map((s) => manager.close(s.sessionId, { force: true })));
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe("MFA resolve-banner (local channel)", () => {
  it("shows a token-less banner and makes Feather open the resolve tab over CDP on click", async () => {
    const session = await manager.launch({
      workspaceId: "banner-ws",
      profile: { kind: "disposable" },
      browserMode: "chromium-headless-shell",
    } as any);
    const page = await (async () => {
      try {
        return session.getPage().page;
      } catch {
        return (await session.openTab()).page;
      }
    })();
    await page.goto(`${origin}watched`);
    const context = page.context();
    const humanUrl = `${origin}v1/mfa/mfa_test?t=${TOKEN}`;

    const handle = await startResolveBanner({ page, context, prompt: "Google 2FA", humanUrl });

    // banner present, and the watched page DOM never contains the bearer token
    await page.waitForSelector(`#${RESOLVE_BANNER_ID}`, { timeout: 5000 });
    expect(await page.content()).not.toContain(TOKEN);

    // simulate the human clicking the banner → Feather opens exactly one new tab at the token URL
    const newTab = context.waitForEvent("page", { timeout: 8000 });
    await page.evaluate(
      (id) => (document.getElementById(id)!.querySelector("button") as HTMLButtonElement).click(),
      RESOLVE_BANNER_ID,
    );
    const opened = await newTab;
    // the 'page' event fires at tab creation (about:blank); wait for Feather's goto to land
    await opened.waitForURL((u) => u.href.includes(TOKEN), { timeout: 5000 });
    expect(opened.url()).toContain(TOKEN);

    await handle.dispose();
    expect(await page.$(`#${RESOLVE_BANNER_ID}`)).toBeNull();

    await manager.close(session.sessionId, { force: true });
  });
});
