import type { CommandHandler, CommandContext } from "./handler";
import type { PressInput, PressOutput } from "../sessions/types";
import { resolveLocator } from "../browser/locators";
import { withActionErrors } from "./input-errors";

interface IManager {
  get(sessionId: string): { getPage(pageId?: string): { pageId: string; page: import("playwright").Page } };
}

export class PressHandler implements CommandHandler<PressInput, PressOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: PressInput, _ctx: CommandContext): Promise<PressOutput> {
    const { sessionId, pageId, target, key, timeoutMs } = input;
    const { pageId: resolvedPageId, page } = this.manager.get(sessionId).getPage(pageId);
    if (target) {
      const loc = resolveLocator(page, target);
      await withActionErrors(loc, "press", () => loc.press(key, { timeout: timeoutMs ?? 15000 }));
    } else {
      await page.keyboard.press(key);
    }
    return { pageId: resolvedPageId, pressed: key };
  }
}
