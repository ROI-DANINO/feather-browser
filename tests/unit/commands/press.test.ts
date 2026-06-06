import { vi, describe, it, expect, beforeEach } from "vitest";
import { PressHandler } from "../../../src/commands/press";
import { resolveLocator } from "../../../src/browser/locators";

vi.mock("../../../src/browser/locators", () => ({ resolveLocator: vi.fn() }));

const fakeLoc = { press: vi.fn().mockResolvedValue(undefined), count: vi.fn().mockResolvedValue(1) };
const keyboard = { press: vi.fn().mockResolvedValue(undefined) };
const mockPage = { keyboard };
const mockSession = { getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: mockPage }) };
const mockManager = { get: vi.fn().mockReturnValue(mockSession) };
const ctx = { requestId: "req_test" };

describe("PressHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (resolveLocator as any).mockReturnValue(fakeLoc);
    mockSession.getPage.mockReturnValue({ pageId: "page_001", page: mockPage });
    mockManager.get.mockReturnValue(mockSession);
  });

  it("presses on the resolved target when a target is given", async () => {
    const result = await new PressHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "#inp" }, key: "Enter" }, ctx);
    expect(fakeLoc.press).toHaveBeenCalledWith("Enter", { timeout: 15000 });
    expect(keyboard.press).not.toHaveBeenCalled();
    expect(result).toEqual({ pageId: "page_001", pressed: "Enter" });
  });

  it("presses on the focused element via keyboard when no target is given", async () => {
    await new PressHandler(mockManager as any).execute({ sessionId: "ses", key: "Enter" }, ctx);
    expect(keyboard.press).toHaveBeenCalledWith("Enter");
    expect(fakeLoc.press).not.toHaveBeenCalled();
  });
});
