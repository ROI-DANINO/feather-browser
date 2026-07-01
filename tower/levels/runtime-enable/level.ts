// tower/levels/runtime-enable/level.ts
import { randomUUID } from "node:crypto";
import type { DetectorReport, Grade, Level, TowerTask } from "../../core/types";
import type { SinkRegistry } from "../../core/sink-registry";

export const RUNTIME_ENABLE_LEVEL_ID = "runtime-enable";

/** Default settle+drive budget. Must comfortably outlast the detector's 2500ms in-page settle window
 * plus the adapter's page-load drive, so a real report lands before the deadline fires `error`. */
const DEFAULT_TIMEOUT_MS = 15_000;

export interface RuntimeEnableLevelDeps {
  /** The shared nonce lifecycle store: `arm()`ed here, `awaitReport()`ed in grade(). */
  registry: SinkRegistry;
  /** Same-origin (127.0.0.1) base the challenge page is served from, e.g. `http://127.0.0.1:1234`. */
  baseUrl: string;
  /** Injectable nonce so tests are deterministic; defaults to crypto.randomUUID(). */
  nonce?: string;
  /** Injectable clock (mirrors sink-registry / brain) so tests fix the deadline. */
  now?: () => number;
  /** Absolute drive+grade budget in ms; also names the `error` cause. Defaults to 15s. */
  timeoutMs?: number;
}

/**
 * makeRuntimeEnableLevel — the L2 detectability level factory.
 *
 * Arms a fresh per-run nonce, hands the adapter a load/observe task at the same-origin challenge page,
 * and grades by AWAITING the environment's self-report (never the adapter's output, never an LLM):
 *
 *   report 'blocked' → blocked  (Runtime.enable leaked → tool detected → FAIL)
 *   report 'ok'      → ok       (clean → WIN)
 *   report 'gated'   → gated    (probe can't confirm → PARTIAL; carries cause+fix per the invariant)
 *   no report by T   → error    (untestable → UNTESTABLE; silence is NEVER guessed as blocked)
 *
 * The deadline is armed BEFORE the drive, so the page may beacon before `adapter.run` even resolves.
 */
export function makeRuntimeEnableLevel(deps: RuntimeEnableLevelDeps): Level {
  const now = deps.now ?? (() => Date.now());
  const timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const nonce = deps.nonce ?? randomUUID();
  const deadline = now() + timeoutMs;

  deps.registry.arm(nonce, { deadline });

  const task: TowerTask = {
    levelId: RUNTIME_ENABLE_LEVEL_ID,
    url: `${deps.baseUrl}/levels/runtime-enable?nonce=${nonce}`,
    goal:
      "Open this page and wait a few seconds while it loads. There is nothing to click or type — " +
      "just let the page finish loading and observe it. The page reports its own result.",
  };

  return {
    id: RUNTIME_ENABLE_LEVEL_ID,
    task,
    async grade(): Promise<Grade> {
      const report = await deps.registry.awaitReport(nonce, deadline);
      return mapReportToGrade(report, timeoutMs);
    },
  };
}

/** Pure report→Grade mapping (design §1.4). Exported for direct unit testing. */
export function mapReportToGrade(report: DetectorReport | null, timeoutMs: number): Grade {
  if (report === null) {
    return { verdict: "error", cause: `no report within ${timeoutMs}ms`, suggestedFix: null };
  }
  switch (report.verdict) {
    case "blocked": {
      const count = report.detail?.stackLookupCount;
      return {
        verdict: "blocked",
        cause: `Runtime.enable leaked (stackLookupCount=${String(count)})`,
        suggestedFix: null,
      };
    }
    case "ok":
      return { verdict: "ok", cause: null, suggestedFix: null };
    case "gated":
      // Both fields REQUIRED: decideOutcome downgrades a bare `gated` to FAIL (the PARTIAL invariant).
      return {
        verdict: "gated",
        cause: "probe could not confirm either way (possible V8 getter-guard)",
        suggestedFix:
          "run calibration; if classic probe is dead, swap to exposeFunctionLeak/mainWorldExecution",
      };
    case "error":
    default:
      // The page never emits `error` (Tower sets it on timeout); treat any such report defensively.
      return { verdict: "error", cause: `no report within ${timeoutMs}ms`, suggestedFix: null };
  }
}
