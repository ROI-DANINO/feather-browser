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
    const data: LockData = {
      sessionId,
      pid: process.pid,
      createdAt: new Date().toISOString(),
      workspaceId,
      browserMode,
      proxySummary,
    };

    let fd: fs.promises.FileHandle | undefined;
    try {
      fd = await fs.promises.open(lockPath, "wx");
    } catch (err: any) {
      if (err.code === "EEXIST") {
        const existing = await fs.promises.readFile(lockPath, "utf8");
        const existingData: LockData = JSON.parse(existing);
        throw new ProfileLockedError(workspaceId, existingData);
      }
      throw err;
    }

    try {
      await fd.writeFile(JSON.stringify(data, null, 2), "utf8");
    } finally {
      await fd.close();
    }
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
