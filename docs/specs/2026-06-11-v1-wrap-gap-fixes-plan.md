# v1-Wrap Gap Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the six v1-core gaps measured by the 2026-06-11 meta-analysis (`docs/v1_wrap/META-ANALYSIS.md` §4 ★ items): headed-CDP viewport, tab discovery, input-value reads, extract ergonomics, teardown ENOTEMPTY, and forensics observability.

**Architecture:** All changes ride the existing transport→handler→session layering: new thin command handlers + routes for tabs/health, schema-level fixes in `routes.ts`, spawn-arg fix in `modes.ts`, cleanup hardening in `manager.ts`. No new top-level modules; no high-privilege surfaces (a general `/evaluate` stays deferred to v2 Gate A per ADR-0010).

**Tech Stack:** TypeScript 5.4, Node 20, Fastify 5.8, Playwright 1.60, Zod 3.x, Vitest.

**Change classification (AGENTS.md):** Tasks 1, 5 = core browser stability (accepted params silently dropped; broken graceful teardown). Tasks 2, 3, 4, 6 = UI/API readiness (stable API contracts for agents). Nothing here is "future agent layer".

**Scope guard:** Do NOT add a JS-eval endpoint, batch endpoint, capability gates, or anything from the v2 security spine. Those are planned-and-deferred (META-ANALYSIS §4 ◇ items).

**Conventions:** Run gates with `npm test` (unit), `npm run test:integration`, `npx tsc --noEmit`. Commit per task to `dev`. Integration tests that need same-origin pages must use real local-HTTP fixtures (`data:` URLs are opaque-origin — pinned project trap).

---

### Task 1: Honor `viewport` in `chromium-headed-cdp` mode (+ stop silently dropping `proxy`)

The launch API accepts `viewport` but `spawnAndConnect()` never applies it — H3 got Instagram's tablet wall from a default-sized window. Same bug family: `proxy` is also silently dropped on this path (discovered during planning; we log it honestly rather than implement CDP proxy auth now).

**Files:**
- Modify: `src/browser/modes.ts:67-80`
- Modify: `src/sessions/manager.ts:118-129`
- Modify: `src/logs/events.ts` (new event)
- Test: `tests/unit/browser/spawn-args.test.ts` (create)

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/browser/spawn-args.test.ts
import { describe, it, expect } from "vitest";
import { buildSpawnArgs } from "../../../src/browser/modes";

describe("buildSpawnArgs", () => {
  it("includes --window-size from the requested viewport", () => {
    const args = buildSpawnArgs({ profilePath: "/tmp/p", viewport: { width: 1024, height: 700 } });
    expect(args).toContain("--window-size=1024,700");
  });

  it("defaults --window-size to 1280,800 (matching buildLaunchOptions) when viewport omitted", () => {
    const args = buildSpawnArgs({ profilePath: "/tmp/p" });
    expect(args).toContain("--window-size=1280,800");
  });

  it("keeps the existing base args", () => {
    const args = buildSpawnArgs({ profilePath: "/tmp/p" });
    expect(args).toContain("--remote-debugging-port=0");
    expect(args).toContain("--user-data-dir=/tmp/p");
    expect(args).toContain("--no-first-run");
    expect(args).toContain("--no-default-browser-check");
    expect(args).toContain("--disable-blink-features=AutomationControlled");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/unit/browser/spawn-args.test.ts`
Expected: FAIL — `buildSpawnArgs` is not exported.

- [ ] **Step 3: Implement in `modes.ts`**

Extract arg-building from `spawnAndConnect` into an exported function and thread `viewport` through:

```typescript
export function buildSpawnArgs(opts: {
  profilePath: string;
  viewport?: { width: number; height: number };
}): string[] {
  const vp = opts.viewport ?? { width: 1280, height: 800 };
  return [
    "--remote-debugging-port=0",
    `--user-data-dir=${opts.profilePath}`,
    `--window-size=${vp.width},${vp.height}`,
    "--no-first-run",
    "--no-default-browser-check",
    ...resolveSpawnExtraArgs(),
    "--disable-blink-features=AutomationControlled",
  ];
}

export async function spawnAndConnect(opts: {
  profilePath: string;
  executablePath: string;
  viewport?: { width: number; height: number };
}): Promise<{ context: BrowserContext; childProcess: ChildProcess }> {
  const args = buildSpawnArgs(opts);
  // ... rest of the function unchanged (spawn, wsEndpoint promise, connectOverCDP)
```

Note: in headed mode this sets the real **window** size (viewport ≈ window minus chrome). That is deliberate — Playwright viewport *emulation* on a CDP-attached context would taint the faithful headed fingerprint. Document in Task 7.

- [ ] **Step 4: Thread viewport through the manager and warn on dropped proxy**

In `src/sessions/manager.ts` (launch, the headed-cdp branch):

```typescript
    if (browserMode === "chromium-headed-cdp") {
      if (proxy) {
        await this.logger.log({
          ts: new Date().toISOString(),
          level: "warn",
          event: EVENTS.SESSION_OPTION_IGNORED,
          sessionId: session.sessionId,
          data: { option: "proxy", reason: "proxy is not applied in chromium-headed-cdp mode" },
        });
      }
      const { context: cdpContext, childProcess } = await spawnAndConnect({
        profilePath,
        executablePath: resolveChromiumExecutable(chromium.executablePath()),
        viewport: input.viewport,
      });
```

In `src/logs/events.ts` add to `EVENTS`:

```typescript
  SESSION_OPTION_IGNORED: "session.option.ignored",
```

- [ ] **Step 5: Run unit tests + typecheck**

Run: `npx vitest run tests/unit/browser/spawn-args.test.ts && npx tsc --noEmit`
Expected: PASS, no type errors.

- [ ] **Step 6: Extend the CDP integration test to pin the real window size**

Read `tests/integration/attach-cdp.integration.test.ts` first and reuse its existing session-launch harness. Add one test: launch a `chromium-headed-cdp` disposable session with `viewport: { width: 1024, height: 700 }`, get the page (`manager.get(sessionId).getPage().page`), and assert:

```typescript
const outer = await page.evaluate(() => ({ w: window.outerWidth, h: window.outerHeight }));
expect(Math.abs(outer.w - 1024)).toBeLessThanOrEqual(50);
expect(Math.abs(outer.h - 700)).toBeLessThanOrEqual(120); // window chrome tolerance
```

(Tolerances absorb WM decoration; the bug being pinned is "viewport ignored entirely", a ~600px error.)

- [ ] **Step 7: Run the integration test**

Run: `npx vitest run tests/integration/attach-cdp.integration.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/browser/modes.ts src/sessions/manager.ts src/logs/events.ts tests/unit/browser/spawn-args.test.ts tests/integration/attach-cdp.integration.test.ts
git commit -m "fix(headed-cdp): honor viewport via --window-size; warn on ignored proxy"
```

---

### Task 2: `GET /v1/sessions/:sessionId/tabs` — tab enumeration

`POST /tabs` and `DELETE /tabs/:pageId` exist; the list is missing (H2 got a 404). The session already tracks every page (`context.on("page")` → `addPage`) and `getPageInfoList()` exists.

**Files:**
- Create: `src/commands/list-tabs.ts`
- Modify: `src/sessions/manager.ts` (ISessionManager + SessionManager: `listTabs`)
- Modify: `src/transport/routes.ts` (route)
- Test: `tests/unit/commands/list-tabs.test.ts` (create)

- [ ] **Step 1: Write the failing handler test**

```typescript
// tests/unit/commands/list-tabs.test.ts
import { vi, describe, it, expect } from "vitest";
import { ListTabsHandler } from "../../../src/commands/list-tabs";

describe("ListTabsHandler", () => {
  it("returns the session's page list", async () => {
    const pages = [
      { pageId: "page_001", url: "https://a.example", title: "A", loadState: "load" },
      { pageId: "page_002", url: "https://b.example", title: "B", loadState: "load" },
    ];
    const manager = { listTabs: vi.fn().mockResolvedValue({ sessionId: "ses_x", pages }) };
    const handler = new ListTabsHandler(manager as any);
    const out = await handler.execute({ sessionId: "ses_x" }, { requestId: "req_1" });
    expect(manager.listTabs).toHaveBeenCalledWith("ses_x");
    expect(out.pages).toHaveLength(2);
    expect(out.pages[1].pageId).toBe("page_002");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/unit/commands/list-tabs.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement handler + manager method**

```typescript
// src/commands/list-tabs.ts
import type { CommandHandler, CommandContext } from "./handler";
import type { PageInfo } from "../sessions/types";

interface IManager {
  listTabs(sessionId: string): Promise<{ sessionId: string; pages: PageInfo[] }>;
}

export interface ListTabsInput { sessionId: string; }
export interface ListTabsOutput { sessionId: string; pages: PageInfo[]; }

export class ListTabsHandler implements CommandHandler<ListTabsInput, ListTabsOutput> {
  constructor(private readonly manager: IManager) {}
  async execute(input: ListTabsInput, _ctx: CommandContext): Promise<ListTabsOutput> {
    return this.manager.listTabs(input.sessionId);
  }
}
```

In `src/sessions/manager.ts` — add to the `ISessionManager` interface (next to `openTab`/`closeTab`):

```typescript
  listTabs(sessionId: string): Promise<{ sessionId: string; pages: PageInfo[] }>;
```

and to `SessionManager` (next to `closeTab`):

```typescript
  async listTabs(sessionId: string): Promise<{ sessionId: string; pages: PageInfo[] }> {
    const session = this.get(sessionId);
    return { sessionId, pages: await session.getPageInfoList() };
  }
```

- [ ] **Step 4: Register the route**

In `src/transport/routes.ts`, instantiate next to the other handlers and register **after** the existing `POST /v1/sessions/:sessionId/tabs` route:

```typescript
  const listTabs = new ListTabsHandler(manager);
```

```typescript
  app.get("/v1/sessions/:sessionId/tabs", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sessionId } = request.params as { sessionId: string };
      const data = await listTabs.execute({ sessionId }, { requestId: getRequestId(request) });
      await reply.send(ok(getRequestId(request), data));
    } catch (err) { await handleRouteError(err, request, reply); }
  });
```

(Import `ListTabsHandler` at the top with the other command imports.)

- [ ] **Step 5: Run tests + typecheck**

Run: `npx vitest run tests/unit/commands/list-tabs.test.ts && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/commands/list-tabs.ts src/sessions/manager.ts src/transport/routes.ts tests/unit/commands/list-tabs.test.ts
git commit -m "feat(tabs): GET /v1/sessions/:id/tabs tab enumeration"
```

---

### Task 3: Best-effort `newPageId` on click (popup/new-tab signal)

H2's click on a `target=_blank` SERP link returned a bare `clicked:true` — indistinguishable from H3's no-op clicks. The manager's `context.on("page")` listener (registered at launch, so it fires first) has already `addPage()`d any popup by the time a listener registered at click time observes it. Signal is **best-effort**; `GET /tabs` (Task 2) is ground truth — same signal-vs-ground-truth pattern as `/dismiss`'s `dismissed`/`overlaysRemaining`.

**Files:**
- Modify: `src/sessions/types.ts:125` (ClickOutput)
- Modify: `src/sessions/session.ts` (add `getPageIdFor`)
- Modify: `src/commands/click.ts`
- Test: `tests/unit/commands/click.test.ts` (extend)
- Test: `tests/integration/tabs-discovery.integration.test.ts` (create)

- [ ] **Step 1: Extend ClickOutput**

```typescript
export interface ClickOutput { pageId: string; clicked: true; navigated?: true; newPageId?: string; }
```

- [ ] **Step 2: Add `getPageIdFor` to `FeatherSession`** (next to `addPage`, `src/sessions/session.ts`)

```typescript
  getPageIdFor(page: Page): string | undefined {
    for (const [pageId, p] of this._pages.entries()) {
      if (p === page) return pageId;
    }
    return undefined;
  }
```

- [ ] **Step 3: Write the failing unit test**

Read `tests/unit/commands/click.test.ts` first and follow its existing mock structure (it mocks `resolveActionable` / page/session). Add: the mock page needs `context: () => mockContext` where `mockContext = { on: vi.fn(), off: vi.fn() }`, and the mock session needs `getPageIdFor: vi.fn()`. New test:

```typescript
  it("reports newPageId when the click spawns a new page", async () => {
    const newPage = { fake: "popup" };
    mockContext.on.mockImplementation((event: string, cb: (p: unknown) => void) => {
      if (event === "page") capturedPageCb = cb;
    });
    // make the click action fire the captured listener mid-click
    actClickMock.mockImplementation(async () => { capturedPageCb?.(newPage); });
    mockSession.getPageIdFor.mockReturnValue("page_002");
    const handler = new ClickHandler(mockManager as any);
    const out = await handler.execute({ sessionId: "ses_test_001", target: { by: "css", selector: "a" } }, ctx);
    expect(out.clicked).toBe(true);
    expect(out.newPageId).toBe("page_002");
    expect(mockContext.off).toHaveBeenCalled(); // listener detached
  });

  it("omits newPageId when no new page appeared", async () => {
    const handler = new ClickHandler(mockManager as any);
    const out = await handler.execute({ sessionId: "ses_test_001", target: { by: "css", selector: "a" } }, ctx);
    expect(out.newPageId).toBeUndefined();
  });
```

- [ ] **Step 4: Run to verify it fails**

Run: `npx vitest run tests/unit/commands/click.test.ts`
Expected: new tests FAIL (`newPageId` undefined / `context` not a function).

- [ ] **Step 5: Implement in `click.ts`**

```typescript
export class ClickHandler implements CommandHandler<ClickInput, ClickOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: ClickInput, _ctx: CommandContext): Promise<ClickOutput> {
    const { sessionId, pageId, target, timeoutMs } = input;
    const session = this.manager.get(sessionId);
    const { pageId: resolvedPageId, page } = session.getPage(pageId);
    const refLookup = (r: string) => session.getObserveCache(resolvedPageId)?.refs.get(r);
    const { act, probe } = resolveActionable(page, target, refLookup);
    const context = page.context();
    let popup: import("playwright").Page | undefined;
    const onPage = (p: import("playwright").Page) => { popup = p; };
    context.on("page", onPage);
    try {
      await withActionErrors(probe, "click", () => act.click({ timeout: timeoutMs ?? 15000 }));
      const newPageId = popup ? session.getPageIdFor(popup) : undefined;
      return { pageId: resolvedPageId, clicked: true, ...(newPageId !== undefined ? { newPageId } : {}) };
    } catch (err) {
      if (isNavigationTeardown(err)) return { pageId: resolvedPageId, clicked: true, navigated: true };
      throw err;
    } finally {
      context.off("page", onPage);
    }
  }
}
```

Extend the inline `IManager` interface in `click.ts`: the session shape gains
`getPageIdFor(page: import("playwright").Page): string | undefined;`.

- [ ] **Step 6: Run unit tests**

Run: `npx vitest run tests/unit/commands/click.test.ts && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Write the integration test (real local-HTTP fixture — NOT a data: URL)**

```typescript
// tests/integration/tabs-discovery.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as http from "http";
// Reuse the session-manager harness used by close-tab.integration.test.ts —
// read that file first and copy its manager/paths setup verbatim.

let server: http.Server;
let baseUrl: string;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    if (req.url === "/") {
      res.end(`<!doctype html><title>Opener</title><a id="pop" href="/child" target="_blank">open</a>`);
    } else {
      res.end(`<!doctype html><title>Child</title><body>child</body>`);
    }
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  const addr = server.address() as { port: number };
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

afterAll(async () => { await new Promise<void>((r) => server.close(() => r())); });

describe("tab discovery", () => {
  it("click on target=_blank reports newPageId and GET-tabs sees the new tab", async () => {
    // launch disposable chromium-new-headless session via the manager harness
    // navigate to baseUrl
    const out = await clickHandler.execute(
      { sessionId, target: { by: "css", selector: "#pop" } },
      { requestId: "req_int_tabs" }
    );
    const tabs = await manager.listTabs(sessionId);
    expect(tabs.pages.length).toBe(2);                      // ground truth
    expect(out.newPageId).toBeDefined();                    // best-effort signal
    expect(tabs.pages.map((p) => p.pageId)).toContain(out.newPageId);
  });
});
```

**Decision point pinned here:** if this test shows the `page` event reliably missing the click window (signal flaky), do NOT add a blanket grace-wait to every click (latency tax on the hot path). Instead keep `newPageId` strictly best-effort, relax the `newPageId` assertions to the documented contract, and let `GET /tabs` carry discovery. Record whichever way it lands in the commit message.

- [ ] **Step 8: Run integration test**

Run: `npx vitest run tests/integration/tabs-discovery.integration.test.ts`
Expected: PASS (or the pinned decision recorded).

- [ ] **Step 9: Commit**

```bash
git add src/sessions/types.ts src/sessions/session.ts src/commands/click.ts tests/unit/commands/click.test.ts tests/integration/tabs-discovery.integration.test.ts
git commit -m "feat(click): best-effort newPageId popup signal; tabs list is ground truth"
```

---

### Task 4: Extract ergonomics — flat-shape acceptance, `type` defaulting, and `value` reads

3 of the run's 7 API failures were extract validation (missing `recipe` wrapper ×2, missing per-field `type` ×1). And H1 burned two screenshot round-trips because nothing can read `<input value>`. One task because they share the schema/handler/test files.

**Files:**
- Modify: `src/sessions/types.ts:41-50` (ExtractField)
- Modify: `src/transport/routes.ts:68-74` (ExtractSchema — export it)
- Modify: `src/commands/extract.ts`
- Test: `tests/unit/transport/extract-schema.test.ts` (create)
- Test: `tests/unit/commands/extract.test.ts` (extend)

- [ ] **Step 1: Write the failing schema tests**

```typescript
// tests/unit/transport/extract-schema.test.ts
import { describe, it, expect } from "vitest";
import { ExtractSchema } from "../../../src/transport/routes";

describe("ExtractSchema ergonomics", () => {
  it("accepts the canonical shape unchanged", () => {
    const p = ExtractSchema.parse({ recipe: { fields: { h: { selector: "h1", type: "text" } } } });
    expect(p.recipe.fields.h.type).toBe("text");
  });

  it("accepts the flat shape (fields at top level) by wrapping it into recipe", () => {
    const p = ExtractSchema.parse({ fields: { h: { selector: "h1" } }, limits: { textChars: 50 } });
    expect(p.recipe.fields.h.selector).toBe("h1");
    expect(p.recipe.limits?.textChars).toBe(50);
  });

  it("defaults type to 'text' when omitted", () => {
    const p = ExtractSchema.parse({ recipe: { fields: { h: { selector: "h1" } } } });
    expect(p.recipe.fields.h.type).toBe("text");
  });

  it("infers type 'attribute' when attribute is present and type omitted", () => {
    const p = ExtractSchema.parse({ recipe: { fields: { link: { selector: "a", attribute: "href" } } } });
    expect(p.recipe.fields.link.type).toBe("attribute");
  });

  it("accepts type 'value'", () => {
    const p = ExtractSchema.parse({ recipe: { fields: { title: { selector: "#t", type: "value" } } } });
    expect(p.recipe.fields.title.type).toBe("value");
  });

  it("rejects explicit type 'attribute' without an attribute name", () => {
    expect(() =>
      ExtractSchema.parse({ recipe: { fields: { x: { selector: "a", type: "attribute" } } } })
    ).toThrow(/attribute/);
  });

  it("keeps pageId at the top level in the flat shape", () => {
    const p = ExtractSchema.parse({ pageId: "page_002", fields: { h: { selector: "h1" } } });
    expect(p.pageId).toBe("page_002");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/unit/transport/extract-schema.test.ts`
Expected: FAIL — `ExtractSchema` not exported.

- [ ] **Step 3: Implement the schema in `routes.ts`** (replace the current `ExtractSchema`, exported now)

```typescript
const ExtractFieldSchema = z
  .object({
    selector: z.string(),
    type: z.enum(["text", "attribute", "value"]).optional(),
    attribute: z.string().optional(),
  })
  .transform((f) => ({ ...f, type: f.type ?? (f.attribute !== undefined ? ("attribute" as const) : ("text" as const)) }))
  .superRefine((f, ctx) => {
    if (f.type === "attribute" && f.attribute === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "type 'attribute' requires an 'attribute' name, e.g. { selector: \"a\", type: \"attribute\", attribute: \"href\" }",
      });
    }
  });

const ExtractRecipeSchema = z.object({
  fields: z.record(ExtractFieldSchema),
  limits: z.object({ items: z.number().int().positive().optional(), textChars: z.number().int().positive().optional() }).optional(),
});

export const ExtractSchema = z.preprocess(
  (body) => {
    if (body !== null && typeof body === "object" && !("recipe" in body) && "fields" in body) {
      const { pageId, ...rest } = body as Record<string, unknown>;
      return { ...(pageId !== undefined ? { pageId } : {}), recipe: rest };
    }
    return body;
  },
  z.object({ pageId: z.string().optional(), recipe: ExtractRecipeSchema })
);
```

- [ ] **Step 4: Extend `ExtractField` in `types.ts` and the handler**

```typescript
export interface ExtractField {
  selector: string;
  type: "text" | "attribute" | "value";
  attribute?: string;
}
```

In `src/commands/extract.ts`, replace the text/attribute branch with three:

```typescript
        if (field.type === "text") {
          const raw = await locator.textContent();
          if (raw === null) {
            result[fieldName] = null;
          } else {
            const trimmed = raw.trim();
            result[fieldName] = textLimit !== undefined ? trimmed.slice(0, textLimit) : trimmed;
          }
        } else if (field.type === "value") {
          result[fieldName] = await locator.inputValue();
        } else {
          const value = await locator.getAttribute(field.attribute!);
          result[fieldName] = value ?? null;
        }
```

(`inputValue()` works for input/textarea/select; anything else throws and the existing per-field `catch` maps it to `null` — same contract as a missing selector.)

- [ ] **Step 5: Extend the handler unit test** (`tests/unit/commands/extract.test.ts`)

Add `inputValue: vi.fn()` to `mockLocator` (and to the `beforeEach` reset block), then:

```typescript
  it("extracts an input value using inputValue for type 'value'", async () => {
    mockLocator.inputValue.mockResolvedValue("Rosh Hashana");
    const handler = new ExtractHandler(mockManager as any);
    const recipe: ExtractRecipe = { fields: { title: { selector: "#event-title", type: "value" } } };
    const result = await handler.execute({ sessionId: "ses_test_001", recipe }, ctx);
    expect(mockLocator.inputValue).toHaveBeenCalled();
    expect(result.title).toBe("Rosh Hashana");
  });

  it("returns null when inputValue throws (non-input element)", async () => {
    mockLocator.inputValue.mockRejectedValue(new Error("Not an input"));
    const handler = new ExtractHandler(mockManager as any);
    const recipe: ExtractRecipe = { fields: { x: { selector: "div", type: "value" } } };
    const result = await handler.execute({ sessionId: "ses_test_001", recipe }, ctx);
    expect(result.x).toBeNull();
  });
```

- [ ] **Step 6: Run all extract tests + typecheck**

Run: `npx vitest run tests/unit/transport/extract-schema.test.ts tests/unit/commands/extract.test.ts && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/transport/routes.ts src/sessions/types.ts src/commands/extract.ts tests/unit/transport/extract-schema.test.ts tests/unit/commands/extract.test.ts
git commit -m "feat(extract): flat-shape + type defaulting ergonomics; read input values via type 'value'"
```

---

### Task 5: Disposable teardown — retry the rm, never leak `ENOTEMPTY`

`DELETE {force:false}` failed 2/7 disposable teardowns: `fs.promises.rm` races Chromium's dying writes and the raw fs code surfaces as the API error. Node's `rm` has built-in retries for exactly this (`maxRetries`/`retryDelay` cover `ENOTEMPTY`/`EBUSY`); and cleanup failure should not fail an otherwise-completed close.

**Files:**
- Modify: `src/sessions/manager.ts:331-333`
- Modify: `src/logs/events.ts` (new event)
- Test: `tests/unit/sessions/close-cleanup.test.ts` (create)

- [ ] **Step 1: Write the failing test**

The manager needs a real-ish session in its registry; mock Playwright + modes at module level and use tmp dirs. Read an existing test under `tests/unit/sessions/` first and reuse its manager-construction pattern if one exists; otherwise:

```typescript
// tests/unit/sessions/close-cleanup.test.ts
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

vi.mock("playwright", () => ({
  chromium: {
    launchPersistentContext: vi.fn(async () => ({
      pages: () => [],
      on: vi.fn(),
      close: vi.fn(async () => {}),
    })),
    executablePath: () => "/usr/bin/true",
  },
}));

import { SessionManager } from "../../../src/sessions/manager";
import { FeatherPaths } from "../../../src/fs-layout";
import { ProfileLock } from "../../../src/profiles/lock";
import { WorkspaceMetadata } from "../../../src/profiles/workspace";

let tmp: string;
let manager: SessionManager;

beforeEach(async () => {
  tmp = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-close-test-"));
  const paths = new FeatherPaths(tmp);   // adapt to FeatherPaths' real constructor signature
  manager = new SessionManager(paths, new ProfileLock(paths), new WorkspaceMetadata(paths));
});

afterEach(async () => {
  vi.restoreAllMocks();
  await fs.promises.rm(tmp, { recursive: true, force: true });
});

describe("disposable close cleanup", () => {
  it("passes retry options to rm and does not throw when rm still fails", async () => {
    const session = await manager.launch({ profile: { kind: "disposable" } });
    const rmSpy = vi.spyOn(fs.promises, "rm").mockRejectedValueOnce(
      Object.assign(new Error("ENOTEMPTY: directory not empty"), { code: "ENOTEMPTY" })
    );
    await expect(manager.close(session.sessionId)).resolves.toBeUndefined();
    expect(rmSpy).toHaveBeenCalledWith(
      expect.stringContaining(session.sessionId),
      expect.objectContaining({ recursive: true, force: true, maxRetries: expect.any(Number) })
    );
  });
});
```

(If `FeatherPaths`/`ProfileLock`/`WorkspaceMetadata` constructors differ, adapt the setup — check `src/fs-layout.ts` and `src/profiles/` — but keep the two assertions exactly: close resolves despite rm failure; rm called with retry options.)

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/unit/sessions/close-cleanup.test.ts`
Expected: FAIL — `close` rejects with ENOTEMPTY (and rm called without `maxRetries`).

- [ ] **Step 3: Implement in `manager.ts`** (replace the `rm` line in `close()`)

```typescript
      } else {
        try {
          await fs.promises.rm(sessionDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
        } catch (err) {
          await this.logger.log({
            ts: new Date().toISOString(),
            level: "warn",
            event: EVENTS.PROFILE_CLEANUP_FAILED,
            sessionId: session.sessionId,
            data: { error: (err as any)?.message ?? "unknown", dir: sessionDir },
          });
        }
      }
```

In `src/logs/events.ts` add:

```typescript
  PROFILE_CLEANUP_FAILED: "profile.cleanup.failed",
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/unit/sessions/close-cleanup.test.ts tests/integration/disposable-cleanup.integration.test.ts && npx tsc --noEmit`
Expected: PASS (the existing disposable-cleanup integration test must stay green — it pins the happy path).

- [ ] **Step 5: Commit**

```bash
git add src/sessions/manager.ts src/logs/events.ts tests/unit/sessions/close-cleanup.test.ts
git commit -m "fix(close): retry disposable profile rm; log-not-throw on cleanup failure"
```

---

### Task 6: Observability — per-action request log + `GET /v1/sessions/:sessionId/health`

The H3 forensics took an investigation because 7.5 min of observe/click/type left zero per-action trace in the session JSONL, and there is no way to ask "is the browser alive?". **Security constraint: never log request bodies** (type payloads contain user-typed text; the existing redaction discipline stays intact — we log action name + status only).

**Files:**
- Create: `src/commands/health.ts`
- Modify: `src/sessions/session.ts` (add `getPageCount`)
- Modify: `src/transport/routes.ts` (onResponse hook + health route)
- Modify: `src/logs/events.ts` (two new events)
- Test: `tests/unit/commands/health.test.ts` (create)
- Test: `tests/integration/transport.integration.test.ts` (extend, action-log assertion)

- [ ] **Step 1: Write the failing health-handler test**

```typescript
// tests/unit/commands/health.test.ts
import { vi, describe, it, expect } from "vitest";
import { HealthHandler } from "../../../src/commands/health";

function makeSession(state: string, titleImpl: () => Promise<string>) {
  return {
    getState: vi.fn().mockReturnValue(state),
    getPageCount: vi.fn().mockReturnValue(2),
    getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: { title: vi.fn(titleImpl) } }),
  };
}

describe("HealthHandler", () => {
  it("reports alive when the page responds", async () => {
    const session = makeSession("running", async () => "OK");
    const handler = new HealthHandler({ get: () => session } as any);
    const out = await handler.execute({ sessionId: "ses_x" }, { requestId: "r" });
    expect(out).toEqual({ sessionId: "ses_x", state: "running", pages: 2, alive: true });
  });

  it("reports alive=false when the page call hangs past the deadline", async () => {
    const session = makeSession("running", () => new Promise<string>(() => {}));
    const handler = new HealthHandler({ get: () => session } as any, 100); // 100ms deadline for the test
    const out = await handler.execute({ sessionId: "ses_x" }, { requestId: "r" });
    expect(out.alive).toBe(false);
  });

  it("reports alive=false without probing when state is not running", async () => {
    const session = makeSession("closing", async () => "OK");
    const handler = new HealthHandler({ get: () => session } as any);
    const out = await handler.execute({ sessionId: "ses_x" }, { requestId: "r" });
    expect(out.alive).toBe(false);
    expect(session.getPage).not.toHaveBeenCalled();
  });

  it("reports alive=false when the page call rejects", async () => {
    const session = makeSession("running", async () => { throw new Error("Target closed"); });
    const handler = new HealthHandler({ get: () => session } as any);
    const out = await handler.execute({ sessionId: "ses_x" }, { requestId: "r" });
    expect(out.alive).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/unit/commands/health.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the handler + session method**

```typescript
// src/commands/health.ts
import type { CommandHandler, CommandContext } from "./handler";

interface IManager {
  get(sessionId: string): {
    getState(): string;
    getPageCount(): number;
    getPage(pageId?: string): { pageId: string; page: { title(): Promise<string> } };
  };
}

export interface HealthInput { sessionId: string; }
export interface HealthOutput { sessionId: string; state: string; pages: number; alive: boolean; }

const DEFAULT_PROBE_TIMEOUT_MS = 2000;

export class HealthHandler implements CommandHandler<HealthInput, HealthOutput> {
  constructor(private readonly manager: IManager, private readonly probeTimeoutMs = DEFAULT_PROBE_TIMEOUT_MS) {}

  async execute(input: HealthInput, _ctx: CommandContext): Promise<HealthOutput> {
    const session = this.manager.get(input.sessionId);
    const state = session.getState();
    const pages = session.getPageCount();
    if (state !== "running") return { sessionId: input.sessionId, state, pages, alive: false };

    let timer: NodeJS.Timeout | undefined;
    const deadline = new Promise<false>((resolve) => { timer = setTimeout(() => resolve(false), this.probeTimeoutMs); });
    const probe = (async () => { await session.getPage().page.title(); return true as const; })().catch(() => false as const);
    const alive = await Promise.race([probe, deadline]);
    if (timer) clearTimeout(timer);
    return { sessionId: input.sessionId, state, pages, alive };
  }
}
```

In `src/sessions/session.ts` (next to `getPageIdFor`):

```typescript
  getPageCount(): number {
    return this._pages.size;
  }
```

- [ ] **Step 4: Register the health route** (in `routes.ts`, near the other GETs)

```typescript
  const health = new HealthHandler(manager);
```

```typescript
  app.get("/v1/sessions/:sessionId/health", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sessionId } = request.params as { sessionId: string };
      const data = await health.execute({ sessionId }, { requestId: getRequestId(request) });
      await reply.send(ok(getRequestId(request), data));
    } catch (err) { await handleRouteError(err, request, reply); }
  });
```

- [ ] **Step 5: Add the per-action log hook** (in `registerRoutes`, before the route registrations)

```typescript
  const actionLogger = new FeatherLogger(paths);
  app.addHook("onResponse", async (request, reply) => {
    if (request.method !== "POST") return;
    const m = request.url.match(/^\/v1\/sessions\/([^/]+)\/([a-z-]+)$/);
    if (!m) return;
    const [, sessionId, action] = m;
    if (action === "resume") return; // unauthenticated human route — keep its surface untouched
    await actionLogger.log({
      ts: new Date().toISOString(),
      level: "info",
      event: EVENTS.ACTION_COMPLETED,
      sessionId,
      requestId: getRequestId(request),
      data: { action, statusCode: reply.statusCode },
    });
  });
```

In `src/logs/events.ts` add:

```typescript
  ACTION_COMPLETED: "action.completed",
```

Imports needed in `routes.ts`: `FeatherLogger` from `../logs/logger`, `EVENTS` from `../logs/events`, `HealthHandler` from `../commands/health`. **No request bodies, no URLs from page-land, no target payloads in this log line** — action name + status code only.

- [ ] **Step 6: Extend the transport integration test**

Read `tests/integration/transport.integration.test.ts` and reuse its running-server harness. Add one test: create a session, call `POST .../snapshot` once, then read the session JSONL (`paths.sessionLog(sessionId)` — same accessor the harness's paths object exposes) and assert it contains a line with `"event":"action.completed"` and `"action":"snapshot"`; then `GET .../health` and assert `data.alive === true`, `data.state === "running"`.

- [ ] **Step 7: Run tests**

Run: `npx vitest run tests/unit/commands/health.test.ts tests/integration/transport.integration.test.ts && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/commands/health.ts src/sessions/session.ts src/transport/routes.ts src/logs/events.ts tests/unit/commands/health.test.ts tests/integration/transport.integration.test.ts
git commit -m "feat(observability): per-action session log lines + GET /health CDP-alive probe"
```

---

### Task 7: Documentation truth pass

Every surface change lands in the agent-facing docs, plus two stale-doc fixes the run exposed.

**Files:**
- Modify: `docs/api-reference.md`
- Modify: `docs/agent-playbook.md`
- Modify: `.claude/skills/feather-data-extraction/SKILL.md` (extract `value` type + defaulting; locate via `ls .claude/skills/` if pathing differs)
- Modify: `.claude/skills/using-feather-browser/SKILL.md` (tabs/newPageId/health)

- [ ] **Step 1: api-reference.md** — add `GET /v1/sessions/:sessionId/tabs`, `GET /v1/sessions/:sessionId/health`, click's `newPageId` (best-effort; tabs = ground truth), extract `type: "value"` + flat-shape acceptance + `type` defaulting, the `action.completed` log event, and headed-CDP `viewport` semantics (sets the OS window size; viewport ≈ window minus chrome; proxy currently ignored in this mode — logged as `session.option.ignored`). **Also fix the known stale item:** the `browserMode` enum in api-reference omits `chromium-headed-cdp` (real enum: `src/transport/routes.ts:33`).

- [ ] **Step 2: agent-playbook.md** — same additions, plus: `/screenshot` returns an artifact **descriptor** (`{artifactId, path}`), not image bytes — read the file at `path` (one agent curl'd it as a PNG); and the sanctioned vision-fallback loop: structured read overflows → `screenshot` → read the image file.

- [ ] **Step 3: skills** — `feather-data-extraction`: recipe `type` now optional (defaults text / infers attribute), `value` reads input fields; `using-feather-browser`: after a click that may open a new tab, check `newPageId`, else `GET /tabs`; `GET /health` to distinguish "browser died" from "my connection died".

- [ ] **Step 4: Verify claim-by-claim** — for each doc claim added, point at the code line that makes it true (the operator-skills rewrite set this bar; keep it).

- [ ] **Step 5: Commit**

```bash
git add docs/api-reference.md docs/agent-playbook.md .claude/skills
git commit -m "docs: tabs/health/newPageId/value-extract surfaces + screenshot-descriptor and browserMode staleness fixes"
```

---

### Task 8: Full gates + adversarial review + push

- [ ] **Step 1:** `npx tsc --noEmit` — clean.
- [ ] **Step 2:** `npm test` — all unit suites green (baseline was 280; expect ~290+).
- [ ] **Step 3:** `npm run test:integration` — all green (baseline 73; expect +2).
- [ ] **Step 4:** Dispatch an adversarial code-review subagent over `git diff <base>..HEAD` with the meta-analysis §4 as the requirements doc; fix MAJOR+ findings; re-run gates.
- [ ] **Step 5:** Push: `git push origin dev` (never master — standing policy).

---

## Self-review notes

- **Spec coverage:** META-ANALYSIS §4 ★1 → Task 1; ★2 → Task 4 (value read; `/evaluate` deliberately absent); ★3 → Tasks 2+3; ★4 → Task 4; ★5 → Task 5; ★6 → Task 6; ◇7 docs half → Task 7. ◇8/9/10/11 are deferred by design, not gaps.
- **Type consistency:** `getPageIdFor`/`getPageCount` defined in Task 3/6 on `FeatherSession` and consumed only after definition; `ListTabsOutput.pages: PageInfo[]` matches `getPageInfoList(): Promise<PageInfo[]>`; `ExtractField.type` union extended before the handler branch uses it.
- **Known adaptation points (flagged, not placeholders):** three test files reuse existing harnesses (`attach-cdp`, `transport`, `close-tab` patterns) — the engineer must read those files first; constructor signatures in Task 5's setup may need adapting to `fs-layout.ts`/`profiles/` reality. Assertions to keep are stated exactly in each case.
