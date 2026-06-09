# Session — Hard tier 4/4 PASS + close-tab primitive shipped

_Stop: 2026-06-09 ~11:48 local (08:49 UTC). Phase 4a / Feather v1. Driver: Claude Opus 4.8._

## Throughline (incl. folded prior-chat next.md context)

Prior chat (today, before this session): pi Stage 3 returned PARTIAL and was **parked** (operator beat
the birthday dropdown honestly but hit Google's phone wall; Testing Honesty held). Scratch was re-warmed
with the **real** accounts (`roionly9@gmail.com` + `feather_test_roi`, 88MB). Showcase M+H **discovery +
full `showcase.sh` build** (all 10 tasks) landed; medium tier ran live (M1 PARTIAL CAPTCHA / M2 PASS /
M3 PASS); hard tier was built but paused before running. This session picked up from there.

## Done this session

- `/start` → verified runtime: server alive `:35853` (PID 133216), scratch warmed (Gmail logged in).
  Found a **stale session `ses_3b65faf9ac`** holding the scratch lock with 6 leftover discovery tabs;
  `open_warmed_scratch`'s PROFILE_LOCKED self-heal closed it automatically on the hard run.
- **Ran the hard tier — 4/4 PASS** (`./examples/showcase.sh hard`):
  - H1 (36.9s) — extracted Israeli holiday, created + saved a real Google Calendar event
  - H2 (83.4s) — warmed-Google search → Wikipedia, snapshot.text 20,000 chars
  - H3 (32.6s) — IG home feed, liked + commented as `feather_test_roi`
  - H4 (4.6s) — 3 tabs, 3 facts (HN story / Tel Aviv +27°C / playwright 90.6k stars)
  - Blemish (not a failure): H1 **screenshot** timed out (`fonts loaded… Timeout 30000ms`) → PNG missing;
    task passed on the snapshot-text check. Reinforces the "screenshots are slow/fragile" thread.
  - **Showcase suite now validated end-to-end across all 3 tiers.**
- **Committed showcase suite** `bfb4dbb` (`examples/showcase.sh` all 10 tasks + `open_warmed_scratch` +
  `dismiss_got_it`) + recipe log `docs/specs/2026-06-09-showcase-pass1-recipes.md`. Artifacts are gitignored
  (only `.gitkeep` tracked).
- **close-tab primitive — designed, planned, built, shipped.** Roi flagged: tabs must close when a task is
  done and when a session closes. Investigation: session-close already reaps all tabs via `context.close()`;
  the real gap was **no per-tab close**. Brainstorm → design spec `5e363c5` → plan `d987b96` →
  subagent-driven TDD execution (6 tasks, two-stage review each + final holistic review = READY TO MERGE).
  - `DELETE /v1/sessions/:sessionId/tabs/:pageId` → `{ sessionId, closedPageId, pages }`
  - Refuses to close the last tab → **409 `CANNOT_CLOSE_LAST_TAB`** (keeps profile lock tied to session close)
  - `removePage` **before** `page.close()` (try/catch) → map stays consistent even if close() throws
  - **Latent bug fixed:** initial tab(s) never got `page.on(close/framenavigated)` listeners (only
    post-launch tabs did). Extracted `attachPageListeners`, called for both. Closing the default tab now reaps.
  - Lenient empty-body `application/json` parser in `http.ts` (consistent with the existing urlencoded
    override; Zod still validates bodies that need fields)
  - `closeTab` added to both `ISession` and `ISessionManager`
  - 9 feature commits `4920759..bb3494e`; 61 unit + 2 integration green; `tsc` clean
- **Pushed `dev` → `origin/dev`** (`fa38e36..bb3494e`, 16 commits; now in sync).

## Decisions

- close-tab shape: DELETE route, **refuse last tab (409)**, removePage-before-close, fix initial-tab
  listeners, lenient empty-body JSON parser, **session-close untouched** (test-only assertion).
- **Sequencing:** "close-tab now, perception loop next" (Roi's pick). Perception loop is its own brainstorm.
- act-human cadence + bot self-check → **stay deferred to v2** (M1 PARTIAL is the lesson, not a blocker).
- Completion: **push `dev` to `origin/dev`**, do NOT merge to master (feature increment, not a milestone).
- Parallel-agent dispatch evaluated for the close-tab pipeline → **declined**: tasks share files
  (`manager.ts`) + are a dependency chain; the skill's own criteria say sequential.

## Ideas / next-feature shape

- **Perception/observation loop** (the next brainstorm): a cheap structured `observe` that returns
  actionable elements + detected overlays/banners as text (no image); an auto-dismiss-known-interstitials
  helper; screenshot disk cleanup. This is the real answer to "the agent is slow and blind to banners."
- Future speed: share one warmed session across hard tasks instead of open/close per task.

## Roi quotes (verbatim)

- "we need to do somthing that will close the tabs when the task is done and close all tabs when a session is closed"
- "did you catch ny note from the last session about the agent workflow? the screenshots and the efficiency of how to use a page faster and smarter?"
- "sits banners are blocking tool actions and stuff, we need to manage it smarter, i dont know when we should tuckel it"
- "commit the showcase suite now, then write the plan"
- "Subagent-driven, go ahead"

## Left unfinished / open threads

- **Perception/observation loop** — queued as the next session's brainstorm (Roi-confirmed focus).
- **`continuity.test.ts`** fails consistently — **proven pre-existing** (fails identically at base `09bb3e5`;
  touches none of this feature's files; it tests `scripts/demo/continuity.ts` poll-login logic). Deserves its
  own ticket, not this feature's problem.
- **Screenshot disk cleanup** — `~/.local/state/feather/debug/<sid>/screenshots/` grows unbounded.
- **H1 screenshot font-load 30s timeout** — minor; folds into the perception/screenshot rework.

## Key runtime facts

- Server: PID 133216 at `http://127.0.0.1:35853` (`/health`, NOT `/v1/health`). Token at
  `/run/user/1000/feather/run/control-token`; real endpoint at `/run/user/1000/feather/run/endpoint.json`
  (project-root `endpoint.json` was empty this session).
- Scratch: warmed real accounts (`roionly9@gmail.com` Google + `feather_test_roi` IG). Grew to ~265MB from
  accumulated discovery browsing. Handle carefully — the test identity.
- `dev` == `origin/dev` (in sync after push).

## Next concrete action

**New session: brainstorm the perception/observation loop** — cheap structured `observe`, auto-dismiss
interstitials, screenshot cleanup. Use the brainstorming skill. Grounds: this session's screenshot
timeout + banner-blocking observations; `examples/showcase.sh` `dismiss_got_it` as the crude precursor.
