import type { CommandHandler, CommandContext } from "./handler";
import type { PressInput, PressOutput } from "../sessions/types";
import { resolveActionable } from "../browser/locators";
import { withActionErrors, isNavigationTeardown } from "./input-errors";

interface IManager {
  get(sessionId: string): {
    getPage(pageId?: string): { pageId: string; page: import("playwright").Page };
    getObserveCache(pageId: string): { refs: Map<string, import("playwright").ElementHandle> } | undefined;
  };
}

export class PressHandler implements CommandHandler<PressInput, PressOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: PressInput, _ctx: CommandContext): Promise<PressOutput> {
    const { sessionId, pageId, target, key, timeoutMs } = input;
    const session = this.manager.get(sessionId);
    const { pageId: resolvedPageId, page } = session.getPage(pageId);
    try {
      if (target) {
        const refLookup = (r: string) => session.getObserveCache(resolvedPageId)?.refs.get(r);
        const { act, probe } = resolveActionable(page, target, refLookup);
        await withActionErrors(probe, "press", () => act.press(key, { timeout: timeoutMs ?? 15000 }));
      } else {
        await page.keyboard.press(key);
      }
      return { pageId: resolvedPageId, pressed: key };
    } catch (err) {
      if (isNavigationTeardown(err)) return { pageId: resolvedPageId, pressed: key, navigated: true };
      throw err;
    }
  }
}
