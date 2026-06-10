import type { CommandHandler, CommandContext } from "./handler";
import type { ClickInput, ClickOutput } from "../sessions/types";
import { resolveActionable } from "../browser/locators";
import { withActionErrors, isNavigationTeardown } from "./input-errors";

interface IManager {
  get(sessionId: string): {
    getPage(pageId?: string): { pageId: string; page: import("playwright").Page };
    getObserveCache(pageId: string): { refs: Map<string, import("playwright").ElementHandle> } | undefined;
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
    try {
      await withActionErrors(probe, "click", () => act.click({ timeout: timeoutMs ?? 15000 }));
      return { pageId: resolvedPageId, clicked: true };
    } catch (err) {
      if (isNavigationTeardown(err)) return { pageId: resolvedPageId, clicked: true, navigated: true };
      throw err;
    }
  }
}
