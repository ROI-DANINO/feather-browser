# Observe / Perception Loop — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an action-shaped `observe` primitive (numbered actionable elements + first-class overlays + a change-diff), act-by-ref, an opt-in `dismiss` helper, and screenshot disk hygiene — so the agent stops guessing selectors, sees banners, and can re-plan cheaply each step.

**Architecture:** A shadow-piercing, read-only DOM-walk runs per frame via Playwright `evaluateHandle`, yielding live `ElementHandle`s (the refs) plus serialized metadata + a structural signature in ~3 calls/frame. The `ObserveHandler` merges frames, sorts (actionable-first), caps, assigns refs (`e0`…), computes the diff against a per-page cache, and returns text-only JSON. Acting reuses the existing Playwright input layer via a new `{by:"ref"}` target resolved from the cache. No DOM mutation; no input values are ever read.

**Tech stack:** TypeScript, Playwright 1.60, Fastify, Zod, Vitest (unit `vitest.config.ts` + integration `vitest.integration.config.ts`).

**Spec:** `docs/specs/2026-06-09-observe-perception-loop-design.md`

---

## File map

| File | Responsibility | Task |
|---|---|---|
| `src/sessions/types.ts` | `Target` ref variant; `Observe*`/`Dismiss*` IO types; `ObserveCacheEntry` | T1 |
| `src/commands/input-errors.ts` | `RefExpiredError`; `withActionErrors` takes an existence probe | T1, T7 |
| `src/commands/screenshot.ts` | retention cap + timeout/animations | T2 |
| `src/commands/perception/diff.ts` | pure diff over signatures | T3 |
| `src/commands/perception/walk.ts` | in-page walk/occlusion/overlay/redaction + per-frame runner | T4 |
| `src/sessions/session.ts` | per-page observe cache + dispose; clear on `removePage` | T5 |
| `src/sessions/manager.ts` | clear observe cache in the `framenavigated` listener | T5 |
| `src/commands/observe.ts` | `ObserveHandler`: merge/sort/cap/refs/diff/cache | T6 |
| `src/browser/locators.ts` | `Actionable`, `resolveActionable` (ref → cached handle) | T7 |
| `src/commands/{click,type,press,wait,select-option}.ts` | use `resolveActionable` + probe | T7 |
| `src/transport/routes.ts` + error map | `/observe` + `/dismiss` routes; `REF_EXPIRED`→409 | T8, T9 |
| `src/commands/dismiss.ts` | `DismissHandler` (observe → click affirmative-dismiss by ref) | T9 |
| `docs/agent-playbook.md`, `docs/api-reference.md` | new golden loop, cheat-sheet #1, endpoints | T11 |

## Dependency graph (for parallel / subagent dispatch)

```
Wave A (no deps):     T1        T2
Wave B (need T1):     T3   T4   T5
Wave C:               T6 (T3,T4,T5)      T7 (T1,T5)
Wave D:               T8 (T6,T7)         T9 (T6,T7)
Wave E:               T10 (T8,T9)        T11 (T8,T9)
```
Tasks in the same wave have no shared state and may be dispatched to parallel agents. Encode these as `blockedBy` edges when creating the task list.

---

## Task 1: Types + `RefExpiredError`

**Files:**
- Modify: `src/sessions/types.ts`
- Modify: `src/commands/input-errors.ts`
- Test: `tests/unit/types-observe.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/types-observe.test.ts
import { describe, it, expect } from "vitest";
import type { Target, ObserveResult, ObserveAction } from "../../src/sessions/types";
import { RefExpiredError } from "../../src/commands/input-errors";

describe("observe types", () => {
  it("Target accepts a ref variant", () => {
    const t: Target = { by: "ref", ref: "e3" };
    expect(t.by).toBe("ref");
  });
  it("ObserveAction has the agreed shape", () => {
    const a: ObserveAction = {
      ref: "e0", role: "button", name: "OK", tag: "BUTTON",
      box: { x: 1, y: 2, w: 3, h: 4 }, state: "actionable",
    };
    expect(a.state).toBe("actionable");
  });
  it("RefExpiredError carries the code", () => {
    expect(new RefExpiredError("x").code).toBe("REF_EXPIRED");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/types-observe.test.ts`
Expected: FAIL — `RefExpiredError` / `ObserveResult` not exported.

- [ ] **Step 3: Add the types**

In `src/sessions/types.ts`, extend the `TargetBy` union and add the observe/dismiss types:

```ts
// add to the TargetBy union (after the "css" arm):
  | { by: "ref"; ref: string };

// --- Observe ---
export type ActionState = "actionable" | "covered" | "disabled" | "offscreen";

export interface ObserveAction {
  ref: string;                 // e0, e1, … — valid only until the next observe on this page
  role: string | null;
  name: string;
  tag: string;
  box: { x: number; y: number; w: number; h: number };
  state: ActionState;
  occludedBy?: { kind: "overlay" | "iframe" | "element"; name?: string };
}

export interface Overlay {
  ref: string | null;
  kind: "modal" | "banner" | "iframe";
  name: string;
  coverPct: number;
  blocking: boolean;
}

export interface ObserveDiffEntry { ref?: string; desc?: string; change?: string; was?: string; }
export interface ObserveDiff {
  added: ObserveDiffEntry[];
  removed: ObserveDiffEntry[];
  changed: ObserveDiffEntry[];
}

export interface ObserveInput {
  sessionId: string; pageId?: string;
  cap?: number; viewportOnly?: boolean; includeText?: boolean;
}
export interface ObserveResult {
  pageId: string; url: string; title: string; observeId: string;
  actions: ObserveAction[];
  overlays: Overlay[];
  diff: ObserveDiff | null;
  text?: string;
  stats: { totalInteractive: number; returned: number; elapsedMs: number };
}

export interface DismissInput { sessionId: string; pageId?: string; labels?: string[]; }
export interface DismissOutput { pageId: string; dismissed: { ref: string; name: string }[]; }
```

In `src/commands/input-errors.ts`, add:

```ts
export class RefExpiredError extends Error {
  readonly code = "REF_EXPIRED";
  constructor(message: string) { super(message); this.name = "RefExpiredError"; }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run tests/unit/types-observe.test.ts` → Expected: PASS
Run: `npm run typecheck` → Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/sessions/types.ts src/commands/input-errors.ts tests/unit/types-observe.test.ts
git commit -m "feat(observe): types for observe/dismiss + ref target + RefExpiredError"
```

---

## Task 2: Screenshot retention + no-hang timeout

**Files:**
- Modify: `src/commands/screenshot.ts`
- Test: `tests/unit/screenshot-retention.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/screenshot-retention.test.ts
import { describe, it, expect } from "vitest";
import { pruneScreenshots } from "../../src/commands/screenshot";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

describe("pruneScreenshots", () => {
  it("keeps only the newest N files", async () => {
    const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "shots-"));
    for (let i = 0; i < 5; i++) {
      const p = path.join(dir, `page_x-2026010100000${i}.png`);
      await fs.promises.writeFile(p, "x");
      await new Promise((r) => setTimeout(r, 5));
    }
    await pruneScreenshots(dir, 2);
    const left = (await fs.promises.readdir(dir)).sort();
    expect(left.length).toBe(2);
    expect(left).toContain("page_x-20260101000003.png");
    expect(left).toContain("page_x-20260101000004.png");
  });

  it("is a no-op on a missing dir", async () => {
    await expect(pruneScreenshots("/no/such/dir", 2)).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/screenshot-retention.test.ts`
Expected: FAIL — `pruneScreenshots` is not exported.

- [ ] **Step 3: Implement**

In `src/commands/screenshot.ts`, add the helper and use it + the timeout/animations options:

```ts
const MAX_SCREENSHOTS_PER_SESSION = 20;

/** Keep only the newest `keep` PNGs in `dir`. Best-effort; never throws. */
export async function pruneScreenshots(dir: string, keep = MAX_SCREENSHOTS_PER_SESSION): Promise<void> {
  let names: string[];
  try { names = await fs.promises.readdir(dir); } catch { return; }
  const pngs = names.filter((n) => n.endsWith(".png")).sort(); // ISO timestamps sort chronologically
  const stale = pngs.slice(0, Math.max(0, pngs.length - keep));
  await Promise.all(stale.map((n) => fs.promises.unlink(path.join(dir, n)).catch(() => {})));
}
```

In `execute`, replace the `page.screenshot` call:

```ts
    await page.screenshot({
      path: screenshotPath,
      fullPage: !!fullPage,
      timeout: 8000,            // do not hang the loop on web-font loading (was the 30s H1 stall)
      animations: "disabled",
    });
    await pruneScreenshots(screenshotsDir);
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run tests/unit/screenshot-retention.test.ts` → Expected: PASS
Run: `npm run typecheck` → Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/commands/screenshot.ts tests/unit/screenshot-retention.test.ts
git commit -m "feat(screenshot): retention cap (keep newest 20) + 8s timeout, animations disabled"
```

> Note: deleting the screenshots dir on session close is already covered by the existing `debugDir` teardown (screenshots live under `debugDir/screenshots`). No extra wiring needed.

---

## Task 3: Diff module (pure)

**Files:**
- Create: `src/commands/perception/diff.ts`
- Test: `tests/unit/perception-diff.test.ts`

The diff compares two observes by structural **signature**. Input rows are `{ signature, ref, name, role, state }`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/perception-diff.test.ts
import { describe, it, expect } from "vitest";
import { computeDiff, type DiffRow } from "../../src/commands/perception/diff";

const row = (sig: string, ref: string, state: DiffRow["state"], name = sig): DiffRow =>
  ({ signature: sig, ref, name, role: "button", state });

describe("computeDiff", () => {
  it("returns null when there is no previous observe", () => {
    expect(computeDiff(undefined, [row("a", "e0", "actionable")])).toBeNull();
  });

  it("detects added / removed / changed", () => {
    const prev = [row("a", "e0", "covered"), row("b", "e1", "actionable")];
    const curr = [row("a", "e0", "actionable"), row("c", "e1", "actionable", "New")];
    const d = computeDiff(prev, curr)!;
    expect(d.added).toEqual([{ ref: "e1", desc: "button 'New'" }]);
    expect(d.removed).toEqual([{ desc: "button 'b'" }]);
    expect(d.changed).toEqual([{ ref: "e0", change: "now-actionable", was: "covered" }]);
  });

  it("reports a name change as changed", () => {
    const prev = [row("a", "e0", "actionable", "Old")];
    const curr = [row("a", "e0", "actionable", "Newer")];
    const d = computeDiff(prev, curr)!;
    expect(d.changed).toEqual([{ ref: "e0", change: "renamed", was: "Old" }]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/perception-diff.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/commands/perception/diff.ts
import type { ActionState, ObserveDiff } from "../../sessions/types";

export interface DiffRow {
  signature: string;
  ref: string;
  name: string;
  role: string | null;
  state: ActionState;
}

const label = (r: DiffRow) => `${r.role ?? r.state} '${r.name}'`;

/** Compare current rows against the previous observe. Returns null on first observe. */
export function computeDiff(prev: DiffRow[] | undefined, curr: DiffRow[]): ObserveDiff | null {
  if (!prev) return null;
  const prevBySig = new Map(prev.map((r) => [r.signature, r]));
  const currBySig = new Map(curr.map((r) => [r.signature, r]));

  const added: ObserveDiff["added"] = [];
  const changed: ObserveDiff["changed"] = [];
  for (const r of curr) {
    const before = prevBySig.get(r.signature);
    if (!before) { added.push({ ref: r.ref, desc: label(r) }); continue; }
    if (before.state !== r.state) changed.push({ ref: r.ref, change: `now-${r.state}`, was: before.state });
    else if (before.name !== r.name) changed.push({ ref: r.ref, change: "renamed", was: before.name });
  }
  const removed: ObserveDiff["removed"] = [];
  for (const r of prev) if (!currBySig.has(r.signature)) removed.push({ desc: label(r) });

  return { added, removed, changed };
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run tests/unit/perception-diff.test.ts` → Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/commands/perception/diff.ts tests/unit/perception-diff.test.ts
git commit -m "feat(observe): pure signature-based change-diff"
```

---

## Task 4: In-page walk + occlusion + overlays + per-frame runner

**Files:**
- Create: `src/commands/perception/walk.ts`
- Test: `tests/integration/perception-walk.integration.test.ts`

This is the perception core. The in-page script (a self-contained, read-only IIFE) is shadow-piercing, never reads `el.value`, computes occlusion via `elementFromPoint`, and a structural signature. The runner does `evaluateHandle → getProperties → evaluate(metas+overlays)` per frame and returns rows pairing each `ElementHandle` with its metadata.

- [ ] **Step 1: Write the failing integration test**

```ts
// tests/integration/perception-walk.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { chromium, type Browser, type Page } from "playwright";
import { walkAllFrames } from "../../src/commands/perception/walk";

let browser: Browser;
beforeAll(async () => { browser = await chromium.launch({ headless: true }); });
afterAll(async () => { await browser.close(); });

async function pageWith(html: string): Promise<Page> {
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await ctx.newPage();
  await page.setContent(html);
  return page;
}

describe("walkAllFrames", () => {
  it("flags a button covered by a fixed overlay, and not the overlay's own button", async () => {
    const page = await pageWith(`
      <button id="real">Real</button>
      <div style="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center">
        <button id="accept">Accept all</button>
      </div>`);
    const { actions, overlays } = await walkAllFrames(page);
    const real = actions.find((a) => a.meta.name === "Real");
    const accept = actions.find((a) => a.meta.name === "Accept all");
    expect(real!.meta.state).toBe("covered");
    expect(accept!.meta.state).toBe("actionable");
    expect(overlays.some((o) => o.coverPct >= 90 && o.blocking)).toBe(true);
    for (const a of actions) await a.handle.dispose();
    await page.context().close();
  });

  it("never reports an input's typed value as its name", async () => {
    const page = await pageWith(`<input id="pw" type="password" aria-label="Password" value="hunter2">`);
    const { actions } = await walkAllFrames(page);
    const pw = actions.find((a) => a.meta.tag === "INPUT")!;
    expect(pw.meta.name).toBe("Password");
    expect(JSON.stringify(actions)).not.toContain("hunter2");
    for (const a of actions) await a.handle.dispose();
    await page.context().close();
  });

  it("pierces an open shadow root", async () => {
    const page = await pageWith(`<div id="host"></div><script>
      const r = document.getElementById('host').attachShadow({mode:'open'});
      r.innerHTML = '<button>Shadow Btn</button>';
    </script>`);
    const { actions } = await walkAllFrames(page);
    expect(actions.some((a) => a.meta.name === "Shadow Btn")).toBe(true);
    for (const a of actions) await a.handle.dispose();
    await page.context().close();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run --config vitest.integration.config.ts tests/integration/perception-walk.integration.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/commands/perception/walk.ts
import type { Page, Frame, ElementHandle } from "playwright";
import type { ActionState } from "../../sessions/types";

export interface WalkMeta {
  signature: string;
  role: string | null;
  name: string;
  tag: string;
  box: { x: number; y: number; w: number; h: number };
  state: ActionState;
  occludedBy?: { kind: "overlay" | "iframe" | "element"; name?: string };
}
export interface RawAction { handle: ElementHandle; frameId: string; meta: WalkMeta; }
export interface RawOverlay { kind: "modal" | "banner" | "iframe"; name: string; coverPct: number; blocking: boolean; }

const MAX_FRAME_DEPTH = 5;

// The in-page IIFE source. Read-only; pierces open shadow roots; never reads el.value.
// Returns { elements: Element[], metas: WalkMeta[], overlays: RawOverlay[], total: number }.
// `metas[i]` corresponds to `elements[i]`.
const WALK_SRC = (frameId: string) => `(() => {
  const INTERACTIVE_TAGS = new Set(["A","BUTTON","INPUT","SELECT","TEXTAREA","SUMMARY"]);
  const INTERACTIVE_ROLES = new Set(["button","link","textbox","combobox","checkbox","radio","menuitem","tab","option","switch","searchbox"]);
  function isInteractive(el){
    if (INTERACTIVE_TAGS.has(el.tagName)) return true;
    const r = el.getAttribute && el.getAttribute("role");
    if (r && INTERACTIVE_ROLES.has(r)) return true;
    if (el.hasAttribute && el.hasAttribute("onclick")) return true;
    if (typeof el.tabIndex === "number" && el.tabIndex >= 0 && el.tagName !== "BODY" && el.tagName !== "HTML") return true;
    try { if (getComputedStyle(el).cursor === "pointer" && el.children.length === 0) return true; } catch (e) {}
    return false;
  }
  function visible(el){
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  }
  // shadow-piercing collector
  function collect(root, out){
    const els = root.querySelectorAll("*");
    for (const el of els){
      try { if (isInteractive(el) && visible(el)) out.push(el); } catch (e) {}
      if (el.shadowRoot) collect(el.shadowRoot, out);
    }
  }
  // structural signature including shadow boundaries
  function domPath(el){
    const seg = [];
    let node = el;
    while (node && node.nodeType === 1 && seg.length < 40){
      let i = 1, sib = node;
      while ((sib = sib.previousElementSibling)) if (sib.tagName === node.tagName) i++;
      seg.unshift(node.tagName.toLowerCase() + "[" + i + "]");
      const parent = node.parentNode;
      if (parent && parent.host) { seg.unshift(">>"); node = parent.host; }   // cross shadow boundary
      else node = parent;
    }
    return seg.join("/");
  }
  function accName(el){
    const aria = el.getAttribute("aria-label");
    if (aria) return aria.trim();
    const ph = el.getAttribute("placeholder");
    if (ph) return ph.trim();
    if (el.id){ const lab = document.querySelector('label[for="'+CSS.escape(el.id)+'"]'); if (lab) return (lab.innerText||"").trim(); }
    const nm = el.getAttribute("name") || el.getAttribute("title");
    if (nm) return nm.trim();
    return (el.innerText || "").trim();          // NEVER el.value
  }
  function meta(el){
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width/2, cy = r.top + r.height/2;
    const inVp = r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
    let state = inVp ? "actionable" : "offscreen";
    let occludedBy;
    if (el.disabled) state = "disabled";
    if (inVp && !el.disabled){
      const top = document.elementFromPoint(cx, cy);
      if (top && top !== el && !el.contains(top) && !top.contains(el)){
        state = "covered";
        const cs = getComputedStyle(top);
        const kind = top.tagName === "IFRAME" ? "iframe" : (cs.position === "fixed" || cs.position === "absolute") ? "overlay" : "element";
        occludedBy = { kind, name: (top.getAttribute("aria-label") || top.innerText || "").trim().slice(0,40) };
      }
    }
    const name = accName(el).slice(0,80);
    return { signature: ${JSON.stringify(frameId)} + "|" + (el.getAttribute("role")||"") + "|" + name + "|" + domPath(el),
      role: el.getAttribute("role") || null, name, tag: el.tagName,
      box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      state, occludedBy };
  }
  function overlays(){
    const W = innerWidth, H = innerHeight, area = W*H, out = [];
    for (const el of document.querySelectorAll("body *")){
      const cs = getComputedStyle(el);
      if (!["fixed","absolute","sticky"].includes(cs.position)) continue;
      if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) continue;
      if (cs.pointerEvents === "none") continue;
      const r = el.getBoundingClientRect();
      const cover = Math.max(0, Math.min(r.right,W)-Math.max(r.left,0)) * Math.max(0, Math.min(r.bottom,H)-Math.max(r.top,0));
      const pct = Math.round(100*cover/area);
      if (pct > 25){
        const kind = el.tagName === "IFRAME" ? "iframe" : pct >= 90 ? "modal" : "banner";
        out.push({ kind, name: (el.getAttribute("aria-label") || el.innerText || "").trim().slice(0,60), coverPct: pct, blocking: pct >= 60 });
      }
    }
    return out;
  }
  const els = [];
  collect(document, els);
  return { elements: els, metas: els.map(meta), overlays: overlays(), total: els.length };
})()`;

async function walkFrame(frame: Frame, frameId: string): Promise<{ actions: RawAction[]; overlays: RawOverlay[] }> {
  const resHandle = await frame.evaluateHandle(WALK_SRC(frameId));
  try {
    const props = await resHandle.getProperties();
    const elementsHandle = props.get("elements")!;
    const elProps = await elementsHandle.getProperties();
    const handles: ElementHandle[] = [];
    for (const p of elProps.values()) { const el = p.asElement(); if (el) handles.push(el as ElementHandle); else await p.dispose(); }
    const data = (await resHandle.evaluate((r: any) => ({ metas: r.metas, overlays: r.overlays }))) as
      { metas: WalkMeta[]; overlays: RawOverlay[] };
    await elementsHandle.dispose();
    const actions = handles.map((handle, i) => ({ handle, frameId, meta: data.metas[i] }));
    return { actions, overlays: data.overlays };
  } finally {
    await resHandle.dispose();
  }
}

/** Walk the top frame + same-origin child frames (depth-capped). */
export async function walkAllFrames(page: Page): Promise<{ actions: RawAction[]; overlays: RawOverlay[] }> {
  const top = page.mainFrame();
  const topOrigin = safeOrigin(top.url());
  const actions: RawAction[] = [];
  const overlays: RawOverlay[] = [];

  async function visit(frame: Frame, depth: number) {
    let fid = `f${depth}_${actions.length}`;
    try {
      const res = await walkFrame(frame, frame === top ? "top" : fid);
      actions.push(...res.actions);
      if (frame === top) overlays.push(...res.overlays);
    } catch { /* frame may be detached/blank; skip */ }
    if (depth >= MAX_FRAME_DEPTH) return;
    for (const child of frame.childFrames()) {
      if (safeOrigin(child.url()) === topOrigin) await visit(child, depth + 1); // same-origin only
    }
  }
  await visit(top, 0);
  return { actions, overlays };
}

function safeOrigin(url: string): string {
  try { return new URL(url).origin; } catch { return ""; }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run --config vitest.integration.config.ts tests/integration/perception-walk.integration.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/commands/perception/walk.ts tests/integration/perception-walk.integration.test.ts
git commit -m "feat(observe): shadow-piercing read-only walk + occlusion + overlays (no value leak)"
```

---

## Task 5: Per-page observe cache + invalidation

**Files:**
- Modify: `src/sessions/session.ts`
- Modify: `src/sessions/manager.ts`
- Test: `tests/unit/observe-cache.test.ts`

The cache stores the last observe per page: the `DiffRow[]` (for the next diff) and a `ref → ElementHandle` map (for act-by-ref). Setting a new entry disposes the previous handles. `removePage` and main-frame `framenavigated` clear it.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/observe-cache.test.ts
import { describe, it, expect } from "vitest";
import { FeatherSession } from "../../src/sessions/session";

function newSession() {
  return new FeatherSession({
    workspaceId: "w", profileKind: "disposable", browserMode: "chromium-new-headless",
    profilePath: "/tmp/x", debugDir: "/tmp/x", proxy: null,
  });
}

describe("observe cache", () => {
  it("stores and reads back per page, disposing replaced handles", async () => {
    const s = newSession();
    let disposed = 0;
    const fakeHandle = () => ({ dispose: async () => { disposed++; } } as any);
    s.setObserveCache("page_1", { observeId: "o1", rows: [], refs: new Map([["e0", fakeHandle()]]) });
    expect(s.getObserveCache("page_1")?.observeId).toBe("o1");
    s.setObserveCache("page_1", { observeId: "o2", rows: [], refs: new Map() });
    expect(disposed).toBe(1);                       // old handle disposed
    expect(s.getObserveCache("page_1")?.observeId).toBe("o2");
  });

  it("clears on clearObserveCache", () => {
    const s = newSession();
    s.setObserveCache("page_1", { observeId: "o1", rows: [], refs: new Map() });
    s.clearObserveCache("page_1");
    expect(s.getObserveCache("page_1")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/observe-cache.test.ts`
Expected: FAIL — `setObserveCache` is not a function.

- [ ] **Step 3: Implement**

In `src/sessions/session.ts`, add the import and cache. At the top:

```ts
import type { DiffRow } from "../commands/perception/diff";
```

Add the type (near the top of the file, after imports):

```ts
export interface ObserveCacheEntry {
  observeId: string;
  rows: DiffRow[];
  refs: Map<string, import("playwright").ElementHandle>;
}
```

Add a private field in the class body (next to `_pages`):

```ts
  private _observeCache: Map<string, ObserveCacheEntry> = new Map();
```

Add methods (anywhere in the class):

```ts
  getObserveCache(pageId: string): ObserveCacheEntry | undefined {
    return this._observeCache.get(pageId);
  }
  setObserveCache(pageId: string, entry: ObserveCacheEntry): void {
    const prev = this._observeCache.get(pageId);
    if (prev) for (const h of prev.refs.values()) void h.dispose().catch(() => {});
    this._observeCache.set(pageId, entry);
  }
  clearObserveCache(pageId: string): void {
    const prev = this._observeCache.get(pageId);
    if (prev) for (const h of prev.refs.values()) void h.dispose().catch(() => {});
    this._observeCache.delete(pageId);
  }
```

In `removePage(pageId)` (around line 180), add as the first line of the method body:

```ts
    this.clearObserveCache(pageId);
```

In `src/sessions/manager.ts`, inside the `page.on("framenavigated", …)` listener (it already guards `frame !== page.mainFrame()`), clear the cache for that page. Right after the `if (frame !== page.mainFrame()) return;` guard, add:

```ts
      session.clearObserveCache(pageId);   // perception is stale after a real navigation
```

(`pageId` is already in scope in `attachPageListeners`.)

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run tests/unit/observe-cache.test.ts` → Expected: PASS
Run: `npm run typecheck` → Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/sessions/session.ts src/sessions/manager.ts tests/unit/observe-cache.test.ts
git commit -m "feat(observe): per-page observe cache with handle disposal + navigation/close invalidation"
```

---

## Task 6: `ObserveHandler`

**Files:**
- Create: `src/commands/observe.ts`
- Test: `tests/integration/observe.integration.test.ts`

Merges frame walks, sorts (`actionable`→`covered`→`disabled`→`offscreen`, in-viewport first), caps, assigns `e0…` refs, builds the cache entry (rows + ref→handle), computes the diff, disposes uncapped handles, and returns the JSON.

- [ ] **Step 1: Write the failing integration test**

```ts
// tests/integration/observe.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { chromium, type Browser } from "playwright";
import { ObserveHandler } from "../../src/commands/observe";
import { FeatherSession } from "../../src/sessions/session";

let browser: Browser;
beforeAll(async () => { browser = await chromium.launch({ headless: true }); });
afterAll(async () => { await browser.close(); });

// Minimal manager exposing get(sessionId) -> session, with a live page.
async function setup(html: string) {
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await ctx.newPage();
  await page.setContent(html);
  const session = new FeatherSession({
    workspaceId: "w", profileKind: "disposable", browserMode: "chromium-new-headless",
    profilePath: "/tmp/x", debugDir: "/tmp/x", proxy: null,
  });
  session.setContext(ctx);                       // registers the page; gives it a pageId
  const { pageId } = session.getPage();
  const manager = { get: () => session } as any;
  return { handler: new ObserveHandler(manager), session, pageId, ctx };
}

describe("ObserveHandler", () => {
  it("returns numbered refs, flags the overlay, and diff is null on first observe", async () => {
    const { handler, ctx } = await setup(`
      <button>Real</button>
      <div style="position:fixed;inset:0;z-index:9999"><button>Accept all</button></div>`);
    const r = await handler.execute({ sessionId: "s" }, { requestId: "r" });
    expect(r.actions[0].ref).toBe("e0");
    expect(r.actions.find((a) => a.name === "Accept all")).toBeTruthy();
    expect(r.overlays.length).toBeGreaterThan(0);
    expect(r.diff).toBeNull();
    await ctx.close();
  });

  it("second observe yields a diff after the page changes", async () => {
    const { handler, session, pageId, ctx } = await setup(`<button>One</button>`);
    await handler.execute({ sessionId: "s" }, { requestId: "r" });
    const { page } = session.getPage(pageId);
    await page.evaluate(() => { const b = document.createElement("button"); b.textContent = "Two"; document.body.appendChild(b); });
    const r2 = await handler.execute({ sessionId: "s" }, { requestId: "r" });
    expect(r2.diff!.added.some((a) => a.desc?.includes("Two"))).toBe(true);
    await ctx.close();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run --config vitest.integration.config.ts tests/integration/observe.integration.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/commands/observe.ts
import type { CommandHandler, CommandContext } from "./handler";
import type { ObserveInput, ObserveResult, ObserveAction, ActionState } from "../sessions/types";
import type { ObserveCacheEntry } from "../sessions/session";
import { walkAllFrames, type RawAction } from "./perception/walk";
import { computeDiff, type DiffRow } from "./perception/diff";

const newObserveId = () => `obs_${Math.random().toString(36).slice(2, 8)}`;
const STATE_ORDER: Record<ActionState, number> = { actionable: 0, covered: 1, disabled: 2, offscreen: 3 };

interface IManager {
  get(sessionId: string): {
    getPage(pageId?: string): { pageId: string; page: import("playwright").Page };
    setObserveCache(pageId: string, entry: ObserveCacheEntry): void;
    getObserveCache(pageId: string): ObserveCacheEntry | undefined;
  };
}

export class ObserveHandler implements CommandHandler<ObserveInput, ObserveResult> {
  constructor(private readonly manager: IManager) {}

  async execute(input: ObserveInput, _ctx: CommandContext): Promise<ObserveResult> {
    const t0 = Date.now();
    const cap = input.cap ?? 80;
    const session = this.manager.get(input.sessionId);
    const { pageId, page } = session.getPage(input.pageId);

    const { actions: raw, overlays } = await walkAllFrames(page);

    // Sort: actionable-in-viewport first, then by state order.
    raw.sort((a, b) => STATE_ORDER[a.meta.state] - STATE_ORDER[b.meta.state]);
    const filtered = input.viewportOnly ? raw.filter((a) => a.meta.state !== "offscreen") : raw;

    const kept = filtered.slice(0, cap);
    const dropped = raw.filter((a) => !kept.includes(a));
    await Promise.all(dropped.map((a) => a.handle.dispose().catch(() => {})));

    const refs = new Map<string, import("playwright").ElementHandle>();
    const rows: DiffRow[] = [];
    const actions: ObserveAction[] = kept.map((a: RawAction, i) => {
      const ref = `e${i}`;
      refs.set(ref, a.handle);
      rows.push({ signature: a.meta.signature, ref, name: a.meta.name, role: a.meta.role, state: a.meta.state });
      return {
        ref, role: a.meta.role, name: a.meta.name, tag: a.meta.tag,
        box: a.meta.box, state: a.meta.state, occludedBy: a.meta.occludedBy,
      };
    });

    const prev = session.getObserveCache(pageId);
    const diff = computeDiff(prev?.rows, rows);
    const observeId = newObserveId();
    session.setObserveCache(pageId, { observeId, rows, refs });   // disposes prior handles

    const result: ObserveResult = {
      pageId, url: page.url(), title: await page.title().catch(() => ""), observeId,
      actions,
      overlays: overlays.map((o) => ({ ref: null, ...o })),
      diff,
      stats: { totalInteractive: raw.length, returned: actions.length, elapsedMs: Date.now() - t0 },
    };
    if (input.includeText) {
      result.text = (await page.evaluate(() => document.body?.innerText ?? "").catch(() => "")).slice(0, 4000);
    }
    return result;
  }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run --config vitest.integration.config.ts tests/integration/observe.integration.test.ts` → Expected: PASS
Run: `npm run typecheck` → Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/commands/observe.ts tests/integration/observe.integration.test.ts
git commit -m "feat(observe): ObserveHandler (merge/sort/cap/refs/diff/cache)"
```

---

## Task 7: Act-by-ref (`resolveActionable` + `withActionErrors` probe + input commands)

**Files:**
- Modify: `src/commands/input-errors.ts`
- Modify: `src/browser/locators.ts`
- Modify: `src/commands/click.ts`, `type.ts`, `press.ts`, `wait.ts`, `select-option.ts`
- Modify: `src/transport/routes.ts` (add the `ref` arm to `TargetSchema`)
- Test: `tests/unit/resolve-actionable.test.ts`

`withActionErrors` stops depending on `Locator` (takes an existence probe). `resolveActionable` returns the existing `Locator` for non-ref targets, or the cached `ElementHandle` for `{by:"ref"}`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/resolve-actionable.test.ts
import { describe, it, expect } from "vitest";
import { resolveActionable } from "../../src/browser/locators";
import { RefExpiredError } from "../../src/commands/input-errors";

describe("resolveActionable", () => {
  it("throws REF_EXPIRED when the ref is unknown", () => {
    const page = {} as any;
    expect(() => resolveActionable(page, { by: "ref", ref: "e9" }, () => undefined)).toThrow(RefExpiredError);
  });

  it("returns the cached handle for a known ref", () => {
    const fake = { click: async () => {} } as any;
    const page = {} as any;
    const { act } = resolveActionable(page, { by: "ref", ref: "e0" }, (r) => (r === "e0" ? fake : undefined));
    expect(act).toBe(fake);
  });

  it("falls back to a Locator for non-ref targets", () => {
    const loc = { first: () => loc } as any;
    const page = { getByText: () => loc } as any;
    const { act } = resolveActionable(page, { by: "text", text: "Hi" });
    expect(act).toBe(loc);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/resolve-actionable.test.ts`
Expected: FAIL — `resolveActionable` not exported.

- [ ] **Step 3: Implement**

In `src/commands/input-errors.ts`, change `withActionErrors` to take a probe (and drop the `Locator` import dependency):

```ts
/** Run a Playwright action; convert TimeoutError into a precise coded error.
 * `probe` returns how many elements the target currently matches (0 ⇒ not found). */
export async function withActionErrors<T>(probe: () => Promise<number>, what: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof errors.TimeoutError) {
      const count = await probe().catch(() => 0);
      if (count === 0) throw new ElementNotFoundError(`No element matched the target for "${what}".`);
      throw new ElementNotActionableError(
        `Target for "${what}" matched ${count} element(s) but the action timed out (covered, disabled, or off-screen?).`,
      );
    }
    throw err;
  }
}
```

In `src/browser/locators.ts`, add:

```ts
import type { ElementHandle } from "playwright";
import { RefExpiredError } from "../commands/input-errors";

export interface Actionable {
  click(options?: { timeout?: number }): Promise<void>;
  fill(value: string, options?: { timeout?: number }): Promise<void>;
  press(key: string, options?: { timeout?: number }): Promise<void>;
  selectOption(values: string | string[], options?: { timeout?: number }): Promise<string[]>;
}

export type RefLookup = (ref: string) => ElementHandle | undefined;

/** Resolve a Target to an actionable + an existence probe. Refs come from the observe cache. */
export function resolveActionable(
  page: Page, target: Target, refLookup?: RefLookup,
): { act: Actionable; probe: () => Promise<number> } {
  if (target.by === "ref") {
    const handle = refLookup?.(target.ref);
    if (!handle) throw new RefExpiredError(`Ref "${target.ref}" is from a superseded observe — re-observe and use a fresh ref.`);
    return { act: handle as unknown as Actionable, probe: () => handle.evaluate((e: Element) => (e.isConnected ? 1 : 0)).catch(() => 0) };
  }
  const loc = resolveLocator(page, target);
  return { act: loc as unknown as Actionable, probe: () => loc.count() };
}
```

In each input command, switch to `resolveActionable` and pass a `refLookup` from the session cache. Example — `src/commands/click.ts` becomes:

```ts
import type { CommandHandler, CommandContext } from "./handler";
import type { ClickInput, ClickOutput } from "../sessions/types";
import { resolveActionable } from "../browser/locators";
import { withActionErrors } from "./input-errors";

interface IManager {
  get(sessionId: string): {
    getPage(pageId?: string): { pageId: string; page: import("playwright").Page };
    getObserveCache(pageId: string): { refs: Map<string, import("playwright").ElementHandle> } | undefined;
  };
}

export class ClickHandler implements CommandHandler<ClickInput, ClickOutput> {
  constructor(private readonly manager: IManager) {}
  async execute(input: ClickInput, _ctx: CommandContext): Promise<ClickOutput> {
    const { sessionId, pageId, target, timeoutMs } = input;
    const session = this.manager.get(sessionId);
    const { pageId: resolvedPageId, page } = session.getPage(pageId);
    const refLookup = (r: string) => session.getObserveCache(resolvedPageId)?.refs.get(r);
    const { act, probe } = resolveActionable(page, target, refLookup);
    await withActionErrors(probe, "click", () => act.click({ timeout: timeoutMs ?? 15000 }));
    return { pageId: resolvedPageId, clicked: true };
  }
}
```

Apply the identical pattern to `type.ts` (`act.fill(...)` — keep the existing sequential-typing branch but resolve via `resolveActionable`), `press.ts` (`act.press(...)`; note `press` allows an optional target — when omitted, keep the page-level `page.keyboard.press`), `wait.ts` (waits use Locator semantics — for `by:"ref"` resolve the handle and use `handle.waitForElementState`; for other targets keep the existing locator path), and `select-option.ts` (`act.selectOption(...)`). In every case the `probe`/`withActionErrors` call replaces the old `loc.count()`-based call.

Finally, add the `ref` arm to `TargetSchema` in `src/transport/routes.ts` (the `z.discriminatedUnion("by", [...])`) so the routes accept it (note: no `at` field on refs):

```ts
  z.object({ by: z.literal("ref"), ref: z.string().min(1) }),
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/unit/resolve-actionable.test.ts` → Expected: PASS
Run: `npx vitest run` → Expected: PASS (existing click/type/press/wait/select unit tests still green — regression guard)
Run: `npm run typecheck` → Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/commands/input-errors.ts src/browser/locators.ts src/commands/click.ts src/commands/type.ts src/commands/press.ts src/commands/wait.ts src/commands/select-option.ts src/transport/routes.ts tests/unit/resolve-actionable.test.ts
git commit -m "feat(observe): act-by-ref via resolveActionable + probe-based withActionErrors"
```

---

## Task 8: Wire the `/observe` route + `REF_EXPIRED`→409

**Files:**
- Modify: `src/transport/routes.ts` (route + `ObserveSchema` + `ERROR_STATUS`)
- Test: `tests/integration/observe-route.integration.test.ts`

- [ ] **Step 1: Write the failing test**

Copy the boot + `api()` harness **verbatim from `tests/integration/close-tab.integration.test.ts` lines 1–41** (the `beforeAll`/`afterAll`/`api` setup is identical across all integration tests), then:

```ts
describe("POST /v1/sessions/:sessionId/observe", () => {
  it("returns actions + observeId; bad ref → REF_EXPIRED 409", async () => {
    const launch = await api("POST", "/v1/sessions", {
      workspaceId: "observe-ws", profile: { kind: "persistent" }, browserMode: "chromium-headless-shell",
    });
    const sessionId = launch.body.data.sessionId as string;
    await api("POST", `/v1/sessions/${sessionId}/navigate`,
      { url: "data:text/html,<button>Hi</button>", waitUntil: "domcontentloaded" });

    const obs = await api("POST", `/v1/sessions/${sessionId}/observe`, {});
    expect(obs.status).toBe(200);
    expect(Array.isArray(obs.body.data.actions)).toBe(true);
    expect(typeof obs.body.data.observeId).toBe("string");

    const bad = await api("POST", `/v1/sessions/${sessionId}/click`,
      { target: { by: "ref", ref: "e999" } });
    expect(bad.status).toBe(409);
    expect(bad.body.error.code).toBe("REF_EXPIRED");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run --config vitest.integration.config.ts tests/integration/observe-route.integration.test.ts`
Expected: FAIL — 404 (route not registered).

- [ ] **Step 3: Implement**

In `src/transport/routes.ts`, mirroring the exact `/snapshot` route shape (`getRequestId` + Zod `.parse` + `ok()` + `handleRouteError`):

```ts
// import at top:
import { ObserveHandler } from "../commands/observe";

// near the other schemas:
const ObserveSchema = z.object({
  pageId: z.string().optional(),
  cap: z.number().int().positive().optional(),
  viewportOnly: z.boolean().optional(),
  includeText: z.boolean().optional(),
});

// with the other handler instantiations:
  const observeHandler = new ObserveHandler(manager);

// register near the /snapshot route:
  app.post("/v1/sessions/:sessionId/observe", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      const input = ObserveSchema.parse(request.body ?? {});
      const result = await observeHandler.execute({ sessionId, ...input }, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });
```

Add `REF_EXPIRED: 409` to the `ERROR_STATUS` map in `src/transport/routes.ts` (the same record `errorStatus(code)` reads, where `ELEMENT_NOT_ACTIONABLE: 409` already lives).

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run --config vitest.integration.config.ts tests/integration/observe-route.integration.test.ts` → Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/transport/routes.ts tests/integration/observe-route.integration.test.ts
git commit -m "feat(observe): POST /v1/sessions/:id/observe route + REF_EXPIRED 409 mapping"
```

---

## Task 9: `DismissHandler` + `/dismiss` route

**Files:**
- Create: `src/commands/dismiss.ts`
- Modify: `src/transport/routes.ts`
- Test: `tests/unit/dismiss-match.test.ts` (unit) + `tests/integration/dismiss.integration.test.ts` (integration)

- [ ] **Step 1: Write the failing unit test for label matching**

```ts
// tests/unit/dismiss-match.test.ts
import { describe, it, expect } from "vitest";
import { pickDismissTargets, DEFAULT_DISMISS_LABELS } from "../../src/commands/dismiss";
import type { ObserveResult } from "../../src/sessions/types";

const r = (over: Partial<ObserveResult>): ObserveResult => ({
  pageId: "p", url: "u", title: "t", observeId: "o", actions: [], overlays: [], diff: null,
  stats: { totalInteractive: 0, returned: 0, elapsedMs: 0 }, ...over,
});

describe("pickDismissTargets", () => {
  it("matches affirmative labels only on overlay-related elements", () => {
    const obs = r({
      overlays: [{ ref: null, kind: "modal", name: "cookies", coverPct: 100, blocking: true }],
      actions: [
        { ref: "e0", role: "button", name: "Accept all", tag: "BUTTON", box: { x:0,y:0,w:1,h:1 }, state: "actionable", occludedBy: undefined },
        { ref: "e1", role: "button", name: "Manage settings", tag: "BUTTON", box: { x:0,y:0,w:1,h:1 }, state: "actionable" },
        { ref: "e2", role: "button", name: "Buy now", tag: "BUTTON", box: { x:0,y:0,w:1,h:1 }, state: "actionable" },
      ],
    });
    const picks = pickDismissTargets(obs, DEFAULT_DISMISS_LABELS);
    expect(picks.map((p) => p.ref)).toEqual(["e0"]);   // not "Manage", not "Buy now"
  });

  it("returns nothing when there is no overlay", () => {
    const obs = r({ actions: [{ ref: "e0", role: "button", name: "Accept all", tag: "BUTTON", box: { x:0,y:0,w:1,h:1 }, state: "actionable" }] });
    expect(pickDismissTargets(obs, DEFAULT_DISMISS_LABELS)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/dismiss-match.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/commands/dismiss.ts
import type { CommandHandler, CommandContext } from "./handler";
import type { DismissInput, DismissOutput, ObserveResult, ObserveAction } from "../sessions/types";
import { ObserveHandler } from "./observe";
import { ClickHandler } from "./click";

export const DEFAULT_DISMISS_LABELS = ["accept all", "i agree", "allow all", "got it", "accept", "close", "continue"];

/** Choose overlay-related elements whose name matches an affirmative-dismiss label. */
export function pickDismissTargets(obs: ObserveResult, labels: string[]): ObserveAction[] {
  if (obs.overlays.length === 0) return [];                      // only act when an overlay exists
  const wanted = labels.map((l) => l.toLowerCase());
  return obs.actions.filter((a) => {
    const overlayRelated = a.state === "covered" || a.occludedBy != null
      || obs.overlays.some((o) => o.ref != null && o.ref === a.ref);
    // The dismiss button itself usually sits *on top* (actionable) inside the overlay; allow actionable
    // elements too, but still gate on an overlay being present (checked above).
    const name = a.name.trim().toLowerCase();
    const labelHit = wanted.some((w) => name === w || name.startsWith(w));
    return labelHit && (overlayRelated || a.state === "actionable");
  });
}

interface IManager { get(sessionId: string): { getPage(pageId?: string): { pageId: string } }; }

export class DismissHandler implements CommandHandler<DismissInput, DismissOutput> {
  private observe: ObserveHandler;
  private click: ClickHandler;
  constructor(private readonly manager: IManager) {
    this.observe = new ObserveHandler(manager as any);
    this.click = new ClickHandler(manager as any);
  }
  async execute(input: DismissInput, ctx: CommandContext): Promise<DismissOutput> {
    const labels = input.labels ?? DEFAULT_DISMISS_LABELS;
    const obs = await this.observe.execute({ sessionId: input.sessionId, pageId: input.pageId }, ctx);
    const picks = pickDismissTargets(obs, labels);
    const dismissed: { ref: string; name: string }[] = [];
    for (const p of picks.slice(0, 1)) {   // dismiss one per call; agent re-calls if another wall appears
      try {
        await this.click.execute({ sessionId: input.sessionId, pageId: obs.pageId, target: { by: "ref", ref: p.ref } }, ctx);
        dismissed.push({ ref: p.ref, name: p.name });
      } catch { /* ref may have expired mid-dismiss; report what we did */ }
    }
    return { pageId: obs.pageId, dismissed };
  }
}
```

Register in `src/transport/routes.ts` (same `/snapshot`-style pattern):

```ts
import { DismissHandler } from "../commands/dismiss";

// near the other schemas:
const DismissSchema = z.object({
  pageId: z.string().optional(),
  labels: z.array(z.string().min(1)).optional(),
});

// with the other handler instantiations:
  const dismissHandler = new DismissHandler(manager);

  app.post("/v1/sessions/:sessionId/dismiss", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      const input = DismissSchema.parse(request.body ?? {});
      const result = await dismissHandler.execute({ sessionId, ...input }, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });
```

- [ ] **Step 4: Write + run the integration test**

```ts
// tests/integration/dismiss.integration.test.ts
// Copy the boot + api() harness from tests/integration/close-tab.integration.test.ts (lines 1-41).
// Launch a session; navigate to a data: URL whose body is a fixed-overlay cookie banner
// (z-index high, covering the page) containing a <button>Accept all</button>.
// POST /v1/sessions/:id/dismiss with {}.
//   expect(res.body.data.dismissed[0].name).toBe("Accept all");
// Then POST /observe again and assert the overlay is gone:
//   expect(after.body.data.overlays.length).toBe(0);
```

Run: `npx vitest run tests/unit/dismiss-match.test.ts` → PASS
Run: `npx vitest run --config vitest.integration.config.ts tests/integration/dismiss.integration.test.ts` → PASS

- [ ] **Step 5: Commit**

```bash
git add src/commands/dismiss.ts src/transport/routes.ts tests/unit/dismiss-match.test.ts tests/integration/dismiss.integration.test.ts
git commit -m "feat(observe): opt-in dismiss helper (overlay-scoped, affirmative-label-only) + route"
```

---

## Task 10: End-to-end loop integration test

**Files:**
- Test: `tests/integration/observe-loop.integration.test.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/integration/observe-loop.integration.test.ts
// Copy the boot + api() harness from tests/integration/close-tab.integration.test.ts (lines 1-41).
// Full golden loop against a data: URL with an <input> and a <button>:
//   1. POST /observe -> capture an input ref and a button ref
//   2. POST /type { target:{by:"ref",ref:<input>}, text:"x" }, then POST /click { target:{by:"ref",ref:<button>} }
//   3. POST /observe again -> assert diff is non-null and reflects the change
//   4. POST /click with the input ref captured in step 1 -> expect 409 REF_EXPIRED (superseded by step-3 observe)
```

- [ ] **Step 2: Run it (expect FAIL if any wiring is off)**

Run: `npx vitest run --config vitest.integration.config.ts tests/integration/observe-loop.integration.test.ts`

- [ ] **Step 3: Fix any wiring surfaced** (no new code expected; this is the integration guard)

- [ ] **Step 4: Run the full suites**

Run: `npx vitest run` → Expected: PASS (ignore the known pre-existing `continuity.test.ts` failure)
Run: `npx vitest run --config vitest.integration.config.ts` → Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/integration/observe-loop.integration.test.ts
git commit -m "test(observe): end-to-end observe -> act-by-ref -> diff -> REF_EXPIRED loop"
```

---

## Task 11: Docs — playbook + api-reference

**Files:**
- Modify: `docs/agent-playbook.md`
- Modify: `docs/api-reference.md`

- [ ] **Step 1: Update the golden loop + cheat sheet in `docs/agent-playbook.md`**

- Replace the golden loop with: `observe → act by ref → observe (read diff) → repeat`. Keep `snapshot` documented for *reading* tasks; add a one-liner distinguishing them (`observe` = acting, `snapshot` = reading).
- Add a new **#1** row to the targeting cheat sheet: `{ "by": "ref", "ref": "e3" }` — "From the latest `observe`; most robust + fastest, no guessing. Valid until the next observe."
- Add an `observe` recipe (request/response) and a `dismiss` recipe; note `observe` is read-only and `dismiss` is opt-in + overlay-scoped.
- Add `REF_EXPIRED` to the error→recovery table (recovery: re-observe).

- [ ] **Step 2: Update `docs/api-reference.md`**

- Document `POST /v1/sessions/:sessionId/observe` (request fields `pageId?`, `cap?`, `viewportOnly?`, `includeText?`; full response shape from the spec) and `POST /v1/sessions/:sessionId/dismiss`.
- Add `{ by: "ref", ref }` to the documented `Target` union.
- Add `REF_EXPIRED` (409) to the error-code table.

- [ ] **Step 3: Commit**

```bash
git add docs/agent-playbook.md docs/api-reference.md
git commit -m "docs(observe): new golden loop, act-by-ref cheat-sheet #1, observe/dismiss endpoints"
```

---

## Self-review notes

- **Spec coverage:** §5 observe contract → T1/T6; §6 diff → T3; §7 act-by-ref → T7; §8 occlusion/overlays/frames/shadow/redaction → T4; §9 dismiss → T9; §10 screenshot → T2; §11 errors (`REF_EXPIRED`, non-HTML→empty) → T1/T6/T8; §12 testing → T3/T4/T6/T7/T9/T10; §13 file structure → file map; §14 detectability (read-only, no mutation, no value reads) → T4. All covered.
- **Non-HTML page** (§11): `walkAllFrames` runs `querySelectorAll` on whatever document exists; `about:blank`/non-HTML yields an empty element set → empty `actions`/`overlays`, `diff` per cache (null after the navigation that loaded it). No special-casing needed; T6's contract holds.
- **Deferred (do NOT build):** cross-origin iframe descent; goal-aware LLM relevance filter; isolated-world execution (v2 stealth hardening). Recorded in spec §16.
- **Known flake:** `continuity.test.ts` is pre-existing and unrelated — ignore in suite runs.
