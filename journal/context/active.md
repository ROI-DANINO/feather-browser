# Active - startup pointer

This file is the short live pointer for `/start`. Full phase/session map -> `ROADMAP.md` (now a thin
index) + `docs/sessions/<id>.md`; operational checklist -> `journal/ops/tasks.md`; machine pointer ->
`journal/ops/phase.md`.

## Current pointer

- **NOW (2026-06-11 ~14:30 STOP): EXPANDED FABLE WORKFLOW SHIPPED — v1-wrap story corrected, gap
  fixes landed.** Session: `journal/ops/sessions/fable-workflow-v1-acquittal-20260611-1430.md`.
  (1) **Meta-analysis** `docs/v1_wrap/META-ANALYSIS.md` (3 analyst agents + adversarial review;
  where it disagrees with the 2026-06-10 v1_wrap docs, IT wins): H3's "socket death" = **the agent
  harness's own Anthropic-API connection, NOT Feather/CDP** (P0 withdrawn); **H3 never liked or
  commented** (grep matched the errand prompt — no real-world side effect; "Feather burned IG"
  unfounded; account gone = cause unknown); real H3 blocker = **viewport silently ignored in
  chromium-headed-cdp**; M2 = environmental-rerunnable, **cause undetermined** (not 5d evidence in
  either direction). (2) **Fixes pushed `60ef4fd..235ebbb`** (10 commits): headed-CDP viewport via
  `--window-size`, `GET /tabs`, best-effort `newPageId` on click, extract flat-shape/type-default/
  `value` reads, teardown ENOTEMPTY retry, per-action `action.completed` log + `GET /health`,
  docs/skills truth pass. Code review caught + fixed a MAJOR unauth-log-write hole (regression-
  pinned). Gates: tsc clean, 301/301 unit, 79/79 integration. dev == origin/dev.
- **UPDATE (2026-06-11, post-STOP `/next`): v1 finale BLOGGED — v1 wrap fully closed.** `/blog`
  shipped 2 entries (`blog/0019-the-reviews-that-caught-me-lying.md` = 06-10 testing-honesty trio;
  `blog/0020-feather-on-trial.md` = the Fable-acquittal finale); all 4 owed `_pending.md` lines
  cleared. Committed `af83a65` on task branch `claude/last-15-commits-8aizhv` — **NOT `dev`;
  reconcile/cherry-pick to `dev` later so the finale isn't stranded.**
- **Recommend next: the v2 Gate A planning/brainstorm pass** (Session 5.0.0, ADR-0010, fresh
  session, planning-first per the phase-boundary rule — no implementation yet). Roi's signal for the
  next session: "session we'll brainstorm gate a." Bridge entry in `journal/context/next.md`.
- **Current phase:** Phase 4a — **Feather v1** ("It runs errands for me"). v1 proven, sighted,
  wrap-analyzed, gap-fixed. Remaining v1 leftovers are small (see tasks.md); v2 spine unchanged —
  nothing from the workflow jumps Gate A.
- **pi_agency is PARKED.** Resume only if Roi pulls it forward.

## Key facts for next session

- **`primary` = Roi's REAL personal Google (re-warmed 2026-06-10).** 438MB, 306 cookies. Handle with care.
- **`scratch` (`workspaceId: scratch`) = the TEST identity** — `roionly9` IG (`Danino1265`, created
  2026-06-11) + warmed `roionly9@gmail.com` Google. Never confuse with `primary`.
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
- **Claude-for-Chrome captures** (`journal/raw/_inbox/claude_for_chrome_output/`) — analyzed by the
  workflow; keep as raw evidence behind META-ANALYSIS.

## Recent completed context

- **Fable workflow (2026-06-11 ~14:30):** this stop — see Current pointer.
- **Rerun blockers cleared + H3 redesigned read-only & done agent-side (2026-06-11, earlier).**
- **Agent-driven showcase + C4C comparison archived `docs/v1_wrap/` (2026-06-10, `60ef4fd`).**
- **V1 follow-ups closed (2026-06-10 ~12:43):** skills rewrite, semantic asserts, iframe-dismiss fix.
