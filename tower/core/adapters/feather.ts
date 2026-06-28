// tower/core/adapters/feather.ts
import type { Adapter, TowerTask } from "../types";
import type { BrowserSessionClient } from "./feather-client";
import { driveToGoal, type BrowserDriver, type Decide, type Action } from "../agent/brain";

export interface FeatherAdapterConfig {
  client: BrowserSessionClient;
  decide: Decide;
  maxSteps?: number;
  onStep?: (info: { step: number; action: Action }) => void;
}

/**
 * adapter.feather — drives Feather (a body) with an injected brain (Decide).
 * Control channel only: talks to Feather over HTTP; never attaches to its browser; never grades.
 * Returns on a finished drive (done | give_up | budget); throws only on a drive error.
 */
export function featherAdapter(cfg: FeatherAdapterConfig): Adapter {
  return {
    id: "adapter.feather",
    async run(task: TowerTask): Promise<void> {
      const sessionId = await cfg.client.createSession();
      try {
        await cfg.client.navigate(sessionId, task.url);
        const driver: BrowserDriver = {
          observe: () => cfg.client.observe(sessionId),
          click: (ref) => cfg.client.click(sessionId, ref),
          type: (ref, text) => cfg.client.type(sessionId, ref, text),
        };
        await driveToGoal(driver, task.goal, cfg.decide, { maxSteps: cfg.maxSteps, onStep: cfg.onStep });
      } finally {
        await cfg.client.close(sessionId);
      }
    },
  };
}
