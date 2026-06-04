import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execFileSync } from "child_process";
import { spawnAndConnect } from "../../src/browser/modes";

// Candidate locations for a system-installed Chromium (Fedora `updates` repo
// installs /usr/bin/chromium-browser). Skip the probe if none exist so the
// suite stays green on machines/CI without a system Chromium.
function findSystemChromium(): string | null {
  const candidates = [
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/lib64/chromium-browser/chromium-browser",
  ];
  for (const c of candidates) {
    try {
      fs.accessSync(c, fs.constants.X_OK);
      return c;
    } catch {
      /* not here */
    }
  }
  return null;
}

function chromiumBuild(bin: string): string | null {
  try {
    const out = execFileSync(bin, ["--version"], { encoding: "utf8" });
    const m = out.match(/\b(\d+\.\d+\.\d+\.\d+)\b/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

const systemBin = findSystemChromium();
const systemBuild = systemBin ? chromiumBuild(systemBin) : null;
// Needs a system Chromium present. spawnAndConnect now derives --ozone-platform from env
// (resolveSpawnExtraArgs), so it no longer crashes on X11/Xvfb/headless — the WAYLAND_DISPLAY
// gate is gone. Still skips when no system Chromium binary is installed (e.g. plain CI without it).
const probe = systemBin && systemBuild ? it : it.skip;

let tmpDir: string;
let cleanup: (() => Promise<void>) | null = null;

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-syschrome-"));
});

afterAll(async () => {
  if (cleanup) await cleanup();
  await new Promise((r) => setTimeout(r, 500));
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe("FEATHER_CHROMIUM_PATH — spawns the real system Chromium", () => {
  probe(
    "runs the system Chromium build (not bundled) with webdriver still false",
    async () => {
      const profilePath = path.join(tmpDir, "profile");
      await fs.promises.mkdir(profilePath, { recursive: true });

      // executablePath = the system binary (what resolveChromiumExecutable
      // returns when FEATHER_CHROMIUM_PATH points here).
      const { context, childProcess } = await spawnAndConnect({
        profilePath,
        executablePath: systemBin!,
      });

      cleanup = async () => {
        try { await context.close(); } catch { /* best-effort */ }
        childProcess.kill();
      };

      // The live browser's build (via CDP Browser.getVersion) must match the
      // SYSTEM binary's reported build — proves the override binary actually
      // ran. (navigator.userAgent can't be used: UA-Reduction freezes the
      // build to x.0.0.0 for both bundled and system.)
      const version = context.browser()?.version() ?? "";
      expect(version).toContain(systemBuild!);

      const page = await context.newPage();
      const webdriver = await page.evaluate(() => navigator.webdriver);
      expect(webdriver).toBe(false);
    },
    30_000
  );
});
