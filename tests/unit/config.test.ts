// tests/unit/config.test.ts
import { describe, it, expect } from "vitest";
import { loadConfig } from "../../src/config";

describe("loadConfig", () => {
  it("returns default port 0 when FEATHER_PORT is unset", () => {
    delete process.env.FEATHER_PORT;
    const cfg = loadConfig();
    expect(cfg.port).toBe(0);
  });

  it("reads FEATHER_PORT from env", () => {
    process.env.FEATHER_PORT = "17321";
    const cfg = loadConfig();
    expect(cfg.port).toBe(17321);
    delete process.env.FEATHER_PORT;
  });

  it("defaults featherDir to .feather in cwd", () => {
    delete process.env.FEATHER_DIR;
    const cfg = loadConfig();
    expect(cfg.featherDir).toBe(".feather");
  });
});
