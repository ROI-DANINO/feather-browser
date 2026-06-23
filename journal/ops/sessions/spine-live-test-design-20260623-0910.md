# Session — Spine Live Test: Designed, Planned, Prepped (caught Finding #1 before the browser opened)

**When:** 2026-06-23 ~06:00–09:10 IDT
**Phase:** 4a — Feather v1 / v2 spine build-complete; this session = the deferred **live-testing brainstorm** → design + plan + run-prep.
**Desk:** browser.
**Branch:** `dev`. Commits this session: `b8e9745` (design spec), `f3c1ceb` (run plan).

## What this session was

The v2 safety spine is build-complete on paper (Gate A + 5a Identity + 5b MFA), proven only with a
**mock browser**. This session ran the deliberately-deferred **live-testing brainstorm** to design how
to prove it live, wrote the spec + plan, and began executing the run — which immediately surfaced a
real gap.

## Done

- **`/start`** → oriented (Phase 4a, spine build-complete, next = live-testing brainstorm).
- **Brainstorming skill** → settled the test via five forks with Roi:
  1. **Track = spine *safety* test** — NOT the anti-bot/fingerprint track (that's a separate program,
     already canonicalized into `docs/testing/anti-bot-testing-policy.md` +
     `docs/specs/2026-06-23-session-identity-testing-design.md`, deferred to v2.5/5d). The anti-bot
     research file Roi flagged is only the **target-authorization rulebook** here.
  2. **Phase 1 = fresh login + code wall** (reliable), **then** Phase 2 = warmed step-up (Roi: "first
     1 then 2").
  3. **Target = controlled throwaway GitHub + emailed device-verification code**, inbox = scratch
     Gmail (`roionly9@gmail.com`). Owned target = policy-clean; dev-tolerant so a failure reads as
     "spine broke," not "bot-blocked."
  4. **Run mode = operate by hand**, zero new code.
  5. **Autonomy = 2 human touchpoints only** (password + code) — those steps *are* the safety
     machinery under test. Reconciled Roi's "do everything autonomously" instinct: self-serving the
     code would bypass 5b entirely and leave the spine unproven.
- **Wrote + committed:**
  - Design spec → `docs/specs/2026-06-23-spine-live-test-design.md` (`b8e9745`).
  - Run plan (11-task operate-by-hand runbook) → `docs/specs/2026-06-23-spine-live-test-plan.md` (`f3c1ceb`).
- **Run prep executed:** server up (port 35331, `FEATHER_MFA_TIMEOUT_MS=600000`), health green,
  identity `gh-spine-test` created (`defaultWorkspaceId=gh-spine-test`, `warmStatus: cold`). Server
  **stopped** at this /stop (pid was 701359).

## Finding #1 (the headline result — a real spine gap, caught before driving)

**The HTTP launch route cannot bind a session to an identity.** `LaunchSchema` (`src/transport/routes.ts:49-61`)
omits `identityId`; Zod strips unknown keys, so `launchHandler.execute(input)` never receives it. The
session *manager* fully supports launch-by-identity (`src/sessions/manager.ts:92-104` resolves
`identityId → identity.defaultWorkspaceId`), and `LaunchSessionInput`/`SessionRecord` carry the field —
but the **transport schema was never wired**, so the seam is **unreachable from the public API**. The
5a work shipped the identity CRUD routes + the manager seam, and tests exercised the manager directly,
so the transport gap slipped through.

- **Impact:** you can create identities and `mark-warm` them, but you can't actually *launch* a
  session bound to one over HTTP — the spine's "agent drives a named identity" claim isn't reachable
  via the API today.
- **Run workaround (didn't block):** launch by `workspaceId: "gh-spine-test"` (persistent) — same
  profile dir the identity's `defaultWorkspaceId` resolves to; cookies warm into the same profile;
  `mark-warm` is a separate id-keyed flip. Only the cosmetic session↔identity link goes unexercised.
- **Fix (next session, before the run):** add `identityId: z.string().optional()` to `LaunchSchema`,
  with a transport test that launching with an `identityId` resolves to the identity's workspace.

## Operational facts grounded from code (for the run)

- **`MfaType` = `totp | sms | push`** — there is **no `email`**. An emailed code rides under
  `type: "sms"` (label only; behavior = type the code into `target`). (`src/mfa/types.ts`)
- **humanToken delivery:** no Telegram configured → default **`ConsoleNotifier`** prints the **tokened**
  resolve URL (`…/v1/mfa/<id>?t=<token>`) to **server stdout**; the agent reads the server log to hand
  it to the human. The create-challenge response's `localUrl` is token-LESS. (`src/mfa/notifier.ts`, `manager.ts`)
- **Default MFA timeout = 300_000ms (5min)** → run with `FEATHER_MFA_TIMEOUT_MS=600000`. (`src/mfa/config.ts`)
- **Identity create schema:** `{id, name, defaultWorkspaceId?, defaultProfileId?, sites?, …}` —
  NOT `workspaceId`/`label`. (`src/transport/identity-routes.ts:9-18`)
- **`npm run daily:scratch`** opens the scratch profile (standalone `warm-session.ts`, own pid/log,
  does NOT clobber the test server's `endpoint.json`/`control-token`; different profile → no lock
  clash). Scratch Gmail likely **logged out since 2026-06-15**.

## Left unfinished

- The live run itself (plan Tasks 4–11): **blocked on Roi creating the throwaway GitHub account** +
  giving the username. No run report yet.

## Next concrete action (Roi's call: fix Finding #1 first)

1. **Fix Finding #1** — wire `identityId` into `LaunchSchema` (TDD: transport test). Small, isolated.
2. **Then the live run** — Roi creates the GitHub throwaway (→ `roionly9`, no app-2FA), shares the
   username; restart server (`FEATHER_MFA_TIMEOUT_MS=600000 npm run dev`); launch persistent headed
   session bound to `gh-spine-test` (now via `identityId`, once #1 is fixed); drive plan Tasks 4–11.

## Decisions

- Spine *safety* test, not the anti-bot/fingerprint track.
- Phase 1 (fresh login + code) before Phase 2 (warmed step-up).
- Throwaway GitHub + emailed code via scratch Gmail; operate-by-hand; 2 human touchpoints.
- No blog this session (owed line filed).
- Next session fixes Finding #1 before running.

## Verbatim Roi quotes

- "i want the agent to do whatever it can autonomsly. the scratch account is connected to roionly9? if yes it can actually do alsmost everything on its own am i right?"
- "is it relevant for this brainstorming?" (re the anti-bot research file)
- "proceed to the plan"
- "Run it now"
- "whats the commend to open the scratch profile"
- "next session fix Finding #1 first"

## Risks / blockers

- `dev` green + in sync with `origin/dev` before this /stop's tracking commit. No running server.
- The identity `gh-spine-test` persists on disk (cold) for the next run.
