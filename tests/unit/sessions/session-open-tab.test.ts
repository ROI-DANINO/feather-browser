import { describe, it, expect } from "vitest";
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
