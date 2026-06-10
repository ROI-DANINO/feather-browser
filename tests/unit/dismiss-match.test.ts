import { describe, it, expect } from "vitest";
import { pickDismissTargets, DEFAULT_DISMISS_LABELS, overlayGone } from "../../src/commands/dismiss";
import type { ObserveResult, Overlay } from "../../src/sessions/types";

const r = (over: Partial<ObserveResult>): ObserveResult => ({
  pageId: "p", url: "u", title: "t", observeId: "o", actions: [], overlays: [], diff: null,
  stats: { totalInteractive: 0, returned: 0, elapsedMs: 0 }, ...over,
});

describe("pickDismissTargets", () => {
  it("matches affirmative labels only on overlay-related elements", () => {
    const obs = r({
      overlays: [{ kind: "modal", name: "cookies", coverPct: 100, blocking: true }],
      actions: [
        { ref: "e0", role: "button", name: "Accept all", tag: "BUTTON", box: { x:0,y:0,w:1,h:1 }, state: "actionable", overlayIndex: 0 },
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

  it("does NOT pick a label-matching button that is outside any overlay (page-level Continue)", () => {
    const obs = r({
      overlays: [{ kind: "banner", name: "notif", coverPct: 40, blocking: false }],
      actions: [
        { ref: "e0", role: "button", name: "Continue", tag: "BUTTON", box: { x:0,y:0,w:1,h:1 }, state: "actionable" },   // page's own button — no overlayIndex
        { ref: "e1", role: "button", name: "Continue", tag: "BUTTON", box: { x:0,y:0,w:1,h:1 }, state: "actionable", overlayIndex: 0 },
      ],
    });
    expect(pickDismissTargets(obs, DEFAULT_DISMISS_LABELS).map((p) => p.ref)).toEqual(["e1"]);
  });

  it("still picks covered/occluded label matches with no linked overlay", () => {
    const obs = r({
      overlays: [{ kind: "modal", name: "cookies", coverPct: 95, blocking: true }],
      actions: [{ ref: "e0", role: "button", name: "Accept all", tag: "BUTTON", box: { x:0,y:0,w:1,h:1 }, state: "covered" }],
    });
    expect(pickDismissTargets(obs, DEFAULT_DISMISS_LABELS).map((p) => p.ref)).toEqual(["e0"]);
  });
});

describe("overlayGone", () => {
  const ov = (kind: "modal" | "banner" | "iframe", name: string): Overlay => ({ kind, name, coverPct: 90, blocking: true });
  it("linked pick: true iff the (kind,name) count decreased", () => {
    expect(overlayGone([ov("modal", "cookies")], [], 0)).toBe(true);
    expect(overlayGone([ov("modal", "cookies")], [ov("modal", "cookies")], 0)).toBe(false);
    expect(overlayGone([ov("modal", ""), ov("modal", "")], [ov("modal", "")], 0)).toBe(true);   // unnamed duplicates: count rule
  });
  it("unlinked pick falls back to total count decrease", () => {
    expect(overlayGone([ov("modal", "a")], [], undefined)).toBe(true);
    expect(overlayGone([ov("modal", "a")], [ov("banner", "b")], undefined)).toBe(false);
  });
});
