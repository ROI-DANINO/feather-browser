import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { randomUUID } from "crypto";
import { FeatherPaths, ensureDirs } from "../../src/fs-layout";
import { ProfileLock } from "../../src/profiles/lock";
import { WorkspaceMetadata } from "../../src/profiles/workspace";
import { SessionManager } from "../../src/sessions/manager";
import { DebugCapture } from "../../src/debug/capture";
import { DebugBundle } from "../../src/debug/bundle";
import { assertNoSecretLeak } from "../helpers/leak-scan";
import { startLeakFixture, type Fixture } from "../helpers/leak-fixture";

let tmpDir: string;
let paths: FeatherPaths;
let manager: SessionManager;
let fixture: Fixture;

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-leak-"));
  await ensureDirs(tmpDir);
  paths = new FeatherPaths(tmpDir);
  manager = new SessionManager(paths, new ProfileLock(paths), new WorkspaceMetadata(paths));
  fixture = await startLeakFixture();
});

afterAll(async () => {
  await Promise.allSettled(manager.list().map((s) => manager.close(s.sessionId, { force: true })));
  await fixture.close();
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe("secret leakage gate", () => {
  it("keeps clean-tier surfaces free of seeded credentials", async () => {
    const pwCanary = `FEATHER-LEAK-CANARY-${randomUUID()}`;
    const urlCanary = `FEATHER-LEAK-CANARY-${randomUUID()}`;

    const session = await manager.launch({
      workspaceId: "leak-gate",
      profile: { kind: "persistent" },
      browserMode: "chromium-headless-shell",
    });
    const { page } = await session.openTab();

    const capture = new DebugCapture(session.getContext(), session.debugDir, {
      trace: true,
      screenshots: true,
    });
    await capture.start();

    await page.goto(`${fixture.baseUrl}/track?token=${urlCanary}`, { waitUntil: "domcontentloaded" });

    await page.goto(`${fixture.baseUrl}/login`, { waitUntil: "domcontentloaded" });
    await page.fill("#pw", pwCanary);
    await page.click("#submit");
    await page.waitForLoadState("domcontentloaded");

    const shotDir = path.join(session.debugDir, "screenshots");
    await fs.promises.mkdir(shotDir, { recursive: true });
    await page.screenshot({ path: path.join(shotDir, "after.png") });

    await capture.finalize();
    await new DebugBundle(session, paths).finalize("test-complete");

    const sessionId = session.sessionId;
    const debugDir = session.debugDir;
    await manager.close(sessionId, { force: true });

    const logDir = path.dirname(paths.sessionLog(sessionId));

    expect(fixture.received.some((body) => body.includes(pwCanary))).toBe(true);

    assertNoSecretLeak(pwCanary, [debugDir, logDir]);
    assertNoSecretLeak(urlCanary, [debugDir, logDir]);
  }, 60000);
});
