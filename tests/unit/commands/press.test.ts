import { vi, describe, it, expect, beforeEach } from "vitest";
import { PressHandler } from "../../../src/commands/press";
import { resolveActionable } from "../../../src/browser/locators";

vi.mock("../../../src/browser/locators", () => ({ resolveActionable: vi.fn(), resolveLocator: vi.fn() }));

const fakeAct = { press: vi.fn().mockResolvedValue(undefined) };
const probe = vi.fn().mockResolvedValue(1);
const keyboard = { press: vi.fn().mockResolvedValue(undefined) };
const mockPage = { keyboard };
const mockSession = {
  getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: mockPage }),
  getObserveCache: vi.fn().mockReturnValue(undefined),
};
const mockManager = { get: vi.fn().mockReturnValue(mockSession) };
const ctx = { requestId: "req_test" };

describe("PressHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (resolveActionable as any).mockReturnValue({ act: fakeAct, probe });
    mockSession.getPage.mockReturnValue({ pageId: "page_001", page: mockPage });
    mockSession.getObserveCache.mockReturnValue(undefined);
    mockManager.get.mockReturnValue(mockSession);
  });

  it("presses on the resolved target when a target is given", async () => {
    const result = await new PressHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "#inp" }, key: "Enter" }, ctx);
    expect(fakeAct.press).toHaveBeenCalledWith("Enter", { timeout: 15000 });
    expect(keyboard.press).not.toHaveBeenCalled();
    expect(result).toEqual({ pageId: "page_001", pressed: "Enter" });
  });

  it("presses on the focused element via keyboard when no target is given", async () => {
    await new PressHandler(mockManager as any).execute({ sessionId: "ses", key: "Enter" }, ctx);
    expect(keyboard.press).toHaveBeenCalledWith("Enter");
    expect(fakeAct.press).not.toHaveBeenCalled();
  });

  it("returns pressed+navigated when the press dies to navigation teardown", async () => {
    fakeAct.press.mockRejectedValueOnce(new Error("Execution context was destroyed, most likely because of a navigation"));
    const result = await new PressHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "#q" }, key: "Enter" }, ctx);
    expect(result).toEqual({ pageId: "page_001", pressed: "Enter", navigated: true });
  });

  it("still rethrows non-navigation errors", async () => {
    fakeAct.press.mockRejectedValueOnce(new Error("boom"));
    await expect(new PressHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "#q" }, key: "Enter" }, ctx)).rejects.toThrow("boom");
  });
});
