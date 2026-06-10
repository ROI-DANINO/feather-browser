import { vi, describe, it, expect, beforeEach } from "vitest";
import { SelectOptionHandler } from "../../../src/commands/select-option";
import { resolveActionable } from "../../../src/browser/locators";

vi.mock("../../../src/browser/locators", () => ({ resolveActionable: vi.fn(), resolveLocator: vi.fn() }));

const fakeAct = { selectOption: vi.fn().mockResolvedValue(["option1"]) };
const probe = vi.fn().mockResolvedValue(1);
const mockPage = {};
const mockSession = {
  getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: mockPage }),
  getObserveCache: vi.fn().mockReturnValue(undefined),
};
const mockManager = { get: vi.fn().mockReturnValue(mockSession) };
const ctx = { requestId: "req_test" };

describe("SelectOptionHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fakeAct.selectOption.mockResolvedValue(["option1"]);
    (resolveActionable as any).mockReturnValue({ act: fakeAct, probe });
    mockSession.getPage.mockReturnValue({ pageId: "page_001", page: mockPage });
    mockSession.getObserveCache.mockReturnValue(undefined);
    mockManager.get.mockReturnValue(mockSession);
  });

  it("resolves the target and selects options with the default timeout", async () => {
    const result = await new SelectOptionHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "select#country" }, values: "US" }, ctx);
    expect(resolveActionable).toHaveBeenCalledWith(mockPage, { by: "css", selector: "select#country" }, expect.any(Function));
    expect(fakeAct.selectOption).toHaveBeenCalledWith("US", { timeout: 15000 });
    expect(result).toEqual({ pageId: "page_001", selected: ["option1"] });
  });

  it("passes an array of values and custom timeout", async () => {
    fakeAct.selectOption.mockResolvedValue(["a", "b"]);
    const result = await new SelectOptionHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "role", role: "combobox" }, values: ["a", "b"], timeoutMs: 5000 }, ctx);
    expect(fakeAct.selectOption).toHaveBeenCalledWith(["a", "b"], { timeout: 5000 });
    expect(result.selected).toEqual(["a", "b"]);
  });

  it("uses specific pageId when provided", async () => {
    await new SelectOptionHandler(mockManager as any).execute(
      { sessionId: "ses", pageId: "page_002", target: { by: "css", selector: "select" }, values: "X" }, ctx);
    expect(mockSession.getPage).toHaveBeenCalledWith("page_002");
  });

  it("returns selected+navigated when the select dies to navigation teardown", async () => {
    fakeAct.selectOption.mockRejectedValueOnce(new Error("Execution context was destroyed, most likely because of a navigation"));
    const result = await new SelectOptionHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "select" }, values: "b" }, ctx);
    expect(result).toEqual({ pageId: "page_001", selected: ["b"], navigated: true });
  });

  it("still rethrows non-navigation errors", async () => {
    fakeAct.selectOption.mockRejectedValueOnce(new Error("boom"));
    await expect(new SelectOptionHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "select" }, values: "b" }, ctx)).rejects.toThrow("boom");
  });
});
