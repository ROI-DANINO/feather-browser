# The Grader Was Down — Mouse-Motion Upgrade + Gym BLOCKED State

**When:** 2026-06-26 evening → 2026-06-27 ~00:09
**Desk:** automation (gym + Feather body capability)
**Commits (on `dev`, NOT pushed):** `fbea1d7..0576723`

## One-line
Built the mouse-motion upgrade (real cursor trajectory over HTTP) — verified it delivers, then
discovered the gym's chosen detector couldn't grade it because the detector's own backend is down;
shipped a gym `BLOCKED` state so an outage no longer masquerades as a bot-FAIL.

## Done this session
- **Mouse-motion upgrade — built, reviewed, merge-ready** (brainstorm → spec → plan → subagent-driven
  exec; sonnet implementers / opus reviews per Roi's model mapping). 5 TDD tasks, each 2-stage
  reviewed, final whole-branch review READY TO MERGE:
  - `src/browser/mouse-path.ts` — pure, seedable, **tunable** curved + variable-velocity path
    generator (cubic Bezier + ease-in-out + jitter; mulberry32 PRNG). 6 tests.
  - `boundingBox()` added to the `Actionable` interface (`src/browser/locators.ts`).
  - `MoveHandler` (`src/commands/move.ts`) + `MoveInput/Output` — drives `page.mouse.move`
    waypoint-by-waypoint, tracks last cursor pos in a `WeakMap<Page,Point>`, pause-aware. 5 tests.
  - `POST /v1/sessions/:id/move` + Zod `MoveSchema` (`target` XOR `{x,y}` via `.refine`).
  - `gym/behavioral.ts` wanders the cursor across the scoring windows + logs *motion → score*;
    `gym/results.md` migrated to a 7-col trial log.
  - Controller-run **live `/move` smoke PASS**: coords → `steps:26`; target heading → bbox center
    `640,136.5`; both XOR violations rejected.
- **The honest debug.** Roi's live `npm run gym:behavioral` still read `UNSCORED`. Instead of tuning
  knobs, ran **systematic-debugging**. Evidence (independent Playwright probes, scratch, deleted):
  1. A Feather-style path delivered **156 `mousemove` events, all `isTrusted:true`** with movement
     deltas — the cursor trajectory IS real and arrives at the page.
  2. The score still read `"..."` because bot.incolumitas computes it **server-side** via
     `getBehavioralClassification()` → `POST https://abs.incolumitas.com/classify?key=public123`
     (collecting `window.bd_client.frames` from `abs.incolumitas.com/lib.js`).
  3. **`abs.incolumitas.com` is fully DOWN — HTTP 502 on `/lib.js`, `/get`, `/classify`, `/store2`**
     (confirmed by direct curl; nginx 502 = backend offline, not a WAF block).
  → So the 5d.2 conclusion ("can't score because clicks teleport / no cursor path") was a
  **misdiagnosis**. The path arrives; the grader is dead. `UNSCORED` here = external outage.
- **Gym `BLOCKED` state shipped** (`0576723`, per Roi's calls): `classify()` gains a `BLOCKED`
  outcome + a `detectorDown` signal (pure, default false — "no score = FAIL" still holds when the
  detector is UP; DOWN ⇒ BLOCKED). `behavioral.ts` adds `absDetectorDown()` (probes `lib.js`,
  5xx/timeout = down, **AbortSignal-timeout-guarded** so a hung backend can't stall, gated to run
  only when otherwise unscored). The two misleading `results.md` rows corrected (row 2 = BLOCKED with
  the 156-events finding; row 1 = BLOCKED-inferred + pre-motion caveat). rd-verify **PASS** (its
  Important catch — missing timeout — applied). Tests 7/7 gym, 491 full suite, typecheck clean.

## Left unfinished / next action
- **Validate the `BLOCKED` path live** — `abs.incolumitas` is down RIGHT NOW, so a headed re-run
  (`npm run dev` + `npm run gym:behavioral`) should print `BLOCKED` (not `FAIL`) and cite the 502.
  Needs Roi's headed terminal.
- **Retry for a real motion score when `abs.incolumitas` recovers** (Roi's "retry later" call). Only
  then can the mouse-motion capability actually be graded by this detector.
- **Step 2 — fable evals scoreboard** still pending (unchanged).

## Decisions
- KEEP the mouse-motion code (verified capability, independent of the detector outage).
- ADD a gym `BLOCKED` state (a down detector ≠ a bot-FAIL) — protects the honesty model.
- RETRY `abs.incolumitas` later; do NOT add a different detector now.
- Model mapping for this session's orchestration: haiku→sonnet, sonnet→opus.

## Durable facts (corrected)
- **bot.incolumitas's behavioral score is computed SERVER-SIDE** by `abs.incolumitas.com` (lib.js
  collects `bd_client` frames → `/classify` grades). If that service is down, the score reads `"..."`
  for everyone — human or bot. `UNSCORED` is NOT proof of bot-detection.
- **Feather's `/move` delivers a real, trusted cursor trajectory** (156 isTrusted mousemove events,
  verified). "Clicks teleport → unscoreable" (5d.2) is superseded: motion is delivered; the gap, if
  any, is trajectory *quality*, not *presence* — and it can't be measured until the grader is up.

## Verbatim Roi
- "do the mouse-motion upgrade first"
- "i dont need to 'watch it climb' i want to get hig results throgh trial analisys and upgrading the tools"
- "use sonnet instead haiku and opus instead of sonnet"
- "not yets blog"
