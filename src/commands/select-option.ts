import type { CommandHandler, CommandContext } from "./handler";
import type { SelectOptionInput, SelectOptionOutput } from "../sessions/types";
import { resolveLocator } from "../browser/locators";
import { withActionErrors } from "./input-errors";

interface IManager {
  get(sessionId: string): { getPage(pageId?: string): { pageId: string; page: import("playwright").Page } };
}

export class SelectOptionHandler implements CommandHandler<SelectOptionInput, SelectOptionOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: SelectOptionInput, _ctx: CommandContext): Promise<SelectOptionOutput> {
    const { sessionId, pageId, target, values, timeoutMs } = input;
    const { pageId: resolvedPageId, page } = this.manager.get(sessionId).getPage(pageId);
    const loc = resolveLocator(page, target);
    const selected = await withActionErrors(loc, "select-option", () =>
      loc.selectOption(values, { timeout: timeoutMs ?? 15000 })
    );
    return { pageId: resolvedPageId, selected };
  }
}
