import type { CommandHandler, CommandContext } from "./handler";
import type { ClickInput, ClickOutput } from "../sessions/types";
import { resolveActionable } from "../browser/locators";
import { withActionErrors, isNavigationTeardown } from "./input-errors";

interface IManager {
  get(sessionId: string): {
    getPage(pageId?: string): { pageId: string; page: import("playwright").Page };
    getObserveCache(pageId: string): { refs: Map<string, import("playwright").ElementHandle> } | undefined;
    getPageIdFor(page: import("playwright").Page): string | undefined;
  };
}

export class ClickHandler implements CommandHandler<ClickInput, ClickOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: ClickInput, _ctx: CommandContext): Promise<ClickOutput> {
    const { sessionId, pageId, target, timeoutMs } = input;
    const session = this.manager.get(sessionId);
    const { pageId: resolvedPageId, page } = session.getPage(pageId);
    const refLookup = (r: string) => session.getObserveCache(resolvedPageId)?.refs.get(r);
    const { act, probe } = resolveActionable(page, target, refLookup);
    // Best-effort popup signal: the manager's context.on("page") listener (registered at launch,
    // so it fires first) has already addPage()d any popup by the time this one observes it.
    // GET /tabs is the ground truth when the event lands outside the click window.
    const context = page.context();
    let popup: import("playwright").Page | undefined;
    const onPage = (p: import("playwright").Page) => { popup = p; };
    context.on("page", onPage);
    try {
      await withActionErrors(probe, "click", () => act.click({ timeout: timeoutMs ?? 15000 }));
      const newPageId = popup ? session.getPageIdFor(popup) : undefined;
      return { pageId: resolvedPageId, clicked: true, ...(newPageId !== undefined ? { newPageId } : {}) };
    } catch (err) {
      if (isNavigationTeardown(err)) return { pageId: resolvedPageId, clicked: true, navigated: true };
      throw err;
    } finally {
      context.off("page", onPage);
    }
  }
}
