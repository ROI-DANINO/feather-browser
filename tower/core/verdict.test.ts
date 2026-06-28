// tower/core/verdict.test.ts
import { describe, it, expect } from "vitest";
import { decideOutcome } from "./verdict";

const g = (verdict: any, cause: string | null, suggestedFix: string | null) =>
  ({ verdict, cause, suggestedFix });

describe("decideOutcome", () => {
  it("ok -> WIN", () => expect(decideOutcome(g("ok", null, null))).toBe("WIN"));
  it("blocked -> FAIL", () => expect(decideOutcome(g("blocked", null, null))).toBe("FAIL"));
  it("error -> UNTESTABLE", () => expect(decideOutcome(g("error", null, null))).toBe("UNTESTABLE"));

  it("gated WITH cause+fix -> PARTIAL", () =>
    expect(decideOutcome(g("gated", "tripped soft check", "add X"))).toBe("PARTIAL"));

  it("gated WITHOUT a fix -> downgrades to FAIL", () =>
    expect(decideOutcome(g("gated", "tripped soft check", null))).toBe("FAIL"));

  it("gated WITHOUT a cause -> downgrades to FAIL", () =>
    expect(decideOutcome(g("gated", null, "add X"))).toBe("FAIL"));

  it("gated with empty-string fix -> downgrades to FAIL", () =>
    expect(decideOutcome(g("gated", "c", "   "))).toBe("FAIL"));
});
