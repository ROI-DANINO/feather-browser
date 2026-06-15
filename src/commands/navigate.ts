import type { CommandHandler, CommandContext } from "./handler";
import { assertPageNotPaused } from "./pause-registry";

interface IManager {
  get(sessionId: string): {
    getPage(pageId?: string): { pageId: string; page: import("playwright").Page };
  };
}

export interface NavigateInput {
  sessionId: string;
  pageId?: string;
  url: string;
  waitUntil?: string;
  timeoutMs?: number;
}

export interface NavigateOutput {
  pageId: string;
  url: string;
  status: number | null;
}

export class NavigateHandler implements CommandHandler<NavigateInput, NavigateOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: NavigateInput, _ctx: CommandContext): Promise<NavigateOutput> {
    const { sessionId, pageId, url, waitUntil, timeoutMs } = input;
    const session = this.manager.get(sessionId);
    const { pageId: resolvedPageId, page } = session.getPage(pageId);
    assertPageNotPaused(sessionId, resolvedPageId); // a human in control of this page blocks agent navigation
    const response = await page.goto(url, { waitUntil: waitUntil as any, timeout: timeoutMs });
    return { pageId: resolvedPageId, url: page.url(), status: response?.status() ?? null };
  }
}
