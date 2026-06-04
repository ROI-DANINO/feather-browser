// tests/measurement/scenario.measurement.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import crypto from "crypto";
import { FeatherPaths, ensureDirs } from "../../src/fs-layout";
import { ProfileLock } from "../../src/profiles/lock";
import { WorkspaceMetadata } from "../../src/profiles/workspace";
import { SessionManager } from "../../src/sessions/manager";
import { startHttpServer } from "../../src/transport/http";
import { ProcessSampler } from "../../src/measurement/sampler";
import { MeasurementRunner } from "../../src/measurement/runner";
import { writeArtifacts } from "../../src/measurement/reporter";
import type { Sample } from "../../src/measurement/sampler";
import type { ScenarioResult } from "../../src/measurement/runner";

// NOTE: Only chromium-headless-shell is run automatically to avoid system Chrome dependency.
// To compare both modes, run MeasurementRunner.run("chromium-new-headless") manually
// after installing system Chrome/Chromium and using npm run test:measurement.

let baseUrl: string;
let token: string;
let manager: SessionManager;
let tmpDir: string;
let paths: FeatherPaths;
let measurementDir: string;
let runId: string;

let results: ScenarioResult[] = [];
let samples: Sample[] = [];

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-measure-"));
  await ensureDirs(tmpDir);
  paths = new FeatherPaths(tmpDir);
  const lock = new ProfileLock(paths);
  const workspace = new WorkspaceMetadata(paths);
  manager = new SessionManager(paths, lock, workspace);
  const { port, token: t } = await startHttpServer("127.0.0.1", 0, manager, paths);
  token = t;
  baseUrl = `http://127.0.0.1:${port}`;

  runId = crypto.randomUUID();
  measurementDir = paths.measurementDir(runId);
});

afterAll(async () => {
  const sessions = manager.list();
  await Promise.allSettled(sessions.map((s) => manager.close(s.sessionId, { force: true })));
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe("Resource measurement scenario (chromium-headless-shell)", () => {
  it("runs the full measurement scenario and collects timings", async () => {
    const sampler = new ProcessSampler([process.pid], 500);
    const runner = new MeasurementRunner(baseUrl, token, tmpDir);

    sampler.start();

    const result = await runner.run("chromium-headless-shell");

    samples = sampler.stop();
    results = [result];

    await writeArtifacts(runId, measurementDir, results, samples);

    // Verify result shape
    expect(result.browserMode).toBe("chromium-headless-shell");
    expect(typeof result.workspaceId).toBe("string");
    expect(result.nodePid).toBe(process.pid);

    // All timing fields must be positive numbers
    expect(result.timings.launchMs).toBeGreaterThan(0);
    expect(result.timings.navigateMs).toBeGreaterThan(0);
    expect(result.timings.snapshotMs).toBeGreaterThan(0);
    expect(result.timings.screenshotMs).toBeGreaterThan(0);
    expect(result.timings.extractMs).toBeGreaterThan(0);
    expect(result.timings.closeMs).toBeGreaterThan(0);
    expect(result.timings.totalMs).toBeGreaterThan(0);

    // Pins the debug-dir path resolution: a wrong path reads as 0 bytes.
    expect(result.debugBundleSize).toBeGreaterThan(0);
  });

  it("summary.json exists and has required fields (runId, timestamp, results array)", async () => {
    const summaryPath = path.join(measurementDir, "summary.json");
    const exists = await fs.promises
      .access(summaryPath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);

    const raw = await fs.promises.readFile(summaryPath, "utf8");
    const summary = JSON.parse(raw);

    expect(summary.runId).toBe(runId);
    expect(typeof summary.timestamp).toBe("string");
    expect(Array.isArray(summary.results)).toBe(true);
    expect(summary.results.length).toBeGreaterThan(0);
    expect(typeof summary.comparison).toBe("object");
    expect(typeof summary.comparison.launchMsDiff).toBe("number");
  });

  it("samples.jsonl exists and contains at least 1 line", async () => {
    const samplesPath = path.join(measurementDir, "samples.jsonl");
    const exists = await fs.promises
      .access(samplesPath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);

    const raw = await fs.promises.readFile(samplesPath, "utf8");
    const lines = raw.split("\n").filter((l) => l.trim().length > 0);
    expect(lines.length).toBeGreaterThanOrEqual(1);

    // Each line must be valid JSON with a ts field
    for (const line of lines) {
      const parsed = JSON.parse(line);
      expect(typeof parsed.ts).toBe("string");
      expect(typeof parsed.pids).toBe("object");
    }
  });

  it("scenario.json exists and contains one result entry", async () => {
    const scenarioPath = path.join(measurementDir, "scenario.json");
    const exists = await fs.promises
      .access(scenarioPath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);

    const raw = await fs.promises.readFile(scenarioPath, "utf8");
    const scenario = JSON.parse(raw);

    expect(Array.isArray(scenario)).toBe(true);
    expect(scenario.length).toBe(1);
    expect(scenario[0].browserMode).toBe("chromium-headless-shell");
    expect(scenario[0].timings.launchMs).toBeGreaterThan(0);
  });
});
