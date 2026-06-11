import type { CommandHandler, CommandContext } from "./handler";
import type { BrowserContext } from "playwright";

interface ISessionForCookies {
  getContext(): BrowserContext;
}

interface IManager {
  get(sessionId: string): ISessionForCookies;
}

export interface ExportCookiesInput { sessionId: string; }
export interface ExportedCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Strict" | "Lax" | "None";
}
export interface ExportCookiesOutput { sessionId: string; cookies: ExportedCookie[]; }

/**
 * Dangerous-tier operation: read every cookie in the session's browser context. This hands login
 * tokens to the caller, which is exactly why it lives behind a capability grant (Gate A). The
 * handler itself is unconditional — the route gates it; the handler only runs once a grant is spent.
 */
export class ExportCookiesHandler implements CommandHandler<ExportCookiesInput, ExportCookiesOutput> {
  constructor(private readonly manager: IManager) {}
  async execute(input: ExportCookiesInput, _ctx: CommandContext): Promise<ExportCookiesOutput> {
    const cookies = await this.manager.get(input.sessionId).getContext().cookies();
    return { sessionId: input.sessionId, cookies: cookies as ExportedCookie[] };
  }
}
