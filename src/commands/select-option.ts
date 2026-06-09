import type { CommandHandler, CommandContext } from "./handler";
import type { SelectOptionInput, SelectOptionOutput } from "../sessions/types";
import { resolveActionable } from "../browser/locators";
import { withActionErrors } from "./input-errors";

interface IManager {
  get(sessionId: string): {
    getPage(pageId?: string): { pageId: string; page: import("playwright").Page };
    getObserveCache(pageId: string): { refs: Map<string, import("playwright").ElementHandle> } | undefined;
  };
}

export class SelectOptionHandler implements CommandHandler<SelectOptionInput, SelectOptionOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: SelectOptionInput, _ctx: CommandContext): Promise<SelectOptionOutput> {
    const { sessionId, pageId, target, values, timeoutMs } = input;
    const session = this.manager.get(sessionId);
    const { pageId: resolvedPageId, page } = session.getPage(pageId);
    const refLookup = (r: string) => session.getObserveCache(resolvedPageId)?.refs.get(r);
    const { act, probe } = resolveActionable(page, target, refLookup);
    const selected = await withActionErrors(probe, "select-option", () =>
      act.selectOption(values, { timeout: timeoutMs ?? 15000 })
    );
    return { pageId: resolvedPageId, selected };
  }
}
