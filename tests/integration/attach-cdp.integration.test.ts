import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { chromium } from "playwright";
import { spawnAndConnect } from "../../src/browser/modes";

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
  it(
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

      expect(webdriver).not.toBe(true);
    },
    30_000
  );
});
