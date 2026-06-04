import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { chromium } from "playwright";
import { spawnAndConnect } from "../../src/browser/modes";

// spawnAndConnect currently hardcodes `--ozone-platform=wayland` + spawns headed, so this
// CDP-attach gate only runs on a real Wayland desktop session. Skip elsewhere (CI / X11 /
// headless) — mirrors the system-chromium probe's conditional-skip. Making the ozone platform
// configurable so this runs anywhere is tracked post-merge (journal/ops/tasks.md).
const waylandIt = process.env.WAYLAND_DISPLAY ? it : it.skip;

let tmpDir: string;
let cleanup: (() => Promise<void>) | null = null;

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-cdp-int-"));
});

afterAll(async () => {
  if (cleanup) await cleanup();
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
