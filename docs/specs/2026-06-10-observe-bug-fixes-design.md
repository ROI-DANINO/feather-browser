# Observe Loop Bug Fixes — Design

- **Date:** 2026-06-10
- **Phase:** 4a (Feather v1 — "It runs errands for me")
- **Status:** APPROVED (brainstorm complete) → next: implementation plan
- **Companion plan:** `docs/plans/2026-06-10-observe-bug-fixes.md` (to be written)
- **Field evidence:** `examples/showcase-output/pass2-observe/results.md` (pass-2 product backlog, items 1–3)
- **Related:** `docs/specs/2026-06-09-observe-perception-loop-design.md` (the system these bugs live in)

---

## 1. Problem

The pass-2 observe measurement (full 10-task showcase suite driven through the observe loop,
2026-06-10) surfaced three product bugs. All three were found honestly — real sites, real
failures, deterministic recoveries recorded:

1. **`/dismiss` under-reports (H1).** A real blocking modal ("Want to get better notifications?",
   Continue button in the default label list) was cleared, but the response said `dismissed: []`.
   Root cause: `DismissHandler.execute` only records a dismiss when the click resolves cleanly —
   but a *successful* dismiss often destroys the clicked element mid-click, making Playwright
   throw, which the catch swallows. The more decisively the popup vanishes, the more likely we
   report "did nothing." Two side-findings in the same ticket:
   - **Overlay→ref linkage is dead code.** `observe.ts` hardcodes `ref: null` on every overlay,
     so `pickDismissTargets`' overlay-link check can never fire; the effective gate degrades to
     "label matches + any overlay exists anywhere," loose enough to click a page's own
     legitimate "Continue" button.
   - **Overlay false positive.** The Google Calendar grid itself was reported as
     `kind: banner, blocking: true` (it is a large absolutely-positioned layout element —
     exactly what the >25%-coverage heuristic catches).
2. **Accessible-name gap on icon-only elements (H3).** Instagram's Like/Comment are
   `<div role="button">` wrappers whose only content is an icon carrying the name
   (`<svg aria-label="Like">`). `accName()` in the walk checks the element's own attributes and
   falls back to `innerText` — an icon has no text, so the buttons come out nameless. Forced
   geometry-based targeting; made the like invisible to the change-diff.
3. **INTERNAL_ERROR on successful navigation-triggering clicks (H1/H2/H3).** The click works,
   navigation tears down the element/execution context, Playwright throws ("Element is not
   attached…", "Execution context was destroyed…", "Target page… closed"), and
   `withActionErrors` — which only maps `TimeoutError` — lets it escape as a 500. The most
   successful possible click reports as a crash. The recovery that worked deterministically
   every time in the field: re-observe, confirm state.

## 2. Decisions (approaches chosen)

Settled in the 2026-06-10 brainstorm (paused and resumed same day; Roi confirmed all three):

| Bug | Chosen | Rejected |
|---|---|---|
| 1 dismiss under-report | **Verify by re-observe**: click, look again, report what is actually true | (A) record intent pre-click — lies in the other direction; (C) interpret the teardown error as success — guesses instead of verifying |
| 2 accname gap | **One descendant `[aria-label]` peek**, last resort after empty `innerText` | (B) full W3C accessible-name algorithm — substantial in-page code on every observe, covering edge cases with zero field evidence |
| 3 nav-click error | **Classify navigation-teardown errors, return `navigated: true`** | (B) pre-detect navigation by racing the click against a listener — latency + complexity to dress up what the mandatory re-observe already settles |

Standing doctrine note (Roi, locked): **`navigated: true` is a hint, never a promise.** The agent
must still re-observe and verify the screen. Same doctrine drives Bug 1's verify-by-re-observe.

## 3. Bug 1 design — `/dismiss` verify-by-re-observe

### 3.1 New pipeline (`src/commands/dismiss.ts`)

```
observe (baseline) → pickDismissTargets → click pick #1 (ANY error tolerated;
verification decides) → observe (verify) → report from reality
```

A dismiss is recorded iff the overlay the button belonged to is **absent from the verify
observe**, matched by **kind + name** (refs die between observes; kind+name is the stable
identity we have). Precisely: dismissed iff the count of overlays sharing the target
overlay's (kind, name) pair **decreased** between baseline and verify — this stays correct
when several overlays share a name or the name is empty. When the picked button has no linked
overlay (it was chosen via `covered`/`occludedBy`), the fallback rule is: dismissed iff the
**total overlay count decreased**. The popup vanishing mid-click — today's swallowed failure —
becomes the proof of success.

- No picks found → no click, no second observe; return the baseline observation.
- Click threw but overlay gone → **dismissed** (this is the H1 case).
- Click clean but overlay still present → **not dismissed** (no more silent false success).
- One pick per call stays (existing one-wall-per-call loop contract).

### 3.2 Overlay→button containment linkage (`src/commands/perception/walk.ts`)

Inside `WALK_SRC`, the overlay scan and the element collection run in the same pass, so
containment is computed in-page: for each collected interactive element, record the index of
the overlay element that contains it (`overlayEl.contains(el)`), if any, as
`WalkMeta.overlayIndex?: number` (top frame only — overlays are top-frame only today).

- `ObserveAction` gains optional **`overlayIndex?: number`** (index into the response's
  `overlays` array) — agent-visible signal that a button is part of popup #i, and the linkage
  the dismiss verification needs to know *which* overlay to check for. (Refined from the
  earlier `inOverlay: true` sketch: a bare boolean can't tell the verifier which overlay.)
- `pickDismissTargets` gate tightens to: label hit **and** (`overlayIndex != null` **or**
  `state === "covered"` **or** `occludedBy != null`). The bare `state === "actionable"` escape
  hatch is removed — that is what could click a page's own "Continue."
- The always-null `ref` field on overlay output entries is **dropped** (its only consumer was
  the dead check). `ObserveOverlay` type and api-reference updated.

### 3.3 Overlay false-positive refinement (`walk.ts` `overlays()`)

Current heuristic: `position ∈ {fixed, absolute, sticky}` + >25% viewport coverage. Refined:

- `position: fixed` → counts, as today (cookie walls, app banners).
- `role=dialog` / `role=alertdialog` / `aria-modal="true"` → counts regardless of position.
- `position: absolute|sticky` → counts **only with an explicit positive z-index**
  (computed `z-index` ≠ `auto` and > 0). Real popups float above content; layout containers
  like the Calendar grid don't set one.

Thresholds (25% overlay / 60% blocking / 90% modal) unchanged — no field evidence against them.

### 3.4 New response shape (`DismissOutput` in `src/sessions/types.ts`)

```jsonc
{
  "pageId": "...",
  "dismissed": [{ "ref": "obs_x.e3", "name": "Continue" }],  // verified-gone only
  "overlaysRemaining": 0,        // from the verify observe; >0 ⇒ call again / other labels
  "observation": { /* full ObserveResult from the latest internal observe */ }
}
```

`observation` is the one scope addition (Roi-approved): dismiss already rolls the ref cache
twice internally, killing the agent's old refs; returning the final observe hands back fresh
refs + diff and saves the agent a third full page walk. When nothing was clicked,
`observation` is the baseline observe and `dismissed` is `[]`.

## 4. Bug 2 design — descendant aria-label peek (`walk.ts` `accName()`)

Name resolution order becomes: own `aria-label` → `placeholder` → attached `label[for]` →
`name`/`title` → `innerText` → **NEW, last resort:** first descendant matching `[aria-label]`,
borrow its label.

```js
const txt = (el.innerText || "").trim();
if (txt) return txt;
const labelled = el.querySelector("[aria-label]");
if (labelled) { const v = labelled.getAttribute("aria-label"); if (v && v.trim()) return v.trim(); }
return "";
```

Order is deliberate: visible text still wins when present (a "Save ⭐" button stays "Save",
not "star"); **nothing that has a name today changes.** Cost: one `querySelector` per
*nameless* element only. Effect: the name lands in the structural signature too, so icon
buttons become visible to the change-diff and targetable by role+name instead of coordinates.

Explicitly not the W3C algorithm (no `aria-labelledby`, no `img[alt]`, no recursive text
aggregation): upgrade only when a real page defeats the peek, with evidence.

## 5. Bug 3 design — navigation-tolerant click / press / select-option

### 5.1 Classifier (`src/commands/input-errors.ts`)

```ts
export const NAVIGATION_TEARDOWN_PATTERNS = [
  "Execution context was destroyed",
  "Element is not attached",
  "Target page, context or browser has been closed",
];
export function isNavigationTeardown(err: unknown): boolean { /* message substring match */ }
```

Message-substring matching is mildly brittle across Playwright upgrades — the pattern list
lives in this one exported constant, **pinned by a unit test**, so a wording change screams
in CI instead of silently regressing.

### 5.2 Application

Applied in the **click, press, and select-option** handlers (the three actions that plausibly
trigger immediate navigation: nav-clicks, Enter-submits, onchange redirects — one failure
class, fixed uniformly). `type` is excluded: filling a field doesn't navigate; an error there
is a real error. On a classified error the handler returns success with the flag, e.g.
`ClickOutput` → `{ pageId, clicked: true, navigated: true }` (likewise `press`,
`select-option`; `navigated` is optional and absent on the normal path).

Ordering: `TimeoutError` mapping (`ELEMENT_NOT_FOUND` / `ELEMENT_NOT_ACTIONABLE` /
`WAIT_TIMEOUT`) runs first and is untouched; teardown classification applies to the
non-timeout remainder; anything unclassified still escapes as today.

## 6. Contract & docs changes

- `docs/api-reference.md`: dismiss response shape; overlays lose `ref`; actions gain optional
  `overlayIndex`; click/press/select-option outputs gain optional `navigated`.
- `docs/agent-playbook.md`: recovery section for nav-clicks rewritten to "re-observe and
  verify the screen" (replaces the "pull a debug-bundle" advice); `navigated: true` documented
  as hint-not-promise; dismiss loop section updated for `overlaysRemaining` + `observation`.
  Folds in backlog item 7 (playbook example shows stale bare `e0` refs; live format is
  `obs_<id>.eN`) since we are editing those lines anyway.

## 7. Testing

Unit (vitest) + real-Chromium integration, per project convention. The fixtures reproduce the
real field failures first — these tests can fail honestly (Testing Honesty):

- **Bug 1:** cookie-wall fixture → `dismissed` reported + `overlaysRemaining: 0`; the
  under-report scenario (dismiss button removes the overlay *and itself*, click throws) →
  still reported dismissed; click-succeeds-but-overlay-stays fixture → NOT reported dismissed;
  containment: page-level "Continue" button outside the overlay is NOT picked; false-positive
  fixture (large absolutely-positioned grid, z-index auto) → not an overlay; fixed banner and
  `role=dialog` → still detected. Unit: `pickDismissTargets` with the tightened gate.
- **Bug 2:** icon-only button (`div[role=button] > svg[aria-label]`) → named from descendant;
  button with text + inner labeled icon → text wins; existing named elements unchanged.
- **Bug 3:** click a real navigating link → `{ clicked: true, navigated: true }`; press Enter
  in a form that navigates → same; genuine timeout/not-found errors keep their codes; unit
  test pins `NAVIGATION_TEARDOWN_PATTERNS`.

Implementation note: before touching shared symbols (`ObserveAction`, `DismissOutput`,
`withActionErrors`), check blast radius via `graphify affected "<Symbol>"` (AGENTS.md rule).

## 8. Out of scope (named so they don't creep in)

From the same pass-2 backlog, deliberately not in this fix: full W3C accessible-name
algorithm; diff blind spots (backlog item 4 — doc/design); observe cost/cap tuning (item 5);
`role: null` on bare/legacy markup (item 6); cross-origin iframe overlay detection (spec §16
deferral stands). The operator-skills rewrite to the observe loop is its own queued thread.
