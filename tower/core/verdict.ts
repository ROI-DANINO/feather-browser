// tower/core/verdict.ts
import type { Grade, LevelOutcome, LevelVerdict } from "./types";

const MAP: Record<LevelVerdict, LevelOutcome> = {
  ok: "WIN",
  gated: "PARTIAL",
  blocked: "FAIL",
  error: "UNTESTABLE",
};

const present = (s: string | null): boolean => !!s && s.trim().length > 0;

/**
 * Map a grader verdict to a Tower outcome. THE PARTIAL INVARIANT: a `gated` verdict stays PARTIAL
 * only if it carries BOTH a cause and a suggestedFix (a partial with no actionable explanation is a
 * dead end for the user, so it downgrades to FAIL).
 */
export function decideOutcome(grade: Grade): LevelOutcome {
  const base = MAP[grade.verdict];
  if (base === "PARTIAL" && !(present(grade.cause) && present(grade.suggestedFix))) {
    return "FAIL";
  }
  return base;
}
