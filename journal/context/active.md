# Active - startup pointer

This file is the short live pointer for `/start`. Full phase/session map -> `ROADMAP.md` (now a thin
index) + `docs/sessions/<id>.md`; operational checklist -> `journal/ops/tasks.md`; machine pointer ->
`journal/ops/phase.md`.

## Current pointer

- **NOW (2026-06-10 ~12:03, STOP): OBSERVE BUG FIXES SHIPPED end-to-end — brainstorm resumed → spec →
  plan → subagent-driven build (12 commits `09a6b6c..579b445`, pushed `origin/dev`).** All 3 pass-2 bugs
  fixed: (1) `/dismiss` = verify-by-re-observe — new response `{dismissed (verified-gone only),
  overlaysRemaining, observation (fresh refs)}`, containment-gated picking (`overlayIndex`, composed-tree
  shadow-piercing), calendar-grid false positive killed (absolute/sticky need explicit z-index; dialog
  roles always count), dead `Overlay.ref` dropped; (2) icon-only buttons named via descendant aria-label
  peek (IG Like); (3) nav-clicks return `navigated: true` (hint-not-promise — re-observe) on
  click/press/select-option instead of INTERNAL_ERROR. Docs (api-reference + playbook) updated +
  verified against code; ref-format drift fixed. Gates: typecheck clean, 280/280 unit, 72/72
  integration; final whole-implementation review = ready to merge. Spec
  `docs/specs/2026-06-10-observe-bug-fixes-design.md`; plan `docs/plans/2026-06-10-observe-bug-fixes.md`;
  session `journal/ops/sessions/observe-bug-fixes-shipped-20260610-1203.md`. Blog declined → owed line
  in `blog/_pending.md` (2 owed now).
- **Review-process note (worth remembering):** two-stage subagent reviews caught vacuous nav tests
  (passed on the buggy parent — `data:` URL navigation is silently blocked by Chromium; reworked onto a
  real local HTTP fixture), an unpinned H1 catch path, and a shadow-DOM containment gap. Parallel
  dispatch works when file sets are disjoint; reviewers go git-only when the tree is shared.
- **Recommend next:** operator-skills rewrite to the observe loop (the 4 `skills/` files still teach
  snapshot-first; evidence `examples/showcase-output/pass2-observe/results.md`), then suite semantic
  assertions, then **v2 Gate A** (ADR-0010) — the big next. Optional side: C4C transcripts analysis.
- **Open follow-ups from review (recorded in tasks.md):** same-origin-iframe overlay dismiss gap
  (`/dismiss` can't reach buttons in iframe overlays; fix idea = implicit overlayIndex for actions in a
  detected overlay iframe; workaround documented in playbook); (kind,name) mutation watch-item (docs say
  trust `overlaysRemaining`).
- **Current phase:** Phase 4a — **Feather v1** ("It runs errands for me"). v1 proven end-to-end and
  sighted; perception loop now hardened by the bug-fix pass. Remaining v1 stealth gaps stay deferred
  to v2 — decided.
- **pi_agency is PARKED.** Resume only if Roi pulls it forward.

## Key facts for next session

- **`primary` = Roi's REAL personal Google (re-warmed 2026-06-10).** 438MB, 306 cookies. Handle with care.
- **`scratch` (`workspaceId: scratch`) = the TEST identity** — `feather_test_roi` IG (`Feather2026!test`) +
  warmed `roionly9@gmail.com` Google. Never confuse with `primary`.
- **Daily-driver:** `npm run daily` → `primary`; `npm run daily:scratch`; `npm run daily:stop [-- <ws>]`.
- **Server lifecycle:** health route `/health` (NOT `/v1/health`); endpoint at
  `/run/user/1000/feather/run/endpoint.json`; token at `/run/user/1000/feather/run/control-token`.
  Start from a shell with `WAYLAND_DISPLAY`/`DISPLAY` for headed windows.
- **Tab API:** `POST /tabs` opens; `DELETE /v1/sessions/:sessionId/tabs/:pageId` closes one (last tab →
  409 `CANNOT_CLOSE_LAST_TAB`).
- **Perception API (updated 2026-06-10):** `POST /observe` (refs `obs_<id>.eN`, overlays, diff; actions
  may carry `overlayIndex` = inside `overlays[i]`); act-by-ref on click/type/press/wait/select-option
  (refs die on next observe → 409 `REF_EXPIRED`); click/press/select-option may return
  `navigated: true` (hint — re-observe); **`POST /dismiss` returns
  `{dismissed (verified), overlaysRemaining, observation}`** — act from `observation`'s refs, trust
  `overlaysRemaining`; dismiss runs 2 observes internally (budget ~2× observe). `snapshot` stays for reads.
- **IG input quirk:** confirmation code input ignores `fill`/`type` — Shift+Tab + individual `press`.
- **Spam first** for email confirmation codes.
- **`continuity.test.ts` PASSES now (3/3, `tests/unit/scripts/`).** The old "fails consistently,
  pre-existing" note was stale — verified twice on 2026-06-10. No ticket needed.
- **Claude-for-Chrome research captures (untriaged):** `journal/raw/_inbox/claude_for_chrome_output/` —
  keep for analysis; do not delete.

## Recent completed context

- **Observe bug fixes (2026-06-10):** this stop — see Current pointer.
- **Native Capabilities Router PLACED (2026-06-10 ~09:50):** Session 5.0.1, after Gate A; say
  "Connector Registry"; research `research/2026-06-10-native-capabilities-router.md`.
- **Command layer (2026-06-10):** `/blog` + `/notebook` + /stop blog gate; CLAUDE.md → @AGENTS.md import.
- **Graphify GRADUATED to `dev` (2026-06-10):** rebuild = `graphify update .`, NEVER `extract`.
- **Daily-driver + `primary` re-warm (2026-06-10, `61fe677`).**
- **Showcase eval suite complete (2026-06-09):** 10 tasks; pass-2 observe measurement found the 3 bugs
  fixed this session.
- **Perception loop shipped (2026-06-09):** `POST /observe` + act-by-ref + `/dismiss` (now upgraded).
