// Identity Model (Phase 5a) — a stable named handle for "a person acting on a set of sites".
// Design: docs/specs/2026-06-07-identity-model-design.md
// Council security re-sequencing (S1–S5) is baked into these shapes — see the inline notes.

/**
 * Opaque, versioned policy blob. The real Stealth (5d) / MFA (5b) config types merge in only when
 * those modules are built — we deliberately do NOT import `StealthConfig`/`MfaConfig` here.
 * (Council S3: don't pre-commit cross-module type contracts; keep Identity self-contained.)
 */
export interface VersionedPolicy {
  v: number;
  [key: string]: unknown;
}

export type WarmStatus = "cold" | "warm" | "unknown";

export interface IdentityRecord {
  id: string;                     // slug — the stable named handle
  name: string;                   // display label, e.g. "Roi – LinkedIn"
  sites: string[];                // advisory — origins this identity is known warmed on
  defaultWorkspaceId: string;     // separable from id (council S1); defaults to id
  defaultProfileId: string;       // separable from id (council S1); defaults to id
  stealthPolicy: VersionedPolicy; // opaque (council S3); default { v: 1, mode: "secure" }
  mfaPolicy: VersionedPolicy;     // opaque (council S3); default { v: 1 }
  vaultRef?: string;              // dormant keyring locator (council S5); ignored at runtime in 5a
  warmStatus: WarmStatus;
  lastWarmAt?: string;            // ISO timestamp
  createdAt: string;              // ISO timestamp
  updatedAt: string;              // ISO timestamp
  version: number;                // optimistic-concurrency counter (council S4)
}

/**
 * API-safe projection of an identity. `vaultRef` is replaced by a `hasVaultRef` boolean so the
 * secret locator never leaves the box in normal responses (council S5).
 */
export type IdentityView = Omit<IdentityRecord, "vaultRef"> & { hasVaultRef: boolean };

export function toIdentityView(record: IdentityRecord): IdentityView {
  const { vaultRef, ...rest } = record;
  return { ...rest, hasVaultRef: vaultRef !== undefined && vaultRef !== "" };
}

export interface CreateIdentityInput {
  id: string;
  name: string;
  sites?: string[];
  defaultWorkspaceId?: string;
  defaultProfileId?: string;
  stealthPolicy?: VersionedPolicy;
  mfaPolicy?: VersionedPolicy;
  vaultRef?: string;
}

export class IdentityNotFoundError extends Error {
  readonly code = "IDENTITY_NOT_FOUND";
  constructor(id: string) {
    super(`Identity not found: ${id}`);
    this.name = "IdentityNotFoundError";
  }
}

export class IdentityAlreadyExistsError extends Error {
  readonly code = "IDENTITY_ALREADY_EXISTS";
  constructor(id: string) {
    super(`Identity already exists: ${id}`);
    this.name = "IdentityAlreadyExistsError";
  }
}

export class IdentityValidationError extends Error {
  readonly code = "VALIDATION_ERROR";
  constructor(message: string) {
    super(message);
    this.name = "IdentityValidationError";
  }
}
