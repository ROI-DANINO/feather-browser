import type { CommandHandler, CommandContext } from "./handler";
import type { DismissInput, DismissOutput, ObserveResult, ObserveAction } from "../sessions/types";
import { ObserveHandler } from "./observe";
import { ClickHandler } from "./click";

export const DEFAULT_DISMISS_LABELS = ["accept all", "i agree", "allow all", "got it", "accept", "close", "continue"];

/** Choose overlay-related elements whose name matches an affirmative-dismiss label. */
export function pickDismissTargets(obs: ObserveResult, labels: string[]): ObserveAction[] {
  if (obs.overlays.length === 0) return [];                      // only act when an overlay exists
  const wanted = labels.map((l) => l.toLowerCase());
  return obs.actions.filter((a) => {
    const overlayRelated = a.state === "covered" || a.occludedBy != null;
    // The dismiss button itself usually sits *on top* (actionable) inside the overlay; allow actionable
    // elements too, but still gate on an overlay being present (checked above).
    const name = a.name.trim().toLowerCase();
    const labelHit = wanted.some((w) => name === w || name.startsWith(w));
    return labelHit && (overlayRelated || a.state === "actionable");
  });
}

interface IManager { get(sessionId: string): { getPage(pageId?: string): { pageId: string } }; }

export class DismissHandler implements CommandHandler<DismissInput, DismissOutput> {
  private observe: ObserveHandler;
  private click: ClickHandler;
  constructor(private readonly manager: IManager) {
    this.observe = new ObserveHandler(manager as any);
    this.click = new ClickHandler(manager as any);
  }
  async execute(input: DismissInput, ctx: CommandContext): Promise<DismissOutput> {
    const labels = input.labels ?? DEFAULT_DISMISS_LABELS;
    const obs = await this.observe.execute({ sessionId: input.sessionId, pageId: input.pageId }, ctx);
    const picks = pickDismissTargets(obs, labels);
    const dismissed: { ref: string; name: string }[] = [];
    for (const p of picks.slice(0, 1)) {   // dismiss one per call; agent re-calls if another wall appears
      try {
        await this.click.execute({ sessionId: input.sessionId, pageId: obs.pageId, target: { by: "ref", ref: p.ref } }, ctx);
        dismissed.push({ ref: p.ref, name: p.name });
      } catch { /* ref may have expired mid-dismiss; report what we did */ }
    }
    return { pageId: obs.pageId, dismissed };
  }
}
