# 5b MFA Handler — Reconciliation Against Shipped Gate A

> **Status:** reconciliation note (2026-06-23). Updates the 2026-06-07 plan/design to shipped reality
> before building. Read alongside `2026-06-07-mfa-handler-plan.md` + `-design.md`.
> **Decision (Roi, 2026-06-23):** **reuse primitives, keep MFA a distinct feature** (Option 1) — MFA
> keeps its own module/routes/notifier/local-page, but internally stands on the shipped session-hold
> and pause primitives instead of reinventing them.

## Why this note exists

The 5b plan/design were authored 2026-06-07 assuming **Stealth was built before MFA** (the original
spine had MFA consuming `session.setStealthMode("assisted"/"secure")`). That ordering was **reversed**
(security-first spine: `gate → Identity → MFA → attach → Stealth last`), and two primitives shipped
since that the plan predates. Net effect: 5b gets **smaller and safer**, not bigger.

## What changed in the codebase since the plan

| Plan assumes | Reality now | Action |
|---|---|---|
| `session.setStealthMode("assisted"/"secure")` exists | **Does not exist anywhere in `src/`** (stealth deferred to 5d) | Replace every call with the session-hold primitive |
| MFA must build its own agent-suspension during the flow | `await-human` + `pause-registry` shipped: pause token, `HUMAN_IN_CONTROL` guard, SSE pause events, single-use `/resume` | MFA opens a (banner-free) pause → agent-suspension is free |
| S1: add a global Origin/Referer/Host anti-CSRF hook | `createOriginHostGuard` already runs globally (`src/transport/middleware.ts`) | S1 shrinks to the MFA-page-local token/nonce/CSP |
| S1/S2: invent a single-use humanToken + CSRF + strict-CSP page | `src/capability/approval.ts` already ships exactly this pattern (Gate A Slice 3) | Reuse that proven pattern, don't invent a second |

## The reconciled `MfaChallengeManager` lifecycle

Constructor **gains** `holds: SessionHoldRegistry` and the pause-registry functions
(`createPause`/`resumePause`/`discardPause`, imported or injected for testability). It **loses** all
`setStealthMode` references.

- **`createChallenge(input)`**
  1. `requireTargetForType(type, target)` (unchanged).
  2. `sessions.get(sessionId)` (throws `SESSION_NOT_FOUND` if missing).
  3. **Capture the create-time page origin/URL** (anti-phishing S3) keyed to the challenge's page.
  4. `const hold = holds.createHold(sessionId, "mfa")` — replaces `setStealthMode("assisted")`.
  5. `const pause = createPause(sessionId, "mfa", pageId)` — **banner-free** (no in-browser banner;
     the human uses the separate local page). This activates the existing `HUMAN_IN_CONTROL` guard so
     agent page-mutations are refused for the duration. Store `pause.token` on the challenge.
  6. Mint a **single-use `humanToken`** (256-bit CSPRNG), distinct from `challengeId` (S2). Store it.
  7. Log + SSE `mfa.challenge.created`; set the expiry timer; `notifier.notify(challenge, localUrl)`
     where `localUrl` carries the `humanToken`.

- **`resolveChallenge(challengeId, code, humanToken, ctx)`**
  1. Lookup + assert `pending`; **verify `humanToken`** (and the route verifies the CSRF nonce + same
     Origin via the global guard).
  2. `requireCodeForType(type, code)`.
  3. **Verify page origin unchanged** since create (S3) — else fail with a clear error, no typing.
  4. `totp`/`sms`: type the code via `TypeHandler` (sequential). `push`: skip typing.
  5. `await holds.release(hold)` + `resumePause(pause.token, sessionId)` — releases the agent.
  6. Mark `resolved`, clear timer, SSE `mfa.challenge.resolved`.

- **`expire` / session-close (S5)**
  - `holds.releaseAllForSession(sessionId, "mfa")` + `discardPause(token)` + clear timer; mark
    `timed-out`; SSE `mfa.challenge.expired`. Cancel pending challenges when the session closes.

## Task-by-task delta vs. the 2026-06-07 plan

| Tasks | Verdict |
|---|---|
| **1–5** (types, local-page renderer, notifiers, config) | **Keep as written** — pure units, no stealth/session dependency. Build first; fully unblocked. |
| **6** (`SessionRecord.mfaPending` + `setMfaPending`) | **Drop / make derivable.** `mfaPending` = `holds.has(sessionId, "mfa")`. Don't add session state unless the dashboard needs the field surfaced — then compute it in the record-builder from `holds`, no `setMfaPending` setter. |
| **8–10** (manager create/resolve/expire) | **Rebuild on holds + pause** per the lifecycle above. Test doubles assert `holds.createHold/release` + `createPause/resumePause` instead of `setStealthMode`. |
| **11** (command handlers) | Keep; create handler now also threads `pageId` (for origin capture) and the pause/hold wiring lives in the manager. |
| **12–13** (routes, schemas, wiring) | Keep, **harden the local page**: single-use `humanToken` in the URL, per-page CSRF nonce on submit, strict CSP, reusing `src/capability/approval.ts`. The global Origin/Host guard already covers CSRF-by-Origin. Manager construction gains the `SessionHoldRegistry` (the live one the server owns) + pause-registry. |
| **14** (full verification) | Unchanged — tsc + unit + integration green. |

## Out of scope / deferred (unchanged by this note)

- Stealth behavioral modes (`assisted`/`secure` semantics) — 5d/v2.5.
- Email-OTP auto-read, passkey/WebAuthn, hardware keys — post-v1 per the design.
- Vault-held TOTP seeds — Feature 3 / ADR-0008.
