// tower/core/runner.test.ts
import { describe, it, expect } from "vitest";
import { runTower } from "./runner";
import { stubAdapter, stubLevel, stubTower } from "./stubs";

const deps = () => {
  let t = 0;
  return { runId: "run-1", startedAt: "2026-06-28T00:00:00Z", now: () => (t += 1) };
};

describe("runTower", () => {
  it("walks all levels when every level WINs; stoppedAtLevel = null", async () => {
    const tower = stubTower("tower-1", [
      stubLevel("a", { verdict: "ok", cause: null, suggestedFix: null }),
      stubLevel("b", { verdict: "ok", cause: null, suggestedFix: null }),
    ]);
    const rec = await runTower(tower, stubAdapter(), deps());
    expect(rec.levels.map((l) => l.outcome)).toEqual(["WIN", "WIN"]);
    expect(rec.stoppedAtLevel).toBeNull();
  });

  it("stops at the first non-WIN level", async () => {
    const tower = stubTower("tower-1", [
      stubLevel("a", { verdict: "ok", cause: null, suggestedFix: null }),
      stubLevel("b", { verdict: "blocked", cause: "detected", suggestedFix: null }),
      stubLevel("c", { verdict: "ok", cause: null, suggestedFix: null }),
    ]);
    const rec = await runTower(tower, stubAdapter(), deps());
    expect(rec.levels.map((l) => l.levelId)).toEqual(["a", "b"]);
    expect(rec.levels[1].outcome).toBe("FAIL");
    expect(rec.stoppedAtLevel).toBe("b");
  });

  it("a PARTIAL with no fix downgrades to FAIL and stops", async () => {
    const tower = stubTower("tower-1", [
      stubLevel("a", { verdict: "gated", cause: "soft challenge", suggestedFix: null }),
    ]);
    const rec = await runTower(tower, stubAdapter(), deps());
    expect(rec.levels[0].outcome).toBe("FAIL");
    expect(rec.stoppedAtLevel).toBe("a");
  });

  it("an adapter failure becomes verdict=error / UNTESTABLE and stops", async () => {
    const tower = stubTower("tower-1", [
      stubLevel("a", { verdict: "ok", cause: null, suggestedFix: null }),
    ]);
    const rec = await runTower(tower, stubAdapter({ fail: true }), deps());
    expect(rec.levels[0].verdict).toBe("error");
    expect(rec.levels[0].outcome).toBe("UNTESTABLE");
    expect(rec.levels[0].cause).toContain("stub adapter failure");
    expect(rec.stoppedAtLevel).toBe("a");
  });

  it("records per-part timing for each level", async () => {
    const tower = stubTower("tower-1", [
      stubLevel("a", { verdict: "ok", cause: null, suggestedFix: null }),
    ]);
    const rec = await runTower(tower, stubAdapter(), deps());
    expect(rec.levels[0].parts.map((p) => p.part)).toEqual(["drive", "grade"]);
  });
});
