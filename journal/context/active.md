# Active - startup pointer

This file is the short live pointer for `/start`. Full phase/session map -> `ROADMAP.md` (now a thin
index) + `docs/sessions/<id>.md`; operational checklist -> `journal/ops/tasks.md`; machine pointer ->
`journal/ops/phase.md`.

## Current pointer

- **NOW (2026-06-15 04:46 STOP): RESUME-BANNER FIX + HUMAN-IN-CONTROL GUARD SHIPPED — committed
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
- **⚠️ SECURITY FLAG (Roi, top next priority): real TEST CREDS are in the remote repo + git history.**
  Roi found the scratch IG password + the `roionly9` Gmail address pushed to the open repo. Scoped:
  password (3 files) **redacted from the working tree this STOP** (`[REDACTED-PW]`) but **still in
  pushed history**; `roionly9`/email across **24 files**; `feather_test_roi` (old IG) across **38
  files**. **Working-tree redaction ≠ fix** — next session needs **git history rewrite + force-push**
  AND **credential rotation** (the IG password is already public → treat `roionly9` as compromised,
  change it regardless). Decide with Roi: scrub usernames/email too, or just the password.
- **Recommend next (Roi's pick): (1) the SECURITY SCRUB above [#1], then (2) v1 leftover cleanup**
  (prune duplicate "Rosh Hashana" events on scratch Google; H3 viewport acceptance check; remove dead
  `run_h3` from `examples/showcase.sh`). After that → **5a Identity Model** (first real consumer of
  Gate A; plan `docs/specs/2026-06-07-identity-model-plan.md`).
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
