// tower/core/smoke.test.ts
// End-to-end of the Chunk-1 spine: run a stub tower, persist the record, read it back.
import { describe, it, expect, afterEach } from "vitest";
import { rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runTower } from "./runner";
import { appendRun, readRuns } from "./store";
import { stubAdapter, stubLevel, stubTower } from "./stubs";

const file = join(tmpdir(), `tower-smoke-${process.pid}.jsonl`);
afterEach(() => { if (existsSync(file)) rmSync(file); });

describe("chunk-1 spine smoke", () => {
  it("runs a stub tower, stops on the FAIL, and persists a readable record", async () => {
    const tower = stubTower("tower-1", [
      stubLevel("detect", { verdict: "ok", cause: null, suggestedFix: null }),
      stubLevel("security", { verdict: "blocked", cause: "canary leaked", suggestedFix: "add guard" }),
    ]);
    let t = 0;
    const rec = await runTower(tower, stubAdapter(), {
      runId: "smoke-1", startedAt: "2026-06-28T00:00:00Z", now: () => (t += 1),
    });
    appendRun(file, rec);

    const back = readRuns(file);
    expect(back).toHaveLength(1);
    expect(back[0].stoppedAtLevel).toBe("security");
    expect(back[0].levels.map((l) => l.outcome)).toEqual(["WIN", "FAIL"]);
  });
});
