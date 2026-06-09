// tests/unit/resolve-actionable.test.ts
import { describe, it, expect } from "vitest";
import { resolveActionable } from "../../src/browser/locators";
import { RefExpiredError } from "../../src/commands/input-errors";

describe("resolveActionable", () => {
  it("throws REF_EXPIRED when the ref is unknown", () => {
    const page = {} as any;
    expect(() => resolveActionable(page, { by: "ref", ref: "e9" }, () => undefined)).toThrow(RefExpiredError);
  });

  it("returns the cached handle for a known ref", () => {
    const fake = { click: async () => {} } as any;
    const page = {} as any;
    const { act } = resolveActionable(page, { by: "ref", ref: "e0" }, (r) => (r === "e0" ? fake : undefined));
    expect(act).toBe(fake);
  });

  it("falls back to a Locator for non-ref targets", () => {
    const loc = { first: () => loc } as any;
    const page = { getByText: () => loc } as any;
    const { act } = resolveActionable(page, { by: "text", text: "Hi" });
    expect(act).toBe(loc);
  });
});
