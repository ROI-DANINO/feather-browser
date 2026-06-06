import { errors } from "playwright";
import type { CommandHandler, CommandContext } from "./handler";
import type { WaitInput, WaitOutput } from "../sessions/types";
import { resolveLocator } from "../browser/locators";
import { WaitTimeoutError } from "./input-errors";

interface IManager {
  get(sessionId: string): { getPage(pageId?: string): { pageId: string; page: import("playwright").Page } };
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export class WaitHandler implements CommandHandler<WaitInput, WaitOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: WaitInput, _ctx: CommandContext): Promise<WaitOutput> {
    const { pageId: resolvedPageId, page } = this.manager.get(input.sessionId).getPage(input.pageId);
    const loc = resolveLocator(page, input.target);

    if (input.until === "stable") {
      const quietMs = input.quietMs ?? 1500;
      const pollMs = input.pollMs ?? 250;
      const timeoutMs = input.timeoutMs ?? 30000;
      const startedAt = Date.now();
      await loc.waitFor({ state: "attached", timeout: timeoutMs });

      let lastValue = "";
      let lastChangedAt = Date.now();
      for (;;) {
        const now = Date.now();
        if (now - startedAt > timeoutMs) {
          throw new WaitTimeoutError(`Element text did not settle within ${timeoutMs}ms.`);
        }
        let current: string;
        try {
          current = (await loc.textContent({ timeout: 1000 })) ?? "";
        } catch {
          current = lastValue; // transient read failure (e.g. mid-re-render) → treat as unchanged
        }
        if (current !== lastValue) {
          lastValue = current;
          lastChangedAt = now;
        }
        if (current.trim().length > 0 && now - lastChangedAt >= quietMs) {
          return { pageId: resolvedPageId, settled: true, elapsedMs: now - startedAt, text: current.trim().slice(0, 20000) };
        }
        await sleep(pollMs);
      }
    }

    // flavour A — element state
    try {
      await loc.waitFor({ state: input.until, timeout: input.timeoutMs ?? 15000 });
    } catch (err) {
      if (err instanceof errors.TimeoutError) {
        throw new WaitTimeoutError(`Condition "${input.until}" not met within ${input.timeoutMs ?? 15000}ms.`);
      }
      throw err;
    }
    return { pageId: resolvedPageId, matched: true };
  }
}
