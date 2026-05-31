import { describe, it, expect } from "vitest";
import { buildLaunchOptions } from "../../../src/browser/modes";

describe("buildLaunchOptions", () => {
  it("chromium-new-headless sets channel chromium and headless true", () => {
    const opts = buildLaunchOptions("chromium-new-headless");
    expect(opts.channel).toBe("chromium");
    expect(opts.headless).toBe(true);
  });

  it("chromium-headless-shell does not set channel", () => {
    const opts = buildLaunchOptions("chromium-headless-shell");
    expect(opts.channel).toBeUndefined();
    expect(opts.headless).toBe(true);
  });

  it("applies proxy when provided", () => {
    const opts = buildLaunchOptions("chromium-new-headless", {
      server: "http://127.0.0.1:8080",
      username: "u",
      password: "p",
      bypass: "localhost",
    });
    expect(opts.proxy).toEqual({
      server: "http://127.0.0.1:8080",
      username: "u",
      password: "p",
      bypass: "localhost",
    });
  });

  it("applies viewport when provided", () => {
    const opts = buildLaunchOptions("chromium-new-headless", undefined, { width: 1280, height: 800 });
    expect(opts.viewport).toEqual({ width: 1280, height: 800 });
  });

  it("uses default viewport 1280x800 when not provided", () => {
    const opts = buildLaunchOptions("chromium-new-headless");
    expect(opts.viewport).toEqual({ width: 1280, height: 800 });
  });
});
