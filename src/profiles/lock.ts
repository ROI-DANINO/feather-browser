import * as fs from "fs";
import type { BrowserMode, ProxySummary } from "../sessions/types";
import type { FeatherPaths } from "../fs-layout";

export interface LockData {
  sessionId: string;
  pid: number;
  createdAt: string;
  workspaceId: string;
  browserMode: BrowserMode;
  proxySummary: ProxySummary | null;
}

export class ProfileLockedError extends Error {
  readonly code = "PROFILE_LOCKED";
  constructor(workspaceId: string, existing: LockData) {
    super(`Workspace '${workspaceId}' is already in use by session ${existing.sessionId}.`);
    this.name = "ProfileLockedError";
  }
}

export class ProfileLock {
  constructor(private readonly paths: FeatherPaths) {}

  async create(
    workspaceId: string,
    sessionId: string,
    browserMode: BrowserMode,
    proxySummary: ProxySummary | null
  ): Promise<void> {
    const lockPath = this.paths.lockFile(workspaceId);
    try {
      const existing = await fs.promises.readFile(lockPath, "utf8");
      const data: LockData = JSON.parse(existing);
      throw new ProfileLockedError(workspaceId, data);
    } catch (err: any) {
      if (err instanceof ProfileLockedError) throw err;
      if (err.code !== "ENOENT") throw err;
    }

    const data: LockData = {
      sessionId,
      pid: process.pid,
      createdAt: new Date().toISOString(),
      workspaceId,
      browserMode,
      proxySummary,
    };
    await fs.promises.writeFile(lockPath, JSON.stringify(data, null, 2), "utf8");
  }

  async isLocked(workspaceId: string): Promise<boolean> {
    try {
      await fs.promises.access(this.paths.lockFile(workspaceId));
      return true;
    } catch {
      return false;
    }
  }

  async read(workspaceId: string): Promise<LockData | null> {
    try {
      const raw = await fs.promises.readFile(this.paths.lockFile(workspaceId), "utf8");
      return JSON.parse(raw) as LockData;
    } catch {
      return null;
    }
  }

  async release(workspaceId: string): Promise<void> {
    try {
      await fs.promises.unlink(this.paths.lockFile(workspaceId));
    } catch (err: any) {
      if (err.code !== "ENOENT") throw err;
    }
  }
}
