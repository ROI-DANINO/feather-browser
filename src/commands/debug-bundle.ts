import type { CommandHandler, CommandContext } from "./handler";
import { DebugBundle } from "../debug/bundle";
import type { FeatherPaths } from "../fs-layout";

interface ISession {
  sessionId: string;
  debugDir: string;
}

interface IManager {
  get(sessionId: string): ISession;
}

export interface DebugBundleInput { sessionId: string; }
export interface DebugBundleOutput { sessionId: string; path: string; manifest: string; }

export class DebugBundleHandler implements CommandHandler<DebugBundleInput, DebugBundleOutput> {
  constructor(private readonly manager: IManager, private readonly paths: FeatherPaths) {}

  async execute(input: DebugBundleInput, _ctx: CommandContext): Promise<DebugBundleOutput> {
    const session = this.manager.get(input.sessionId);
    const bundle = new DebugBundle(session as any, this.paths);
    const manifestPath = await bundle.finalize("requested");
    return { sessionId: input.sessionId, path: session.debugDir, manifest: manifestPath };
  }
}
