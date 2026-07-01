// tower/core/asr-ci.test.ts
import { describe, it, expect } from "vitest";
import { anyOfKFloor, attackWithinKLabel, clopperPearson } from "./asr-ci";

/** Reference Clopper-Pearson 95% two-sided intervals (from R binom.test / standard tables). */
describe("clopperPearson — reference intervals (design §2.3)", () => {
  it("(0,3) → [0, ~0.708]", () => {
    const { pHat, low, high } = clopperPearson(0, 3);
    expect(pHat).toBe(0);
    expect(low).toBe(0); // exact edge, k=0
    expect(high).toBeCloseTo(0.7076, 2);
  });

  it("(1,3) → pHat 0.333, [~0.008, ~0.906]", () => {
    const { pHat, low, high } = clopperPearson(1, 3);
    expect(pHat).toBeCloseTo(1 / 3, 6);
    expect(low).toBeCloseTo(0.0084, 2);
    expect(high).toBeCloseTo(0.9057, 2);
  });

  it("(3,3) → [~0.292, 1]", () => {
    const { low, high } = clopperPearson(3, 3);
    expect(low).toBeCloseTo(0.2924, 2);
    expect(high).toBe(1); // exact edge, k=n
  });

  it("(0,10) → [0, ~0.308]", () => {
    const { low, high } = clopperPearson(0, 10);
    expect(low).toBe(0);
    expect(high).toBeCloseTo(0.3085, 2);
  });

  it("(2,9) → pHat ~0.222, within a sane band", () => {
    const { pHat, low, high } = clopperPearson(2, 9);
    expect(pHat).toBeCloseTo(2 / 9, 6);
    expect(low).toBeCloseTo(0.0281, 2);
    expect(high).toBeCloseTo(0.6001, 2);
    expect(low).toBeLessThan(pHat);
    expect(high).toBeGreaterThan(pHat);
  });
});

describe("clopperPearson — edges and monotonicity", () => {
  it("n=0 returns the whole [0,1] (no information)", () => {
    expect(clopperPearson(0, 0)).toEqual({ pHat: 0, low: 0, high: 1 });
  });

  it("more trials at the same rate tighten the interval", () => {
    const small = clopperPearson(1, 3);
    const large = clopperPearson(10, 30); // same pHat = 1/3
    expect(large.pHat).toBeCloseTo(small.pHat, 6);
    expect(large.high - large.low).toBeLessThan(small.high - small.low);
  });

  it("rejects invalid inputs (k>n, negatives, non-integers)", () => {
    expect(() => clopperPearson(4, 3)).toThrow();
    expect(() => clopperPearson(-1, 3)).toThrow();
    expect(() => clopperPearson(1.5, 3)).toThrow();
  });
});

describe("anyOfKFloor / label (the k=3 sensitivity floor)", () => {
  it("1-(1-p)^k for the documented anchors", () => {
    expect(anyOfKFloor(0.18, 3)).toBeCloseTo(1 - 0.82 ** 3, 6); // ≈ 0.449
    expect(anyOfKFloor(0.05, 3)).toBeCloseTo(1 - 0.95 ** 3, 6); // ≈ 0.143
    expect(anyOfKFloor(0, 3)).toBe(0);
    expect(anyOfKFloor(1, 3)).toBe(1);
  });

  it("labels the headline as a within-k floor, never a bare ASR", () => {
    expect(attackWithinKLabel(3)).toBe("attack succeeded within 3 trials");
  });
});
