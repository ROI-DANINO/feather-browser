import * as fs from "fs";
import * as path from "path";
import type { FeatherSession } from "../sessions/session";
import type { FeatherPaths } from "../fs-layout";
import type { ProfileKind, BrowserMode, ProxySummary } from "../sessions/types";

export interface BundleManifest {
  sessionId: string;
  workspaceId: string;
  profileKind: ProfileKind;
  browserMode: BrowserMode;
  proxySummary: ProxySummary | null;
  profilePath: string;
  startedAt: string;
  endedAt: string;
  closeReason: string;
  artifacts: string[];
  featherVersion: string;
  playwrightVersion: string;
}

function getFeatherVersion(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require("../../package.json") as { version?: string };
    return pkg.version ?? "dev";
  } catch {
    return "dev";
  }
}

function getPlaywrightVersion(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require("playwright/package.json") as { version?: string };
    return pkg.version ?? "unknown";
  } catch {
    return "unknown";
  }
}

export class DebugBundle {
  constructor(
    private readonly session: FeatherSession,
    private readonly paths: FeatherPaths
  ) {}

  async finalize(closeReason: string): Promise<string> {
    const debugDir = this.session.debugDir;
    await fs.promises.mkdir(debugDir, { recursive: true });

    let artifacts: string[] = [];
    try {
      const entries = await fs.promises.readdir(debugDir);
      artifacts = entries.filter((e) => e !== "manifest.json");
    } catch {
      artifacts = [];
    }

    const manifest: BundleManifest = {
      sessionId: this.session.sessionId,
      workspaceId: this.session.workspaceId,
      profileKind: this.session.profileKind,
      browserMode: this.session.browserMode,
      proxySummary: this.session.proxy,
      profilePath: this.session.profilePath,
      startedAt: this.session.startedAt,
      endedAt: new Date().toISOString(),
      closeReason,
      artifacts,
      featherVersion: getFeatherVersion(),
      playwrightVersion: getPlaywrightVersion(),
    };

    const manifestPath = path.join(debugDir, "manifest.json");
    await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
    return manifestPath;
  }
}
