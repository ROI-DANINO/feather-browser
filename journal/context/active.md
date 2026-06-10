# Active - startup pointer

This file is the short live pointer for `/start`. Full phase/session map -> `ROADMAP.md` (now a thin
index) + `docs/sessions/<id>.md`; operational checklist -> `journal/ops/tasks.md`; machine pointer ->
`journal/ops/phase.md`.

## Current pointer

- **NOW (2026-06-10 ~09:50, STOP): NATIVE CAPABILITIES ROUTER PLACED → Session 5.0.1, after Gate A.**
  Roi confirmed the placement: the router/Connector-Registry idea lands in **5.0.1 (MCP & tool-surface
  reconciliation)** — NOT inside Gate A, NOT now, no spec yet. Inbox notes merged + promoted to
  `research/2026-06-10-native-capabilities-router.md` (placement rationale at top); originals archived to
  `journal/raw/archive/`; pointers added in `docs/sessions/5.0.1-mcp-tool-surface.md` + `ROADMAP.md` + `tasks.md`.
  Standing notes: say **"Connector Registry"** (not "Capability Registry" — collides with ADR-0010 grants); the
  "universal web execution layer" vision sentence = doctrine-change ADR question for the 5.0.1 joint call;
  docs-import connector builder = v3/5e; deep API research checklist runs at build time. Bonus verified: the new
  `CLAUDE.md → @AGENTS.md` import DOES auto-load in fresh sessions. First live use of the /stop blog gate: Roi said
  no → owed line in `blog/_pending.md`. Session record:
  `journal/ops/sessions/native-capabilities-placed-20260610-0950.md`.
- **OBSERVE BUG FIXES BRAINSTORM — PAUSED MID-DESIGN (2026-06-10), THE NEXT THREAD (Roi's pick at this stop).**
  Root causes explored in code; tentative approach decisions reached for all 3 bugs — Bug 1 dismiss under-report
  (B: re-observe to verify popup gone), Bug 2 accname gap (A: descendant aria-label query), Bug 3 INTERNAL_ERROR
  on nav-clicks (A: return `navigated:true`). Roi: "okay for now but i want to get back to it" — designs tentative,
  not locked. **No spec written yet.** Bridge archived at
  `journal/archive/next/2026-06-10/0652-stop-bundle-graphify-graduation.md` (observe-bug-fixes-brainstorm entry).
- **Recommend next:** Resume observe-bug-fixes brainstorm — confirm approach choices, present full design sections,
  write spec, user review, then invoke writing-plans. After that: operator-skills rewrite to the observe loop, suite
  semantic assertions, then **v2 Gate A** (ADR-0010). Optional side: C4C transcripts analysis.
- **Recent same-day context (details in session files + log):** command layer upgraded ~09:28 (`/blog` + `/notebook`
  + /stop blog gate + CLAUDE.md fix, pushed thru `3cb86dc`); Graphify GRADUATED to `dev` ~06:52 (MCP query layer +
  path-agnostic post-commit hook; rebuild verb = `graphify update .`, NEVER `extract`; session
  `graphify-graduated-to-dev-20260610-0652.md`, blog `0018`); NotebookLM Project Brain v2 SHIPPED; daily-driver
  background launch ~01:42 (`npm run daily`/`daily:scratch`/`daily:stop`, `61fe677`) + **`primary` re-warmed with
  Roi's REAL Google** (Cookie Mine live on his own identity; session
  `daily-driver-background-launch-primary-rewarmed-20260610-0142.md`).
- **Current phase:** Phase 4a — **Feather v1** ("It runs errands for me"). v1 proven end-to-end (IG test + full
  showcase) and now markedly faster/sighted. Remaining v1 stealth gaps (act-human cadence, bot self-check) stay
  deferred to v2 — decided.
- **Deferred from the observe-loop spec (§16):** cross-origin iframe descent (`await-human` is the v1 fallback);
  goal-aware LLM relevance filter (would add a model dependency — not built); **v2 stealth hardening = move the
  identical walk fn into a CDP isolated world** (clean future swap, walk logic unchanged).
- **pi_agency is PARKED.** Stage 3 returned PARTIAL (operator beat the birthday dropdown honestly, hit Google's
  phone wall; Testing Honesty held). Resume only if Roi pulls it forward; the suite is now Claude-driven.

## Key facts for next session

- **`primary` = Roi's REAL personal Google (re-warmed 2026-06-10).** 438MB, 306 cookies, full auth set across
  google.com/.co.il/youtube. This is Roi's real daily-driver / Cookie-Mine identity now — handle with care.
  History note: the warmed `primary` was deliberately deleted 2026-06-08 (at Roi's request, no backup); this is the
  fresh re-warm.
- **`scratch` (`workspaceId: scratch`) = the TEST identity** — holds `feather_test_roi` IG (`Feather2026!test`) +
  warmed `roionly9@gmail.com` Google. ~150MB. Use for sacrificial/test work; never confuse with `primary`.
- **Daily-driver (committed `61fe677`):** `npm run daily` → `primary` (detached/background); `npm run daily:scratch`
  → `scratch`; `npm run daily:stop [-- <ws>]` → clean SIGTERM stop. Close the Chromium window = clean save + exit.
- **Claude-for-Chrome research captures (untriaged):** `journal/raw/_inbox/claude_for_chrome_output/` — 2 convo
  transcripts Roi records to reverse-engineer how Claude for Chrome navigates/uses the browser (direct Feather
  inspiration). Keep for analysis; do not delete.
- **Server lifecycle:** health route is `/health` (NOT `/v1/health`). Real endpoint at
  `/run/user/1000/feather/run/endpoint.json` (project-root `endpoint.json` was empty last session); token at
  `/run/user/1000/feather/run/control-token`. Start from a shell with `WAYLAND_DISPLAY`/`DISPLAY` for headed windows.
- **Tab API:** `POST /tabs` opens a blank tab (then `/navigate`); **`DELETE /v1/sessions/:sessionId/tabs/:pageId`
  closes one tab** (last tab refused → 409 `CANNOT_CLOSE_LAST_TAB`; end the session instead).
- **Perception API now (NEW this session):** **`POST /observe`** = the action-shaped read (numbered refs + overlays
  + change-diff; read-only). Drive with **act-by-ref** `{by:"ref",ref:"<observeId>.e<i>"}` on click/type/press/wait/
  select-option — refs valid only until the next observe (else 409 `REF_EXPIRED`). **`POST /dismiss`** = opt-in,
  overlay-scoped banner dismissal. New golden loop = `observe → act by ref → observe (read diff) → repeat`. `snapshot`
  stays for *reading* tasks. All documented in api-reference + agent-playbook.
- **IG input quirk:** confirmation code input ignores `fill`/`type` — use Shift+Tab + individual `press`.
- **Spam first** for email confirmation codes.
- **`continuity.test.ts` fails consistently** — proven PRE-EXISTING (fails at base `09bb3e5`; tests
  `scripts/demo/continuity.ts`, unrelated to any current feature). Deserves its own ticket; ignore in suite runs.

## Recent completed context

- **close-tab primitive (2026-06-09):** `DELETE /tabs/:pageId`; 9 commits `4920759..bb3494e`; READY TO MERGE.
- **Showcase eval suite (2026-06-09):** all 10 tasks built + run; E 3/3 PASS, M1 PARTIAL (CAPTCHA)/M2/M3 PASS,
  H 4/4 PASS. `examples/showcase.sh` (`bfb4dbb`), recipe log `docs/specs/2026-06-09-showcase-pass1-recipes.md`.
- **v1 Instagram test DONE (2026-06-08):** full signup + email verify + social errand. PASS.
- **Pause-for-human primitive DONE (2026-06-08, `dev` 5d7a9b8):** `await-human` + on-page Resume banner.
  Finding: banner dies on page navigation → v2 MFA Handler must re-inject on `framenavigated`.
- **v1→v2→v3 restructure + open-source doctrine (2026-06-08):** `feather.md`, `docs/roadmap/{v1,v2,v3}.md`, `adr-0011`.
