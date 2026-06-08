import type { CommandHandler, CommandContext } from "./handler";
import type { AwaitHumanInput, AwaitHumanOutput } from "../sessions/types";
import { resolveLocator } from "../browser/locators";
import { createPause, discardPause } from "./pause-registry";
import { showBanner, removeBanner, bannerResumed } from "../browser/pause-banner";
import { emitBusEvent } from "../logs/bus";
import { EVENTS } from "../logs/events";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

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

    // On-page banner (default on). Injection failures (page navigating/closed) must not break the
    // pause — the SSE event + off-page resume URL remain as the fallback.
    const wantBanner = input.banner !== false;
    if (wantBanner) {
      await showBanner(page, input.reason).catch(() => {});
    }

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

    // Poll the on-page banner's DOM flag (set client-side on click — no network, so PNA/CORS-proof).
    let stopPoll = false;
    if (wantBanner) {
      racers.push((async () => {
        while (!stopPoll) {
          await sleep(300);
          if (await bannerResumed(page)) return "human" as const;
        }
        return new Promise<never>(() => {});
      })());
    }

    const resumedBy = await Promise.race(racers);

    stopPoll = true;
    if (timer) clearTimeout(timer);
    discardPause(pause.token);
    if (wantBanner) {
      await sleep(1000);
      await removeBanner(page).catch(() => {});
    }
    emitBusEvent({
      event: EVENTS.HUMAN_PAUSE_RESOLVED,
      sessionId: input.sessionId,
      data: { resumedBy },
      ts: new Date().toISOString(),
    });

    return { pageId, resumedBy, elapsedMs: Date.now() - startedAt };
  }
}
