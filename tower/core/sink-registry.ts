// tower/core/sink-registry.ts
import type { DetectorReport } from "./types";

/**
 * The result of a `record()` attempt — a discriminated union the server maps 1:1 to HTTP:
 *   unknown  → 410 (never armed)
 *   consumed → 409 (single-use replay)
 *   expired  → 410 (armed but past its deadline)
 *   mismatch → 400 (report body's nonce ≠ the routed nonce)
 *   recorded → 200 (accepted)
 */
export type RecordResult =
  | { status: "recorded" }
  | { status: "unknown" }
  | { status: "consumed" }
  | { status: "expired" }
  | { status: "mismatch" };

export interface SinkRegistry {
  /** Register a nonce as `armed` with an absolute-ms deadline. */
  arm(nonce: string, opts: { deadline: number }): void;
  /** The nonce state machine. See {@link RecordResult}. Single-use, deadline-gated, nonce-matched. */
  record(nonce: string, report: DetectorReport): RecordResult;
  /**
   * Resolve with the stored report if already recorded; else resolve when `record()` lands;
   * else resolve `null` when `deadlineMs` (absolute) passes. `null` means "no report" —
   * it is NEVER a guessed verdict. Unknown nonces resolve `null`.
   */
  awaitReport(nonce: string, deadlineMs: number): Promise<DetectorReport | null>;
}

type Waiter = {
  resolve: (report: DetectorReport | null) => void;
  timer: ReturnType<typeof setTimeout>;
};

type Entry = {
  status: "armed" | "consumed";
  deadline: number;
  report: DetectorReport | null;
  waiters: Waiter[];
};

export interface SinkRegistryDeps {
  /** Injectable clock (mirrors brain.ts) so tests drive fake time deterministically. */
  now?: () => number;
}

export function createSinkRegistry(deps: SinkRegistryDeps = {}): SinkRegistry {
  const now = deps.now ?? (() => Date.now());
  const entries = new Map<string, Entry>();

  return {
    arm(nonce, opts) {
      entries.set(nonce, { status: "armed", deadline: opts.deadline, report: null, waiters: [] });
    },

    record(nonce, report): RecordResult {
      const entry = entries.get(nonce);
      if (!entry) return { status: "unknown" };
      if (entry.status === "consumed") return { status: "consumed" };
      if (now() > entry.deadline) return { status: "expired" };
      if (report.nonce !== nonce) return { status: "mismatch" };

      entry.status = "consumed";
      entry.report = report;
      const waiters = entry.waiters;
      entry.waiters = [];
      for (const w of waiters) {
        clearTimeout(w.timer);
        w.resolve(report);
      }
      return { status: "recorded" };
    },

    awaitReport(nonce, deadlineMs): Promise<DetectorReport | null> {
      const entry = entries.get(nonce);
      // Unknown nonce, or already recorded → resolve synchronously.
      if (!entry) return Promise.resolve(null);
      if (entry.report !== null) return Promise.resolve(entry.report);
      // Already past the deadline with nothing recorded → no report.
      if (now() >= deadlineMs) return Promise.resolve(null);

      return new Promise<DetectorReport | null>((resolve) => {
        const delay = Math.max(0, deadlineMs - now());
        const timer = setTimeout(() => {
          const w = entry.waiters.indexOf(waiter);
          if (w !== -1) entry.waiters.splice(w, 1);
          resolve(null);
        }, delay);
        const waiter: Waiter = { resolve, timer };
        entry.waiters.push(waiter);
      });
    },
  };
}
