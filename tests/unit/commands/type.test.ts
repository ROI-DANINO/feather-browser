import { vi, describe, it, expect, beforeEach } from "vitest";
import { TypeHandler } from "../../../src/commands/type";
import { resolveLocator, resolveActionable } from "../../../src/browser/locators";

vi.mock("../../../src/browser/locators", () => ({ resolveLocator: vi.fn(), resolveActionable: vi.fn() }));

const fakeLoc = {
  fill: vi.fn().mockResolvedValue(undefined),
  pressSequentially: vi.fn().mockResolvedValue(undefined),
  typeSequentially: vi.fn().mockResolvedValue(undefined),
  count: vi.fn().mockResolvedValue(1),
};
const probe = vi.fn().mockResolvedValue(1);
const mockPage = {};
const mockSession = {
  getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: mockPage }),
  getObserveCache: vi.fn().mockReturnValue(undefined),
};
const mockManager = { get: vi.fn().mockReturnValue(mockSession) };
const ctx = { requestId: "req_test" };

describe("TypeHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (resolveLocator as any).mockReturnValue(fakeLoc);
    (resolveActionable as any).mockReturnValue({ act: fakeLoc, probe });
    mockSession.getPage.mockReturnValue({ pageId: "page_001", page: mockPage });
    mockSession.getObserveCache.mockReturnValue(undefined);
    mockManager.get.mockReturnValue(mockSession);
  });

  it("secure default: types sequentially with a per-keystroke delay in [50,150]", async () => {
    const result = await new TypeHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "placeholder", text: "Message" }, text: "hello world" }, ctx);
    expect(fakeLoc.typeSequentially).toHaveBeenCalledTimes(1);
    const [value, opts] = fakeLoc.typeSequentially.mock.calls[0];
    expect(value).toBe("hello world");
    expect(opts.delay).toBeGreaterThanOrEqual(50);
    expect(opts.delay).toBeLessThanOrEqual(150);
    expect(opts.timeout).toBe(15000);
    expect(fakeLoc.fill).not.toHaveBeenCalled();
    expect(result).toEqual({ pageId: "page_001", typed: true });
  });

  it("explicit mode:fill overrides the secure default (fast path)", async () => {
    await new TypeHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "#e" }, text: "hi", mode: "fill" }, ctx);
    expect(fakeLoc.fill).toHaveBeenCalledWith("hi", { timeout: 15000 });
    expect(fakeLoc.typeSequentially).not.toHaveBeenCalled();
  });

  it('honors explicit mode:"sequential" + delayMs', async () => {
    await new TypeHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "#e" }, text: "hi", mode: "sequential", delayMs: 20, timeoutMs: 5000 }, ctx);
    expect(fakeLoc.typeSequentially).toHaveBeenCalledWith("hi", { delay: 20, timeout: 5000 });
    expect(fakeLoc.fill).not.toHaveBeenCalled();
  });
});
