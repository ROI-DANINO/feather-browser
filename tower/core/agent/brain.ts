// tower/core/agent/brain.ts
import type { Action } from "./action";
export type { Action } from "./action";

export interface ObservedElement {
  ref: string;
  role: string | null;
  name: string;
  tag: string;
  state: string;
}

export interface Observation {
  url: string;
  title: string;
  elements: ObservedElement[];
}

/** The browser surface the brain drives — Feather's observe/act, bound to one session. */
export interface BrowserDriver {
  observe(): Promise<Observation>;
  click(ref: string): Promise<void>;
  type(ref: string, text: string): Promise<void>;
}

/** Picks the next action given the goal and the current page. Real impl = Claude; tests = a stub. */
export type Decide = (input: { goal: string; observation: Observation; step: number }) => Promise<Action>;

export interface DriveResult {
  outcome: "done" | "gave_up" | "budget_exhausted";
  steps: number;
}

export interface DriveOptions {
  maxSteps?: number;
  onStep?: (info: { step: number; action: Action }) => void;
}

/** observe → decide → act, until done | give_up | the step budget runs out. Never grades. */
export async function driveToGoal(
  driver: BrowserDriver,
  goal: string,
  decide: Decide,
  opts: DriveOptions = {},
): Promise<DriveResult> {
  const maxSteps = opts.maxSteps ?? 12;
  for (let step = 0; step < maxSteps; step++) {
    const observation = await driver.observe();
    const action = await decide({ goal, observation, step });
    opts.onStep?.({ step, action });
    switch (action.kind) {
      case "done":
        return { outcome: "done", steps: step + 1 };
      case "give_up":
        return { outcome: "gave_up", steps: step + 1 };
      case "click":
        await driver.click(action.ref);
        break;
      case "type":
        await driver.type(action.ref, action.text);
        break;
    }
  }
  return { outcome: "budget_exhausted", steps: maxSteps };
}
