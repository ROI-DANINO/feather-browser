import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { chromium } from "playwright";
import { spawnAndConnect } from "../../src/browser/modes";

// spawnAndConnect now derives --ozone-platform from env (resolveSpawnExtraArgs): wayland when
// WAYLAND_DISPLAY is set, otherwise omitted so Chromium auto-picks (X11/Xvfb). So this CDP-attach
// gate runs everywhere — Wayland desktop, X11, and CI under Xvfb (ci.yml wraps the suite in
// xvfb-run). Previously env-gated on WAYLAND_DISPLAY; un-gated once ozone became configurable.
const waylandIt = it;

let tmpDir: string;
let cleanup: (() => Promise<void>) | null = null;
let cleanupViewport: (() => Promise<void>) | null = null;

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-cdp-int-"));
});

afterAll(async () => {
  if (cleanup) await cleanup();
  if (cleanupViewport) await cleanupViewport();
  // Give the OS a moment to release file locks after Chromium exits
  await new Promise((r) => setTimeout(r, 500));
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe("spawnAndConnect — anti-detection gate", () => {
  waylandIt(
    "navigator.webdriver is not true when connected via CDP attach",
    async () => {
      const profilePath = path.join(tmpDir, "profile");
      await fs.promises.mkdir(profilePath, { recursive: true });

      const executablePath = chromium.executablePath();
      const { context, childProcess } = await spawnAndConnect({ profilePath, executablePath });

      cleanup = async () => {
        try { await context.close(); } catch { /* best-effort */ }
        childProcess.kill();
      };

      const page = await context.newPage();
      const webdriver = await page.evaluate(() => navigator.webdriver);

      expect(webdriver).toBe(false);
    },
    30_000
  );
});

describe("spawnAndConnect — viewport", () => {
  waylandIt(
    "applies the requested viewport as the OS window size",
    async () => {
      const profilePath = path.join(tmpDir, "profile-viewport");
      await fs.promises.mkdir(profilePath, { recursive: true });

      const executablePath = chromium.executablePath();
      const { context, childProcess } = await spawnAndConnect({
        profilePath,
        executablePath,
        viewport: { width: 1024, height: 700 },
      });

      cleanupViewport = async () => {
        try { await context.close(); } catch { /* best-effort */ }
        childProcess.kill();
      };

      const page = await context.newPage();
      const outer = await page.evaluate(() => ({ w: window.outerWidth, h: window.outerHeight }));

      // Width is the layout-breaking dimension (it's what tripped Instagram's tablet wall) and
      // Wayland honors it tightly. Height is at the window manager's mercy under load (observed
      // +234px in full-suite runs), so it only gets a coarse sanity bound. The bug being pinned
      // is "viewport ignored entirely", a ~600px width error.
      expect(Math.abs(outer.w - 1024)).toBeLessThanOrEqual(50);
      expect(Math.abs(outer.h - 700)).toBeLessThanOrEqual(300);
    },
    30_000
  );
});
