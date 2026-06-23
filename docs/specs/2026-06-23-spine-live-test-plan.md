# Spine Live Test — Phase 1 Run Plan

> **For agentic workers:** this is an **operate-by-hand runbook**, not a code/TDD plan — no source
> changes. The agent (Claude, driving Feather via the `using-feather-browser` + `feather-human-handoff`
> skills) executes the tasks in order; the human (Roi) does exactly two steps (password, code). Steps
> use checkbox (`- [ ]`) syntax for tracking. Each task ends at an independently-checkable checkpoint.

**Goal:** Prove the v2 safety spine live — an agent drives a named Feather identity through a real
GitHub login + emailed-code wall, the human supplies the password and the code, the
`HUMAN_IN_CONTROL` brake holds, and the agent resumes logged-in — never touching the raw password or
the raw code.

**Architecture:** No new code. Drive the shipped HTTP API. 5a Identity binds the profile; the native
`observe → act → re-observe` loop drives GitHub; the await-human pause covers the password; the 5b MFA
challenge covers the code; both pauses trip the existing `HUMAN_IN_CONTROL` guard. Evidence comes from
screenshots + the per-session JSONL + the brake's 409 response.

**Tech Stack:** Feather Browser HTTP API (Fastify), `chromium-headed-cdp`, the operator skills.

**Spec:** [`2026-06-23-spine-live-test-design.md`](2026-06-23-spine-live-test-design.md). Reads:
[`2026-06-23-mfa-5b-reconciliation.md`](2026-06-23-mfa-5b-reconciliation.md),
[`../testing/anti-bot-testing-policy.md`](../testing/anti-bot-testing-policy.md).

## Global Constraints

- **Operate-by-hand only — zero source changes.** Any code idea that surfaces is logged as a finding, not built.
- **Headed:** `browserMode: "chromium-headed-cdp"` so the human can watch + type. Server started from a shell carrying `WAYLAND_DISPLAY`/`DISPLAY`.
- **Sacrificial assets only:** throwaway GitHub + scratch Gmail (`roionly9@gmail.com`). Never create/point at a `primary` profile; never point cookie-export at `primary`.
- **MFA type:** `MfaType` is `totp | sms | push` — there is **no `email`**. An emailed code rides under **`type: "sms"`** (label only; behavior = "type the code into `target`").
- **MFA timeout:** default is **300_000 ms (5 min)**. Run the server with `FEATHER_MFA_TIMEOUT_MS=600000` (10 min) so reading Gmail isn't rushed.
- **humanToken delivery:** no Telegram configured → the default **`ConsoleNotifier`** prints the tokened resolve URL to the **server stdout** (`[mfa] sms challenge for "…" — resolve at: http://…/v1/mfa/<id>?t=<token>`). The agent reads the server log to get that URL and hands it to the human.
- **Server lifecycle:** endpoint at `/run/user/1000/feather/run/endpoint.json` (`baseUrl` field), token at `/run/user/1000/feather/run/control-token`; auth header `X-Feather-Token`. **Stop the server by pid from `endpoint.json` — never `pkill -f`.**
- **Testing honesty:** a clean failure-with-lesson is a PASS for the *test*. Record `PARTIAL` outcomes exactly as they happened; do not retry-loop to force a green.

---

### Task 1: Human one-time setup — throwaway GitHub + scratch Gmail (Roi)

**Owner:** Roi (human). The agent waits for confirmation before Task 2.

- [ ] **Step 1:** Create a new throwaway GitHub account by hand (normal browser), registered to `roionly9@gmail.com`. Do **not** enable TOTP 2FA (we want the emailed device-verification path).
- [ ] **Step 2:** Verify the signup confirmation email arrives at the scratch Gmail and complete signup.
- [ ] **Step 3:** Record the GitHub **username + password** somewhere the agent cannot see (the agent must never read them).
- [ ] **Step 4:** Confirm you can open the scratch Gmail in a browser (to read codes during the run). If it needs a login, log in now.

**Checkpoint:** account exists, signup email arrived at `roionly9`, creds recorded out of agent view, Gmail openable. Roi tells the agent "setup done."

---

### Task 2: Bring up the Feather server (headed-capable, 10-min MFA timeout)

**Files:** none (operational). Artifacts: `endpoint.json`, `control-token`.

- [ ] **Step 1:** From a shell with the Wayland display, start the server in the background with a generous MFA timeout:

```bash
cd /home/roking/Desktop/Projects/feather-browser
FEATHER_MFA_TIMEOUT_MS=600000 npm run dev
```

- [ ] **Step 2:** Capture the base URL and token:

```bash
cat /run/user/1000/feather/run/endpoint.json   # read the "baseUrl" field
cat /run/user/1000/feather/run/control-token    # the X-Feather-Token value
```

- [ ] **Step 3:** Verify health (substitute the captured `BASE` + `TOKEN`):

```bash
curl -s "$BASE/health" -H "X-Feather-Token: $TOKEN"
```

Expected: `{"ok":true,...}` envelope.

**Checkpoint:** `/health` returns ok; `BASE` + `TOKEN` captured for reuse; server stdout is being captured (the agent must be able to read it later for the MFA URL).

---

### Task 3: Create the GitHub identity + launch a headed session bound to it

**Interfaces produced:** `IDENTITY_ID` (from create), `SESSION_ID` (from launch), `PAGE_ID` (default page).

- [ ] **Step 1:** Create the identity (5a) for the throwaway profile:

```bash
curl -s "$BASE/v1/identities" -H "X-Feather-Token: $TOKEN" -H "content-type: application/json" \
  -d '{"workspaceId":"gh-spine-test","label":"GitHub throwaway (spine live test)"}'
```

Expected: `{ ok:true, data:{ identity:{ id, workspaceId, ... } } }` → record `IDENTITY_ID`.

- [ ] **Step 2:** Launch a headed session bound to the identity:

```bash
curl -s "$BASE/v1/sessions" -H "X-Feather-Token: $TOKEN" -H "content-type: application/json" \
  -d '{"identityId":"<IDENTITY_ID>","browserMode":"chromium-headed-cdp"}'
```

Expected: a session envelope → record `SESSION_ID` (and the default `PAGE_ID` if returned). A headed Chromium window opens.

**Checkpoint:** headed window visible on screen; `SESSION_ID` captured; `GET $BASE/v1/sessions/$SESSION_ID/health` reports the CDP target alive.

> **niri note:** the window may tile narrow (known `--window-size` gotcha). GitHub login works narrow — acceptable. Float-rule workaround only if it obstructs viewing.

---

### Task 4: Drive to GitHub login; agent types the username

**Skill:** drive via `using-feather-browser` (`observe → act by ref → re-observe`).

- [ ] **Step 1:** Navigate to the login page:

```bash
curl -s "$BASE/v1/sessions/$SESSION_ID/navigate" -H "X-Feather-Token: $TOKEN" -H "content-type: application/json" \
  -d '{"url":"https://github.com/login"}'
```

- [ ] **Step 2:** `observe` the page; locate the **username/email** field ref and the **password** field ref.
- [ ] **Step 3:** `type` the username (an identifier, not a secret) into the username ref.

**Checkpoint:** username is entered in the field (verify via `observe` or `extract type:"value"`); the password field ref is known for Task 5. The agent has **not** typed the password.

---

### Task 5: await-human password handoff (human types the secret)

**This exercises the resume-banner handoff + the brake on the await-human pause.**

- [ ] **Step 1:** Fire the await-human pause (agent yields control):

```bash
curl -s "$BASE/v1/sessions/$SESSION_ID/await-human" -H "X-Feather-Token: $TOKEN" -H "content-type: application/json" \
  -d '{"reason":"Type the GitHub password and click Sign in, then click Resume."}'
```

This call **blocks** until the human resumes; the on-page **Resume banner** appears.

- [ ] **Step 2 (brake check on await-human):** *Before* the human resumes, from a second call attempt an agent page-mutation and confirm it is refused:

```bash
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/v1/sessions/$SESSION_ID/navigate" \
  -H "X-Feather-Token: $TOKEN" -H "content-type: application/json" -d '{"url":"https://example.com"}'
```

Expected: **`409`** with `HUMAN_IN_CONTROL`. Record it.

- [ ] **Step 3 (human):** Roi types the password into the password field, clicks GitHub's **Sign in**, then clicks the **Resume** banner.
- [ ] **Step 4:** The blocking await-human call returns; agent re-`observe`s.

**Checkpoint:** await-human returned on resume; the 409 brake response is recorded; GitHub now shows the **"verify your device — enter the code we emailed"** wall. *(If a CAPTCHA/puzzle appears instead → honest-failure outcome: record where and stop, per §7 of the spec — that's a stealth/5d signal, a successful test.)*

---

### Task 6: Fire the MFA challenge on the emailed-code field

**Interfaces produced:** `CHALLENGE_ID`, `RESOLVE_URL` (tokened, from server stdout).

- [ ] **Step 1:** `observe` the device-verification page; locate the **code-input field** ref (`CODE_REF`).
- [ ] **Step 2:** Create the MFA challenge pointing `target` at the code field (`sms` carries the emailed code):

```bash
curl -s "$BASE/v1/sessions/$SESSION_ID/mfa/challenge" -H "X-Feather-Token: $TOKEN" -H "content-type: application/json" \
  -d '{"type":"sms","target":<CODE_REF>,"prompt":"GitHub device-verification code (check roionly9 Gmail)"}'
```

Expected: `{ ok:true, data:{ challengeId, localUrl, expiresAt } }` → record `CHALLENGE_ID`. (`localUrl` here is token-LESS — do **not** hand that one out.)

- [ ] **Step 3:** Read the **server stdout** for the ConsoleNotifier line and capture the **tokened** URL:

```
[mfa] sms challenge for "GitHub device-verification code ..." — resolve at: http://127.0.0.1:<port>/v1/mfa/<CHALLENGE_ID>?t=<token>
```

Record that full URL as `RESOLVE_URL`.

**Checkpoint:** `CHALLENGE_ID` recorded; `RESOLVE_URL` (with `?t=`) captured from the server log; the `mfa` hold + banner-free pause are now active (the page is braked).

---

### Task 7: Brake assertion on the MFA pause (designed-to-fail-safe)

- [ ] **Step 1:** With the MFA pause active, attempt an agent page-mutation and confirm refusal:

```bash
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/v1/sessions/$SESSION_ID/click" \
  -H "X-Feather-Token: $TOKEN" -H "content-type: application/json" -d '{"target":{"role":"button","name":"Verify"}}'
```

Expected: **`409`** `HUMAN_IN_CONTROL`. Record it.

- [ ] **Step 2:** Confirm a **read-only** command still works (reads are allowed during a pause):

```bash
curl -s "$BASE/v1/sessions/$SESSION_ID/observe" -H "X-Feather-Token: $TOKEN" -H "content-type: application/json" -d '{}'
```

Expected: `200` with a snapshot.

**Checkpoint:** mutation → 409 recorded; read → 200 confirmed. The brake provably holds while passing reads through.

---

### Task 8: Human enters the emailed code (the second safety touchpoint)

**Owner:** Roi (human), guided by the agent.

- [ ] **Step 1:** Agent gives Roi the `RESOLVE_URL`.
- [ ] **Step 2 (human):** Roi opens `RESOLVE_URL` in a browser → the local MFA page renders (token verified, CSRF nonce minted).
- [ ] **Step 3 (human):** Roi reads the device-verification code from the scratch Gmail and enters it on the page, submits.

Server-side on submit: origin-unchanged anti-phishing check (still `github.com`) → Feather types the code into `CODE_REF` (sequential) → marks resolved → releases hold + pause.

**Checkpoint:** the page shows "Submitted. You can close this page."; `GET $BASE/v1/sessions/$SESSION_ID/mfa/$CHALLENGE_ID` returns `status:"resolved"`; an `mfa.challenge.resolved` event is in the session JSONL. *(If submit is refused with `MFA_FORBIDDEN` on origin-change, or the code won't type into GitHub's field → honest-failure outcome: record it, per spec §7.)*

---

### Task 9: Agent resumes, verifies login, marks the identity warm

- [ ] **Step 1:** `observe` — confirm the brake released (a mutation now succeeds) and the page advanced past the code wall.
- [ ] **Step 2:** Complete any final verify/continue click; `observe` the **logged-in GitHub dashboard** (authenticated UI / the account avatar/username present).
- [ ] **Step 3:** Mark the identity warm:

```bash
curl -s "$BASE/v1/identities/$IDENTITY_ID/mark-warm" -H "X-Feather-Token: $TOKEN" -X POST
```

Expected: `{ ok:true, data:{ identity:{ ..., warmStatus:"warm" } } }` (or equivalent warm flag).

**Checkpoint:** logged-in dashboard confirmed by `observe`; identity reports warm. Phase 1's four PASS conditions (spec §2) are all now evidenced.

---

### Task 10: Capture evidence + write the run report

**Files:** Create `docs/v2_wrap/spine-live-test/run-report.md` (+ screenshots alongside).

- [ ] **Step 1:** Screenshot at three points (re-run earlier if not captured live): login page, code wall, logged-in dashboard:

```bash
curl -s "$BASE/v1/sessions/$SESSION_ID/screenshot" -H "X-Feather-Token: $TOKEN" -H "content-type: application/json" -d '{}'
```

- [ ] **Step 2:** Pull the session JSONL events (look for `action.completed`, `human.pause.*`, `mfa.challenge.created/resolved`) for the timeline.
- [ ] **Step 3:** Write `run-report.md`: the step-by-step of what happened, the two **409** brake responses (await-human + MFA), the screenshots, and a **`PASS` / `PARTIAL`** verdict against the spec §2 four conditions, with any lessons (spec §7).

**Checkpoint:** `run-report.md` exists with the verdict + the brake evidence + screenshots referenced.

---

### Task 11: Teardown

- [ ] **Step 1:** Close the session:

```bash
curl -s "$BASE/v1/sessions/$SESSION_ID" -H "X-Feather-Token: $TOKEN" -X DELETE
```

- [ ] **Step 2:** Stop the server **by pid** from `endpoint.json` (never `pkill -f`):

```bash
kill "$(node -e 'console.log(require("/run/user/1000/feather/run/endpoint.json").pid)')"
```

**Checkpoint:** session closed; server stopped; no orphan Chromium. The warmed `gh-spine-test` identity persists on disk for the deferred Phase 2 (warmed step-up).

---

## Honest-failure watch-points (per spec §7 — each is a successful test)

- **CAPTCHA/puzzle at login** (Task 5) → stealth signal (5d), not a spine failure. Record + stop.
- **Pause banner vanishes** when GitHub navigates between password and code (known limit) → real finding.
- **Code won't type into GitHub's field** on resolve (cf. IG finicky inputs) (Task 8) → targeting-recipe gap.
- **`MFA_FORBIDDEN` origin-changed** on submit (Task 8) → anti-phishing check too strict for a GitHub redirect; record the redirect chain.
- **MFA challenge times out** (>10 min) before Roi submits → bump `FEATHER_MFA_TIMEOUT_MS` and note it.

## Self-review (spec coverage)

- Spec §2 PASS conditions: (1) native-drive + no agent password → Tasks 4–5; (2) MFA pause + token off agent → Task 6 + Task 8; (3) brake holds → Tasks 5/7 (the two 409s); (4) resume + mark-warm → Task 9. ✓
- Spec §6 choreography steps 1–9 → Tasks 3–9 one-to-one. ✓
- Spec §9 deliverable (run report + screenshots + PASS/PARTIAL) → Task 10. ✓
- Spec §3 scope guard (Phase 2 + stealth deferred) → honored; no task touches them. ✓
