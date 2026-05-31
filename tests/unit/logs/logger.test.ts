import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { FeatherLogger } from "../../../src/logs/logger";
import { EVENTS } from "../../../src/logs/events";
import { FeatherPaths } from "../../../src/fs-layout";

let tmpDir: string;
let paths: FeatherPaths;
let logger: FeatherLogger;

beforeEach(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-log-"));
  paths = new FeatherPaths(tmpDir);
  logger = new FeatherLogger(paths);
});

afterEach(async () => {
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe("FeatherLogger.log", () => {
  it("writes a log event to the correct JSONL file path", async () => {
    await logger.log({
      ts: "2026-05-31T00:00:00.000Z",
      level: "info",
      event: EVENTS.SESSION_LAUNCH_COMPLETED,
      sessionId: "ses_test_001",
    });
    const logPath = paths.sessionLog("ses_test_001");
    const exists = await fs.promises.access(logPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  it("writes valid JSON on each line", async () => {
    await logger.log({
      ts: "2026-05-31T00:00:00.000Z",
      level: "info",
      event: EVENTS.PAGE_NAVIGATE_COMPLETED,
      sessionId: "ses_test_002",
      requestId: "req_001",
      data: { url: "https://example.com", durationMs: 100 },
    });
    const logPath = paths.sessionLog("ses_test_002");
    const content = await fs.promises.readFile(logPath, "utf8");
    const lines = content.trim().split("\n");
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0]);
    expect(parsed.event).toBe(EVENTS.PAGE_NAVIGATE_COMPLETED);
    expect(parsed.level).toBe("info");
    expect(parsed.sessionId).toBe("ses_test_002");
    expect(parsed.requestId).toBe("req_001");
    expect(parsed.ts).toBe("2026-05-31T00:00:00.000Z");
    expect(parsed.data.url).toBe("https://example.com");
  });

  it("appends two events as two separate lines", async () => {
    await logger.log({ ts: "2026-05-31T00:00:00.000Z", level: "info", event: EVENTS.SESSION_LAUNCH_REQUESTED, sessionId: "ses_test_003" });
    await logger.log({ ts: "2026-05-31T00:00:01.000Z", level: "info", event: EVENTS.SESSION_LAUNCH_COMPLETED, sessionId: "ses_test_003" });
    const content = await fs.promises.readFile(paths.sessionLog("ses_test_003"), "utf8");
    const lines = content.trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]).event).toBe(EVENTS.SESSION_LAUNCH_REQUESTED);
    expect(JSON.parse(lines[1]).event).toBe(EVENTS.SESSION_LAUNCH_COMPLETED);
  });

  it("creates the log directory if it does not exist", async () => {
    await logger.log({ ts: "2026-05-31T00:00:00.000Z", level: "warn", event: EVENTS.PROFILE_LOCK_REJECTED, sessionId: "ses_test_004" });
    const content = await fs.promises.readFile(paths.sessionLog("ses_test_004"), "utf8");
    expect(content.trim().length).toBeGreaterThan(0);
  });

  it("includes level, ts, event, sessionId in every line", async () => {
    await logger.log({ ts: "2026-05-31T12:00:00.000Z", level: "error", event: EVENTS.SESSION_LAUNCH_FAILED, sessionId: "ses_test_005" });
    const content = await fs.promises.readFile(paths.sessionLog("ses_test_005"), "utf8");
    const parsed = JSON.parse(content.trim());
    expect(parsed).toHaveProperty("ts", "2026-05-31T12:00:00.000Z");
    expect(parsed).toHaveProperty("level", "error");
    expect(parsed).toHaveProperty("event", EVENTS.SESSION_LAUNCH_FAILED);
    expect(parsed).toHaveProperty("sessionId", "ses_test_005");
  });

  it("omits undefined optional fields from JSON output", async () => {
    await logger.log({ ts: "2026-05-31T00:00:00.000Z", level: "info", event: EVENTS.SERVICE_STARTED, sessionId: "ses_test_006" });
    const content = await fs.promises.readFile(paths.sessionLog("ses_test_006"), "utf8");
    const parsed = JSON.parse(content.trim());
    expect(parsed).not.toHaveProperty("requestId");
    expect(parsed).not.toHaveProperty("data");
  });

  it("writes events for different sessions to different files", async () => {
    await logger.log({ ts: "2026-05-31T00:00:00.000Z", level: "info", event: EVENTS.SESSION_LAUNCH_COMPLETED, sessionId: "ses_test_007" });
    await logger.log({ ts: "2026-05-31T00:00:00.000Z", level: "info", event: EVENTS.SESSION_CLOSE_COMPLETED, sessionId: "ses_test_008" });
    const c007 = await fs.promises.readFile(paths.sessionLog("ses_test_007"), "utf8");
    const c008 = await fs.promises.readFile(paths.sessionLog("ses_test_008"), "utf8");
    expect(JSON.parse(c007.trim()).event).toBe(EVENTS.SESSION_LAUNCH_COMPLETED);
    expect(JSON.parse(c008.trim()).event).toBe(EVENTS.SESSION_CLOSE_COMPLETED);
  });
});
