import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

vi.mock("playwright", () => ({
  chromium: {
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

import { SessionManager } from "../../../src/sessions/manager";
import { FeatherPaths } from "../../../src/fs-layout";
import { ProfileLock } from "../../../src/profiles/lock";
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
