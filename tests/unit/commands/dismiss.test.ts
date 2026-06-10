// Pins DismissHandler.execute's verify-by-re-observe pipeline — especially the bare catch:
// "click threw but overlay gone → dismissed" cannot be hit from integration fixtures
// (Playwright's actionability checks pass before dispatch; teardown errors are classified
// as navigated:true by ClickHandler), so the catch path is pinned here with stubs.
import { vi, describe, it, expect, beforeEach } from "vitest";
import { DismissHandler } from "../../../src/commands/dismiss";
import { ElementNotActionableError } from "../../../src/commands/input-errors";
import type { ObserveResult, ObserveAction, Overlay } from "../../../src/sessions/types";

const { observeExecute, clickExecute } = vi.hoisted(() => ({
  observeExecute: vi.fn(),
  clickExecute: vi.fn(),
}));
vi.mock("../../../src/commands/observe", () => ({
  ObserveHandler: class { execute = observeExecute; },
}));
vi.mock("../../../src/commands/click", () => ({
  ClickHandler: class { execute = clickExecute; },
}));

const obs = (over: Partial<ObserveResult>): ObserveResult => ({
  pageId: "page_001", url: "u", title: "t", observeId: "obs_x", actions: [], overlays: [], diff: null,
  stats: { totalInteractive: 0, returned: 0, elapsedMs: 0 }, ...over,
});
const cookieWall: Overlay = { kind: "modal", name: "cookies", coverPct: 95, blocking: true };
const acceptAll: ObserveAction = {
  ref: "obs_x.e0", role: "button", name: "Accept all", tag: "BUTTON",
  box: { x: 0, y: 0, w: 10, h: 10 }, state: "actionable", overlayIndex: 0,
};

const mockManager = { get: vi.fn() };
const ctx = { requestId: "req_test" };

describe("DismissHandler.execute (pipeline with stubbed observe/click)", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("reports dismissed when the click THROWS but the verify observe shows the overlay gone", async () => {
    const baseline = obs({ overlays: [cookieWall], actions: [acceptAll] });
    const verify = obs({ observeId: "obs_y", overlays: [], actions: [] });
    observeExecute.mockResolvedValueOnce(baseline).mockResolvedValueOnce(verify);
    clickExecute.mockRejectedValueOnce(new ElementNotActionableError("covered"));   // non-teardown error: the bare catch must swallow it

    const result = await new DismissHandler(mockManager as any).execute({ sessionId: "ses" }, ctx);

    expect(clickExecute).toHaveBeenCalledWith(
      { sessionId: "ses", pageId: "page_001", target: { by: "ref", ref: "obs_x.e0" } }, ctx);
    expect(result.dismissed).toEqual([{ ref: "obs_x.e0", name: "Accept all" }]);
    expect(result.overlaysRemaining).toBe(0);
    expect(result.observation).toBe(verify);   // the fresh post-click observe, not the baseline
  });

  it("does NOT report dismissed when the click throws and the overlay is still up", async () => {
    const baseline = obs({ overlays: [cookieWall], actions: [acceptAll] });
    const verify = obs({ observeId: "obs_y", overlays: [cookieWall], actions: [{ ...acceptAll, ref: "obs_y.e0" }] });
    observeExecute.mockResolvedValueOnce(baseline).mockResolvedValueOnce(verify);
    clickExecute.mockRejectedValueOnce(new ElementNotActionableError("covered"));

    const result = await new DismissHandler(mockManager as any).execute({ sessionId: "ses" }, ctx);

    expect(result.dismissed).toEqual([]);
    expect(result.overlaysRemaining).toBe(1);
    expect(result.observation).toBe(verify);
  });

  it("returns the baseline observation untouched when no action matches a dismiss label", async () => {
    const baseline = obs({
      overlays: [cookieWall],
      actions: [{ ...acceptAll, name: "Subscribe" }],   // overlay-linked but not a dismiss label
    });
    observeExecute.mockResolvedValueOnce(baseline);

    const result = await new DismissHandler(mockManager as any).execute({ sessionId: "ses" }, ctx);

    expect(clickExecute).not.toHaveBeenCalled();
    expect(observeExecute).toHaveBeenCalledTimes(1);   // no verify pass without a click
    expect(result.dismissed).toEqual([]);
    expect(result.overlaysRemaining).toBe(1);
    expect(result.observation).toBe(baseline);
  });
});
