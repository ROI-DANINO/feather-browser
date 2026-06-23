import { describe, it, expect, vi } from "vitest";
import { classifySite, jitterDelayMs, applyFingerprintCheck, applyStealthEnvironment } from "../../../src/browser/stealth";

describe("classifySite (observability only)", () => {
  it("labels known bot-detecting apex domains tier-c", () => {
    expect(classifySite("https://linkedin.com/feed")).toBe("tier-c");
    expect(classifySite("https://www.instagram.com/")).toBe("tier-c");
  });
  it("labels unknown sites standard", () => {
    expect(classifySite("https://example.com/")).toBe("standard");
  });
  it("does not match a name appearing only in the path", () => {
    expect(classifySite("https://example.com/linkedin.com")).toBe("standard");
  });
  it("returns standard for an unparseable URL", () => {
    expect(classifySite("not a url")).toBe("standard");
  });
});

describe("jitterDelayMs", () => {
  it("always returns a value within [50,150]", () => {
    for (let i = 0; i < 500; i++) {
      const d = jitterDelayMs();
      expect(d).toBeGreaterThanOrEqual(50);
      expect(d).toBeLessThanOrEqual(150);
    }
  });
});

describe("applyFingerprintCheck", () => {
  it("passes when a real GPU renderer is reported", async () => {
    const page = {
      evaluate: vi.fn().mockResolvedValue({
        webglVendor: "Google Inc. (Intel)",
        webglRenderer: "ANGLE (Intel, Mesa Intel(R) Iris(R) Xe Graphics, OpenGL 4.6)",
      }),
    } as any;
    const res = await applyFingerprintCheck(page);
    expect(res.ok).toBe(true);
    expect(res.warnings).toEqual([]);
  });

  it("warns when SwiftShader (software/headless) renderer is detected", async () => {
    const page = {
      evaluate: vi.fn().mockResolvedValue({
        webglVendor: "Google Inc. (Google)",
        webglRenderer: "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device))",
      }),
    } as any;
    const res = await applyFingerprintCheck(page);
    expect(res.ok).toBe(false);
    expect(res.warnings.join(" ")).toMatch(/swiftshader/i);
  });

  it("does NOT call addInitScript (no font guard / no spoofing)", async () => {
    const page = {
      addInitScript: vi.fn(),
      evaluate: vi.fn().mockResolvedValue({ webglVendor: "Google Inc. (Intel)", webglRenderer: "ANGLE (Intel)" }),
    } as any;
    await applyFingerprintCheck(page);
    expect(page.addInitScript).not.toHaveBeenCalled();
  });
});

function envPage(values: Record<string, unknown>) {
  return { evaluate: vi.fn().mockResolvedValue(values) } as any;
}

describe("applyStealthEnvironment", () => {
  const consistent = {
    innerWidth: 1280, innerHeight: 800, screenWidth: 1440, screenHeight: 900,
    devicePixelRatio: 2, languages: ["en-US", "en"], timezone: "Asia/Jerusalem",
  };
  it("ok with no warnings when consistent", async () => {
    const res = await applyStealthEnvironment(envPage(consistent));
    expect(res.ok).toBe(true);
    expect(res.warnings).toEqual([]);
  });
  it("warns when viewport exceeds screen", async () => {
    const res = await applyStealthEnvironment(envPage({ ...consistent, innerWidth: 2000 }));
    expect(res.ok).toBe(false);
    expect(res.warnings.join(" ")).toMatch(/viewport.*screen/i);
  });
  it("warns when languages is empty", async () => {
    const res = await applyStealthEnvironment(envPage({ ...consistent, languages: [] }));
    expect(res.ok).toBe(false);
    expect(res.warnings.join(" ")).toMatch(/languages/i);
  });
});
