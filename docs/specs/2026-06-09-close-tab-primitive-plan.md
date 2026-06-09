# Close-Tab Primitive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `DELETE /v1/sessions/:sessionId/tabs/:pageId` so an agent can close a single tab without tearing down the warmed session, refusing to close the last tab.

**Architecture:** Mirrors the existing open-tab path (`open-tab.ts` → `manager.openTab` → `session.openTab`). Adds `session.closeTab` (guards + `page.close()` + `removePage`), `manager.closeTab` (returns remaining tabs), a `CloseTabHandler`, and the route. Also fixes a latent bug: per-page lifecycle listeners are only attached to tabs opened *after* launch, never to the initial tab — extracted into an `attachPageListeners` helper called for both.

**Tech Stack:** TypeScript, Playwright, Fastify, Zod, Vitest. Source spec: `docs/specs/2026-06-09-close-tab-primitive-design.md`.

---

## File structure

- **Create** `src/commands/close-tab.ts` — `CloseTabHandler` (mirrors `open-tab.ts`)
- **Modify** `src/sessions/session.ts` — add `CannotCloseLastTabError` + `closeTab(pageId)` method
- **Modify** `src/sessions/manager.ts` — add `attachPageListeners` helper, call it for initial + later pages; add `manager.closeTab`; export `CloseTabResult`; add `closeTab` to `ISessionManager`
- **Modify** `src/transport/routes.ts` — add `CANNOT_CLOSE_LAST_TAB: 409`, construct `CloseTabHandler`, register the DELETE route
- **Create** `tests/unit/sessions/session-close-tab.test.ts`
- **Create** `tests/unit/commands/close-tab.test.ts`
- **Create** `tests/integration/close-tab.integration.test.ts`
- **Modify** docs: `docs/api-reference.md`, `docs/agent-playbook.md`, `skills/using-feather-browser/SKILL.md`

---

## Task 1: `session.closeTab` + `CannotCloseLastTabError`

**Files:**
- Modify: `src/sessions/session.ts`
- Test: `tests/unit/sessions/session-close-tab.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/sessions/session-close-tab.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  FeatherSession,
  PageNotFoundError,
  CannotCloseLastTabError,
} from "../../../src/sessions/session";

function makeRunningSession(): FeatherSession {
  const session = new FeatherSession({
    workspaceId: "ws_test",
    profileKind: "persistent",
    browserMode: "chromium-new-headless",
    profilePath: "/tmp/test-profile",
    debugDir: "/tmp/test-debug",
    proxy: null,
  });
  const mockContext = {
    pages: () => [],
    newPage: async () => ({
      url: () => "about:blank",
      title: async () => "",
      close: async () => {},
    }),
    on: () => {},
  } as any;
  session.setContext(mockContext);
  return session;
}

describe("FeatherSession.closeTab", () => {
  it("throws PageNotFoundError for an unknown pageId", async () => {
    const session = makeRunningSession();
    await session.openTab();
    await expect(session.closeTab("page_missing")).rejects.toThrow(PageNotFoundError);
  });

  it("throws CannotCloseLastTabError when only one tab remains", async () => {
    const session = makeRunningSession();
    const { pageId } = await session.openTab();
    await expect(session.closeTab(pageId)).rejects.toThrow(CannotCloseLastTabError);
  });

  it("closes a tab and removes it from the page map when more than one is open", async () => {
    const session = makeRunningSession();
    const a = await session.openTab();
    const b = await session.openTab();
    await session.closeTab(a.pageId);
    expect(() => session.getPage(a.pageId)).toThrow(PageNotFoundError);
    expect(session.getPage(b.pageId).pageId).toBe(b.pageId);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/sessions/session-close-tab.test.ts`
Expected: FAIL — `CannotCloseLastTabError` is not exported / `closeTab` is not a function.

- [ ] **Step 3: Add the error class**

In `src/sessions/session.ts`, after the existing `PageNotFoundError` class (around line 32), add:

```typescript
export class CannotCloseLastTabError extends Error {
  readonly code = "CANNOT_CLOSE_LAST_TAB";
  constructor(sessionId: string) {
    super(`Session '${sessionId}' cannot close its last tab. Close the session instead.`);
    this.name = "CannotCloseLastTabError";
  }
}
```

- [ ] **Step 4: Add the `closeTab` method**

In `src/sessions/session.ts`, inside the `FeatherSession` class, immediately after the `openTab()` method (around line 142), add:

```typescript
  async closeTab(pageId: string): Promise<void> {
    const page = this._pages.get(pageId);
    if (!page) {
      throw new PageNotFoundError(pageId);
    }
    if (this._pages.size <= 1) {
      throw new CannotCloseLastTabError(this.sessionId);
    }
    await page.close();
    // Explicit removal so callers reading the page list immediately after
    // see the correct state; the page "close" event also calls removePage
    // (idempotent), and covers the initial tab once listeners are attached.
    this.removePage(pageId);
  }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/sessions/session-close-tab.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/sessions/session.ts tests/unit/sessions/session-close-tab.test.ts
git commit -m "feat(sessions): FeatherSession.closeTab + CannotCloseLastTabError"
```

---

## Task 2: Attach per-page listeners to the initial tab (latent-bug fix)

The `page.on("close")` (→ `removePage` + emit `tab.closed`) and `page.on("framenavigated")` (→ emit `tab.updated`) listeners are attached only inside `context.on("page", ...)`, which never fires for the page(s) present at launch. Extract a helper and call it for both initial and later pages so closing the initial tab reaps it correctly.

**Files:**
- Modify: `src/sessions/manager.ts`

- [ ] **Step 1: Add the `attachPageListeners` helper**

In `src/sessions/manager.ts`, add this private method to the `SessionManager` class (place it just before `async close(` near line 224):

```typescript
  private attachPageListeners(session: FeatherSession, pageId: string, page: import("playwright").Page): void {
    page.on("close", () => {
      session.removePage(pageId);
      void this.logger.log({
        ts: new Date().toISOString(),
        level: "info",
        event: EVENTS.TAB_CLOSED,
        sessionId: session.sessionId,
        data: { pageId },
      });
    });
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
        data: { pageId, url: redactUrl(page.url()), title, loadState },
      });
    });
  }
```

- [ ] **Step 2: Use the helper from `context.on("page")`**

In `src/sessions/manager.ts`, replace the existing `context.on("page", (page) => { ... });` block (currently lines ~132-180, which inlines the close + framenavigated handlers) with:

```typescript
    context.on("page", (page) => {
      const pageId = session.addPage(page);
      void this.logger.log({
        ts: new Date().toISOString(),
        level: "info",
        event: EVENTS.TAB_CREATED,
        sessionId: session.sessionId,
        data: { pageId },
      });
      this.attachPageListeners(session, pageId, page);
    });

    // Initial page(s) present at launch are added by session.setContext()
    // and never flow through context.on("page") — attach their lifecycle
    // listeners here so closing the initial tab reaps it too.
    for (const page of context.pages()) {
      this.attachPageListeners(session, session.addPage(page), page);
    }
```

(`session.addPage` is idempotent — for the initial pages it returns the id already assigned by `setContext`, so no duplicate page is registered and no `tab.created` is logged for them, matching prior behavior.)

- [ ] **Step 3: Run the full unit + existing tab integration test to verify no regression**

Run: `npx vitest run tests/unit/sessions/manager.test.ts`
Expected: PASS (no behavior change for opened tabs).

Run: `npm run test:integration -- tab-updated`
Expected: PASS — `tab.updated` still emitted for opened tabs (proves the extracted handler is wired correctly).

- [ ] **Step 4: Commit**

```bash
git add src/sessions/manager.ts
git commit -m "fix(sessions): attach page lifecycle listeners to the initial tab too"
```

---

## Task 3: `manager.closeTab` + interface + result type

**Files:**
- Modify: `src/sessions/manager.ts`

- [ ] **Step 1: Add `CloseTabResult` and extend `ISessionManager`**

In `src/sessions/manager.ts`, add the result interface near `LaunchSessionInput` (around line 40) and add the method to `ISessionManager` (around line 49-55):

```typescript
export interface CloseTabResult {
  sessionId: string;
  closedPageId: string;
  pages: PageInfo[];
}
```

Add to the `ISessionManager` interface body (after the `openTab` line):

```typescript
  closeTab(sessionId: string, pageId: string): Promise<CloseTabResult>;
```

- [ ] **Step 2: Implement `manager.closeTab`**

In `src/sessions/manager.ts`, add this method right after `async openTab(...)` (around line 222):

```typescript
  async closeTab(sessionId: string, pageId: string): Promise<CloseTabResult> {
    const session = this.get(sessionId);
    await session.closeTab(pageId);
    // tab.closed is emitted by the page "close" listener (single source of truth).
    const pages = await session.getPageInfoList();
    return { sessionId, closedPageId: pageId, pages };
  }
```

- [ ] **Step 3: Verify the project compiles**

Run: `npx tsc --noEmit`
Expected: PASS — no type errors (`ISessionManager` now satisfied by `SessionManager`).

- [ ] **Step 4: Commit**

```bash
git add src/sessions/manager.ts
git commit -m "feat(sessions): manager.closeTab returns remaining tabs"
```

---

## Task 4: `CloseTabHandler` command

**Files:**
- Create: `src/commands/close-tab.ts`
- Test: `tests/unit/commands/close-tab.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/commands/close-tab.test.ts`:

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";
import { CloseTabHandler } from "../../../src/commands/close-tab";

const mockResult = {
  sessionId: "ses_test_001",
  closedPageId: "page_abc123",
  pages: [{ pageId: "page_keep", url: "about:blank", title: "", loadState: "complete" }],
};
const mockManager = { closeTab: vi.fn().mockResolvedValue(mockResult) };
const ctx = { requestId: "req_test_001" };

describe("CloseTabHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockManager.closeTab.mockResolvedValue(mockResult);
  });

  it("calls manager.closeTab with the sessionId and pageId", async () => {
    await new CloseTabHandler(mockManager as any).execute(
      { sessionId: "ses_test_001", pageId: "page_abc123" },
      ctx
    );
    expect(mockManager.closeTab).toHaveBeenCalledWith("ses_test_001", "page_abc123");
  });

  it("returns the result from manager.closeTab", async () => {
    const result = await new CloseTabHandler(mockManager as any).execute(
      { sessionId: "ses_test_001", pageId: "page_abc123" },
      ctx
    );
    expect(result).toEqual(mockResult);
  });

  it("propagates errors from manager.closeTab", async () => {
    mockManager.closeTab.mockRejectedValue(new Error("page not found"));
    await expect(
      new CloseTabHandler(mockManager as any).execute(
        { sessionId: "ses_test_001", pageId: "page_missing" },
        ctx
      )
    ).rejects.toThrow("page not found");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/commands/close-tab.test.ts`
Expected: FAIL — cannot find module `close-tab`.

- [ ] **Step 3: Create the handler**

Create `src/commands/close-tab.ts`:

```typescript
import type { CommandHandler, CommandContext } from "./handler";
import type { CloseTabResult } from "../sessions/manager";

interface IManager {
  closeTab(sessionId: string, pageId: string): Promise<CloseTabResult>;
}

export interface CloseTabInput {
  sessionId: string;
  pageId: string;
}

export class CloseTabHandler implements CommandHandler<CloseTabInput, CloseTabResult> {
  constructor(private readonly manager: IManager) {}

  async execute(input: CloseTabInput, _ctx: CommandContext): Promise<CloseTabResult> {
    return this.manager.closeTab(input.sessionId, input.pageId);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/commands/close-tab.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/commands/close-tab.ts tests/unit/commands/close-tab.test.ts
git commit -m "feat(commands): CloseTabHandler"
```

---

## Task 5: Route + error status + integration tests

**Files:**
- Modify: `src/transport/routes.ts`
- Test: `tests/integration/close-tab.integration.test.ts`

- [ ] **Step 1: Write the failing integration test**

Create `tests/integration/close-tab.integration.test.ts`:

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
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-int-closetab-"));
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

describe("DELETE /v1/sessions/:sessionId/tabs/:pageId", () => {
  it("closes one tab, refuses the last, reaps the initial tab, and 404s unknown ids", async () => {
    const launch = await api("POST", "/v1/sessions", {
      workspaceId: "closetab-ws",
      profile: { kind: "persistent" },
      browserMode: "chromium-headless-shell",
    });
    expect(launch.status).toBe(200);
    const sessionId = launch.body.data.sessionId as string;
    const initialPageId = launch.body.data.pages[0].pageId as string;

    const tabA = await api("POST", `/v1/sessions/${sessionId}/tabs`, {});
    const tabB = await api("POST", `/v1/sessions/${sessionId}/tabs`, {});
    const a = tabA.body.data.pageId as string;
    const b = tabB.body.data.pageId as string;

    // 3 tabs open; close A.
    const closeA = await api("DELETE", `/v1/sessions/${sessionId}/tabs/${a}`);
    expect(closeA.status).toBe(200);
    expect(closeA.body.data.closedPageId).toBe(a);
    expect(closeA.body.data.pages.map((p: any) => p.pageId)).not.toContain(a);
    expect(closeA.body.data.pages.length).toBe(2);

    // Unknown pageId -> 404 PAGE_NOT_FOUND.
    const bogus = await api("DELETE", `/v1/sessions/${sessionId}/tabs/page_does_not_exist`);
    expect(bogus.status).toBe(404);
    expect(bogus.body.error.code).toBe("PAGE_NOT_FOUND");

    // Close the INITIAL tab (proves the listener fix reaps it). 2 -> 1.
    const closeInitial = await api("DELETE", `/v1/sessions/${sessionId}/tabs/${initialPageId}`);
    expect(closeInitial.status).toBe(200);
    expect(closeInitial.body.data.pages.map((p: any) => p.pageId)).toEqual([b]);

    // Closing the last tab is refused.
    const closeLast = await api("DELETE", `/v1/sessions/${sessionId}/tabs/${b}`);
    expect(closeLast.status).toBe(409);
    expect(closeLast.body.error.code).toBe("CANNOT_CLOSE_LAST_TAB");

    // Session is still alive with its one tab.
    const get = await api("GET", `/v1/sessions/${sessionId}`);
    expect(get.status).toBe(200);
    expect(get.body.data.state).toBe("running");

    await api("DELETE", `/v1/sessions/${sessionId}`, { force: false });
  }, 40000);

  it("closing a session tears down all tabs and releases the lock", async () => {
    const launch = await api("POST", "/v1/sessions", {
      workspaceId: "closetab-ws-2",
      profile: { kind: "persistent" },
      browserMode: "chromium-headless-shell",
    });
    const sessionId = launch.body.data.sessionId as string;
    await api("POST", `/v1/sessions/${sessionId}/tabs`, {});
    await api("POST", `/v1/sessions/${sessionId}/tabs`, {});

    const close = await api("DELETE", `/v1/sessions/${sessionId}`, { force: false });
    expect(close.status).toBe(200);

    // Registry entry gone -> GET 404.
    const get = await api("GET", `/v1/sessions/${sessionId}`);
    expect(get.status).toBe(404);

    // Lock released -> the same workspace can be launched again.
    const relaunch = await api("POST", "/v1/sessions", {
      workspaceId: "closetab-ws-2",
      profile: { kind: "persistent" },
      browserMode: "chromium-headless-shell",
    });
    expect(relaunch.status).toBe(200);
    await api("DELETE", `/v1/sessions/${relaunch.body.data.sessionId}`, { force: false });
  }, 40000);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:integration -- close-tab`
Expected: FAIL — the DELETE tab route returns 404 (route not registered yet), so `closeA.status` is not 200.

- [ ] **Step 3: Add the error status**

In `src/transport/routes.ts`, add to the `ERROR_STATUS` record (around line 130-139):

```typescript
  CANNOT_CLOSE_LAST_TAB: 409,
```

- [ ] **Step 4: Import and construct the handler**

In `src/transport/routes.ts`, add the import next to the open-tab import (line 14):

```typescript
import { CloseTabHandler } from "../commands/close-tab";
```

And construct it next to `openTabHandler` (line 172):

```typescript
  const closeTabHandler = new CloseTabHandler(manager);
```

- [ ] **Step 5: Register the route**

In `src/transport/routes.ts`, add this route immediately after the `POST .../tabs` route (after line 227):

```typescript
  app.delete("/v1/sessions/:sessionId/tabs/:pageId", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId, pageId } = request.params as { sessionId: string; pageId: string };
      const result = await closeTabHandler.execute({ sessionId, pageId }, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test:integration -- close-tab`
Expected: PASS (2 tests).

- [ ] **Step 7: Run the full unit suite for regressions**

Run: `npm test`
Expected: PASS (the one pre-existing `continuity.test.ts` flake may fail — ignore only that one).

- [ ] **Step 8: Commit**

```bash
git add src/transport/routes.ts tests/integration/close-tab.integration.test.ts
git commit -m "feat(api): DELETE /v1/sessions/:sessionId/tabs/:pageId (close one tab)"
```

---

## Task 6: Documentation

**Files:**
- Modify: `docs/api-reference.md`
- Modify: `docs/agent-playbook.md`
- Modify: `skills/using-feather-browser/SKILL.md`

- [ ] **Step 1: Document the route in `docs/api-reference.md`**

Find the section documenting `POST /v1/sessions/:sessionId/tabs` (open tab). Immediately after it, add:

```markdown
### DELETE /v1/sessions/:sessionId/tabs/:pageId

Close a single tab without ending the session. Returns the remaining tabs.

**Response data:** `{ "sessionId": "ses_…", "closedPageId": "page_…", "pages": [ /* remaining PageInfo[] */ ] }`

**Errors:**
- `404 PAGE_NOT_FOUND` — no tab with that pageId in the session
- `409 CANNOT_CLOSE_LAST_TAB` — refuses to close the only remaining tab; close the session instead
- `404 SESSION_NOT_FOUND` — no such session
```

- [ ] **Step 2: Document the workflow in `docs/agent-playbook.md`**

Find the tab-handling guidance (near the `POST /tabs` mention). Add a short paragraph:

```markdown
**Reuse a session, don't leak tabs.** When you finish with a tab, close it with
`DELETE /v1/sessions/:sessionId/tabs/:pageId` instead of opening endless new tabs or
tearing down the whole session. Keep at least one tab open — closing the last tab is
refused (`CANNOT_CLOSE_LAST_TAB`); use `DELETE /v1/sessions/:sessionId` to end the session.
```

- [ ] **Step 3: Mention close-tab in the skill**

In `skills/using-feather-browser/SKILL.md`, find where opening tabs is described and add a sentence:

```markdown
Close a tab you're done with via `DELETE /v1/sessions/:sessionId/tabs/:pageId` (the last
tab can't be closed — end the session instead). This keeps a warmed session lean across errands.
```

- [ ] **Step 4: Commit**

```bash
git add docs/api-reference.md docs/agent-playbook.md skills/using-feather-browser/SKILL.md
git commit -m "docs: document close-tab route + efficient tab reuse"
```

---

## Self-review notes

- **Spec coverage:** API route (Task 5) ✓; `closedPageId` + remaining `pages` response (Tasks 3,5) ✓; `PAGE_NOT_FOUND`/`CANNOT_CLOSE_LAST_TAB`/`SESSION_NOT_FOUND` (Tasks 1,3,5) ✓; last-tab refusal (Task 1) ✓; initial-tab listener fix (Task 2) ✓; session-close reaps all tabs — test only, no code change (Task 5, second `it`) ✓; docs incl. clearing the next.md gap (Task 6) ✓.
- **Type consistency:** `CloseTabResult { sessionId, closedPageId, pages }` defined in Task 3 and consumed unchanged in Tasks 4 (handler return type) and 5 (asserted fields). `session.closeTab(pageId): Promise<void>` (Task 1) called by `manager.closeTab` (Task 3). `attachPageListeners(session, pageId, page)` (Task 2) called in two places with that exact signature.
- **No placeholders:** every code step shows full code; every run step shows the command + expected outcome.
