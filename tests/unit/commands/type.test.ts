import { vi, describe, it, expect, beforeEach } from "vitest";
import { TypeHandler } from "../../../src/commands/type";
import { resolveLocator } from "../../../src/browser/locators";

vi.mock("../../../src/browser/locators", () => ({ resolveLocator: vi.fn() }));

const fakeLoc = {
  fill: vi.fn().mockResolvedValue(undefined),
  pressSequentially: vi.fn().mockResolvedValue(undefined),
  count: vi.fn().mockResolvedValue(1),
};
const mockPage = {};
const mockSession = { getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: mockPage }) };
const mockManager = { get: vi.fn().mockReturnValue(mockSession) };
const ctx = { requestId: "req_test" };

describe("TypeHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (resolveLocator as any).mockReturnValue(fakeLoc);
    mockSession.getPage.mockReturnValue({ pageId: "page_001", page: mockPage });
    mockManager.get.mockReturnValue(mockSession);
  });

  it("uses fill by default with the default timeout", async () => {
    const result = await new TypeHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "placeholder", text: "Message" }, text: "hello world" }, ctx);
    expect(fakeLoc.fill).toHaveBeenCalledWith("hello world", { timeout: 15000 });
    expect(fakeLoc.pressSequentially).not.toHaveBeenCalled();
    expect(result).toEqual({ pageId: "page_001", typed: true });
  });

  it('uses pressSequentially with delay when mode is "sequential"', async () => {
    await new TypeHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "#e" }, text: "hi", mode: "sequential", delayMs: 20, timeoutMs: 5000 }, ctx);
    expect(fakeLoc.pressSequentially).toHaveBeenCalledWith("hi", { delay: 20, timeout: 5000 });
    expect(fakeLoc.fill).not.toHaveBeenCalled();
  });
});
