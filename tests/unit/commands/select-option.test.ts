import { vi, describe, it, expect, beforeEach } from "vitest";
import { SelectOptionHandler } from "../../../src/commands/select-option";
import { resolveLocator } from "../../../src/browser/locators";

vi.mock("../../../src/browser/locators", () => ({ resolveLocator: vi.fn() }));

const fakeLoc = {
  selectOption: vi.fn().mockResolvedValue(["option1"]),
  count: vi.fn().mockResolvedValue(1),
};
const mockPage = {};
const mockSession = { getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: mockPage }) };
const mockManager = { get: vi.fn().mockReturnValue(mockSession) };
const ctx = { requestId: "req_test" };

describe("SelectOptionHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (resolveLocator as any).mockReturnValue(fakeLoc);
    mockSession.getPage.mockReturnValue({ pageId: "page_001", page: mockPage });
    mockManager.get.mockReturnValue(mockSession);
  });

  it("resolves the target and selects options with the default timeout", async () => {
    const result = await new SelectOptionHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "select#country" }, values: "US" }, ctx);
    expect(resolveLocator).toHaveBeenCalledWith(mockPage, { by: "css", selector: "select#country" });
    expect(fakeLoc.selectOption).toHaveBeenCalledWith("US", { timeout: 15000 });
    expect(result).toEqual({ pageId: "page_001", selected: ["option1"] });
  });

  it("passes an array of values and custom timeout", async () => {
    fakeLoc.selectOption.mockResolvedValue(["a", "b"]);
    const result = await new SelectOptionHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "role", role: "combobox" }, values: ["a", "b"], timeoutMs: 5000 }, ctx);
    expect(fakeLoc.selectOption).toHaveBeenCalledWith(["a", "b"], { timeout: 5000 });
    expect(result.selected).toEqual(["a", "b"]);
  });

  it("uses specific pageId when provided", async () => {
    await new SelectOptionHandler(mockManager as any).execute(
      { sessionId: "ses", pageId: "page_002", target: { by: "css", selector: "select" }, values: "X" }, ctx);
    expect(mockSession.getPage).toHaveBeenCalledWith("page_002");
  });
});
