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

export async function spawnAndConnect(opts: {
  profilePath: string;
  executablePath: string;
}): Promise<{ context: BrowserContext; childProcess: ChildProcess }> {
  const args = [
    "--remote-debugging-port=0",
    `--user-data-dir=${opts.profilePath}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--ozone-platform=wayland",
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
