// tests/unit/config.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as os from "os";
import * as path from "path";
import { loadConfig, resolveDirs, singleRootDirs } from "../../src/config";

const XDG_VARS = [
  "FEATHER_DIR",
  "XDG_DATA_HOME",
  "XDG_STATE_HOME",
  "XDG_CACHE_HOME",
  "XDG_RUNTIME_DIR",
];

describe("config", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = {};
    for (const k of XDG_VARS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
    delete process.env.FEATHER_PORT;
  });

  afterEach(() => {
    for (const k of XDG_VARS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("returns default port 0 when FEATHER_PORT is unset", () => {
    const cfg = loadConfig();
    expect(cfg.port).toBe(0);
  });

  it("reads FEATHER_PORT from env", () => {
    process.env.FEATHER_PORT = "17321";
    const cfg = loadConfig();
    expect(cfg.port).toBe(17321);
  });

  it("singleRootDirs collapses all four roots to one path", () => {
    expect(singleRootDirs("/x")).toEqual({
      data: "/x",
      state: "/x",
      cache: "/x",
      runtime: "/x",
    });
  });

  it("resolveDirs uses XDG home fallbacks when no env vars set", () => {
    const dirs = resolveDirs();
    const home = os.homedir();
    expect(dirs.data).toBe(path.join(home, ".local/share", "feather"));
    expect(dirs.state).toBe(path.join(home, ".local/state", "feather"));
    expect(dirs.cache).toBe(path.join(home, ".cache", "feather"));
    // runtime has no home fallback → falls back to the state root
    expect(dirs.runtime).toBe(dirs.state);
  });

  it("resolveDirs honors XDG_*_HOME env vars", () => {
    process.env.XDG_DATA_HOME = "/custom/data";
    process.env.XDG_STATE_HOME = "/custom/state";
    process.env.XDG_CACHE_HOME = "/custom/cache";
    process.env.XDG_RUNTIME_DIR = "/run/user/1000";
    const dirs = resolveDirs();
    expect(dirs.data).toBe(path.join("/custom/data", "feather"));
    expect(dirs.state).toBe(path.join("/custom/state", "feather"));
    expect(dirs.cache).toBe(path.join("/custom/cache", "feather"));
    expect(dirs.runtime).toBe(path.join("/run/user/1000", "feather"));
  });

  it("resolveDirs collapses all roots when FEATHER_DIR is set", () => {
    process.env.FEATHER_DIR = "/tmp/feather-test";
    expect(resolveDirs()).toEqual(singleRootDirs("/tmp/feather-test"));
  });

  it("loadConfig wires dirs from resolveDirs", () => {
    const cfg = loadConfig();
    expect(cfg.dirs).toEqual(resolveDirs());
  });
});
