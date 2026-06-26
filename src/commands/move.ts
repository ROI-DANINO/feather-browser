// src/commands/move.ts
import type { CommandHandler, CommandContext } from "./handler";
import type { MoveInput, MoveOutput } from "../sessions/types";
import type { Page, ElementHandle } from "playwright";
import { resolveActionable } from "../browser/locators";
import { mousePath, type Point } from "../browser/mouse-path";
import { withActionErrors, isNavigationTeardown, ElementNotActionableError } from "./input-errors";
import { assertPageNotPaused } from "./pause-registry";

interface IManager {
  get(sessionId: string): {
    getPage(pageId?: string): { pageId: string; page: Page };
    getObserveCache(pageId: string): { refs: Map<string, ElementHandle> } | undefined;
  };
}

// Playwright doesn't expose the pointer's current position; remember where we left it per page so
// the next move starts a continuous path instead of teleporting back to a default origin each call.
const lastPos = new WeakMap<Page, Point>();
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function startPoint(page: Page): Point {
  const known = lastPos.get(page);
  if (known) return known;
  const vp = page.viewportSize();
  return vp ? { x: Math.round(vp.width / 2), y: Math.round(vp.height / 2) } : { x: 0, y: 0 };
}

export class MoveHandler implements CommandHandler<MoveInput, MoveOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: MoveInput, _ctx: CommandContext): Promise<MoveOutput> {
    const { sessionId, pageId, target, x, y, opts, timeoutMs } = input;
    const session = this.manager.get(sessionId);
    const { pageId: resolvedPageId, page } = session.getPage(pageId);
    assertPageNotPaused(sessionId, resolvedPageId); // a human in control of this page blocks agent motion

    let dest: Point;
    if (target) {
      const refLookup = (r: string) => session.getObserveCache(resolvedPageId)?.refs.get(r);
      const { act, probe } = resolveActionable(page, target, refLookup);
      const box = await withActionErrors(probe, "move", () => act.boundingBox({ timeout: timeoutMs ?? 15000 }));
      if (!box) throw new ElementNotActionableError(`Target for "move" has no bounding box (not visible).`);
      dest = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    } else {
      dest = { x: x as number, y: y as number };
    }

    const path = mousePath(startPoint(page), dest, opts);
    try {
      for (const wp of path) {
        await page.mouse.move(wp.x, wp.y);
        if (wp.delayMs > 0) await sleep(wp.delayMs);
      }
    } catch (err) {
      if (isNavigationTeardown(err)) {
        lastPos.set(page, dest);
        return { pageId: resolvedPageId, x: dest.x, y: dest.y, steps: path.length, navigated: true };
      }
      throw err;
    }
    lastPos.set(page, dest);
    return { pageId: resolvedPageId, x: dest.x, y: dest.y, steps: path.length };
  }
}
