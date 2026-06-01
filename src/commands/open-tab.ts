import type { CommandHandler, CommandContext } from "./handler";
import type { PageInfo } from "../sessions/types";

interface IManager {
  openTab(sessionId: string): Promise<PageInfo>;
}

export interface OpenTabInput {
  sessionId: string;
}

export class OpenTabHandler implements CommandHandler<OpenTabInput, PageInfo> {
  constructor(private readonly manager: IManager) {}

  async execute(input: OpenTabInput, _ctx: CommandContext): Promise<PageInfo> {
    return this.manager.openTab(input.sessionId);
  }
}
