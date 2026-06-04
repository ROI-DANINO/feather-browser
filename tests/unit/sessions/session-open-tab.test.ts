import { describe, it, expect, vi } from "vitest";
import { FeatherSession, SessionNotRunningError } from "../../../src/sessions/session";

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
    }),
    on: () => {},
  } as any;
  session.setContext(mockContext);
  return session;
}

describe("FeatherSession.openTab", () => {
  it("throws SessionNotRunningError when state is not running", async () => {
    const session = new FeatherSession({
      workspaceId: "ws_test",
      profileKind: "persistent",
      browserMode: "chromium-new-headless",
      profilePath: "/tmp/test-profile",
      debugDir: "/tmp/test-debug",
      proxy: null,
    });
    // session is in "launching" state (no context set yet)
    await expect(session.openTab()).rejects.toThrow(SessionNotRunningError);
  });

  it("returns a pageId with page_ prefix and the Page object", async () => {
    const session = makeRunningSession();
    const result = await session.openTab();
    expect(result.pageId).toMatch(/^page_/);
    expect(result.page).toBeDefined();
  });

  it("registers the new page in the session's page map", async () => {
    const session = makeRunningSession();
    const { pageId } = await session.openTab();
    const found = session.getPage(pageId);
    expect(found.pageId).toBe(pageId);
  });

  it("allows opening multiple tabs and each gets a unique pageId", async () => {
    const session = makeRunningSession();
    const a = await session.openTab();
    const b = await session.openTab();
    expect(a.pageId).not.toBe(b.pageId);
  });
});

describe("FeatherSession.toRecord", () => {
  it("does not include a pages property", () => {
    const session = makeRunningSession();
    const record = session.toRecord();
    expect(record).not.toHaveProperty("pages");
  });
});

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
