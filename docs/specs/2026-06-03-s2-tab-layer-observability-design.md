# S2 Design — Tab-layer Correctness & Observability

**Date:** 2026-06-03
**Program:** Stabilization & Linux-Readiness (bridges Phase 3 → Phase 4)
**Sub-phase:** S2 — Linux weight & observability
**Parent spec:** `docs/specs/2026-06-03-stabilization-linux-readiness-design.md`
**Status:** Approved (design). Implementation plan to follow.

## Scope

This spec covers **three** of S2's four items — the unblocked correctness/observability work:

1. **Dup-registration fix** — a single page currently gets two `pageId`s.
2. **`TAB_UPDATED` event** — settled updates only; completes the tab event model.
3. **Observability hardening** — `getPageInfoList()` resilience + trace e2e verification.

**Deferred (out of this plan):** `FEATHER_CHROMIUM_PATH` (Linux-native Chromium weight
reduction). It is gated on a system-Chromium install + probe spike
(`sudo dnf install chromium`, then verify the binary launches with our headless options).
It is a different theme (weight, not correctness) and will be handled as a follow-on once
the spike runs. See parent spec and `journal/context/active.md`.

## Constraints

- Existing HTTP API contract unchanged; full suite stays green (129 unit + 32 integration baseline).
- No agent runtime / LLM concepts introduced (Phase 3/S2 boundary holds).
- Every page read added by this work is **best-effort** and must never throw into a lifecycle
  listener — a bad page must not crash the session or the SSE stream.

---

## Item 1 — Duplicate tab registration fix (prerequisite)

### Problem

When `SessionManager.openTab()` runs:
- `FeatherSession.openTab()` (`src/sessions/session.ts:124`) calls `context.newPage()` and
  registers the page under a fresh `pageId`.
- The `context.on("page")` listener (`src/sessions/manager.ts:114`) **also** fires for that same
  new page and calls `session.addPage(page)`, registering it under a **second** `pageId`.

Result: one `Page` object is held in the page map under two ids. This corrupts per-page bookkeeping
and blocks `TAB_UPDATED`, which must key navigation listeners to exactly one id per page.

### Fix — idempotent registration keyed on the Page object

In `FeatherSession`:
- Add a reverse map `Page → pageId` (`_pageIds`) alongside the existing `pageId → Page` map
  (`_pages`).
- `addPage(page)` becomes **idempotent**: if the page is already in `_pageIds`, return its existing
  id; otherwise assign a new id, record both directions, return the new id.
- `setContext()` (which seeds pre-existing pages) routes through `addPage` so the reverse map is
  populated consistently.
- `removePage(pageId)` clears both maps.
- `openTab()` no longer assigns its own id. It calls `context.newPage()`, then `addPage(page)`, and
  returns whatever id comes back.

Because `addPage` is idempotent on the `Page` object, it does not matter whether the
`context.on("page")` listener or `openTab()` calls it first — the page ends up with exactly one id,
and the listener-vs-`openTab` ordering race is eliminated.

### Event semantics (decision, kept as-is)

An API-driven `openTab` emits **both** `TAB_OPENED` (manager) and `TAB_CREATED` (listener). This is
**intentional and retained**:
- `TAB_CREATED` = "a page now exists" — fires for *every* page however created (API, `window.open`,
  `target=_blank`). This is the lifecycle event a future tab UI consumes.
- `TAB_OPENED` = "the API was explicitly asked to open a tab" — intent/audit marker, API opens only.

Collapsing them would be an event-contract change and scope creep; not done here.

---

## Item 2 — `TAB_UPDATED` event (settled updates only)

### Decision

**Settled updates only:** one `TAB_UPDATED` per navigation, fired once the page has settled enough
that the title is real. No intermediate "loading…" pulse (a loading spinner, if ever wanted, is a
Phase-4 shell concern — YAGNI). Rationale: nothing consumes this event yet; it matches the existing
"thin SSE stream for a future UI" design.

### Why not "URL+title on `framenavigated`" directly

`page.title()` is **not reliable at `framenavigated` time** — the new document is committed but its
`<title>` is often not yet parsed, yielding an empty/stale title. A reliable title requires waiting
to at least `domcontentloaded`. Hence the settle step below.

### Catalog & transport wiring

- `src/logs/events.ts`: add `TAB_UPDATED: "tab.updated"` to `EVENTS`.
- `src/transport/sse.ts`: add `"tab.updated"` to the `LIFECYCLE_EVENTS` set so it reaches
  `GET /v1/events`. Per-command events remain filtered out.

### Mechanism

In the `context.on("page")` listener (`manager.ts`), alongside the existing `page.on("close")`,
attach a main-frame navigation handler:

```
page.on("framenavigated", async (frame) => {
  if (frame !== page.mainFrame()) return;          // main frame only
  const target = page.url();                       // capture target URL
  try { await page.waitForLoadState("domcontentloaded"); } catch { /* best-effort */ }
  if (page.url() !== target) return;               // superseded by a newer navigation → skip
  let title = "", loadState = "unknown";
  try { title = await page.title(); } catch { /* best-effort */ }
  try { loadState = await page.evaluate(() => document.readyState); } catch { /* best-effort */ }
  emit TAB_UPDATED { pageId, url: page.url(), title, loadState };
});
```

Notes:
- `framenavigated` fires for **both** full navigations and SPA `history.pushState` route changes
  (`load`/`domcontentloaded` do not fire for `pushState`), so this single trigger covers both.
- `waitForLoadState("domcontentloaded")` resolves instantly when already settled (the SPA case).
- The **supersede guard** (`page.url() !== target`) drops stale emits when navigations arrive faster
  than they settle; the newer navigation emits its own event.
- `pageId` is the single id from Item 1's idempotent registration.

### Payload

`{ pageId, url, title, loadState }` — same shape as `PageInfo`'s relevant fields, consistent with
`TAB_CREATED`/`TAB_CLOSED` payload conventions (`{ pageId, … }` under `data`).

---

## Item 3 — Observability hardening

### 3a. `getPageInfoList()` resilience

`FeatherSession.getPageInfoList()` (`src/sessions/session.ts:110`) currently awaits
`page.evaluate(...)` and `page.title()` per page with no guard. One page that throws (closed or
crashed mid-call) rejects the whole list, breaking status endpoints.

Fix: wrap each page's `evaluate`/`title()` reads in try/catch. `page.url()` is synchronous and
safe, so it is always included. On failure of the async reads, push a best-effort entry
`{ pageId, url: page.url(), title: "", loadState: "unknown" }` and continue. Mirrors the defensive
read used in `TAB_UPDATED`.

### 3b. Trace e2e verification

`capture.ts:100` writes `trace.zip` when `debug.trace` is set, but the path is untested end-to-end.
Add an integration test:
- Launch a session with `debug: { trace: true }`.
- Run at least one command (e.g. navigate).
- Build a debug bundle.
- Assert `trace.zip` exists in the debug dir and is non-empty.

No production code change is expected; if the test surfaces a real gap, fix it under this item.

---

## Testing

**Unit:**
- `addPage` idempotency: same `Page` registered twice → one id; `_pages` and `_pageIds` stay
  consistent.
- `openTab` returns the listener-assigned id (no second id created).
- `removePage` clears both maps.
- `TAB_UPDATED` payload shape and the supersede guard (stale navigation does not emit).
- `getPageInfoList` resilience: a failing page yields a `loadState: "unknown"` entry rather than a
  thrown list.

**Integration:**
- `TAB_UPDATED` fires on a real navigation and carries a correct settled title; fires on an SPA
  `pushState` route change.
- Trace e2e: `trace.zip` produced and non-empty via the debug-bundle path.

**Regression:** full suite green (129 unit + 32 integration baseline) with new tests added on top.

## Out of scope

- `FEATHER_CHROMIUM_PATH` / system Chromium (deferred; spike-gated).
- Any loading-progress / spinner event semantics (explicitly declined — settled-only).
- Collapsing `TAB_OPENED` / `TAB_CREATED` (event-contract change; not needed).
- Agent perception layer / Actionable Tree (parked to Phase 5 — see
  `research/2026-06-03-phase-5-agent-perception-layer-notes.md`).
