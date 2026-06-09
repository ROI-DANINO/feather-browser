// tests/unit/perception-diff.test.ts
import { describe, it, expect } from "vitest";
import { computeDiff, type DiffRow } from "../../src/commands/perception/diff";

const row = (sig: string, ref: string, state: DiffRow["state"], name = sig): DiffRow =>
  ({ signature: sig, ref, name, role: "button", state });

describe("computeDiff", () => {
  it("returns null when there is no previous observe", () => {
    expect(computeDiff(undefined, [row("a", "e0", "actionable")])).toBeNull();
  });

  it("detects added / removed / changed", () => {
    const prev = [row("a", "e0", "covered"), row("b", "e1", "actionable")];
    const curr = [row("a", "e0", "actionable"), row("c", "e1", "actionable", "New")];
    const d = computeDiff(prev, curr)!;
    expect(d.added).toEqual([{ ref: "e1", desc: "button 'New'" }]);
    expect(d.removed).toEqual([{ desc: "button 'b'" }]);
    expect(d.changed).toEqual([{ ref: "e0", change: "now-actionable", was: "covered" }]);
  });

  it("reports a name change as changed", () => {
    const prev = [row("a", "e0", "actionable", "Old")];
    const curr = [row("a", "e0", "actionable", "Newer")];
    const d = computeDiff(prev, curr)!;
    expect(d.changed).toEqual([{ ref: "e0", change: "renamed", was: "Old" }]);
  });
});
