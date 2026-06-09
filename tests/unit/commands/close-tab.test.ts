import { vi, describe, it, expect, beforeEach } from "vitest";
import { CloseTabHandler } from "../../../src/commands/close-tab";

const mockResult = {
  sessionId: "ses_test_001",
  closedPageId: "page_abc123",
  pages: [{ pageId: "page_keep", url: "about:blank", title: "", loadState: "complete" }],
};
const mockManager = { closeTab: vi.fn().mockResolvedValue(mockResult) };
const ctx = { requestId: "req_test_001" };

describe("CloseTabHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockManager.closeTab.mockResolvedValue(mockResult);
  });

  it("calls manager.closeTab with the sessionId and pageId", async () => {
    await new CloseTabHandler(mockManager as any).execute(
      { sessionId: "ses_test_001", pageId: "page_abc123" },
      ctx
    );
    expect(mockManager.closeTab).toHaveBeenCalledWith("ses_test_001", "page_abc123");
  });

  it("returns the result from manager.closeTab", async () => {
    const result = await new CloseTabHandler(mockManager as any).execute(
      { sessionId: "ses_test_001", pageId: "page_abc123" },
      ctx
    );
    expect(result).toEqual(mockResult);
  });

  it("propagates errors from manager.closeTab", async () => {
    mockManager.closeTab.mockRejectedValue(new Error("page not found"));
    await expect(
      new CloseTabHandler(mockManager as any).execute(
        { sessionId: "ses_test_001", pageId: "page_missing" },
        ctx
      )
    ).rejects.toThrow("page not found");
  });
});
