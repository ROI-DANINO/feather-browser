import * as fs from "fs";
import type { FeatherPaths } from "../fs-layout";

export interface WorkspaceData {
  workspaceId: string;
  createdAt: string;
  [key: string]: unknown;
}

export class WorkspaceMetadata {
  constructor(private readonly paths: FeatherPaths) {}

  async read(workspaceId: string): Promise<WorkspaceData | null> {
    try {
      const raw = await fs.promises.readFile(this.paths.workspaceJson(workspaceId), "utf8");
      return JSON.parse(raw) as WorkspaceData;
    } catch {
      return null;
    }
  }

  async write(workspaceId: string, data: WorkspaceData): Promise<void> {
    const filePath = this.paths.workspaceJson(workspaceId);
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
  }

  async ensureExists(workspaceId: string): Promise<WorkspaceData> {
    const existing = await this.read(workspaceId);
    if (existing) return existing;
    const data: WorkspaceData = {
      workspaceId,
      createdAt: new Date().toISOString(),
    };
    await this.write(workspaceId, data);
    return data;
  }
}
