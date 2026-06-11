import { randomUUID, randomBytes } from "crypto";

// ── Capability-grant registry (Gate A / A1) ──────────────────────────────────
// A grant is permission to *start* one dangerous operation on one session — never an ambient or
// multi-capability credential. Shape per ADR-0010 §2 (resolved Q1): Feather mints an opaque
// single-use nonce backed by this server-side registry record; no signed token, no 0600 file. The
// nonce is surfaced to the *human* approval surface, never handed to the agent as a secret it holds.
// Lifecycle: requested → (approved | denied) → granted → used → {expired | revoked}. Pure
// infrastructure like holds.ts: the local approval page, the Dangerous-tier wiring, and the dual
// audit surface attach in later A1 slices — `onEvent` is the seam they attach to (events are
// redacted: they carry the record, never the nonce).
// See docs/specs/2026-06-11-gate-a-capability-system-design.md §3.

/** The three Dangerous-tier operations. The static bearer token alone is never sufficient for these. */
export type CapabilityName = "cdp-attach" | "vault-unlock" | "cookie-export";

export type GrantStatus = "requested" | "granted" | "denied" | "used" | "expired" | "revoked";

export type GrantEventType =
  | "grant.requested"
  | "grant.granted"
  | "grant.denied"
  | "grant.used"
  | "grant.expired"
  | "grant.revoked";

export interface GrantRecord {
  readonly id: string;
  readonly sessionId: string;
  readonly capability: CapabilityName;
  readonly status: GrantStatus;
  /** TTL applied from the moment of approval; a granted-but-unused grant dies on its own. */
  readonly ttlMs: number;
  /** ISO-8601 request time. */
  readonly requestedAt: string;
}

/** Redacted lifecycle event: the record only — the nonce never appears here. */
export interface GrantEvent {
  type: GrantEventType;
  grant: GrantRecord;
}

interface MutableGrant {
  id: string;
  sessionId: string;
  capability: CapabilityName;
  status: GrantStatus;
  ttlMs: number;
  requestedAt: string;
  /** Epoch ms of approval — start of the TTL window. */
  grantedAtMs?: number;
  nonce?: string;
}

export interface GrantRegistryOptions {
  /** Clock, injectable for TTL tests. Defaults to Date.now. */
  now?: () => number;
  /** Lifecycle observer — the seam the audit surfaces (bus + durable log) attach to. */
  onEvent?: (event: GrantEvent) => void;
}

const DEFAULT_TTL_MS = 60_000;

/**
 * Server-side registry of capability grants: opaque single-use nonces backed by scoped records
 * `{sessionId, capability, ttl, status}`. Expiry is lazy — a granted grant past its TTL flips to
 * `expired` the first time anything looks at it. Instance-scoped like SessionHoldRegistry — the
 * live server owns one; tests get a clean one each.
 */
export class CapabilityGrantRegistry {
  private readonly grants = new Map<string, MutableGrant>();
  private readonly byNonce = new Map<string, string>();
  private readonly now: () => number;
  private readonly onEvent: (event: GrantEvent) => void;

  constructor(options: GrantRegistryOptions = {}) {
    this.now = options.now ?? Date.now;
    this.onEvent = options.onEvent ?? (() => {});
  }

  /** Ask for permission to perform `capability` on `sessionId`. Approval is a separate human act. */
  request(sessionId: string, capability: CapabilityName, options: { ttlMs?: number } = {}): GrantRecord {
    const grant: MutableGrant = {
      id: `grant_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
      sessionId,
      capability,
      status: "requested",
      ttlMs: options.ttlMs ?? DEFAULT_TTL_MS,
      requestedAt: new Date(this.now()).toISOString(),
    };
    this.grants.set(grant.id, grant);
    this.emit("grant.requested", grant);
    return this.toRecord(grant);
  }

  /** Human approval: mint the single-use nonce and start the TTL window. Requested grants only. */
  approve(id: string): { nonce: string } {
    const grant = this.mustGet(id);
    if (grant.status !== "requested") {
      throw new Error(`Grant ${id} is ${grant.status}; only a requested grant can be approved.`);
    }
    const nonce = randomBytes(32).toString("base64url");
    grant.status = "granted";
    grant.grantedAtMs = this.now();
    grant.nonce = nonce;
    this.byNonce.set(nonce, grant.id);
    this.emit("grant.granted", grant);
    return { nonce };
  }

  /** Human denial of a requested grant. Terminal. */
  deny(id: string): void {
    const grant = this.mustGet(id);
    if (grant.status !== "requested") {
      throw new Error(`Grant ${id} is ${grant.status}; only a requested grant can be denied.`);
    }
    grant.status = "denied";
    this.emit("grant.denied", grant);
  }

  /** Spend the nonce to start the dangerous operation. Single-use: the nonce dies here either way. */
  redeem(nonce: string): { ok: true; grant: GrantRecord } | { ok: false; reason: string } {
    const id = this.byNonce.get(nonce);
    this.byNonce.delete(nonce);
    const grant = id === undefined ? undefined : this.grants.get(id);
    if (!grant) return { ok: false, reason: "unknown-nonce" };
    this.touch(grant);
    if (grant.status !== "granted") return { ok: false, reason: grant.status };
    grant.status = "used";
    grant.nonce = undefined;
    this.emit("grant.used", grant);
    return { ok: true, grant: this.toRecord(grant) };
  }

  /** Revoke one non-terminal grant. The auto-revoke triggers call this; the nonce dies with it. */
  revoke(id: string): void {
    this.revokeGrant(this.mustGet(id));
  }

  /** The revoke hammer: session close, an MFA challenge opening, shutdown. Terminal grants untouched. */
  revokeAllForSession(sessionId: string): void {
    for (const grant of this.grants.values()) {
      if (grant.sessionId !== sessionId) continue;
      this.touch(grant);
      if (grant.status === "requested" || grant.status === "granted") {
        this.revokeGrant(grant);
      }
    }
  }

  get(id: string): GrantRecord | undefined {
    const grant = this.grants.get(id);
    if (!grant) return undefined;
    this.touch(grant);
    return this.toRecord(grant);
  }

  /** Lazy expiry: a granted grant past its TTL flips to expired the first time it is noticed. */
  private touch(grant: MutableGrant): void {
    if (grant.status !== "granted" || grant.grantedAtMs === undefined) return;
    if (this.now() - grant.grantedAtMs > grant.ttlMs) {
      grant.status = "expired";
      grant.nonce = undefined;
      this.emit("grant.expired", grant);
    }
  }

  private revokeGrant(grant: MutableGrant): void {
    // The nonce→id mapping stays so a later redeem attempt reports "revoked" precisely (the redeem
    // state guard blocks it either way, and redeem consumes the mapping on any attempt).
    grant.status = "revoked";
    this.emit("grant.revoked", grant);
  }

  private mustGet(id: string): MutableGrant {
    const grant = this.grants.get(id);
    if (!grant) throw new Error(`Unknown grant: ${id}`);
    return grant;
  }

  private emit(type: GrantEventType, grant: MutableGrant): void {
    this.onEvent({ type, grant: this.toRecord(grant) });
  }

  private toRecord(grant: MutableGrant): GrantRecord {
    return {
      id: grant.id,
      sessionId: grant.sessionId,
      capability: grant.capability,
      status: grant.status,
      ttlMs: grant.ttlMs,
      requestedAt: grant.requestedAt,
    };
  }
}
