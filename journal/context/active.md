# Active - startup pointer

This file is the short live pointer for `/start`. Full phase/session map -> `ROADMAP.md` (now a thin
index) + `docs/sessions/<id>.md`; operational checklist -> `journal/ops/tasks.md`; machine pointer ->
`journal/ops/phase.md`.

## Current pointer

- **NOW (2026-06-09 ~23:36, STOP): PERCEPTION / OBSERVATION LOOP — SHIPPED end to end.** Brainstorm → research (6
  platforms) → spike → spec → plan → implementation, all this session. New **`POST /observe`**: action-shaped, text-only
  perception — numbered **observe-scoped refs** (`<observeId>.e<i>`), first-class **overlays** (occlusion via
  `elementFromPoint`), and a **change-diff** vs the last observe. Shadow-DOM-piercing; **never reads `el.value`**
  (no credential leak); same-origin frames walked, cross-origin walls detected-but-not-entered. **Act-by-ref**
  (`{by:"ref",ref}`) on click/type/press/wait/select-option → new cheat-sheet #1, no more selector guessing.
  **`POST /dismiss`** (opt-in, overlay-scoped, affirmative-label-only) retires `dismiss_got_it`. Screenshot retention
  (newest 20) + 8s timeout kills the H1 30s font-stall. Built via **subagent-driven parallel dispatch + TDD** (11
  tasks, waves A–E). **Caught + fixed a real safety bug** (`3b82839`): refs are now observe-scoped so a stale ref
  reliably `REF_EXPIRED`s instead of silently clicking a different element — found by the T10 e2e test (Testing
  Honesty). Final: typecheck clean, unit 262 pass (+ known `continuity` flake), **integration 60/60**. **`dev` pushed
  to `origin/dev` (`eee44f3..837435c`).** Spec/plan: `docs/specs/2026-06-09-observe-perception-loop-{design,plan}.md`.
  Session record: `journal/ops/sessions/observe-perception-loop-shipped-20260609-2336.md`. Blog `0017-teaching-it-to-see.md`.
- **NEXT = OPEN (Roi to choose).** Candidates: (a) run the new loop on a real showcase task to *measure* the
  speed/round-trip win vs the old guess-and-fail loop; (b) start **v2 Gate A** (capability/safety gate, ADR-0010).
- **Current phase:** Phase 4a — **Feather v1** ("It runs errands for me"). v1 proven end-to-end (IG test + full
  showcase) and now markedly faster/sighted. Remaining v1 stealth gaps (act-human cadence, bot self-check) stay
  deferred to v2 — decided.
- **Deferred from this session (spec §16):** cross-origin iframe descent (`await-human` is the v1 fallback);
  goal-aware LLM relevance filter (would add a model dependency — not built); **v2 stealth hardening = move the
  identical walk fn into a CDP isolated world** (clean future swap, walk logic unchanged).
- **pi_agency is PARKED.** Stage 3 returned PARTIAL (operator beat the birthday dropdown honestly, hit Google's
  phone wall; Testing Honesty held). Resume only if Roi pulls it forward; the suite is now Claude-driven.

## Key facts for next session

- **Scratch profile** (`workspaceId: scratch`) — re-warmed 2026-06-09, holds `feather_test_roi` IG
  (`Feather2026!test`) + warmed `roionly9@gmail.com` Google session. Grew to ~265MB from discovery browsing.
  Handle carefully — this is the test identity.
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
