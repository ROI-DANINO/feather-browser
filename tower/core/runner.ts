// tower/core/runner.ts
import type { Adapter, LevelResult, RunRecord, Tower } from "./types";
import { Grade } from "./types";
import { stopwatch } from "./timing";
import { decideOutcome } from "./verdict";

export interface RunDeps {
  runId: string;
  startedAt: string;
  now: () => number;
}

/**
 * Drive `adapter` through `tower`'s ordered levels. Times a "drive" then a "grade" part per level,
 * maps verdict→outcome (PARTIAL invariant applied in decideOutcome), and STOPS on the first non-WIN.
 * An adapter throw becomes an `error` verdict (UNTESTABLE) and stops the walk.
 */
export async function runTower(tower: Tower, adapter: Adapter, deps: RunDeps): Promise<RunRecord> {
  const levels: LevelResult[] = [];
  let stoppedAtLevel: string | null = null;

  for (const level of tower.levels) {
    const sw = stopwatch(deps.now);
    let grade: Grade;
    try {
      await sw.part("drive", () => adapter.run(level.task));
      grade = Grade.parse(await sw.part("grade", () => level.grade()));
    } catch (e) {
      grade = {
        verdict: "error",
        cause: e instanceof Error ? e.message : String(e),
        suggestedFix: null,
      };
    }

    const outcome = decideOutcome(grade);
    levels.push({
      levelId: level.id,
      verdict: grade.verdict,
      outcome,
      cause: grade.cause,
      suggestedFix: grade.suggestedFix,
      totalMs: sw.totalMs(),
      parts: sw.parts(),
    });

    if (outcome !== "WIN") {
      stoppedAtLevel = level.id;
      break;
    }
  }

  return {
    runId: deps.runId,
    towerId: tower.id,
    toolId: adapter.id,
    startedAt: deps.startedAt,
    levels,
    stoppedAtLevel,
  };
}
