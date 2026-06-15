import * as path from "path";
import * as fs from "fs";
import { FeatherDirs, singleRootDirs } from "./config";

function toDirs(dirs: FeatherDirs | string): FeatherDirs {
  return typeof dirs === "string" ? singleRootDirs(dirs) : dirs;
}

export class FeatherPaths {
  private readonly dirs: FeatherDirs;

  constructor(dirs: FeatherDirs | string) {
    this.dirs = toDirs(dirs);
  }

  profileDir(workspaceId: string): string {
    return path.join(this.dirs.data, "profiles", workspaceId, "profile");
  }

  workspaceJson(workspaceId: string): string {
    return path.join(this.dirs.data, "profiles", workspaceId, "workspace.json");
  }

  /** Directory holding per-identity JSON records (Identity Model / Phase 5a). */
  identitiesDir(): string {
    return path.join(this.dirs.data, "identities");
  }

  identityFile(id: string): string {
    return path.join(this.identitiesDir(), `${id}.json`);
  }

  lockFile(workspaceId: string): string {
    return path.join(this.dirs.data, "profiles", workspaceId, "lock");
  }

  disposableSessionDir(sessionId: string): string {
    return path.join(this.dirs.cache, "tmp", "sessions", sessionId);
  }

  disposableProfileDir(sessionId: string): string {
    return path.join(this.disposableSessionDir(sessionId), "profile");
  }

  debugDir(sessionId: string): string {
    return path.join(this.dirs.state, "debug", sessionId);
  }

  sessionLog(sessionId: string): string {
    return path.join(this.dirs.state, "logs", "sessions", `${sessionId}.jsonl`);
  }

  /** Append-only forensic record of capability-grant lifecycle events (Gate A / A1 audit). */
  grantAuditLog(): string {
    return path.join(this.dirs.state, "logs", "audit", "grants.jsonl");
  }

  endpointFile(): string {
    return path.join(this.dirs.runtime, "run", "endpoint.json");
  }

  tokenFile(): string {
    return path.join(this.dirs.runtime, "run", "control-token");
  }

  measurementDir(runId: string): string {
    return path.join(this.dirs.state, "measurements", runId);
  }

  quarantinedProfileDir(sessionId: string): string {
    return path.join(this.dirs.state, "debug", sessionId, "quarantined-profile");
  }
}

export async function ensureDirs(dirs: FeatherDirs | string): Promise<void> {
  const d = toDirs(dirs);
  const toCreate = [
    path.join(d.data, "profiles"),
    path.join(d.cache, "tmp", "sessions"),
    path.join(d.state, "debug"),
    path.join(d.state, "logs", "sessions"),
    path.join(d.state, "logs", "audit"),
    path.join(d.runtime, "run"),
    path.join(d.state, "measurements"),
    path.join(d.data, "identities"),
  ];
  for (const dir of toCreate) {
    await fs.promises.mkdir(dir, { recursive: true });
  }
}
