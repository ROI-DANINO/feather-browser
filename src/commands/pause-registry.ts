import { randomBytes } from "crypto";

interface PendingPause {
  sessionId: string;
  reason: string;
  resolve: () => void;
}

const pending = new Map<string, PendingPause>();

export interface CreatedPause {
  token: string;
  resumePath: string;
  humanResumed: Promise<void>;
}

export function createPause(sessionId: string, reason: string): CreatedPause {
  const token = randomBytes(16).toString("hex");
  let resolve!: () => void;
  const humanResumed = new Promise<void>((r) => { resolve = r; });
  pending.set(token, { sessionId, reason, resolve });
  return { token, resumePath: `/v1/sessions/${sessionId}/resume?token=${token}`, humanResumed };
}

export function peekPause(token: string): { sessionId: string; reason: string } | undefined {
  const p = pending.get(token);
  return p ? { sessionId: p.sessionId, reason: p.reason } : undefined;
}

/** Settle a pause. Returns false for unknown/used token or a session mismatch. Single-use. */
export function resumePause(token: string, sessionId: string): boolean {
  const p = pending.get(token);
  if (!p || p.sessionId !== sessionId) return false;
  pending.delete(token);
  p.resolve();
  return true;
}

/** Drop a pause that ended some other way (signal/timeout/session close). */
export function discardPause(token: string): void {
  pending.delete(token);
}

/** Test-only: clear all pending pauses. */
export function _resetForTests(): void {
  pending.clear();
}
