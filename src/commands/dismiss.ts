import type { CommandHandler, CommandContext } from "./handler";
import type { DismissInput, DismissOutput, ObserveResult, ObserveAction, Overlay } from "../sessions/types";
import { ObserveHandler } from "./observe";
import { ClickHandler } from "./click";

export const DEFAULT_DISMISS_LABELS = ["accept all", "i agree", "allow all", "got it", "accept", "close", "continue"];

/** Choose overlay-related elements whose name matches an affirmative-dismiss label. */
export function pickDismissTargets(obs: ObserveResult, labels: string[]): ObserveAction[] {
  if (obs.overlays.length === 0) return [];                      // only act when an overlay exists
  const wanted = labels.map((l) => l.toLowerCase());
  return obs.actions.filter((a) => {
    // Tight gate: the button must demonstrably belong to a popup — inside an overlay element,
    // covered by one, or occluded. The old bare-"actionable" escape hatch could click a page's
    // own legitimate "Continue" button.
    const overlayRelated = a.overlayIndex != null || a.state === "covered" || a.occludedBy != null;
    const name = a.name.trim().toLowerCase();
    const labelHit = wanted.some((w) => name === w || name.startsWith(w));
    return labelHit && overlayRelated;
  });
}

/** Verified-dismiss rule (spec §3.1): linked pick ⇒ the (kind,name) overlay count decreased;
 * unlinked pick (covered/occluded) ⇒ total overlay count decreased. */
export function overlayGone(before: Overlay[], after: Overlay[], overlayIndex?: number): boolean {
  if (overlayIndex != null && before[overlayIndex]) {
    const t = before[overlayIndex];
    const count = (list: Overlay[]) => list.filter((o) => o.kind === t.kind && o.name === t.name).length;
    return count(after) < count(before);
  }
  return after.length < before.length;
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
    const baseline = await this.observe.execute({ sessionId: input.sessionId, pageId: input.pageId }, ctx);
    const pick = pickDismissTargets(baseline, labels)[0];   // one wall per call; agent re-calls
    if (!pick) {
      return { pageId: baseline.pageId, dismissed: [], overlaysRemaining: baseline.overlays.length, observation: baseline };
    }
    try {
      await this.click.execute({ sessionId: input.sessionId, pageId: baseline.pageId, target: { by: "ref", ref: pick.ref } }, ctx);
    } catch {
      // Verification decides — a successful dismiss often kills its own button mid-click.
      // The error is intentionally unobserved: input handlers emit no events and there is
      // no handler-level logging convention to attach it to; the verify observe below is
      // the single source of truth for what the click achieved.
    }
    const verify = await this.observe.execute({ sessionId: input.sessionId, pageId: baseline.pageId }, ctx);
    const gone = overlayGone(baseline.overlays, verify.overlays, pick.overlayIndex);
    return {
      pageId: verify.pageId,
      dismissed: gone ? [{ ref: pick.ref, name: pick.name }] : [],
      overlaysRemaining: verify.overlays.length,
      observation: verify,
    };
  }
}
