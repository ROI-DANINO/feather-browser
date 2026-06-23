import type { Page } from "playwright";

export type SiteClass = "standard" | "tier-c";

export interface StealthCheckResult {
  ok: boolean;
  warnings: string[];
}

/**
 * Layer 1 — CDP surface minimization is a "don't enable it" guarantee, not positive code.
 * The detection tell is Playwright auto-sending Runtime.enable when console/pageerror listeners
 * attach. Feather's real session path attaches none (audited; see plan Task 1 — the only
 * console/pageerror listeners live in src/debug/capture.ts, which is opt-in and gated on
 * input.debug, never wired onto a non-debug session). Do not add page.on("console") /
 * page.on("pageerror") on the session path. Enforcement lives in the self-test (anti-detection
 * probe) asserting Runtime.enable is absent on a clean session open.
 */

/** OBSERVABILITY ONLY — labels a URL's known bot-detection risk for logging. Never a control-flow gate. */
const TIER_C_DOMAINS = ["linkedin.com", "instagram.com", "facebook.com"];
export function classifySite(url: string): SiteClass {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return "standard";
  }
  return TIER_C_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`)) ? "tier-c" : "standard";
}

const MIN_JITTER_MS = 50;
const MAX_JITTER_MS = 150;

/**
 * A human-like per-keystroke delay in [50,150] ms. Called once per `type` call (uniform delay
 * across that call's keystrokes; varies call-to-call). Per-keystroke statistical variation is the
 * deferred kinematic spike — this is the honest v1 cadence.
 */
export function jitterDelayMs(): number {
  return MIN_JITTER_MS + Math.floor(Math.random() * (MAX_JITTER_MS - MIN_JITTER_MS + 1));
}
