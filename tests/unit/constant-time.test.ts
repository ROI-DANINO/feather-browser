import { describe, it, expect } from "vitest";
import { constantTimeEqual } from "../../src/util/constant-time";

describe("constantTimeEqual", () => {
  it("is true only for equal strings", () => {
    expect(constantTimeEqual("abc123", "abc123")).toBe(true);
    expect(constantTimeEqual("abc123", "abc124")).toBe(false);
  });

  it("is false for different lengths (no throw)", () => {
    expect(constantTimeEqual("short", "longer-value")).toBe(false);
    expect(constantTimeEqual("", "x")).toBe(false);
  });

  it("is false for non-strings (undefined, null, arrays, numbers)", () => {
    expect(constantTimeEqual(undefined, "x")).toBe(false);
    expect(constantTimeEqual("x", undefined)).toBe(false);
    expect(constantTimeEqual(null, "x")).toBe(false);
    expect(constantTimeEqual(["x"], "x")).toBe(false);
    expect(constantTimeEqual(42, "42")).toBe(false);
  });
});
