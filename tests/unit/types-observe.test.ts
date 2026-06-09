import { describe, it, expect } from "vitest";
import type { Target, ObserveResult, ObserveAction } from "../../src/sessions/types";
import { RefExpiredError } from "../../src/commands/input-errors";

describe("observe types", () => {
  it("Target accepts a ref variant", () => {
    const t: Target = { by: "ref", ref: "e3" };
    expect(t.by).toBe("ref");
  });
  it("ObserveAction has the agreed shape", () => {
    const a: ObserveAction = {
      ref: "e0", role: "button", name: "OK", tag: "BUTTON",
      box: { x: 1, y: 2, w: 3, h: 4 }, state: "actionable",
    };
    expect(a.state).toBe("actionable");
  });
  it("RefExpiredError carries the code", () => {
    expect(new RefExpiredError("x").code).toBe("REF_EXPIRED");
  });
});
