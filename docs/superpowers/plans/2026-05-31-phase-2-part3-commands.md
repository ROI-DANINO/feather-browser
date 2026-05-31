# Feather Browser Phase 2 — Part 3: Command Handlers

> Part of a multi-part plan. See also: Part 1 (Foundation), Part 2 (Session Layer), Part 4 (Transport), Part 5 (Integration & Measurement).
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Covers:** Task 9 (CommandHandler interface + all 9 command handlers with unit tests)

---

## Prerequisites

Before starting this task, the following must be implemented and passing:

- Part 1 (Foundation): `src/config.ts`, `src/fs-layout.ts`, `src/sessions/types.ts`, `src/logs/redact.ts`, `src/profiles/lock.ts`, `src/profiles/workspace.ts`, `src/browser/modes.ts`, `src/logs/logger.ts`
- Part 2 (Session Layer): `src/sessions/session.ts`, `src/sessions/manager.ts`, `src/debug/capture.ts`, `src/debug/bundle.ts`
- All unit tests from Parts 1 and 2 must be passing: `npm test -- --reporter=verbose`

---

## Task 9: All Command Handlers

**Files to create:**
- `src/commands/handler.ts`
- `src/commands/launch.ts`
- `src/commands/status.ts`
- `src/commands/navigate.ts`
- `src/commands/snapshot.ts`
- `src/commands/extract.ts`
- `src/commands/screenshot.ts`
- `src/commands/debug-bundle.ts`
- `src/commands/close.ts`
- `tests/unit/commands/extract.test.ts`
- `tests/unit/commands/snapshot.test.ts`
- `tests/unit/commands/launch.test.ts`
- `tests/unit/commands/status.test.ts`
- `tests/unit/commands/navigate.test.ts`
- `tests/unit/commands/screenshot.test.ts`
- `tests/unit/commands/debug-bundle.test.ts`
- `tests/unit/commands/close.test.ts`

---

### Step 1: Create the CommandHandler interface

Create `src/commands/handler.ts`:

```typescript
import type { CommandContext } from "../sessions/types";

export type { CommandContext };

export interface CommandHandler<TIn, TOut> {
  execute(input: TIn, ctx: CommandContext): Promise<TOut>;
}
```

No test is needed for this interface file — it is a type-only declaration verified by TypeScript.

---

### Step 2: Write failing tests for ExtractHandler (TDD start)

Create `tests/unit/commands/extract.test.ts`:

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ExtractHandler } from "../../../src/commands/extract";
import type { ExtractRecipe } from "../../../src/sessions/types";

const mockLocator = {
  first: vi.fn().mockReturnThis(),
  textContent: vi.fn(),
  getAttribute: vi.fn(),
};

const mockPage = {
  url: vi.fn().mockReturnValue("https://example.com"),
  title: vi.fn().mockResolvedValue("Example"),
  goto: vi.fn().mockResolvedValue({ status: () => 200 }),
  locator: vi.fn().mockReturnValue(mockLocator),
  evaluate: vi.fn(),
  screenshot: vi.fn().mockResolvedValue(undefined),
};

const mockSession = {
  sessionId: "ses_test_001",
  workspaceId: "default",
  profileKind: "persistent" as const,
  browserMode: "chromium-new-headless" as const,
  profilePath: "/tmp/.feather/profiles/default/profile",
  debugDir: "/tmp/.feather/debug/ses_test_001",
  proxy: null,
  startedAt: "2026-05-31T00:00:00.000Z",
  getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: mockPage }),
  getDefaultPageId: vi.fn().mockReturnValue("page_001"),
  getPageInfoList: vi.fn().mockResolvedValue([
    { pageId: "page_001", url: "https://example.com", title: "Example" },
  ]),
  getState: vi.fn().mockReturnValue("running"),
  toRecord: vi.fn().mockReturnValue({ sessionId: "ses_test_001", state: "running" }),
};

const mockManager = {
  launch: vi.fn().mockResolvedValue(mockSession),
  get: vi.fn().mockReturnValue(mockSession),
  list: vi.fn().mockReturnValue([mockSession]),
  close: vi.fn().mockResolvedValue(undefined),
};

const ctx = { requestId: "req_test_001" };

describe("ExtractHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPage.locator.mockReturnValue(mockLocator);
    mockLocator.first.mockReturnThis();
    mockSession.getPage.mockReturnValue({ pageId: "page_001", page: mockPage });
    mockManager.get.mockReturnValue(mockSession);
  });

  it("extracts a text field using textContent", async () => {
    mockLocator.textContent.mockResolvedValue("  Hello World  ");
    const handler = new ExtractHandler(mockManager as any);
    const recipe: ExtractRecipe = {
      fields: {
        heading: { selector: "h1", type: "text" },
      },
    };
    const result = await handler.execute(
      { sessionId: "ses_test_001", recipe },
      ctx
    );
    expect(mockPage.locator).toHaveBeenCalledWith("h1");
    expect(mockLocator.first).toHaveBeenCalled();
    expect(mockLocator.textContent).toHaveBeenCalled();
    expect(result.heading).toBe("Hello World");
  });

  it("extracts an attribute field using getAttribute", async () => {
    mockLocator.getAttribute.mockResolvedValue("https://example.com/canonical");
    const handler = new ExtractHandler(mockManager as any);
    const recipe: ExtractRecipe = {
      fields: {
        canonical: {
          selector: "link[rel='canonical']",
          type: "attribute",
          attribute: "href",
        },
      },
    };
    const result = await handler.execute(
      { sessionId: "ses_test_001", recipe },
      ctx
    );
    expect(mockLocator.getAttribute).toHaveBeenCalledWith("href");
    expect(result.canonical).toBe("https://example.com/canonical");
  });

  it("returns null for a text field when textContent returns null", async () => {
    mockLocator.textContent.mockResolvedValue(null);
    const handler = new ExtractHandler(mockManager as any);
    const recipe: ExtractRecipe = {
      fields: {
        heading: { selector: "h1", type: "text" },
      },
    };
    const result = await handler.execute(
      { sessionId: "ses_test_001", recipe },
      ctx
    );
    expect(result.heading).toBeNull();
  });

  it("returns null for an attribute field when getAttribute returns null", async () => {
    mockLocator.getAttribute.mockResolvedValue(null);
    const handler = new ExtractHandler(mockManager as any);
    const recipe: ExtractRecipe = {
      fields: {
        canonical: {
          selector: "link[rel='canonical']",
          type: "attribute",
          attribute: "href",
        },
      },
    };
    const result = await handler.execute(
      { sessionId: "ses_test_001", recipe },
      ctx
    );
    expect(result.canonical).toBeNull();
  });

  it("returns null when locator throws (selector not found)", async () => {
    mockLocator.textContent.mockRejectedValue(new Error("Element not found"));
    const handler = new ExtractHandler(mockManager as any);
    const recipe: ExtractRecipe = {
      fields: {
        missing: { selector: ".does-not-exist", type: "text" },
      },
    };
    const result = await handler.execute(
      { sessionId: "ses_test_001", recipe },
      ctx
    );
    expect(result.missing).toBeNull();
  });

  it("truncates text field to limits.textChars", async () => {
    mockLocator.textContent.mockResolvedValue("A".repeat(10000));
    const handler = new ExtractHandler(mockManager as any);
    const recipe: ExtractRecipe = {
      fields: {
        body: { selector: "body", type: "text" },
      },
      limits: { textChars: 100 },
    };
    const result = await handler.execute(
      { sessionId: "ses_test_001", recipe },
      ctx
    );
    expect(result.body).toHaveLength(100);
  });

  it("uses specific pageId when provided", async () => {
    mockLocator.textContent.mockResolvedValue("value");
    const handler = new ExtractHandler(mockManager as any);
    const recipe: ExtractRecipe = {
      fields: { field: { selector: "p", type: "text" } },
    };
    await handler.execute(
      { sessionId: "ses_test_001", pageId: "page_002", recipe },
      ctx
    );
    expect(mockSession.getPage).toHaveBeenCalledWith("page_002");
  });

  it("uses default page when pageId is omitted", async () => {
    mockLocator.textContent.mockResolvedValue("value");
    const handler = new ExtractHandler(mockManager as any);
    const recipe: ExtractRecipe = {
      fields: { field: { selector: "p", type: "text" } },
    };
    await handler.execute({ sessionId: "ses_test_001", recipe }, ctx);
    expect(mockSession.getPage).toHaveBeenCalledWith(undefined);
  });

  it("extracts multiple fields", async () => {
    mockLocator.textContent.mockResolvedValue("Title text");
    mockLocator.getAttribute.mockResolvedValue("https://example.com");
    const handler = new ExtractHandler(mockManager as any);
    const recipe: ExtractRecipe = {
      fields: {
        title: { selector: "h1", type: "text" },
        link: { selector: "a", type: "attribute", attribute: "href" },
      },
    };
    const result = await handler.execute(
      { sessionId: "ses_test_001", recipe },
      ctx
    );
    expect(Object.keys(result)).toEqual(["title", "link"]);
    expect(result.title).toBe("Title text");
    expect(result.link).toBe("https://example.com");
  });
});
```

Run to verify it fails:

```bash
npx vitest run tests/unit/commands/extract.test.ts --reporter=verbose 2>&1 | head -20
```

Expected: `Cannot find module '../../../src/commands/extract'`

---

### Step 3: Implement ExtractHandler

Create `src/commands/extract.ts`:

```typescript
import type { CommandHandler, CommandContext } from "./handler";
import type { ExtractRecipe, SessionManager as ISessionManager } from "../sessions/types";

// Minimal interface so ExtractHandler does not depend on the concrete SessionManager class
interface IManager {
  get(sessionId: string): {
    getPage(pageId?: string): { pageId: string; page: import("playwright").Page };
  };
}

export interface ExtractInput {
  sessionId: string;
  pageId?: string;
  recipe: ExtractRecipe;
}

export type ExtractOutput = Record<string, string | null>;

export class ExtractHandler implements CommandHandler<ExtractInput, ExtractOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: ExtractInput, _ctx: CommandContext): Promise<ExtractOutput> {
    const { sessionId, pageId, recipe } = input;
    const session = this.manager.get(sessionId);
    const { page } = session.getPage(pageId);
    const textLimit = recipe.limits?.textChars;

    const result: ExtractOutput = {};

    for (const [fieldName, field] of Object.entries(recipe.fields)) {
      try {
        const locator = page.locator(field.selector).first();
        if (field.type === "text") {
          const raw = await locator.textContent();
          if (raw === null) {
            result[fieldName] = null;
          } else {
            const trimmed = raw.trim();
            result[fieldName] = textLimit !== undefined ? trimmed.slice(0, textLimit) : trimmed;
          }
        } else {
          const value = await locator.getAttribute(field.attribute!);
          result[fieldName] = value ?? null;
        }
      } catch {
        result[fieldName] = null;
      }
    }

    return result;
  }
}
```

Run extract tests to verify they pass:

```bash
npx vitest run tests/unit/commands/extract.test.ts --reporter=verbose
```

Expected: all 8 extract tests pass.

---

### Step 4: Write failing tests for SnapshotHandler (TDD start)

Create `tests/unit/commands/snapshot.test.ts`:

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";
import { SnapshotHandler } from "../../../src/commands/snapshot";

const mockPage = {
  url: vi.fn().mockReturnValue("https://example.com"),
  title: vi.fn().mockResolvedValue("Example Domain"),
  goto: vi.fn().mockResolvedValue({ status: () => 200 }),
  locator: vi.fn(),
  evaluate: vi.fn(),
  screenshot: vi.fn().mockResolvedValue(undefined),
};

const mockSession = {
  sessionId: "ses_test_001",
  workspaceId: "default",
  profileKind: "persistent" as const,
  browserMode: "chromium-new-headless" as const,
  profilePath: "/tmp/.feather/profiles/default/profile",
  debugDir: "/tmp/.feather/debug/ses_test_001",
  proxy: null,
  startedAt: "2026-05-31T00:00:00.000Z",
  getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: mockPage }),
  getDefaultPageId: vi.fn().mockReturnValue("page_001"),
  getPageInfoList: vi.fn().mockResolvedValue([
    { pageId: "page_001", url: "https://example.com", title: "Example Domain" },
  ]),
  getState: vi.fn().mockReturnValue("running"),
  toRecord: vi.fn().mockReturnValue({ sessionId: "ses_test_001", state: "running" }),
};

const mockManager = {
  launch: vi.fn().mockResolvedValue(mockSession),
  get: vi.fn().mockReturnValue(mockSession),
  list: vi.fn().mockReturnValue([mockSession]),
  close: vi.fn().mockResolvedValue(undefined),
};

const ctx = { requestId: "req_test_001" };

describe("SnapshotHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPage.url.mockReturnValue("https://example.com");
    mockPage.title.mockResolvedValue("Example Domain");
    mockSession.getPage.mockReturnValue({ pageId: "page_001", page: mockPage });
    mockManager.get.mockReturnValue(mockSession);
  });

  it("returns snapshot with url, title, text, links, meta, and limits", async () => {
    mockPage.evaluate
      .mockResolvedValueOnce("Example Domain\nThis domain is for use in illustrative examples.")
      .mockResolvedValueOnce([{ text: "More information...", href: "https://www.iana.org/domains/example" }])
      .mockResolvedValueOnce("An illustrative example domain.");

    const handler = new SnapshotHandler(mockManager as any);
    const result = await handler.execute({ sessionId: "ses_test_001" }, ctx);

    expect(result.pageId).toBe("page_001");
    expect(result.url).toBe("https://example.com");
    expect(result.title).toBe("Example Domain");
    expect(result.text).toContain("Example Domain");
    expect(result.links).toEqual([
      { text: "More information...", href: "https://www.iana.org/domains/example" },
    ]);
    expect(result.meta.description).toBe("An illustrative example domain.");
    expect(result.limits.textChars).toBe(20000);
    expect(result.limits.links).toBe(200);
  });

  it("truncates body text to 20000 characters", async () => {
    const longText = "X".repeat(25000);
    mockPage.evaluate
      .mockResolvedValueOnce(longText)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce("");

    const handler = new SnapshotHandler(mockManager as any);
    const result = await handler.execute({ sessionId: "ses_test_001" }, ctx);

    expect(result.text.length).toBe(20000);
  });

  it("truncates links array to 200 entries", async () => {
    const manyLinks = Array.from({ length: 250 }, (_, i) => ({
      text: `Link ${i}`,
      href: `https://example.com/${i}`,
    }));
    mockPage.evaluate
      .mockResolvedValueOnce("some text")
      .mockResolvedValueOnce(manyLinks)
      .mockResolvedValueOnce("");

    const handler = new SnapshotHandler(mockManager as any);
    const result = await handler.execute({ sessionId: "ses_test_001" }, ctx);

    expect(result.links.length).toBe(200);
  });

  it("returns empty string for meta.description when meta tag is absent", async () => {
    mockPage.evaluate
      .mockResolvedValueOnce("text")
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce("");

    const handler = new SnapshotHandler(mockManager as any);
    const result = await handler.execute({ sessionId: "ses_test_001" }, ctx);

    expect(result.meta.description).toBe("");
  });

  it("returns empty links array when page has no links", async () => {
    mockPage.evaluate
      .mockResolvedValueOnce("text")
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce("");

    const handler = new SnapshotHandler(mockManager as any);
    const result = await handler.execute({ sessionId: "ses_test_001" }, ctx);

    expect(result.links).toEqual([]);
  });

  it("uses specific pageId when provided", async () => {
    mockPage.evaluate
      .mockResolvedValueOnce("text")
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce("");

    const handler = new SnapshotHandler(mockManager as any);
    await handler.execute({ sessionId: "ses_test_001", pageId: "page_002" }, ctx);

    expect(mockSession.getPage).toHaveBeenCalledWith("page_002");
  });

  it("uses default page when pageId is omitted", async () => {
    mockPage.evaluate
      .mockResolvedValueOnce("text")
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce("");

    const handler = new SnapshotHandler(mockManager as any);
    await handler.execute({ sessionId: "ses_test_001" }, ctx);

    expect(mockSession.getPage).toHaveBeenCalledWith(undefined);
  });
});
```

Run to verify failure:

```bash
npx vitest run tests/unit/commands/snapshot.test.ts --reporter=verbose 2>&1 | head -20
```

Expected: `Cannot find module '../../../src/commands/snapshot'`

---

### Step 5: Implement SnapshotHandler

Create `src/commands/snapshot.ts`:

```typescript
import type { CommandHandler, CommandContext } from "./handler";
import type { SnapshotResult } from "../sessions/types";

interface IManager {
  get(sessionId: string): {
    getPage(pageId?: string): { pageId: string; page: import("playwright").Page };
  };
}

export interface SnapshotInput {
  sessionId: string;
  pageId?: string;
}

export class SnapshotHandler implements CommandHandler<SnapshotInput, SnapshotResult> {
  constructor(private readonly manager: IManager) {}

  async execute(input: SnapshotInput, _ctx: CommandContext): Promise<SnapshotResult> {
    const { sessionId, pageId } = input;
    const session = this.manager.get(sessionId);
    const { pageId: resolvedPageId, page } = session.getPage(pageId);

    const url = page.url();
    const title = await page.title();

    const rawText: string = await page.evaluate(
      () => (document.body as HTMLElement).innerText
    );
    const text = rawText.slice(0, 20000);

    const allLinks: Array<{ text: string; href: string }> = await page.evaluate(() =>
      Array.from(document.links).map((a) => ({
        text: (a as HTMLAnchorElement).innerText.trim(),
        href: (a as HTMLAnchorElement).href,
      }))
    );
    const links = allLinks.slice(0, 200);

    const description: string = await page.evaluate(
      () =>
        (document.querySelector('meta[name="description"]') as HTMLMetaElement | null)?.getAttribute(
          "content"
        ) ?? ""
    );

    return {
      pageId: resolvedPageId,
      url,
      title,
      text,
      links,
      meta: { description },
      limits: { textChars: 20000, links: 200 },
    };
  }
}
```

Run snapshot tests to verify they pass:

```bash
npx vitest run tests/unit/commands/snapshot.test.ts --reporter=verbose
```

Expected: all 7 snapshot tests pass.

---

### Step 6: Write tests for LaunchSessionHandler

Create `tests/unit/commands/launch.test.ts`:

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";
import { LaunchSessionHandler } from "../../../src/commands/launch";

const mockPage = {
  url: vi.fn().mockReturnValue("about:blank"),
  title: vi.fn().mockResolvedValue(""),
};

const mockSession = {
  sessionId: "ses_test_001",
  workspaceId: "default",
  profileKind: "persistent" as const,
  browserMode: "chromium-new-headless" as const,
  profilePath: "/tmp/.feather/profiles/default/profile",
  debugDir: "/tmp/.feather/debug/ses_test_001",
  proxy: null,
  startedAt: "2026-05-31T00:00:00.000Z",
  getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: mockPage }),
  getDefaultPageId: vi.fn().mockReturnValue("page_001"),
  getPageInfoList: vi.fn().mockResolvedValue([
    { pageId: "page_001", url: "about:blank", title: "" },
  ]),
  getState: vi.fn().mockReturnValue("running"),
  toRecord: vi.fn().mockReturnValue({
    sessionId: "ses_test_001",
    workspaceId: "default",
    profileKind: "persistent",
    browserMode: "chromium-new-headless",
    state: "running",
    profilePath: "/tmp/.feather/profiles/default/profile",
    debugDir: "/tmp/.feather/debug/ses_test_001",
    proxy: null,
    startedAt: "2026-05-31T00:00:00.000Z",
    profileLocked: true,
  }),
};

const mockManager = {
  launch: vi.fn().mockResolvedValue(mockSession),
  get: vi.fn().mockReturnValue(mockSession),
  list: vi.fn().mockReturnValue([mockSession]),
  close: vi.fn().mockResolvedValue(undefined),
};

const ctx = { requestId: "req_test_001" };

describe("LaunchSessionHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockManager.launch.mockResolvedValue(mockSession);
    mockSession.toRecord.mockReturnValue({
      sessionId: "ses_test_001",
      workspaceId: "default",
      profileKind: "persistent",
      browserMode: "chromium-new-headless",
      state: "running",
      profilePath: "/tmp/.feather/profiles/default/profile",
      debugDir: "/tmp/.feather/debug/ses_test_001",
      proxy: null,
      startedAt: "2026-05-31T00:00:00.000Z",
      profileLocked: true,
    });
    mockSession.getPageInfoList.mockResolvedValue([
      { pageId: "page_001", url: "about:blank", title: "" },
    ]);
  });

  it("calls manager.launch with the provided input", async () => {
    const handler = new LaunchSessionHandler(mockManager as any);
    const input = {
      workspaceId: "default",
      profile: { kind: "persistent" as const },
      browserMode: "chromium-new-headless" as const,
    };
    await handler.execute(input, ctx);
    expect(mockManager.launch).toHaveBeenCalledWith(input);
  });

  it("returns a SessionRecord with pages populated from getPageInfoList", async () => {
    const handler = new LaunchSessionHandler(mockManager as any);
    const result = await handler.execute(
      { profile: { kind: "persistent" } },
      ctx
    );
    expect(result.sessionId).toBe("ses_test_001");
    expect(result.pages).toEqual([
      { pageId: "page_001", url: "about:blank", title: "" },
    ]);
  });

  it("includes state from toRecord", async () => {
    const handler = new LaunchSessionHandler(mockManager as any);
    const result = await handler.execute(
      { profile: { kind: "persistent" } },
      ctx
    );
    expect(result.state).toBe("running");
  });
});
```

Run to verify failure:

```bash
npx vitest run tests/unit/commands/launch.test.ts --reporter=verbose 2>&1 | head -20
```

Expected: `Cannot find module '../../../src/commands/launch'`

---

### Step 7: Implement LaunchSessionHandler

Create `src/commands/launch.ts`:

```typescript
import type { CommandHandler, CommandContext } from "./handler";
import type { SessionRecord, ProfileKind, BrowserMode, ProxyConfig } from "../sessions/types";

interface IManager {
  launch(input: LaunchInput): Promise<{
    toRecord(): Omit<SessionRecord, "pages">;
    getPageInfoList(): Promise<SessionRecord["pages"]>;
  }>;
}

export interface LaunchInput {
  workspaceId?: string;
  profile: { kind: ProfileKind };
  browserMode?: BrowserMode;
  viewport?: { width: number; height: number };
  proxy?: ProxyConfig | null;
  debug?: { trace?: boolean; screenshots?: boolean };
}

export class LaunchSessionHandler implements CommandHandler<LaunchInput, SessionRecord> {
  constructor(private readonly manager: IManager) {}

  async execute(input: LaunchInput, _ctx: CommandContext): Promise<SessionRecord> {
    const session = await this.manager.launch(input);
    const record = session.toRecord();
    const pages = await session.getPageInfoList();
    return { ...record, pages };
  }
}
```

Run launch tests:

```bash
npx vitest run tests/unit/commands/launch.test.ts --reporter=verbose
```

Expected: all 3 launch tests pass.

---

### Step 8: Write tests for GetSessionHandler and ListSessionsHandler

Create `tests/unit/commands/status.test.ts`:

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";
import { GetSessionHandler, ListSessionsHandler } from "../../../src/commands/status";

const mockPage = {
  url: vi.fn().mockReturnValue("https://example.com"),
  title: vi.fn().mockResolvedValue("Example"),
};

const mockSession = {
  sessionId: "ses_test_001",
  workspaceId: "default",
  profileKind: "persistent" as const,
  browserMode: "chromium-new-headless" as const,
  profilePath: "/tmp/.feather/profiles/default/profile",
  debugDir: "/tmp/.feather/debug/ses_test_001",
  proxy: null,
  startedAt: "2026-05-31T00:00:00.000Z",
  getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: mockPage }),
  getDefaultPageId: vi.fn().mockReturnValue("page_001"),
  getPageInfoList: vi.fn().mockResolvedValue([
    { pageId: "page_001", url: "https://example.com", title: "Example" },
  ]),
  getState: vi.fn().mockReturnValue("running"),
  toRecord: vi.fn().mockReturnValue({
    sessionId: "ses_test_001",
    workspaceId: "default",
    profileKind: "persistent",
    browserMode: "chromium-new-headless",
    state: "running",
    profilePath: "/tmp/.feather/profiles/default/profile",
    debugDir: "/tmp/.feather/debug/ses_test_001",
    proxy: null,
    startedAt: "2026-05-31T00:00:00.000Z",
    profileLocked: true,
  }),
};

const mockManager = {
  launch: vi.fn().mockResolvedValue(mockSession),
  get: vi.fn().mockReturnValue(mockSession),
  list: vi.fn().mockReturnValue([mockSession]),
  close: vi.fn().mockResolvedValue(undefined),
};

const ctx = { requestId: "req_test_001" };

describe("GetSessionHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockManager.get.mockReturnValue(mockSession);
    mockSession.getPageInfoList.mockResolvedValue([
      { pageId: "page_001", url: "https://example.com", title: "Example" },
    ]);
    mockSession.toRecord.mockReturnValue({
      sessionId: "ses_test_001",
      workspaceId: "default",
      profileKind: "persistent",
      browserMode: "chromium-new-headless",
      state: "running",
      profilePath: "/tmp/.feather/profiles/default/profile",
      debugDir: "/tmp/.feather/debug/ses_test_001",
      proxy: null,
      startedAt: "2026-05-31T00:00:00.000Z",
      profileLocked: true,
    });
  });

  it("calls manager.get with the correct sessionId", async () => {
    const handler = new GetSessionHandler(mockManager as any);
    await handler.execute({ sessionId: "ses_test_001" }, ctx);
    expect(mockManager.get).toHaveBeenCalledWith("ses_test_001");
  });

  it("returns a full SessionRecord with pages populated", async () => {
    const handler = new GetSessionHandler(mockManager as any);
    const result = await handler.execute({ sessionId: "ses_test_001" }, ctx);
    expect(result.sessionId).toBe("ses_test_001");
    expect(result.pages).toEqual([
      { pageId: "page_001", url: "https://example.com", title: "Example" },
    ]);
  });
});

describe("ListSessionsHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockManager.list.mockReturnValue([mockSession]);
    mockSession.getPageInfoList.mockResolvedValue([
      { pageId: "page_001", url: "https://example.com", title: "Example" },
    ]);
    mockSession.toRecord.mockReturnValue({
      sessionId: "ses_test_001",
      workspaceId: "default",
      profileKind: "persistent",
      browserMode: "chromium-new-headless",
      state: "running",
      profilePath: "/tmp/.feather/profiles/default/profile",
      debugDir: "/tmp/.feather/debug/ses_test_001",
      proxy: null,
      startedAt: "2026-05-31T00:00:00.000Z",
      profileLocked: true,
    });
  });

  it("returns an array of SessionRecords", async () => {
    const handler = new ListSessionsHandler(mockManager as any);
    const result = await handler.execute({}, ctx);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0].sessionId).toBe("ses_test_001");
  });

  it("returns an empty array when no sessions are active", async () => {
    mockManager.list.mockReturnValue([]);
    const handler = new ListSessionsHandler(mockManager as any);
    const result = await handler.execute({}, ctx);
    expect(result).toEqual([]);
  });
});
```

Run to verify failure:

```bash
npx vitest run tests/unit/commands/status.test.ts --reporter=verbose 2>&1 | head -20
```

Expected: `Cannot find module '../../../src/commands/status'`

---

### Step 9: Implement GetSessionHandler and ListSessionsHandler

Create `src/commands/status.ts`:

```typescript
import type { CommandHandler, CommandContext } from "./handler";
import type { SessionRecord } from "../sessions/types";

interface ISession {
  toRecord(): Omit<SessionRecord, "pages">;
  getPageInfoList(): Promise<SessionRecord["pages"]>;
}

interface IManager {
  get(sessionId: string): ISession;
  list(): ISession[];
}

export interface GetSessionInput {
  sessionId: string;
}

export class GetSessionHandler implements CommandHandler<GetSessionInput, SessionRecord> {
  constructor(private readonly manager: IManager) {}

  async execute(input: GetSessionInput, _ctx: CommandContext): Promise<SessionRecord> {
    const session = this.manager.get(input.sessionId);
    const record = session.toRecord();
    const pages = await session.getPageInfoList();
    return { ...record, pages };
  }
}

export class ListSessionsHandler implements CommandHandler<Record<string, never>, SessionRecord[]> {
  constructor(private readonly manager: IManager) {}

  async execute(_input: Record<string, never>, _ctx: CommandContext): Promise<SessionRecord[]> {
    const sessions = this.manager.list();
    return Promise.all(
      sessions.map(async (session) => {
        const record = session.toRecord();
        const pages = await session.getPageInfoList();
        return { ...record, pages };
      })
    );
  }
}
```

Run status tests:

```bash
npx vitest run tests/unit/commands/status.test.ts --reporter=verbose
```

Expected: all 4 status tests pass.

---

### Step 10: Write tests for NavigateHandler

Create `tests/unit/commands/navigate.test.ts`:

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";
import { NavigateHandler } from "../../../src/commands/navigate";

const mockResponse = { status: vi.fn().mockReturnValue(200) };

const mockPage = {
  url: vi.fn().mockReturnValue("https://example.com"),
  title: vi.fn().mockResolvedValue("Example"),
  goto: vi.fn().mockResolvedValue(mockResponse),
  locator: vi.fn(),
  evaluate: vi.fn(),
  screenshot: vi.fn().mockResolvedValue(undefined),
};

const mockSession = {
  sessionId: "ses_test_001",
  workspaceId: "default",
  profileKind: "persistent" as const,
  browserMode: "chromium-new-headless" as const,
  profilePath: "/tmp/.feather/profiles/default/profile",
  debugDir: "/tmp/.feather/debug/ses_test_001",
  proxy: null,
  startedAt: "2026-05-31T00:00:00.000Z",
  getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: mockPage }),
  getDefaultPageId: vi.fn().mockReturnValue("page_001"),
  getPageInfoList: vi.fn().mockResolvedValue([
    { pageId: "page_001", url: "https://example.com", title: "Example" },
  ]),
  getState: vi.fn().mockReturnValue("running"),
  toRecord: vi.fn().mockReturnValue({ sessionId: "ses_test_001", state: "running" }),
};

const mockManager = {
  launch: vi.fn().mockResolvedValue(mockSession),
  get: vi.fn().mockReturnValue(mockSession),
  list: vi.fn().mockReturnValue([mockSession]),
  close: vi.fn().mockResolvedValue(undefined),
};

const ctx = { requestId: "req_test_001" };

describe("NavigateHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPage.goto.mockResolvedValue(mockResponse);
    mockResponse.status.mockReturnValue(200);
    mockPage.url.mockReturnValue("https://example.com");
    mockSession.getPage.mockReturnValue({ pageId: "page_001", page: mockPage });
    mockManager.get.mockReturnValue(mockSession);
  });

  it("calls page.goto with the provided url", async () => {
    const handler = new NavigateHandler(mockManager as any);
    await handler.execute(
      { sessionId: "ses_test_001", url: "https://example.com" },
      ctx
    );
    expect(mockPage.goto).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({ waitUntil: undefined, timeout: undefined })
    );
  });

  it("passes waitUntil and timeoutMs to page.goto", async () => {
    const handler = new NavigateHandler(mockManager as any);
    await handler.execute(
      {
        sessionId: "ses_test_001",
        url: "https://example.com",
        waitUntil: "domcontentloaded",
        timeoutMs: 15000,
      },
      ctx
    );
    expect(mockPage.goto).toHaveBeenCalledWith("https://example.com", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
  });

  it("returns pageId, current url, and response status", async () => {
    const handler = new NavigateHandler(mockManager as any);
    const result = await handler.execute(
      { sessionId: "ses_test_001", url: "https://example.com" },
      ctx
    );
    expect(result.pageId).toBe("page_001");
    expect(result.url).toBe("https://example.com");
    expect(result.status).toBe(200);
  });

  it("returns null status when goto resolves to null", async () => {
    mockPage.goto.mockResolvedValue(null);
    const handler = new NavigateHandler(mockManager as any);
    const result = await handler.execute(
      { sessionId: "ses_test_001", url: "https://example.com" },
      ctx
    );
    expect(result.status).toBeNull();
  });

  it("uses specific pageId when provided", async () => {
    const handler = new NavigateHandler(mockManager as any);
    await handler.execute(
      { sessionId: "ses_test_001", pageId: "page_002", url: "https://example.com" },
      ctx
    );
    expect(mockSession.getPage).toHaveBeenCalledWith("page_002");
  });
});
```

Run to verify failure:

```bash
npx vitest run tests/unit/commands/navigate.test.ts --reporter=verbose 2>&1 | head -20
```

Expected: `Cannot find module '../../../src/commands/navigate'`

---

### Step 11: Implement NavigateHandler

Create `src/commands/navigate.ts`:

```typescript
import type { CommandHandler, CommandContext } from "./handler";

interface IManager {
  get(sessionId: string): {
    getPage(pageId?: string): { pageId: string; page: import("playwright").Page };
  };
}

export interface NavigateInput {
  sessionId: string;
  pageId?: string;
  url: string;
  waitUntil?: string;
  timeoutMs?: number;
}

export interface NavigateOutput {
  pageId: string;
  url: string;
  status: number | null;
}

export class NavigateHandler implements CommandHandler<NavigateInput, NavigateOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: NavigateInput, _ctx: CommandContext): Promise<NavigateOutput> {
    const { sessionId, pageId, url, waitUntil, timeoutMs } = input;
    const session = this.manager.get(sessionId);
    const { pageId: resolvedPageId, page } = session.getPage(pageId);

    const response = await page.goto(url, {
      waitUntil: waitUntil as any,
      timeout: timeoutMs,
    });

    return {
      pageId: resolvedPageId,
      url: page.url(),
      status: response?.status() ?? null,
    };
  }
}
```

Run navigate tests:

```bash
npx vitest run tests/unit/commands/navigate.test.ts --reporter=verbose
```

Expected: all 5 navigate tests pass.

---

### Step 12: Write tests for ScreenshotHandler

Create `tests/unit/commands/screenshot.test.ts`:

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";
import * as fs from "fs";

vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof import("fs")>("fs");
  return {
    ...actual,
    promises: {
      ...actual.promises,
      mkdir: vi.fn().mockResolvedValue(undefined),
    },
  };
});

import { ScreenshotHandler } from "../../../src/commands/screenshot";

const mockPage = {
  url: vi.fn().mockReturnValue("https://example.com"),
  title: vi.fn().mockResolvedValue("Example"),
  goto: vi.fn().mockResolvedValue({ status: () => 200 }),
  locator: vi.fn(),
  evaluate: vi.fn(),
  screenshot: vi.fn().mockResolvedValue(undefined),
};

const mockSession = {
  sessionId: "ses_test_001",
  workspaceId: "default",
  profileKind: "persistent" as const,
  browserMode: "chromium-new-headless" as const,
  profilePath: "/tmp/.feather/profiles/default/profile",
  debugDir: "/tmp/.feather/debug/ses_test_001",
  proxy: null,
  startedAt: "2026-05-31T00:00:00.000Z",
  getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: mockPage }),
  getDefaultPageId: vi.fn().mockReturnValue("page_001"),
  getPageInfoList: vi.fn().mockResolvedValue([
    { pageId: "page_001", url: "https://example.com", title: "Example" },
  ]),
  getState: vi.fn().mockReturnValue("running"),
  toRecord: vi.fn().mockReturnValue({ sessionId: "ses_test_001", state: "running" }),
};

const mockManager = {
  launch: vi.fn().mockResolvedValue(mockSession),
  get: vi.fn().mockReturnValue(mockSession),
  list: vi.fn().mockReturnValue([mockSession]),
  close: vi.fn().mockResolvedValue(undefined),
};

const ctx = { requestId: "req_test_001" };

describe("ScreenshotHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPage.screenshot.mockResolvedValue(undefined);
    mockSession.getPage.mockReturnValue({ pageId: "page_001", page: mockPage });
    mockManager.get.mockReturnValue(mockSession);
    (fs.promises.mkdir as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it("creates the screenshots directory before taking the screenshot", async () => {
    const handler = new ScreenshotHandler(mockManager as any);
    await handler.execute({ sessionId: "ses_test_001" }, ctx);
    expect(fs.promises.mkdir).toHaveBeenCalledWith(
      expect.stringContaining("screenshots"),
      { recursive: true }
    );
  });

  it("calls page.screenshot with the correct path", async () => {
    const handler = new ScreenshotHandler(mockManager as any);
    await handler.execute({ sessionId: "ses_test_001" }, ctx);
    expect(mockPage.screenshot).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringContaining("/tmp/.feather/debug/ses_test_001/screenshots/"),
      })
    );
  });

  it("returns an artifact with artifactId, path, and mimeType image/png", async () => {
    const handler = new ScreenshotHandler(mockManager as any);
    const result = await handler.execute({ sessionId: "ses_test_001" }, ctx);
    expect(result.artifactId).toMatch(/^art_/);
    expect(result.path).toContain("/tmp/.feather/debug/ses_test_001/screenshots/");
    expect(result.mimeType).toBe("image/png");
  });

  it("passes fullPage option to page.screenshot when set to true", async () => {
    const handler = new ScreenshotHandler(mockManager as any);
    await handler.execute({ sessionId: "ses_test_001", fullPage: true }, ctx);
    expect(mockPage.screenshot).toHaveBeenCalledWith(
      expect.objectContaining({ fullPage: true })
    );
  });

  it("passes fullPage: false when fullPage is omitted", async () => {
    const handler = new ScreenshotHandler(mockManager as any);
    await handler.execute({ sessionId: "ses_test_001" }, ctx);
    expect(mockPage.screenshot).toHaveBeenCalledWith(
      expect.objectContaining({ fullPage: false })
    );
  });

  it("includes pageId in the screenshot filename", async () => {
    const handler = new ScreenshotHandler(mockManager as any);
    await handler.execute({ sessionId: "ses_test_001" }, ctx);
    expect(mockPage.screenshot).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringContaining("page_001"),
      })
    );
  });
});
```

Run to verify failure:

```bash
npx vitest run tests/unit/commands/screenshot.test.ts --reporter=verbose 2>&1 | head -20
```

Expected: `Cannot find module '../../../src/commands/screenshot'`

---

### Step 13: Implement ScreenshotHandler

Create `src/commands/screenshot.ts`:

```typescript
import * as path from "path";
import * as fs from "fs";
import { randomUUID } from "crypto";
import type { CommandHandler, CommandContext } from "./handler";

const newId = (prefix: string) =>
  `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;

interface IManager {
  get(sessionId: string): {
    debugDir: string;
    getPage(pageId?: string): { pageId: string; page: import("playwright").Page };
  };
}

export interface ScreenshotInput {
  sessionId: string;
  pageId?: string;
  fullPage?: boolean;
}

export interface ScreenshotOutput {
  artifactId: string;
  path: string;
  mimeType: string;
}

export class ScreenshotHandler implements CommandHandler<ScreenshotInput, ScreenshotOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: ScreenshotInput, _ctx: CommandContext): Promise<ScreenshotOutput> {
    const { sessionId, pageId, fullPage } = input;
    const session = this.manager.get(sessionId);
    const { pageId: resolvedPageId, page } = session.getPage(pageId);

    const screenshotsDir = path.join(session.debugDir, "screenshots");
    await fs.promises.mkdir(screenshotsDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "");
    const filename = `page_${resolvedPageId}-${timestamp}.png`;
    const screenshotPath = path.join(screenshotsDir, filename);

    await page.screenshot({ path: screenshotPath, fullPage: !!fullPage });

    return {
      artifactId: newId("art"),
      path: screenshotPath,
      mimeType: "image/png",
    };
  }
}
```

Run screenshot tests:

```bash
npx vitest run tests/unit/commands/screenshot.test.ts --reporter=verbose
```

Expected: all 6 screenshot tests pass.

---

### Step 14: Write tests for DebugBundleHandler

Create `tests/unit/commands/debug-bundle.test.ts`:

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../../../src/debug/bundle", () => {
  return {
    DebugBundle: vi.fn().mockImplementation(() => ({
      finalize: vi.fn().mockResolvedValue("/tmp/.feather/debug/ses_test_001/manifest.json"),
    })),
  };
});

import { DebugBundleHandler } from "../../../src/commands/debug-bundle";
import { DebugBundle } from "../../../src/debug/bundle";

const mockSession = {
  sessionId: "ses_test_001",
  workspaceId: "default",
  profileKind: "persistent" as const,
  browserMode: "chromium-new-headless" as const,
  profilePath: "/tmp/.feather/profiles/default/profile",
  debugDir: "/tmp/.feather/debug/ses_test_001",
  proxy: null,
  startedAt: "2026-05-31T00:00:00.000Z",
  getPage: vi.fn(),
  getDefaultPageId: vi.fn().mockReturnValue("page_001"),
  getPageInfoList: vi.fn().mockResolvedValue([]),
  getState: vi.fn().mockReturnValue("running"),
  toRecord: vi.fn().mockReturnValue({ sessionId: "ses_test_001", state: "running" }),
};

const mockManager = {
  launch: vi.fn().mockResolvedValue(mockSession),
  get: vi.fn().mockReturnValue(mockSession),
  list: vi.fn().mockReturnValue([mockSession]),
  close: vi.fn().mockResolvedValue(undefined),
};

const mockPaths = {
  debugDir: vi.fn().mockReturnValue("/tmp/.feather/debug/ses_test_001"),
};

const ctx = { requestId: "req_test_001" };

describe("DebugBundleHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockManager.get.mockReturnValue(mockSession);
    (DebugBundle as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      finalize: vi.fn().mockResolvedValue(
        "/tmp/.feather/debug/ses_test_001/manifest.json"
      ),
    }));
  });

  it("calls manager.get with the correct sessionId", async () => {
    const handler = new DebugBundleHandler(mockManager as any, mockPaths as any);
    await handler.execute({ sessionId: "ses_test_001" }, ctx);
    expect(mockManager.get).toHaveBeenCalledWith("ses_test_001");
  });

  it("constructs a DebugBundle with session and paths", async () => {
    const handler = new DebugBundleHandler(mockManager as any, mockPaths as any);
    await handler.execute({ sessionId: "ses_test_001" }, ctx);
    expect(DebugBundle).toHaveBeenCalledWith(mockSession, mockPaths);
  });

  it("calls finalize with reason 'requested'", async () => {
    const mockFinalize = vi.fn().mockResolvedValue(
      "/tmp/.feather/debug/ses_test_001/manifest.json"
    );
    (DebugBundle as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      finalize: mockFinalize,
    }));

    const handler = new DebugBundleHandler(mockManager as any, mockPaths as any);
    await handler.execute({ sessionId: "ses_test_001" }, ctx);
    expect(mockFinalize).toHaveBeenCalledWith("requested");
  });

  it("returns sessionId, path, and manifest", async () => {
    const handler = new DebugBundleHandler(mockManager as any, mockPaths as any);
    const result = await handler.execute({ sessionId: "ses_test_001" }, ctx);
    expect(result.sessionId).toBe("ses_test_001");
    expect(result.path).toBe("/tmp/.feather/debug/ses_test_001");
    expect(result.manifest).toBe(
      "/tmp/.feather/debug/ses_test_001/manifest.json"
    );
  });
});
```

Run to verify failure:

```bash
npx vitest run tests/unit/commands/debug-bundle.test.ts --reporter=verbose 2>&1 | head -20
```

Expected: `Cannot find module '../../../src/commands/debug-bundle'`

---

### Step 15: Implement DebugBundleHandler

Create `src/commands/debug-bundle.ts`:

```typescript
import type { CommandHandler, CommandContext } from "./handler";
import { DebugBundle } from "../debug/bundle";
import type { FeatherPaths } from "../fs-layout";

interface IManager {
  get(sessionId: string): ConstructorParameters<typeof DebugBundle>[0];
}

export interface DebugBundleInput {
  sessionId: string;
}

export interface DebugBundleOutput {
  sessionId: string;
  path: string;
  manifest: string;
}

export class DebugBundleHandler implements CommandHandler<DebugBundleInput, DebugBundleOutput> {
  constructor(
    private readonly manager: IManager,
    private readonly paths: FeatherPaths
  ) {}

  async execute(input: DebugBundleInput, _ctx: CommandContext): Promise<DebugBundleOutput> {
    const { sessionId } = input;
    const session = this.manager.get(sessionId);
    const bundle = new DebugBundle(session, this.paths);
    const manifestPath = await bundle.finalize("requested");

    return {
      sessionId,
      path: (session as any).debugDir,
      manifest: manifestPath,
    };
  }
}
```

Run debug-bundle tests:

```bash
npx vitest run tests/unit/commands/debug-bundle.test.ts --reporter=verbose
```

Expected: all 4 debug-bundle tests pass.

---

### Step 16: Write tests for CloseSessionHandler

Create `tests/unit/commands/close.test.ts`:

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";
import { CloseSessionHandler } from "../../../src/commands/close";

const mockManager = {
  launch: vi.fn(),
  get: vi.fn(),
  list: vi.fn().mockReturnValue([]),
  close: vi.fn().mockResolvedValue(undefined),
};

const ctx = { requestId: "req_test_001" };

describe("CloseSessionHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockManager.close.mockResolvedValue(undefined);
  });

  it("calls manager.close with the correct sessionId", async () => {
    const handler = new CloseSessionHandler(mockManager as any);
    await handler.execute({ sessionId: "ses_test_001" }, ctx);
    expect(mockManager.close).toHaveBeenCalledWith(
      "ses_test_001",
      expect.objectContaining({ force: undefined, quarantineDisposableProfile: undefined })
    );
  });

  it("passes force: true when specified", async () => {
    const handler = new CloseSessionHandler(mockManager as any);
    await handler.execute({ sessionId: "ses_test_001", force: true }, ctx);
    expect(mockManager.close).toHaveBeenCalledWith(
      "ses_test_001",
      expect.objectContaining({ force: true })
    );
  });

  it("passes quarantineDisposableProfile: true when specified", async () => {
    const handler = new CloseSessionHandler(mockManager as any);
    await handler.execute(
      { sessionId: "ses_test_001", quarantineDisposableProfile: true },
      ctx
    );
    expect(mockManager.close).toHaveBeenCalledWith(
      "ses_test_001",
      expect.objectContaining({ quarantineDisposableProfile: true })
    );
  });

  it("returns sessionId and state: 'closed'", async () => {
    const handler = new CloseSessionHandler(mockManager as any);
    const result = await handler.execute({ sessionId: "ses_test_001" }, ctx);
    expect(result.sessionId).toBe("ses_test_001");
    expect(result.state).toBe("closed");
  });
});
```

Run to verify failure:

```bash
npx vitest run tests/unit/commands/close.test.ts --reporter=verbose 2>&1 | head -20
```

Expected: `Cannot find module '../../../src/commands/close'`

---

### Step 17: Implement CloseSessionHandler

Create `src/commands/close.ts`:

```typescript
import type { CommandHandler, CommandContext } from "./handler";

interface IManager {
  close(
    sessionId: string,
    opts?: { force?: boolean; quarantineDisposableProfile?: boolean }
  ): Promise<void>;
}

export interface CloseInput {
  sessionId: string;
  force?: boolean;
  quarantineDisposableProfile?: boolean;
}

export interface CloseOutput {
  sessionId: string;
  state: "closed";
}

export class CloseSessionHandler implements CommandHandler<CloseInput, CloseOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: CloseInput, _ctx: CommandContext): Promise<CloseOutput> {
    const { sessionId, force, quarantineDisposableProfile } = input;
    await this.manager.close(sessionId, { force, quarantineDisposableProfile });
    return { sessionId, state: "closed" };
  }
}
```

Run close tests:

```bash
npx vitest run tests/unit/commands/close.test.ts --reporter=verbose
```

Expected: all 4 close tests pass.

---

### Step 18: Run all unit tests together

```bash
npm test -- --reporter=verbose
```

Expected: all unit tests across all tasks pass. Look for any import errors or type failures. If TypeScript errors surface at runtime, run:

```bash
npm run typecheck
```

Fix any errors before proceeding to the commit step.

---

### Step 19: Commit

```bash
git add src/commands/handler.ts \
        src/commands/launch.ts \
        src/commands/status.ts \
        src/commands/navigate.ts \
        src/commands/snapshot.ts \
        src/commands/extract.ts \
        src/commands/screenshot.ts \
        src/commands/debug-bundle.ts \
        src/commands/close.ts \
        tests/unit/commands/extract.test.ts \
        tests/unit/commands/snapshot.test.ts \
        tests/unit/commands/launch.test.ts \
        tests/unit/commands/status.test.ts \
        tests/unit/commands/navigate.test.ts \
        tests/unit/commands/screenshot.test.ts \
        tests/unit/commands/debug-bundle.test.ts \
        tests/unit/commands/close.test.ts
git commit -m "feat: add all command handlers with unit tests (Task 9)"
```

---

## Summary of Files

| File | Description |
|------|-------------|
| `src/commands/handler.ts` | `CommandHandler<TIn, TOut>` interface and re-exported `CommandContext` |
| `src/commands/launch.ts` | `LaunchSessionHandler` — delegates to `manager.launch`, returns full `SessionRecord` |
| `src/commands/status.ts` | `GetSessionHandler` and `ListSessionsHandler` — read session state |
| `src/commands/navigate.ts` | `NavigateHandler` — calls `page.goto`, returns `{ pageId, url, status }` |
| `src/commands/snapshot.ts` | `SnapshotHandler` — evaluates body text, links, and meta description |
| `src/commands/extract.ts` | `ExtractHandler` — runs field-by-field CSS selector extraction |
| `src/commands/screenshot.ts` | `ScreenshotHandler` — saves PNG to `debugDir/screenshots/`, returns artifact |
| `src/commands/debug-bundle.ts` | `DebugBundleHandler` — constructs `DebugBundle` and calls `finalize("requested")` |
| `src/commands/close.ts` | `CloseSessionHandler` — calls `manager.close`, returns `{ sessionId, state: "closed" }` |
| `tests/unit/commands/*.test.ts` | Vitest unit tests with mocked `SessionManager` and Playwright objects |

## Notes for Part 4 (Transport)

When wiring command handlers into the HTTP transport in Part 4:

- Instantiate all handlers once at startup and inject them into the route layer.
- `ListSessionsHandler.execute` takes `{}` as input — the route handler should pass an empty object.
- `DebugBundleHandler` requires `paths: FeatherPaths` in addition to `manager` — pass the shared `paths` instance from the service entry point.
- The `manager.get()` call in `GetSessionHandler`, `NavigateHandler`, `SnapshotHandler`, `ExtractHandler`, `ScreenshotHandler`, and `DebugBundleHandler` will throw `{ code: "SESSION_NOT_FOUND" }` when the session does not exist — the transport layer must catch this and return the appropriate error envelope.
- Navigate's `waitUntil` accepts Playwright's `"load" | "domcontentloaded" | "networkidle" | "commit"` — validate this with Zod in the route layer before passing it to the handler.
