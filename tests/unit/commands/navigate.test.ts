import { vi, describe, it, expect, beforeEach } from "vitest";
import { NavigateHandler } from "../../../src/commands/navigate";

const mockResponse = { status: vi.fn().mockReturnValue(200) };
const mockPage = {
  url: vi.fn().mockReturnValue("https://example.com"),
  goto: vi.fn().mockResolvedValue(mockResponse),
};
const mockSession = { getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: mockPage }) };
const mockManager = { get: vi.fn().mockReturnValue(mockSession) };
const ctx = { requestId: "req_test_001" };

describe("NavigateHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPage.goto.mockResolvedValue(mockResponse);
    mockResponse.status.mockReturnValue(200);
    mockPage.url.mockReturnValue("https://example.com");
    mockSession.getPage.mockReturnValue({ pageId: "page_001", page: mockPage });
    mockManager.get.mockReturnValue(mockSession);
  });

  it("calls page.goto with the provided url", async () => {
    await new NavigateHandler(mockManager as any).execute({ sessionId: "ses_test_001", url: "https://example.com" }, ctx);
    expect(mockPage.goto).toHaveBeenCalledWith("https://example.com", expect.objectContaining({ waitUntil: undefined, timeout: undefined }));
  });

  it("passes waitUntil and timeoutMs to page.goto", async () => {
    await new NavigateHandler(mockManager as any).execute({ sessionId: "ses_test_001", url: "https://example.com", waitUntil: "domcontentloaded", timeoutMs: 15000 }, ctx);
    expect(mockPage.goto).toHaveBeenCalledWith("https://example.com", { waitUntil: "domcontentloaded", timeout: 15000 });
  });

  it("returns pageId, current url, and response status", async () => {
    const result = await new NavigateHandler(mockManager as any).execute({ sessionId: "ses_test_001", url: "https://example.com" }, ctx);
    expect(result.pageId).toBe("page_001");
    expect(result.url).toBe("https://example.com");
    expect(result.status).toBe(200);
  });

  it("returns null status when goto resolves to null", async () => {
    mockPage.goto.mockResolvedValue(null);
    const result = await new NavigateHandler(mockManager as any).execute({ sessionId: "ses_test_001", url: "https://example.com" }, ctx);
    expect(result.status).toBeNull();
  });

  it("uses specific pageId when provided", async () => {
    await new NavigateHandler(mockManager as any).execute({ sessionId: "ses_test_001", pageId: "page_002", url: "https://example.com" }, ctx);
    expect(mockSession.getPage).toHaveBeenCalledWith("page_002");
  });
});
