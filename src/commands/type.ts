import type { CommandHandler, CommandContext } from "./handler";
import type { TypeInput, TypeOutput } from "../sessions/types";
import { resolveLocator } from "../browser/locators";
import { withActionErrors } from "./input-errors";

interface IManager {
  get(sessionId: string): { getPage(pageId?: string): { pageId: string; page: import("playwright").Page } };
}

export class TypeHandler implements CommandHandler<TypeInput, TypeOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: TypeInput, _ctx: CommandContext): Promise<TypeOutput> {
    const { sessionId, pageId, target, text, mode, delayMs, timeoutMs } = input;
    const { pageId: resolvedPageId, page } = this.manager.get(sessionId).getPage(pageId);
    const loc = resolveLocator(page, target);
    const timeout = timeoutMs ?? 15000;
    await withActionErrors(loc, "type", () =>
      mode === "sequential"
        ? loc.pressSequentially(text, { delay: delayMs, timeout })
        : loc.fill(text, { timeout }),
    );
    return { pageId: resolvedPageId, typed: true };
  }
}
