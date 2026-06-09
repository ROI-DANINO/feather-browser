// src/commands/observe.ts
import type { CommandHandler, CommandContext } from "./handler";
import type { ObserveInput, ObserveResult, ObserveAction, ActionState } from "../sessions/types";
import type { ObserveCacheEntry } from "../sessions/session";
import { walkAllFrames, type RawAction } from "./perception/walk";
import { computeDiff, type DiffRow } from "./perception/diff";

const newObserveId = () => `obs_${Math.random().toString(36).slice(2, 8)}`;
const STATE_ORDER: Record<ActionState, number> = { actionable: 0, covered: 1, disabled: 2, offscreen: 3 };

interface IManager {
  get(sessionId: string): {
    getPage(pageId?: string): { pageId: string; page: import("playwright").Page };
    setObserveCache(pageId: string, entry: ObserveCacheEntry): void;
    getObserveCache(pageId: string): ObserveCacheEntry | undefined;
  };
}

export class ObserveHandler implements CommandHandler<ObserveInput, ObserveResult> {
  constructor(private readonly manager: IManager) {}

  async execute(input: ObserveInput, _ctx: CommandContext): Promise<ObserveResult> {
    const t0 = Date.now();
    const cap = input.cap ?? 80;
    const session = this.manager.get(input.sessionId);
    const { pageId, page } = session.getPage(input.pageId);

    const { actions: raw, overlays } = await walkAllFrames(page);

    // Sort: actionable first, then by state order.
    raw.sort((a, b) => STATE_ORDER[a.meta.state] - STATE_ORDER[b.meta.state]);
    const filtered = input.viewportOnly ? raw.filter((a) => a.meta.state !== "offscreen") : raw;

    const kept = filtered.slice(0, cap);
    const dropped = raw.filter((a) => !kept.includes(a));
    await Promise.all(dropped.map((a) => a.handle.dispose().catch(() => {})));

    const refs = new Map<string, import("playwright").ElementHandle>();
    const rows: DiffRow[] = [];
    const actions: ObserveAction[] = kept.map((a: RawAction, i) => {
      const ref = `e${i}`;
      refs.set(ref, a.handle);
      rows.push({ signature: a.meta.signature, ref, name: a.meta.name, role: a.meta.role, state: a.meta.state });
      return {
        ref, role: a.meta.role, name: a.meta.name, tag: a.meta.tag,
        box: a.meta.box, state: a.meta.state, occludedBy: a.meta.occludedBy,
      };
    });

    const prev = session.getObserveCache(pageId);
    const diff = computeDiff(prev?.rows, rows);
    const observeId = newObserveId();
    session.setObserveCache(pageId, { observeId, rows, refs });   // disposes prior handles

    const result: ObserveResult = {
      pageId, url: page.url(), title: await page.title().catch(() => ""), observeId,
      actions,
      overlays: overlays.map((o) => ({ ref: null, ...o })),
      diff,
      stats: { totalInteractive: raw.length, returned: actions.length, elapsedMs: Date.now() - t0 },
    };
    if (input.includeText) {
      result.text = (await page.evaluate(() => document.body?.innerText ?? "").catch(() => "")).slice(0, 4000);
    }
    return result;
  }
}
