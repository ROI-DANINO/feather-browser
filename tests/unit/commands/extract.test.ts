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
  getPageInfoList: vi.fn().mockResolvedValue([{ pageId: "page_001", url: "https://example.com", title: "Example" }]),
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
    const recipe: ExtractRecipe = { fields: { heading: { selector: "h1", type: "text" } } };
    const result = await handler.execute({ sessionId: "ses_test_001", recipe }, ctx);
    expect(mockPage.locator).toHaveBeenCalledWith("h1");
    expect(mockLocator.first).toHaveBeenCalled();
    expect(mockLocator.textContent).toHaveBeenCalled();
    expect(result.heading).toBe("Hello World");
  });

  it("extracts an attribute field using getAttribute", async () => {
    mockLocator.getAttribute.mockResolvedValue("https://example.com/canonical");
    const handler = new ExtractHandler(mockManager as any);
    const recipe: ExtractRecipe = { fields: { canonical: { selector: "link[rel='canonical']", type: "attribute", attribute: "href" } } };
    const result = await handler.execute({ sessionId: "ses_test_001", recipe }, ctx);
    expect(mockLocator.getAttribute).toHaveBeenCalledWith("href");
    expect(result.canonical).toBe("https://example.com/canonical");
  });

  it("returns null for a text field when textContent returns null", async () => {
    mockLocator.textContent.mockResolvedValue(null);
    const handler = new ExtractHandler(mockManager as any);
    const recipe: ExtractRecipe = { fields: { heading: { selector: "h1", type: "text" } } };
    const result = await handler.execute({ sessionId: "ses_test_001", recipe }, ctx);
    expect(result.heading).toBeNull();
  });

  it("returns null for an attribute field when getAttribute returns null", async () => {
    mockLocator.getAttribute.mockResolvedValue(null);
    const handler = new ExtractHandler(mockManager as any);
    const recipe: ExtractRecipe = { fields: { canonical: { selector: "link[rel='canonical']", type: "attribute", attribute: "href" } } };
    const result = await handler.execute({ sessionId: "ses_test_001", recipe }, ctx);
    expect(result.canonical).toBeNull();
  });

  it("returns null when locator throws (selector not found)", async () => {
    mockLocator.textContent.mockRejectedValue(new Error("Element not found"));
    const handler = new ExtractHandler(mockManager as any);
    const recipe: ExtractRecipe = { fields: { missing: { selector: ".does-not-exist", type: "text" } } };
    const result = await handler.execute({ sessionId: "ses_test_001", recipe }, ctx);
    expect(result.missing).toBeNull();
  });

  it("truncates text field to limits.textChars", async () => {
    mockLocator.textContent.mockResolvedValue("A".repeat(10000));
    const handler = new ExtractHandler(mockManager as any);
    const recipe: ExtractRecipe = { fields: { body: { selector: "body", type: "text" } }, limits: { textChars: 100 } };
    const result = await handler.execute({ sessionId: "ses_test_001", recipe }, ctx);
    expect(result.body).toHaveLength(100);
  });

  it("uses specific pageId when provided", async () => {
    mockLocator.textContent.mockResolvedValue("value");
    const handler = new ExtractHandler(mockManager as any);
    const recipe: ExtractRecipe = { fields: { field: { selector: "p", type: "text" } } };
    await handler.execute({ sessionId: "ses_test_001", pageId: "page_002", recipe }, ctx);
    expect(mockSession.getPage).toHaveBeenCalledWith("page_002");
  });

  it("uses default page when pageId is omitted", async () => {
    mockLocator.textContent.mockResolvedValue("value");
    const handler = new ExtractHandler(mockManager as any);
    const recipe: ExtractRecipe = { fields: { field: { selector: "p", type: "text" } } };
    await handler.execute({ sessionId: "ses_test_001", recipe }, ctx);
    expect(mockSession.getPage).toHaveBeenCalledWith(undefined);
  });

  it("extracts multiple fields", async () => {
    mockLocator.textContent.mockResolvedValue("Title text");
    mockLocator.getAttribute.mockResolvedValue("https://example.com");
    const handler = new ExtractHandler(mockManager as any);
    const recipe: ExtractRecipe = { fields: { title: { selector: "h1", type: "text" }, link: { selector: "a", type: "attribute", attribute: "href" } } };
    const result = await handler.execute({ sessionId: "ses_test_001", recipe }, ctx);
    expect(Object.keys(result)).toEqual(["title", "link"]);
    expect(result.title).toBe("Title text");
    expect(result.link).toBe("https://example.com");
  });

  it("returns the first match when selector matches multiple elements", async () => {
    mockLocator.textContent.mockResolvedValue("First item");
    const handler = new ExtractHandler(mockManager as any);
    const recipe: ExtractRecipe = { fields: { item: { selector: ".list-item", type: "text" } } };
    const result = await handler.execute({ sessionId: "ses_test_001", recipe }, ctx);
    // Verify that .first() was called to handle multi-match case (strict-mode violation protection)
    expect(mockLocator.first).toHaveBeenCalled();
    // Verify that the first match's text content is returned correctly
    expect(mockLocator.textContent).toHaveBeenCalled();
    expect(result.item).toBe("First item");
  });
});
