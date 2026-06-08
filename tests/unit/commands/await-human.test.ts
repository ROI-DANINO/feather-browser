import { vi, describe, it, expect, beforeEach } from "vitest";
import { AwaitHumanHandler } from "../../../src/commands/await-human";
import { resolveLocator } from "../../../src/browser/locators";
import { resumePause, peekPause, _resetForTests } from "../../../src/commands/pause-registry";
import { onBusEvent } from "../../../src/logs/bus";

vi.mock("../../../src/browser/locators", () => ({ resolveLocator: vi.fn() }));

const mockPage: any = {};
const mockSession = { getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: mockPage }) };
const mockManager = { get: vi.fn().mockReturnValue(mockSession) };
const ctx = { requestId: "req_test" };

beforeEach(() => {
  vi.clearAllMocks();
  _resetForTests();
  mockPage.evaluate = vi.fn().mockResolvedValue(undefined); // banner show/remove run through here
  mockSession.getPage.mockReturnValue({ pageId: "page_001", page: mockPage });
  mockManager.get.mockReturnValue(mockSession);
  (resolveLocator as any).mockReturnValue({ waitFor: vi.fn(() => new Promise(() => {})) }); // never resolves by default
});

describe("AwaitHumanHandler", () => {
  it("resolves resumedBy:'human' when the pause is resumed, and emits the request event", async () => {
    let resumePath = "";
    const unsub = onBusEvent((e) => { if (e.event === "human.pause.requested") resumePath = (e.data as any).resumePath; });
    const run = new AwaitHumanHandler(mockManager as any).execute(
      { sessionId: "ses_1", reason: "Solve the CAPTCHA", timeoutMs: 5000 }, ctx);
    // Let the handler register + emit, then resume via the captured token.
    await vi.waitFor(() => expect(resumePath).not.toBe(""));
    const token = resumePath.split("token=")[1];
    expect(peekPause(token)).toEqual({ sessionId: "ses_1", reason: "Solve the CAPTCHA" });
    expect(resumePause(token, "ses_1")).toBe(true);
    const result = await run;
    expect(result).toMatchObject({ pageId: "page_001", resumedBy: "human" });
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
    unsub();
  });

  it("resolves resumedBy:'timeout' when nothing happens before the deadline", async () => {
    const result = await new AwaitHumanHandler(mockManager as any).execute(
      { sessionId: "ses_1", reason: "x", timeoutMs: 20 }, ctx);
    expect(result.resumedBy).toBe("timeout");
  });

  it("resolves resumedBy:'signal' when the resumeOn locator state is reached", async () => {
    (resolveLocator as any).mockReturnValue({ waitFor: vi.fn().mockResolvedValue(undefined) });
    const result = await new AwaitHumanHandler(mockManager as any).execute(
      { sessionId: "ses_1", reason: "x", timeoutMs: 5000,
        resumeOn: { target: { by: "css", selector: "#done" }, until: "visible" } }, ctx);
    expect(result.resumedBy).toBe("signal");
    expect(resolveLocator).toHaveBeenCalledWith(mockPage, { by: "css", selector: "#done" });
  });

  it("a failing resumeOn locator does not reject the race (falls through to timeout)", async () => {
    (resolveLocator as any).mockReturnValue({ waitFor: vi.fn().mockRejectedValue(new Error("not found")) });
    const result = await new AwaitHumanHandler(mockManager as any).execute(
      { sessionId: "ses_1", reason: "x", timeoutMs: 30,
        resumeOn: { target: { by: "css", selector: "#done" }, until: "visible" } }, ctx);
    expect(result.resumedBy).toBe("timeout");
  });

  it("injects the banner on pause and removes it on resolve (banner default on)", async () => {
    await new AwaitHumanHandler(mockManager as any).execute(
      { sessionId: "ses_1", reason: "x", timeoutMs: 20 }, ctx);
    // showBanner + removeBanner each run one page.evaluate
    expect(mockPage.evaluate).toHaveBeenCalledTimes(2);
  });

  it("skips banner injection when banner:false", async () => {
    await new AwaitHumanHandler(mockManager as any).execute(
      { sessionId: "ses_1", reason: "x", timeoutMs: 20, banner: false }, ctx);
    expect(mockPage.evaluate).not.toHaveBeenCalled();
  });

  it("a banner injection failure does not break the pause", async () => {
    mockPage.evaluate = vi.fn().mockRejectedValue(new Error("page navigated"));
    const result = await new AwaitHumanHandler(mockManager as any).execute(
      { sessionId: "ses_1", reason: "x", timeoutMs: 20 }, ctx);
    expect(result.resumedBy).toBe("timeout");
  });
});
