// tests/unit/resolve-actionable.test.ts
import { describe, it, expect, vi } from "vitest";
import { resolveActionable } from "../../src/browser/locators";
import { RefExpiredError } from "../../src/commands/input-errors";

describe("resolveActionable", () => {
  it("throws REF_EXPIRED when the ref is unknown", () => {
    const page = {} as any;
    expect(() => resolveActionable(page, { by: "ref", ref: "e9" }, () => undefined)).toThrow(RefExpiredError);
  });

  it("delegates click to the cached handle for a known ref", async () => {
    const fake = { click: vi.fn().mockResolvedValue(undefined) } as any;
    const page = {} as any;
    const { act } = resolveActionable(page, { by: "ref", ref: "e0" }, (r) => (r === "e0" ? fake : undefined));
    await act.click({ timeout: 1000 });
    expect(fake.click).toHaveBeenCalledWith({ timeout: 1000 });
  });

  it("delegates click to the Locator for non-ref targets", async () => {
    const loc = { first: () => loc, click: vi.fn().mockResolvedValue(undefined) } as any;
    const page = { getByText: () => loc } as any;
    const { act } = resolveActionable(page, { by: "text", text: "Hi" });
    await act.click({ timeout: 1000 });
    expect(loc.click).toHaveBeenCalledWith({ timeout: 1000 });
  });
});

describe("resolveActionable typeSequentially seam", () => {
  it("delegates to Locator.pressSequentially for selector targets", async () => {
    const loc = { pressSequentially: vi.fn().mockResolvedValue(undefined), count: vi.fn().mockResolvedValue(1) };
    const page = { locator: vi.fn().mockReturnValue({ first: () => loc, last: () => loc, nth: () => loc }) } as any;
    const { act } = resolveActionable(page, { by: "css", selector: "#x" });
    await act.typeSequentially("hi", { delay: 70, timeout: 5000 });
    expect(loc.pressSequentially).toHaveBeenCalledWith("hi", { delay: 70, timeout: 5000 });
  });

  it("delegates to ElementHandle.type for ref targets", async () => {
    const handle = { type: vi.fn().mockResolvedValue(undefined), evaluate: vi.fn().mockResolvedValue(1) } as any;
    const refLookup = (_r: string) => handle;
    const { act } = resolveActionable({} as any, { by: "ref", ref: "obs.e1" }, refLookup);
    await act.typeSequentially("hi", { delay: 70, timeout: 5000 });
    expect(handle.type).toHaveBeenCalledWith("hi", { delay: 70, timeout: 5000 });
  });
});
