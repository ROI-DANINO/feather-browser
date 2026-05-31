import type { CommandHandler, CommandContext } from "./handler";
import type { SessionRecord } from "../sessions/types";

interface ISession {
  toRecord(): Omit<SessionRecord, "pages">;
  getPageInfoList(): Promise<SessionRecord["pages"]>;
}

interface IManager {
  get(sessionId: string): ISession;
  list(): ISession[];
}

export interface GetSessionInput { sessionId: string; }

export class GetSessionHandler implements CommandHandler<GetSessionInput, SessionRecord> {
  constructor(private readonly manager: IManager) {}
  async execute(input: GetSessionInput, _ctx: CommandContext): Promise<SessionRecord> {
    const session = this.manager.get(input.sessionId);
    return { ...session.toRecord(), pages: await session.getPageInfoList() };
  }
}

export class ListSessionsHandler implements CommandHandler<Record<string, never>, SessionRecord[]> {
  constructor(private readonly manager: IManager) {}
  async execute(_input: Record<string, never>, _ctx: CommandContext): Promise<SessionRecord[]> {
    return Promise.all(
      this.manager.list().map(async (s) => ({ ...s.toRecord(), pages: await s.getPageInfoList() }))
    );
  }
}
