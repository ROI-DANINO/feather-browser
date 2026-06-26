# Gym — Mouse-Motion Upgrade (design)

**Date:** 2026-06-26 · **Status:** approved (Roi), ready for implementation plan
**Phase:** v1 / bot gymnasium — the upgrade Gym Step 1 surfaced.
**Precursors:** Step 1 design `docs/specs/2026-06-26-gym-step1-behavioral-diagnostic-design.md`;
recon `docs/testing/gym-step1/recon-findings.md`; keystroke-cadence sibling `src/browser/stealth.ts`
(5d.1). Ties to roadmap 5d.3/5d.4 (mouse-motion synthesis via CDP `Input.dispatchMouseEvent`).

## Problem

Gym Step 1's first live run scored `UNSCORED → FAIL` against `bot.incolumitas.com`. The cause is
genuine, not a misread: Feather produces **no cursor trajectory**. Playwright clicks jump the
pointer straight to the target, and the diagnostic does not move the mouse at all. The detector's
behavioral classifier scores *mouse-movement dynamics*; with no path to observe it cannot compute a
score (the field renders a literal `...`).

The goal is **high scores through trial → analysis → tool upgrade**, not a deliberately-low baseline.
That requires motion that is (a) genuinely human-like from day one, (b) *tunable* so each trial can
change one knob, and (c) *logged* so each run says what motion produced what score.

## Non-goals

- Not folding motion into `click`/`type` (Roi chose a dedicated `move` capability; click/type can
  reuse the path code later — explicitly deferred).
- Not reopening stealth-on-real-sites (CUT). This is gym work against Roi's chosen detector.
- No fingerprint spoofing — consistent with the verify-don't-spoof posture in `stealth.ts`.

## Architecture — three parts

### Part 1 — Motion engine: `src/browser/mouse-path.ts`

A pure function:

```
mousePath(from: Point, to: Point, opts?: MousePathOpts): Waypoint[]
  Point    = { x: number; y: number }
  Waypoint = { x: number; y: number; delayMs: number }
```

Behavior:
- **Curved**, not straight: a cubic Bezier from `from` to `to` with two control points offset
  perpendicular to the straight line by a randomized fraction of the distance (curviness knob).
  A straight-line request (e.g. horizontal) must still yield a bowed path — straight lines are the
  primary tell.
- **Variable velocity**: sample the Bezier at `steps` points using an ease-in-out distribution
  (slow-start / fast-middle / slow-end) plus per-step jitter. Velocity is carried by `delayMs` per
  waypoint, not by even sampling.
- **Optional overshoot**: when enabled, the path slightly overshoots the target then corrects back
  (a known human micro-behavior). Default modest; off is acceptable.
- **Tunable** via `MousePathOpts` — the trial dials:
  `{ steps?, curviness?, jitter?, overshoot?, minDelayMs?, maxDelayMs?, seed? }`.
- **Pure + seedable**: when `seed` is given the path is deterministic (for tests and reproducible
  trials); otherwise it varies run-to-run. Uses a small local seeded RNG, not `Math.random()`
  directly, so a seed fully determines the output.

Defaults: sensible human-ish values (e.g. `steps≈25`, `curviness≈0.15`, `jitter≈0.3`,
`overshoot` small, `delay` range ~8–25ms/step). These are starting points for the trial loop, not
truths — the loop tunes them.

**Check (can-fail):** one unit test. A horizontal `from→to` with a fixed seed produces a path that
(1) starts at `from` and ends at `to`, (2) deviates off the straight line at the midpoint (curved),
(3) has non-uniform `delayMs`, (4) is reproducible for the same seed and differs for another. A
straight, constant-delay output fails the test.

### Part 2 — `move` capability: `src/commands/move.ts` + route + types

- **`MoveInput`**: `{ sessionId; pageId?; target?: Target; x?: number; y?: number; opts?: MousePathOpts; timeoutMs? }`
  — exactly one of `target` or `{x,y}` (validated). **`MoveOutput`**: `{ pageId; x; y; steps }`
  (final cursor position + waypoint count).
- **`MoveHandler.execute`**: resolve `target` → `boundingBox()` center, or use explicit `{x,y}`.
  Add `boundingBox(): Promise<{x,y,width,height} | null>` to the `Actionable` interface in
  `locators.ts` so both branches expose it uniformly: the locator branch returns `loc.boundingBox()`,
  the ref branch returns `handle.boundingBox()` (both are native Playwright APIs). Read the
  last-known cursor position, generate the path via `mousePath`, then drive
  `page.mouse.move(wp.x, wp.y)` for each waypoint awaiting `wp.delayMs` between them. Record the new
  last position.
- **Last cursor position**: `WeakMap<Page, Point>` module-local in `move.ts` (Playwright does not
  expose the pointer position). Missing entry → default to viewport center
  (`page.viewportSize()`), falling back to `{x:0,y:0}`.
- **Route**: `POST /v1/sessions/:sessionId/move` with `MoveSchema` (Zod), `preHandler: [tokenAuth]`,
  wired identically to `/click` in `src/transport/routes.ts` (envelope, `requestId`, action-logger
  already matches `/v1/sessions/:id/:action`).
- **Pause registry**: like click, assert the page is not human-paused before moving
  (`assertPageNotPaused`) — an agent must not move the cursor while a human holds the page.

### Part 3 — Analysis loop: `gym/behavioral.ts`

- After `navigate`, **wander** the cursor across several points (e.g. 4–6 moves between varied
  viewport coordinates) with pauses arranged to straddle the detector's 1.5/4/7/10/15s scoring
  windows, using the new `move` endpoint via the existing `feather` HTTP client. No clicks (avoids
  navigation side-effects; movement alone is what the classifier scores).
- The motion config used (the `MousePathOpts` + the wander pattern, or a short label/version for it)
  is recorded **alongside** the score, verdict, and screenshot. `results.md` gains a column so each
  row reads as a trial: *this motion → this score*.
- Keep the reusable export surface (`feather`/`launchHeaded`/`navigate`/`snapshot`/…) so Step 2's
  scoreboard wire still reuses it; add `move` to it.

## Data flow

```
gym/behavioral.ts
  POST /v1/sessions            → launch headed disposable
  POST .../navigate            → bot.incolumitas.com
  POST .../move (×N, varied)   → MoveHandler → mousePath() → page.mouse.move loop  [trajectory fires]
  (waits straddle 1.5/4/7/10/15s windows)
  POST .../snapshot            → parse "Your Behavioral Score:"
  classify() → verdict → screenshot → results.md row (motion config + score)
```

## Error handling

- `move` with neither/both of `target` and `{x,y}` → Zod validation error (400 envelope).
- `target` resolves but `boundingBox()` is null (not visible) → action error via `withActionErrors`,
  same shape as click's failures.
- Navigation teardown mid-move → treated like click's `isNavigationTeardown` (benign), return what
  completed.
- Human-paused page → `assertPageNotPaused` throws (same as click).

## Testing

- **Unit:** `mouse-path` test as specified in Part 1 (the one can-fail check).
- **Type/suite:** `npm run typecheck` clean; existing unit suite stays green (476→ +path test).
- **Live (honest, can-fail):** `npm run gym:behavioral` against the real detector. Success = score
  flips off `...` to a number; the *target* is climbing it via trials, not a one-shot pass. A low or
  still-`UNSCORED` result is a recorded result, not a hidden failure.

## What's deliberately left for later

- Click/type reusing the path engine (move-then-act). Built only when wanted.
- CDP `Input.dispatchMouseEvent` path (5d.4) if Playwright's `page.mouse` proves insufficient for
  the score — start with `page.mouse` (native, already present); escalate only if a trial shows it
  capped.
- Richer per-feature detector signal — `bot.incolumitas` exposes only the single ML score, so the
  analysis loop correlates *our* logged motion knobs to that score rather than reading a breakdown.
