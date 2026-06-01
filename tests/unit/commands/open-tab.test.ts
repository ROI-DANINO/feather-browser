import { vi, describe, it, expect, beforeEach } from "vitest";
import { OpenTabHandler } from "../../../src/commands/open-tab";

const mockPageInfo = { pageId: "page_abc123", url: "about:blank", title: "", loadState: "complete" };
const mockManager = { openTab: vi.fn().mockResolvedValue(mockPageInfo) };
const ctx = { requestId: "req_test_001" };

describe("OpenTabHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockManager.openTab.mockResolvedValue(mockPageInfo);
  });

  it("calls manager.openTab with the provided sessionId", async () => {
    await new OpenTabHandler(mockManager as any).execute({ sessionId: "ses_test_001" }, ctx);
    expect(mockManager.openTab).toHaveBeenCalledWith("ses_test_001");
  });

  it("returns the PageInfo from manager.openTab", async () => {
    const result = await new OpenTabHandler(mockManager as any).execute({ sessionId: "ses_test_001" }, ctx);
    expect(result).toEqual(mockPageInfo);
  });

  it("propagates errors from manager.openTab", async () => {
    mockManager.openTab.mockRejectedValue(new Error("session not found"));
    await expect(
      new OpenTabHandler(mockManager as any).execute({ sessionId: "ses_missing" }, ctx)
    ).rejects.toThrow("session not found");
  });
});
