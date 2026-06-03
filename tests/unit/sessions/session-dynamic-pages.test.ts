import { describe, it, expect } from "vitest";
import { FeatherSession } from "../../../src/sessions/session";
import type { Page } from "playwright";

function makeSession(): FeatherSession {
  const session = new FeatherSession({
    workspaceId: "ws_test",
    profileKind: "persistent",
    browserMode: "chromium-new-headless",
    profilePath: "/tmp/test-profile",
    debugDir: "/tmp/test-debug",
    proxy: null,
  });
  const mockContext = { pages: () => [], on: () => {} } as any;
  session.setContext(mockContext);
  return session;
}

function makePage(url: string, title: string): Page {
  return { url: () => url, title: async () => title, on: () => {}, evaluate: async () => "complete" } as any;
}

describe("FeatherSession.addPage", () => {
  it("returns a pageId with page_ prefix", () => {
    const session = makeSession();
    const pageId = session.addPage(makePage("http://example.com", "Example"));
    expect(pageId).toMatch(/^page_/);
  });

  it("makes the page accessible via getPage()", () => {
    const session = makeSession();
    const pageId = session.addPage(makePage("http://example.com", "Example"));
    expect(session.getPage(pageId).pageId).toBe(pageId);
  });

  it("is reflected in getPageInfoList()", async () => {
    const session = makeSession();
    session.addPage(makePage("http://example.com", "Example"));
    const list = await session.getPageInfoList();
    expect(list).toHaveLength(1);
    expect(list[0].url).toBe("http://example.com");
    expect(list[0].title).toBe("Example");
  });

  it("each call returns a unique pageId", () => {
    const session = makeSession();
    const id1 = session.addPage(makePage("http://a.com", "A"));
    const id2 = session.addPage(makePage("http://b.com", "B"));
    expect(id1).not.toBe(id2);
  });
});

describe("FeatherSession.addPage — idempotency (dup-registration fix)", () => {
  it("returns the same pageId when the same Page object is registered twice", () => {
    const session = makeSession();
    const page = makePage("http://example.com", "Example");
    const first = session.addPage(page);
    const second = session.addPage(page);
    expect(second).toBe(first);
  });

  it("keeps getPageInfoList at one entry when the same Page is registered twice", async () => {
    const session = makeSession();
    const page = makePage("http://example.com", "Example");
    session.addPage(page);
    session.addPage(page);
    const list = await session.getPageInfoList();
    expect(list).toHaveLength(1);
  });

  it("removePage clears the reverse map so re-adding yields a fresh id", () => {
    const session = makeSession();
    const page = makePage("http://example.com", "Example");
    const firstId = session.addPage(page);
    session.removePage(firstId);
    const secondId = session.addPage(page);
    expect(secondId).not.toBe(firstId);
  });
});

describe("FeatherSession.removePage", () => {
  it("removes the page from getPageInfoList()", async () => {
    const session = makeSession();
    const pageId = session.addPage(makePage("http://example.com", "Example"));
    session.removePage(pageId);
    const list = await session.getPageInfoList();
    expect(list).toHaveLength(0);
  });

  it("does not throw for an unknown pageId", () => {
    const session = makeSession();
    expect(() => session.removePage("page_nonexistent")).not.toThrow();
  });
});
