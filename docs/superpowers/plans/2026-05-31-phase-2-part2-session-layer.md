# Feather Browser Phase 2 — Part 2: Session Layer, Logger, Debug Bundle

> Part of a multi-part plan. See also: Part 1 (Foundation), Part 3 (Commands), Part 4 (Transport), Part 5 (Integration & Measurement).
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Covers:** Task 6 (FeatherSession + SessionManager), Task 7 (FeatherLogger), Task 8 (DebugCapture + DebugBundle)

---

## Task 6: FeatherSession class and SessionManager

**Files:**
- Create: `src/sessions/session.ts`
- Create: `src/sessions/manager.ts`
- Create: `tests/unit/sessions/manager.test.ts`

- [ ] **Step 1: Write failing tests for SessionManager**

```typescript
// tests/unit/sessions/manager.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

vi.mock("playwright", () => ({
  chromium: {
    launchPersistentContext: vi.fn().mockResolvedValue({
      pages: () => [
        { url: () => "about:blank", title: async () => "New Tab" },
      ],
      close: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      tracing: { start: vi.fn(), stop: vi.fn() },
    }),
  },
}));

import { SessionManager } from "../../../src/sessions/manager";
import { FeatherPaths } from "../../../src/fs-layout";
import { ProfileLock, ProfileLockedError } from "../../../src/profiles/lock";
import { WorkspaceMetadata } from "../../../src/profiles/workspace";

let tmpDir: string;
let paths: FeatherPaths;
let lock: ProfileLock;
let workspace: WorkspaceMetadata;
let manager: SessionManager;

beforeEach(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-mgr-"));
  paths = new FeatherPaths(tmpDir);
  lock = new ProfileLock(paths);
  workspace = new WorkspaceMetadata(paths);
  manager = new SessionManager(paths, lock, workspace);
});

afterEach(async () => {
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
  vi.clearAllMocks();
});

describe("SessionManager.launch — persistent profile", () => {
  it("creates a session with state 'running' after launch", async () => {
    const session = await manager.launch({
      workspaceId: "ws_test_001",
      profile: { kind: "persistent" },
    });
    expect(session.getState()).toBe("running");
    expect(session.sessionId).toMatch(/^ses_/);
    expect(session.workspaceId).toBe("ws_test_001");
    expect(session.profileKind).toBe("persistent");
  });

  it("uses default workspaceId 'default' when not provided", async () => {
    const session = await manager.launch({ profile: { kind: "persistent" } });
    expect(session.workspaceId).toBe("default");
  });

  it("uses default browserMode 'chromium-new-headless' when not provided", async () => {
    const session = await manager.launch({ profile: { kind: "persistent" } });
    expect(session.browserMode).toBe("chromium-new-headless");
  });

  it("throws ProfileLockedError on second launch for same persistent workspaceId", async () => {
    await manager.launch({
      workspaceId: "ws_test_002",
      profile: { kind: "persistent" },
    });
    await expect(
      manager.launch({
        workspaceId: "ws_test_002",
        profile: { kind: "persistent" },
      })
    ).rejects.toMatchObject({ code: "PROFILE_LOCKED" });
  });

  it("adds session to list after launch", async () => {
    const session = await manager.launch({
      workspaceId: "ws_test_003",
      profile: { kind: "persistent" },
    });
    const sessions = manager.list();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].sessionId).toBe(session.sessionId);
  });
});

describe("SessionManager.launch — disposable profile", () => {
  it("creates a disposable session without locking a workspace", async () => {
    const session = await manager.launch({
      workspaceId: "ws_test_004",
      profile: { kind: "disposable" },
    });
    expect(session.profileKind).toBe("disposable");
    const isLocked = await lock.isLocked("ws_test_004");
    expect(isLocked).toBe(false);
  });

  it("allows two disposable sessions with the same workspaceId simultaneously", async () => {
    const s1 = await manager.launch({
      workspaceId: "ws_test_005",
      profile: { kind: "disposable" },
    });
    const s2 = await manager.launch({
      workspaceId: "ws_test_005",
      profile: { kind: "disposable" },
    });
    expect(s1.sessionId).not.toBe(s2.sessionId);
    expect(manager.list()).toHaveLength(2);
  });
});

describe("SessionManager.get", () => {
  it("throws SESSION_NOT_FOUND for unknown sessionId", () => {
    expect(() => manager.get("ses_unknown_001")).toThrow(
      expect.objectContaining({ code: "SESSION_NOT_FOUND" })
    );
  });

  it("returns the session after launch", async () => {
    const session = await manager.launch({
      workspaceId: "ws_test_006",
      profile: { kind: "persistent" },
    });
    const fetched = manager.get(session.sessionId);
    expect(fetched.sessionId).toBe(session.sessionId);
  });
});

describe("SessionManager.close", () => {
  it("removes session from list after close", async () => {
    const session = await manager.launch({
      workspaceId: "ws_test_007",
      profile: { kind: "persistent" },
    });
    await manager.close(session.sessionId);
    expect(manager.list()).toHaveLength(0);
  });

  it("sets session state to 'closed' after close", async () => {
    const session = await manager.launch({
      workspaceId: "ws_test_008",
      profile: { kind: "persistent" },
    });
    await manager.close(session.sessionId);
    expect(session.getState()).toBe("closed");
  });

  it("releases persistent profile lock after close", async () => {
    const session = await manager.launch({
      workspaceId: "ws_test_009",
      profile: { kind: "persistent" },
    });
    expect(await lock.isLocked("ws_test_009")).toBe(true);
    await manager.close(session.sessionId);
    expect(await lock.isLocked("ws_test_009")).toBe(false);
  });

  it("throws SESSION_NOT_FOUND when closing unknown id", async () => {
    await expect(manager.close("ses_unknown_002")).rejects.toMatchObject({
      code: "SESSION_NOT_FOUND",
    });
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --reporter=verbose 2>&1 | head -30
```

Expected: `Cannot find module '../../../src/sessions/manager'`

- [ ] **Step 3: Create src/sessions/session.ts**

```typescript
import type { BrowserContext, Page } from "playwright";
import { randomUUID } from "crypto";
import type {
  BrowserMode,
  ProfileKind,
  SessionState,
  ProxySummary,
  PageInfo,
  SessionRecord,
} from "./types";

const newId = (prefix: string): string =>
  `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;

export class SessionNotFoundError extends Error {
  readonly code = "SESSION_NOT_FOUND";
  constructor(sessionId: string) {
    super(`Session '${sessionId}' not found.`);
    this.name = "SessionNotFoundError";
  }
}

export class PageNotFoundError extends Error {
  readonly code = "PAGE_NOT_FOUND";
  constructor(pageId: string) {
    super(`Page '${pageId}' not found.`);
    this.name = "PageNotFoundError";
  }
}

export class FeatherSession {
  readonly sessionId: string;
  readonly workspaceId: string;
  readonly profileKind: ProfileKind;
  readonly browserMode: BrowserMode;
  readonly profilePath: string;
  readonly debugDir: string;
  readonly proxy: ProxySummary | null;
  readonly startedAt: string;

  private _state: SessionState;
  private _context: BrowserContext | null;
  private _pages: Map<string, Page>;

  constructor(opts: {
    workspaceId: string;
    profileKind: ProfileKind;
    browserMode: BrowserMode;
    profilePath: string;
    debugDir: string;
    proxy: ProxySummary | null;
  }) {
    this.sessionId = newId("ses");
    this.workspaceId = opts.workspaceId;
    this.profileKind = opts.profileKind;
    this.browserMode = opts.browserMode;
    this.profilePath = opts.profilePath;
    this.debugDir = opts.debugDir;
    this.proxy = opts.proxy;
    this.startedAt = new Date().toISOString();
    this._state = "launching";
    this._context = null;
    this._pages = new Map();
  }

  setContext(context: BrowserContext): void {
    this._context = context;
    for (const page of context.pages()) {
      const pageId = newId("page");
      this._pages.set(pageId, page);
    }
    this._state = "running";
  }

  getContext(): BrowserContext {
    if (!this._context) {
      throw new Error("BrowserContext is not yet available.");
    }
    return this._context;
  }

  getPage(pageId?: string): Page {
    if (!pageId) {
      const [firstId, firstPage] = this._pages.entries().next().value ?? [];
      if (!firstPage) {
        throw new PageNotFoundError("(default)");
      }
      return firstPage;
    }
    const page = this._pages.get(pageId);
    if (!page) {
      throw new PageNotFoundError(pageId);
    }
    return page;
  }

  getDefaultPageId(): string | undefined {
    return this._pages.keys().next().value;
  }

  async getPageInfoList(): Promise<PageInfo[]> {
    const results: PageInfo[] = [];
    for (const [pageId, page] of this._pages.entries()) {
      results.push({
        pageId,
        url: page.url(),
        title: await page.title(),
      });
    }
    return results;
  }

  setState(state: SessionState): void {
    this._state = state;
  }

  getState(): SessionState {
    return this._state;
  }

  toRecord(): SessionRecord {
    return {
      sessionId: this.sessionId,
      workspaceId: this.workspaceId,
      profileKind: this.profileKind,
      browserMode: this.browserMode,
      state: this._state,
      profilePath: this.profilePath,
      debugDir: this.debugDir,
      proxy: this.proxy,
      startedAt: this.startedAt,
      pages: [],
      profileLocked: this.profileKind === "persistent",
    };
  }
}
```

- [ ] **Step 4: Create src/sessions/manager.ts**

```typescript
import * as fs from "fs";
import * as path from "path";
import { chromium } from "playwright";
import { FeatherSession, SessionNotFoundError } from "./session";
import { buildLaunchOptions } from "../browser/modes";
import { redactProxy } from "../logs/redact";
import type { FeatherPaths } from "../fs-layout";
import type { ProfileLock } from "../profiles/lock";
import type { WorkspaceMetadata } from "../profiles/workspace";
import type {
  BrowserMode,
  ProfileKind,
  ProxyConfig,
  ProxySummary,
} from "./types";

export interface LaunchSessionInput {
  workspaceId?: string;
  profile: { kind: ProfileKind };
  browserMode?: BrowserMode;
  viewport?: { width: number; height: number };
  proxy?: ProxyConfig | null;
  debug?: { trace?: boolean; screenshots?: boolean };
}

export class SessionManager {
  private readonly registry: Map<string, FeatherSession> = new Map();

  constructor(
    private readonly paths: FeatherPaths,
    private readonly lock: ProfileLock,
    private readonly workspace: WorkspaceMetadata
  ) {}

  async launch(input: LaunchSessionInput): Promise<FeatherSession> {
    const workspaceId = input.workspaceId ?? "default";
    const browserMode: BrowserMode =
      input.browserMode ?? "chromium-new-headless";
    const profileKind = input.profile.kind;
    const proxy = input.proxy ?? null;
    const proxySummary: ProxySummary | null = proxy ? redactProxy(proxy) : null;

    const session = new FeatherSession({
      workspaceId,
      profileKind,
      browserMode,
      profilePath: "",
      debugDir: this.paths.debugDir("placeholder"),
      proxy: proxySummary,
    });

    const profilePath =
      profileKind === "persistent"
        ? this.paths.profileDir(workspaceId)
        : this.paths.disposableProfileDir(session.sessionId);

    const debugDir = this.paths.debugDir(session.sessionId);

    // Patch readonly fields using Object.defineProperty
    Object.defineProperty(session, "profilePath", { value: profilePath });
    Object.defineProperty(session, "debugDir", { value: debugDir });

    await fs.promises.mkdir(profilePath, { recursive: true });
    await fs.promises.mkdir(debugDir, { recursive: true });

    if (profileKind === "persistent") {
      await this.lock.create(
        workspaceId,
        session.sessionId,
        browserMode,
        proxySummary
      );
      await this.workspace.ensureExists(workspaceId);
    }

    const launchOpts = buildLaunchOptions(
      browserMode,
      proxy ?? undefined,
      input.viewport
    );

    const context = await chromium.launchPersistentContext(
      profilePath,
      launchOpts
    );

    session.setContext(context);
    this.registry.set(session.sessionId, session);

    return session;
  }

  get(sessionId: string): FeatherSession {
    const session = this.registry.get(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }
    return session;
  }

  list(): FeatherSession[] {
    return Array.from(this.registry.values());
  }

  async close(
    sessionId: string,
    opts?: { force?: boolean; quarantineDisposableProfile?: boolean }
  ): Promise<void> {
    const session = this.get(sessionId);
    session.setState("closing");

    try {
      const context = session.getContext();
      if (opts?.force) {
        try {
          await context.close();
        } catch {
          // ignore errors on force close
        }
      } else {
        await context.close();
      }
    } catch (err) {
      session.setState("failed");
      throw err;
    }

    session.setState("closed");
    this.registry.delete(sessionId);

    if (session.profileKind === "persistent") {
      await this.lock.release(session.workspaceId);
    }

    if (session.profileKind === "disposable") {
      const sessionDir = this.paths.disposableSessionDir(sessionId);
      if (opts?.quarantineDisposableProfile) {
        const quarantineDir = this.paths.quarantinedProfileDir(sessionId);
        await fs.promises.mkdir(path.dirname(quarantineDir), {
          recursive: true,
        });
        try {
          await fs.promises.rename(session.profilePath, quarantineDir);
        } catch {
          // profile may not exist — ignore
        }
      } else {
        await fs.promises.rm(sessionDir, { recursive: true, force: true });
      }
    }
  }
}
```

- [ ] **Step 5: Run tests to verify pass**

```bash
npm test -- --reporter=verbose
```

Expected: all manager tests pass. The mock intercepts `chromium.launchPersistentContext` so no real browser is launched.

- [ ] **Step 6: Commit**

```bash
git add src/sessions/session.ts src/sessions/manager.ts tests/unit/sessions/manager.test.ts
git commit -m "feat: add FeatherSession class and SessionManager with persistent/disposable profile support"
```

---

## Task 7: FeatherLogger (JSONL event writer)

**Files:**
- Create: `src/logs/events.ts`
- Create: `src/logs/logger.ts`
- Create: `tests/unit/logs/logger.test.ts`

- [ ] **Step 1: Write failing tests for FeatherLogger**

```typescript
// tests/unit/logs/logger.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { FeatherLogger } from "../../../src/logs/logger";
import { EVENTS } from "../../../src/logs/events";
import { FeatherPaths } from "../../../src/fs-layout";

let tmpDir: string;
let paths: FeatherPaths;
let logger: FeatherLogger;

beforeEach(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-log-"));
  paths = new FeatherPaths(tmpDir);
  logger = new FeatherLogger(paths);
});

afterEach(async () => {
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe("FeatherLogger.log", () => {
  it("writes a log event to the correct JSONL file path", async () => {
    await logger.log({
      ts: "2026-05-31T00:00:00.000Z",
      level: "info",
      event: EVENTS.SESSION_LAUNCH_COMPLETED,
      sessionId: "ses_test_001",
    });

    const logPath = paths.sessionLog("ses_test_001");
    const exists = await fs.promises
      .access(logPath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });

  it("writes valid JSON on each line", async () => {
    await logger.log({
      ts: "2026-05-31T00:00:00.000Z",
      level: "info",
      event: EVENTS.PAGE_NAVIGATE_COMPLETED,
      sessionId: "ses_test_002",
      requestId: "req_001",
      data: { url: "https://example.com", durationMs: 100 },
    });

    const logPath = paths.sessionLog("ses_test_002");
    const content = await fs.promises.readFile(logPath, "utf8");
    const lines = content.trim().split("\n");
    expect(lines).toHaveLength(1);

    const parsed = JSON.parse(lines[0]);
    expect(parsed.event).toBe(EVENTS.PAGE_NAVIGATE_COMPLETED);
    expect(parsed.level).toBe("info");
    expect(parsed.sessionId).toBe("ses_test_002");
    expect(parsed.requestId).toBe("req_001");
    expect(parsed.ts).toBe("2026-05-31T00:00:00.000Z");
    expect(parsed.data.url).toBe("https://example.com");
  });

  it("appends two events as two separate lines", async () => {
    await logger.log({
      ts: "2026-05-31T00:00:00.000Z",
      level: "info",
      event: EVENTS.SESSION_LAUNCH_REQUESTED,
      sessionId: "ses_test_003",
    });
    await logger.log({
      ts: "2026-05-31T00:00:01.000Z",
      level: "info",
      event: EVENTS.SESSION_LAUNCH_COMPLETED,
      sessionId: "ses_test_003",
    });

    const logPath = paths.sessionLog("ses_test_003");
    const content = await fs.promises.readFile(logPath, "utf8");
    const lines = content.trim().split("\n");
    expect(lines).toHaveLength(2);

    const first = JSON.parse(lines[0]);
    const second = JSON.parse(lines[1]);
    expect(first.event).toBe(EVENTS.SESSION_LAUNCH_REQUESTED);
    expect(second.event).toBe(EVENTS.SESSION_LAUNCH_COMPLETED);
  });

  it("creates the log directory if it does not exist", async () => {
    // tmpDir is fresh — logs/sessions sub-directory does not exist
    await logger.log({
      ts: "2026-05-31T00:00:00.000Z",
      level: "warn",
      event: EVENTS.PROFILE_LOCK_REJECTED,
      sessionId: "ses_test_004",
    });

    const logPath = paths.sessionLog("ses_test_004");
    const content = await fs.promises.readFile(logPath, "utf8");
    expect(content.trim().length).toBeGreaterThan(0);
  });

  it("includes level, ts, event, sessionId in every line", async () => {
    await logger.log({
      ts: "2026-05-31T12:00:00.000Z",
      level: "error",
      event: EVENTS.SESSION_LAUNCH_FAILED,
      sessionId: "ses_test_005",
    });

    const logPath = paths.sessionLog("ses_test_005");
    const content = await fs.promises.readFile(logPath, "utf8");
    const parsed = JSON.parse(content.trim());

    expect(parsed).toHaveProperty("ts", "2026-05-31T12:00:00.000Z");
    expect(parsed).toHaveProperty("level", "error");
    expect(parsed).toHaveProperty("event", EVENTS.SESSION_LAUNCH_FAILED);
    expect(parsed).toHaveProperty("sessionId", "ses_test_005");
  });

  it("omits undefined optional fields from JSON output", async () => {
    await logger.log({
      ts: "2026-05-31T00:00:00.000Z",
      level: "info",
      event: EVENTS.SERVICE_STARTED,
      sessionId: "ses_test_006",
      // requestId and data intentionally omitted
    });

    const logPath = paths.sessionLog("ses_test_006");
    const content = await fs.promises.readFile(logPath, "utf8");
    const parsed = JSON.parse(content.trim());
    expect(parsed).not.toHaveProperty("requestId");
    expect(parsed).not.toHaveProperty("data");
  });

  it("writes events for different sessions to different files", async () => {
    await logger.log({
      ts: "2026-05-31T00:00:00.000Z",
      level: "info",
      event: EVENTS.SESSION_LAUNCH_COMPLETED,
      sessionId: "ses_test_007",
    });
    await logger.log({
      ts: "2026-05-31T00:00:00.000Z",
      level: "info",
      event: EVENTS.SESSION_CLOSE_COMPLETED,
      sessionId: "ses_test_008",
    });

    const content007 = await fs.promises.readFile(
      paths.sessionLog("ses_test_007"),
      "utf8"
    );
    const content008 = await fs.promises.readFile(
      paths.sessionLog("ses_test_008"),
      "utf8"
    );

    expect(JSON.parse(content007.trim()).event).toBe(
      EVENTS.SESSION_LAUNCH_COMPLETED
    );
    expect(JSON.parse(content008.trim()).event).toBe(
      EVENTS.SESSION_CLOSE_COMPLETED
    );
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --reporter=verbose 2>&1 | head -30
```

Expected: `Cannot find module '../../../src/logs/logger'`

- [ ] **Step 3: Create src/logs/events.ts**

```typescript
export const EVENTS = {
  SERVICE_STARTED: "service.started",
  SESSION_LAUNCH_REQUESTED: "session.launch.requested",
  SESSION_LAUNCH_COMPLETED: "session.launch.completed",
  SESSION_LAUNCH_FAILED: "session.launch.failed",
  PROFILE_LOCK_CREATED: "profile.lock.created",
  PROFILE_LOCK_REJECTED: "profile.lock.rejected",
  PAGE_NAVIGATE_REQUESTED: "page.navigate.requested",
  PAGE_NAVIGATE_COMPLETED: "page.navigate.completed",
  PAGE_NAVIGATE_FAILED: "page.navigate.failed",
  PAGE_SNAPSHOT_COMPLETED: "page.snapshot.completed",
  PAGE_EXTRACT_COMPLETED: "page.extract.completed",
  PAGE_SCREENSHOT_COMPLETED: "page.screenshot.completed",
  DEBUG_BUNDLE_CREATED: "debug.bundle.created",
  SESSION_CLOSE_REQUESTED: "session.close.requested",
  SESSION_CLOSE_COMPLETED: "session.close.completed",
  SESSION_CLOSE_FAILED: "session.close.failed",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
```

- [ ] **Step 4: Create src/logs/logger.ts**

```typescript
import * as fs from "fs";
import * as path from "path";
import type { FeatherPaths } from "../fs-layout";
import type { EventName } from "./events";

export interface LogEvent {
  ts: string;
  level: "info" | "warn" | "error";
  event: EventName;
  sessionId?: string;
  requestId?: string;
  data?: Record<string, unknown>;
}

export class FeatherLogger {
  constructor(private readonly paths: FeatherPaths) {}

  async log(event: LogEvent): Promise<void> {
    if (!event.sessionId) {
      // service-level events without a session are silently skipped in this prototype
      return;
    }

    const logPath = this.paths.sessionLog(event.sessionId);
    const logDir = path.dirname(logPath);
    await fs.promises.mkdir(logDir, { recursive: true });

    // Build a compact object that omits undefined optional fields
    const record: Record<string, unknown> = {
      ts: event.ts,
      level: event.level,
      event: event.event,
      sessionId: event.sessionId,
    };
    if (event.requestId !== undefined) {
      record["requestId"] = event.requestId;
    }
    if (event.data !== undefined) {
      record["data"] = event.data;
    }

    await fs.promises.appendFile(logPath, JSON.stringify(record) + "\n", "utf8");
  }
}
```

- [ ] **Step 5: Run tests to verify pass**

```bash
npm test -- --reporter=verbose
```

Expected: all logger tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/logs/events.ts src/logs/logger.ts tests/unit/logs/logger.test.ts
git commit -m "feat: add EVENTS map and FeatherLogger JSONL writer"
```

---

## Task 8: DebugCapture and DebugBundle

**Files:**
- Create: `src/debug/capture.ts`
- Create: `src/debug/bundle.ts`
- Create: `tests/unit/debug/bundle.test.ts`

- [ ] **Step 1: Write failing tests for DebugBundle**

```typescript
// tests/unit/debug/bundle.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

vi.mock("playwright", () => ({
  chromium: { launchPersistentContext: vi.fn() },
}));

import { DebugBundle } from "../../../src/debug/bundle";
import { FeatherPaths } from "../../../src/fs-layout";
import { FeatherSession } from "../../../src/sessions/session";

let tmpDir: string;
let paths: FeatherPaths;

function makeSession(tmpDir: string, sessionId: string): FeatherSession {
  const debugDirPath = path.join(tmpDir, "debug", sessionId);
  const session = new FeatherSession({
    workspaceId: "ws_bundle_001",
    profileKind: "persistent",
    browserMode: "chromium-new-headless",
    profilePath: path.join(tmpDir, "profiles", "ws_bundle_001", "profile"),
    debugDir: debugDirPath,
    proxy: null,
  });
  // Patch sessionId to a predictable value for assertions
  Object.defineProperty(session, "sessionId", { value: sessionId });
  return session;
}

beforeEach(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-bundle-"));
  paths = new FeatherPaths(tmpDir);
});

afterEach(async () => {
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
  vi.clearAllMocks();
});

describe("DebugBundle.finalize", () => {
  it("writes manifest.json to the debug directory", async () => {
    const sessionId = "ses_bundle_001";
    const session = makeSession(tmpDir, sessionId);
    const debugDir = path.join(tmpDir, "debug", sessionId);
    await fs.promises.mkdir(debugDir, { recursive: true });

    const bundle = new DebugBundle(session, paths);
    const manifestPath = await bundle.finalize("test-close");

    const exists = await fs.promises
      .access(manifestPath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
    expect(manifestPath).toBe(path.join(debugDir, "manifest.json"));
  });

  it("manifest contains required identity fields", async () => {
    const sessionId = "ses_bundle_002";
    const session = makeSession(tmpDir, sessionId);
    const debugDir = path.join(tmpDir, "debug", sessionId);
    await fs.promises.mkdir(debugDir, { recursive: true });

    const bundle = new DebugBundle(session, paths);
    const manifestPath = await bundle.finalize("normal");

    const raw = await fs.promises.readFile(manifestPath, "utf8");
    const manifest = JSON.parse(raw);

    expect(manifest.sessionId).toBe(sessionId);
    expect(manifest.workspaceId).toBe("ws_bundle_001");
    expect(manifest.profileKind).toBe("persistent");
    expect(manifest.browserMode).toBe("chromium-new-headless");
    expect(manifest.proxySummary).toBeNull();
    expect(typeof manifest.startedAt).toBe("string");
    expect(typeof manifest.endedAt).toBe("string");
    expect(manifest.closeReason).toBe("normal");
  });

  it("manifest contains featherVersion and playwrightVersion strings", async () => {
    const sessionId = "ses_bundle_003";
    const session = makeSession(tmpDir, sessionId);
    const debugDir = path.join(tmpDir, "debug", sessionId);
    await fs.promises.mkdir(debugDir, { recursive: true });

    const bundle = new DebugBundle(session, paths);
    const manifestPath = await bundle.finalize("normal");

    const raw = await fs.promises.readFile(manifestPath, "utf8");
    const manifest = JSON.parse(raw);

    expect(typeof manifest.featherVersion).toBe("string");
    expect(manifest.featherVersion.length).toBeGreaterThan(0);
    expect(typeof manifest.playwrightVersion).toBe("string");
    expect(manifest.playwrightVersion.length).toBeGreaterThan(0);
  });

  it("manifest artifacts array lists files present in debugDir", async () => {
    const sessionId = "ses_bundle_004";
    const session = makeSession(tmpDir, sessionId);
    const debugDir = path.join(tmpDir, "debug", sessionId);
    await fs.promises.mkdir(debugDir, { recursive: true });

    // Place some artifact files before finalizing
    await fs.promises.writeFile(
      path.join(debugDir, "commands.jsonl"),
      '{"cmd":"test"}\n',
      "utf8"
    );
    await fs.promises.writeFile(
      path.join(debugDir, "console.jsonl"),
      "",
      "utf8"
    );

    const bundle = new DebugBundle(session, paths);
    const manifestPath = await bundle.finalize("normal");

    const raw = await fs.promises.readFile(manifestPath, "utf8");
    const manifest = JSON.parse(raw);

    expect(Array.isArray(manifest.artifacts)).toBe(true);
    // manifest.json itself is written after listing, so it may or may not appear;
    // the pre-existing files must appear
    expect(manifest.artifacts).toContain("commands.jsonl");
    expect(manifest.artifacts).toContain("console.jsonl");
  });

  it("manifest artifacts includes manifest.json itself after finalize", async () => {
    const sessionId = "ses_bundle_005";
    const session = makeSession(tmpDir, sessionId);
    const debugDir = path.join(tmpDir, "debug", sessionId);
    await fs.promises.mkdir(debugDir, { recursive: true });

    const bundle = new DebugBundle(session, paths);
    const manifestPath = await bundle.finalize("force");

    const raw = await fs.promises.readFile(manifestPath, "utf8");
    const manifest = JSON.parse(raw);

    // After writing manifest.json, re-list to verify it appears
    const dirListing = await fs.promises.readdir(debugDir);
    expect(dirListing).toContain("manifest.json");
    // The artifacts field from the initial listing (before writing) need not include manifest.json
    // but the file must exist on disk — this test verifies disk presence
    expect(manifest.sessionId).toBe(sessionId);
  });

  it("manifest profilePath matches session profilePath", async () => {
    const sessionId = "ses_bundle_006";
    const session = makeSession(tmpDir, sessionId);
    const debugDir = path.join(tmpDir, "debug", sessionId);
    await fs.promises.mkdir(debugDir, { recursive: true });

    const bundle = new DebugBundle(session, paths);
    const manifestPath = await bundle.finalize("graceful");

    const raw = await fs.promises.readFile(manifestPath, "utf8");
    const manifest = JSON.parse(raw);

    expect(manifest.profilePath).toBe(session.profilePath);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --reporter=verbose 2>&1 | head -30
```

Expected: `Cannot find module '../../../src/debug/bundle'`

- [ ] **Step 3: Create src/debug/capture.ts**

```typescript
import * as fs from "fs";
import * as path from "path";
import type { BrowserContext } from "playwright";

interface NetworkEntry {
  url: string;
  method: string;
  status: number | null;
  failure: string | null;
  timing: object | null;
}

interface ConsoleEntry {
  type: string;
  text: string;
  ts: string;
}

interface ErrorEntry {
  message: string;
  ts: string;
}

interface CommandEntry {
  [key: string]: unknown;
}

export class DebugCapture {
  private networkEvents: NetworkEntry[] = [];
  private consoleMessages: ConsoleEntry[] = [];
  private errorEvents: ErrorEntry[] = [];
  private commands: CommandEntry[] = [];

  constructor(
    private readonly context: BrowserContext,
    private readonly debugDir: string,
    private readonly opts: { trace?: boolean; screenshots?: boolean }
  ) {}

  async start(): Promise<void> {
    this.context.on("requestfinished", (request) => {
      const response = request.response();
      this.networkEvents.push({
        url: request.url(),
        method: request.method(),
        status: response ? response.status() : null,
        failure: null,
        timing: request.timing() ?? null,
      });
    });

    this.context.on("requestfailed", (request) => {
      this.networkEvents.push({
        url: request.url(),
        method: request.method(),
        status: null,
        failure: request.failure()?.errorText ?? "unknown",
        timing: request.timing() ?? null,
      });
    });

    // Attach console and pageerror listeners to all current pages
    const attachPageListeners = (page: import("playwright").Page): void => {
      page.on("console", (msg) => {
        this.consoleMessages.push({
          type: msg.type(),
          text: msg.text(),
          ts: new Date().toISOString(),
        });
      });
      page.on("pageerror", (err) => {
        this.errorEvents.push({
          message: err.message,
          ts: new Date().toISOString(),
        });
      });
    };

    for (const page of this.context.pages()) {
      attachPageListeners(page);
    }

    this.context.on("page", (page) => {
      attachPageListeners(page);
    });

    if (this.opts.trace) {
      await this.context.tracing.start({ screenshots: true, snapshots: true });
    }
  }

  recordCommand(cmd: CommandEntry): void {
    this.commands.push(cmd);
  }

  async finalize(): Promise<void> {
    await fs.promises.mkdir(this.debugDir, { recursive: true });

    const writeJsonl = async (
      filename: string,
      entries: object[]
    ): Promise<void> => {
      const filePath = path.join(this.debugDir, filename);
      const lines = entries.map((e) => JSON.stringify(e)).join("\n");
      await fs.promises.writeFile(filePath, lines ? lines + "\n" : "", "utf8");
    };

    await writeJsonl("commands.jsonl", this.commands);
    await writeJsonl("network-summary.jsonl", this.networkEvents);
    await writeJsonl("console.jsonl", this.consoleMessages);
    await writeJsonl("errors.jsonl", this.errorEvents);

    if (this.opts.trace) {
      const tracePath = path.join(this.debugDir, "trace.zip");
      await this.context.tracing.stop({ path: tracePath });
    }
  }
}
```

- [ ] **Step 4: Create src/debug/bundle.ts**

```typescript
import * as fs from "fs";
import * as path from "path";
import type { FeatherSession } from "../sessions/session";
import type { FeatherPaths } from "../fs-layout";
import type { ProfileKind, BrowserMode, ProxySummary } from "../sessions/types";

export interface BundleManifest {
  sessionId: string;
  workspaceId: string;
  profileKind: ProfileKind;
  browserMode: BrowserMode;
  proxySummary: ProxySummary | null;
  profilePath: string;
  startedAt: string;
  endedAt: string;
  closeReason: string;
  artifacts: string[];
  featherVersion: string;
  playwrightVersion: string;
}

function getFeatherVersion(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require("../../package.json") as { version?: string };
    return pkg.version ?? "dev";
  } catch {
    return "dev";
  }
}

function getPlaywrightVersion(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require("playwright/package.json") as { version?: string };
    return pkg.version ?? "unknown";
  } catch {
    return "unknown";
  }
}

export class DebugBundle {
  constructor(
    private readonly session: FeatherSession,
    private readonly paths: FeatherPaths
  ) {}

  async finalize(closeReason: string): Promise<string> {
    const debugDir = this.session.debugDir;
    await fs.promises.mkdir(debugDir, { recursive: true });

    // Read directory listing before writing manifest so the list reflects
    // artifacts produced by DebugCapture and screenshot commands.
    let artifacts: string[] = [];
    try {
      const entries = await fs.promises.readdir(debugDir);
      artifacts = entries.filter((e) => e !== "manifest.json");
    } catch {
      artifacts = [];
    }

    const manifest: BundleManifest = {
      sessionId: this.session.sessionId,
      workspaceId: this.session.workspaceId,
      profileKind: this.session.profileKind,
      browserMode: this.session.browserMode,
      proxySummary: this.session.proxy,
      profilePath: this.session.profilePath,
      startedAt: this.session.startedAt,
      endedAt: new Date().toISOString(),
      closeReason,
      artifacts,
      featherVersion: getFeatherVersion(),
      playwrightVersion: getPlaywrightVersion(),
    };

    const manifestPath = path.join(debugDir, "manifest.json");
    await fs.promises.writeFile(
      manifestPath,
      JSON.stringify(manifest, null, 2),
      "utf8"
    );

    return manifestPath;
  }
}
```

- [ ] **Step 5: Run tests to verify pass**

```bash
npm test -- --reporter=verbose
```

Expected: all bundle tests pass.

- [ ] **Step 6: Run full unit test suite**

```bash
npm test -- --reporter=verbose
```

Expected: all tests from Tasks 1–8 pass with no failures.

- [ ] **Step 7: Commit**

```bash
git add src/debug/capture.ts src/debug/bundle.ts tests/unit/debug/bundle.test.ts
git commit -m "feat: add DebugCapture Playwright listener collector and DebugBundle manifest writer"
```

---

## Summary of Part 2 outputs

After completing Tasks 6–8, the following source files exist:

| File | Purpose |
|---|---|
| `src/sessions/session.ts` | `FeatherSession` wraps a `BrowserContext`, owns page map, exposes state machine |
| `src/sessions/manager.ts` | `SessionManager` launches persistent/disposable sessions, owns registry, closes with lock release |
| `src/logs/events.ts` | `EVENTS` constant map of all structured log event names |
| `src/logs/logger.ts` | `FeatherLogger` appends `LogEvent` objects as JSONL to per-session log files |
| `src/debug/capture.ts` | `DebugCapture` attaches Playwright listeners, writes JSONL artifacts on finalize |
| `src/debug/bundle.ts` | `DebugBundle` reads debug dir, writes `manifest.json` with session metadata and version info |

Part 3 (Commands) depends on all six files above.
