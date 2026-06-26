// Pure verdict logic for the behavioral diagnostic. No I/O, no Feather.
// Load-bearing honesty rule (Roi, 2026-06-26): "no score" is a FAIL, not neutral —
// a session the detector cannot score at all is itself a detection tell.

export type Outcome = "PASS" | "FAIL";
export type ScoreState = "SCORED" | "UNSCORED";

export interface Verdict {
  state: ScoreState;
  score: number | null;
  outcome: Outcome;
  reason: string;
}

export interface ClassifyConfig {
  /** Boundary between human-like and bot-like once a numeric score exists. */
  humanThreshold: number;
  /** Which side of the boundary reads as human. CONFIRM LIVE for incolumitas (calibration knob). */
  direction: "higherIsHuman" | "lowerIsHuman";
}

/** @param raw text read from the detector's behavioral-score field (or null if absent). */
export function classify(raw: string | null | undefined, cfg: ClassifyConfig): Verdict {
  const score = parseScore(raw);
  if (score === null) {
    return {
      state: "UNSCORED",
      score: null,
      outcome: "FAIL",
      reason:
        "no behavioral score — the detector could not score this session (no cursor path). " +
        "Being unscoreable is itself a tell: real users always emit behavioral signal.",
    };
  }
  const human =
    cfg.direction === "higherIsHuman" ? score >= cfg.humanThreshold : score <= cfg.humanThreshold;
  return {
    state: "SCORED",
    score,
    outcome: human ? "PASS" : "FAIL",
    reason: `scored ${score} — reads ${human ? "human-like" : "bot-like"} (${cfg.direction}, threshold ${cfg.humanThreshold}).`,
  };
}

function parseScore(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const m = String(raw).trim().match(/-?\d+(\.\d+)?/); // first number in e.g. "Your Behavioral Score: 0.83"
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}
