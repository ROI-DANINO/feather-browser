# Active - startup pointer

This file is the short live pointer for `/start`. Full phase/session map -> `ROADMAP.md` (now a thin
index) + `docs/sessions/<id>.md`; operational checklist -> `journal/ops/tasks.md`; machine pointer ->
`journal/ops/phase.md`.

## Current pointer

- **NOW (2026-06-10 ~01:42, STOP): DAILY-DRIVER BACKGROUND LAUNCH + `primary` RE-WARMED (real account).**
  `npm run daily` [primary] / `daily:scratch` now launch the persistent profile **detached** (`nohup`+`disown` →
  logfile under `$XDG_RUNTIME_DIR/feather/`, PID file, double-launch guard) so it frees the terminal; closing the
  Chromium window saves + exits via `warm-session`'s child-exit hook. New **`npm run daily:stop`** = SIGTERM clean-save
  escape hatch (`/proc/<pid>/cmdline` PID-reuse guard). Scripts `scripts/start-daily-driver.sh` + new
  `scripts/stop-daily-driver.sh`; commit **`61fe677` pushed to `origin/dev`**. **Diagnosed the "cookieless primary"
  mystery:** the warmed `primary` was deliberately deleted 2026-06-08 ("at Roi's request" before a demo re-record; no
  backup) — that emptied it. **Roi re-warmed `primary` 2026-06-10 with his REAL personal Google** (438MB, 306 cookies,
  full auth set). **Cookie Mine is now live on Roi's own identity** — he uses `primary` as his real daily-driver. No
  cookies/secrets in the repo (profiles live outside the working tree). Session record:
  `journal/ops/sessions/daily-driver-background-launch-primary-rewarmed-20260610-0142.md`.
- **NEXT = OPEN (Roi to tackle next session, his call).** (a) run the observe → act-by-ref → diff loop on a real
  showcase task to *measure* the speed/round-trip win vs the old guess-and-fail loop; (b) start **v2 Gate A**
  (capability/safety gate, ADR-0010). Optional side-thread: analyze the new Claude-for-Chrome transcripts (see below)
  for navigation patterns. Prior NOW: perception/observation loop SHIPPED (`eee44f3..837435c`, blog `0017`); session
  record `journal/ops/sessions/observe-perception-loop-shipped-20260609-2336.md`.
- **Current phase:** Phase 4a — **Feather v1** ("It runs errands for me"). v1 proven end-to-end (IG test + full
  showcase) and now markedly faster/sighted. Remaining v1 stealth gaps (act-human cadence, bot self-check) stay
  deferred to v2 — decided.
- **Deferred from this session (spec §16):** cross-origin iframe descent (`await-human` is the v1 fallback);
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
