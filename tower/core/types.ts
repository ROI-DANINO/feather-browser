// tower/core/types.ts
import { z } from "zod";

/** The grader's native per-level verdict (Paterson ordinal). Set by the level's grader, never the core. */
export const LevelVerdict = z.enum(["ok", "gated", "blocked", "error"]);
export type LevelVerdict = z.infer<typeof LevelVerdict>;

/** What the Tower does with a verdict. */
export const LevelOutcome = z.enum(["WIN", "PARTIAL", "FAIL", "UNTESTABLE"]);
export type LevelOutcome = z.infer<typeof LevelOutcome>;

export const PartTiming = z.object({ part: z.string(), ms: z.number() });
export type PartTiming = z.infer<typeof PartTiming>;

/** What a level asks a tool to do. */
export const TowerTask = z.object({ levelId: z.string(), url: z.string(), goal: z.string() });
export type TowerTask = z.infer<typeof TowerTask>;

/** A grader's output: the verdict plus the explanation the PARTIAL invariant needs. */
export const Grade = z.object({
  verdict: LevelVerdict,
  cause: z.string().nullable(),
  suggestedFix: z.string().nullable(),
});
export type Grade = z.infer<typeof Grade>;

export const LevelResult = z.object({
  levelId: z.string(),
  verdict: LevelVerdict,
  outcome: LevelOutcome,
  cause: z.string().nullable(),
  suggestedFix: z.string().nullable(),
  totalMs: z.number(),
  parts: z.array(PartTiming),
});
export type LevelResult = z.infer<typeof LevelResult>;

export const RunRecord = z.object({
  runId: z.string(),
  towerId: z.string(),
  toolId: z.string(),
  startedAt: z.string(),
  levels: z.array(LevelResult),
  stoppedAtLevel: z.string().nullable(),
});
export type RunRecord = z.infer<typeof RunRecord>;

/** Payload the challenge page self-posts out-of-band to the sink, keyed by per-run nonce. */
export const DetectorReport = z.object({
  nonce: z.string(),
  detectorId: z.string(),
  verdict: LevelVerdict,
  detail: z.record(z.unknown()).optional(),
});
export type DetectorReport = z.infer<typeof DetectorReport>;

/** A tool driver. Drives the tool to the task's URL/goal; throws on a drive error. Never grades. */
export interface Adapter {
  id: string;
  run(task: TowerTask): Promise<void>;
}

/** A challenge level. The adapter runs first, then grade() returns the verdict + explanation. */
export interface Level {
  id: string;
  task: TowerTask;
  grade(): Promise<Grade>;
}

/** An ordered set of levels — "tower 1", "tower 2", … */
export interface Tower {
  id: string;
  levels: Level[];
}
