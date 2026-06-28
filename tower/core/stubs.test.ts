// tower/core/stubs.test.ts
import { describe, it, expect } from "vitest";
import { stubAdapter, stubLevel, stubTower } from "./stubs";

describe("stubs", () => {
  it("stubAdapter resolves by default and rejects when fail=true", async () => {
    await expect(stubAdapter().run({ levelId: "l", url: "u", goal: "g" })).resolves.toBeUndefined();
    await expect(
      stubAdapter({ fail: true }).run({ levelId: "l", url: "u", goal: "g" }),
    ).rejects.toThrow("stub adapter failure");
  });

  it("stubLevel returns its preset grade and a task derived from its id", async () => {
    const lvl = stubLevel("l1", { verdict: "ok", cause: null, suggestedFix: null });
    expect(lvl.task.levelId).toBe("l1");
    expect((await lvl.grade()).verdict).toBe("ok");
  });

  it("stubTower keeps level order", () => {
    const t = stubTower("tower-1", [
      stubLevel("a", { verdict: "ok", cause: null, suggestedFix: null }),
      stubLevel("b", { verdict: "ok", cause: null, suggestedFix: null }),
    ]);
    expect(t.levels.map((l) => l.id)).toEqual(["a", "b"]);
  });
});
