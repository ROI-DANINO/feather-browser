/**
 * THROWAWAY SPIKE — ships nothing (not imported by src/). Workstream ②.1.
 *
 * Cookie-isolation spike on the burnable `scratch` Google account ONLY. Never touches `primary`.
 * Roi approved the full clone test (2026-06-05) with the shared-iPhone risk understood.
 *
 * Sequence (measure-first, per the next.md correction — scratch is password-only, not passkey):
 *   1. Launch scratch persistent (headed CDP, system Chromium), confirm logged in.
 *   2. READ-ONLY: export storageState; classify Google auth cookies; record DBSC signals.
 *   3. CLONE: spawn a fresh temp-profile Chromium, inject the cookies, open myaccount — auth survive?
 *   4. RE-CHECK the original scratch session — did the clone trip a "session theft" invalidation?
 *
 * Artifacts (screenshots + json + report) land in a temp spike dir, printed at the end.
 * Run:  npx ts-node scripts/spikes/cookie-isolation-spike.ts
 */
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { chromium } from "playwright";
import { resolveDirs } from "../../src/config";
import { FeatherPaths, ensureDirs } from "../../src/fs-layout";
import { ProfileLock } from "../../src/profiles/lock";
import { WorkspaceMetadata } from "../../src/profiles/workspace";
import { SessionManager } from "../../src/sessions/manager";
import { spawnAndConnect } from "../../src/browser/modes";

const WORKSPACE_ID = "scratch";
const MYACCOUNT = "https://myaccount.google.com/";

const SYSTEM_CHROMIUM_CANDIDATES = [
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  "/usr/lib64/chromium-browser/chromium-browser",
];
const findSystemChromium = (): string | null =>
  SYSTEM_CHROMIUM_CANDIDATES.find((p) => fs.existsSync(p)) ?? null;

// Cookies whose presence/behavior signals Google's session-binding / rotation machinery.
const DBSC_SIGNAL = ["__Secure-1PSIDTS", "__Secure-3PSIDTS", "__Secure-1PSIDCC", "__Secure-3PSIDCC"];
const CORE_AUTH = ["__Secure-1PSID", "__Secure-3PSID", "SID", "HSID", "SSID", "SAPISID", "APISID", "LSID"];

const log = (...a: unknown[]) => console.log(...a);

function classifyLogin(url: string): string {
  if (/signin|ServiceLogin|\/v3\/signin|accounts\.google\.com\/(?!o\/oauth)/.test(url)) return "LOGGED_OUT?";
  if (/myaccount\.google\.com/.test(url)) return "LOGGED_IN (stayed on myaccount)";
  return `UNKNOWN (${url})`;
}

async function readEmail(page: import("playwright").Page): Promise<string | null> {
  try {
    return await page.evaluate(() => {
      const m = document.body?.innerText?.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
      return m ? m[0] : null;
    });
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  if (!process.env.FEATHER_CHROMIUM_PATH) {
    const sys = findSystemChromium();
    if (sys) process.env.FEATHER_CHROMIUM_PATH = sys;
  }
  const executablePath = process.env.FEATHER_CHROMIUM_PATH ?? chromium.executablePath();

  const spikeDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-cookie-iso-"));
  const report: string[] = [];
  const say = (s: string) => { log(s); report.push(s); };

  say(`# Cookie-isolation spike — ${new Date().toISOString()}`);
  say(`spikeDir: ${spikeDir}`);
  say(`chromium: ${executablePath}`);

  const dirs = resolveDirs();
  await ensureDirs(dirs);
  const paths = new FeatherPaths(dirs);
  const manager = new SessionManager(paths, new ProfileLock(paths), new WorkspaceMetadata(paths));

  // ---- 1. Launch scratch, confirm logged in -------------------------------------------------
  say(`\n## 1. Launch scratch persistent (headed CDP)`);
  const session = await manager.launch({
    workspaceId: WORKSPACE_ID,
    profile: { kind: "persistent" },
    browserMode: "chromium-headed-cdp",
  });
  const ctx = session.getContext();
  const page = ctx.pages()[0] ?? (await ctx.newPage());

  let cloneChild: import("child_process").ChildProcess | null = null;
  let cloneBrowserClose: (() => Promise<void>) | null = null;
  try {
    await page.goto(MYACCOUNT, { waitUntil: "domcontentloaded", timeout: 45_000 }).catch(() => {});
    await page.waitForTimeout(3500);
    const url1 = page.url();
    const email1 = await readEmail(page);
    await page.screenshot({ path: path.join(spikeDir, "01-scratch-myaccount.png") }).catch(() => {});
    say(`- scratch login state: ${classifyLogin(url1)}`);
    say(`- scratch visible email: ${email1 ?? "(none found in body text)"}`);
    say(`- webdriver: ${await page.evaluate(() => navigator.webdriver)}`);

    // ---- 2. READ-ONLY export + DBSC measurement ---------------------------------------------
    say(`\n## 2. Export storageState + DBSC measurement (read-only)`);
    const state = await ctx.storageState();
    await fs.promises.writeFile(path.join(spikeDir, "scratch-storage.json"), JSON.stringify(state, null, 2));
    const googleCookies = state.cookies.filter((c) => /google\.com$/.test(c.domain.replace(/^\./, "")));
    const names = new Set(googleCookies.map((c) => c.name));
    say(`- total cookies: ${state.cookies.length}; google cookies: ${googleCookies.length}`);
    say(`- core-auth cookies present: ${CORE_AUTH.filter((n) => names.has(n)).join(", ") || "NONE"}`);
    say(`- DBSC/rotation-signal cookies present: ${DBSC_SIGNAL.filter((n) => names.has(n)).join(", ") || "NONE"}`);
    // On-disk DBSC store check (absence = not device-bound registered).
    const profileDir = paths.profileDir(WORKSPACE_ID);
    const dbscHits: string[] = [];
    const walk = (d: string) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, e.name);
        if (/devicebound|boundsession|dbsc/i.test(e.name)) dbscHits.push(full);
        if (e.isDirectory() && !/Cache|Code Cache|GPUCache|ShaderCache/i.test(e.name)) {
          try { walk(full); } catch { /* skip */ }
        }
      }
    };
    try { walk(profileDir); } catch { /* best-effort */ }
    say(`- on-disk DBSC bound-session store: ${dbscHits.length ? dbscHits.join(", ") : "NONE FOUND (not device-bound registered)"}`);

    // ---- 3. CLONE into a fresh isolated context ---------------------------------------------
    say(`\n## 3. Clone cookies into a fresh isolated context (separate profile)`);
    const cloneProfile = path.join(spikeDir, "clone-profile");
    await fs.promises.mkdir(cloneProfile, { recursive: true });
    const clone = await spawnAndConnect({ profilePath: cloneProfile, executablePath });
    cloneChild = clone.childProcess;
    const cloneCtx = clone.context;
    cloneBrowserClose = async () => { try { await cloneCtx.browser()?.close(); } catch { /* */ } };
    await cloneCtx.addCookies(state.cookies);
    const clonePage = await cloneCtx.newPage();
    await clonePage.goto(MYACCOUNT, { waitUntil: "domcontentloaded", timeout: 45_000 }).catch(() => {});
    await clonePage.waitForTimeout(4000);
    const urlC = clonePage.url();
    const emailC = await readEmail(clonePage);
    await clonePage.screenshot({ path: path.join(spikeDir, "02-clone-myaccount.png") }).catch(() => {});
    say(`- CLONE login state: ${classifyLogin(urlC)}`);
    say(`- CLONE visible email: ${emailC ?? "(none found)"}`);
    say(`- CLONE webdriver: ${await clonePage.evaluate(() => navigator.webdriver)}`);
    // Give any DBSC rebinding/rotation a moment, then reload the clone.
    await clonePage.waitForTimeout(6000);
    await clonePage.reload({ waitUntil: "domcontentloaded", timeout: 45_000 }).catch(() => {});
    await clonePage.waitForTimeout(3000);
    say(`- CLONE login state after reload+wait: ${classifyLogin(clonePage.url())}`);
    await clonePage.screenshot({ path: path.join(spikeDir, "03-clone-after-reload.png") }).catch(() => {});

    // ---- 4. Re-check the ORIGINAL scratch session -------------------------------------------
    say(`\n## 4. Re-check ORIGINAL scratch session (session-theft check)`);
    await page.reload({ waitUntil: "domcontentloaded", timeout: 45_000 }).catch(() => {});
    await page.waitForTimeout(3500);
    const url2 = page.url();
    const email2 = await readEmail(page);
    await page.screenshot({ path: path.join(spikeDir, "04-scratch-recheck.png") }).catch(() => {});
    say(`- scratch login state AFTER clone: ${classifyLogin(url2)}`);
    say(`- scratch visible email AFTER clone: ${email2 ?? "(none found)"}`);
  } finally {
    say(`\n## Cleanup`);
    if (cloneBrowserClose) await cloneBrowserClose();
    if (cloneChild) { try { cloneChild.kill(); } catch { /* */ } }
    try { await manager.close(session.sessionId, { force: true }); say(`- scratch session closed, lock released`); }
    catch (e) { say(`- scratch close error: ${(e as Error).message}`); }
  }

  await fs.promises.writeFile(path.join(spikeDir, "REPORT.md"), report.join("\n") + "\n");
  say(`\n=== artifacts in: ${spikeDir} ===`);
  process.exit(0);
}

main().catch((err) => {
  console.error(`\nspike failed: ${(err as Error).stack ?? err}`);
  process.exit(1);
});
