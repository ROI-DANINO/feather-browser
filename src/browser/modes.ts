import type { BrowserContextOptions } from "playwright";
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
