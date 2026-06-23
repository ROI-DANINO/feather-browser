# Active - startup pointer

This file is the short live pointer for `/start`. Full phase/session map -> `ROADMAP.md` (now a thin
index) + `docs/sessions/<id>.md`; operational checklist -> `journal/ops/tasks.md`; machine pointer ->
`journal/ops/phase.md`.

## Current pointer

- **NOW (2026-06-23 03:46 STOP — "The Door I Didn't Build"): the v2 spine's SAFETY is delivered by the
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
