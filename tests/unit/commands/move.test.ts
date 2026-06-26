// tests/unit/commands/move.test.ts
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MoveHandler } from "../../../src/commands/move";
import { resolveActionable } from "../../../src/browser/locators";

vi.mock("../../../src/browser/locators", () => ({ resolveActionable: vi.fn() }));

const ZERO_DELAY = { seed: 1, minDelayMs: 0, maxDelayMs: 0 }; // no real setTimeout waits in tests
const mockMouse = { move: vi.fn().mockResolvedValue(undefined) };
const mockPage = { mouse: mockMouse, viewportSize: () => ({ width: 1280, height: 800 }) };
const mockSession = {
  getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: mockPage }),
  getObserveCache: vi.fn().mockReturnValue(undefined),
};
const mockManager = { get: vi.fn().mockReturnValue(mockSession) };
const ctx = { requestId: "req_test" };

describe("MoveHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.getPage.mockReturnValue({ pageId: "page_001", page: mockPage });
    mockSession.getObserveCache.mockReturnValue(undefined);
    mockManager.get.mockReturnValue(mockSession);
  });

  it("moves to explicit coordinates along a multi-step path ending on target", async () => {
    const result = await new MoveHandler(mockManager as any).execute(
      { sessionId: "ses", x: 400, y: 300, opts: ZERO_DELAY }, ctx);
    expect(mockMouse.move.mock.calls.length).toBeGreaterThan(1);   // a path, not a teleport
    const lastCall = mockMouse.move.mock.calls.at(-1);
    expect(lastCall).toEqual([400, 300]);                          // lands exactly on target
    expect(result).toMatchObject({ pageId: "page_001", x: 400, y: 300 });
    expect(result.steps).toBe(mockMouse.move.mock.calls.length);
  });

  it("moves to a target's bounding-box center", async () => {
    (resolveActionable as any).mockReturnValue({
      act: { boundingBox: vi.fn().mockResolvedValue({ x: 100, y: 100, width: 40, height: 20 }) },
      probe: vi.fn().mockResolvedValue(1),
    });
    const result = await new MoveHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "#btn" }, opts: ZERO_DELAY }, ctx);
    expect(mockMouse.move.mock.calls.at(-1)).toEqual([120, 110]);  // center = (100+40/2, 100+20/2)
    expect(result).toMatchObject({ x: 120, y: 110 });
  });

  it("throws when the target has no bounding box", async () => {
    (resolveActionable as any).mockReturnValue({
      act: { boundingBox: vi.fn().mockResolvedValue(null) },
      probe: vi.fn().mockResolvedValue(1),
    });
    await expect(new MoveHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "#gone" }, opts: ZERO_DELAY }, ctx))
      .rejects.toThrow(/bounding box/i);
  });

  it("returns navigated when the move dies to navigation teardown", async () => {
    mockMouse.move.mockRejectedValueOnce(new Error("Execution context was destroyed, navigation"));
    const result = await new MoveHandler(mockManager as any).execute(
      { sessionId: "ses", x: 10, y: 10, opts: ZERO_DELAY }, ctx);
    expect(result).toMatchObject({ navigated: true });
  });

  it("continues the next move from where the last one ended (no teleport reset)", async () => {
    await new MoveHandler(mockManager as any).execute({ sessionId: "ses", x: 200, y: 200, opts: ZERO_DELAY }, ctx);
    mockMouse.move.mockClear();
    await new MoveHandler(mockManager as any).execute({ sessionId: "ses", x: 800, y: 600, opts: ZERO_DELAY }, ctx);
    expect(mockMouse.move.mock.calls[0]).toEqual([200, 200]); // 2nd path starts at 1st path's end
  });
});
