import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

vi.mock("playwright", () => ({
  chromium: {
    executablePath: vi.fn().mockReturnValue("/bundled/chrome"),
    launchPersistentContext: vi.fn().mockResolvedValue({
      pages: () => [
        { url: () => "about:blank", title: async () => "New Tab", evaluate: async () => "complete", on: vi.fn() },
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

import { SessionManager } from "../../../src/sessions/manager";
import { FeatherPaths } from "../../../src/fs-layout";
import { ProfileLock } from "../../../src/profiles/lock";
import { WorkspaceMetadata } from "../../../src/profiles/workspace";
import { spawnAndConnect } from "../../../src/browser/modes";
import { IdentityNotFoundError } from "../../../src/identity/types";

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

describe("SessionManager.openTab", () => {
  it("returns a PageInfo with pageId, url, and title for the new tab", async () => {
    const session = await manager.launch({ workspaceId: "ws_tab_001", profile: { kind: "persistent" } });
    const pageInfo = await manager.openTab(session.sessionId);
    expect(pageInfo.pageId).toMatch(/^page_/);
    expect(pageInfo.url).toBe("about:blank");
    expect(pageInfo.title).toBe("");
  });

  it("throws SessionNotFoundError for an unknown sessionId", async () => {
    await expect(manager.openTab("ses_does_not_exist")).rejects.toMatchObject({ code: "SESSION_NOT_FOUND" });
  });

  it("throws SessionNotRunningError when session state is not running", async () => {
    const session = await manager.launch({ workspaceId: "ws_tab_002", profile: { kind: "disposable" } });
    session.setState("closing");
    await expect(manager.openTab(session.sessionId)).rejects.toMatchObject({ code: "SESSION_NOT_RUNNING" });
  });

  it("logs a TAB_OPENED event after successful tab open", async () => {
    const logSpy = vi.spyOn(manager["logger"], "log");
    const session = await manager.launch({ workspaceId: "ws_tab_003", profile: { kind: "persistent" } });
    await manager.openTab(session.sessionId);
    const tabLog = logSpy.mock.calls.find(([entry]) => entry.event === "tab.opened");
    expect(tabLog).toBeDefined();
    expect(tabLog![0].data).toMatchObject({ pageId: expect.stringMatching(/^page_/) });
  });
});

describe("SessionManager.launch — dynamic page tracking", () => {
  it("registers a 'page' event listener on the browser context", async () => {
    const { chromium } = await import("playwright");
    const mockContextOn = vi.fn();
    (chromium.launchPersistentContext as vi.Mock).mockResolvedValueOnce({
      pages: () => [],
      newPage: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
      on: mockContextOn,
      tracing: { start: vi.fn(), stop: vi.fn() },
    });
    await manager.launch({ profile: { kind: "disposable" } });
    expect(mockContextOn).toHaveBeenCalledWith("page", expect.any(Function));
  });

  it("adds a dynamically opened page to the session page map", async () => {
    const { chromium } = await import("playwright");
    const mockContextOn = vi.fn();
    const mockPage = { url: () => "http://dynamic.com", title: async () => "Dynamic", on: vi.fn(), evaluate: async () => "complete" };
    (chromium.launchPersistentContext as vi.Mock).mockResolvedValueOnce({
      pages: () => [],
      newPage: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
      on: mockContextOn,
      tracing: { start: vi.fn(), stop: vi.fn() },
    });
    const session = await manager.launch({ profile: { kind: "disposable" } });
    const [, pageCallback] = mockContextOn.mock.calls.find(([evt]: [string]) => evt === "page")!;
    pageCallback(mockPage);
    const pages = await session.getPageInfoList();
    expect(pages).toHaveLength(1);
    expect(pages[0].url).toBe("http://dynamic.com");
  });

  it("removes a page from the session map when it closes", async () => {
    const { chromium } = await import("playwright");
    const mockContextOn = vi.fn();
    const mockPageOn = vi.fn();
    const mockPage = { url: () => "http://dynamic.com", title: async () => "Dynamic", on: mockPageOn, evaluate: async () => "complete" };
    (chromium.launchPersistentContext as vi.Mock).mockResolvedValueOnce({
      pages: () => [],
      newPage: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
      on: mockContextOn,
      tracing: { start: vi.fn(), stop: vi.fn() },
    });
    const session = await manager.launch({ profile: { kind: "disposable" } });
    const [, pageCallback] = mockContextOn.mock.calls.find(([evt]: [string]) => evt === "page")!;
    pageCallback(mockPage);
    expect(await session.getPageInfoList()).toHaveLength(1);
    const [, closeCallback] = mockPageOn.mock.calls.find(([evt]: [string]) => evt === "close")!;
    closeCallback();
    expect(await session.getPageInfoList()).toHaveLength(0);
  });

  it("logs TAB_CREATED when a dynamic page opens", async () => {
    const { chromium } = await import("playwright");
    const mockContextOn = vi.fn();
    const mockPage = { url: () => "about:blank", title: async () => "", on: vi.fn() };
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
    const tabCreatedLog = logSpy.mock.calls.find(([entry]) => entry.event === "tab.created");
    expect(tabCreatedLog).toBeDefined();
    expect(tabCreatedLog![0].sessionId).toBe(session.sessionId);
    expect(tabCreatedLog![0].data).toMatchObject({ pageId: expect.stringMatching(/^page_/) });
  });

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

  it("logs TAB_CLOSED when a dynamic page closes", async () => {
    const { chromium } = await import("playwright");
    const mockContextOn = vi.fn();
    const mockPageOn = vi.fn();
    const mockPage = { url: () => "about:blank", title: async () => "", on: mockPageOn };
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
    const [, closeCallback] = mockPageOn.mock.calls.find(([evt]: [string]) => evt === "close")!;
    closeCallback();
    const tabClosedLog = logSpy.mock.calls.find(([entry]) => entry.event === "tab.closed");
    expect(tabClosedLog).toBeDefined();
    expect(tabClosedLog![0].data).toMatchObject({ pageId: expect.stringMatching(/^page_/) });
  });
});

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

  it("passes FEATHER_CHROMIUM_PATH to spawnAndConnect as the executable override", async () => {
    const saved = process.env.FEATHER_CHROMIUM_PATH;
    process.env.FEATHER_CHROMIUM_PATH = "/usr/bin/chromium-browser";
    try {
      vi.mocked(spawnAndConnect).mockClear();
      await manager.launch({
        profile: { kind: "persistent" },
        browserMode: "chromium-headed-cdp",
      });
      expect(vi.mocked(spawnAndConnect)).toHaveBeenCalledWith(
        expect.objectContaining({ executablePath: "/usr/bin/chromium-browser" })
      );
    } finally {
      if (saved === undefined) delete process.env.FEATHER_CHROMIUM_PATH;
      else process.env.FEATHER_CHROMIUM_PATH = saved;
    }
  });

  it("falls back to the bundled chromium when FEATHER_CHROMIUM_PATH is unset", async () => {
    const saved = process.env.FEATHER_CHROMIUM_PATH;
    delete process.env.FEATHER_CHROMIUM_PATH;
    try {
      vi.mocked(spawnAndConnect).mockClear();
      await manager.launch({
        profile: { kind: "persistent" },
        browserMode: "chromium-headed-cdp",
      });
      expect(vi.mocked(spawnAndConnect)).toHaveBeenCalledWith(
        expect.objectContaining({ executablePath: "/bundled/chrome" })
      );
    } finally {
      if (saved !== undefined) process.env.FEATHER_CHROMIUM_PATH = saved;
    }
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

describe("SessionManager — DebugCapture wiring", () => {
  it("starts tracing on launch and stops it on close when debug.trace is set", async () => {
    const { chromium } = await import("playwright");
    const traceStart = vi.fn().mockResolvedValue(undefined);
    const traceStop = vi.fn().mockResolvedValue(undefined);
    (chromium.launchPersistentContext as vi.Mock).mockResolvedValueOnce({
      pages: () => [],
      newPage: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      tracing: { start: traceStart, stop: traceStop },
    });

    const session = await manager.launch({
      profile: { kind: "disposable" },
      debug: { trace: true },
    });
    expect(traceStart).toHaveBeenCalled();

    await manager.close(session.sessionId);
    expect(traceStop).toHaveBeenCalled();
  });

  it("does not start tracing when debug is not provided", async () => {
    const { chromium } = await import("playwright");
    const traceStart = vi.fn().mockResolvedValue(undefined);
    (chromium.launchPersistentContext as vi.Mock).mockResolvedValueOnce({
      pages: () => [],
      newPage: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      tracing: { start: traceStart, stop: vi.fn() },
    });

    await manager.launch({ profile: { kind: "disposable" } });
    expect(traceStart).not.toHaveBeenCalled();
  });

  it("writes capture artifacts (network-summary.jsonl) to the debug dir on close", async () => {
    const { chromium } = await import("playwright");
    (chromium.launchPersistentContext as vi.Mock).mockResolvedValueOnce({
      pages: () => [],
      newPage: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      tracing: { start: vi.fn(), stop: vi.fn() },
    });

    const session = await manager.launch({
      profile: { kind: "disposable" },
      debug: {},
    });
    await manager.close(session.sessionId);

    const summaryPath = path.join(session.debugDir, "network-summary.jsonl");
    const exists = await fs.promises
      .access(summaryPath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
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

describe("SessionManager.close — disposable CDP race fix", () => {
  it("waits for child process exit before deleting disposable profile dir", async () => {
    // Build a controllable child process mock: once('exit', cb) defers until we fire it
    let exitCallback: (() => void) | null = null;
    const childProcessMock = {
      kill: vi.fn(),
      once: vi.fn((event: string, cb: () => void) => {
        if (event === "exit") exitCallback = cb;
      }),
    };

    vi.mocked(spawnAndConnect).mockResolvedValueOnce({
      context: {
        pages: () => [],
        on: vi.fn(),
        close: vi.fn().mockResolvedValue(undefined),
        tracing: { start: vi.fn(), stop: vi.fn() },
      },
      childProcess: childProcessMock as any,
    });

    const session = await manager.launch({
      workspaceId: "ws_cdp_race_001",
      profile: { kind: "disposable" },
      browserMode: "chromium-headed-cdp",
    });
    const sessionId = session.sessionId;

    // Spy on fs.promises.rm to detect when it gets called
    const rmSpy = vi.spyOn(fs.promises, "rm").mockResolvedValue(undefined);

    // Start close() but don't await yet — it should block waiting for exit
    const closePromise = manager.close(sessionId);

    // Give the event loop a few ticks to reach the await-exit point
    await new Promise((r) => setTimeout(r, 50));

    // rm should NOT have been called yet — still waiting for child exit
    const rmCalledBeforeExit = rmSpy.mock.calls.some(
      ([p]) => typeof p === "string" && p.includes(sessionId)
    );
    expect(rmCalledBeforeExit).toBe(false);

    // Now fire the exit event — close() should unblock and call rm
    expect(exitCallback).not.toBeNull();
    exitCallback!();

    await closePromise;

    const rmCalledAfterExit = rmSpy.mock.calls.some(
      ([p]) => typeof p === "string" && p.includes(sessionId)
    );
    expect(rmCalledAfterExit).toBe(true);

    rmSpy.mockRestore();
  });

  it("proceeds with cleanup after timeout if child process does not exit", async () => {
    // once('exit', cb) is registered but never fired → timeout path
    const childProcessMock = {
      kill: vi.fn(),
      once: vi.fn(), // captures the callback but never calls it
    };

    vi.mocked(spawnAndConnect).mockResolvedValueOnce({
      context: {
        pages: () => [],
        on: vi.fn(),
        close: vi.fn().mockResolvedValue(undefined),
        tracing: { start: vi.fn(), stop: vi.fn() },
      },
      childProcess: childProcessMock as any,
    });

    const session = await manager.launch({
      workspaceId: "ws_cdp_race_002",
      profile: { kind: "disposable" },
      browserMode: "chromium-headed-cdp",
    });

    const rmSpy = vi.spyOn(fs.promises, "rm").mockResolvedValue(undefined);

    // This will wait up to the timeout (3 s default) then proceed.
    // Use fake timers to skip the wait.
    vi.useFakeTimers();
    const closePromise = manager.close(session.sessionId);
    // Advance past the 3 s timeout
    await vi.advanceTimersByTimeAsync(3100);
    vi.useRealTimers();

    await closePromise;

    // rm should have been called despite child never exiting
    expect(rmSpy).toHaveBeenCalled();
    rmSpy.mockRestore();
  });
});

describe("SessionManager.launch — identity resolution (Phase 5a, Task 8)", () => {
  it("resolves workspaceId from the identity's defaultWorkspaceId and records identityId", async () => {
    manager.setIdentityResolver({
      get: async (id: string) => {
        expect(id).toBe("alias");
        return { defaultWorkspaceId: "real-ws" };
      },
    });
    const session = await manager.launch({
      identityId: "alias",
      profile: { kind: "persistent" },
    });
    expect(session.workspaceId).toBe("real-ws");
    expect(session.toRecord().identityId).toBe("alias");
  });

  it("propagates IdentityNotFoundError before any Chromium spawn", async () => {
    manager.setIdentityResolver({
      get: async (id: string) => {
        throw new IdentityNotFoundError(id);
      },
    });
    await expect(
      manager.launch({ identityId: "ghost", profile: { kind: "persistent" } }),
    ).rejects.toMatchObject({ code: "IDENTITY_NOT_FOUND" });
    expect(manager.list()).toHaveLength(0);
  });

  it("leaves identityId undefined for a normal workspace launch", async () => {
    const session = await manager.launch({ workspaceId: "plain-ws", profile: { kind: "persistent" } });
    expect(session.toRecord().identityId).toBeUndefined();
  });
});
