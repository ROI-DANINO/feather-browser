import type { Page, Locator } from "playwright";
import type { Target } from "../sessions/types";

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
