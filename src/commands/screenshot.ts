import * as path from "path";
import * as fs from "fs";
import { randomUUID } from "crypto";
import type { CommandHandler, CommandContext } from "./handler";

const MAX_SCREENSHOTS_PER_SESSION = 20;

/** Keep only the newest `keep` PNGs in `dir`. Best-effort; never throws. */
export async function pruneScreenshots(dir: string, keep = MAX_SCREENSHOTS_PER_SESSION): Promise<void> {
  let names: string[];
  try { names = await fs.promises.readdir(dir); } catch { return; }
  const pngs = names.filter((n) => n.endsWith(".png")).sort(); // ISO timestamps sort chronologically
  const stale = pngs.slice(0, Math.max(0, pngs.length - keep));
  await Promise.all(stale.map((n) => fs.promises.unlink(path.join(dir, n)).catch(() => {})));
}

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
    await page.screenshot({
      path: screenshotPath,
      fullPage: !!fullPage,
      timeout: 8000,            // do not hang the loop on web-font loading (was the 30s H1 stall)
      animations: "disabled",
    });
    await pruneScreenshots(screenshotsDir);
    return { artifactId: newId("art"), path: screenshotPath, mimeType: "image/png" };
  }
}
