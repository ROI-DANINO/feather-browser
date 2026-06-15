import { randomBytes } from "crypto";

interface PendingPause {
  sessionId: string;
  reason: string;
  pageId?: string;
  resolve: () => void;
}

const pending = new Map<string, PendingPause>();

export interface CreatedPause {
  token: string;
  resumePath: string;
  humanResumed: Promise<void>;
}

/** Thrown when an agent tries to act on a page that a human is currently in control of (an active
 * `await-human` pause). The agent must wait for the human to resume — see AwaitHumanHandler. */
export class HumanInControlError extends Error {
  readonly code = "HUMAN_IN_CONTROL";
  constructor(sessionId: string, pageId: string) {
    super(`A human is in control of page ${pageId} (session ${sessionId}); the agent cannot act until the pause is resumed.`);
    this.name = "HumanInControlError";
  }
}

export function createPause(sessionId: string, reason: string, pageId?: string): CreatedPause {
  const token = randomBytes(16).toString("hex");
  let resolve!: () => void;
  const humanResumed = new Promise<void>((r) => { resolve = r; });
  pending.set(token, { sessionId, reason, pageId, resolve });
  return { token, resumePath: `/v1/sessions/${sessionId}/resume?token=${token}`, humanResumed };
}

/** True if an active pause is holding this exact (session, page). Page-scoped: a pause on one tab
 * does not freeze another, and a pause created without a pageId scopes to no page. */
export function isPagePaused(sessionId: string, pageId: string): boolean {
  for (const p of pending.values()) {
    if (p.sessionId === sessionId && p.pageId !== undefined && p.pageId === pageId) return true;
  }
  return false;
}

/** Guard for agent-initiated page-mutating actions: throws HumanInControlError if a human holds
 * this page via an active pause. Read-only commands must NOT call this. */
export function assertPageNotPaused(sessionId: string, pageId: string): void {
  if (isPagePaused(sessionId, pageId)) throw new HumanInControlError(sessionId, pageId);
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
