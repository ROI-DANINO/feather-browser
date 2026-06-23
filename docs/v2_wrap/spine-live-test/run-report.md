# Spine Live Test — Phase 1 Run Report

**Date:** 2026-06-23 · **Verdict:** **PARTIAL** (half the spine proven live; the MFA half had no real wall to drive)
**Plan:** [`../../specs/2026-06-23-spine-live-test-plan.md`](../../specs/2026-06-23-spine-live-test-plan.md) ·
**Design:** [`../../specs/2026-06-23-spine-live-test-design.md`](../../specs/2026-06-23-spine-live-test-design.md)
**Session:** `ses_b8ccf08dfb` · **Identity:** `gh-spine-test` · **Account:** GitHub `roionly9-byte` (throwaway, scratch Gmail `roionly9@gmail.com`)

## What we set out to prove

An agent drives a named Feather identity through a real GitHub login + emailed-code wall; the human
supplies the password and the code; the `HUMAN_IN_CONTROL` brake holds; the agent resumes logged-in,
never touching the raw password or the raw code. (Spec §2 four PASS conditions.)

## What actually happened (honest)

1. **Server up** with `FEATHER_MFA_TIMEOUT_MS=600000`; `/health` green; pid 18098 on `http://127.0.0.1:43131`.
2. **Identity `gh-spine-test`** already existed (cold). **Launched a headed `chromium-headed-cdp`
   session bound to it via `identityId`** — the launch envelope resolved
   `identityId → workspaceId: "gh-spine-test"`. *(This path was unreachable until Finding #1 was fixed
   earlier today — see below. This run is its first live exercise.)*
3. **Agent drove** to `github.com/login`, typed the **username** (`roionly9@gmail.com`) into the field
   (verified by reading the field value). Agent never typed the password.
4. **`await-human` password handoff:** the human typed the password, clicked Sign in, clicked Resume.
   The blocking call returned `resumedBy: "human"` after ~80s. **Agent never saw the password.**
5. **Brake assertion #1 (await-human pause):** while the human was in control, an agent `navigate`
   was refused with **`409 HUMAN_IN_CONTROL`** (`req_fb44d93c`). ✓
6. **Login succeeded → logged-in dashboard.** `github.com/` rendered the authenticated UI; the
   read-only `meta[name="user-login"]` returned **`roionly9-byte`** (GitHub emits this only when
   authenticated). Screenshot: [`logged-in-dashboard.png`](logged-in-dashboard.png).
7. **The emailed device-verification code wall NEVER APPEARED.** GitHub let a brand-new account log in
   from a fresh Chromium (same machine/IP) with no device-verification email. With no real wall, the
   5b MFA flow (challenge, brake #2, token-off-agent, code-in) had nothing genuine to bind to.
8. **Decision (Roi): bank PARTIAL, stop.** Declined to synthesize a contrived MFA challenge or chase a
   wall that may never fire on this machine.
9. **Marked the identity warm** (`warmStatus: "warm"`, version 2, `lastWarmAt` set); teardown.

## Scorecard vs. spec §2

| Condition | Result |
|---|---|
| (1) Native drive + agent never types the password | ✅ **PROVEN LIVE** |
| (2) MFA pause + humanToken kept off the agent | ⚠️ **NOT EXERCISED** — GitHub presented no challenge |
| (3) `HUMAN_IN_CONTROL` brake holds | ✅ **PROVEN LIVE** (await-human pause → 409). MFA-pause brake not exercised. |
| (4) Resume + verify login + mark warm | ✅ **PROVEN LIVE** (logged in as `roionly9-byte`, identity warm) |

## Brake evidence (the 409)

```
req_fb44d93c  navigate during await-human pause
→ 409 {"code":"HUMAN_IN_CONTROL","message":"A human is in control of page page_1e9d6a4297
   (session ses_b8ccf08dfb); the agent cannot act until the pause is resumed."}
```

Session JSONL (`~/.local/state/feather/logs/sessions/ses_b8ccf08dfb.jsonl`) timeline highlights:

| requestId | action | status | meaning |
|---|---|---|---|
| req_8560e403 | navigate | 200 | to github.com/login |
| req_bc61a047 | await-human | **400** | **Finding #2** — body used `prompt`; schema requires `reason` |
| req_fb44d93c | navigate | **409** | **brake #1 holds** (HUMAN_IN_CONTROL) |
| req_e6d081cd | await-human | 200 | resumed by human (~80s) |

> Note: two `type → 409` rows (`req_12256dd8`, `req_cf4fa185`) are **`REF_EXPIRED`**, not the brake —
> GitHub's login page re-renders after `domcontentloaded`, expiring the observe ref. Re-observe →
> re-type by fresh ref succeeded both times. (Operational lesson, not a brake event.)

## Findings

- **Finding #1 (fixed before the run, `4c75a1e`):** the HTTP `LaunchSchema` omitted `identityId`, so
  Zod stripped it and launch-by-identity was unreachable from the API — even though
  `SessionManager.launch` resolved it. Fixed (schema + `LaunchInput` + unit test). **This run is the
  first live proof** the fix works: the launch envelope carried `identityId`/`workspaceId`.
- **Finding #2 (plan/doc bug, not fixed in code):** the run plan's `await-human` example uses
  `{"prompt": ...}`, but the API schema requires **`reason`** (`AwaitHumanSchema`,
  `src/transport/routes.ts:178`). The malformed call returned 400 and registered no pause, which made
  the first brake check spuriously pass through (200) and navigate the page to example.com — recovered
  by re-navigating + re-typing. **Fix the plan doc to use `reason`.** (No code change needed.)
- **Finding #3 (environment / target behavior, honest data point):** GitHub did **not** challenge a
  brand-new account logging in from a fresh Chromium on the same machine/IP. The emailed-device-code
  wall this test was designed around did not materialize. This is the planned-for "honest outcome"
  variant: not a Feather failure, but it means the 5b MFA live-wall proof remains **owed** — 5b is
  still proven with a mock browser only.

## What remains owed

- **Live MFA-wall proof (5b):** still mock-only. Needs a real target that reliably presents a
  TOTP/SMS/email challenge to a Feather-driven session. Candidates for a future run: a service that
  always 2FA-walls a new-device login, or an account with TOTP pre-enabled so the wall is guaranteed.
- **Plan doc fix:** change the `await-human` body from `prompt` → `reason`.

## Assets

- Warmed identity `gh-spine-test` persists on disk (cold→warm this run) for the deferred Phase 2
  (warmed step-up).
- Screenshot: `logged-in-dashboard.png`.
- Session log: `~/.local/state/feather/logs/sessions/ses_b8ccf08dfb.jsonl`.
