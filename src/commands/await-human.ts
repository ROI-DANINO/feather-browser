import type { CommandHandler, CommandContext } from "./handler";
import type { AwaitHumanInput, AwaitHumanOutput } from "../sessions/types";
import { resolveLocator } from "../browser/locators";
import { createPause, discardPause } from "./pause-registry";
import { emitBusEvent } from "../logs/bus";
import { EVENTS } from "../logs/events";

interface IManager {
  get(sessionId: string): { getPage(pageId?: string): { pageId: string; page: import("playwright").Page } };
}

export class AwaitHumanHandler implements CommandHandler<AwaitHumanInput, AwaitHumanOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: AwaitHumanInput, _ctx: CommandContext): Promise<AwaitHumanOutput> {
    const { pageId, page } = this.manager.get(input.sessionId).getPage(input.pageId);
    const timeoutMs = input.timeoutMs ?? 300000;
    const startedAt = Date.now();

    const pause = createPause(input.sessionId, input.reason);
    emitBusEvent({
      event: EVENTS.HUMAN_PAUSE_REQUESTED,
      sessionId: input.sessionId,
      data: { reason: input.reason, resumePath: pause.resumePath },
      ts: new Date().toISOString(),
    });

    let timer: ReturnType<typeof setTimeout> | undefined;
    const racers: Promise<AwaitHumanOutput["resumedBy"]>[] = [
      pause.humanResumed.then(() => "human" as const),
      new Promise<"timeout">((resolve) => { timer = setTimeout(() => resolve("timeout"), timeoutMs); }),
    ];

    if (input.resumeOn) {
      const loc = resolveLocator(page, input.resumeOn.target);
      racers.push(
        loc.waitFor({ state: input.resumeOn.until, timeout: timeoutMs })
          .then(() => "signal" as const)
          // a failed/late signal must never reject the race — let timeout/human win instead
          .catch(() => new Promise<never>(() => {})),
      );
    }

    const resumedBy = await Promise.race(racers);

    if (timer) clearTimeout(timer);
    discardPause(pause.token);
    emitBusEvent({
      event: EVENTS.HUMAN_PAUSE_RESOLVED,
      sessionId: input.sessionId,
      data: { resumedBy },
      ts: new Date().toISOString(),
    });

    return { pageId, resumedBy, elapsedMs: Date.now() - startedAt };
  }
}
