import { vi, describe, it, expect, beforeEach } from "vitest";
import { errors } from "playwright";
import { WaitHandler } from "../../../src/commands/wait";
import { resolveLocator } from "../../../src/browser/locators";

vi.mock("../../../src/browser/locators", () => ({ resolveLocator: vi.fn() }));

let fakeLoc: any;
const mockPage = {};
const mockSession = { getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: mockPage }) };
const mockManager = { get: vi.fn().mockReturnValue(mockSession) };
const ctx = { requestId: "req_test" };

beforeEach(() => {
  vi.clearAllMocks();
  fakeLoc = {
    waitFor: vi.fn().mockResolvedValue(undefined),
    textContent: vi.fn(),
  };
  (resolveLocator as any).mockReturnValue(fakeLoc);
  mockSession.getPage.mockReturnValue({ pageId: "page_001", page: mockPage });
  mockManager.get.mockReturnValue(mockSession);
});

describe("WaitHandler — flavour A (element state)", () => {
  it("calls waitFor with the requested state and returns matched:true", async () => {
    const result = await new WaitHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "#x" }, until: "visible", timeoutMs: 4000 }, ctx);
    expect(fakeLoc.waitFor).toHaveBeenCalledWith({ state: "visible", timeout: 4000 });
    expect(result).toEqual({ pageId: "page_001", matched: true });
  });

  it("maps a Playwright TimeoutError to WAIT_TIMEOUT", async () => {
    fakeLoc.waitFor.mockRejectedValueOnce(new errors.TimeoutError("nope"));
    const run = new WaitHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "#x" }, until: "visible" }, ctx);
    await expect(run.catch((e) => e.code)).resolves.toBe("WAIT_TIMEOUT");
  });
});

describe("WaitHandler — flavour B (stable)", () => {
  it("does not settle on the empty window, then settles with the final text", async () => {
    // attached first, then: empty, empty, growing, then constant
    const seq = ["", "", "hel", "hello", "hello", "hello", "hello", "hello"];
    let i = 0;
    fakeLoc.textContent.mockImplementation(async () => seq[Math.min(i++, seq.length - 1)]);
    const result = (await new WaitHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "#answer" }, until: "stable", quietMs: 20, pollMs: 5, timeoutMs: 5000 },
      ctx)) as { settled: true; text: string; elapsedMs: number };
    expect(fakeLoc.waitFor).toHaveBeenCalledWith({ state: "attached", timeout: 5000 });
    expect(result.settled).toBe(true);
    expect(result.text).toBe("hello");
    expect(result.elapsedMs).toBeGreaterThanOrEqual(20);
  });

  it("throws WAIT_TIMEOUT when text never stabilises", async () => {
    let n = 0;
    fakeLoc.textContent.mockImplementation(async () => `growing-${n++}`); // always changing
    const run = new WaitHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "#answer" }, until: "stable", quietMs: 50, pollMs: 5, timeoutMs: 60 },
      ctx);
    await expect(run.catch((e) => e.code)).resolves.toBe("WAIT_TIMEOUT");
  });
});
