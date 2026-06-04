/**
 * warm-session — open Feather's primary persistent session for a human login.
 *
 * Pre-shell task #4 (Cookie Mine foundation). Launches the named "primary"
 * workspace in the stealth `chromium-headed-cdp` mode (navigator.webdriver
 * === false) against a real on-disk profile, so a one-time human Google login
 * persists across runs. Feather never sees the password — the human types it.
 *
 * Usage:  npm run warm-session
 * Then:   log into Google in the window, then press Ctrl-C here (or close the
 *         window) to finalize cleanly. Re-running keeps you logged in.
 *
 * Env overrides (mainly for testing):
 *   FEATHER_WARM_WORKSPACE  workspace id          (default: "primary")
 *   FEATHER_WARM_URL        page to open on launch (default: Google sign-in)
 *   FEATHER_CHROMIUM_PATH   Chromium binary        (default: system, see below)
 */
import * as fs from "fs";
import { resolveDirs } from "../config";
import { FeatherPaths, ensureDirs } from "../fs-layout";
import { ProfileLock, ProfileLockedError } from "../profiles/lock";
import { WorkspaceMetadata } from "../profiles/workspace";
import { SessionManager } from "../sessions/manager";

const WORKSPACE_ID = process.env.FEATHER_WARM_WORKSPACE ?? "primary";
const START_URL = process.env.FEATHER_WARM_URL ?? "https://accounts.google.com/";

// Common system-Chromium locations. Fedora's RPM installs `chromium-browser`;
// other distros use `chromium`. First match wins. (Mirrors the candidate list
// in tests/integration/system-chromium.integration.test.ts.)
const SYSTEM_CHROMIUM_CANDIDATES = [
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  "/usr/lib64/chromium-browser/chromium-browser",
];

function findSystemChromium(): string | null {
  return SYSTEM_CHROMIUM_CANDIDATES.find((p) => fs.existsSync(p)) ?? null;
}

async function main(): Promise<void> {
  // Prefer the real system Chromium for the warm login. The bundled
  // "Chrome for Testing" build carries AutomationControlled at the binary
  // level, which a hardened sign-in flow can flag. Opt in only when the user
  // hasn't set the override and the system binary is present.
  if (!process.env.FEATHER_CHROMIUM_PATH) {
    const systemChromium = findSystemChromium();
    if (systemChromium) process.env.FEATHER_CHROMIUM_PATH = systemChromium;
  }

  const dirs = resolveDirs();
  await ensureDirs(dirs);
  const paths = new FeatherPaths(dirs);
  const lock = new ProfileLock(paths);
  const workspace = new WorkspaceMetadata(paths);
  const manager = new SessionManager(paths, lock, workspace);

  console.log(`\n  Feather — warming the "${WORKSPACE_ID}" session`);
  console.log(`  profile : ${paths.profileDir(WORKSPACE_ID)}`);
  console.log(`  chromium: ${process.env.FEATHER_CHROMIUM_PATH ?? "(bundled)"}\n`);

  let session;
  try {
    session = await manager.launch({
      workspaceId: WORKSPACE_ID,
      profile: { kind: "persistent" },
      browserMode: "chromium-headed-cdp",
    });
  } catch (err) {
    if (err instanceof ProfileLockedError) {
      console.error(`  ✗ The "${WORKSPACE_ID}" session is already open elsewhere.`);
      console.error(`    Close that window first, then re-run.\n`);
      process.exit(1);
    }
    throw err;
  }

  const sessionId = session.sessionId;
  const context = session.getContext();
  const page = context.pages()[0] ?? (await context.newPage());
  try {
    await page.goto(START_URL, { waitUntil: "domcontentloaded", timeout: 30_000 });
  } catch {
    // Best-effort: the window is open regardless; the user can navigate.
  }

  console.log(`  ✓ Window open (session ${sessionId}).`);
  console.log(`    → Log into Google in the browser window.`);
  console.log(`    → When done, press Ctrl-C here (or close the window) to finalize.\n`);

  let closing = false;
  const finalize = async (reason: string): Promise<void> => {
    if (closing) return;
    closing = true;
    console.log(`\n  Finalizing (${reason}) — saving session + releasing lock…`);
    try {
      await manager.close(sessionId, { force: true });
      console.log(`  ✓ Done. Re-run "npm run warm-session" anytime; you'll stay logged in.\n`);
    } catch (err) {
      console.error(`  ✗ Cleanup error: ${(err as Error).message}`);
    }
    process.exit(0);
  };

  // The user closed the browser window → the child Chromium process exits.
  session.getChildProcess()?.on("exit", () => void finalize("window closed"));
  // The user pressed Ctrl-C (or the process was terminated) in the terminal.
  process.on("SIGINT", () => void finalize("Ctrl-C"));
  process.on("SIGTERM", () => void finalize("terminated"));
}

main().catch((err) => {
  console.error(`\n  ✗ warm-session failed: ${(err as Error).message}\n`);
  process.exit(1);
});
