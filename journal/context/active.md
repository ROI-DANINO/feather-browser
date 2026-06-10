# Active - startup pointer

This file is the short live pointer for `/start`. Full phase/session map -> `ROADMAP.md` (now a thin
index) + `docs/sessions/<id>.md`; operational checklist -> `journal/ops/tasks.md`; machine pointer ->
`journal/ops/phase.md`.

## Current pointer

- **NOW (2026-06-10 ~12:43, STOP): ALL V1 FOLLOW-UPS CLOSED — 3 commits pushed `origin/dev`
  (`91fcd2b`, `553216a`, `6263bd6`).** (1) **Operator-skills rewrite:** all 4 `skills/` files now teach
  `observe → act by ref → re-observe (diff)` — ref-first targeting, verified dismiss shape, `navigated:
  true` recovery; AGENTS.md caveat retired. (2) **Suite semantic-assertion layer:** showcase PASS now
  means the errand was done right — H3 like verified via "Unlike" state + content-aware comment (caption
  parsed from snapshot TEXT; IG feed gives CSS nothing — probed live), M3 asserts 8,848.x, H4 per-fact
  patterns, E1 title+points; all verified live (H3: honest PARTIAL → probe → PASS). (3) **Same-origin
  iframe-overlay dismiss gap FIXED:** child-frame actions inherit the containing top-frame overlay's
  `overlayIndex` (frameElement handle-identity match); TDD red→green on a real local-HTTP fixture
  (`data:` iframes are opaque-origin!). Gates: typecheck clean, 280/280 unit, **73/73** integration.
  Session `journal/ops/sessions/skills-asserts-iframe-dismiss-20260610-1243.md`. Blog declined → owed
  (3 owed now).
- **Recommend next: v2 Gate A — Session 5.0.0 (ADR-0010 capability gate).** It's a phase boundary:
  per AGENTS.md do the planning/reconciliation pass FIRST, in a fresh session, before any
  implementation. Body: `docs/sessions/5.0.0-capability-gate.md`. Optional side: C4C transcripts
  analysis (`journal/raw/_inbox/claude_for_chrome_output/`).
- **Current phase:** Phase 4a — **Feather v1** ("It runs errands for me"). v1 proven end-to-end,
  sighted, perception hardened, suite semantically honest, operator skills current. Remaining v1
  stealth gaps stay deferred to v2 — decided.
- **pi_agency is PARKED.** Resume only if Roi pulls it forward.

## Key facts for next session

- **`primary` = Roi's REAL personal Google (re-warmed 2026-06-10).** 438MB, 306 cookies. Handle with care.
- **`scratch` (`workspaceId: scratch`) = the TEST identity** — `feather_test_roi` IG (`Feather2026!test`) +
  warmed `roionly9@gmail.com` Google. Never confuse with `primary`.
- **Daily-driver:** `npm run daily` → `primary`; `npm run daily:scratch`; `npm run daily:stop [-- <ws>]`.
- **Server lifecycle:** health route `/health` (NOT `/v1/health`); endpoint at
  `/run/user/1000/feather/run/endpoint.json`; token at `/run/user/1000/feather/run/control-token`.
  Start from a shell with `WAYLAND_DISPLAY`/`DISPLAY` for headed windows. Stop by pid from
  endpoint.json (never `pkill -f`).
- **Perception API:** `POST /observe` (refs `obs_<id>.eN`, overlays, diff; `overlayIndex` = inside
  `overlays[i]`, **inherited by same-origin iframe contents** since 2026-06-10); act-by-ref on
  click/type/press/wait/select-option (refs die on next observe → 409 `REF_EXPIRED`);
  click/press/select-option may return `navigated: true` (hint — re-observe); `POST /dismiss` returns
  `{dismissed (verified), overlaysRemaining (ground truth), observation (act from these refs)}` and
  **reaches same-origin iframe overlays; cross-origin (third-party CAPTCHA frames) = await-human by
  design**. `snapshot` stays for reads.
- **Operator skills are CURRENT (rewritten 2026-06-10)** — they teach the observe loop; playbook
  remains the deeper reference.
- **IG durable recipes:** feed caption is CSS-unreachable (first `span[dir=auto]` = username, videos
  have no content img) — parse snapshot TEXT: `author / stats / author / caption / more`. Confirmation
  code inputs ignore `fill`/`type` — Shift+Tab + individual `press`.
- **Spam first** for email confirmation codes.
- **`data:`-URL iframes are opaque-origin** — same-origin iframe tests need real local-HTTP fixtures
  (same family as the data:-URL nav-block trap; pinned in 2 test files now).
- **Claude-for-Chrome research captures (untriaged):** `journal/raw/_inbox/claude_for_chrome_output/` —
  keep for analysis; do not delete.

## Recent completed context

- **V1 follow-ups closed (2026-06-10 ~12:43):** this stop — see Current pointer.
- **Observe bug fixes (2026-06-10 ~12:03):** /dismiss verify-by-re-observe, accname descendant peek,
  `navigated: true`; session `observe-bug-fixes-shipped-20260610-1203.md`.
- **Native Capabilities Router PLACED (2026-06-10 ~09:50):** Session 5.0.1, after Gate A; say
  "Connector Registry"; research `research/2026-06-10-native-capabilities-router.md`.
- **Command layer + Graphify graduation + daily-driver + `primary` re-warm (2026-06-10, earlier).**
- **Showcase eval suite complete (2026-06-09)** + **pass-2 observe measurement (2026-06-10)**;
  **perception loop shipped (2026-06-09)**.
