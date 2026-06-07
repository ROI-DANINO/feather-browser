# Session: Agent Browsing Stack — Identity Model Spec + Plan
**Date:** 2026-06-07
**Branch:** `claude/new-session-xdKS9`
**Commits:** `aebc613`, `247cfb2`

## What happened

Fresh chat. Loaded context via /start and went directly to the Identity Model spec session (Feature 3 of 3) without a brainstorm phase — inputs from brief, ADR-0008, cookie-isolation spike, Anchor research §3b, and the Stealth/MFA seams were clear enough to write straight.

### Identity Model spec (`docs/specs/2026-06-07-identity-model-design.md`)

Initial spec written in one pass, then revised per Roi's feedback:

**Rev 1 → Rev 2 changes:**
- Warm-status update: switched from callback (SessionManager → IdentityManager) to **event bus** — `SESSION_CLOSE_COMPLETED` carries `workspaceId` in data; `IdentityManager` subscribes via `onBusEvent`; `SessionManager` knows nothing about identities
- PATCH endpoint: **omitted** (YAGNI — atomic JSON overwrite via re-create is fine for local v1)
- Three guardrails added to "What This Is Not":
  - No cloud sync / remote storage
  - No cross-identity session sharing (strict 1:1:1 — identity:profile:session)
  - No RBAC

**Core design:**
- Identity ID = workspaceId (same key; `paths.profileDir(identity.id)` resolves the profile — no indirection layer)
- `IdentityRecord` carries: id, name, sites[], stealthConfig, mfaConfig, vaultRef? (dormant), warmStatus, lastWarmAt, createdAt, updatedAt
- `vaultRef` is a stable dormant seam — stored/returned but ignored at runtime until ADR-0008 Spikes A/B clear
- `disablePasswordManager()` called at create — raw creds can't accumulate in the warm jar
- Self-contained: useful without Stealth Stack or MFA Handler being built; stealthConfig/mfaConfig stored now, applied to sessions when those plans execute

### Implementation plan (`docs/specs/2026-06-07-identity-model-plan.md`)

13 TDD tasks:
1. FeatherPaths extensions + ensureDirs
2. IDENTITY_CREATED / IDENTITY_WARMED events
3. SESSION_CLOSE_COMPLETED gains workspaceId in data (the bus hook)
4. src/identity/types.ts
5. src/identity/store.ts (JSON/FS CRUD)
6. IdentityManager (create/get/list/delete/warm + bus listener for warm-status)
7. SessionRecord.identityId + LaunchSessionInput.identityId
8. SessionManager.launch() identityId resolution
9. GET /v1/sessions/:id includes identityId
10. Five identity routes
11. Integration test
12. Server startup wiring (src/index.ts + http.ts)
13. Final quality gate

## Decisions

| Decision | Rationale |
|----------|-----------|
| Event bus for warm-status (not callback) | Keeps SessionManager decoupled — it fires SESSION_CLOSE_COMPLETED and doesn't know identities exist |
| PATCH omitted v1 | YAGNI; atomic JSON overwrite via delete+re-create is fine locally |
| Identity ID = workspaceId | No indirection; FeatherPaths already resolves profiles by workspaceId |
| vaultRef dormant v1 | ADR-0008 not accepted; stable seam costs nothing now |
| No brainstorm phase | Inputs were settled enough; Roi confirmed direction mid-spec |

## Roi quotes

- "Rest to spec" — skip brainstorm, go direct
- "No brainstorm needed?"
- "Go with the Event Bus. Keep SessionManager decoupled — just fire SESSION_CLOSED and let IdentityManager listen."
- "PATCH: Omit for v1 (YAGNI). Atomic overwrites are fine for our local setup."
- "The direction is solid. You're clear to move this into the implementation plan."
- "Looking good"

## State at stop

All 3 Agent Browsing Stack specs + plans complete:
- Stealth Stack ✅ (`docs/specs/2026-06-07-stealth-stack-{design,plan}.md`)
- MFA Handler ✅ (`docs/specs/2026-06-07-mfa-handler-{design,plan}.md`)
- Identity Model ✅ (`docs/specs/2026-06-07-identity-model-{design,plan}.md`)

**Next:** Roadmap re-sequencing pass — assign phases/milestones to the 3 plans, incorporate integration research constraints, cut into work sessions.

**Note:** Stealth+MFA spec commits (`bb3c065`, `8a46065`) are on local `dev` but not pushed to `origin/dev`. Needs a push or a `dev` merge before re-sequencing pass.
