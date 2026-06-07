# Identity Model Design
**Date:** 2026-06-07
**Status:** 📐 Spec — ready for implementation planning
**Phase:** Phase 5 input (Agent Browsing Stack — Feature 3 of 3)
**Brief:** `docs/specs/2026-06-07-agent-browsing-stack-brief.md`
**Depends on:**
- `docs/specs/2026-06-07-stealth-stack-design.md` (`StealthConfig`, `StealthMode`)
- `docs/specs/2026-06-07-mfa-handler-design.md` (`MfaConfig`, `MfaChallengeManager`)
- `docs/specs/adr-0008-credentials-vault.md` (vault interface — frozen; referenced, not built)

---

## Goal

Give agents and users a stable, named handle for "a person acting on a set of sites" — an
**Identity** that an agent attaches to by name, which carries the warmed profile, default stealth
and MFA configs, and a dormant vault reference. Agents attach identities; they never hold raw
credentials.

**The guiding principle** (from the cookie-isolation spike and ADR-0008): the human authenticates;
the agent inherits the live session. The Identity Model makes that contract explicit, nameable, and
manageable from a single API.

**Guiding constraints (from the master brief):** local-first always; lightweight (no DB, no
daemon); legal (agent acts as the authorized user); gradual delivery (each part is useful on its
own; nothing is gated on vault being built).

---

## The Model

An Identity is a **named wrapper over a Chromium profile with policy metadata attached.**

```
Human warms the profile (logs in once)
  → Identity records: warm, last-warmed, which sites
  → Agent attaches: POST /v1/sessions { identityId: "roi-linkedin" }
  → Session opens on the warmed profile, pre-authenticated
  → Session inherits: StealthConfig, MfaConfig from the identity
  → Agent never sees a password
```

Three concepts compose the model:

| Concept | What it is | Exists today? |
|---------|-----------|---------------|
| **Profile** | Chromium profile directory (`~/.local/share/feather/profiles/<id>/profile`). Owned by `FeatherPaths.profileDir(workspaceId)`. | ✅ Yes — `FeatherPaths` |
| **Workspace** | A `workspaceId` string key that `FeatherPaths` uses to locate the profile. | ✅ Yes — `workspaceId` in `SessionRecord` |
| **Identity** | A named wrapper over a workspace with metadata: display name, site list, warm status, stealth/MFA defaults, vault reference. | ❌ New — this spec |

**An Identity IS a named workspace.** Its `id` field is the `workspaceId` passed to `SessionManager.launch`. No new path type needed — `paths.profileDir(identity.id)` resolves to the identity's profile. Creating an identity creates a named workspace that carries extra policy and metadata.

Existing anonymous sessions (launched with `workspaceId` only, no identity) continue working
unchanged. The identity layer is fully additive.

---

## IdentityRecord

```typescript
// src/identity/types.ts

import type { StealthConfig } from "../browser/stealth";
import type { MfaConfig } from "../mfa/types";

export type WarmStatus = "cold" | "warm" | "unknown";

export interface IdentityRecord {
  id: string;              // slug — used as workspaceId; e.g. "roi-linkedin", "work-gmail"
  name: string;            // display label — "Roi – LinkedIn"
  sites: string[];         // advisory — origin strings the identity is known to be warmed on
  stealthConfig: StealthConfig;   // default stealth config for sessions using this identity
  mfaConfig: MfaConfig;          // default MFA notification config for sessions using this identity
  vaultRef?: string;       // Phase 5 hook — key into CredentialsVault (ADR-0008); dormant in v1
  warmStatus: WarmStatus;  // advisory — updated by the warm flow and session close
  lastWarmAt?: string;     // ISO timestamp of last warm/session-close on this identity
  createdAt: string;
  updatedAt: string;
}
```

### Why `stealthConfig` and `mfaConfig` live on the identity

- **Per-identity stealth defaults** — a LinkedIn identity might always be `secure`; an internal
  staging identity might default to `assisted`. The session launch can still override, but the
  identity is the natural home for "what this person's browsing typically looks like."
- **Per-identity MFA routing** — a work identity notifies a work Telegram chat; a personal identity
  notifies personal. No more global Telegram config — the config travels with the identity.

### `vaultRef` — decoupled from the vault being built

`vaultRef` is a string key (e.g., `"roi-linkedin"`). In v1 it is stored and returned but ignored
at runtime. When ADR-0008 is accepted and the vault is implemented, the session-launch path
checks `identity.vaultRef`, unlocks the vault, and injects credentials. The Identity API is
stable — the vault implementation connects to the existing hook.

This is the same "designed-in seam" pattern as `TelegramNotifier` in the MFA handler: the
interface is present and stable; the implementation behind it follows when the spike clears.

---

## Architecture

### New module: `src/identity/`

```
src/identity/
  types.ts       — IdentityRecord, WarmStatus (above)
  store.ts       — IdentityStore (disk CRUD: JSON files per identity)
  manager.ts     — IdentityManager (business logic: create, get, list, delete, warm)
```

#### `src/identity/store.ts`

Thin FS layer. Each identity stored as `<feather-data>/identities/<id>.json`. No database.

```typescript
export class IdentityStore {
  constructor(private readonly identitiesDir: string);

  async save(record: IdentityRecord): Promise<void>;
  async load(id: string): Promise<IdentityRecord>;           // throws IdentityNotFoundError
  async list(): Promise<IdentityRecord[]>;
  async delete(id: string): Promise<void>;
  async exists(id: string): Promise<boolean>;
}
```

Storage path: `~/.local/share/feather/identities/<id>.json`. `ensureDirs` gains the
`identities/` subdirectory.

`FeatherPaths` gains:
```typescript
identitiesDir(): string {
  return path.join(this.dirs.data, "identities");
}
identityFile(id: string): string {
  return path.join(this.identitiesDir(), `${id}.json`);
}
```

#### `src/identity/manager.ts`

Business logic layer. Receives `IdentityStore` + `FeatherPaths` + `SessionManager` (for warm flow).

```typescript
export class IdentityManager {
  async create(input: CreateIdentityInput): Promise<IdentityRecord>;
  async get(id: string): Promise<IdentityRecord>;
  async list(): Promise<IdentityRecord[]>;
  async delete(id: string): Promise<void>;
  async warm(id: string): Promise<{ sessionId: string }>;
  async markWarm(id: string): Promise<void>;   // called by session close hook
}

export interface CreateIdentityInput {
  id: string;
  name: string;
  sites?: string[];
  stealthConfig?: StealthConfig;    // defaults to { mode: "secure" }
  mfaConfig?: MfaConfig;            // defaults to {}
  vaultRef?: string;
}
```

`warm(id)` implementation:
1. Look up the identity
2. Call `sessionManager.launch({ workspaceId: identity.id, profile: { kind: "persistent" }, browserMode: "chromium-headed-cdp" })`
3. Return the sessionId. The user now has a live headed browser to log into manually.
4. On session close: `SessionManager` emits `SESSION_CLOSED` on the event bus. `IdentityManager`
   subscribes at startup and updates `warmStatus: "warm"`, `lastWarmAt` when the closed session's
   `workspaceId` matches a known identity ID.

`SessionManager` is not modified beyond what it already does — it fires `SESSION_CLOSED` and knows
nothing about identities. `IdentityManager` is the listener; the coupling runs one way.

**Password manager policy:** `manager.create()` calls `disablePasswordManager(profileDir)` on
the identity's profile path at creation time. Credentials stay out of the warm jar from day one.

---

## API Routes

Five new routes, all token-authenticated:

```
POST /v1/identities
  body: { id, name, sites?, stealthConfig?, mfaConfig?, vaultRef? }
  → 200 { ok, data: IdentityRecord }

GET /v1/identities
  → 200 { ok, data: IdentityRecord[] }

GET /v1/identities/:id
  → 200 { ok, data: IdentityRecord }
  → 404 { ok: false, error: "IDENTITY_NOT_FOUND" }

DELETE /v1/identities/:id
  → 200 { ok, data: { deleted: true } }
  → 404 { ok: false, error: "IDENTITY_NOT_FOUND" }

POST /v1/identities/:id/warm
  → 200 { ok, data: { sessionId: string } }
  → 404 { ok: false, error: "IDENTITY_NOT_FOUND" }
  → 409 { ok: false, error: "PROFILE_LOCKED" }   (existing session already running on this profile)
```

`DELETE /v1/identities/:id` removes the identity record only. The Chromium profile on disk is
**not deleted** — profiles are durable; an identity deletion is a metadata operation. The user
can recreate the identity and it will inherit the existing warmed profile.

---

## Session Launch Integration

`LaunchSessionInput` gains one optional field:

```typescript
export interface LaunchSessionInput {
  workspaceId?: string;
  identityId?: string;    // new: if present, resolves to workspaceId + merges identity configs
  profile: { kind: ProfileKind };
  browserMode?: BrowserMode;
  viewport?: { width: number; height: number };
  proxy?: ProxyConfig | null;
  debug?: { trace?: boolean; screenshots?: boolean };
  stealthConfig?: StealthConfig;  // new: per-launch override (identity default if absent)
  mfaConfig?: MfaConfig;         // new: per-launch override (identity default if absent)
}
```

`SessionManager.launch()` resolution when `identityId` is present:
1. Look up the identity via `IdentityManager.get(identityId)`
2. Set `workspaceId = identity.id`
3. Merge `stealthConfig = input.stealthConfig ?? identity.stealthConfig`
4. Merge `mfaConfig = input.mfaConfig ?? identity.mfaConfig`
5. Proceed with the existing launch path — no other changes

`SessionRecord` gains two optional fields:

```typescript
export interface SessionRecord {
  // ... existing fields unchanged ...
  identityId?: string;   // new: populated when session was launched with an identityId
  mfaPending: boolean;   // from MFA Handler spec — also added here
}
```

The `identityId` field is informational — it lets the SSE stream and `GET /v1/sessions/:id`
tell observers which identity a session belongs to.

---

## Warm Flow (detailed)

The warm flow is the **human-logs-in-once** path. The minimal v1 sequence:

```
1. User: POST /v1/identities  { id: "roi-linkedin", name: "Roi – LinkedIn", sites: ["https://www.linkedin.com"] }
   → Feather creates identity record; disables password manager on the profile; returns IdentityRecord
   → warmStatus: "cold"

2. User: POST /v1/identities/roi-linkedin/warm
   → Feather launches a headed Chromium session on paths.profileDir("roi-linkedin")
   → Returns { sessionId: "abc123" }
   → Browser window opens; user logs into LinkedIn

3. User: POST /v1/sessions/abc123/close
   → Session closes cleanly
   → Feather updates identity: warmStatus: "warm", lastWarmAt: <now>

4. Agent: POST /v1/sessions { identityId: "roi-linkedin", profile: { kind: "persistent" } }
   → Feather opens a session on the same profile — already authenticated
   → Agent navigates to LinkedIn — no login prompt
```

Steps 2–3 are optional if the user has already warmed the profile via `npm run warm-session` with
the identity's workspaceId. They can skip to step 4 and manually call `PATCH /v1/identities/:id`
to mark it warm. (A PATCH endpoint is intentionally omitted from v1 to keep scope tight; warm
status can be updated by re-creating the identity with `warmStatus: "warm"` if needed.)

---

## Stealth and MFA Integration

### Stealth

When a session is launched with an identity:
- `stealthConfig` from the identity becomes the session default
- The stealth spec's `resolveStealthMode(config)` is called with this config — no new logic
- The agent can still override per-launch via `LaunchSessionInput.stealthConfig`

An identity created with no explicit `stealthConfig` defaults to `{ mode: "secure" }` — always
safe, never misconfigured by omission.

### MFA

When `MfaChallengeManager.createChallenge()` is called for a session that was launched with an
identity:
- The session's `mfaConfig` (resolved from the identity at launch time) is the notifier config
- If the identity has a Telegram config, challenges on this identity go to that chat
- If not, `ConsoleNotifier` fires as always

This is the "per-identity MFA routing" described above. The MFA handler is unchanged — it already
reads `MfaConfig` from the session. The identity is just the source of that config.

### The `needs-confirmation` Pattern

Both the MFA handler and the vault (when built) use the same result-type pattern:

```typescript
// MFA — already designed:
const { challengeId } = await feather.mfaChallenge(sessionId, { ... });
await feather.waitForMfaResolved(sessionId, challengeId);

// Vault — future; same shape:
const { unlockId } = await feather.vaultUnlock(sessionId, { vaultRef: identity.vaultRef });
await feather.waitForVaultUnlocked(sessionId, unlockId);
```

The Identity Model provides the `vaultRef` that makes the second call possible. The vault
implementation fills in the rest when ADR-0008 is accepted.

---

## Vault Decoupling (the explicit non-decision)

This spec does **not** unfreeze ADR-0008. The vault architecture and the Identity Model are
decoupled by design:

- The Identity Model is **useful today** without a vault: named warm profiles + default configs +
  an agent-attach API are valuable even when `vaultRef` is dormant.
- The vault is **safer to build later** once Spikes A/B clear and the backend choice is justified.
- The `vaultRef` field is a **stable hook** — it will not need to change when the vault is built.
- Identity v1 ships with `vaultRef` stored and returned but ignored at runtime.

When ADR-0008 is accepted:
1. `IdentityRecord.vaultRef` gains a runtime implementation in `SessionManager.launch()`
2. A new `POST /v1/sessions/:id/vault/unlock` route follows the `needs-confirmation` pattern
3. No identity data migrations needed — the field is already there

---

## Composition With Features 1, 2, and ADR-0008

| This feature CONSUMES | From |
|---|---|
| `StealthConfig`, `resolveStealthMode()` | **Stealth Stack (Feature 1)** |
| `MfaConfig`, `MfaChallengeManager` | **MFA Handler (Feature 2)** |
| `disablePasswordManager()` | **Core** (`src/browser/profile-policy.ts`) |
| `FeatherPaths.profileDir(workspaceId)` | **Core** (`src/fs-layout.ts`) |
| `LaunchSessionInput`, `SessionManager` | **Core** (`src/sessions/manager.ts`) |

| This feature EXPOSES | Consumed by |
|---|---|
| `IdentityRecord` / `IdentityManager` | **Phase 4b shell** — identity list drives a future identity picker in the GUI |
| `identityId` on `SessionRecord` | **SSE stream** — observers can filter events by identity |
| `vaultRef` seam | **ADR-0008 vault implementation** when Spikes A/B clear |
| `stealthConfig`/`mfaConfig` on `LaunchSessionInput` | Any future orchestration layer that wants per-launch overrides |

---

## Events

Two new events (added to `src/logs/events.ts` and `LIFECYCLE_EVENTS` for the SSE stream):

```typescript
IDENTITY_CREATED: "identity.created",
IDENTITY_WARMED:  "identity.warmed",   // emitted when warmStatus transitions to "warm"
```

No `identity.deleted` — deletion is a local metadata operation with no agent-visible consequences.

---

## Research the Implementing Agent Must Do First

- Read `docs/specs/2026-06-07-stealth-stack-design.md` — `StealthConfig`, `StealthMode`, `resolveStealthMode()`
- Read `docs/specs/2026-06-07-mfa-handler-design.md` — `MfaConfig`, `MfaNotifier`, session-stealth tie-in
- Read `src/fs-layout.ts` — `FeatherPaths`, `ensureDirs`; identity storage extends this
- Read `src/sessions/manager.ts` — `LaunchSessionInput`, `SessionManager.launch()` — the integration point
- Read `src/sessions/types.ts` — `SessionRecord`, `ISession` — fields to extend
- Read `src/browser/profile-policy.ts` — `disablePasswordManager()` — called at identity create
- Read `src/transport/routes.ts` — existing route patterns, Zod validation style, `ok()`/`fail()` helpers
- Read `docs/specs/adr-0008-credentials-vault.md` — understand the vault interface intent so the `vaultRef` seam is consistent with future direction
- Read `research/2026-06-05-cookie-isolation-spike-findings.md` — context for why warm profiles are safe to reuse

---

## What This Is Not

- Not a password manager. Feather does not store, generate, or autofill passwords. Credentials
  live in a vault (ADR-0008, not yet built) or in the user's existing manager (Proton Pass etc.).
  An Identity holds only a *reference* to where the vault entry lives — never the secret itself.
- Not a session multiplexer. One identity = one profile path. Running two simultaneous agent
  sessions on the same identity's profile will be blocked by the existing profile lock.
- Not a cloud identity store. Identities are JSON files in `~/.local/share/feather/identities/`.
  Nothing leaves the machine. No remote storage, no cloud sync, no external identity provider.
- Not a browser account sync. The warm profile is local. If the user's device changes, they warm
  again. Syncing profiles across devices is out of scope.
- Not a user authentication layer for Feather itself. Identities describe *target sites* an agent
  works on, not who is operating Feather.
- Not dependent on the vault being built. Every feature of the Identity Model except `vaultRef`
  runtime resolution works today, without ADR-0008.
- No cross-identity session sharing. The mapping is strict 1:1:1 — one identity, one profile, one
  session at a time. An agent session belongs to exactly one identity and no session may span or
  borrow across identities. The profile lock enforces this at runtime.
- No RBAC or multi-user access control. Feather is a single-user local tool. Identities are not
  principals in an authorization system — they are named profiles on the local machine.
