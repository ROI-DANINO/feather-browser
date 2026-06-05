/**
 * THROWAWAY SPIKE — ships nothing (not imported by src/). Workstream ②.2 / pre-shell #6.
 *
 * Cookie Mine loop demo (ADR-0007 gate) on the burnable `scratch` account ONLY. Never `primary`.
 *
 * Proves the end-to-end loop: a human warmed the persistent `scratch` workspace earlier
 * (warm-session, real Google login) -> here an *agent-style* Feather session opens that SAME
 * on-disk context with NO human typing any credential, and completes an authenticated background
 * task purely on the inherited cookies. This is the mechanism Phase 5 agents depend on; proving
 * the mechanism is the goal, not the specific account.
 *
 * Run:  npx ts-node scripts/spikes/cookie-mine-loop-demo.ts
 */
import * as fs from "fs";
import * as path from "path";
import { chromium } from "playwright";
import { resolveDirs } from "../../src/config";
import { FeatherPaths, ensureDirs } from "../../src/fs-layout";
import { ProfileLock } from "../../src/profiles/lock";
import { WorkspaceMetadata } from "../../src/profiles/workspace";
import { SessionManager } from "../../src/sessions/manager";

const WORKSPACE_ID = "scratch";
const SYSTEM_CHROMIUM_CANDIDATES = [
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  "/usr/lib64/chromium-browser/chromium-browser",
];

const log = (...a: unknown[]) => console.log(...a);

async function main(): Promise<void> {
  if (!process.env.FEATHER_CHROMIUM_PATH) {
    const sys = SYSTEM_CHROMIUM_CANDIDATES.find((p) => fs.existsSync(p));
    if (sys) process.env.FEATHER_CHROMIUM_PATH = sys;
  }
  log(`# Cookie Mine loop demo (pre-shell #6 / ADR-0007 gate) — ${new Date().toISOString()}`);
  log(`chromium: ${process.env.FEATHER_CHROMIUM_PATH ?? "(bundled)"}`);

  const dirs = resolveDirs();
  await ensureDirs(dirs);
  const paths = new FeatherPaths(dirs);
  const manager = new SessionManager(paths, new ProfileLock(paths), new WorkspaceMetadata(paths));

  // The AGENT step: open the human-warmed persistent context. No human, no credentials typed.
  log(`\n## Agent opens the human-warmed persistent context (no login step)`);
  const session = await manager.launch({
    workspaceId: WORKSPACE_ID,
    profile: { kind: "persistent" },
    browserMode: "chromium-headed-cdp",
  });
  const debugDir = paths.debugDir(session.sessionId);
  await fs.promises.mkdir(debugDir, { recursive: true }).catch(() => {});
  const ctx = session.getContext();
  const page = ctx.pages()[0] ?? (await ctx.newPage());

  const proof: Record<string, unknown> = {};
  try {
    // Authenticated background task #1: read the signed-in account's own email + name from the
    // account page — content only a logged-in user can see.
    await page.goto("https://myaccount.google.com/", { waitUntil: "domcontentloaded", timeout: 45_000 }).catch(() => {});
    await page.waitForTimeout(3500);
    proof.accountUrl = page.url();
    proof.webdriver = await page.evaluate(() => navigator.webdriver);
    proof.accountEmail = await page.evaluate(() => {
      const m = document.body?.innerText?.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
      return m ? m[0] : null;
    });
    await page.screenshot({ path: path.join(debugDir, "loop-01-myaccount.png") }).catch(() => {});

    // Authenticated background task #2: hit an authed service (Gmail) and confirm it loads the
    // app, not a sign-in wall — i.e. the inherited session is accepted by a real product.
    await page.goto("https://mail.google.com/mail/u/0/", { waitUntil: "domcontentloaded", timeout: 45_000 }).catch(() => {});
    await page.waitForTimeout(5000);
    const gmailUrl = page.url();
    proof.gmailUrl = gmailUrl;
    proof.gmailAuthenticated = /mail\.google\.com\/mail\/u\//.test(gmailUrl) && !/ServiceLogin|signin/.test(gmailUrl);
    proof.gmailTitle = await page.title().catch(() => null);
    await page.screenshot({ path: path.join(debugDir, "loop-02-gmail.png") }).catch(() => {});

    log(`\n## Authenticated-task proof`);
    log(JSON.stringify(proof, null, 2));
    log(`\nevidence (screenshots, NOT committed): ${debugDir}`);
  } finally {
    log(`\n## Cleanup`);
    try { await manager.close(session.sessionId, { force: true }); log(`- session closed, lock released`); }
    catch (e) { log(`- close error: ${(e as Error).message}`); }
  }

  const loopClosed =
    proof.webdriver === false &&
    typeof proof.accountEmail === "string" &&
    proof.gmailAuthenticated === true;
  log(`\n## LOOP CLOSED: ${loopClosed}`);
  process.exit(loopClosed ? 0 : 2);
}

main().catch((err) => {
  console.error(`\ndemo failed: ${(err as Error).stack ?? err}`);
  process.exit(1);
});
