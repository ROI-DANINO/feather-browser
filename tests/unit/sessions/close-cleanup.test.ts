import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

vi.mock("playwright", () => ({
  chromium: {
    launchPersistentContext: vi.fn(async () => ({
      pages: () => [],
      on: vi.fn(),
      close: vi.fn(async () => {}),
    })),
    executablePath: () => "/usr/bin/true",
  },
}));

import { SessionManager } from "../../../src/sessions/manager";
import { FeatherPaths, ensureDirs } from "../../../src/fs-layout";
import { ProfileLock } from "../../../src/profiles/lock";
import { WorkspaceMetadata } from "../../../src/profiles/workspace";

let tmp: string;
let manager: SessionManager;

beforeEach(async () => {
  tmp = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-close-test-"));
  await ensureDirs(tmp);
  const paths = new FeatherPaths(tmp);
  manager = new SessionManager(paths, new ProfileLock(paths), new WorkspaceMetadata(paths));
});

afterEach(async () => {
  vi.restoreAllMocks();
  await fs.promises.rm(tmp, { recursive: true, force: true });
});

describe("disposable close cleanup", () => {
  it("passes retry options to rm and does not throw when rm still fails", async () => {
    const session = await manager.launch({ profile: { kind: "disposable" } });
    const rmSpy = vi.spyOn(fs.promises, "rm").mockRejectedValueOnce(
      Object.assign(new Error("ENOTEMPTY: directory not empty"), { code: "ENOTEMPTY" })
    );
    await expect(manager.close(session.sessionId)).resolves.toBeUndefined();
    expect(rmSpy).toHaveBeenCalledWith(
      expect.stringContaining(session.sessionId),
      expect.objectContaining({ recursive: true, force: true, maxRetries: expect.any(Number) })
    );
  });
});
