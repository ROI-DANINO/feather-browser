# Active - startup pointer

This file is the short live pointer for `/start`. Full phase/session map -> `ROADMAP.md` (now a thin
index) + `docs/sessions/<id>.md`; operational checklist -> `journal/ops/tasks.md`; machine pointer ->
`journal/ops/phase.md`.

## Current pointer

- **NOW (2026-06-11 ~17:05 NEXT): GATE A STARTED — ADR-0010 ACCEPTED + A0 transport hardening
  SHIPPED.** Three PRs merged to `dev`: **#3** ADR-0010 flipped to ACCEPTED (4 open Qs resolved +
  revoke-teeth) + Gate A design (`docs/specs/2026-06-11-gate-a-capability-system-design.md`); **#4**
  A0 plan; **#5** A0 code (CI green). A0 = global `createOriginHostGuard` onRequest hook
  (`src/transport/middleware.ts`): `FORBIDDEN_HOST` (loopback-only Host kills DNS-rebind) +
  `FORBIDDEN_ORIGIN` (cross-origin Origin/Referer on unsafe methods kills CSRF); 14u+6i tests;
  api-reference + port/Referer rationale in comments. **Task 0 verified `/resume` same-origin** (pause
  banner = CDP-polled DOM flag, no network) → R1; stale `http.ts` comment fixed. **Cadence locked:
  plan-first PR → approve → code PR → CI-green → merge.** dev == origin/dev.
- **Recommend next: A1 — the capability system** (tiers + session-hold primitive + capability-grant
  registry + dangerous-mode policy + dual audit), **plan-first** like A0. Read ADR-0010 + the Gate A
  design doc + `src/transport/middleware.ts` (the pattern A1 extends). (`/blog` v1 finale still owed —
  4 lines in `blog/_pending.md` — fold when convenient.)
- **HOUSEKEEPING (blocked):** merged remote branches NOT deleted — git proxy rejects ref deletion
  (HTTP 403), no MCP delete-branch tool. `claude/{session-branch-work-leu1oj, a0-transport-hardening-
  plan, a0-transport-hardening-code, last-15-commits-8aizhv}` linger on origin; delete via GitHub UI.
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
