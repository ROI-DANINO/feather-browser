import { describe, it, expect, afterEach } from "vitest";
import { resolveSpawnExtraArgs } from "../../../src/browser/modes";

const saved = { ...process.env };
afterEach(() => { process.env = { ...saved }; });

describe("resolveSpawnExtraArgs", () => {
  it("uses wayland when FEATHER_OZONE_PLATFORM unset but WAYLAND_DISPLAY present", () => {
    delete process.env.FEATHER_OZONE_PLATFORM;
    process.env.WAYLAND_DISPLAY = "wayland-0";
    expect(resolveSpawnExtraArgs()).toContain("--ozone-platform=wayland");
  });

  it("omits the ozone flag when neither var is set (Chromium default / X11 / Xvfb)", () => {
    delete process.env.FEATHER_OZONE_PLATFORM;
    delete process.env.WAYLAND_DISPLAY;
    expect(resolveSpawnExtraArgs().some((a) => a.startsWith("--ozone-platform"))).toBe(false);
  });

  it("honors an explicit FEATHER_OZONE_PLATFORM override", () => {
    process.env.FEATHER_OZONE_PLATFORM = "x11";
    expect(resolveSpawnExtraArgs()).toContain("--ozone-platform=x11");
  });

  it("treats FEATHER_OZONE_PLATFORM=default as 'omit the flag'", () => {
    process.env.FEATHER_OZONE_PLATFORM = "default";
    expect(resolveSpawnExtraArgs().some((a) => a.startsWith("--ozone-platform"))).toBe(false);
  });

  it("adds --headless=new when FEATHER_SPAWN_HEADLESS is truthy", () => {
    process.env.FEATHER_SPAWN_HEADLESS = "1";
    expect(resolveSpawnExtraArgs()).toContain("--headless=new");
  });
});
