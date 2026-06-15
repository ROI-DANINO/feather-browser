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
- **5a IDENTITY MODEL — SHIPPED 2026-06-15 (TDD, UNCOMMITTED).** Named handle over a warmed profile:
  new `src/identity/` (types/store/manager) + `src/transport/identity-routes.ts` + extracted
  `http-helpers.ts`; six `/v1/identities` routes; `LaunchSessionInput.identityId` resolves via an
  injected resolver seam. Council S1–S5 baked in (separable ids / explicit markWarm / opaque policy /
  write-mutex+version / vaultRef redacted+dormant + 0600 store + disablePasswordManager). Gates: tsc
  clean, 399 unit, identity integration 4/4, full integration 96/96 (lone red = pre-existing niri
  attach-cdp viewport, unrelated). Manual curl CRUD round-trip green on real `npm run dev`. Detail →
  tasks.md 5a entry. **Next: 5b MFA Handler** (now that Identity carries the `mfaPolicy` slot) — or
  Roi's pick.
- **NOTE:** a fresh `npm run dev` server is running (started this session for the curl test); stop by
  pid in `endpoint.json` when done.
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
