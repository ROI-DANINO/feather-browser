import { vi, describe, it, expect, beforeEach } from "vitest";
import { ClickHandler } from "../../../src/commands/click";
import { resolveActionable } from "../../../src/browser/locators";

vi.mock("../../../src/browser/locators", () => ({ resolveActionable: vi.fn(), resolveLocator: vi.fn() }));

const fakeAct = { click: vi.fn().mockResolvedValue(undefined) };
const probe = vi.fn().mockResolvedValue(1);
let capturedPageCb: ((p: unknown) => void) | undefined;
const mockContext = {
  on: vi.fn((event: string, cb: (p: unknown) => void) => {
    if (event === "page") capturedPageCb = cb;
  }),
  off: vi.fn(),
};
const mockPage = { context: () => mockContext };
const mockSession = {
  getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: mockPage }),
  getObserveCache: vi.fn().mockReturnValue(undefined),
  getPageIdFor: vi.fn().mockReturnValue(undefined),
};
const mockManager = { get: vi.fn().mockReturnValue(mockSession) };
const ctx = { requestId: "req_test" };

describe("ClickHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedPageCb = undefined;
    mockContext.on.mockImplementation((event: string, cb: (p: unknown) => void) => {
      if (event === "page") capturedPageCb = cb;
    });
    (resolveActionable as any).mockReturnValue({ act: fakeAct, probe });
    mockSession.getPage.mockReturnValue({ pageId: "page_001", page: mockPage });
    mockSession.getObserveCache.mockReturnValue(undefined);
    mockSession.getPageIdFor.mockReturnValue(undefined);
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

  it("returns clicked+navigated when the click dies to navigation teardown", async () => {
    fakeAct.click.mockRejectedValueOnce(new Error("Execution context was destroyed, most likely because of a navigation"));
    const result = await new ClickHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "a" } }, ctx);
    expect(result).toEqual({ pageId: "page_001", clicked: true, navigated: true });
  });

  it("still rethrows non-navigation errors", async () => {
    fakeAct.click.mockRejectedValueOnce(new Error("boom"));
    await expect(new ClickHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "a" } }, ctx)).rejects.toThrow("boom");
  });

  it("reports newPageId when the click spawns a new page", async () => {
    const newPage = { fake: "popup" };
    fakeAct.click.mockImplementationOnce(async () => { capturedPageCb?.(newPage); });
    mockSession.getPageIdFor.mockReturnValue("page_002");
    const result = await new ClickHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "a" } }, ctx);
    expect(result).toEqual({ pageId: "page_001", clicked: true, newPageId: "page_002" });
    expect(mockSession.getPageIdFor).toHaveBeenCalledWith(newPage);
    expect(mockContext.off).toHaveBeenCalledWith("page", expect.any(Function)); // listener detached
  });

  it("omits newPageId when no new page appeared", async () => {
    const result = await new ClickHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "a" } }, ctx);
    expect(result).toEqual({ pageId: "page_001", clicked: true });
    expect(mockContext.off).toHaveBeenCalledWith("page", expect.any(Function));
  });

  it("detaches the listener even when the click throws", async () => {
    fakeAct.click.mockRejectedValueOnce(new Error("boom"));
    await expect(new ClickHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "a" } }, ctx)).rejects.toThrow("boom");
    expect(mockContext.off).toHaveBeenCalledWith("page", expect.any(Function));
  });
});
