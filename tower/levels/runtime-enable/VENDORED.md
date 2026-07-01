# VENDORED — `runtimeEnableLeak` probe

`detector.js` in this directory is a **vendored, minimized** copy of one probe from an external
project. This file records exactly what was copied, from where, under what license, what was changed,
and the open **calibration** question that decides whether the probe can be trusted on the target
browser.

## Source

- **Project:** `rebrowser-bot-detector` — <https://github.com/rebrowser/rebrowser-bot-detector>
- **File:** `index.js`
- **Function copied:** `runtimeEnableLeakInit()` (the Runtime.enable side-channel probe only — **not**
  the rest of the suite: `exposeFunctionLeak`, `navigatorWebdriver`, `csp`, `viewport`, `useragent`,
  `pwInitScripts`, the `addDetection`/UI layer, etc. were deliberately left out).
- **Commit:** `e1a25b1` (`e1a25b1ff264`, `main` HEAD at vendor time, 2026-07-02).
- **License:** **MIT** (declared in the source repo's `package.json`). MIT permits self-hosting a
  copy; attribution preserved here. We deliberately do **not** hot-link `bot-detector.rebrowser.net`
  at runtime — that would add an external dependency, expose us to upstream drift, and violate the
  no-attach / same-origin spirit of the Tower sink.

## What was copied vs. what we changed

**Copied (the load-bearing measurement, verbatim in shape):**

- `window.runtimeEnableLeakVars = { stackLookupCount: 0 }`.
- The `Error` + `Object.defineProperty(e, 'stack', { get() { …count += 1; return '' } })` accessor.
- `console.debug(e)` as the trigger (CDP with `Runtime.enable` serializes the arg out-of-page → reads
  `.stack` → fires the getter).
- The re-probe cadence (`setTimeout(..., 100)` in upstream → a `setInterval(probe, 100)` here).

**Changed / adapted for Tower (documented deviations):**

1. **Property descriptor `configurable`.** Upstream uses `configurable: false`; per the Chunk-3 design
   of record (§1.1) this vendored copy uses `configurable: true`. Functionally equivalent for the
   single-shot measurement (the getter still fires on read); we follow the design's spec verbatim.
2. **Removed the upstream `addDetection`/`rating`/`note` reporting + HTML/UI layer.** Tower reports
   through its own nonce sink, not the rebrowser dashboard. Instead of `rating ∈ {-1,0,1}` we map the
   raw `stackLookupCount` to a Tower `LevelVerdict` in `report()`:
   - `stackLookupCount > 0`  → `blocked` (leaked → tool detected → tool loses),
   - `stackLookupCount === 0` → `ok` **for now** (see Calibration — may need to become `gated`).
3. **Added a bounded settle window** (`settleMs = 2500`, re-probe every 100 ms, then `clearInterval`
   + `report()` once) to catch a *late* `Runtime.enable`, not only one present at page load.
4. **Added the dual self-report transport** to the same-origin sink: `fetch('/sink/'+nonce', …,
   keepalive:true)` primary + `navigator.sendBeacon` on `pagehide` backup, both carrying the same
   `{ nonce, detectorId:'runtimeEnableLeak', verdict, detail }` `DetectorReport`. This is Tower-native
   plumbing, not from upstream.
5. Wrapped in an IIFE with `"use strict"`; `detail` kept tiny (`stackLookupCount`, `settleMs`,
   `probeVersion`) to stay well under the 64 KiB beacon/keepalive cap.

## Verification note

The measured signal (`Runtime.enable` auto-emitted by CDP-driving automation) is independently
documented in this repo's own `src/browser/stealth.ts:12` ("Playwright auto-sending Runtime.enable
when console/pageerror listeners attach"), and by rebrowser's writeup. That is the same tell this
probe reads from the *client* side.

## CALIBRATION (BLOCKING — to be filled by the live gate)

> **Status: NOT YET CALIBRATED.** Until this section is filled from a real run, treat a `count === 0`
> `ok` as *provisional*.

**The load-bearing risk (design §6.1).** In **May 2025** V8 shipped a getter-guard that changed how
`Error.stack` is (or isn't) read during CDP serialization. On 2026 Chromium the classic
`Error.stack`-getter side channel is **likely dead**: a browser that *is* leaking `Runtime.enable`
could still report `stackLookupCount === 0`, making `ok` ambiguous — "tool patched Runtime.enable"
vs. "the probe can no longer see it." See the **Castle blog** writeup on the V8 break (cited in the
Chunk-3 design of record, §6.1) for the mechanism and timeline.

**The gate (design §5, sub-chunk 3a step 5).** Before this level's `ok` is trusted, run the probe on
**browser-use 0.13.1's exact bundled Chromium**, in two conditions:

| # | Condition | Expected if the classic probe still works |
|---|-----------|--------------------------------------------|
| a | browser-use 0.13.1 driving (CDP, `Runtime.enable` on) | `stackLookupCount > 0` → `blocked` |
| b | a plain human Chrome tab (no automation) | `stackLookupCount === 0` → `ok` |

**Record the outcome here:**

- Date / operator:
- browser-use version + bundled Chromium/V8 build:
- (a) driven `stackLookupCount`:
- (b) human-tab `stackLookupCount`:
- **Verdict on the probe:**
  - If (a) `> 0` and (b) `=== 0` → the classic probe **still fires**; `count === 0` → `ok` is
    trustworthy on this build. Leave `report()` mapping as-is.
  - If (a) `=== 0` (V8 guard killed it) → the classic probe is **dead here**. Change `report()` so
    `count === 0` maps to **`gated`** (uncertain, rating 0.5, with cause + suggestedFix), and open a
    follow-up to swap in a live CDP leak (`exposeFunctionLeak` / `mainWorldExecution` / `pwInitScripts`).
  - **Ship the level either way** — the calibration *result* is a first-class output, not a blocker
    on merging 3a. Do **not** assume the classic trick fires.
