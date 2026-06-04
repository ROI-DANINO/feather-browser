import * as os from "os";
import * as path from "path";

export interface FeatherDirs {
  data: string;
  state: string;
  cache: string;
  runtime: string;
}

export interface FeatherConfig {
  port: number;
  host: string;
  dirs: FeatherDirs;
}

/** Collapse all four roots to a single directory (FEATHER_DIR / test mode). */
export function singleRootDirs(base: string): FeatherDirs {
  return { data: base, state: base, cache: base, runtime: base };
}

function xdgRoot(envVar: string, homeFallback: string): string {
  const env = process.env[envVar];
  const base = env && env.trim() !== "" ? env : path.join(os.homedir(), homeFallback);
  return path.join(base, "feather");
}

/** Resolve the four XDG roots (or a single FEATHER_DIR override). */
export function resolveDirs(): FeatherDirs {
  const override = process.env.FEATHER_DIR;
  if (override && override.trim() !== "") {
    return singleRootDirs(override);
  }
  const state = xdgRoot("XDG_STATE_HOME", ".local/state");
  const runtimeEnv = process.env.XDG_RUNTIME_DIR;
  const runtime =
    runtimeEnv && runtimeEnv.trim() !== ""
      ? path.join(runtimeEnv, "feather")
      : state; // XDG_RUNTIME_DIR not guaranteed; never fall back into the workspace
  return {
    data: xdgRoot("XDG_DATA_HOME", ".local/share"),
    state,
    cache: xdgRoot("XDG_CACHE_HOME", ".cache"),
    runtime,
  };
}

/**
 * Resolve the Chromium executable to spawn for `chromium-headed-cdp`.
 * `FEATHER_CHROMIUM_PATH` overrides the bundled fallback so Feather can attach
 * to a real system Chromium (no "Chrome for Testing" banner, no
 * AutomationControlled at the binary level).
 */
export function resolveChromiumExecutable(fallback: string): string {
  const override = process.env.FEATHER_CHROMIUM_PATH;
  return override && override.trim() !== "" ? override.trim() : fallback;
}

export function loadConfig(): FeatherConfig {
  return {
    port: process.env.FEATHER_PORT ? parseInt(process.env.FEATHER_PORT, 10) : 0,
    host: process.env.FEATHER_HOST ?? "127.0.0.1",
    dirs: resolveDirs(),
  };
}
