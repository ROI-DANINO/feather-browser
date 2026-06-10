import { describe, it, expect } from "vitest";
import { buildSpawnArgs } from "../../../src/browser/modes";

describe("buildSpawnArgs", () => {
  it("includes --window-size from the requested viewport", () => {
    const args = buildSpawnArgs({ profilePath: "/tmp/p", viewport: { width: 1024, height: 700 } });
    expect(args).toContain("--window-size=1024,700");
  });

  it("defaults --window-size to 1280,800 (matching buildLaunchOptions) when viewport omitted", () => {
    const args = buildSpawnArgs({ profilePath: "/tmp/p" });
    expect(args).toContain("--window-size=1280,800");
  });

  it("keeps the existing base args", () => {
    const args = buildSpawnArgs({ profilePath: "/tmp/p" });
    expect(args).toContain("--remote-debugging-port=0");
    expect(args).toContain("--user-data-dir=/tmp/p");
    expect(args).toContain("--no-first-run");
    expect(args).toContain("--no-default-browser-check");
    expect(args).toContain("--disable-blink-features=AutomationControlled");
  });
});
