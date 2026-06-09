import { vi, describe, it, expect, beforeEach } from "vitest";
import { ClickHandler } from "../../../src/commands/click";
import { resolveActionable } from "../../../src/browser/locators";

vi.mock("../../../src/browser/locators", () => ({ resolveActionable: vi.fn(), resolveLocator: vi.fn() }));

const fakeAct = { click: vi.fn().mockResolvedValue(undefined) };
const probe = vi.fn().mockResolvedValue(1);
const mockPage = {};
const mockSession = {
  getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: mockPage }),
  getObserveCache: vi.fn().mockReturnValue(undefined),
};
const mockManager = { get: vi.fn().mockReturnValue(mockSession) };
const ctx = { requestId: "req_test" };

describe("ClickHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (resolveActionable as any).mockReturnValue({ act: fakeAct, probe });
    mockSession.getPage.mockReturnValue({ pageId: "page_001", page: mockPage });
    mockSession.getObserveCache.mockReturnValue(undefined);
    mockManager.get.mockReturnValue(mockSession);
  });

  it("resolves the target and clicks with the default timeout", async () => {
    const result = await new ClickHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "role", role: "button", name: "Send" } }, ctx);
    expect(resolveActionable).toHaveBeenCalledWith(mockPage, { by: "role", role: "button", name: "Send" }, expect.any(Function));
    expect(fakeAct.click).toHaveBeenCalledWith({ timeout: 15000 });
    expect(result).toEqual({ pageId: "page_001", clicked: true });
  });

  it("passes a custom timeout and pageId", async () => {
    await new ClickHandler(mockManager as any).execute(
      { sessionId: "ses", pageId: "page_002", target: { by: "css", selector: "#x" }, timeoutMs: 3000 }, ctx);
    expect(mockSession.getPage).toHaveBeenCalledWith("page_002");
    expect(fakeAct.click).toHaveBeenCalledWith({ timeout: 3000 });
  });
});
