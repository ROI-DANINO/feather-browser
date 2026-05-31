import type { CommandHandler, CommandContext } from "./handler";
import type { SessionRecord, ProfileKind, BrowserMode, ProxyConfig } from "../sessions/types";

interface IManager {
  launch(input: LaunchInput): Promise<{
    toRecord(): Omit<SessionRecord, "pages">;
    getPageInfoList(): Promise<SessionRecord["pages"]>;
  }>;
}

export interface LaunchInput {
  workspaceId?: string;
  profile: { kind: ProfileKind };
  browserMode?: BrowserMode;
  viewport?: { width: number; height: number };
  proxy?: ProxyConfig | null;
  debug?: { trace?: boolean; screenshots?: boolean };
}

export class LaunchSessionHandler implements CommandHandler<LaunchInput, SessionRecord> {
  constructor(private readonly manager: IManager) {}

  async execute(input: LaunchInput, _ctx: CommandContext): Promise<SessionRecord> {
    const session = await this.manager.launch(input);
    const record = session.toRecord();
    const pages = await session.getPageInfoList();
    return { ...record, pages };
  }
}
