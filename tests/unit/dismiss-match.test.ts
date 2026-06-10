import { describe, it, expect } from "vitest";
import { pickDismissTargets, DEFAULT_DISMISS_LABELS } from "../../src/commands/dismiss";
import type { ObserveResult } from "../../src/sessions/types";

const r = (over: Partial<ObserveResult>): ObserveResult => ({
  pageId: "p", url: "u", title: "t", observeId: "o", actions: [], overlays: [], diff: null,
  stats: { totalInteractive: 0, returned: 0, elapsedMs: 0 }, ...over,
});

describe("pickDismissTargets", () => {
  it("matches affirmative labels only on overlay-related elements", () => {
    const obs = r({
      overlays: [{ kind: "modal", name: "cookies", coverPct: 100, blocking: true }],
      actions: [
        { ref: "e0", role: "button", name: "Accept all", tag: "BUTTON", box: { x:0,y:0,w:1,h:1 }, state: "actionable", occludedBy: undefined },
        { ref: "e1", role: "button", name: "Manage settings", tag: "BUTTON", box: { x:0,y:0,w:1,h:1 }, state: "actionable" },
        { ref: "e2", role: "button", name: "Buy now", tag: "BUTTON", box: { x:0,y:0,w:1,h:1 }, state: "actionable" },
      ],
    });
    const picks = pickDismissTargets(obs, DEFAULT_DISMISS_LABELS);
    expect(picks.map((p) => p.ref)).toEqual(["e0"]);   // not "Manage", not "Buy now"
  });

  it("returns nothing when there is no overlay", () => {
    const obs = r({ actions: [{ ref: "e0", role: "button", name: "Accept all", tag: "BUTTON", box: { x:0,y:0,w:1,h:1 }, state: "actionable" }] });
    expect(pickDismissTargets(obs, DEFAULT_DISMISS_LABELS)).toEqual([]);
  });
});
