import type { CommandHandler, CommandContext } from "./handler";
import type { TypeInput, TypeOutput } from "../sessions/types";
import { resolveActionable } from "../browser/locators";
import { withActionErrors } from "./input-errors";
import { assertPageNotPaused } from "./pause-registry";
import { jitterDelayMs } from "../browser/stealth";

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
    // A human in control of this page blocks agent typing — EXCEPT the MFA resolve path, whose own
    // pause would otherwise block Feather from typing the human-relayed code into the target field.
    if (!input.allowDuringHumanControl) assertPageNotPaused(sessionId, resolvedPageId);
    const timeout = timeoutMs ?? 15000;

    // Secure by default: caller specified neither mode nor delay → human cadence (sequential + jitter).
    // Explicit mode:"fill" or an explicit delay is the per-call fast escape hatch and always wins.
    const secureDefault = mode === undefined && delayMs === undefined;
    const useSequential = mode === "sequential" || secureDefault;
    const delay = delayMs ?? (secureDefault ? jitterDelayMs() : undefined);

    const refLookup = (r: string) => session.getObserveCache(resolvedPageId)?.refs.get(r);
    const { act, probe } = resolveActionable(page, target, refLookup);
    await withActionErrors(probe, "type", () =>
      useSequential
        ? act.typeSequentially(text, { delay, timeout })
        : act.fill(text, { timeout }),
    );
    return { pageId: resolvedPageId, typed: true };
  }
}
