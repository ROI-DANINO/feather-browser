import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { ProfileLock } from "../../../src/profiles/lock";
import { FeatherPaths } from "../../../src/fs-layout";

let tmpDir: string;
let paths: FeatherPaths;

beforeEach(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-test-"));
  await fs.promises.mkdir(path.join(tmpDir, "profiles", "ws1"), { recursive: true });
  paths = new FeatherPaths(tmpDir);
});

afterEach(async () => {
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe("ProfileLock.create", () => {
  it("writes lock file with session metadata", async () => {
    const lock = new ProfileLock(paths);
    await lock.create("ws1", "ses1", "chromium-new-headless", null);
    const raw = await fs.promises.readFile(paths.lockFile("ws1"), "utf8");
    const data = JSON.parse(raw);
    expect(data.sessionId).toBe("ses1");
    expect(data.workspaceId).toBe("ws1");
    expect(data.browserMode).toBe("chromium-new-headless");
    expect(data.proxySummary).toBeNull();
    expect(typeof data.pid).toBe("number");
    expect(typeof data.createdAt).toBe("string");
  });

  it("throws PROFILE_LOCKED when lock already exists", async () => {
    const lock = new ProfileLock(paths);
    await lock.create("ws1", "ses1", "chromium-new-headless", null);
    await expect(
      lock.create("ws1", "ses2", "chromium-new-headless", null)
    ).rejects.toMatchObject({ code: "PROFILE_LOCKED" });
  });
});

describe("ProfileLock.isLocked", () => {
  it("returns false when no lock file exists", async () => {
    const lock = new ProfileLock(paths);
    expect(await lock.isLocked("ws1")).toBe(false);
  });

  it("returns true after lock is created", async () => {
    const lock = new ProfileLock(paths);
    await lock.create("ws1", "ses1", "chromium-new-headless", null);
    expect(await lock.isLocked("ws1")).toBe(true);
  });
});

describe("ProfileLock.release", () => {
  it("removes the lock file", async () => {
    const lock = new ProfileLock(paths);
    await lock.create("ws1", "ses1", "chromium-new-headless", null);
    await lock.release("ws1");
    expect(await lock.isLocked("ws1")).toBe(false);
  });

  it("does not throw if lock file is already gone", async () => {
    const lock = new ProfileLock(paths);
    await expect(lock.release("ws1")).resolves.toBeUndefined();
  });
});
