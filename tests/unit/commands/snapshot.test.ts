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
  getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: mockPage }),
  getState: vi.fn().mockReturnValue("running"),
  toRecord: vi.fn().mockReturnValue({ sessionId: "ses_test_001", state: "running" }),
};

const mockManager = {
  get: vi.fn().mockReturnValue(mockSession),
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

  it("returns snapshot with url, title, text, links, meta, limits, and markdown", async () => {
    mockPage.evaluate
      .mockResolvedValueOnce("Example Domain\nThis domain is for use in illustrative examples.")
      .mockResolvedValueOnce([{ text: "More information...", href: "https://www.iana.org/domains/example" }])
      .mockResolvedValueOnce("An illustrative example domain.")
      .mockResolvedValueOnce("# Example Domain\n\nSome text");
    const handler = new SnapshotHandler(mockManager as any);
    const result = await handler.execute({ sessionId: "ses_test_001" }, ctx);
    expect(result.pageId).toBe("page_001");
    expect(result.url).toBe("https://example.com");
    expect(result.title).toBe("Example Domain");
    expect(result.text).toContain("Example Domain");
    expect(result.links).toEqual([{ text: "More information...", href: "https://www.iana.org/domains/example" }]);
    expect(result.meta.description).toBe("An illustrative example domain.");
    expect(result.limits.textChars).toBe(20000);
    expect(result.limits.links).toBe(200);
    expect(result.limits.markdownChars).toBe(20000);
    expect(typeof result.markdown).toBe("string");
    expect(result.markdown).toBe("# Example Domain\n\nSome text");
  });

  it("truncates body text to 20000 characters", async () => {
    mockPage.evaluate
      .mockResolvedValueOnce("X".repeat(25000))
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce("")
      .mockResolvedValueOnce("");
    const result = await new SnapshotHandler(mockManager as any).execute({ sessionId: "ses_test_001" }, ctx);
    expect(result.text.length).toBe(20000);
  });

  it("truncates links array to 200 entries", async () => {
    const manyLinks = Array.from({ length: 250 }, (_, i) => ({ text: `Link ${i}`, href: `https://example.com/${i}` }));
    mockPage.evaluate
      .mockResolvedValueOnce("some text")
      .mockResolvedValueOnce(manyLinks)
      .mockResolvedValueOnce("")
      .mockResolvedValueOnce("");
    const result = await new SnapshotHandler(mockManager as any).execute({ sessionId: "ses_test_001" }, ctx);
    expect(result.links.length).toBe(200);
  });

  it("returns empty string for meta.description when meta tag is absent", async () => {
    mockPage.evaluate
      .mockResolvedValueOnce("text")
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce("")
      .mockResolvedValueOnce("");
    const result = await new SnapshotHandler(mockManager as any).execute({ sessionId: "ses_test_001" }, ctx);
    expect(result.meta.description).toBe("");
  });

  it("returns empty links array when page has no links", async () => {
    mockPage.evaluate
      .mockResolvedValueOnce("text")
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce("")
      .mockResolvedValueOnce("");
    const result = await new SnapshotHandler(mockManager as any).execute({ sessionId: "ses_test_001" }, ctx);
    expect(result.links).toEqual([]);
  });

  it("uses specific pageId when provided", async () => {
    mockPage.evaluate
      .mockResolvedValueOnce("text")
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce("")
      .mockResolvedValueOnce("");
    await new SnapshotHandler(mockManager as any).execute({ sessionId: "ses_test_001", pageId: "page_002" }, ctx);
    expect(mockSession.getPage).toHaveBeenCalledWith("page_002");
  });

  it("uses default page when pageId is omitted", async () => {
    mockPage.evaluate
      .mockResolvedValueOnce("text")
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce("")
      .mockResolvedValueOnce("");
    await new SnapshotHandler(mockManager as any).execute({ sessionId: "ses_test_001" }, ctx);
    expect(mockSession.getPage).toHaveBeenCalledWith(undefined);
  });
});
