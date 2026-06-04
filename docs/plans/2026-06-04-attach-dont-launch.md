# Attach-Don't-Launch (Task #2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `"chromium-headed-cdp"` launch mode that spawns Chromium without automation flags and connects via CDP, so `navigator.webdriver` is `false` and bot-detection systems don't block the session.

**Architecture:** A new `spawnAndConnect()` function in `src/browser/modes.ts` handles spawn + CDP connection. `FeatherSession` gains a `_childProcess` field so `SessionManager.close()` can kill the process on teardown. The existing headless launch paths are untouched.

**Tech Stack:** Node.js `child_process.spawn`, Playwright `chromium.connectOverCDP`, Vitest (unit: mocked; integration: real Chromium).

**Spec:** `docs/specs/2026-06-04-attach-dont-launch-design.md`

---

### Task 1: Add `"chromium-headed-cdp"` to BrowserMode

**Files:**
- Modify: `src/sessions/types.ts:3`

- [ ] **Step 1: Update the BrowserMode union**

In `src/sessions/types.ts`, change line 3:

```typescript
export type BrowserMode = "chromium-new-headless" | "chromium-headless-shell" | "chromium-headed-cdp";
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/sessions/types.ts
git commit -m "feat(types): add chromium-headed-cdp browser mode"
```

---

### Task 2: Add `spawnAndConnect()` to `modes.ts` — TDD

**Files:**
- Modify: `src/browser/modes.ts`
- Modify: `tests/unit/browser/modes.test.ts`

- [ ] **Step 1: Write failing tests**

Replace the entire contents of `tests/unit/browser/modes.test.ts` with:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "events";

vi.mock("child_process", () => ({ spawn: vi.fn() }));
vi.mock("playwright", () => ({
  chromium: {
    connectOverCDP: vi.fn(),
  },
}));

import { buildLaunchOptions, spawnAndConnect } from "../../../src/browser/modes";
import { spawn } from "child_process";
import { chromium } from "playwright";

describe("buildLaunchOptions", () => {
  it("chromium-new-headless sets channel chromium and headless true", () => {
    const opts = buildLaunchOptions("chromium-new-headless");
    expect(opts.channel).toBe("chromium");
    expect(opts.headless).toBe(true);
  });

  it("chromium-headless-shell does not set channel", () => {
    const opts = buildLaunchOptions("chromium-headless-shell");
    expect(opts.channel).toBeUndefined();
    expect(opts.headless).toBe(true);
  });

  it("applies proxy when provided", () => {
    const opts = buildLaunchOptions("chromium-new-headless", {
      server: "http://127.0.0.1:8080",
      username: "u",
      password: "p",
      bypass: "localhost",
    });
    expect(opts.proxy).toEqual({
      server: "http://127.0.0.1:8080",
      username: "u",
      password: "p",
      bypass: "localhost",
    });
  });

  it("applies viewport when provided", () => {
    const opts = buildLaunchOptions("chromium-new-headless", undefined, { width: 1280, height: 800 });
    expect(opts.viewport).toEqual({ width: 1280, height: 800 });
  });

  it("uses default viewport 1280x800 when not provided", () => {
    const opts = buildLaunchOptions("chromium-new-headless");
    expect(opts.viewport).toEqual({ width: 1280, height: 800 });
  });
});

describe("spawnAndConnect", () => {
  let mockStderr: EventEmitter;
  let mockProcess: any;
  let mockContext: any;
  let mockBrowser: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStderr = new EventEmitter();
    mockProcess = Object.assign(new EventEmitter(), {
      stderr: mockStderr,
      kill: vi.fn(),
    });
    mockContext = {};
    mockBrowser = { contexts: vi.fn().mockReturnValue([mockContext]) };
    vi.mocked(spawn).mockReturnValue(mockProcess as any);
    vi.mocked(chromium.connectOverCDP).mockResolvedValue(mockBrowser as any);
  });

  it("spawns with no automation flags and correct user-data-dir", async () => {
    setImmediate(() => {
      mockStderr.emit(
        "data",
        Buffer.from("DevTools listening on ws://127.0.0.1:9222/devtools/browser/abc\n")
      );
    });

    await spawnAndConnect({ profilePath: "/tmp/profile", executablePath: "/usr/bin/chrome" });

    const [, spawnArgs] = vi.mocked(spawn).mock.calls[0];
    expect(spawnArgs).toContain("--remote-debugging-port=0");
    expect(spawnArgs).toContain("--user-data-dir=/tmp/profile");
    expect(spawnArgs).toContain("--ozone-platform=wayland");
    expect(spawnArgs).not.toContain("--enable-automation");
    expect(spawnArgs).not.toContain("--headless");
  });

  it("passes the CDP websocket URL from stderr to connectOverCDP", async () => {
    const wsEndpoint = "ws://127.0.0.1:9222/devtools/browser/abc";
    setImmediate(() => {
      mockStderr.emit("data", Buffer.from(`DevTools listening on ${wsEndpoint}\n`));
    });

    await spawnAndConnect({ profilePath: "/tmp/profile", executablePath: "/usr/bin/chrome" });

    expect(chromium.connectOverCDP).toHaveBeenCalledWith(wsEndpoint);
  });

  it("returns the first browser context and the child process", async () => {
    setImmediate(() => {
      mockStderr.emit(
        "data",
        Buffer.from("DevTools listening on ws://127.0.0.1:9222/devtools/browser/abc\n")
      );
    });

    const result = await spawnAndConnect({ profilePath: "/tmp/profile", executablePath: "/usr/bin/chrome" });

    expect(result.context).toBe(mockContext);
    expect(result.childProcess).toBe(mockProcess);
  });

  it("rejects and kills the process when CDP message does not appear within 10s", async () => {
    vi.useFakeTimers();
    try {
      const promise = spawnAndConnect({ profilePath: "/tmp/profile", executablePath: "/usr/bin/chrome" });
      await vi.advanceTimersByTimeAsync(10_001);
      await expect(promise).rejects.toThrow("did not expose CDP");
      expect(mockProcess.kill).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --reporter=verbose tests/unit/browser/modes.test.ts
```

Expected: `spawnAndConnect` tests fail with "spawnAndConnect is not a function" or similar. `buildLaunchOptions` tests still pass.

- [ ] **Step 3: Implement `spawnAndConnect` in `modes.ts`**

Replace the entire contents of `src/browser/modes.ts` with:

```typescript
import { spawn, type ChildProcess } from "child_process";
import { chromium, type BrowserContext, type BrowserContextOptions } from "playwright";
import type { BrowserMode, ProxyConfig } from "../sessions/types";

type LaunchOptions = BrowserContextOptions & { channel?: string; headless?: boolean };

export function buildLaunchOptions(
  mode: BrowserMode,
  proxy?: ProxyConfig | null,
  viewport?: { width: number; height: number }
): LaunchOptions {
  const opts: LaunchOptions = {
    headless: true,
    viewport: viewport ?? { width: 1280, height: 800 },
  };

  if (mode === "chromium-new-headless") {
    opts.channel = "chromium";
  }

  if (proxy) {
    opts.proxy = {
      server: proxy.server,
      ...(proxy.username !== undefined ? { username: proxy.username } : {}),
      ...(proxy.password !== undefined ? { password: proxy.password } : {}),
      ...(proxy.bypass !== undefined ? { bypass: proxy.bypass } : {}),
    };
  }

  return opts;
}

const CDP_TIMEOUT_MS = 10_000;

export async function spawnAndConnect(opts: {
  profilePath: string;
  executablePath: string;
}): Promise<{ context: BrowserContext; childProcess: ChildProcess }> {
  const args = [
    "--remote-debugging-port=0",
    `--user-data-dir=${opts.profilePath}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--ozone-platform=wayland",
  ];

  const child = spawn(opts.executablePath, args, { stdio: ["ignore", "ignore", "pipe"] });

  const wsEndpoint = await new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`Chromium did not expose CDP within ${CDP_TIMEOUT_MS}ms`));
    }, CDP_TIMEOUT_MS);

    child.stderr!.on("data", (chunk: Buffer) => {
      const match = chunk.toString().match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });

    child.on("error", (err: Error) => {
      clearTimeout(timer);
      reject(new Error(`Failed to spawn Chromium: ${err.message}`));
    });

    child.on("exit", (code: number | null) => {
      clearTimeout(timer);
      reject(new Error(`Chromium exited unexpectedly with code ${code}`));
    });
  });

  const browser = await chromium.connectOverCDP(wsEndpoint);
  const context = browser.contexts()[0];
  return { context, childProcess: child };
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- --reporter=verbose tests/unit/browser/modes.test.ts
```

Expected: all 9 tests pass (5 `buildLaunchOptions` + 4 `spawnAndConnect`).

- [ ] **Step 5: Commit**

```bash
git add src/browser/modes.ts tests/unit/browser/modes.test.ts
git commit -m "feat(modes): add spawnAndConnect for CDP attach-don't-launch"
```

---

### Task 3: Add child process tracking to `FeatherSession` — TDD

**Files:**
- Modify: `src/sessions/session.ts`
- Modify: `tests/unit/sessions/session-open-tab.test.ts` (add to existing session test file)

- [ ] **Step 1: Write failing tests**

First, update line 1 of `tests/unit/sessions/session-open-tab.test.ts` to add `vi`:

```typescript
import { describe, it, expect, vi } from "vitest";
```

Then append the following at the end of the file:

```typescript
import type { ChildProcess } from "child_process";

describe("FeatherSession — child process tracking", () => {
  it("getChildProcess returns null before setChildProcess is called", () => {
    const session = new FeatherSession({
      workspaceId: "ws",
      profileKind: "persistent",
      browserMode: "chromium-headed-cdp",
      profilePath: "/tmp/p",
      debugDir: "/tmp/d",
      proxy: null,
    });
    expect(session.getChildProcess()).toBeNull();
  });

  it("getChildProcess returns the process set via setChildProcess", () => {
    const session = new FeatherSession({
      workspaceId: "ws",
      profileKind: "persistent",
      browserMode: "chromium-headed-cdp",
      profilePath: "/tmp/p",
      debugDir: "/tmp/d",
      proxy: null,
    });
    const fakeProcess = { kill: vi.fn() } as unknown as ChildProcess;
    session.setChildProcess(fakeProcess);
    expect(session.getChildProcess()).toBe(fakeProcess);
  });
});
```

Note: `FeatherSession` and `vi` are already imported at the top of that test file — check before adding duplicate imports.

- [ ] **Step 2: Check existing imports in the session test file**

```bash
head -10 tests/unit/sessions/session-open-tab.test.ts
```

Confirm `FeatherSession` and `vi` are already imported. If not, add:
```typescript
import { vi } from "vitest";
import { FeatherSession } from "../../../src/sessions/session";
import type { ChildProcess } from "child_process";
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
npm test -- --reporter=verbose tests/unit/sessions/session-open-tab.test.ts
```

Expected: new tests fail with "session.getChildProcess is not a function".

- [ ] **Step 4: Implement child process tracking in `session.ts`**

In `src/sessions/session.ts`, add the `child_process` import at the top (after line 1):

```typescript
import type { ChildProcess } from "child_process";
```

Inside the `FeatherSession` class, after the existing private fields (after line ~54 `private _pageIds: Map<Page, string>;`), add:

```typescript
  private _childProcess: ChildProcess | null = null;
```

After the `getState()` method (around line 160), add:

```typescript
  setChildProcess(cp: ChildProcess): void {
    this._childProcess = cp;
  }

  getChildProcess(): ChildProcess | null {
    return this._childProcess;
  }
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npm test -- --reporter=verbose tests/unit/sessions/session-open-tab.test.ts
```

Expected: all tests in the file pass including the two new ones.

- [ ] **Step 6: Commit**

```bash
git add src/sessions/session.ts tests/unit/sessions/session-open-tab.test.ts
git commit -m "feat(session): add childProcess tracking for CDP mode"
```

---

### Task 4: Wire `manager.ts` — CDP launch branch + kill on close — TDD

**Files:**
- Modify: `src/sessions/manager.ts`
- Modify: `tests/unit/sessions/manager.test.ts`

- [ ] **Step 1: Write failing tests**

Open `tests/unit/sessions/manager.test.ts`. First, update the existing `vi.mock("playwright", ...)` block to add `executablePath` (needed because `manager.ts` calls `chromium.executablePath()` before handing off to `spawnAndConnect`):

```typescript
vi.mock("playwright", () => ({
  chromium: {
    executablePath: vi.fn().mockReturnValue("/bundled/chrome"),
    launchPersistentContext: vi.fn().mockResolvedValue({
      pages: () => [
        { url: () => "about:blank", title: async () => "New Tab", evaluate: async () => "complete" },
      ],
      newPage: vi.fn().mockResolvedValue({
        url: () => "about:blank",
        title: async () => "",
        evaluate: async () => "complete",
      }),
      close: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      tracing: { start: vi.fn(), stop: vi.fn() },
    }),
  },
}));
```

Then, after that block, add a mock for the `modes` module:

```typescript
vi.mock("../../../src/browser/modes", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../../src/browser/modes")>();
  return {
    ...original,
    spawnAndConnect: vi.fn().mockResolvedValue({
      context: {
        pages: () => [],
        on: vi.fn(),
        close: vi.fn().mockResolvedValue(undefined),
        tracing: { start: vi.fn(), stop: vi.fn() },
      },
      childProcess: { kill: vi.fn() },
    }),
  };
});
```

Then add this import near the top of the file (after the other imports):

```typescript
import { spawnAndConnect } from "../../../src/browser/modes";
```

Then append these two describe blocks at the end of the file:

```typescript
describe("SessionManager.launch — chromium-headed-cdp", () => {
  it("creates a running session using spawnAndConnect", async () => {
    const session = await manager.launch({
      workspaceId: "ws_cdp_001",
      profile: { kind: "persistent" },
      browserMode: "chromium-headed-cdp",
    });
    expect(session.getState()).toBe("running");
    expect(session.browserMode).toBe("chromium-headed-cdp");
    expect(vi.mocked(spawnAndConnect)).toHaveBeenCalledOnce();
  });

  it("stores the child process on the session", async () => {
    const session = await manager.launch({
      workspaceId: "ws_cdp_002",
      profile: { kind: "persistent" },
      browserMode: "chromium-headed-cdp",
    });
    expect(session.getChildProcess()).not.toBeNull();
  });

  it("does not call launchPersistentContext for CDP mode", async () => {
    const { chromium } = await import("playwright");
    vi.mocked(chromium.launchPersistentContext).mockClear();

    await manager.launch({
      profile: { kind: "persistent" },
      browserMode: "chromium-headed-cdp",
    });

    expect(chromium.launchPersistentContext).not.toHaveBeenCalled();
  });
});

describe("SessionManager.close — CDP session kills child process", () => {
  it("calls kill() on the child process when closing a CDP session", async () => {
    const session = await manager.launch({
      profile: { kind: "persistent" },
      browserMode: "chromium-headed-cdp",
    });
    const childProcess = session.getChildProcess()!;

    await manager.close(session.sessionId);

    expect(childProcess.kill).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to confirm the new ones fail**

```bash
npm test -- --reporter=verbose tests/unit/sessions/manager.test.ts
```

Expected: the four new CDP tests fail. Existing tests still pass.

- [ ] **Step 3: Implement the CDP branch in `manager.ts`**

In `src/sessions/manager.ts`, update the import from `modes.ts` (line 5):

```typescript
import { buildLaunchOptions, spawnAndConnect } from "../browser/modes";
```

In the `launch()` method, find this block (around line 109):

```typescript
    const launchOpts = buildLaunchOptions(browserMode, proxy ?? undefined, input.viewport);
    const context = await chromium.launchPersistentContext(profilePath, launchOpts);

    session.setContext(context);
```

Replace it with:

```typescript
    let context: BrowserContext;
    if (browserMode === "chromium-headed-cdp") {
      const { context: cdpContext, childProcess } = await spawnAndConnect({
        profilePath,
        executablePath: chromium.executablePath(),
      });
      context = cdpContext;
      session.setChildProcess(childProcess);
    } else {
      const launchOpts = buildLaunchOptions(browserMode, proxy ?? undefined, input.viewport);
      context = await chromium.launchPersistentContext(profilePath, launchOpts);
    }

    session.setContext(context);
```

In the `close()` method, find the block that ends with (around line 240):

```typescript
    session.setState("closed");
```

After that line, add:

```typescript
    session.getChildProcess()?.kill();
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- --reporter=verbose tests/unit/sessions/manager.test.ts
```

Expected: all tests pass including the four new CDP ones.

- [ ] **Step 5: Run the full unit suite to check for regressions**

```bash
npm test
```

Expected: all unit tests pass (no regressions in other test files).

- [ ] **Step 6: Commit**

```bash
git add src/sessions/manager.ts tests/unit/sessions/manager.test.ts
git commit -m "feat(manager): wire chromium-headed-cdp launch and CDP process cleanup"
```

---

### Task 5: Integration test — real Chromium, `navigator.webdriver` check

**Files:**
- Create: `tests/integration/attach-cdp.integration.test.ts`

- [ ] **Step 1: Write the integration test**

Create `tests/integration/attach-cdp.integration.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { chromium } from "playwright";
import { spawnAndConnect } from "../../src/browser/modes";

let tmpDir: string;
let cleanup: (() => Promise<void>) | null = null;

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-cdp-int-"));
});

afterAll(async () => {
  if (cleanup) await cleanup();
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe("spawnAndConnect — anti-detection gate", () => {
  it(
    "navigator.webdriver is not true when connected via CDP attach",
    async () => {
      const profilePath = path.join(tmpDir, "profile");
      await fs.promises.mkdir(profilePath, { recursive: true });

      const executablePath = chromium.executablePath();
      const { context, childProcess } = await spawnAndConnect({ profilePath, executablePath });

      cleanup = async () => {
        try { await context.close(); } catch { /* best-effort */ }
        childProcess.kill();
      };

      const page = await context.newPage();
      const webdriver = await page.evaluate(() => navigator.webdriver);

      expect(webdriver).not.toBe(true);
    },
    30_000
  );
});
```

- [ ] **Step 2: Run the integration test**

```bash
npm run test:integration -- --reporter=verbose tests/integration/attach-cdp.integration.test.ts
```

Expected: test passes. `navigator.webdriver` is `undefined` or `false` — not `true`.

If Chromium fails to start, check: `chromium.executablePath()` path exists and is executable. The process output will appear in stderr if the spawn works.

- [ ] **Step 3: Run the full integration suite to check for regressions**

```bash
npm run test:integration
```

Expected: all integration tests pass.

- [ ] **Step 4: Commit**

```bash
git add tests/integration/attach-cdp.integration.test.ts
git commit -m "test(integration): anti-detection gate — navigator.webdriver via CDP attach"
```

---

### Task 6: Final verification + push

- [ ] **Step 1: Run both suites clean**

```bash
npm test && npm run test:integration
```

Expected: all unit + integration tests green.

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Push to remote dev**

```bash
git push origin dev
```

- [ ] **Step 4: Update journal**

Run `/next` to record completion and set next action (pre-shell Task #3: `FEATHER_CHROMIUM_PATH`).
