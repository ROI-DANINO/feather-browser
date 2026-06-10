import type { CommandHandler, CommandContext } from "./handler";

interface IManager {
  get(sessionId: string): {
    getState(): string;
    getPageCount(): number;
    getPage(pageId?: string): { pageId: string; page: { title(): Promise<string> } };
  };
}

export interface HealthInput { sessionId: string; }
export interface HealthOutput { sessionId: string; state: string; pages: number; alive: boolean; }

const DEFAULT_PROBE_TIMEOUT_MS = 2000;

/**
 * Cheap "is the browser actually alive?" probe so a coordinator can tell "agent died" from
 * "browser died" in one call (the H3 forensics took an investigation without this). alive=true
 * means the default page answered a title() round-trip within the deadline.
 */
export class HealthHandler implements CommandHandler<HealthInput, HealthOutput> {
  constructor(private readonly manager: IManager, private readonly probeTimeoutMs = DEFAULT_PROBE_TIMEOUT_MS) {}

  async execute(input: HealthInput, _ctx: CommandContext): Promise<HealthOutput> {
    const session = this.manager.get(input.sessionId);
    const state = session.getState();
    const pages = session.getPageCount();
    if (state !== "running") return { sessionId: input.sessionId, state, pages, alive: false };

    let timer: NodeJS.Timeout | undefined;
    const deadline = new Promise<false>((resolve) => {
      timer = setTimeout(() => resolve(false), this.probeTimeoutMs);
    });
    const probe = (async () => {
      await session.getPage().page.title();
      return true as const;
    })().catch(() => false as const);
    const alive = await Promise.race([probe, deadline]);
    if (timer) clearTimeout(timer);
    return { sessionId: input.sessionId, state, pages, alive };
  }
}
