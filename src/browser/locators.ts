import type { Page, Locator, ElementHandle } from "playwright";
import type { Target } from "../sessions/types";
import { RefExpiredError } from "../commands/input-errors";

export interface Actionable {
  click(options?: { timeout?: number }): Promise<void>;
  fill(value: string, options?: { timeout?: number }): Promise<void>;
  press(key: string, options?: { timeout?: number }): Promise<void>;
  selectOption(values: string | string[], options?: { timeout?: number }): Promise<string[]>;
}

export type RefLookup = (ref: string) => ElementHandle | undefined;

function base(page: Page, t: Target): Locator {
  switch (t.by) {
    case "role":
      return page.getByRole(
        t.role as Parameters<Page["getByRole"]>[0],
        t.name !== undefined ? { name: t.name, exact: t.exact } : undefined,
      );
    case "text":
      return page.getByText(t.text, { exact: t.exact });
    case "placeholder":
      return page.getByPlaceholder(t.text);
    case "testid":
      return page.getByTestId(t.testId);
    case "css":
      return page.locator(t.selector);
    case "ref":
      throw new Error("resolveLocator called with a ref target — use resolveActionable instead");
  }
}

/** Turn a Target into a single-element Locator (never strict-mode-throws). */
export function resolveLocator(page: Page, target: Target): Locator {
  const loc = base(page, target);
  const at = target.at ?? "first";
  if (at === "first") return loc.first();
  if (at === "last") return loc.last();
  return loc.nth(at);
}

/** Resolve a Target to an actionable + an existence probe. Refs come from the observe cache. */
export function resolveActionable(
  page: Page, target: Target, refLookup?: RefLookup,
): { act: Actionable; probe: () => Promise<number> } {
  if (target.by === "ref") {
    const handle = refLookup?.(target.ref);
    if (!handle) throw new RefExpiredError(`Ref "${target.ref}" is from a superseded observe — re-observe and use a fresh ref.`);
    return {
      act: handle as unknown as Actionable,
      probe: () => handle.evaluate((e: Element) => (e.isConnected ? 1 : 0)).catch(() => 0),
    };
  }
  const loc = resolveLocator(page, target);
  return { act: loc as unknown as Actionable, probe: () => loc.count() };
}
