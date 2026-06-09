# Active - startup pointer

This file is the short live pointer for `/start`. Full phase/session map -> `ROADMAP.md` (now a thin
index) + `docs/sessions/<id>.md`; operational checklist -> `journal/ops/tasks.md`; machine pointer ->
`journal/ops/phase.md`.

## Current pointer

- **NOW (2026-06-09 ~11:48, STOP): showcase suite COMPLETE (all 3 tiers green) + close-tab primitive SHIPPED.**
  Hard tier ran 4/4 PASS (`./examples/showcase.sh hard`): H1 real Google Calendar write, H2 warmed-Google→Wikipedia
  20k chars, H3 IG like+comment as `feather_test_roi`, H4 multi-tab 3/3. **Cookie mine proven beyond the IG test.**
  Showcase suite committed `bfb4dbb` + recipe log. Then built the **close-tab primitive**
  (`DELETE /v1/sessions/:sessionId/tabs/:pageId`) end-to-end via subagent-driven TDD: refuses last tab (409
  `CANNOT_CLOSE_LAST_TAB`), removePage-before-close, **fixed latent initial-tab-listener bug**, lenient empty-body
  JSON parser. 9 commits, 61 unit + 2 integration green, final review = READY TO MERGE. **`dev` pushed to
  `origin/dev` (in sync, `fa38e36..bb3494e`).** Specs: `docs/specs/2026-06-09-close-tab-primitive-{design,plan}.md`.
  Session record: `journal/ops/sessions/hard-tier-pass-close-tab-shipped-20260609-0849.md`. Blog `0016-ten-errands.md`.
- **NEXT (Roi-confirmed) = brainstorm the PERCEPTION / OBSERVATION LOOP.** The real answer to "the agent is slow
  and blind to banners": a cheap structured `observe` (actionable elements + detected overlays as text, no image);
  an auto-dismiss-known-interstitials helper; screenshot disk cleanup. Use the brainstorming skill. Grounds: this
  session's H1 screenshot 30s font-timeout + banners silently blocking clicks; `dismiss_got_it` in `showcase.sh`
  is the crude precursor.
- **Current phase:** Phase 4a — framed for humans as **Feather v1** ("It runs errands for me"). v1 is proven
  end-to-end (IG test + full showcase). Remaining v1 stealth gaps (act-human cadence, bot self-check) stay deferred
  to v2 — decided.
- **pi_agency is PARKED.** Stage 3 returned PARTIAL (operator beat the birthday dropdown honestly, hit Google's
  phone wall; Testing Honesty held). Resume only if Roi pulls it forward; the suite is now Claude-driven.

## Key facts for next session

- **Scratch profile** (`workspaceId: scratch`) — re-warmed 2026-06-09, holds `feather_test_roi` IG
  (`Feather2026!test`) + warmed `roionly9@gmail.com` Google session. Grew to ~265MB from discovery browsing.
  Handle carefully — this is the test identity.
- **Server lifecycle:** health route is `/health` (NOT `/v1/health`). Real endpoint at
  `/run/user/1000/feather/run/endpoint.json` (project-root `endpoint.json` was empty last session); token at
  `/run/user/1000/feather/run/control-token`. Start from a shell with `WAYLAND_DISPLAY`/`DISPLAY` for headed windows.
- **Tab API now:** `POST /tabs` opens a blank tab (then `/navigate`); **`DELETE /v1/sessions/:sessionId/tabs/:pageId`
  closes one tab** (last tab refused → 409 `CANNOT_CLOSE_LAST_TAB`; end the session instead). Documented in
  api-reference + agent-playbook + the using-feather-browser skill.
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
