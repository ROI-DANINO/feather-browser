import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { SessionManager } from "../../src/sessions/manager";
import { FeatherPaths } from "../../src/fs-layout";
import { ProfileLock } from "../../src/profiles/lock";
import { WorkspaceMetadata } from "../../src/profiles/workspace";

// Mirrors the attach-cdp gate: spawnAndConnect derives --ozone-platform from env, so this runs on
// Wayland, X11, and CI under Xvfb. The headed-CDP path is the only one stealth checks run on.
let tmpDir: string;
let paths: FeatherPaths;
let manager: SessionManager;

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-stealth-int-"));
  paths = new FeatherPaths(tmpDir);
  manager = new SessionManager(paths, new ProfileLock(paths), new WorkspaceMetadata(paths));
});

afterAll(async () => {
  await new Promise((r) => setTimeout(r, 500));
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe("stealth checks on headed-CDP launch", () => {
  it(
    "records a stealthWarnings array (no SwiftShader on a real GPU)",
    async () => {
      const logSpy = vi.spyOn(manager["logger"], "log");
      const session = await manager.launch({
        profile: { kind: "disposable" },
        browserMode: "chromium-headed-cdp",
      });
      try {
        const record = session.toRecord();
        expect(Array.isArray(record.stealthWarnings)).toBe(true);
        // On a real GPU the headed-CDP path must not leak SwiftShader.
        expect(record.stealthWarnings.join(" ")).not.toMatch(/swiftshader/i);

        // Proves the checks actually ran on the real page (not just the record default):
        // the launch-completed log gains siteClass + stealthWarnings only via the manager wiring.
        const completed = logSpy.mock.calls.find(([e]) => e.event === "session.launch.completed");
        expect(completed).toBeDefined();
        expect(completed![0].data).toMatchObject({
          siteClass: expect.stringMatching(/^(standard|tier-c)$/),
          stealthWarnings: expect.any(Array),
        });
      } finally {
        logSpy.mockRestore();
        await manager.close(session.sessionId);
      }
    },
    30_000,
  );
});
