import { CapabilityGrantRegistry, type CapabilityName, type GrantEvent, type GrantRecord } from "./grants";
import { SessionHoldRegistry } from "./holds";
import { ApprovalStore } from "./approval";
import { DangerousModePolicy } from "./policy";
import { GrantAuditSink } from "./audit";
import { emitBusEvent } from "../logs/bus";
import type { EventName } from "../logs/events";

// ── Capability service (Gate A / A1) ─────────────────────────────────────────
// The server-owned facade that composes the slice-1/2/3 pieces into the live Gate-A flow:
//   request (policy-gated) → human approve/deny on the local page → consume-by-scope at the door,
//   with session-close / shutdown revocation. Every grant lifecycle event fans out to BOTH audit
//   surfaces (durable JSONL + the live SSE bus) via the registry's onEvent seam. Holds live here too
//   so the same revoke hammer tears down any owned live resources (MFA/CDP wire in later).
// See docs/specs/2026-06-11-a1-slice3-plan.md and adr-0010 §2/§5.

export interface CapabilityServiceOptions {
  policy: DangerousModePolicy;
  auditFile: string;
  /** Injectable clock, forwarded to the grant registry (TTL tests). */
  now?: () => number;
}

export type RequestResult =
  | { ok: true; grant: GrantRecord; humanToken: string; approvalPath: string }
  | { ok: false; reason: "disabled" };

export type ResolveResult =
  | { ok: true; outcome: "approved" | "denied" }
  | { ok: false; reason: "unknown-token" | "bad-csrf" | "gone" };

export class CapabilityService {
  readonly holds = new SessionHoldRegistry();
  private readonly grants: CapabilityGrantRegistry;
  private readonly approvals = new ApprovalStore();
  private readonly policy: DangerousModePolicy;
  private readonly audit: GrantAuditSink;

  constructor(options: CapabilityServiceOptions) {
    this.policy = options.policy;
    this.audit = new GrantAuditSink(options.auditFile);
    this.grants = new CapabilityGrantRegistry({
      now: options.now,
      onEvent: (event) => this.onGrantEvent(event),
    });
  }

  /** Agent-facing: ask for a Dangerous-tier grant. Refused unless the capability is opted-in. */
  requestGrant(sessionId: string, capability: CapabilityName, ttlMs?: number): RequestResult {
    if (!this.policy.isEnabled(capability)) return { ok: false, reason: "disabled" };
    const grant = this.grants.request(sessionId, capability, ttlMs !== undefined ? { ttlMs } : {});
    const { humanToken } = this.approvals.mint(grant.id);
    return { ok: true, grant, humanToken, approvalPath: `/v1/approvals/${humanToken}` };
  }

  /** Human page render data for a humanToken. Undefined if unknown/spent/revoked. */
  peekApproval(humanToken: string): { grant: GrantRecord; csrfNonce: string } | undefined {
    const pending = this.approvals.peek(humanToken);
    if (!pending) return undefined;
    const grant = this.grants.get(pending.grantId);
    if (!grant || grant.status !== "requested") return undefined;
    return { grant, csrfNonce: pending.csrfNonce };
  }

  /** Human approve/deny submission. CSRF-checked, single-use. */
  resolveApproval(humanToken: string, csrfNonce: string, action: "approve" | "deny"): ResolveResult {
    const peek = this.approvals.peek(humanToken);
    if (!peek) return { ok: false, reason: "unknown-token" };
    if (peek.csrfNonce !== csrfNonce) return { ok: false, reason: "bad-csrf" };
    const grant = this.grants.get(peek.grantId);
    if (!grant || grant.status !== "requested") {
      this.approvals.consume(humanToken, csrfNonce);
      return { ok: false, reason: "gone" };
    }
    this.approvals.consume(humanToken, csrfNonce);
    if (action === "approve") {
      this.grants.approve(grant.id);
      return { ok: true, outcome: "approved" };
    }
    this.grants.deny(grant.id);
    return { ok: true, outcome: "denied" };
  }

  /** Door-facing: spend the approved grant for (session, capability). */
  consume(sessionId: string, capability: CapabilityName): { ok: true } | { ok: false; reason: string } {
    const result = this.grants.consumeGranted(sessionId, capability);
    return result.ok ? { ok: true } : { ok: false, reason: result.reason };
  }

  /** Whether a capability is opted-in (the request route checks this for a precise 403). */
  isEnabled(capability: CapabilityName): boolean {
    return this.policy.isEnabled(capability);
  }

  /** Revoke hammer: session close, shutdown (MFA-open wires in with 5b). Tears down holds + grants. */
  async revokeSession(sessionId: string): Promise<void> {
    this.grants.revokeAllForSession(sessionId);
    await this.holds.releaseAllForSession(sessionId);
  }

  private onGrantEvent(event: GrantEvent): void {
    this.audit.record(event);
    emitBusEvent({ event: event.type as EventName, sessionId: event.grant.sessionId, ts: new Date().toISOString(), data: { grant: event.grant } });
    if (event.type === "grant.denied" || event.type === "grant.expired" || event.type === "grant.revoked" || event.type === "grant.used") {
      this.approvals.discard(event.grant.id);
    }
  }
}
