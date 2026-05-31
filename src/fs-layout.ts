import * as path from "path";
import * as fs from "fs";

export class FeatherPaths {
  constructor(private readonly base: string) {}

  profileDir(workspaceId: string): string {
    return path.join(this.base, "profiles", workspaceId, "profile");
  }

  workspaceJson(workspaceId: string): string {
    return path.join(this.base, "profiles", workspaceId, "workspace.json");
  }

  lockFile(workspaceId: string): string {
    return path.join(this.base, "profiles", workspaceId, "lock");
  }

  disposableSessionDir(sessionId: string): string {
    return path.join(this.base, "tmp", "sessions", sessionId);
  }

  disposableProfileDir(sessionId: string): string {
    return path.join(this.disposableSessionDir(sessionId), "profile");
  }

  debugDir(sessionId: string): string {
    return path.join(this.base, "debug", sessionId);
  }

  sessionLog(sessionId: string): string {
    return path.join(this.base, "logs", "sessions", `${sessionId}.jsonl`);
  }

  endpointFile(): string {
    return path.join(this.base, "run", "endpoint.json");
  }

  tokenFile(): string {
    return path.join(this.base, "run", "control-token");
  }

  measurementDir(runId: string): string {
    return path.join(this.base, "measurements", runId);
  }

  quarantinedProfileDir(sessionId: string): string {
    return path.join(this.base, "debug", sessionId, "quarantined-profile");
  }
}

export async function ensureDirs(featherDir: string): Promise<void> {
  const dirs = [
    path.join(featherDir, "profiles"),
    path.join(featherDir, "tmp", "sessions"),
    path.join(featherDir, "debug"),
    path.join(featherDir, "logs", "sessions"),
    path.join(featherDir, "run"),
    path.join(featherDir, "measurements"),
  ];
  for (const d of dirs) {
    await fs.promises.mkdir(d, { recursive: true });
  }
}
