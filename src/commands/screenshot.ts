import * as path from "path";
import * as fs from "fs";
import { randomUUID } from "crypto";
import type { CommandHandler, CommandContext } from "./handler";

const newId = (prefix: string) => `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;

interface IManager {
  get(sessionId: string): {
    debugDir: string;
    getPage(pageId?: string): { pageId: string; page: import("playwright").Page };
  };
}

export interface ScreenshotInput { sessionId: string; pageId?: string; fullPage?: boolean; }
export interface ScreenshotOutput { artifactId: string; path: string; mimeType: string; }

export class ScreenshotHandler implements CommandHandler<ScreenshotInput, ScreenshotOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: ScreenshotInput, _ctx: CommandContext): Promise<ScreenshotOutput> {
    const { sessionId, pageId, fullPage } = input;
    const session = this.manager.get(sessionId);
    const { pageId: resolvedPageId, page } = session.getPage(pageId);
    const screenshotsDir = path.join(session.debugDir, "screenshots");
    await fs.promises.mkdir(screenshotsDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "");
    const filename = `page_${resolvedPageId}-${timestamp}.png`;
    const screenshotPath = path.join(screenshotsDir, filename);
    await page.screenshot({ path: screenshotPath, fullPage: !!fullPage });
    return { artifactId: newId("art"), path: screenshotPath, mimeType: "image/png" };
  }
}
