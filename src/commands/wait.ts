import { errors } from "playwright";
import type { CommandHandler, CommandContext } from "./handler";
import type { WaitInput, WaitOutput } from "../sessions/types";
import { resolveLocator, resolveActionable } from "../browser/locators";
import { WaitTimeoutError } from "./input-errors";

interface IManager {
  get(sessionId: string): {
    getPage(pageId?: string): { pageId: string; page: import("playwright").Page };
    getObserveCache(pageId: string): { refs: Map<string, import("playwright").ElementHandle> } | undefined;
  };
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export class WaitHandler implements CommandHandler<WaitInput, WaitOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: WaitInput, _ctx: CommandContext): Promise<WaitOutput> {
    const session = this.manager.get(input.sessionId);
    const { pageId: resolvedPageId, page } = session.getPage(input.pageId);

    if (input.target.by === "ref") {
      // For ref targets we hold a live ElementHandle. Its state vocabulary differs from a
      // Locator's: waitForElementState supports visible/hidden (not attached/detached), so we
      // map the remaining cases explicitly.
      const refLookup = (r: string) => session.getObserveCache(resolvedPageId)?.refs.get(r);
      const { act } = resolveActionable(page, input.target, refLookup);
      const handle = act as unknown as import("playwright").ElementHandle;
      const timeoutMs = input.timeoutMs ?? 15000;

      if (input.until === "stable") {
        const quietMs = input.quietMs ?? 1500;
        const pollMs = input.pollMs ?? 250;
        const startedAt = Date.now();
        let lastValue = "";
        let lastChangedAt = Date.now();
        for (;;) {
          const now = Date.now();
          if (now - startedAt > timeoutMs) {
            throw new WaitTimeoutError(`Element text did not settle within ${timeoutMs}ms.`);
          }
          let current: string;
          try {
            current = (await handle.textContent()) ?? "";  // ElementHandle.textContent takes no options
          } catch {
            current = lastValue;
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

      try {
        if (input.until === "visible" || input.until === "hidden") {
          await handle.waitForElementState(input.until, { timeout: timeoutMs });
        } else if (input.until === "detached") {
          const startedAt = Date.now();
          while (await handle.evaluate((e: Element) => e.isConnected).catch(() => false)) {
            if (Date.now() - startedAt > timeoutMs) {
              throw new WaitTimeoutError(`Condition "detached" not met within ${timeoutMs}ms.`);
            }
            await sleep(100);
          }
        }
        // "attached": a live ref handle is already attached — nothing to wait for.
      } catch (err) {
        if (err instanceof errors.TimeoutError) {
          throw new WaitTimeoutError(`Condition "${input.until}" not met within ${timeoutMs}ms.`);
        }
        throw err;
      }
      return { pageId: resolvedPageId, matched: true };
    }

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
