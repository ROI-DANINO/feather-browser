# Identity Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give agents a stable named handle — an **Identity** — that they attach to by name, which resolves to a warmed Chromium profile and carries default stealth/MFA configs and a dormant vault reference. Human warms once; agent attaches pre-authenticated; raw credentials never reach the agent.

**Architecture:** A new `src/identity/` module (types, JSON-file store with a per-identity write mutex, manager). Five new token-authenticated routes. `LaunchSessionInput` gains `identityId?`; `SessionRecord` gains `identityId?`. **Warm-status is explicit** — an awaited `identityManager.markWarm(id)` driven by human confirmation or a verified login signal. (Superseded the original "infer warm from a `SESSION_CLOSE_COMPLETED` bus event" design — see Build-Order Notes + Security Tasks.)

**Tech stack:** TypeScript, Fastify + Zod (HTTP), Vitest (tests), Node `fs/promises` (JSON file storage). No new dependencies.

**Spec:** `docs/specs/2026-06-07-identity-model-design.md`

---

## Build-Order Notes

**This plan is self-contained and can be executed before the Stealth Stack or MFA Handler are built.**

- `IdentityRecord` stores `stealthConfig` and `mfaConfig` — they are persisted and returned via the API.
- Applying them to a launched session (merging into `LaunchSessionInput`) is deferred: the Stealth Stack plan adds `LaunchSessionInput.stealthConfig`; the MFA Handler plan adds `LaunchSessionInput.mfaConfig`. Task 10 of this plan adds only `identityId` resolution and notes the merge point.
- `vaultRef` is stored as a string and ignored at runtime — it becomes active when ADR-0008 is accepted.

If Stealth Stack and/or MFA Handler are already built when this plan executes, Task 10 should perform the full merge. The implementing agent should check for the presence of `stealthConfig`/`mfaConfig` on `LaunchSessionInput` and merge if available.

---

## Security Tasks (folded from the council review, 2026-06-07 — do these)

> Source: `research/2026-06-07-council-design-review.md` + the Security addendum in
> `docs/specs/2026-06-07-identity-model-design.md`. These **modify** the numbered tasks below. Under
> the security-first re-sequencing, Identity is the **first** feature (Phase 5a) and is self-contained
> — it must not pre-commit cross-module type contracts.

- [ ] **S1 — Separable identifiers, not strict 1:1:1 (modifies Tasks 4, 7, 8).** Do **not** fuse
  identity / workspace / profile / session into one id. Keep the stable named handle but store
  **separable fields** — `defaultWorkspaceId`, `defaultProfileId` — each defaulting to `id`. Enforce
  "one active persistent session per profile" **in code** (the existing profile lock), not as the
  permanent domain model. Tests: an identity can carry a `defaultWorkspaceId` distinct from `id`;
  launch resolves the profile via `defaultProfileId`.
- [ ] **S2 — Explicit `markWarm()`, remove the bus-inference (replaces Tasks 3 + 6 bus listener).**
  Delete the `subscribeToClosedSessions()` warm-on-close listener. Add `async markWarm(id)` as a
  **direct awaited call**, driven by an explicit human confirmation or a verified login signal — not a
  session-close event. Rationale: the close bus is the *logging* bus (`src/logs/bus.ts`), and a close
  does not mean warm (failed login / logout / abandoned MFA / wrong account all close). Task 3
  (`workspaceId` on the close event) is no longer needed for warm-status; drop it unless used elsewhere.
- [ ] **S3 — Don't pre-commit cross-module type contracts (modifies Tasks 4, 8, 10).** Store
  stealth/MFA policy as **opaque/versioned references** (e.g. `stealthPolicy?: { v: number; … }` or an
  opaque blob), not by importing `StealthConfig`/`MfaConfig` from modules that don't exist yet. Remove
  the placeholder-import guard in favour of an opaque type. Merge the real types only when Stealth (5d)
  / MFA (5b) are built. This is what keeps Identity self-contained and first.
- [ ] **S4 — JSON store read-modify-write protection (modifies Task 5).** Atomic tmp+rename prevents
  partial reads, not lost updates. Add a **per-identity write mutex/queue** + an `updatedAt`/version
  field with optimistic concurrency. Test: two concurrent `markWarm`/update calls don't clobber each
  other. SQLite is a reasonable later alternative once state grows; **not required now** (guiding
  constraint: no DB).
- [ ] **S5 — Treat the warmed profile as credential-at-rest; gate `vaultRef` on Gate A (modifies
  Tasks 6, 10).** The profile dir already holds cookies / refresh tokens / DBSC keys — disabling the
  password manager protects stored *passwords*, not session material. Prerequisites before broad
  warmed-profile use: restrictive FS permissions, no world-readable / cloud-synced profile paths,
  per-identity deletion. Treat `vaultRef` as a **keyring locator (libsecret / GNOME Keyring / KWallet),
  not a JSON path**, and gate its activation on the Phase-5.0 safety gate
  ([[adr-0010-local-control-plane-capability-model]]), not only on ADR-0008. Consider **not** returning
  `vaultRef` in normal identity `GET` responses.

---

## Interfaces & Contracts (locked before tasks)

```typescript
// src/identity/types.ts

import type { StealthConfig } from "../browser/stealth";
import type { MfaConfig } from "../mfa/types";

export type WarmStatus = "cold" | "warm" | "unknown";

export interface IdentityRecord {
  id: string;
  name: string;
  sites: string[];
  stealthConfig: StealthConfig;
  mfaConfig: MfaConfig;
  vaultRef?: string;
  warmStatus: WarmStatus;
  lastWarmAt?: string;     // ISO timestamp
  createdAt: string;       // ISO timestamp
  updatedAt: string;       // ISO timestamp
}

export interface CreateIdentityInput {
  id: string;
  name: string;
  sites?: string[];
  stealthConfig?: StealthConfig;
  mfaConfig?: MfaConfig;
  vaultRef?: string;
}

export class IdentityNotFoundError extends Error {
  readonly code = "IDENTITY_NOT_FOUND";
  constructor(id: string) { super(`Identity not found: ${id}`); }
}
```

> **StealthConfig / MfaConfig import guards:** If `src/browser/stealth.ts` does not exist yet (Stealth Stack not built), define `type StealthConfig = { mode: string }` locally as a placeholder. Same for `MfaConfig`. The plan author notes these types exist in the stealth/MFA specs; use the real imports when available.

```typescript
// FeatherPaths additions (src/fs-layout.ts)
identitiesDir(): string  // path.join(this.dirs.data, "identities")
identityFile(id: string): string  // path.join(this.identitiesDir(), `${id}.json`)
```

```typescript
// SessionManager.close() — SESSION_CLOSE_COMPLETED log data gains:
data: { workspaceId: string }
// so IdentityManager can filter by workspaceId on the bus without calling back into SessionManager
```

```typescript
// LaunchSessionInput addition (src/sessions/manager.ts)
identityId?: string   // optional; if present, resolves workspaceId from the identity
```

```typescript
// SessionRecord addition (src/sessions/types.ts)
identityId?: string   // populated when session was launched via an identity
```

---

## Tasks

### Task 1 — `FeatherPaths` extensions + `ensureDirs`

**File:** `src/fs-layout.ts`

- [ ] Add `identitiesDir(): string` → `path.join(this.dirs.data, "identities")`
- [ ] Add `identityFile(id: string): string` → `path.join(this.identitiesDir(), \`${id}.json\`)`
- [ ] In `ensureDirs()`: add `path.join(d.data, "identities")` to the `toCreate` array

**Test:** `tests/unit/fs-layout.test.ts` (or existing equivalent) — assert `identitiesDir()` returns the expected path; assert `identityFile("foo")` returns `<identitiesDir>/foo.json`.

---

### Task 2 — New events in `src/logs/events.ts`

- [ ] Add to the `EVENTS` constant:
  ```typescript
  IDENTITY_CREATED: "identity.created",
  IDENTITY_WARMED:  "identity.warmed",
  ```
- [ ] Add both to `LIFECYCLE_EVENTS` (the set that flows through the SSE stream)

**Test:** verify the keys exist and the string values are the expected event name strings (type-check is sufficient; no runtime test needed for constants).

---

### Task 3 — Add `workspaceId` to `SESSION_CLOSE_COMPLETED` log data

**File:** `src/sessions/manager.ts`, in the `close()` method.

- [ ] Locate the `this.logger.log({ event: EVENTS.SESSION_CLOSE_COMPLETED, ... })` call
- [ ] Add `data: { workspaceId: session.workspaceId }` to that log call

This is the only change to `SessionManager` in this task. The logger already calls `emitBusEvent()` internally, so the bus event automatically carries the workspaceId.

**Test:** existing session close tests pass without modification. If there is a test that asserts on the `SESSION_CLOSE_COMPLETED` log payload, update it to include `workspaceId`.

---

### Task 4 — `src/identity/types.ts`

- [ ] Create `src/identity/types.ts` with the exact types from the contracts block above: `WarmStatus`, `IdentityRecord`, `CreateIdentityInput`, `IdentityNotFoundError`
- [ ] If `src/browser/stealth.ts` is absent, define `type StealthConfig = { mode: string }` as a local placeholder with a `// TODO: replace with import once Stealth Stack is built` comment. Same for `MfaConfig` if `src/mfa/types.ts` is absent.

**Test:** TypeScript compile check only (`tsc --noEmit` passes).

---

### Task 5 — `src/identity/store.ts`

```typescript
export class IdentityStore {
  constructor(private readonly identitiesDir: string);
  async save(record: IdentityRecord): Promise<void>;
  async load(id: string): Promise<IdentityRecord>;   // throws IdentityNotFoundError
  async list(): Promise<IdentityRecord[]>;
  async delete(id: string): Promise<void>;
  async exists(id: string): Promise<boolean>;
}
```

Implementation notes:
- `save()` → write `JSON.stringify(record, null, 2)` to `identitiesDir/<id>.json` (atomic: write to `<id>.json.tmp`, then `fs.rename`)
- `load()` → read and JSON.parse; if ENOENT, throw `IdentityNotFoundError`
- `list()` → `readdir(identitiesDir)`, filter `*.json`, load each; skip any that fail to parse (corrupted file = log warn, skip)
- `delete()` → `unlink`; if ENOENT, throw `IdentityNotFoundError`
- `exists()` → `access` check, returns boolean

**Test:** `tests/unit/identity/store.test.ts` using `tmp` dir (vitest `beforeEach` creates a temp dir, `afterEach` removes it):
- save → load round-trips correctly
- load non-existent id → throws `IdentityNotFoundError`
- list returns all saved records
- delete removes the file; double-delete throws `IdentityNotFoundError`
- exists returns true/false correctly

---

### Task 6 — `src/identity/manager.ts`

```typescript
export class IdentityManager {
  constructor(
    private readonly store: IdentityStore,
    private readonly paths: FeatherPaths,
    private readonly sessions: ISessionManager,
    private readonly logger: FeatherLogger
  );

  async create(input: CreateIdentityInput): Promise<IdentityRecord>;
  async get(id: string): Promise<IdentityRecord>;
  async list(): Promise<IdentityRecord[]>;
  async delete(id: string): Promise<void>;
  async warm(id: string): Promise<{ sessionId: string }>;
  subscribeToClosedSessions(): () => void;   // returns unsubscribe fn
}
```

Implementation details:

**`create(input)`**
1. Validate: `id` must be a non-empty slug matching `/^[a-z0-9][a-z0-9-]*$/` (throws `ValidationError` if not)
2. Check `store.exists(id)` → throw `IdentityAlreadyExistsError` (409) if true
3. Apply defaults: `stealthConfig ?? { mode: "secure" }`, `mfaConfig ?? {}`, `sites ?? []`
4. Call `disablePasswordManager(paths.profileDir(id))` — keeps raw creds out of the warm jar
5. Build and `store.save()` the record
6. Log `IDENTITY_CREATED` event
7. Return the record

**`warm(id)`**
1. Load identity
2. Call `sessions.launch({ workspaceId: id, profile: { kind: "persistent" }, browserMode: "chromium-headed-cdp" })`
3. Return `{ sessionId }`
(Warm-status is updated automatically by the bus listener below)

**`subscribeToClosedSessions()`**
```typescript
return onBusEvent((evt) => {
  if (evt.event !== EVENTS.SESSION_CLOSE_COMPLETED) return;
  const workspaceId = evt.data?.workspaceId as string | undefined;
  if (!workspaceId) return;
  void this.store.exists(workspaceId).then((exists) => {
    if (!exists) return;
    void this.store.load(workspaceId).then((record) => {
      record.warmStatus = "warm";
      record.lastWarmAt = new Date().toISOString();
      record.updatedAt = new Date().toISOString();
      void this.store.save(record).then(() => {
        void this.logger.log({ ts: new Date().toISOString(), level: "info",
          event: EVENTS.IDENTITY_WARMED, data: { identityId: workspaceId } });
      });
    });
  });
});
```

**Test:** `tests/unit/identity/manager.test.ts`
- `create` stores a record with correct defaults; `get` retrieves it
- `create` with duplicate id throws the expected error
- `create` calls `disablePasswordManager` (spy/mock)
- `delete` removes the record
- Bus listener: emitting `SESSION_CLOSE_COMPLETED` with `{ workspaceId: "roi-linkedin" }` on the bus causes the identity to become `warm: "warm"` (use a mock store, call the listener directly)

---

### Task 7 — `SessionRecord` + `LaunchSessionInput` additions

**File:** `src/sessions/types.ts`

- [ ] Add `identityId?: string` to `SessionRecord`
- [ ] Add `identityId?: string` to `LaunchSessionInput` (in `src/sessions/manager.ts`)

**File:** `src/sessions/session.ts` (wherever `toRecord()` is implemented)

- [ ] Include `identityId` in `toRecord()` return (pass through from the session's stored `identityId`)

**Test:** TypeScript compile check; existing tests pass unchanged.

---

### Task 8 — `LaunchSessionInput.identityId` resolution in `SessionManager`

**File:** `src/sessions/manager.ts`

- [ ] Accept `IdentityManager` as an optional constructor parameter (or inject via a setter — keep the constructor signature backward-compatible; `identityManager?: IdentityManager`)
- [ ] At the top of `launch()`, if `input.identityId` is set:
  1. Call `this.identityManager.get(input.identityId)` — throws `IdentityNotFoundError` (propagates as 404)
  2. Set `workspaceId = identity.id`
  3. Record `identityId` on the session (via `Object.defineProperty` or a constructor field, following the existing pattern)
  4. *(If Stealth Stack is built)* merge `stealthConfig = input.stealthConfig ?? identity.stealthConfig` into the session
  5. *(If MFA Handler is built)* merge `mfaConfig = input.mfaConfig ?? identity.mfaConfig` into the session

- [ ] `LOG SESSION_LAUNCH_REQUESTED` data block: add `identityId` if present

**Test:** `SessionManager` unit test — launch with `identityId` resolves the workspaceId from the mock `IdentityManager`; launch without `identityId` is unchanged.

---

### Task 9 — `GET /v1/sessions/:id` response includes `identityId`

**File:** `src/transport/routes.ts` (wherever session → response shape is built)

- [ ] Ensure `identityId` is included in the session response if present (it flows through `session.toRecord()` from Task 7; verify it is not stripped by the response schema)

**Test:** existing session launch + get integration test still passes; add assertion that `identityId` is present when launched with one.

---

### Task 10 — Five identity routes

**File:** `src/transport/routes.ts`

All five routes are token-authenticated (same `authenticate` guard as existing routes).

```
POST /v1/identities
  body: { id, name, sites?, stealthConfig?, mfaConfig?, vaultRef? }
  → 200 { ok: true, data: IdentityRecord }
  → 409 { ok: false, error: { code: "IDENTITY_ALREADY_EXISTS" } }
  → 400 { ok: false, error: { code: "VALIDATION_ERROR" } }

GET /v1/identities
  → 200 { ok: true, data: IdentityRecord[] }

GET /v1/identities/:id
  → 200 { ok: true, data: IdentityRecord }
  → 404 { ok: false, error: { code: "IDENTITY_NOT_FOUND" } }

DELETE /v1/identities/:id
  → 200 { ok: true, data: { deleted: true } }
  → 404 { ok: false, error: { code: "IDENTITY_NOT_FOUND" } }

POST /v1/identities/:id/warm
  → 200 { ok: true, data: { sessionId: string } }
  → 404 { ok: false, error: { code: "IDENTITY_NOT_FOUND" } }
  → 409 { ok: false, error: { code: "PROFILE_LOCKED" } }
```

Zod schemas follow the existing route pattern. `IdentityNotFoundError` maps to 404 (add to `ERROR_STATUS` map alongside `SessionNotFoundError`). `ProfileLockConflictError` (already exists for 409) handles the warm-on-locked profile case.

**Test:** `tests/unit/routes/identity.routes.test.ts` — unit-test each route with mock `IdentityManager`: happy path returns correct shape; 404 on unknown id; 409 on duplicate create.

---

### Task 11 — Integration test: identity lifecycle

**File:** `tests/integration/identity.integration.test.ts`

This test does NOT launch real Chromium (identity CRUD is FS-only). It starts the Feather HTTP server, calls the identity API, and asserts on responses.

- [ ] `POST /v1/identities` → 200, record matches input with defaults applied
- [ ] `GET /v1/identities/:id` → 200, matches created record
- [ ] `GET /v1/identities` → 200, includes the created record
- [ ] `DELETE /v1/identities/:id` → 200; subsequent `GET` → 404
- [ ] `POST /v1/identities` with duplicate id → 409
- [ ] `POST /v1/identities/:id/warm` with unknown id → 404
- [ ] `POST /v1/sessions` with `identityId` set → session launches with correct `workspaceId` (mocked `identityManager.get` to avoid real Chromium)

---

### Task 12 — Server startup wiring

**Files:** `src/transport/http.ts` + `src/index.ts`

- [ ] `startHttpServer` signature gains `identityManager: IdentityManager`
- [ ] `registerRoutes` call passes `identityManager` alongside `manager` and `paths`
- [ ] In `src/index.ts`:
  ```typescript
  const identityStore = new IdentityStore(paths.identitiesDir());
  const identityManager = new IdentityManager(identityStore, paths, manager, logger);
  const unsubscribeIdentity = identityManager.subscribeToClosedSessions();
  ```
- [ ] In the `shutdown()` function: call `unsubscribeIdentity()` before exiting
- [ ] Pass `identityManager` into `startHttpServer()` and on to `registerRoutes()`

**Test:** `npm test` and `npm run test:integration` pass fully green. `tsc --noEmit` clean.

---

### Task 13 — Final quality gate

- [ ] `npm test` — all unit tests green
- [ ] `npm run test:integration` — all integration tests green (including new identity tests)
- [ ] `tsc --noEmit` — zero type errors
- [ ] Manually verify: `POST /v1/identities` → `GET /v1/identities` → `DELETE /v1/identities/:id` round-trip using `curl` against a running dev server
