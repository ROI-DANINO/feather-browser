import type { CommandHandler, CommandContext } from "./handler";
import type { ClickInput, ClickOutput } from "../sessions/types";
import { resolveLocator } from "../browser/locators";
import { withActionErrors } from "./input-errors";

interface IManager {
  get(sessionId: string): { getPage(pageId?: string): { pageId: string; page: import("playwright").Page } };
}

export class ClickHandler implements CommandHandler<ClickInput, ClickOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: ClickInput, _ctx: CommandContext): Promise<ClickOutput> {
    const { sessionId, pageId, target, timeoutMs } = input;
    const { pageId: resolvedPageId, page } = this.manager.get(sessionId).getPage(pageId);
    const loc = resolveLocator(page, target);
    await withActionErrors(loc, "click", () => loc.click({ timeout: timeoutMs ?? 15000 }));
    return { pageId: resolvedPageId, clicked: true };
  }
}
