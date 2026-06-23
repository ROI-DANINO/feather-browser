import { describe, it, expect } from "vitest";
import { classifySite, jitterDelayMs } from "../../../src/browser/stealth";

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
