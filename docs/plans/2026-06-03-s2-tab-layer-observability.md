# S2 — Tab-layer Correctness & Observability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the duplicate-tab-registration bug, complete the tab event model with a settled-only `TAB_UPDATED` event, and harden `getPageInfoList()` so one bad page can't break status reads.

**Architecture:** Page identity moves to a reverse `Page → pageId` map so registration is idempotent regardless of which code path (the `context.on("page")` listener or `openTab()`) sees a page first. The `context.on("page")` listener gains a main-frame `framenavigated` handler that emits one `TAB_UPDATED` per settled navigation. All added page reads are best-effort and never throw into a listener.

**Tech Stack:** TypeScript, Playwright (`BrowserContext`/`Page`), Fastify SSE (`fastify-sse-v2`), Vitest (unit + integration), Node EventEmitter bus (`src/logs/bus.ts`).

**Source spec:** `docs/specs/2026-06-03-s2-tab-layer-observability-design.md`

**Scope note (decided 2026-06-03):** The spec's Item 3b (trace e2e verification) is **CUT from S2**. Investigation found `DebugCapture` (`src/debug/capture.ts`) is defined but never instantiated — the `debug.trace` flag is never read by `SessionManager.launch()`, so `trace.zip` is never produced. Wiring a tracing subsystem into the session lifecycle is deferred to a future observability sprint to keep S2 strictly stabilization. See "Deferred" at the bottom. This plan ships **three** items: dup-registration fix, `TAB_UPDATED`, and `getPageInfoList()` resilience.

**Test commands:**
- Single unit file: `npx vitest run --config vitest.config.ts <path>`
- Single unit test by name: `npx vitest run --config vitest.config.ts <path> -t "<name>"`
- Full unit suite: `npm test`
- Full integration suite: `npm run test:integration`
- Typecheck: `npm run typecheck`

**Baseline (must stay green):** 129 unit + 32 integration passing.

---

## File Structure

- `src/sessions/session.ts` — MODIFY. Add reverse `Page → pageId` map; make `addPage` idempotent; route `setContext`/`openTab` through it; fix `removePage` to clear both maps; harden `getPageInfoList`.
- `src/logs/events.ts` — MODIFY. Add `TAB_UPDATED: "tab.updated"`.
- `src/transport/sse.ts` — MODIFY. Add `"tab.updated"` to `LIFECYCLE_EVENTS`.
- `src/sessions/manager.ts` — MODIFY. In the `context.on("page")` listener, attach a main-frame `framenavigated` handler that emits `TAB_UPDATED`.
- `tests/unit/sessions/session-dynamic-pages.test.ts` — MODIFY. Add idempotency + resilience tests.
- `tests/unit/sessions/manager.test.ts` — MODIFY. Add `TAB_UPDATED` emit, supersede-guard, and main-frame-only tests.
- `tests/integration/tab-updated.integration.test.ts` — CREATE. Real-navigation e2e: open a tab, navigate it, observe `tab.updated` over SSE with a settled title.

---

## Task 1: Idempotent page registration (dup-registration fix)

**Files:**
- Modify: `src/sessions/session.ts`
- Test: `tests/unit/sessions/session-dynamic-pages.test.ts`

The bug: when `SessionManager.openTab()` runs, `FeatherSession.openTab()` registers the new page under one id, and the `context.on("page")` listener fires for the same page and registers it under a *second* id. Fix: key identity on the `Page` object so registration is idempotent.

- [ ] **Step 1: Write the failing tests**

Add to `tests/unit/sessions/session-dynamic-pages.test.ts` (the file already imports `FeatherSession`, `Page`, and defines `makeSession()` / `makePage()`):

```typescript
describe("FeatherSession.addPage — idempotency (dup-registration fix)", () => {
  it("returns the same pageId when the same Page object is registered twice", () => {
    const session = makeSession();
    const page = makePage("http://example.com", "Example");
    const first = session.addPage(page);
    const second = session.addPage(page);
    expect(second).toBe(first);
  });

  it("keeps getPageInfoList at one entry when the same Page is registered twice", async () => {
    const session = makeSession();
    const page = makePage("http://example.com", "Example");
    session.addPage(page);
    session.addPage(page);
    const list = await session.getPageInfoList();
    expect(list).toHaveLength(1);
  });

  it("removePage clears the reverse map so re-adding yields a fresh id", () => {
    const session = makeSession();
    const page = makePage("http://example.com", "Example");
    const firstId = session.addPage(page);
    session.removePage(firstId);
    const secondId = session.addPage(page);
    expect(secondId).not.toBe(firstId);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run --config vitest.config.ts tests/unit/sessions/session-dynamic-pages.test.ts -t "idempotency"`
Expected: FAIL — the second `addPage` currently returns a *new* id, so `second).toBe(first)` fails and the list has 2 entries.

- [ ] **Step 3: Add the reverse map and make registration idempotent**

In `src/sessions/session.ts`, add the field alongside `_pages` (currently declared near line 52):

```typescript
  private _pages: Map<string, Page>;
  private _pageIds: Map<Page, string>;
```

In the constructor (next to `this._pages = new Map();`):

```typescript
    this._pages = new Map();
    this._pageIds = new Map();
```

Replace `setContext` so pre-existing pages route through `addPage`:

```typescript
  setContext(context: BrowserContext): void {
    this._context = context;
    for (const page of context.pages()) {
      this.addPage(page);
    }
    this._state = "running";
  }
```

Replace `addPage` so it is idempotent on the `Page` object:

```typescript
  addPage(page: Page): string {
    const existing = this._pageIds.get(page);
    if (existing) return existing;
    const pageId = newId("page");
    this._pages.set(pageId, page);
    this._pageIds.set(page, pageId);
    return pageId;
  }
```

Replace `removePage` so it clears both maps:

```typescript
  removePage(pageId: string): void {
    const page = this._pages.get(pageId);
    if (page) this._pageIds.delete(page);
    this._pages.delete(pageId);
  }
```

Replace `openTab` so it no longer assigns its own id — it delegates to `addPage`:

```typescript
  async openTab(): Promise<{ pageId: string; page: Page }> {
    if (this._state !== "running") {
      throw new SessionNotRunningError(this.sessionId, this._state);
    }
    const page = await this._context!.newPage();
    const pageId = this.addPage(page);
    return { pageId, page };
  }
```

- [ ] **Step 4: Run the new tests to verify they pass**

Run: `npx vitest run --config vitest.config.ts tests/unit/sessions/session-dynamic-pages.test.ts`
Expected: PASS — all idempotency tests green, plus the pre-existing `addPage`/`removePage` tests still pass (note: the existing "each call returns a unique pageId" test uses two *different* `makePage()` objects, so it stays green).

- [ ] **Step 5: Run the related suites to confirm no regression**

Run: `npx vitest run --config vitest.config.ts tests/unit/sessions/session-open-tab.test.ts tests/unit/sessions/manager.test.ts`
Expected: PASS — `openTab` still returns a `page_`-prefixed id and a `Page`; `toRecord` still omits `pages`.

- [ ] **Step 6: Commit**

```bash
git add src/sessions/session.ts tests/unit/sessions/session-dynamic-pages.test.ts
git commit -m "fix(sessions): idempotent page registration keyed on Page object

Eliminates the duplicate tab-registration bug where openTab and the
context.on('page') listener each assigned a separate pageId to the same
Page. addPage is now idempotent on the Page object; setContext/openTab
route through it; removePage clears the reverse map.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: `getPageInfoList()` resilience (Item 3a)

**Files:**
- Modify: `src/sessions/session.ts`
- Test: `tests/unit/sessions/session-dynamic-pages.test.ts`

One page that throws on `evaluate`/`title()` (closed or crashed mid-call) currently rejects the whole list and breaks status endpoints. Make each per-page read best-effort.

- [ ] **Step 1: Write the failing test**

Add to `tests/unit/sessions/session-dynamic-pages.test.ts`. This needs a page whose async reads throw; `makePage()` always succeeds, so define a local bad-page helper inside the new `describe`:

```typescript
describe("FeatherSession.getPageInfoList — resilience (Item 3a)", () => {
  function makeBadPage(url: string): Page {
    return {
      url: () => url,
      title: async () => { throw new Error("page crashed"); },
      evaluate: async () => { throw new Error("page crashed"); },
      on: () => {},
    } as any;
  }

  it("returns a best-effort entry instead of throwing when a page read fails", async () => {
    const session = makeSession();
    session.addPage(makeBadPage("http://crashed.com"));
    const list = await session.getPageInfoList();
    expect(list).toHaveLength(1);
    expect(list[0].url).toBe("http://crashed.com");
    expect(list[0].title).toBe("");
    expect(list[0].loadState).toBe("unknown");
  });

  it("returns good entries alongside a failing page", async () => {
    const session = makeSession();
    session.addPage(makePage("http://good.com", "Good"));
    session.addPage(makeBadPage("http://crashed.com"));
    const list = await session.getPageInfoList();
    expect(list).toHaveLength(2);
    const good = list.find((p) => p.url === "http://good.com");
    expect(good?.title).toBe("Good");
    const bad = list.find((p) => p.url === "http://crashed.com");
    expect(bad?.loadState).toBe("unknown");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run --config vitest.config.ts tests/unit/sessions/session-dynamic-pages.test.ts -t "resilience"`
Expected: FAIL — `getPageInfoList()` currently awaits `page.evaluate(...)` unguarded, so the rejection propagates and the whole call throws.

- [ ] **Step 3: Guard each per-page read**

In `src/sessions/session.ts`, replace `getPageInfoList`:

```typescript
  async getPageInfoList(): Promise<PageInfo[]> {
    const results: PageInfo[] = [];
    for (const [pageId, page] of this._pages.entries()) {
      let title = "";
      let loadState = "unknown";
      try {
        loadState = await page.evaluate(() => document.readyState);
      } catch {
        /* best-effort: page may be closed/crashed */
      }
      try {
        title = await page.title();
      } catch {
        /* best-effort */
      }
      results.push({ pageId, url: page.url(), title, loadState });
    }
    return results;
  }
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run --config vitest.config.ts tests/unit/sessions/session-dynamic-pages.test.ts`
Expected: PASS — resilience tests green; the existing "is reflected in getPageInfoList()" test (a good page returns its real title/`complete` loadState) still passes.

- [ ] **Step 5: Commit**

```bash
git add src/sessions/session.ts tests/unit/sessions/session-dynamic-pages.test.ts
git commit -m "fix(sessions): make getPageInfoList resilient to per-page read failures

Each page's evaluate()/title() read is now best-effort; a closed or
crashed page yields { title: '', loadState: 'unknown' } instead of
rejecting the entire list and breaking status endpoints.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: `TAB_UPDATED` event — catalog + transport wiring

**Files:**
- Modify: `src/logs/events.ts`
- Modify: `src/transport/sse.ts`

Add the event name and let it through the SSE filter. No behavior yet — that comes in Task 4. This task is wiring-only and is verified by typecheck + the existing SSE suite.

- [ ] **Step 1: Add `TAB_UPDATED` to the catalog**

In `src/logs/events.ts`, add the entry inside the `EVENTS` object, directly after `TAB_CREATED`:

```typescript
  TAB_OPENED: "tab.opened",
  TAB_CREATED: "tab.created",
  TAB_UPDATED: "tab.updated",
  TAB_CLOSED: "tab.closed",
```

- [ ] **Step 2: Add `"tab.updated"` to the SSE lifecycle filter**

In `src/transport/sse.ts`, add to the `LIFECYCLE_EVENTS` set, after `"tab.created"`:

```typescript
  "tab.opened",
  "tab.created",
  "tab.updated",
  "tab.closed",
```

- [ ] **Step 3: Typecheck and run the SSE suite**

Run: `npm run typecheck`
Expected: clean (no errors).

Run: `npm run test:integration -- tests/integration/sse.integration.test.ts`
Expected: PASS — existing SSE tests unaffected (the new event simply isn't emitted yet).

- [ ] **Step 4: Commit**

```bash
git add src/logs/events.ts src/transport/sse.ts
git commit -m "feat(events): register TAB_UPDATED in catalog and SSE lifecycle filter

Adds tab.updated to the EVENTS catalog and the SSE LIFECYCLE_EVENTS set
so it reaches GET /v1/events. Emission wiring follows in the next commit.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: `TAB_UPDATED` emission — settled-only main-frame handler

**Files:**
- Modify: `src/sessions/manager.ts`
- Test: `tests/unit/sessions/manager.test.ts`

In the existing `context.on("page")` listener, attach a `framenavigated` handler that fires once per settled navigation. `framenavigated` covers both full navigations and SPA `history.pushState` (which does not fire `load`/`domcontentloaded`). A supersede guard drops stale emits when navigations arrive faster than they settle.

- [ ] **Step 1: Write the failing unit tests**

Add a new `describe` block to `tests/unit/sessions/manager.test.ts` (the file already mocks `playwright` and defines the `manager`/`paths` fixtures):

```typescript
describe("SessionManager.launch — TAB_UPDATED (settled-only)", () => {
  it("logs TAB_UPDATED on main-frame navigation with a settled title", async () => {
    const { chromium } = await import("playwright");
    const mockContextOn = vi.fn();
    const mockPageOn = vi.fn();
    const frame = {};
    const mockPage = {
      url: () => "http://settled.com",
      title: async () => "Settled Title",
      evaluate: async () => "complete",
      mainFrame: () => frame,
      waitForLoadState: async () => {},
      on: mockPageOn,
    };
    (chromium.launchPersistentContext as vi.Mock).mockResolvedValueOnce({
      pages: () => [],
      newPage: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
      on: mockContextOn,
      tracing: { start: vi.fn(), stop: vi.fn() },
    });
    const logSpy = vi.spyOn(manager["logger"], "log");
    const session = await manager.launch({ profile: { kind: "disposable" } });
    const [, pageCallback] = mockContextOn.mock.calls.find(([evt]: [string]) => evt === "page")!;
    pageCallback(mockPage);
    const [, navCallback] = mockPageOn.mock.calls.find(([evt]: [string]) => evt === "framenavigated")!;
    await navCallback(frame);
    const log = logSpy.mock.calls.find(([e]) => e.event === "tab.updated");
    expect(log).toBeDefined();
    expect(log![0].sessionId).toBe(session.sessionId);
    expect(log![0].data).toMatchObject({
      pageId: expect.stringMatching(/^page_/),
      url: "http://settled.com",
      title: "Settled Title",
      loadState: "complete",
    });
  });

  it("does NOT log TAB_UPDATED for a non-main-frame navigation", async () => {
    const { chromium } = await import("playwright");
    const mockContextOn = vi.fn();
    const mockPageOn = vi.fn();
    const frame = {};
    const otherFrame = {};
    const mockPage = {
      url: () => "http://settled.com",
      title: async () => "Settled Title",
      evaluate: async () => "complete",
      mainFrame: () => frame,
      waitForLoadState: async () => {},
      on: mockPageOn,
    };
    (chromium.launchPersistentContext as vi.Mock).mockResolvedValueOnce({
      pages: () => [],
      newPage: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
      on: mockContextOn,
      tracing: { start: vi.fn(), stop: vi.fn() },
    });
    const logSpy = vi.spyOn(manager["logger"], "log");
    await manager.launch({ profile: { kind: "disposable" } });
    const [, pageCallback] = mockContextOn.mock.calls.find(([evt]: [string]) => evt === "page")!;
    pageCallback(mockPage);
    const [, navCallback] = mockPageOn.mock.calls.find(([evt]: [string]) => evt === "framenavigated")!;
    await navCallback(otherFrame);
    const log = logSpy.mock.calls.find(([e]) => e.event === "tab.updated");
    expect(log).toBeUndefined();
  });

  it("does NOT log TAB_UPDATED when the navigation is superseded mid-settle", async () => {
    const { chromium } = await import("playwright");
    const mockContextOn = vi.fn();
    const mockPageOn = vi.fn();
    const frame = {};
    let urlCalls = 0;
    const mockPage = {
      // first call (capture target) → first.com; second call (guard) → second.com
      url: () => (urlCalls++ === 0 ? "http://first.com" : "http://second.com"),
      title: async () => "Title",
      evaluate: async () => "complete",
      mainFrame: () => frame,
      waitForLoadState: async () => {},
      on: mockPageOn,
    };
    (chromium.launchPersistentContext as vi.Mock).mockResolvedValueOnce({
      pages: () => [],
      newPage: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
      on: mockContextOn,
      tracing: { start: vi.fn(), stop: vi.fn() },
    });
    const logSpy = vi.spyOn(manager["logger"], "log");
    await manager.launch({ profile: { kind: "disposable" } });
    const [, pageCallback] = mockContextOn.mock.calls.find(([evt]: [string]) => evt === "page")!;
    pageCallback(mockPage);
    const [, navCallback] = mockPageOn.mock.calls.find(([evt]: [string]) => evt === "framenavigated")!;
    await navCallback(frame);
    const log = logSpy.mock.calls.find(([e]) => e.event === "tab.updated");
    expect(log).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run --config vitest.config.ts tests/unit/sessions/manager.test.ts -t "TAB_UPDATED"`
Expected: FAIL — no `framenavigated` listener is registered yet, so `mockPageOn.mock.calls.find(... "framenavigated")` is `undefined` and destructuring throws / no `tab.updated` log exists.

- [ ] **Step 3: Attach the `framenavigated` handler in the page listener**

In `src/sessions/manager.ts`, inside the existing `context.on("page", (page) => { ... })` block (currently around lines 114–133), add the navigation handler *after* the existing `page.on("close", ...)` handler. The `pageId` const captured at the top of the listener is the single idempotent id from Task 1:

```typescript
      page.on("framenavigated", async (frame) => {
        if (frame !== page.mainFrame()) return;          // main frame only
        const target = page.url();                       // capture target URL
        try {
          await page.waitForLoadState("domcontentloaded");
        } catch {
          /* best-effort: resolves instantly when already settled (SPA case) */
        }
        if (page.url() !== target) return;               // superseded by a newer navigation
        let title = "";
        let loadState = "unknown";
        try {
          title = await page.title();
        } catch {
          /* best-effort */
        }
        try {
          loadState = await page.evaluate(() => document.readyState);
        } catch {
          /* best-effort */
        }
        void this.logger.log({
          ts: new Date().toISOString(),
          level: "info",
          event: EVENTS.TAB_UPDATED,
          sessionId: session.sessionId,
          data: { pageId, url: page.url(), title, loadState },
        });
      });
```

- [ ] **Step 4: Run the new tests to verify they pass**

Run: `npx vitest run --config vitest.config.ts tests/unit/sessions/manager.test.ts -t "TAB_UPDATED"`
Expected: PASS — settled navigation logs `tab.updated` with the correct payload; non-main-frame and superseded navigations log nothing.

- [ ] **Step 5: Run the full manager suite to confirm no regression**

Run: `npx vitest run --config vitest.config.ts tests/unit/sessions/manager.test.ts`
Expected: PASS — existing dynamic-page-tracking tests still green (their mock pages use `on: vi.fn()`, so the new `page.on("framenavigated", ...)` registration is captured but never invoked, and the `tab.created`/`tab.closed` tests are unaffected).

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add src/sessions/manager.ts tests/unit/sessions/manager.test.ts
git commit -m "feat(sessions): emit TAB_UPDATED on settled main-frame navigation

The context.on('page') listener now attaches a framenavigated handler
that fires one TAB_UPDATED per navigation, after waitForLoadState
('domcontentloaded') so the title is real. Main-frame-only, with a
supersede guard that drops stale emits when navigations outpace settle.
Covers SPA pushState (which rides framenavigated). All reads best-effort.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: `TAB_UPDATED` end-to-end integration test (real navigation)

**Files:**
- Create: `tests/integration/tab-updated.integration.test.ts`

Prove the whole chain with real Chromium: open a tab (so it goes through `context.on("page")` and gets the `framenavigated` handler), subscribe to SSE, navigate that tab, and observe a `tab.updated` event carrying a settled (non-empty) title. Modeled on `tests/integration/api-flow.integration.test.ts` (manager + HTTP server + token) and `tests/integration/sse.integration.test.ts` (SSE stream reading).

> **SPA `pushState` note:** `pushState` rides the same single `framenavigated` trigger as full navigation (verified by the supersede/main-frame unit tests and Playwright's documented behavior). A dedicated pushState fixture is intentionally NOT added here to avoid integration flakiness; the mechanism is covered. If a regression is ever suspected, add a fixture that serves an inline page calling `history.pushState` and assert a second `tab.updated`.

- [ ] **Step 1: Write the failing integration test**

Create `tests/integration/tab-updated.integration.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { FeatherPaths, ensureDirs } from "../../src/fs-layout";
import { ProfileLock } from "../../src/profiles/lock";
import { WorkspaceMetadata } from "../../src/profiles/workspace";
import { SessionManager } from "../../src/sessions/manager";
import { startHttpServer } from "../../src/transport/http";

let baseUrl: string;
let token: string;
let manager: SessionManager;
let tmpDir: string;

async function api(method: string, p: string, body?: object) {
  const res = await fetch(`${baseUrl}${p}`, {
    method,
    headers: { "Content-Type": "application/json", "X-Feather-Token": token },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-int-tabupd-"));
  await ensureDirs(tmpDir);
  const paths = new FeatherPaths(tmpDir);
  const lock = new ProfileLock(paths);
  const workspace = new WorkspaceMetadata(paths);
  manager = new SessionManager(paths, lock, workspace);
  const { port, token: t } = await startHttpServer("127.0.0.1", 0, manager, paths);
  token = t;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  const sessions = manager.list();
  await Promise.allSettled(sessions.map((s) => manager.close(s.sessionId, { force: true })));
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe("TAB_UPDATED over SSE on real navigation", () => {
  it("emits tab.updated with a settled title after navigating an opened tab", async () => {
    // Launch a real session.
    const launch = await api("POST", "/v1/sessions", {
      workspaceId: "tab-updated-ws",
      profile: { kind: "persistent" },
      browserMode: "chromium-headless-shell",
    });
    expect(launch.status).toBe(200);
    const sessionId = launch.body.data.sessionId as string;

    // Open a new tab so it flows through context.on("page") and gets the
    // framenavigated handler attached.
    const tab = await api("POST", `/v1/sessions/${sessionId}/tabs`, {});
    expect(tab.status).toBe(200);
    const pageId = tab.body.data.pageId as string;

    // Subscribe to the SSE stream BEFORE navigating.
    const ac = new AbortController();
    const timeoutId = setTimeout(() => ac.abort(), 15000);
    try {
      const res = await fetch(`${baseUrl}/v1/events`, {
        headers: { "X-Feather-Token": token },
        signal: ac.signal,
      });
      expect(res.status).toBe(200);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      // Let the generator subscribe to the bus.
      await new Promise((r) => setTimeout(r, 100));

      // Navigate the opened tab — triggers framenavigated → TAB_UPDATED.
      await api("POST", `/v1/sessions/${sessionId}/navigate`, {
        pageId,
        url: "https://example.com",
        waitUntil: "domcontentloaded",
        timeoutMs: 30000,
      });

      // Read the stream until the settled example.com title arrives or we
      // time out. Break on the title (not on the first "tab.updated"): a new
      // tab's initial about:blank may emit its own tab.updated first.
      let buffer = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          if (buffer.includes("Example Domain")) break;
        }
      } finally {
        reader.cancel();
      }

      expect(buffer).toContain("event: tab.updated");
      // The settled title for example.com is "Example Domain".
      expect(buffer).toContain("Example Domain");
      expect(buffer).toContain(`"pageId":"${pageId}"`);
    } finally {
      clearTimeout(timeoutId);
      ac.abort();
    }
  }, 40000);
});
```

- [ ] **Step 2: Run the integration test to verify it passes**

Run: `npm run test:integration -- tests/integration/tab-updated.integration.test.ts`
Expected: PASS — `tab.updated` appears in the SSE buffer with title `Example Domain` and the opened tab's `pageId`.

> If it fails because the SSE event payload nests the title under `data` (it does: `data: { data: { ..., title } }`), the `buffer.includes("Example Domain")` substring assertion still holds because the JSON is serialized into the stream text. If the substring match proves flaky on chunk boundaries, increase the read loop's tolerance — do not assert on exact framing.

- [ ] **Step 3: Commit**

```bash
git add tests/integration/tab-updated.integration.test.ts
git commit -m "test(integration): e2e TAB_UPDATED over SSE on real navigation

Opens a tab, subscribes to GET /v1/events, navigates the tab to
example.com, and asserts a tab.updated event arrives carrying the
settled title 'Example Domain' and the tab's pageId.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Full-suite regression gate

**Files:** none (verification only).

- [ ] **Step 1: Run the full unit suite**

Run: `npm test`
Expected: PASS — 129 baseline + new unit tests (idempotency ×3, resilience ×2, TAB_UPDATED ×3) all green.

- [ ] **Step 2: Run the full integration suite**

Run: `npm run test:integration`
Expected: PASS — 32 baseline + new `tab-updated` integration test green.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 4: If all green, no commit needed**

This task is a gate. If any step fails, stop and debug before declaring S2 complete (use superpowers:systematic-debugging).

---

## Deferred (NOT in this plan — documented for the follow-on observability sprint)

- **Trace e2e verification + `DebugCapture` wiring (was spec Item 3b).** `DebugCapture` (`src/debug/capture.ts`) is defined but never instantiated; `SessionManager.launch()` never reads the `debug.trace` flag, so `tracing.start()` is never called and `trace.zip` is never produced. The debug-bundle path (`DebugBundle.finalize`) only zips whatever files already exist in the debug dir. Wiring `DebugCapture` into the launch (`start()` after `setContext`) and close (`finalize()` before `context.close()`) lifecycle is real subsystem work and was cut from S2 to keep it strictly stabilization. Revisit in a dedicated observability sprint.

- **`FEATHER_CHROMIUM_PATH` / system Chromium** (spec deferral, unchanged) — gated on `sudo dnf install chromium` + a launch probe spike, then `config.ts` env var + `executablePath` in `modes.ts`. Different theme (weight, not correctness).

## Out of scope (explicitly declined in the spec)

- Loading-progress / spinner event semantics (settled-only is the decision).
- Collapsing `TAB_OPENED` / `TAB_CREATED` (an event-contract change; not needed).
- Agent perception layer / Actionable Tree (parked to Phase 5 — `research/2026-06-03-phase-5-agent-perception-layer-notes.md`).
