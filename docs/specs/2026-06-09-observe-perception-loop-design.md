# Observe / Perception Loop — Design

- **Date:** 2026-06-09
- **Phase:** 4a (Feather v1 — "It runs errands for me")
- **Status:** APPROVED (brainstorm complete; spike-validated) → next: implementation plan
- **Companion plan:** `docs/specs/2026-06-09-observe-perception-loop-plan.md` (to be written)
- **Spike evidence:** `spikes/observe-perception-spike.mjs` (throwaway; results captured below)
- **Related:** [[adr-0006-agent-interface-neutrality]], [[adr-0005-agentic-north-star]]; stealth baseline is owned by v2 Phase 5d (Stealth Stack)

---

## 1. Problem

The agent works end-to-end, but it is **slow and blind**:

1. **Selector guessing.** `snapshot` returns page *content* (text, links, markdown) but not the *actionable* elements with stable handles. The agent invents `role`/`text`/`css` targets and burns round-trips on `ELEMENT_NOT_FOUND`. This is the "one-by-one, slow" friction.
2. **Blind to changing artifacts.** Banners/overlays silently cover clickable elements; the agent only discovers this by failing with `ELEMENT_NOT_ACTIONABLE`. `dismiss_got_it` in `examples/showcase.sh` is a hardcoded crutch for exactly this blindness.
3. **Screenshots are expensive.** The H1 showcase task hit a 30s font-timeout on screenshot; screenshots are large and pile up in context and on disk.

The agent also cannot cheaply **re-plan as it goes** — every step needs a full re-read to understand what changed.

## 2. What the leading agents do (research)

Convergent findings (Claude for Chrome, ChatGPT Agent, Perplexity Comet, Manus, Anchor, browser-use, LineRetriever):

- **Everyone runs a Perceive → Reason → Act → Observe loop.** Feather's golden loop is the same shape. The differentiator is *how cheaply and richly they perceive*.
- **The accessibility tree / structured DOM beats screenshots.** Claude for Chrome uses the a11y tree primary, screenshots only as fallback — cutting API calls ~50%. A11y-tree parsing is ~93% more token-efficient than raw DOM.
- **Indexed element handles ("set-of-marks" / refs).** Perception returns interactive elements pre-numbered (`[14] button`), so the model acts on a ref deterministically instead of guessing a selector. browser-use injects a DOM-walking script (`buildDomTree.js`) and assigns refs — it does *not* use Playwright's ARIA snapshot, precisely because the pure a11y tree goes sparse on messy/poorly-marked-up sites (Instagram, Google) — Feather's exact targets.
- **Planning-on-the-go = cheap observation reduction, not server-side planning.** LineRetriever keeps only the observation lines relevant to the next steps; browser-use's `extract` pulls only relevant info; Manus re-recites its todo list each step and drops page bodies (keeping the URL). The *plan lives in the agent*, fed by cheap, change-aware perception.

**Takeaway for Feather:** add an **action-shaped** perception primitive (`observe`) that returns numbered actionable elements + overlays + a change-diff, as compact text, no screenshot. The agent keeps the brain.

## 3. Goals / non-goals

**Goals**
- A cheap, text-only `observe` that returns numbered actionable elements, first-class overlays, and a change-diff vs the previous observe.
- Act-by-ref so the agent stops guessing selectors.
- Detect (and, for same-origin, dismiss) the banners that silently block clicks.
- Lower **total round-trips per task**; one `observe` is one fast pass.
- Screenshot disk hygiene + remove the 30s screenshot hang.

**Non-goals (boundaries)**
- **`observe` does not plan.** No LLM call inside Feather. The diff + relevance-sorting *enable* the agent to re-plan; the plan lives in the agent's context. Preserves model-neutrality ([[adr-0006-agent-interface-neutrality]]).
- **`observe` holds no task state** — only a tiny *per-page* last-observation cache (for the diff and act-by-ref), cleared on navigation/close.
- **No new stealth/detectability surface.** `observe` is pure passive reads. The automation-detection baseline is owned by v2 Phase 5d.
- **Cross-origin iframe descent is deferred** (detect-and-report only in v1).

## 4. Locked design decisions

| Decision | Choice | Why |
|---|---|---|
| Perception source | DOM-walk in a CDP **isolated world**; elements keyed by `backendNodeId` (**no DOM mutation**); occlusion via `elementFromPoint` ("between B and C") | Handles sparse-ARIA sites (spike: IG `DIV role=button` login caught); detects occluding banners; isolated world + no mutation = no new detectability risk |
| `observe` vs `snapshot` | Two separate commands, complementary | `snapshot` = reading (text/markdown); `observe` = acting (refs/overlays/diff) |
| Planning | Agent-side; Feather perceives only | Model-neutral; thin runtime |
| Diff identity | `backendNodeId` (persists for node lifetime) | Refs refresh each observe; need stable cross-observe key |
| Ref lifetime | Valid only until the next `observe` on that page (or navigation) | Enforces observe-before-act; frees implementation to rebuild the isolated world per observe |
| Frames | Walk top frame + **same-origin** frames; **detect-and-report** cross-origin walls (don't enter) | Most blocking banners are same-origin (Google "Got it", IG, many CMPs); leaner + flat detectability; `await-human` is the fallback for cross-origin walls |
| Auto-dismiss | Separate explicit **read-only-observe / side-effecting-dismiss** split | Keeps `observe` pure passive reads (detectability guarantee) |

## 5. The `observe` contract

**`POST /v1/sessions/:sessionId/observe`**

Request:
```jsonc
{ "pageId"?: string, "cap"?: 80, "viewportOnly"?: false, "includeText"?: false }
```

Response `data`:
```jsonc
{
  "pageId": "pg_1",
  "url": "https://instagram.com/accounts/login",
  "title": "Login • Instagram",
  "observeId": "obs_a1b2",            // identity to diff the NEXT observe against
  "actions": [                         // sorted: actionable-in-viewport, then covered, then off-screen
    { "ref": "e0", "role": "textbox", "name": "Phone/email", "tag": "INPUT",
      "box": {"x":40,"y":120,"w":268,"h":38}, "state": "actionable" },
    { "ref": "e2", "role": "button", "name": "Log In", "tag": "DIV",
      "box": {"x":40,"y":210,"w":268,"h":32}, "state": "actionable" },
    { "ref": "e9", "role": "link", "name": "Sign in", "tag": "A",
      "box": {"x":12,"y":18,"w":54,"h":20}, "state": "covered",
      "occludedBy": { "kind": "iframe", "name": "consent" } }
  ],
  "overlays": [
    { "ref": null, "kind": "iframe", "name": "cookie consent", "coverPct": 100, "blocking": true }
  ],
  "diff": {                            // null on the first observe of a page (or after navigation)
    "added":   [ { "ref": "e2", "desc": "button 'Log In'" } ],
    "removed": [ { "desc": "button 'Loading…'" } ],
    "changed": [ { "ref": "e0", "change": "now-actionable", "was": "covered" } ]
  },
  "stats": { "totalInteractive": 44, "returned": 12, "elapsedMs": 38 }
}
```

- `ref` (`e0`…): handle to act on **this turn**; refreshes every observe.
- `state`: `actionable | covered | disabled | offscreen` — lets the agent prioritize and know *why* it can't click.
- `occludedBy`: `{ kind: "overlay"|"iframe"|"element", name? }` — the thing in the way.
- `overlays`: first-class list of viewport-covering layers (`kind: modal|banner|iframe`), with `blocking` + `coverPct`.
- `text`: omitted by default (`snapshot` owns reading); `includeText:true` adds a short excerpt.

**Agent loop becomes:** `observe → act by ref → observe (read diff) → repeat`.

### Efficiency contract
One batched walk per `observe`. Element *metadata* (role/name/box/state/occlusion) is gathered in a **single** isolated-world evaluation. Element *identity* (`backendNodeId`) must be acquired in **batch**, not one sequential CDP `describeNode` per element — the spike's per-element loop was a probe artifact, not the production path. The plan resolves the exact batch mechanism (candidate: a single `DOMSnapshot.captureSnapshot`, which returns `backendNodeId`s + layout for the whole document in one call, mapped onto the walk's interactive set). Results are **capped** (default 80) and **viewport-first sorted**. One `observe` ≈ one fast read. Net effect: fewer total round-trips per task, because the guess→fail→re-snapshot loop disappears.

## 6. Change-diff mechanism

- Per-page cache stores the previous observe as `backendNodeId → { ref, name, role, state }`.
- Each observe compares the **full interactive set** (not just the capped display list, so an element falling below the cap is not a false "removed"):
  - **added** — node present now, absent before
  - **removed** — present before, gone now
  - **changed** — same node, `state` flipped or name changed
- Entries carry the element's **current ref** where it still exists.
- Cache invalidated on `framenavigated`; first observe after navigation returns `diff: null`.

## 7. Act-by-ref

New target type accepted by `click` / `type` / `press` / `select-option` / `wait`:
```jsonc
{ "by": "ref", "ref": "e2" }
```
- Resolution extends the shared `resolveLocator(page, target)` in `src/browser/locators.ts`: ref → per-page observe cache → resolve to a Playwright `ElementHandle` (same `.click()`/`.fill()`/`.press()` API the commands already use via `withActionErrors`).
- Becomes targeting cheat-sheet **#1** (most robust *and* fastest — no guessing). Fully backward-compatible; `role`/`text`/`css` unchanged.
- Stale/unknown ref → **`REF_EXPIRED` (409)**; recovery = re-observe.

## 8. Occlusion, overlays, iframes, noise

- **Occlusion:** `elementFromPoint` at element center (plus sample points for large elements). Top element ≠ element and not ancestor/descendant → `covered`; record occluder.
- **Overlays:** scan for `fixed`/`absolute`/`sticky` elements covering > ~25% of viewport with `pointer-events ≠ none`; **exclude `html`/`body`** (kills the scroll-lock false positive seen in the spike); classify `modal`/`banner`/`iframe`; dedupe against occluders.
- **Frames:** walk top + **same-origin** frames (tag actions with `frameId`, merge). Cross-origin walls are reported as a blocking overlay; **not entered** in v1.
- **Noise filtering:** collapse SVG internals (`path`/`g`) to clickable ancestor; drop a child duplicating an interactive ancestor's text+box; drop nameless role-less non-inputs. Heuristics pinned to fixtures in tests.

## 9. Auto-dismiss helper

`observe` stays **strictly read-only** (passive reads only — the detectability guarantee). Dismissal is separate:

**`POST /v1/sessions/:sessionId/dismiss`** — matches just-observed overlay/action names against a small built-in affirmative-dismiss label list (`Accept all`, `I agree`, `Allow all`, `Got it`, `Accept`, `Close`, `Continue`), clicks the best match **by ref**, verifies via the next observe's diff. Returns `{ dismissed: [...] }` (empty = no-op, not an error). Never clicks `Reject`/`Manage` unless an explicit `labels` override is passed. Retires `dismiss_got_it`.

## 10. Screenshot disk cleanup (rider)

Two fixes to `src/commands/screenshot.ts` (writes to `session.debugDir/screenshots/`):
- **Retention:** keep newest N per session (default ~20); delete the dir on session close via the existing `debugDir` teardown.
- **No more 30s hang:** default `timeout` ~8s and `animations: "disabled"` so a screenshot cannot stall the loop on web-font loading.

## 11. Error handling

| Code | HTTP | Meaning | Recovery |
|---|---|---|---|
| `REF_EXPIRED` | 409 | ref is from a superseded observe (or post-navigation) | re-observe, use a fresh ref |
| `PAGE_NOT_FOUND` | 404 | bad `pageId` on observe | omit `pageId` or list tabs (existing) |
| `INTERNAL_ERROR` | 500 | walk failed | pull `debug-bundle`, quote `requestId` (existing) |

`dismiss` matching nothing → `ok` with empty `dismissed`.

## 12. Testing strategy (Testing-Honesty bar)

- **Unit (controlled fixtures; the spike's synthetic overlay page becomes a fixture):**
  - Occlusion ground-truth: a button under a fixed overlay **must** be flagged `covered`, the overlay button **must not** — a test that genuinely fails if occlusion regresses.
  - Noise-collapse: SVG/duplicate-child fixtures.
  - Diff: two observes over a mutating fixture → assert `added`/`removed`/`changed`.
- **Act-by-ref:** observe → click by ref → assert the correct element was hit; stale ref → `REF_EXPIRED`.
- **Integration (real Chromium):** locally-served page with a same-origin overlay + same-origin iframe → assert overlay flagged, frame walked, cross-origin reported.
- No green-for-green tests; failures must mean something.

## 13. File structure & integration seams

- `src/commands/observe.ts` — handler
- `src/commands/perception/walk.ts` — injected walk fn + isolated-world runner
- `src/commands/perception/diff.ts` — diff computation
- `src/commands/perception/occlusion.ts` — occlusion + overlay scan
- `src/commands/dismiss.ts` — auto-dismiss helper
- `src/sessions/types.ts` — `ObserveResult`, `ObserveAction`, `Overlay`, `ObserveDiff`
- `src/browser/locators.ts` — extend `resolveLocator` for `{by:"ref"}`
- Per-page last-observe cache — on the session/page object; cleared on `framenavigated` + close
- Route wiring (alongside `snapshot`); docs: `docs/agent-playbook.md` (new golden loop + cheat-sheet #1 = act-by-ref) and `docs/api-reference.md`

## 14. Detectability analysis

`observe` adds **no new detectability risk** beyond Feather's existing automation baseline:
- **Passive reads only** — `elementFromPoint`, `getComputedStyle`, `getBoundingClientRect` fire no events, trip no mutation observers, leave no trace.
- **No DOM mutation** — elements keyed by `backendNodeId`; we never inject `data-*` refs or highlight boxes (the detectable part of naive injected-DOM-walk approaches).
- **Isolated world** — the walk runs in a separate JS context the page cannot read.
- The residual baseline (CDP/`Runtime` domain, `navigator.webdriver`, headless signals) is **pre-existing** and unchanged by `observe`; it is owned by v2 Phase 5d (Stealth Stack).

## 15. Spike evidence (2026-06-09)

`spikes/observe-perception-spike.mjs`, run against Playwright 1.60 / Chromium 1223:
- **Controlled ground truth:** real button / input / link under a fixed overlay → all correctly `covered`; overlay button correctly not covered; overlay detected; **ref→act clicked the overlay button via `backendNodeId` with no DOM mutation.**
- **Instagram login (sparse ARIA):** walk caught `email`, `pass`, and the `DIV role=button` "Log In" — where a pure a11y/tag reader would fumble.
- **Guardian (real consent):** consent wall is a cross-origin iframe (`z=2147483647`); 43 top-frame elements correctly flagged `[COVERED by IFRAME]`.
- **Refinements folded into this design:** noise filtering (SVG/duplicate children), same-origin-frame walk / cross-origin detect-only, overlay-scan `html`/`body` exclusion.

## 16. Deferred / open

- **Cross-origin iframe descent** (clicking inside third-party CMP iframes) — fast-follow after the core proves out; `await-human` is the v1 fallback.
- **Goal-aware relevance filtering** (LineRetriever-style, LLM-based) — deliberately *not* built (would add a model dependency); deterministic relevance-sorting covers most of the benefit.
- **v1/v2 boundary:** this is v1 perception ergonomics. Stealth hardening of the automation baseline stays v2 (Phase 5d).
