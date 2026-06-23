# Spine Live Test — Design Spec

> **Status:** design (brainstormed + approved 2026-06-23). Not yet a plan; not yet run.
> **What it is:** the deliberately-deferred **live test of the v2 safety spine** — prove, on a real
> site for the first time, that an agent can drive a named warmed identity through a real login + code
> wall with the human in the loop and the safety brakes live. 5b was only ever proven with a **mock
> browser**; this is the live proof.
> **Reads:** [`2026-06-23-5c-native-vs-cdp-attach-decision.md`](2026-06-23-5c-native-vs-cdp-attach-decision.md)
> (why the native path *is* the spine's safety — this test proves it),
> [`2026-06-23-mfa-5b-reconciliation.md`](2026-06-23-mfa-5b-reconciliation.md) (how 5b works),
> [`../testing/anti-bot-testing-policy.md`](../testing/anti-bot-testing-policy.md) (the
> target-authorization rulebook — owned/authorized only).
> **Operator reference:** the `using-feather-browser` / `feather-human-handoff` skills +
> `docs/agent-playbook.md` own the exact endpoint calls; this doc stays at design altitude.

## 1. The one claim under test

> *An agent can drive a named Feather identity through a real login + code wall, with the human in the
> loop, and the safety brakes actually hold — and the agent never touches the raw password or sees the
> raw code.*

This is the v2 wrap exit criterion (`2026-06-23-v2-spine-completion-plan.md`), tested live for the
first time. Its outcome — not more building — tells us whether the spine is truly done.

## 2. PASS = four things must be true

1. **Agent drives via the native API** the whole way (`observe → act by ref → re-observe`), and never
   types the password — the human does, via the await-human handoff.
2. **The MFA challenge creates the pause + hold**, and the code is entered through the
   token-protected local page — the raw code never enters the agent's / LLM's space (the 256-bit
   `humanToken` stays off the agent-facing URL).
3. **The brake holds.** While the pause is active, the agent **deliberately** attempts a
   page-mutating action and is refused with `HUMAN_IN_CONTROL` (409). Designed-to-fail-safe: we try to
   break it on purpose and record that it refused.
4. **The agent resumes** after the human enters the code, reaches the logged-in state, and we
   **mark the identity warm** (5a) — leaving it ready for the deferred Phase 2.

## 3. Scope

- **Phase 1 (this spec, now):** fresh logged-out login → human-typed password → GitHub's
  unrecognized-device **emailed code wall** → MFA challenge → human enters code → resume → logged in →
  mark-warm. Reliably triggers a real code wall every run.
- **Phase 2 (deferred until Phase 1 is clean):** drive the now-warmed identity into a **step-up /
  re-auth** challenge mid-task — the purest "warmed identity + MFA brake" claim, but step-up
  challenges fire unpredictably, so it follows the reliable Phase 1.
- **NOT tested here — stealth / anti-bot coherence.** That is the separate fingerprint track
  (`session-identity-testing-design.md`), deferred to v2.5 / Stealth Stack (5d). If GitHub challenges
  the automated browser, that is **informative, not a spine failure** (see §6). Spine-done = *safe but
  not yet stealthy.*

## 4. Target + authorization

- **Target:** a **throwaway GitHub account**, created by hand, registered to the **scratch Gmail**
  (`roionly9@gmail.com`) so its device-verification emails land in an inbox the human can open.
- **Authorization (per the anti-bot policy):** a throwaway account we own = **`owned`**. Policy-clean.
  GitHub is automation-tolerant (dev-facing), so a failure reads as "the spine broke," not "we got
  bot-blocked" — which is exactly why it was chosen over Gmail/Instagram for the first clean proof.
- **Why emailed code, not an authenticator app:** a fresh automated browser is an **unrecognized
  device**, so GitHub emails a verification code on **every** login — a real code wall with no app to
  install. The human reads it from the scratch Gmail.

## 5. Roles — maximal agent autonomy, human only at the two safety touchpoints

The agent does **everything** it can on its own. The human appears at exactly two points, and those
two points **are the safety mechanism under test** — not friction we failed to remove.

- **Human, one-time before the run:** create the throwaway GitHub account, register it to the scratch
  Gmail, record the username + password somewhere the agent cannot see; confirm the Gmail is openable.
- **Human, during the run:** (a) type the **password** + submit when the agent pauses; (b) read the
  **emailed code** from Gmail and enter it on the local MFA page.
- **Agent (autonomous):** launch the identity-bound session, navigate, observe, type the username,
  fire the await-human pause, find the code field, fire the MFA challenge, **assert the brake**,
  resume, verify the logged-in state, mark-warm, capture evidence, report honestly.

## 6. The run, step by step

1. Create a Feather **identity** (5a) over a fresh GitHub profile; launch a **headed**
   (`chromium-headed-cdp`) session bound to it via `identityId` (so the human can watch + type and the
   warmed cookies persist into the identity).
2. Agent navigates to GitHub login, observes, types the **username** (an identifier, not a secret).
3. Agent fires **await-human** → human types the **password** + clicks Sign in → human resumes via the
   on-page banner. *(Exercises the navigation-survivable resume banner + handoff as a bonus.)*
4. GitHub shows the **"verify your device — enter the emailed code"** wall. Agent observes and locates
   the code-input field (its `ref`/target).
5. Agent fires the **MFA challenge** pointing `target` at that field. This takes the `mfa` hold + a
   banner-free pause → the `HUMAN_IN_CONTROL` brake goes live on the page, and the notifier surfaces
   the token-bearing local-page URL to the human.
6. **Brake assertion.** Agent intentionally attempts a page-mutating action → expects
   `HUMAN_IN_CONTROL` (409). Recorded as proof the brake holds.
7. Human opens the local page, reads the code from Gmail, enters it → Feather verifies the page origin
   is still GitHub (anti-phishing), types the code into the field (sequential), releases hold + pause.
8. Agent resumes, re-observes, completes any final verify click → **logged-in dashboard**.
9. Agent calls **mark-warm** on the identity. Phase 1 done; identity warm for Phase 2.

## 7. Honest-failure outcomes (each is a *successful* test)

Per the AGENTS.md testing-honesty rule, a clean failure-with-lesson is a PASS for the *test*, even if
the login itself doesn't complete. We record where it broke, whether the fallback fired, and how to
succeed next time:

- **GitHub challenges the fresh automated login (CAPTCHA/puzzle) before the code wall** → lesson: even
  a dev-tolerant site challenges fresh automation; the handoff may need to cover CAPTCHA (the
  `feather-human-handoff` skill's domain). This is a stealth signal (5d), *not* a spine failure.
- **Agent can't target/type into the code field** (cf. Instagram's finicky code inputs) → a
  targeting-recipe gap; record the working recipe.
- **The pause banner dies on a navigation GitHub does between password and code** (known limit) → a
  real finding about banner survivability.
- **The origin-unchanged anti-phishing check misfires** on a GitHub redirect → the check is too strict
  for this flow; record the redirect chain.
- **The notifier doesn't surface the local-page URL usefully** → an operator-ergonomics finding.

## 8. Environment notes

- **Headed** (`chromium-headed-cdp`) so the human can watch and type. Heads-up: on the niri tiling WM
  the window may render narrow (the known viewport gotcha — `--window-size` is tiled away); GitHub's
  login works narrow, so it's acceptable. A niri float-rule is the workaround if it bothers us.
- Server via `npm run dev`, launched from a shell carrying the Wayland display so the headed window
  appears. Stop by pid from `endpoint.json` (never `pkill -f`).
- All assets sacrificial: throwaway GitHub + scratch Gmail. No credential risk, nothing to rotate.

## 9. Deliverable

A short **run report** (no code — we operate the shipped spine): what happened at each step, the
`HUMAN_IN_CONTROL` 409 evidence, screenshots at login / code-wall / logged-in, and a
**`PASS` / `PARTIAL`** verdict with lessons. A `PARTIAL` with a recorded lesson is a real result, not
a failure to hide.

## 10. Open items for the plan / run prep

- Exact MFA `type` value for an emailed device code and the precise `createChallenge` field shape
  (resolve against the shipped `src/mfa/` + the playbook at run time).
- Whether the agent reliably distinguishes GitHub's device-verification wall from a 2FA-TOTP wall in
  `observe` (we are not enabling TOTP, so we expect the email path).
- Confirm the scratch Gmail is reachable for the human to read codes (it was logged out 2026-06-15 —
  the human just needs to be able to open it in a normal browser; Feather does **not** read it in the
  spine test).
- The minimal-useful run-report format (fold into the deliverable).
