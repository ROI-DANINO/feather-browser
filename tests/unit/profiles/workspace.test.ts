import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { WorkspaceMetadata } from "../../../src/profiles/workspace";
import { FeatherPaths } from "../../../src/fs-layout";

let tmpDir: string;
let paths: FeatherPaths;

beforeEach(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-ws-"));
  await fs.promises.mkdir(path.join(tmpDir, "profiles", "ws1"), { recursive: true });
  paths = new FeatherPaths(tmpDir);
});

afterEach(async () => {
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe("WorkspaceMetadata", () => {
  it("writes and reads workspace.json", async () => {
    const wm = new WorkspaceMetadata(paths);
    await wm.write("ws1", { workspaceId: "ws1", createdAt: "2026-05-31T00:00:00.000Z" });
    const data = await wm.read("ws1");
    expect(data?.workspaceId).toBe("ws1");
  });

  it("returns null when workspace.json does not exist", async () => {
    const wm = new WorkspaceMetadata(paths);
    const data = await wm.read("missing");
    expect(data).toBeNull();
  });
});
