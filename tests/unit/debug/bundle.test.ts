import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

vi.mock("playwright", () => ({
  chromium: { launchPersistentContext: vi.fn() },
}));

import { DebugBundle } from "../../../src/debug/bundle";
import { FeatherPaths } from "../../../src/fs-layout";
import { FeatherSession } from "../../../src/sessions/session";

let tmpDir: string;
let paths: FeatherPaths;

function makeSession(tmpDir: string, sessionId: string): FeatherSession {
  const debugDirPath = path.join(tmpDir, "debug", sessionId);
  const session = new FeatherSession({
    workspaceId: "ws_bundle_001",
    profileKind: "persistent",
    browserMode: "chromium-new-headless",
    profilePath: path.join(tmpDir, "profiles", "ws_bundle_001", "profile"),
    debugDir: debugDirPath,
    proxy: null,
  });
  Object.defineProperty(session, "sessionId", { value: sessionId });
  return session;
}

beforeEach(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-bundle-"));
  paths = new FeatherPaths(tmpDir);
});

afterEach(async () => {
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
  vi.clearAllMocks();
});

describe("DebugBundle.finalize", () => {
  it("writes manifest.json to the debug directory", async () => {
    const sessionId = "ses_bundle_001";
    const session = makeSession(tmpDir, sessionId);
    const debugDir = path.join(tmpDir, "debug", sessionId);
    await fs.promises.mkdir(debugDir, { recursive: true });

    const bundle = new DebugBundle(session, paths);
    const manifestPath = await bundle.finalize("test-close");

    const exists = await fs.promises.access(manifestPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
    expect(manifestPath).toBe(path.join(debugDir, "manifest.json"));
  });

  it("manifest contains required identity fields", async () => {
    const sessionId = "ses_bundle_002";
    const session = makeSession(tmpDir, sessionId);
    const debugDir = path.join(tmpDir, "debug", sessionId);
    await fs.promises.mkdir(debugDir, { recursive: true });

    const bundle = new DebugBundle(session, paths);
    const manifestPath = await bundle.finalize("normal");
    const manifest = JSON.parse(await fs.promises.readFile(manifestPath, "utf8"));

    expect(manifest.sessionId).toBe(sessionId);
    expect(manifest.workspaceId).toBe("ws_bundle_001");
    expect(manifest.profileKind).toBe("persistent");
    expect(manifest.browserMode).toBe("chromium-new-headless");
    expect(manifest.proxySummary).toBeNull();
    expect(typeof manifest.startedAt).toBe("string");
    expect(typeof manifest.endedAt).toBe("string");
    expect(manifest.closeReason).toBe("normal");
  });

  it("manifest contains featherVersion and playwrightVersion strings", async () => {
    const sessionId = "ses_bundle_003";
    const session = makeSession(tmpDir, sessionId);
    await fs.promises.mkdir(path.join(tmpDir, "debug", sessionId), { recursive: true });

    const bundle = new DebugBundle(session, paths);
    const manifest = JSON.parse(await fs.promises.readFile(await bundle.finalize("normal"), "utf8"));

    expect(typeof manifest.featherVersion).toBe("string");
    expect(manifest.featherVersion.length).toBeGreaterThan(0);
    expect(typeof manifest.playwrightVersion).toBe("string");
    expect(manifest.playwrightVersion.length).toBeGreaterThan(0);
  });

  it("manifest artifacts array lists files present in debugDir", async () => {
    const sessionId = "ses_bundle_004";
    const session = makeSession(tmpDir, sessionId);
    const debugDir = path.join(tmpDir, "debug", sessionId);
    await fs.promises.mkdir(debugDir, { recursive: true });
    await fs.promises.writeFile(path.join(debugDir, "commands.jsonl"), '{"cmd":"test"}\n', "utf8");
    await fs.promises.writeFile(path.join(debugDir, "console.jsonl"), "", "utf8");

    const bundle = new DebugBundle(session, paths);
    const manifest = JSON.parse(await fs.promises.readFile(await bundle.finalize("normal"), "utf8"));

    expect(Array.isArray(manifest.artifacts)).toBe(true);
    expect(manifest.artifacts).toContain("commands.jsonl");
    expect(manifest.artifacts).toContain("console.jsonl");
  });

  it("manifest artifacts includes manifest.json on disk after finalize", async () => {
    const sessionId = "ses_bundle_005";
    const session = makeSession(tmpDir, sessionId);
    const debugDir = path.join(tmpDir, "debug", sessionId);
    await fs.promises.mkdir(debugDir, { recursive: true });

    const bundle = new DebugBundle(session, paths);
    await bundle.finalize("force");

    const dirListing = await fs.promises.readdir(debugDir);
    expect(dirListing).toContain("manifest.json");
  });

  it("manifest profilePath matches session profilePath", async () => {
    const sessionId = "ses_bundle_006";
    const session = makeSession(tmpDir, sessionId);
    await fs.promises.mkdir(path.join(tmpDir, "debug", sessionId), { recursive: true });

    const bundle = new DebugBundle(session, paths);
    const manifest = JSON.parse(await fs.promises.readFile(await bundle.finalize("graceful"), "utf8"));

    expect(manifest.profilePath).toBe(session.profilePath);
  });
});
