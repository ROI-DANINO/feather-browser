import { spawn, type ChildProcess } from "child_process";
import { chromium, type BrowserContext, type BrowserContextOptions } from "playwright";
import type { BrowserMode, ProxyConfig } from "../sessions/types";

type LaunchOptions = BrowserContextOptions & { channel?: string; headless?: boolean };

export function buildLaunchOptions(
  mode: BrowserMode,
  proxy?: ProxyConfig | null,
  viewport?: { width: number; height: number }
): LaunchOptions {
  const opts: LaunchOptions = {
    headless: true,
    viewport: viewport ?? { width: 1280, height: 800 },
  };

  if (mode === "chromium-new-headless") {
    opts.channel = "chromium";
  }

  if (proxy) {
    opts.proxy = {
      server: proxy.server,
      ...(proxy.username !== undefined ? { username: proxy.username } : {}),
      ...(proxy.password !== undefined ? { password: proxy.password } : {}),
      ...(proxy.bypass !== undefined ? { bypass: proxy.bypass } : {}),
    };
  }

  return opts;
}

const CDP_TIMEOUT_MS = 10_000;

/**
 * Resolve env-driven spawn args for the headed CDP path.
 * - Ozone: explicit FEATHER_OZONE_PLATFORM wins ("default"/"none"/"" => omit the flag and let
 *   Chromium auto-pick, which is correct on X11/Xvfb). Unset => wayland only if WAYLAND_DISPLAY is
 *   present, else omit. This replaces the previous hardcoded `--ozone-platform=wayland`, which
 *   crashed on X11/headless/CI.
 * - Headless: FEATHER_SPAWN_HEADLESS truthy => `--headless=new` (lets a display-less runner attach
 *   over CDP). Prefer Xvfb in CI to keep the headed fingerprint faithful; this is the fallback.
 * - Sandbox: FEATHER_SPAWN_NO_SANDBOX truthy => `--no-sandbox` (CI/containers can't initialize
 *   Chromium's user-namespace sandbox — without it Chromium aborts before exposing CDP). OFF by
 *   default so production never carries it; it is not JS-observable, so it doesn't affect the
 *   webdriver/anti-detection surface a website sees.
 */
function envTruthy(name: string): boolean {
  const v = (process.env[name] ?? "").toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function resolveSpawnExtraArgs(): string[] {
  const out: string[] = [];
  const explicit = process.env.FEATHER_OZONE_PLATFORM;
  if (explicit !== undefined) {
    const v = explicit.trim().toLowerCase();
    if (v && v !== "default" && v !== "none") out.push(`--ozone-platform=${explicit.trim()}`);
  } else if (process.env.WAYLAND_DISPLAY) {
    out.push("--ozone-platform=wayland");
  }
  if (envTruthy("FEATHER_SPAWN_HEADLESS")) out.push("--headless=new");
  if (envTruthy("FEATHER_SPAWN_NO_SANDBOX")) out.push("--no-sandbox");
  return out;
}

export async function spawnAndConnect(opts: {
  profilePath: string;
  executablePath: string;
}): Promise<{ context: BrowserContext; childProcess: ChildProcess }> {
  const args = [
    "--remote-debugging-port=0",
    `--user-data-dir=${opts.profilePath}`,
    "--no-first-run",
    "--no-default-browser-check",
    ...resolveSpawnExtraArgs(),
    "--disable-blink-features=AutomationControlled",
  ];

  const child = spawn(opts.executablePath, args, { stdio: ["ignore", "ignore", "pipe"] });

  const wsEndpoint = await new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`Chromium did not expose CDP within ${CDP_TIMEOUT_MS}ms`));
    }, CDP_TIMEOUT_MS);

    child.stderr!.on("data", (chunk: Buffer) => {
      const match = chunk.toString().match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });

    child.on("error", (err: Error) => {
      clearTimeout(timer);
      reject(new Error(`Failed to spawn Chromium: ${err.message}`));
    });

    child.on("exit", (code: number | null) => {
      clearTimeout(timer);
      reject(new Error(`Chromium exited unexpectedly with code ${code}`));
    });
  });

  try {
    const browser = await chromium.connectOverCDP(wsEndpoint);
    const context = browser.contexts()[0];
    return { context, childProcess: child };
  } catch (err) {
    child.kill();
    throw err;
  }
}
