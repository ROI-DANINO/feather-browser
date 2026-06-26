import { vi, describe, it, expect, beforeEach } from "vitest";
import { resolveLocator, resolveActionable } from "../../../src/browser/locators";

const loc = {
  first: vi.fn().mockReturnValue("FIRST"),
  last: vi.fn().mockReturnValue("LAST"),
  nth: vi.fn().mockReturnValue("NTH"),
};
const page = {
  getByRole: vi.fn().mockReturnValue(loc),
  getByText: vi.fn().mockReturnValue(loc),
  getByPlaceholder: vi.fn().mockReturnValue(loc),
  getByTestId: vi.fn().mockReturnValue(loc),
  locator: vi.fn().mockReturnValue(loc),
};

describe("resolveLocator", () => {
  beforeEach(() => vi.clearAllMocks());

  it("role with name maps to getByRole + first() by default", () => {
    const r = resolveLocator(page as any, { by: "role", role: "button", name: "Send" });
    expect(page.getByRole).toHaveBeenCalledWith("button", { name: "Send", exact: undefined });
    expect(loc.first).toHaveBeenCalled();
    expect(r).toBe("FIRST");
  });

  it("role without name passes undefined options", () => {
    resolveLocator(page as any, { by: "role", role: "button" });
    expect(page.getByRole).toHaveBeenCalledWith("button", undefined);
  });

  it("text maps to getByText with exact", () => {
    resolveLocator(page as any, { by: "text", text: "Hello", exact: true });
    expect(page.getByText).toHaveBeenCalledWith("Hello", { exact: true });
  });

  it("placeholder maps to getByPlaceholder", () => {
    resolveLocator(page as any, { by: "placeholder", text: "Message" });
    expect(page.getByPlaceholder).toHaveBeenCalledWith("Message");
  });

  it("testid maps to getByTestId", () => {
    resolveLocator(page as any, { by: "testid", testId: "send" });
    expect(page.getByTestId).toHaveBeenCalledWith("send");
  });

  it("css maps to locator", () => {
    resolveLocator(page as any, { by: "css", selector: "#x" });
    expect(page.locator).toHaveBeenCalledWith("#x");
  });

  it('at:"last" uses last()', () => {
    const r = resolveLocator(page as any, { by: "css", selector: ".x", at: "last" });
    expect(loc.last).toHaveBeenCalled();
    expect(r).toBe("LAST");
  });

  it("at:number uses nth(n)", () => {
    const r = resolveLocator(page as any, { by: "css", selector: ".x", at: 2 });
    expect(loc.nth).toHaveBeenCalledWith(2);
    expect(r).toBe("NTH");
  });
});

describe("resolveActionable boundingBox", () => {
  it("locator branch delegates boundingBox to the locator", async () => {
    const loc = {
      first: () => loc, last: () => loc, nth: () => loc,
      boundingBox: vi.fn().mockResolvedValue({ x: 10, y: 20, width: 30, height: 40 }),
      count: vi.fn().mockResolvedValue(1),
    } as any;
    const page = { locator: () => loc } as any;
    const { act } = resolveActionable(page, { by: "css", selector: "#x" });
    await expect(act.boundingBox({ timeout: 1000 })).resolves.toEqual({ x: 10, y: 20, width: 30, height: 40 });
    expect(loc.boundingBox).toHaveBeenCalledWith({ timeout: 1000 });
  });

  it("ref branch delegates boundingBox to the element handle", async () => {
    const handle = { boundingBox: vi.fn().mockResolvedValue({ x: 1, y: 2, width: 3, height: 4 }) } as any;
    const refLookup = (_r: string) => handle;
    const { act } = resolveActionable({} as any, { by: "ref", ref: "e1" }, refLookup);
    await expect(act.boundingBox()).resolves.toEqual({ x: 1, y: 2, width: 3, height: 4 });
    expect(handle.boundingBox).toHaveBeenCalled();
  });
});
