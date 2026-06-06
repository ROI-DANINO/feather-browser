import { vi, describe, it, expect, beforeEach } from "vitest";
import { resolveLocator } from "../../../src/browser/locators";

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
