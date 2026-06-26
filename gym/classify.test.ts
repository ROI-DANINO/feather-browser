import { describe, it, expect } from "vitest";
import { classify, type ClassifyConfig } from "./classify";

const higher: ClassifyConfig = { humanThreshold: 0.5, direction: "higherIsHuman" };

describe("classify", () => {
  it("treats a missing score as a FAIL (unscoreable is a tell)", () => {
    const v = classify(null, higher);
    expect(v.state).toBe("UNSCORED");
    expect(v.outcome).toBe("FAIL");
    expect(v.score).toBeNull();
  });

  it("treats an empty / number-less field as UNSCORED FAIL", () => {
    expect(classify("", higher).outcome).toBe("FAIL");
    expect(classify("Your Behavioral Score: ", higher).state).toBe("UNSCORED");
  });

  it("passes a human-like score (higherIsHuman) and parses the number out of text", () => {
    const v = classify("Your Behavioral Score: 0.83", higher);
    expect(v.state).toBe("SCORED");
    expect(v.score).toBe(0.83);
    expect(v.outcome).toBe("PASS");
  });

  it("fails a bot-like score (higherIsHuman)", () => {
    expect(classify("0.10", higher).outcome).toBe("FAIL");
  });

  it("honours the lowerIsHuman direction", () => {
    const lower: ClassifyConfig = { humanThreshold: 0.5, direction: "lowerIsHuman" };
    expect(classify("0.10", lower).outcome).toBe("PASS");
    expect(classify("0.90", lower).outcome).toBe("FAIL");
  });
});
