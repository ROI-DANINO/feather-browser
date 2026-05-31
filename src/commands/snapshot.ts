import type { CommandHandler, CommandContext } from "./handler";
import type { SnapshotResult } from "../sessions/types";

interface IManager {
  get(sessionId: string): {
    getPage(pageId?: string): { pageId: string; page: import("playwright").Page };
  };
}

export interface SnapshotInput {
  sessionId: string;
  pageId?: string;
}

export class SnapshotHandler implements CommandHandler<SnapshotInput, SnapshotResult> {
  constructor(private readonly manager: IManager) {}

  async execute(input: SnapshotInput, _ctx: CommandContext): Promise<SnapshotResult> {
    const { sessionId, pageId } = input;
    const session = this.manager.get(sessionId);
    const { pageId: resolvedPageId, page } = session.getPage(pageId);
    const url = page.url();
    const title = await page.title();
    const rawText = await page.evaluate(
      /* istanbul ignore next */
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      new Function('return document.body.innerText') as () => string
    );
    const text = rawText.slice(0, 20000);
    const allLinks = await page.evaluate(
      /* istanbul ignore next */
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      new Function('return Array.from(document.links).map(function(a){return{text:a.innerText.trim(),href:a.href}})') as () => Array<{ text: string; href: string }>
    );
    const links = allLinks.slice(0, 200);
    const description = await page.evaluate(
      /* istanbul ignore next */
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      new Function('var m=document.querySelector(\'meta[name="description"]\');return m?m.getAttribute("content"):"";') as () => string
    );
    return { pageId: resolvedPageId, url, title, text, links, meta: { description }, limits: { textChars: 20000, links: 200 } };
  }
}
