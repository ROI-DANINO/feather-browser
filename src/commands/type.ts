import type { CommandHandler, CommandContext } from "./handler";
import type { TypeInput, TypeOutput } from "../sessions/types";
import { resolveLocator, resolveActionable } from "../browser/locators";
import { withActionErrors } from "./input-errors";
import { assertPageNotPaused } from "./pause-registry";

interface IManager {
  get(sessionId: string): {
    getPage(pageId?: string): { pageId: string; page: import("playwright").Page };
    getObserveCache(pageId: string): { refs: Map<string, import("playwright").ElementHandle> } | undefined;
  };
}

export class TypeHandler implements CommandHandler<TypeInput, TypeOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: TypeInput, _ctx: CommandContext): Promise<TypeOutput> {
    const { sessionId, pageId, target, text, mode, delayMs, timeoutMs } = input;
    const session = this.manager.get(sessionId);
    const { pageId: resolvedPageId, page } = session.getPage(pageId);
    assertPageNotPaused(sessionId, resolvedPageId); // a human in control of this page blocks agent typing
    const timeout = timeoutMs ?? 15000;

    if (mode === "sequential" && target.by !== "ref") {
      // pressSequentially is Locator-specific; use resolveLocator directly for non-ref targets
      const loc = resolveLocator(page, target);
      await withActionErrors(() => loc.count(), "type", () =>
        loc.pressSequentially(text, { delay: delayMs, timeout }),
      );
    } else {
      const refLookup = (r: string) => session.getObserveCache(resolvedPageId)?.refs.get(r);
      const { act, probe } = resolveActionable(page, target, refLookup);
      await withActionErrors(probe, "type", () => act.fill(text, { timeout }));
    }
    return { pageId: resolvedPageId, typed: true };
  }
}
