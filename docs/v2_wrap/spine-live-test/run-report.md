# Spine Live Test — Phase 1 Run Report

**Date:** 2026-06-23 · **NET VERDICT: PASS (v2 safety spine proven live) + 5b typed-code PROVEN LIVE
(real bug found & fixed).** Three runs:
**Run A (GitHub) = PARTIAL** (no security wall appeared); **Run B (Instagram) = PASS** — the brake +
human-handoff machinery held through a genuinely hard real wall (password + 2 CAPTCHAs + email-link
verification across 2 tabs); **Run C (5b inject) = PASS after fix** — driving the typed-code flow live
**exposed a real bug** (the MFA handler braked its *own* code-injection → `HUMAN_IN_CONTROL`), which we
root-caused, fixed (TDD, regression test), and re-ran live: Feather injected the human-relayed code
into the target field. The spine's safety is delivered by the `HUMAN_IN_CONTROL` brake + human-in-loop
(both held live), and the 5b typed-code convenience is now **proven live**, not just mock-tested.

**Plan:** [`../../specs/2026-06-23-spine-live-test-plan.md`](../../specs/2026-06-23-spine-live-test-plan.md) ·
**Design:** [`../../specs/2026-06-23-spine-live-test-design.md`](../../specs/2026-06-23-spine-live-test-design.md)

---

## Run A — GitHub (PARTIAL)

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

---

## Run B — Instagram (PASS — safety spine)

**Session:** `ses_cedae15ddf` · **Profile:** `scratch` (workspaceId) · **Account:** Instagram `roionly9` (sacrificial, scratch Gmail `roionly9@gmail.com`)
**Target rationale:** Roi flagged that IG login reliably throws a security wall — a guaranteed-wall
target (unlike GitHub, which didn't challenge).

### What happened (honest, grounded in the session JSONL)

1. Server up (10-min MFA timeout); headed `chromium-headed-cdp` session on the `scratch` IG profile.
2. Navigated to IG; landing splash → clicked **Log in** → login form rendered.
3. **Agent typed the username** (`roionly9@gmail.com`); verified in the field. Agent never typed the password.
4. **`await-human` password handoff** (`reason`, banner). **Brake assertion: agent `navigate` → `409
   HUMAN_IN_CONTROL`** (`req_ca3cc56b`). ✓
5. During the ~4-min pause the human handled a **genuinely hard real wall**: typed the password, solved
   **2 CAPTCHAs**, and opened a **second Gmail tab** to click IG's **"verify it's you" email link**.
   The session JSONL shows ~12 `tab.created/updated/closed` events in this window and **zero agent
   mutating actions** — the agent stayed frozen the entire time. The brake held across multi-tab,
   multi-step human activity.
6. **`await-human` → 200** (`resumedBy: human`, ~248s). Agent re-observed → **logged-in IG feed**;
   `img[alt]` = **"roionly9's profile picture"** (logged in confirmed). Screenshot:
   [`instagram-logged-in-feed.png`](instagram-logged-in-feed.png).

### Scorecard (spine safety)

| Condition | Result |
|---|---|
| Native drive (agent navigates/clicks/types username) | ✅ PROVEN LIVE |
| Human handoff absorbs the hard/secret steps (password + 2 CAPTCHAs + email-link) | ✅ PROVEN LIVE |
| `HUMAN_IN_CONTROL` brake holds through a messy multi-tab human session | ✅ PROVEN LIVE (`409`) |
| Resume + verify login | ✅ PROVEN LIVE (logged in as `roionly9`) |
| 5b **typed-code** path (Feather types a relayed 6-digit code via the tokened page) | ⚠️ NOT EXERCISED — IG's wall was CAPTCHA + email-*link*, not a typed code |

**Verdict: PASS for the v2 safety spine.** Harder than designed (IG threw a real gauntlet) and the
machinery held. The 5b code-typing handler is **built + mock-proven** (`src/mfa/*`, shipped `12ffa91`)
but never met a real typed-code wall — neither GitHub nor IG issued one. Owed nicety, not a blocker.

### Honest caveats

- **Password recovered from git history** to unblock the run (the throwaway `roionly9` IG password was
  redacted from the working tree but kept in history per Roi's accepted no-rewrite decision). So this
  run does not demonstrate the "agent never has access to the secret" property — that's the deferred
  credential-vault/injection gap. The handoff *machinery* is what's proven. (Roi: accepted for this run.)
- **Finding #3 reconfirmed:** real sites gate risky logins with **CAPTCHA + link/approval**, not typed
  codes, unless 2FA is explicitly enabled. To live-prove 5b's typed-code path, a future run needs an
  account with **TOTP/SMS 2FA enabled** so a 6-digit typed wall is guaranteed.

### Assets

- Warmed `roionly9` IG session persists on the `scratch` profile (logged in) — Cookie-Mine fuel.
- Screenshot: `instagram-logged-in-feed.png`. Session log: `~/.local/state/feather/logs/sessions/ses_cedae15ddf.jsonl`.

---

## Run C — 5b typed-code inject (PASS after a real bug fix)

**Sessions:** `ses_31cbd59921` (bug repro) → `ses_8044e9a5d5` (post-fix) · **Target:** Wikipedia search
box (`#searchInput`) — a stable real-origin input, no real MFA wall needed to exercise the mechanism.
**Why this run:** Roi pushed to actually test the one feature we kept calling "built + mock-proven" —
Feather typing a human-relayed code into a field. His insight: no Telegram needed; the resolve page is
a plain local tab. So we pointed an `mfa/challenge` at any field and drove the inject directly.

### The bug (found live)
1. Fired `mfa/challenge` (type `sms`, target `#searchInput`). Response carried only the **token-less**
   localUrl; the **tokened** resolve URL appeared only on the server console (humanToken kept off the
   agent-facing response — working as designed).
2. **Brake #2 confirmed:** during the pending challenge, agent `type` → `409 HUMAN_IN_CONTROL`; agent
   `observe` (read) → `200`; field stayed empty.
3. Human opened the tokened resolve page, entered `123456`, submitted → **`ok:false`,
   `HUMAN_IN_CONTROL`**: *"A human is in control of page … the agent cannot act until the pause is
   resumed."* **Feather blocked its own code-injection.**

**Root cause:** `MfaChallengeManager.resolveChallenge` (`src/mfa/manager.ts`) typed the code via the
normal `TypeHandler` **while the MFA pause was still active**; `TypeHandler` runs
`assertPageNotPaused` (`src/commands/type.ts`) → threw. The MFA pause that freezes the *agent* also
froze the resolution's *own* type. The mock-browser unit tests missed it because they stubbed **both**
the pause and the typeHandler, so the real interaction never ran.

### The fix (TDD)
- `TypeInput.allowDuringHumanControl?` (internal-only; absent from the HTTP `TypeSchema`, so an
  external/agent caller can never set it). `type.ts` skips the pause guard only when it's set.
- `resolveChallenge` sets `allowDuringHumanControl: true` on its sanctioned, origin-checked injection.
  The agent stays frozen through the entire resolution; only this one type is exempt, and the pause is
  released immediately after.
- **Regression test** (`tests/unit/mfa/manager.test.ts`): uses the **real** pause registry + a type
  stub enforcing the same guard — reproduces the exact `HumanInControlError` without the fix
  (proven red→green). Gates: typecheck clean, **438 unit** (+1), MFA integration 5/5.

### Re-run live (post-fix) → PASS
Fresh server with the fix → new challenge → human submitted `123456` on the resolve page →
**`#searchInput` value = `123456`**, challenge `status: "resolved"`, page un-braked
(`observe` → 200), events `mfa.challenge.created` → `mfa.challenge.resolved`. The code went
**separate tab → injected into the automated page**, agent frozen throughout, never seeing the code.

**Verdict: 5b typed-code PROVEN LIVE.** No Telegram required — a plain local resolve tab, exactly as
Roi predicted. The live test earned its keep: it found a real bug the mock tests could not.
