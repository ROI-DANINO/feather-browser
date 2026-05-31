import type { CommandHandler, CommandContext } from "./handler";

interface IManager {
  close(sessionId: string, opts?: { force?: boolean; quarantineDisposableProfile?: boolean }): Promise<void>;
}

export interface CloseInput { sessionId: string; force?: boolean; quarantineDisposableProfile?: boolean; }
export interface CloseOutput { sessionId: string; state: "closed"; }

export class CloseSessionHandler implements CommandHandler<CloseInput, CloseOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: CloseInput, _ctx: CommandContext): Promise<CloseOutput> {
    const { sessionId, force, quarantineDisposableProfile } = input;
    await this.manager.close(sessionId, { force, quarantineDisposableProfile });
    return { sessionId, state: "closed" };
  }
}
