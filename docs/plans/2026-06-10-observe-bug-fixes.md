# Observe Loop Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the three observe-loop bugs from the pass-2 field run: `/dismiss` under-reporting (verify-by-re-observe + overlay containment + false-positive fix), the accessible-name gap on icon-only buttons (descendant aria-label peek), and INTERNAL_ERROR on navigation-triggering clicks (`navigated: true`).

**Architecture:** All perception changes live in the in-page walk IIFE (`src/commands/perception/walk.ts`) and flow through `observe.ts` types; the dismiss pipeline gains a verify observe (`src/commands/dismiss.ts`); navigation tolerance is one classifier in `src/commands/input-errors.ts` applied in three handlers. Spec: `docs/specs/2026-06-10-observe-bug-fixes-design.md`.

**Tech Stack:** TypeScript 5.4 / Playwright 1.60 / Fastify 5.8 / Vitest (unit `npm test`, real-Chromium integration `npm run test:integration`).

**Conventions that apply to every task:**
- Run from the repo root. Unit tests: `npm test -- <file>`; integration: `npm run test:integration -- <file>`; typecheck: `npm run typecheck`.
- `tests/integration/continuity.test.ts` fails pre-existing — ignore it; never "fix" it here.
- Before modifying a shared type, check blast radius: `graphify affected "<Symbol>"` (e.g. `Overlay`, `DismissOutput`). Answers are `file:line`; visit each consumer.
- Commit after each task; work on `dev`.

---

### Task 1: Navigation-teardown classifier

**Files:**
- Modify: `src/commands/input-errors.ts` (append at end)
- Test: `tests/unit/commands/input-errors.test.ts` (append)

- [ ] **Step 1: Write the failing test** — append to `tests/unit/commands/input-errors.test.ts`:

```ts
import { isNavigationTeardown, NAVIGATION_TEARDOWN_PATTERNS } from "../../../src/commands/input-errors";

describe("isNavigationTeardown", () => {
  it("classifies the three Playwright teardown error families", () => {
    expect(isNavigationTeardown(new Error("Execution context was destroyed, most likely because of a navigation"))).toBe(true);
    expect(isNavigationTeardown(new Error("Element is not attached to the DOM"))).toBe(true);
    expect(isNavigationTeardown(new Error("Target page, context or browser has been closed"))).toBe(true);
  });
  it("does not classify ordinary errors or timeouts", () => {
    expect(isNavigationTeardown(new Error("boom"))).toBe(false);
    expect(isNavigationTeardown("not even an error")).toBe(false);
  });
  it("pins the pattern list so a Playwright upgrade that changes wording screams here", () => {
    expect(NAVIGATION_TEARDOWN_PATTERNS).toEqual([
      "Execution context was destroyed",
      "Element is not attached",
      "Target page, context or browser has been closed",
    ]);
  });
});
```

- [ ] **Step 2: Run it, verify it fails** — `npm test -- tests/unit/commands/input-errors.test.ts` → FAIL: `isNavigationTeardown` is not exported.

- [ ] **Step 3: Implement** — append to `src/commands/input-errors.ts`:

```ts
/** Playwright error families meaning "the action fired and then the page moved on".
 * Message-substring matching is brittle across Playwright upgrades by nature — this list is
 * pinned by a unit test so a wording change fails CI instead of silently regressing. */
export const NAVIGATION_TEARDOWN_PATTERNS = [
  "Execution context was destroyed",
  "Element is not attached",
  "Target page, context or browser has been closed",
];

export function isNavigationTeardown(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : "";
  return NAVIGATION_TEARDOWN_PATTERNS.some((p) => msg.includes(p));
}
```

- [ ] **Step 4: Run it, verify it passes** — same command → PASS (all describe blocks).

- [ ] **Step 5: Commit**

```bash
git add src/commands/input-errors.ts tests/unit/commands/input-errors.test.ts
git commit -m "feat(input): navigation-teardown error classifier, pattern list pinned by test"
```

---

### Task 2: `navigated: true` on click / press / select-option

**Files:**
- Modify: `src/sessions/types.ts:119` (ClickOutput), `:128-131` (SelectOptionOutput), `:140` (PressOutput)
- Modify: `src/commands/click.ts`, `src/commands/press.ts`, `src/commands/select-option.ts`
- Test: `tests/unit/commands/click.test.ts`, `tests/unit/commands/press.test.ts`, `tests/unit/commands/select-option.test.ts` (append to each)
- Test: `tests/integration/input-commands.integration.test.ts` (append)

- [ ] **Step 1: Write the failing unit tests.** Append to `tests/unit/commands/click.test.ts` inside `describe("ClickHandler")` (the file already mocks `resolveActionable` and provides `fakeAct`/`probe`/`mockManager`/`ctx` — reuse them):

```ts
  it("returns clicked+navigated when the click dies to navigation teardown", async () => {
    fakeAct.click.mockRejectedValueOnce(new Error("Execution context was destroyed, most likely because of a navigation"));
    const result = await new ClickHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "a" } }, ctx);
    expect(result).toEqual({ pageId: "page_001", clicked: true, navigated: true });
  });

  it("still rethrows non-navigation errors", async () => {
    fakeAct.click.mockRejectedValueOnce(new Error("boom"));
    await expect(new ClickHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "a" } }, ctx)).rejects.toThrow("boom");
  });
```

Append the same two cases to `tests/unit/commands/press.test.ts` and `tests/unit/commands/select-option.test.ts`, adapted to each file's existing mock names and call shape (press: expect `{ pageId: "page_001", pressed: "Enter", navigated: true }`; select-option with `values: "b"`: expect `{ pageId: "page_001", selected: ["b"], navigated: true }` — on teardown the handler echoes the requested values since the real selection can't be read back).

- [ ] **Step 2: Run them, verify they fail** — `npm test -- tests/unit/commands/click.test.ts tests/unit/commands/press.test.ts tests/unit/commands/select-option.test.ts` → the new cases FAIL (error escapes / wrong shape).

- [ ] **Step 3: Add the optional flag to the three output types** in `src/sessions/types.ts`:

```ts
export interface ClickOutput { pageId: string; clicked: true; navigated?: true; }
// ...
export interface SelectOptionOutput {
  pageId: string;
  selected: string[];
  navigated?: true;
}
// ...
export interface PressOutput { pageId: string; pressed: string; navigated?: true; }
```

- [ ] **Step 4: Implement the wrap in each handler.** `src/commands/click.ts` — replace the `execute` body's action line and return:

```ts
import { withActionErrors, isNavigationTeardown } from "./input-errors";
// ... in execute(), replacing the final two lines:
    const { act, probe } = resolveActionable(page, target, refLookup);
    try {
      await withActionErrors(probe, "click", () => act.click({ timeout: timeoutMs ?? 15000 }));
      return { pageId: resolvedPageId, clicked: true };
    } catch (err) {
      if (isNavigationTeardown(err)) return { pageId: resolvedPageId, clicked: true, navigated: true };
      throw err;
    }
```

(`withActionErrors` maps `TimeoutError` to coded errors *first*; only the non-timeout remainder reaches the classifier — spec §5.2 ordering.)

`src/commands/press.ts` — wrap both branches (a bare `page.keyboard.press("Enter")` submits forms too):

```ts
    try {
      if (target) {
        const refLookup = (r: string) => session.getObserveCache(resolvedPageId)?.refs.get(r);
        const { act, probe } = resolveActionable(page, target, refLookup);
        await withActionErrors(probe, "press", () => act.press(key, { timeout: timeoutMs ?? 15000 }));
      } else {
        await page.keyboard.press(key);
      }
      return { pageId: resolvedPageId, pressed: key };
    } catch (err) {
      if (isNavigationTeardown(err)) return { pageId: resolvedPageId, pressed: key, navigated: true };
      throw err;
    }
```

`src/commands/select-option.ts`:

```ts
    try {
      const selected = await withActionErrors(probe, "select-option", () =>
        act.selectOption(values, { timeout: timeoutMs ?? 15000 })
      );
      return { pageId: resolvedPageId, selected };
    } catch (err) {
      if (isNavigationTeardown(err)) {
        return { pageId: resolvedPageId, selected: Array.isArray(values) ? values : [values], navigated: true };
      }
      throw err;
    }
```

`type.ts` is deliberately untouched (spec §5.2: filling doesn't navigate; an error there is real).

- [ ] **Step 5: Run unit tests + typecheck, verify pass** — same test command as Step 2 plus `npm run typecheck` → PASS / clean.

- [ ] **Step 6: Write the integration test** — append to `tests/integration/input-commands.integration.test.ts`, reusing that file's existing server/`api()` helpers (same pattern as `tests/integration/dismiss.integration.test.ts`):

```ts
  it("click that triggers navigation returns 200, never INTERNAL_ERROR", async () => {
    const page2 = encodeURIComponent(`<!DOCTYPE html><html><body><h1>arrived</h1></body></html>`);
    const page1 = encodeURIComponent(
      `<!DOCTYPE html><html><body><a id="go" href="data:text/html,${page2}">Go</a></body></html>`);
    // launch a session with this file's existing launch helper/pattern, then:
    await api("POST", `/v1/sessions/${sessionId}/navigate`, { url: `data:text/html,${page1}`, waitUntil: "domcontentloaded" });
    const res = await api("POST", `/v1/sessions/${sessionId}/click`, { target: { by: "css", selector: "#go" } });
    expect(res.status).toBe(200);             // the contract under test: success, with or without the flag
    expect(res.body.data.clicked).toBe(true); // navigated may or may not appear — Playwright often survives clean link clicks
  }, 60000);

  it("press Enter in a form that navigates returns 200, never INTERNAL_ERROR", async () => {
    const page2 = encodeURIComponent(`<!DOCTYPE html><html><body><h1>submitted</h1></body></html>`);
    const page1 = encodeURIComponent(
      `<!DOCTYPE html><html><body><form action="data:text/html,${page2}"><input id="q" name="q"></form></body></html>`);
    await api("POST", `/v1/sessions/${sessionId}/navigate`, { url: `data:text/html,${page1}`, waitUntil: "domcontentloaded" });
    const res = await api("POST", `/v1/sessions/${sessionId}/press`, { target: { by: "css", selector: "#q" }, key: "Enter" });
    expect(res.status).toBe(200);
    expect(res.body.data.pressed).toBe("Enter");
  }, 60000);
```

Honesty note: a deterministic in-fixture reproduction of the teardown race is not reliably possible (Playwright usually wins on simple pages); the classifier behavior is deterministically covered by the Step-1 unit tests, and this integration test pins the user-visible contract (nav-click ⇒ 200).

- [ ] **Step 7: Run integration test, verify pass** — `npm run test:integration -- tests/integration/input-commands.integration.test.ts` → PASS.

- [ ] **Step 8: Commit**

```bash
git add src/sessions/types.ts src/commands/click.ts src/commands/press.ts src/commands/select-option.ts tests/unit/commands tests/integration/input-commands.integration.test.ts
git commit -m "feat(input): nav-teardown on click/press/select-option returns navigated:true instead of 500"
```

---

### Task 3: accName descendant aria-label peek

**Files:**
- Modify: `src/commands/perception/walk.ts:62-71` (the `accName` function inside `WALK_SRC`)
- Test: `tests/integration/perception-walk.integration.test.ts` (append)

- [ ] **Step 1: Write the failing tests** — append inside `describe("walkAllFrames")` (reuse the file's `pageWith` helper; dispose handles + close context exactly like the existing cases):

```ts
  it("names icon-only buttons from a descendant aria-label", async () => {
    const page = await pageWith(`<div role="button" id="like"><svg aria-label="Like" width="24" height="24"><rect width="24" height="24"/></svg></div>`);
    const { actions } = await walkAllFrames(page);
    const like = actions.find((a) => a.meta.role === "button");
    expect(like!.meta.name).toBe("Like");
    for (const a of actions) await a.handle.dispose();
    await page.context().close();
  });

  it("prefers visible text over a descendant aria-label", async () => {
    const page = await pageWith(`<button>Save<svg aria-label="star" width="10" height="10"><rect width="10" height="10"/></svg></button>`);
    const { actions } = await walkAllFrames(page);
    const btn = actions.find((a) => a.meta.tag === "BUTTON");
    expect(btn!.meta.name).toBe("Save");
    for (const a of actions) await a.handle.dispose();
    await page.context().close();
  });
```

- [ ] **Step 2: Run them, verify the first fails** — `npm run test:integration -- tests/integration/perception-walk.integration.test.ts` → icon-only case FAIL (name `""`); text-preference case may already pass (it pins the ordering).

- [ ] **Step 3: Implement** — in `WALK_SRC`'s `accName`, replace the final line `return (el.innerText || "").trim();          // NEVER el.value` with:

```js
    const txt = (el.innerText || "").trim();     // NEVER el.value
    if (txt) return txt;
    const labelled = el.querySelector("[aria-label]");   // icon-only buttons: borrow the icon's label, last resort
    if (labelled){ const v = labelled.getAttribute("aria-label"); if (v && v.trim()) return v.trim(); }
    return "";
```

- [ ] **Step 4: Run the full walk integration file, verify pass** (including the pre-existing cases — nothing that has a name today may change) → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/commands/perception/walk.ts tests/integration/perception-walk.integration.test.ts
git commit -m "fix(observe): name icon-only elements from a descendant aria-label (IG Like-button gap)"
```

---

### Task 4: Overlay false-positive refinement (z-index gate + dialog roles)

**Files:**
- Modify: `src/commands/perception/walk.ts:94-110` (the `overlays` function inside `WALK_SRC`)
- Test: `tests/integration/perception-walk.integration.test.ts` (append)

- [ ] **Step 1: Write the failing tests:**

```ts
  it("does not report a large absolutely-positioned layout grid (no z-index) as an overlay", async () => {
    const page = await pageWith(`<div style="position:absolute;top:0;left:0;width:100%;height:90%"><button>Cell</button></div>`);
    const { actions, overlays } = await walkAllFrames(page);
    expect(overlays).toEqual([]);          // the Calendar-grid false positive
    for (const a of actions) await a.handle.dispose();
    await page.context().close();
  });

  it("still reports absolutely-positioned overlays that carry an explicit z-index, and dialog-role elements", async () => {
    const page = await pageWith(`
      <div style="position:absolute;top:0;left:0;width:100%;height:70%;z-index:50"><button>Accept all</button></div>`);
    const { actions, overlays } = await walkAllFrames(page);
    expect(overlays.length).toBe(1);
    for (const a of actions) await a.handle.dispose();
    await page.context().close();

    const page2 = await pageWith(`
      <div role="dialog" style="position:absolute;top:0;left:0;width:100%;height:70%"><button>OK</button></div>`);
    const r2 = await walkAllFrames(page2);
    expect(r2.overlays.length).toBe(1);
    for (const a of r2.actions) await a.handle.dispose();
    await page2.context().close();
  });
```

(The existing first test in this file pins that `position:fixed` overlays keep working with no z-index requirement.)

- [ ] **Step 2: Run, verify the grid case fails** (today it reports a banner) and note the z-index/dialog expectations.

- [ ] **Step 3: Implement** — in `WALK_SRC`'s `overlays()`, replace the loop's filter head (everything from `const cs = ...` through `if (cs.pointerEvents === "none") continue;`) with:

```js
      const cs = getComputedStyle(el);
      const role = el.getAttribute("role");
      const dialogish = role === "dialog" || role === "alertdialog" || el.getAttribute("aria-modal") === "true";
      if (!dialogish && !["fixed","absolute","sticky"].includes(cs.position)) continue;
      if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) continue;
      if (cs.pointerEvents === "none") continue;
      if (!dialogish && cs.position !== "fixed"){
        const z = parseInt(cs.zIndex, 10);          // "auto" → NaN
        if (!(z > 0)) continue;                     // absolute/sticky must explicitly float above content
      }
```

Coverage math, thresholds (25/60/90), and kind/name/blocking fields stay exactly as they are.

- [ ] **Step 4: Run the full walk integration file, verify pass** → PASS (existing fixed-overlay cases included).

- [ ] **Step 5: Commit**

```bash
git add src/commands/perception/walk.ts tests/integration/perception-walk.integration.test.ts
git commit -m "fix(observe): absolute/sticky overlays need explicit z-index; dialog roles always count (Calendar-grid false positive)"
```

---

### Task 5: Overlay→action containment linkage; drop dead `Overlay.ref`

**Files:**
- Modify: `src/commands/perception/walk.ts` (`WalkMeta`, `WALK_SRC` tail, `walkAllFrames`)
- Modify: `src/commands/observe.ts:48-52,61` (action mapping, overlay mapping)
- Modify: `src/sessions/types.ts:77-93` (`ObserveAction`, `Overlay`)
- Test: `tests/integration/perception-walk.integration.test.ts`, `tests/unit/dismiss-match.test.ts` (fixture compile fixes)

- [ ] **Step 1: Blast radius first** — `graphify affected "Overlay"` and `graphify affected "ObserveAction"`; visit every consumer `file:line` listed. Expected consumers: `observe.ts`, `dismiss.ts`, the type tests, `dismiss-match.test.ts`. If more appear, account for them before editing.

- [ ] **Step 2: Write the failing integration test:**

```ts
  it("links actions inside an overlay to it via overlayIndex; outside buttons get none", async () => {
    const page = await pageWith(`
      <button id="outside">Continue</button>
      <div style="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center">
        <button id="inside">Accept all</button>
      </div>`);
    const { actions, overlays } = await walkAllFrames(page);
    expect(overlays.length).toBe(1);
    expect(actions.find((a) => a.meta.name === "Accept all")!.meta.overlayIndex).toBe(0);
    expect(actions.find((a) => a.meta.name === "Continue")!.meta.overlayIndex).toBeUndefined();
    for (const a of actions) await a.handle.dispose();
    await page.context().close();
  });
```

- [ ] **Step 3: Run, verify it fails** (`overlayIndex` doesn't exist).

- [ ] **Step 4: Implement the walk side.** In `src/commands/perception/walk.ts`:

(a) `WalkMeta` gains the field:

```ts
export interface WalkMeta {
  signature: string;
  role: string | null;
  name: string;
  tag: string;
  box: { x: number; y: number; w: number; h: number };
  state: ActionState;
  occludedBy?: { kind: "overlay" | "iframe" | "element"; name?: string };
  overlayIndex?: number;     // index into the same walk's overlays; set when an overlay element contains this one
}
```

(b) In `WALK_SRC`, change `overlays()` to also return its elements — wrap the existing accumulation: collect `metas.push({ kind, ... })` and `els.push(el)` in parallel arrays and `return { metas, els };` (keep all filter logic from Task 4 untouched).

(c) Replace the IIFE tail:

```js
  const els = [];
  collect(document, els);
  const ov = overlays();
  const metas = els.map(meta);
  metas.forEach((m, i) => {
    const k = ov.els.findIndex((o) => o.contains(els[i]));   // contains() includes self: an interactive overlay self-links, which is correct
    if (k >= 0) m.overlayIndex = k;
  });
  return { elements: els, metas, overlays: ov.metas, total: els.length };
```

(d) In `walkAllFrames`'s `visit()`, overlays are only kept for the top frame — strip child-frame indices so they can't point at dropped overlays. After `const res = await walkFrame(...)`:

```ts
      if (frame !== top) for (const a of res.actions) delete a.meta.overlayIndex;
```

- [ ] **Step 5: Implement the observe/type side.** `src/sessions/types.ts`: `ObserveAction` gains `overlayIndex?: number;` (after `occludedBy`); `Overlay` loses the `ref: string | null;` line. `src/commands/observe.ts`: the action mapping adds `overlayIndex: a.meta.overlayIndex,` to the returned object, and line 61 becomes `overlays,` (drop the `({ ref: null, ...o })` wrapper).

- [ ] **Step 6: Typecheck and fix fixture fallout** — `npm run typecheck`. Expected errors: overlay literals with `ref: null` in `tests/unit/dismiss-match.test.ts` (two places) and possibly `tests/unit/types-observe.test.ts` / `tests/unit/observe-cache.test.ts`. Fix by deleting the `ref: null,` field from overlay literals — nothing else. `pickDismissTargets`' dead check `obs.overlays.some((o) => o.ref != null && o.ref === a.ref)` in `src/commands/dismiss.ts` now fails to compile — delete that clause, keeping the interim gate `const overlayRelated = a.state === "covered" || a.occludedBy != null || a.state === "actionable";` (the old loose behavior, preserved exactly for this commit; Task 6 owns the tightening). The existing dismiss-match unit tests keep passing unchanged under this interim gate.

- [ ] **Step 7: Run** `npm test` and `npm run test:integration -- tests/integration/perception-walk.integration.test.ts tests/integration/observe.integration.test.ts tests/integration/observe-route.integration.test.ts` → PASS.

- [ ] **Step 8: Commit**

```bash
git add src/commands/perception/walk.ts src/commands/observe.ts src/sessions/types.ts src/commands/dismiss.ts tests/
git commit -m "feat(observe): overlay→action containment linkage (overlayIndex); drop dead Overlay.ref"
```

---

### Task 6: Tightened `pickDismissTargets` + `overlayGone` helper

**Files:**
- Modify: `src/commands/dismiss.ts` (`pickDismissTargets`; add `overlayGone`)
- Test: `tests/unit/dismiss-match.test.ts` (rewrite + extend)

- [ ] **Step 1: Write the failing tests** — in `tests/unit/dismiss-match.test.ts`, update the first test's `e0` action to carry `overlayIndex: 0` (it sits inside the modal) and add:

```ts
  it("does NOT pick a label-matching button that is outside any overlay (page-level Continue)", () => {
    const obs = r({
      overlays: [{ kind: "banner", name: "notif", coverPct: 40, blocking: false }],
      actions: [
        { ref: "e0", role: "button", name: "Continue", tag: "BUTTON", box: { x:0,y:0,w:1,h:1 }, state: "actionable" },   // page's own button — no overlayIndex
        { ref: "e1", role: "button", name: "Continue", tag: "BUTTON", box: { x:0,y:0,w:1,h:1 }, state: "actionable", overlayIndex: 0 },
      ],
    });
    expect(pickDismissTargets(obs, DEFAULT_DISMISS_LABELS).map((p) => p.ref)).toEqual(["e1"]);
  });

  it("still picks covered/occluded label matches with no linked overlay", () => {
    const obs = r({
      overlays: [{ kind: "modal", name: "cookies", coverPct: 95, blocking: true }],
      actions: [{ ref: "e0", role: "button", name: "Accept all", tag: "BUTTON", box: { x:0,y:0,w:1,h:1 }, state: "covered" }],
    });
    expect(pickDismissTargets(obs, DEFAULT_DISMISS_LABELS).map((p) => p.ref)).toEqual(["e0"]);
  });

describe("overlayGone", () => {
  const ov = (kind: "modal" | "banner" | "iframe", name: string): Overlay => ({ kind, name, coverPct: 90, blocking: true });
  it("linked pick: true iff the (kind,name) count decreased", () => {
    expect(overlayGone([ov("modal", "cookies")], [], 0)).toBe(true);
    expect(overlayGone([ov("modal", "cookies")], [ov("modal", "cookies")], 0)).toBe(false);
    expect(overlayGone([ov("modal", ""), ov("modal", "")], [ov("modal", "")], 0)).toBe(true);   // unnamed duplicates: count rule
  });
  it("unlinked pick falls back to total count decrease", () => {
    expect(overlayGone([ov("modal", "a")], [], undefined)).toBe(true);
    expect(overlayGone([ov("modal", "a")], [ov("banner", "b")], undefined)).toBe(false);
  });
});
```

Add `overlayGone` and the `Overlay` type to the imports from `../../src/commands/dismiss` / `../../src/sessions/types`.

- [ ] **Step 2: Run, verify failures** — `npm test -- tests/unit/dismiss-match.test.ts` → FAIL (`overlayGone` missing; gate not tightened).

- [ ] **Step 3: Implement** in `src/commands/dismiss.ts` — replace `pickDismissTargets`' filter body and add the helper:

```ts
export function pickDismissTargets(obs: ObserveResult, labels: string[]): ObserveAction[] {
  if (obs.overlays.length === 0) return [];                      // only act when an overlay exists
  const wanted = labels.map((l) => l.toLowerCase());
  return obs.actions.filter((a) => {
    // Tight gate: the button must demonstrably belong to a popup — inside an overlay element,
    // covered by one, or occluded. The old bare-"actionable" escape hatch could click a page's
    // own legitimate "Continue" button.
    const overlayRelated = a.overlayIndex != null || a.state === "covered" || a.occludedBy != null;
    const name = a.name.trim().toLowerCase();
    const labelHit = wanted.some((w) => name === w || name.startsWith(w));
    return labelHit && overlayRelated;
  });
}

/** Verified-dismiss rule (spec §3.1): linked pick ⇒ the (kind,name) overlay count decreased;
 * unlinked pick (covered/occluded) ⇒ total overlay count decreased. */
export function overlayGone(before: Overlay[], after: Overlay[], overlayIndex?: number): boolean {
  if (overlayIndex != null && before[overlayIndex]) {
    const t = before[overlayIndex];
    const count = (list: Overlay[]) => list.filter((o) => o.kind === t.kind && o.name === t.name).length;
    return count(after) < count(before);
  }
  return after.length < before.length;
}
```

(`Overlay` joins the type import from `../sessions/types`.)

- [ ] **Step 4: Run, verify pass** → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/commands/dismiss.ts tests/unit/dismiss-match.test.ts
git commit -m "feat(dismiss): containment-gated target picking + overlayGone verification rule"
```

---

### Task 7: Dismiss verify-by-re-observe pipeline + new response shape

**Files:**
- Modify: `src/sessions/types.ts:116` (`DismissOutput`)
- Modify: `src/commands/dismiss.ts` (`DismissHandler.execute`)
- Test: `tests/integration/dismiss.integration.test.ts` (extend)

- [ ] **Step 1: Blast radius** — `graphify affected "DismissOutput"` and visit consumers (expected: `dismiss.ts`, `routes.ts` pass-through — the route serializes whatever the handler returns, no route change needed).

- [ ] **Step 2: Write the failing integration tests** — in `tests/integration/dismiss.integration.test.ts`, extend the existing test's assertions and add two cases (reuse the file's `api()` + launch pattern; launch one session per case or reuse with fresh `navigate`):

In the existing "dismisses an Accept-all overlay" test, after the dismiss call add:

```ts
    expect(res.body.data.overlaysRemaining).toBe(0);
    expect(res.body.data.observation.observeId).toBeTruthy();   // fresh observation returned, refs usable
    expect(res.body.data.observation.overlays.length).toBe(0);
```

New cases:

```ts
  it("reports dismissed even when the dismiss button detaches itself mid-click (H1 under-report)", async () => {
    // The button removes the overlay (and itself with it) synchronously on mousedown —
    // the historically swallowed teardown; verification must still report it dismissed.
    const html = `<!DOCTYPE html><html><body><p>content</p>
<div id="ov" style="position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9999;display:flex;align-items:center;justify-content:center">
  <button onmousedown="document.getElementById('ov').remove()">Got it</button>
</div></body></html>`;
    // navigate (data: URL, domcontentloaded) as in the existing test, then:
    const res = await api("POST", `/v1/sessions/${sessionId}/dismiss`, {});
    expect(res.status).toBe(200);
    expect(res.body.data.dismissed.map((d: any) => d.name)).toEqual(["Got it"]);
    expect(res.body.data.overlaysRemaining).toBe(0);
  }, 60000);

  it("does NOT report dismissed when the click lands but the overlay stays", async () => {
    const html = `<!DOCTYPE html><html><body><p>content</p>
<div style="position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9999;display:flex;align-items:center;justify-content:center">
  <button onclick="void 0">Got it</button>
</div></body></html>`;
    // navigate as above, then:
    const res = await api("POST", `/v1/sessions/${sessionId}/dismiss`, {});
    expect(res.status).toBe(200);
    expect(res.body.data.dismissed).toEqual([]);              // no more silent false success
    expect(res.body.data.overlaysRemaining).toBe(1);
  }, 60000);
```

- [ ] **Step 3: Run, verify failures** — `npm run test:integration -- tests/integration/dismiss.integration.test.ts` → new assertions FAIL (`overlaysRemaining`/`observation` undefined; stays-case currently reports dismissed).

- [ ] **Step 4: Implement.** `src/sessions/types.ts`:

```ts
export interface DismissOutput {
  pageId: string;
  dismissed: { ref: string; name: string }[];   // verified-gone only
  overlaysRemaining: number;                    // >0 ⇒ another wall is up: call again or adjust labels
  observation: ObserveResult;                   // the latest internal observe — fresh refs + diff, saves a round-trip
}
```

`src/commands/dismiss.ts` — replace `DismissHandler.execute`:

```ts
  async execute(input: DismissInput, ctx: CommandContext): Promise<DismissOutput> {
    const labels = input.labels ?? DEFAULT_DISMISS_LABELS;
    const baseline = await this.observe.execute({ sessionId: input.sessionId, pageId: input.pageId }, ctx);
    const pick = pickDismissTargets(baseline, labels)[0];   // one wall per call; agent re-calls
    if (!pick) {
      return { pageId: baseline.pageId, dismissed: [], overlaysRemaining: baseline.overlays.length, observation: baseline };
    }
    try {
      await this.click.execute({ sessionId: input.sessionId, pageId: baseline.pageId, target: { by: "ref", ref: pick.ref } }, ctx);
    } catch { /* verification decides — a successful dismiss often kills its own button mid-click */ }
    const verify = await this.observe.execute({ sessionId: input.sessionId, pageId: baseline.pageId }, ctx);
    const gone = overlayGone(baseline.overlays, verify.overlays, pick.overlayIndex);
    return {
      pageId: verify.pageId,
      dismissed: gone ? [{ ref: pick.ref, name: pick.name }] : [],
      overlaysRemaining: verify.overlays.length,
      observation: verify,
    };
  }
```

- [ ] **Step 5: Run integration + unit + typecheck, verify pass** — `npm run test:integration -- tests/integration/dismiss.integration.test.ts && npm test && npm run typecheck` → PASS / clean.

- [ ] **Step 6: Commit**

```bash
git add src/sessions/types.ts src/commands/dismiss.ts tests/integration/dismiss.integration.test.ts
git commit -m "feat(dismiss): verify-by-re-observe — report from reality; overlaysRemaining + observation in response"
```

---

### Task 8: Contract & playbook docs

**Files:**
- Modify: `docs/api-reference.md` (dismiss section; observe overlays/actions schema; click/press/select-option outputs)
- Modify: `docs/agent-playbook.md:117` (bare-ref drift), `:154-165` (dismiss), `:275-281` (error table)

- [ ] **Step 1: api-reference.md.** In the observe section: remove `"ref": null` from the overlay schema/example; add `overlayIndex` to the action schema with the line: *"`overlayIndex` (optional): this element sits inside `overlays[overlayIndex]` — i.e. it is part of that popup."* In the dismiss section: replace the return-shape line with the new `{ pageId, dismissed, overlaysRemaining, observation }` shape and the semantics: *"`dismissed` lists only verified-gone overlays — Feather re-observes after the click and reports what is actually true. `overlaysRemaining > 0` means another wall is up: call dismiss again (one wall per call) or pass different `labels`. `observation` is a full, fresh observe result — your previous refs are expired; act from these."* In click/press/select-option outputs: add `navigated` (optional): *"the action fired and the page navigated away mid-action. This is a hint, never a promise — re-observe and verify the screen before continuing. For select-option with `navigated`, `selected` echoes the requested values, unverified."*

- [ ] **Step 2: agent-playbook.md.** Line 117: `(`e0`, `e1`, …)` → `(`obs_<id>.e0`, `obs_<id>.e1`, …)`. Dismiss section (~154–165): update return shape + the same semantics as above, and note the agent need not re-observe after dismiss — `observation` already is the fresh view. Error-table `INTERNAL_ERROR` row (line ~281): replace with: *"Unexpected server error. (Nav-teardown on click/press/select-option no longer lands here — those return `navigated: true`; re-observe and verify.) For a genuine 500: re-observe to check page state, retry once with a fresh ref, then report the `requestId`."* Also scan the playbook for other prose telling the agent to expect INTERNAL_ERROR on nav-clicks and align it.

- [ ] **Step 3: Verify** — `grep -n "ref\": null\|ref: null" docs/api-reference.md docs/agent-playbook.md` → no hits; `grep -n "(\`e0\`" docs/agent-playbook.md` → no hits.

- [ ] **Step 4: Commit**

```bash
git add docs/api-reference.md docs/agent-playbook.md
git commit -m "docs(api,playbook): dismiss verified shape, overlayIndex, navigated:true hint-not-promise, ref-format drift"
```

---

### Task 9: Full verification sweep

- [ ] **Step 1:** `npm run typecheck` → clean.
- [ ] **Step 2:** `npm test` → all pass.
- [ ] **Step 3:** `npm run test:integration` → all pass **except** the known pre-existing `continuity.test.ts` failure (ignore it; do not touch it).
- [ ] **Step 4:** Report results honestly — including any test that needed adjusting along the way and why. If anything is red, stop and fix before declaring done; never skip or weaken a failing assertion to get green.
- [ ] **Step 5:** Commit any stragglers; push is Roi's call per branch policy (remote `dev` push allowed; never `master`).
