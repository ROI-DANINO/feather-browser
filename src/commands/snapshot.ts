import type { CommandHandler, CommandContext } from "./handler";
import type { SnapshotResult } from "../sessions/types";
import { generateMarkdown } from "./markdown-generator";

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
    const rawText = await page.evaluate(() => document.body.innerText);
    const text = rawText.slice(0, 20000);
    const allLinks = await page.evaluate(() =>
      Array.from(document.links).map((a) => ({
        text: (a as HTMLAnchorElement).innerText.trim(),
        href: (a as HTMLAnchorElement).href,
      }))
    );
    const links = allLinks.slice(0, 200);
    const description = await page.evaluate(() => {
      const m = document.querySelector('meta[name="description"]');
      return m ? m.getAttribute("content") ?? "" : "";
    });
    const markdown = await generateMarkdown(page);
    return {
      pageId: resolvedPageId,
      url,
      title,
      text,
      links,
      meta: { description },
      limits: { textChars: 20000, links: 200, markdownChars: 20000 },
      markdown,
    };
  }
}
