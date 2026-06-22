# v2 security surface — shipped contracts inventory

> The security machinery that is **in code and stable** as of `v2-wrap @ 77abccb` (2026-06-16).
> This is the surface the rest of v2 (5b MFA, 5c CDP-attach, 5d Stealth) builds on. Code pointers
> are from the evidence sweep; line numbers are accurate as of this commit. Test counts marked
> "(journal)" were not re-run this session — see `META-ANALYSIS.md` §3.

## 1. Transport hardening — Gate A "A0"  ·  commit `854b4a8` (merged #5)

- **`createOriginHostGuard`** (`src/transport/middleware.ts:73-105`; the wider A0 block with its
  loopback/authority helpers spans `8-105`), wired into the Fastify
  `onRequest` hook (`src/transport/http.ts`). Blocks **DNS-rebinding** (Host must be loopback) and
  **CSRF** (cross-origin `POST/PUT/PATCH/DELETE` rejected).
- Tests: `tests/unit/transport/origin-host-guard.test.ts` + integration (journal: green).
- Stable for v2: every capability route sits behind this guard; agent traffic is origin/host-bound.

## 2. Capability model — Gate A "A1"  ·  commits `f7afbb8`, `d0e35e4`, `a7db198`

The control plane ADR-0010 specifies. Three privilege tiers; dangerous capabilities **off by
default**; grants are human-approved, single-use, TTL'd, audited, auto-revoked.

- **Session-hold primitive** (`src/capability/holds.ts`, commit `f7afbb8`) — refcounted holds with
  a `reason` (`mfa | human-approval | cdp-attach | shutdown`); teardown closures; revoke-on-release.
  Operations create holds, policy observes, **nothing toggles stealth directly**. *This is the seam
  5b MFA plugs into* (creates an `mfa` hold) — and the dependency break that lets Stealth move last.
  Tests: 11 unit (journal).
- **Capability-grant registry** (`src/capability/grants.ts`, commit `d0e35e4`) — opaque single-use
  nonces, `requested → granted → used` state machine, lazy TTL expiry, redacted `onEvent` audit
  seam. `CapabilityName = 'cdp-attach' | 'vault-unlock' | 'cookie-export'` (`:15`). Tests: 16 unit.
  **Honest gap:** only `cookie-export` has a live door; `cdp-attach` (→5c) and `vault-unlock`
  (→ADR-0008) are enum names with no implementation.
- **Policy / audit / approval / service** (`src/capability/{policy,audit,approval,service}.ts`,
  commit `a7db198`) — off-by-default dangerous-mode policy; append-only JSONL audit at
  `~/.local/state/feather/logs/audit/grants.jsonl`; CSP-hardened human approval page; session-close
  revocation. **Honest gap:** holds/grants are **in-memory** (`service.ts` constructor) — a restart
  wipes them; only the audit JSONL is durable.
- **Routes** (`src/transport/{approval-page,routes}.ts`): `POST /v1/sessions/:id/grants` returns
  `{grant}` only — no approval secret to the agent (`routes.ts:454-470`); the human approves
  **out-of-band** via `/v1/approvals/:humanToken` (`routes.ts:476-502`, a channel the agent never
  receives); cookie-export is gated at `capability.consume(sessionId, 'cookie-export')`
  (`routes.ts:506-525`); session close triggers `capabilities.revokeSession()` (`routes.ts:553`).
- Tests: `tests/integration/capability-gate.integration.test.ts` — 7 cases (request/approve/export,
  deny, CSRF, revoke-on-close, no-token-leak, audit trail) + 21 unit (journal).
- **Live proof (journal, manual, not CI):** 77 cookies mined through the full gate on warmed Gmail
  and reused in a fresh browser, 2026-06-15. Caveats in `META-ANALYSIS.md` §3.

## 3. Identity Model — Phase 5a  ·  commits `3674d82` (feat) + `6a72bc0` (chore)

A named, agent-attachable handle over a warmed Chromium profile.

- **Module** `src/identity/{types,store,manager}.ts`: `IdentityRecord`, `IdentityStore`,
  `IdentityManager`. Atomic tmp+rename writes; FS perms `0o700` dir / `0o600` file (`store.ts:19-23`).
- **Routes** `src/transport/identity-routes.ts:25-83` — six `/v1/identities` routes (create, list,
  get, delete, warm, mark-warm), token-auth'd. Errors via extracted `src/transport/http-helpers.ts`
  (`IDENTITY_NOT_FOUND`→404, `IDENTITY_ALREADY_EXISTS`→409).
- **Resolver seam** — `LaunchSessionInput.identityId` resolves via an injected `IdentityResolver`
  (`src/sessions/manager.ts:40-104`; wired at `src/index.ts:24-25`), avoiding an import cycle.
  `SessionRecord.identityId` flows through the lifecycle (`src/sessions/types.ts:30`).
- **Council S1–S5 baked into code:** S1 separable ids (`types.ts:21-22`); S2 explicit `markWarm()`
  no bus-inference (`manager.ts:113-131`); S3 opaque versioned policy blobs, **no** `StealthConfig`/
  `MfaConfig` imports (`types.ts:7-13`); S4 per-id write-mutex + `version` optimistic concurrency
  (`manager.ts:28-42`); S5 `vaultRef` redacted from views + `disablePasswordManager()` at create
  (`types.ts:37`, `manager.ts:74-75`).
- **Tests:** **399 unit — re-run live this session, 399/399 ✓**; identity integration 4/4 (journal);
  full integration 96/96 with one pre-existing niri red (journal); manual curl CRUD round-trip green
  (journal).
- **Honest gap (🟡 shipped-untested):** not yet exercised in a real multi-identity agent flow, nor
  under profile-lock contention (concurrent sessions on one identity). Unit/integration are
  synthetic; the true test comes with 5b/5c.

## 4. Human-in-control safety primitives  ·  commit `2c7773a`

Load-bearing for v2 pause/resume (MFA, CAPTCHA, manual login handoffs).

- **Navigation-survivable resume banner** (`src/commands/await-human.ts`) — a `domcontentloaded`
  listener re-injects the banner on each new main-frame document, so it follows the human across
  page changes (the Hebrew-Gmail-login case). Idempotent; detached on resolve.
- **Human-in-control guard** — while a pause is active, agent page-mutating commands
  (navigate/click/type/press/select-option) are refused with **`HUMAN_IN_CONTROL` (409)**;
  read-only commands stay allowed; **page-scoped** via `src/commands/pause-registry.ts` (tracks
  `pageId`, `isPagePaused`/`assertPageNotPaused`). Found live: an automated navigate yanked the
  human out mid-login → the bug became this guard.
- **Tests:** await-human integration **9/9** (journal); the commit also reported "366 unit" — the
  pre-5a count (now 399).

---

### What is NOT in this surface yet (so nobody assumes it is)

- No MFA handler (`src/mfa` does not exist) — 5b, planned.
- No stealth stack (`src/browser/stealth.ts` does not exist) — 5d, planned.
- No warmed-profile CDP-attach door (enum only) — 5c, unstarted.
- No credential vault backend — ADR-0008, deferred.
- No agent-facing MCP/tool surface — 5.0.1, deferred pending MCP spec stability.
- No Gate B (first-agent safety gate) — 5.0.2, unstarted.
