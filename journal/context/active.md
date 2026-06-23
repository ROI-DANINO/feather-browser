# Active - startup pointer

This file is the short live pointer for `/start`. Full phase/session map -> `ROADMAP.md` (now a thin
index) + `docs/sessions/<id>.md`; operational checklist -> `journal/ops/tasks.md`; machine pointer ->
`journal/ops/phase.md`.

## Current pointer

- **NOW (2026-06-23 20:23 STOP — 5d RECONCILED to secure-only + the STEALTH+BEHAVIOR-MINE ARC set into
  the roadmap; NO code yet).** Picked 5d Stealth; reconciled the 2026-06-07 spec/plan vs shipped reality
  (Gate A/5a/5b/perception) → the MFA mode-switch seam is **dead** (MFA uses a pause/hold +
  `HUMAN_IN_CONTROL` brake), build order inverted, and the model collapses to **SECURE-ONLY** (the
  per-call `type` `mode`/`delayMs` — already in `TypeSchema` — is the fast path, so no `assisted` mode).
  Wrote **design rev 3** (`docs/specs/2026-06-23-5d-stealth-reconciled-design.md`, `1c19a40`) + a **9-task
  TDD plan** (`docs/plans/2026-06-23-5d-stealth-reconciled.md`, `03c0fc4`); cadence routes through a new
  **`Actionable.typeSequentially` seam** so it reaches **ref targets** (the main agent path), not just CSS
  selectors. Fixed stale docs via **4 parallel agents** (`2bb86e2`: old spec/plan banner-superseded;
  ROADMAP/tasks/browser-desk repointed; fingerprint-injector pkgs reference-only). Then **set the roadmap
  to the full stealth arc** (`a8c2290`): arc design `docs/specs/2026-06-23-stealth-behavior-arc-design.md`
  + ROADMAP/v2/tasks encode the ordered **5d.1→5d.5** — *one foundation / two payoffs* (**the Behavior
  Mine**: record human browser use once → motion/rhythm feeds stealth realism, steps feed workflow replay;
  **the Cookie Mine pattern, new payload**). **5d.2 measure is a real gate** (can shrink/defer 5d.4). The
  4 commits are **LOCAL on `dev`, NOT pushed**. **RECOMMEND NEXT (Roi's call): BUILD 5d.1** task-by-task
  (`docs/plans/2026-06-23-5d-stealth-reconciled.md`, subagent-driven); **do NOT spec the rest ahead** —
  let 5d.2's measurement drive the 5d.3+ specs. Full handoff:
  `journal/ops/sessions/stealth-arc-behavior-mine-20260623-2023.md`. No blog (owed line filed).
- **(prior) NOW (2026-06-23 ~16:10 — 5b TYPED-CODE PROVEN LIVE; real bug found+fixed; v2 fully proven).**
  Roi pushed to test the one feature still "built + mock-proven" — Feather typing a human-relayed code
  into a field (no real MFA wall needed: pointed `mfa/challenge` at a Wikipedia search box; no Telegram
  — a plain local resolve tab). Driving it live **exposed a real bug:** `MfaChallengeManager.resolveChallenge`
  typed the code via the normal `TypeHandler` **while its own MFA pause was active** → it braked its OWN
  injection (`HUMAN_IN_CONTROL`); the mock unit tests missed it (stubbed both pause + typeHandler).
  **Fixed (TDD):** `TypeInput.allowDuringHumanControl` (internal-only, absent from the HTTP TypeSchema →
  unreachable externally) + `type.ts` honors it + `resolveChallenge` sets it on its sanctioned,
  origin-checked injection; regression test uses the REAL pause registry (proven red→green). Gates:
  typecheck clean, **438u** (+1), MFA integration 5/5. **Re-ran live → `123456` injected into the field,
  challenge resolved, brake released.** Run C added to `docs/v2_wrap/spine-live-test/run-report.md`.
  **v2 is now fully proven live** (safety spine PASS + 5b typed-code PASS). **RECOMMEND NEXT (unchanged):**
  pick the next thread — 5d Stealth · Phase 2 warmed step-up · 4b shell. The speed/perception/toolbox
  notes are captured in `research/2026-06-23-agent-speed-perception-toolbox-intake.md` (deferred).
- **(prior) NOW (2026-06-23 ~15:40 — v2 SAFETY SPINE PROVEN LIVE → PASS; v2 WRAPPED).** Ran a 2nd live test
  against **Instagram** (the guaranteed-wall target Roi flagged) on the sacrificial `scratch` IG
  (`roionly9`). **Run B = PASS for the safety spine** (Run A GitHub was PARTIAL — no wall appeared):
  agent drove the login natively + typed the username; the **`await-human` handoff absorbed a genuinely
  hard real wall** — password **+ 2 CAPTCHAs + an email "verify it's you" *link*** (opened in a 2nd
  Gmail tab) — while the **`HUMAN_IN_CONTROL` brake held** (agent `navigate`→`409`, **zero** agent
  mutations across ~12 `tab.*` events during the 4-min human window); resumed **logged in as
  `roionly9`**. The spine's safety = brake + human-in-loop, **both held live under a messy multi-tab
  wall.** Roi's verdict (confirmed): **it passes.** Two honest asterisks: (1) the **5b typed-code**
  feature (Feather auto-typing a relayed 6-digit code) is **built + mock-proven** but **not exercised
  live** — no real site issued a *typed code* (IG used CAPTCHA + a *link*, not a code); owed nicety,
  NOT a blocker. (2) Password **recovered from git history** to unblock (accepted throwaway; the
  "agent never has the secret" property is the deferred vault gap). Report (both runs):
  `docs/v2_wrap/spine-live-test/run-report.md`. Warmed `roionly9` IG persists on `scratch`
  (Cookie-Mine fuel). **v2 = spine safe + PROVEN LIVE. RECOMMEND NEXT:** v2 is wrapped — the remaining
  v2.5/5d work (Stealth, the typed-code live proof, the LinkedIn exit test) stays deferred; pick the
  next thread fresh (5d stealth, Phase 2 warmed step-up, or 4b shell).
- **(prior) NOW (2026-06-23 ~15:20 — spine SAFETY live test RAN → PARTIAL; Finding #1 fixed+proven live).**
  Fixed **Finding #1** (TDD, `4c75a1e`): `LaunchSchema` (`src/transport/routes.ts`) + `LaunchInput`
  now carry `identityId` → launch-by-identity reachable from the API (was Zod-stripped). NOT caused by
  the ponytail audit — `identityId` was never in routes.ts in git history; it's an original 5a gap
  (5a tested the manager directly). Then **ran the operate-by-hand live test** (plan Tasks 2–11) on a
  throwaway GitHub (`roionly9-byte`, scratch Gmail). **PROVEN LIVE:** native drive + agent never typed
  the password; `await-human` password handoff; **brake #1 holds (`409 HUMAN_IN_CONTROL`** blocked an
  agent navigate mid-pause); real login → logged in as `roionly9-byte`; identity `gh-spine-test` marked
  **warm**. **NOT EXERCISED:** GitHub showed **no emailed-code wall** to a new account from a fresh
  Chromium (same machine/IP) → the **5b MFA half had no real challenge to bind to** → Roi's call: bank
  PARTIAL, don't fake a wall. Findings: **#2** plan-doc bug (`await-human` body is `reason` not
  `prompt`; fixed in the plan); **#3** GitHub didn't challenge (env/target data point). Run report +
  dashboard screenshot: `docs/v2_wrap/spine-live-test/run-report.md`. Both commits **pushed to
  `origin/dev`** (`0736824`). Scratch-profile orphan (`warm-session.ts`) killed; no Feather procs left.
  **RECOMMEND NEXT (Roi: resume testing): run the 5b MFA LIVE-WALL test** against a target that
  *reliably* 2FA-walls a new-device login (or an account with **TOTP pre-enabled** so the wall is
  guaranteed) — drive observe→find code field→`mfa/challenge` (type `sms`/`totp`)→brake #2 (409)→human
  enters code via the tokened resolve URL→resume. This is the still-owed proof (5b is mock-only). The
  warmed `gh-spine-test` identity persists for the deferred Phase 2 (warmed step-up).
- **(prior) NOW (2026-06-23 09:10 STOP — spine LIVE TEST designed + planned; run-prep caught Finding #1).**
  Ran the deferred live-testing brainstorm. Settled (5 forks w/ Roi): **spine *safety* test** (not the
  anti-bot/fingerprint track); **Phase 1 = fresh GitHub login + emailed device-code wall**, then Phase 2
  warmed step-up; **throwaway GitHub** registered to scratch Gmail (`roionly9`); **operate-by-hand, no new
  code**; **2 human touchpoints** (password + code) that *are* the machinery under test. Wrote+committed
  **design** `docs/specs/2026-06-23-spine-live-test-design.md` (`b8e9745`) + **11-task run plan**
  `…-spine-live-test-plan.md` (`f3c1ceb`). Started the run: server up, health green, identity
  `gh-spine-test` created (cold) — then **Finding #1** surfaced before driving: **the HTTP launch route
  can't bind a session to an identity** — `LaunchSchema` (`src/transport/routes.ts:49-61`) omits
  `identityId`; Zod strips it → `launchHandler` never sees it. Manager supports launch-by-identity; the
  transport was never wired → **launch-by-identity is unreachable from the API.** Server stopped; identity
  persists cold. **RECOMMEND NEXT (Roi's call): FIX FINDING #1 FIRST** — add `identityId` to `LaunchSchema`
  (TDD transport test) — **then** run the live test (Roi creates the GitHub throwaway → `roionly9`, no
  app-2FA, shares username; restart server `FEATHER_MFA_TIMEOUT_MS=600000 npm run dev`; drive plan Tasks
  4–11). Full handoff: `journal/ops/sessions/spine-live-test-design-20260623-0910.md`. No blog (owed line filed).
- **(prior) NOW (2026-06-23 08:15 /next — over-engineering audit processed + thread CLOSED).** Side-quest,
  NOT spine work — roadmap unchanged. Did the inbox "ponytail" audit's **safe, behavior-preserving
  cuts** and shipped to `dev` (merge `48d4dbe`; cuts `b30d43a`+`e97951a`), **pushed to `origin/dev`**:
  deleted dead `recordCommand`/`getDefaultPageId`/`WarmStatus "unknown"`; collapsed the two `wait.ts`
  "stable" loops into one `pollUntilStable` helper (timing preserved). Gates green: typecheck,
  **435u**, wait+debug-capture **9i** on real Chromium. **Held back as optional/not-owed** the
  security-flagged items (`isLocked`, single-grant `revoke`, HTML-escape on approval/MFA pages,
  approval double-check), the 26-file class→function flatten, and repo-weight; **KEPT** `measurement/`
  (Roi's call — dev tool) and `holds.observe/has/count` (roadmap consumer, commit `f7afbb8`). Audit
  thread **closed**: disposition annotated + archived to
  `journal/raw/archive/2026-06-23-ponytail-audit-overengineering.md`; inbox back to README-only.
  **RECOMMEND NEXT (unchanged): the deferred LIVE-TESTING BRAINSTORM** — prove the native spine live
  (warmed identity through a real login/MFA wall, human-in-loop, brakes observed), Roi driving the
  human steps; plan first before driving.
- **(prior) NOW (2026-06-23 03:46 STOP — "The Door I Didn't Build"): the v2 spine's SAFETY is delivered by the
  NATIVE path; raw-CDP attach is interop, deferred to 5e. No spine build work remains.** The 5c design
  pass (brainstorm with Roi) re-read the architecture: Feather's **native API is the credential-safe
  driving surface** (Safe tier); **raw-CDP attach = interop, not a safety brick.** Traced the wrap exit
  criterion against shipped reality — **5a warmed identity + native API + 5b MFA pause/`HUMAN_IN_CONTROL`
  brake already satisfy it** → the spine's safety is **build-complete on paper; only the live test
  remains.** Decision: defer the welded filtering-proxy (block Network/Storage, allow Runtime.evaluate,
  origin-pin, single-connection, hold-owns-socket, auto-kill-on-MFA) to **5e**, rebuild on real
  external-tool demand; Gate A's `cdp-attach` door stays built-but-dormant. Decision doc:
  `docs/specs/2026-06-23-5c-native-vs-cdp-attach-decision.md`. ROADMAP + tasks + browser-desk
  reconciled; memory `feather-security-first-framing` added; **blog `0021-the-door-i-didnt-build.md`**
  written (folded the owed banner/human-in-control beat). This /stop also **consumed the 3 pending
  `/next` entries** (5a Identity, v2-wrap scope, 5b MFA). Full handoff:
  `journal/ops/sessions/the-door-i-didnt-build-20260623-0646.md`. **Committed at this /stop.**
  **RECOMMEND NEXT: the deferred TESTING BRAINSTORM** — prove the native spine live (warmed identity
  through a real login/MFA challenge, human-in-loop, brakes observed), Roi driving the human steps.
- **(prior) NOW (2026-06-23 02:01 /next): 5b MFA Handler SHIPPED (TDD) + v2.5 testing-grounds docs landed.**
  (1) Built **5b MFA Handler** end-to-end TDD, reconciled onto Gate A (decision: reuse primitives, keep
  MFA distinct): new `src/mfa/*` + `src/commands/mfa-challenge.ts` + 4 routes + 3 `mfa.challenge.*` SSE
  events. Create takes an `mfa` hold + banner-free pause (free HUMAN_IN_CONTROL agent-suspension)
  replacing the dead `setStealthMode`; 256-bit single-use humanToken kept off the agent URL; CSRF/CSP +
  origin-unchanged anti-phishing; shares `CapabilityService.holds`; session-close cancels pending. Gates:
  tsc clean, **435u**, mfa integration 5/5, full integration 101p/1skip/1 pre-existing niri red. Docs:
  api-reference MFA section + human-handoff skill. **All pushed to `origin/dev` (`12ffa91`).** Honest
  limit: proven with a **mock browser** — the live-MFA-wall human-in-loop test is the deferred testing
  brainstorm. (2) Also landed **v2.5 anti-bot/session-identity testing-grounds docs** (`928cdbb`):
  `docs/testing/anti-bot-testing-policy.md` + `docs/specs/2026-06-23-session-identity-testing-design.md`
  — design now, **code gated behind the finished spine**. Reconciliation doc: `docs/specs/2026-06-23-mfa-5b-reconciliation.md`.
  **RECOMMEND NEXT: 5c — warmed-profile CDP attach — design pass first (NO spec exists yet):** read
  `docs/specs/2026-06-04-attach-dont-launch-design.md` + adr-0010, reconcile against shipped Gate A
  (grants + `cdp-attach` capability + hold-teardown seam), brainstorm scope with Roi. 5c = the LAST spine piece.
- **(prior) NOW (2026-06-23 03:34 /next): v2-wrap DOCS LANDED + v2 WRAP SCOPE DECIDED.** (1) An agent-built
  **v2-wrap** retrospective (docs-only) was reviewed — citations verified against live code, gates re-run
  (`tsc` clean, **vitest 399/399**) — committed, **merged to `dev` + pushed** (`d6cbf46`); its `v2-wrap`
  worktree/branch removed. (2) Brainstorm with Roi fixed the wrap scope: **complete the security spine
  only — 5b MFA → 5c attach — defer Stealth 5d + the LinkedIn exit test to a later v2.5.** Spine-done =
  *safe but not yet stealthy*. Decision doc committed `42b0e36` (NOT yet pushed):
  `docs/specs/2026-06-23-v2-spine-completion-plan.md`. Testing the finished spine is a **separate later
  brainstorm** (Roi in the loop). **RECOMMEND NEXT: reconcile the 5b MFA plan against shipped Gate A,
  then build 5b TDD** (`docs/specs/2026-06-07-mfa-handler-{design,plan}.md`).
- **(prior) 2026-06-15 04:46 STOP: RESUME-BANNER FIX + HUMAN-IN-CONTROL GUARD SHIPPED — committed
  `2c7773a`.** Two complementary `await-human` fixes (TDD, proven live on scratch):
  (1) **Navigation-survivable banner** — re-injects the Resume banner on each new document via a
  `domcontentloaded` listener, so it follows the human across page changes instead of vanishing
  (the Hebrew-Gmail-login pain). (2) **Human-in-control guard** — while a pause is active, agent
  page-mutating commands (navigate/click/type/press/select-option; dismiss via its click) are refused
  with **`HUMAN_IN_CONTROL` (409)**; read-only commands stay allowed; **page-scoped**. (Found live:
  an automated navigate yanked Roi out mid-login → the bug became a feature.) Gates: tsc clean,
  **366 unit**, await-human **integration 9/9**. `pause-registry` now tracks `pageId` +
  `isPagePaused`/`assertPageNotPaused`. Full handoff:
  `journal/ops/sessions/banner-and-pause-guard-20260615-0446.md`.
- **✅ SECURITY LEAK — TRIAGED + ACCEPTED, NO ACTION NEEDED NOW (Roi decision 2026-06-15).** Real TEST
  creds (scratch IG password + `roionly9` Gmail address + `feather_test_roi` handle) are in the pushed
  remote repo + git history. **Roi's calls:** (a) **NO git-history rewrite / force-push** — leave
  history as-is; (b) the IG password is a **unique throwaway** (NOT reused on any real account), so
  blast radius = a single rebuildable sacrificial asset → **defer rotation to Phase 5d as a stealth
  probe**, not a security must-do. The password is already redacted from the working tree
  (`[REDACTED-PW]`); usernames/email stay (just identifiers for a throwaway). The agent-driven IG
  password-change is re-filed under 5d (meaningful probe only once Stealth 5d + MFA 5b exist).
- **v1 leftovers CLEARED 2026-06-15:** (1) `run_h3` removed from `examples/showcase.sh` (function +
  HARD array + header comment; `bash -n` clean); (2) all 4 agent-created duplicate "Rosh Hashana"
  Sep-12 events deleted from scratch Google (only the official `חגים בישראל` subscribed entry
  remains); (3) H3 viewport check RUN — counterfactual **FALSE on niri**: `--window-size` is ignored
  under the tiling WM (1280 and 2560 requests both → 604px content / IG mobile), so a headed window
  can't force a desktop viewport without CDP `setDeviceMetricsOverride` (durable fix filed under 5d,
  with stealth-flag caveat; niri float-rule is the user-side workaround). None of this needs a repo
  commit except the `showcase.sh` edit (uncommitted, for `/next`/`/stop`).
- **5a IDENTITY MODEL — SHIPPED + COMMITTED to `dev` 2026-06-15 (`3674d82` feat + `6a72bc0` chore, TDD).** Named handle over a warmed profile:
  new `src/identity/` (types/store/manager) + `src/transport/identity-routes.ts` + extracted
  `http-helpers.ts`; six `/v1/identities` routes; `LaunchSessionInput.identityId` resolves via an
  injected resolver seam. Council S1–S5 baked in (separable ids / explicit markWarm / opaque policy /
  write-mutex+version / vaultRef redacted+dormant + 0600 store + disablePasswordManager). Gates: tsc
  clean, 399 unit, identity integration 4/4, full integration 96/96 (lone red = pre-existing niri
  attach-cdp viewport, unrelated). Manual curl CRUD round-trip green on real `npm run dev`. Detail →
  tasks.md 5a entry. **Next: 5b MFA Handler** (now that Identity carries the `mfaPolicy` slot) —
  Roi will start the 5b planning pass in a fresh `/next` chat.
- **NOTE:** dev server stopped at end of session (was up only for the manual curl test). No running server.
- **Gate A is DONE end-to-end** (A0 transport hardening + A1 holds/grants/policy/audit/approval-page +
  cookie-export demo door; proven "mined AND used" on warmed Gmail 2026-06-15). v2 spine unchanged.
- **Workflow SIMPLIFIED (Roi, 2026-06-11):** no PR-per-step unless asked — work directly on the active
  branch; plan briefly → implement → test → summarize. Pause only for: real warmed profiles/personal
  accounts; a *material change* to security architecture (vs. executing accepted ADR-0010); large
  deletes/rewrites; non-obvious CI failure; an unclear architectural tradeoff.
- **Current phase:** Phase 4a — **Feather v1** ("It runs errands for me"), v1 proven + Gate A shipped.
  Remaining v1 leftovers are small (see tasks.md).
- **pi_agency is PARKED.** Resume only if Roi pulls it forward.

## Key facts for next session

- **`primary` = Roi's REAL personal Google — ⚠️ NO LONGER ON DISK (verified gone 2026-06-15).** The old
  "438MB, 306 cookies, re-warmed 2026-06-10" is STALE; the only profile that exists is `scratch`. If a
  `primary` is ever re-created, handle with care and NEVER point cookie-export at it.
- **`scratch` (`workspaceId: scratch`) = the TEST identity** — a sacrificial IG + warmed Gmail
  (handles/password intentionally NOT recorded here; see the security-scrub task). Never confuse with
  `primary`. As of 2026-06-15 its cookies were cleared (logged out) during the banner test.
- **Daily-driver:** `npm run daily` → `primary`; `npm run daily:scratch`; `npm run daily:stop [-- <ws>]`.
- **Server lifecycle:** health route `/health` (service) + **`GET /v1/sessions/:id/health`**
  (per-session CDP-alive probe, NEW); endpoint at `/run/user/1000/feather/run/endpoint.json`; token
  at `/run/user/1000/feather/run/control-token`. Start from a shell with `WAYLAND_DISPLAY`/`DISPLAY`
  for headed. Stop by pid from endpoint.json (never `pkill -f`).
- **Perception/API news (2026-06-11):** `GET /v1/sessions/:id/tabs` = tab ground truth; click may
  return best-effort `newPageId` (popup event usually lands AFTER the click response); extract takes
  flat `{fields}`, defaults `type`, and `type:"value"` reads input values; headed-CDP now honors
  `viewport` as the OS window size (proxy still unapplied there — warned, not silent); every POST
  action is traced as `action.completed` (name+status only) in the session JSONL.
- **Operator skills + playbook updated 2026-06-11** to all of the above (incl. screenshot =
  artifact descriptor + sanctioned vision fallback).
- **IG durable recipes:** feed caption is CSS-unreachable — parse snapshot TEXT
  `author / stats / author / caption / more`. Confirmation code inputs ignore `fill`/`type` —
  Shift+Tab + individual `press`. **Spam first** for email confirmation codes.
- **`data:`-URL iframes are opaque-origin** — same-origin iframe tests need real local-HTTP fixtures.
- **Claude-for-Chrome captures** (`docs/v1_wrap/claude-for-chrome/raw/`, gitignored — local-only,
  personal data) — analyzed by the workflow; kept as raw evidence behind META-ANALYSIS. Moved out
  of the inbox 2026-06-15.

## Recent completed context

- **Banner re-inject + human-in-control guard (2026-06-15 04:46, `2c7773a`):** this stop — see pointer.
- **Gate A proven "mined AND used" on warmed Gmail (2026-06-15 03:30):** 77 cookies through the gate →
  fresh browser opened the inbox on them alone; detection ≠ blocking (5d input).
- **Gate A SHIPPED end-to-end (2026-06-11):** A0 hardening + A1 holds/grants/policy/audit/approval +
  cookie-export door; v1 finale blogged (0019+0020).
- **Agent-driven showcase + C4C comparison archived `docs/v1_wrap/` (2026-06-10, `60ef4fd`).**
