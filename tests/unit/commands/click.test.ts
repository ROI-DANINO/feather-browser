import { vi, describe, it, expect, beforeEach } from "vitest";
import { ClickHandler } from "../../../src/commands/click";
import { resolveLocator } from "../../../src/browser/locators";

vi.mock("../../../src/browser/locators", () => ({ resolveLocator: vi.fn() }));

const fakeLoc = { click: vi.fn().mockResolvedValue(undefined), count: vi.fn().mockResolvedValue(1) };
const mockPage = {};
const mockSession = { getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: mockPage }) };
const mockManager = { get: vi.fn().mockReturnValue(mockSession) };
const ctx = { requestId: "req_test" };

describe("ClickHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (resolveLocator as any).mockReturnValue(fakeLoc);
    mockSession.getPage.mockReturnValue({ pageId: "page_001", page: mockPage });
    mockManager.get.mockReturnValue(mockSession);
  });

  it("resolves the target and clicks with the default timeout", async () => {
    const result = await new ClickHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "role", role: "button", name: "Send" } }, ctx);
    expect(resolveLocator).toHaveBeenCalledWith(mockPage, { by: "role", role: "button", name: "Send" });
    expect(fakeLoc.click).toHaveBeenCalledWith({ timeout: 15000 });
    expect(result).toEqual({ pageId: "page_001", clicked: true });
  });

  it("passes a custom timeout and pageId", async () => {
    await new ClickHandler(mockManager as any).execute(
      { sessionId: "ses", pageId: "page_002", target: { by: "css", selector: "#x" }, timeoutMs: 3000 }, ctx);
    expect(mockSession.getPage).toHaveBeenCalledWith("page_002");
    expect(fakeLoc.click).toHaveBeenCalledWith({ timeout: 3000 });
  });
});
