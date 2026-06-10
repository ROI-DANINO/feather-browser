import type { CommandHandler, CommandContext } from "./handler";
import type { PageInfo } from "../sessions/types";

interface IManager {
  listTabs(sessionId: string): Promise<{ sessionId: string; pages: PageInfo[] }>;
}

export interface ListTabsInput { sessionId: string; }
export interface ListTabsOutput { sessionId: string; pages: PageInfo[]; }

export class ListTabsHandler implements CommandHandler<ListTabsInput, ListTabsOutput> {
  constructor(private readonly manager: IManager) {}
  async execute(input: ListTabsInput, _ctx: CommandContext): Promise<ListTabsOutput> {
    return this.manager.listTabs(input.sessionId);
  }
}
