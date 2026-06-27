// Pure verdict logic for the behavioral diagnostic. No I/O, no Feather.
// Load-bearing honesty rule (Roi, 2026-06-26): "no score" is a FAIL, not neutral —
// a session the detector cannot score at all is itself a detection tell.
// Honesty corollary (2026-06-26, after the abs.incolumitas outage): "no score" is only
// a FAIL when the detector is actually UP. A detector whose backend is DOWN can't grade
// anyone, so that's BLOCKED (not our failure) — the caller supplies `detectorDown`.

export type Outcome = "PASS" | "FAIL" | "BLOCKED";
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

/**
 * @param raw text read from the detector's behavioral-score field (or null if absent).
 * @param detectorDown true if the detector's scoring backend was found unreachable/5xx.
 *   When unscored: down ⇒ BLOCKED (can't grade us), up ⇒ FAIL (genuinely unscoreable).
 */
export function classify(
  raw: string | null | undefined,
  cfg: ClassifyConfig,
  detectorDown = false,
): Verdict {
  const score = parseScore(raw);
  if (score === null) {
    if (detectorDown) {
      return {
        state: "UNSCORED",
        score: null,
        outcome: "BLOCKED",
        reason:
          "detector backend (abs.incolumitas.com) is down — it returned no score for anyone, " +
          "so this run could not be graded. NOT a Feather failure; retry when the service is back up.",
      };
    }
    return {
      state: "UNSCORED",
      score: null,
      outcome: "FAIL",
      reason:
        "detector is reachable but returned no behavioral score — the session produced no scoreable " +
        "signal. Being unscoreable while the detector works is itself a tell.",
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
