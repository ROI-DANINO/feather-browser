import { randomUUID } from "crypto";

// ── Session-hold primitive (Gate A / A1) ─────────────────────────────────────
// A hold is the live presence-and-lifetime of a privileged operation on a session. Operations
// *create* holds; a policy layer (built later) *observes* them and decides behavior — e.g. suspend
// agent access while an `mfa` hold is up. Nothing toggles stealth or any mode directly; it reacts to
// holds. This placement in core (not in Stealth) is load-bearing: it breaks the MFA → Stealth
// dependency (MFA creates an `mfa` hold instead of calling setStealthMode), which is what frees the
// Stealth stack to be built last. See docs/specs/2026-06-11-gate-a-capability-system-design.md §2 and
// adr-0010 §4.
//
// A hold may *own a live resource* via a teardown closure: a `cdp-attach` hold owns the CDP/WS socket
// for the lifetime of the attachment, so releasing the hold closes the socket. This is what gives
// capability-grant revocation its teeth (a revoke trigger releases the owning hold → tears the live
// op down) — built on top of this primitive in a later A1 slice.

/** Why a hold exists. The policy layer keys behavior off these reasons. */
export type HoldReason = "mfa" | "human-approval" | "cdp-attach" | "shutdown";

/**
 * Teardown for a hold's owned live resource (e.g. close a CDP socket, drop a vault handle). Run
 * exactly once when the hold is released, best-effort: a throwing/rejecting teardown is reported via
 * `onTeardownError` and never propagates, so one stuck resource can't block revoking the rest.
 */
export type HoldTeardown = () => void | Promise<void>;

/** An opaque handle to a created hold. Identifier only — releasing happens through the registry. */
export interface HoldHandle {
  readonly id: string;
  readonly sessionId: string;
  readonly reason: HoldReason;
  /** ISO-8601 creation time. */
  readonly createdAt: string;
}

interface HoldRecord extends HoldHandle {
  teardown?: HoldTeardown;
  released: boolean;
}

export interface HoldRegistryOptions {
  /** Called when a hold's teardown throws/rejects. Defaults to a no-op (teardown is best-effort). */
  onTeardownError?: (error: unknown, hold: HoldHandle) => void;
}

/**
 * Refcounted session holds. Many holds may coexist for one session — including several with the same
 * reason; the policy layer cares whether *any* hold of a given reason is active (`has`/`count`), not
 * which one. Releasing a hold runs its teardown once (idempotent); `releaseAllForSession` is the
 * revoke-on-{session-close, MFA-open, shutdown} hammer.
 *
 * Instance-scoped (not a module singleton) so the live server owns one registry and tests get a clean
 * one each — no cross-test global leakage.
 */
export class SessionHoldRegistry {
  private readonly holds = new Map<string, HoldRecord>();
  private readonly onTeardownError: (error: unknown, hold: HoldHandle) => void;

  constructor(options: HoldRegistryOptions = {}) {
    this.onTeardownError = options.onTeardownError ?? (() => {});
  }

  /**
   * Create a hold on a session. The optional `teardown` runs once when the hold is released — pass it
   * when the hold owns a live resource that must be torn down on release/revoke.
   */
  createHold(sessionId: string, reason: HoldReason, teardown?: HoldTeardown): HoldHandle {
    const record: HoldRecord = {
      id: `hold_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
      sessionId,
      reason,
      createdAt: new Date().toISOString(),
      teardown,
      released: false,
    };
    this.holds.set(record.id, record);
    return this.toHandle(record);
  }

  /**
   * Release a hold by handle (or id). Runs its teardown once, awaiting an async teardown so callers
   * can sequence on the resource being gone. Idempotent: releasing an unknown or already-released
   * hold is a no-op — important because a revoke and the operation's own completion may both release
   * the same hold.
   */
  async release(handleOrId: HoldHandle | string): Promise<void> {
    const id = typeof handleOrId === "string" ? handleOrId : handleOrId.id;
    const record = this.holds.get(id);
    if (!record || record.released) return;
    await this.tearDown(record);
  }

  /**
   * Release every hold on a session (optionally only those of `reason`). The revoke hammer: session
   * close, an MFA challenge opening, shutdown. Tears down each owned resource best-effort and awaits
   * them all so the caller knows the live ops are gone before proceeding.
   */
  async releaseAllForSession(sessionId: string, reason?: HoldReason): Promise<void> {
    const victims = [...this.holds.values()].filter(
      (h) => h.sessionId === sessionId && !h.released && (reason === undefined || h.reason === reason),
    );
    await Promise.all(victims.map((h) => this.tearDown(h)));
  }

  /** Active holds for a session (optionally filtered by reason), oldest first. For the policy layer. */
  observe(sessionId: string, reason?: HoldReason): HoldHandle[] {
    return [...this.holds.values()]
      .filter((h) => h.sessionId === sessionId && !h.released && (reason === undefined || h.reason === reason))
      .map((h) => this.toHandle(h));
  }

  /** Whether any active hold (optionally of `reason`) exists for the session. */
  has(sessionId: string, reason?: HoldReason): boolean {
    for (const h of this.holds.values()) {
      if (h.sessionId === sessionId && !h.released && (reason === undefined || h.reason === reason)) {
        return true;
      }
    }
    return false;
  }

  /** Refcount: number of active holds (optionally of `reason`) for the session. */
  count(sessionId: string, reason?: HoldReason): number {
    let n = 0;
    for (const h of this.holds.values()) {
      if (h.sessionId === sessionId && !h.released && (reason === undefined || h.reason === reason)) n++;
    }
    return n;
  }

  private async tearDown(record: HoldRecord): Promise<void> {
    // Flip released first so a teardown that re-enters (or a concurrent revoke) sees it as gone and
    // can't run the closure twice.
    record.released = true;
    this.holds.delete(record.id);
    if (!record.teardown) return;
    try {
      await record.teardown();
    } catch (error) {
      this.onTeardownError(error, this.toHandle(record));
    }
  }

  private toHandle(record: HoldRecord): HoldHandle {
    return { id: record.id, sessionId: record.sessionId, reason: record.reason, createdAt: record.createdAt };
  }
}
