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
