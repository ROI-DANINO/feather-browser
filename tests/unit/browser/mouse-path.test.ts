// tests/unit/browser/mouse-path.test.ts
import { describe, it, expect } from "vitest";
import { mousePath } from "../../../src/browser/mouse-path";

describe("mousePath", () => {
  it("starts at `from`, ends exactly at `to`", () => {
    const path = mousePath({ x: 0, y: 0 }, { x: 100, y: 0 }, { seed: 7 });
    expect(path[0]).toMatchObject({ x: 0, y: 0 });
    const last = path[path.length - 1];
    expect(last.x).toBe(100);
    expect(last.y).toBe(0);
  });

  it("bows off the straight line (a horizontal request is not collinear)", () => {
    const path = mousePath({ x: 0, y: 0 }, { x: 100, y: 0 }, { seed: 7 });
    expect(path.some((w) => Math.abs(w.y) > 1)).toBe(true); // curved, not a straight y=0 line
  });

  it("has non-uniform per-step delays (variable velocity)", () => {
    const path = mousePath({ x: 0, y: 0 }, { x: 200, y: 120 }, { seed: 7 });
    const delays = new Set(path.map((w) => w.delayMs));
    expect(delays.size).toBeGreaterThan(1);
  });

  it("is deterministic for a given seed and varies across seeds", () => {
    const a = mousePath({ x: 10, y: 10 }, { x: 300, y: 200 }, { seed: 1 });
    const b = mousePath({ x: 10, y: 10 }, { x: 300, y: 200 }, { seed: 1 });
    const c = mousePath({ x: 10, y: 10 }, { x: 300, y: 200 }, { seed: 2 });
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it("returns a single waypoint when from === to", () => {
    const path = mousePath({ x: 50, y: 50 }, { x: 50, y: 50 }, { seed: 1 });
    expect(path).toHaveLength(1);
    expect(path[0]).toMatchObject({ x: 50, y: 50 });
  });

  it("zero delay range yields zero-delay waypoints (fast tests / no waits)", () => {
    const path = mousePath({ x: 0, y: 0 }, { x: 100, y: 100 }, { seed: 1, minDelayMs: 0, maxDelayMs: 0 });
    expect(path.every((w) => w.delayMs === 0)).toBe(true);
  });
});
