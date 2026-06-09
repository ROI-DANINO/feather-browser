import type { CommandHandler, CommandContext } from "./handler";
import type { CloseTabResult } from "../sessions/manager";

interface IManager {
  closeTab(sessionId: string, pageId: string): Promise<CloseTabResult>;
}

export interface CloseTabInput {
  sessionId: string;
  pageId: string;
}

export class CloseTabHandler implements CommandHandler<CloseTabInput, CloseTabResult> {
  constructor(private readonly manager: IManager) {}

  async execute(input: CloseTabInput, _ctx: CommandContext): Promise<CloseTabResult> {
    return this.manager.closeTab(input.sessionId, input.pageId);
  }
}
