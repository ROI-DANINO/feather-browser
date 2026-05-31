// src/measurement/reporter.ts
import * as fs from "fs";
import * as path from "path";
import type { Sample } from "./sampler";
import type { ScenarioResult } from "./runner";

export interface MeasurementSummary {
  runId: string;
  timestamp: string;
  results: ScenarioResult[];
  comparison: {
    launchMsDiff: number;    // chromium-new-headless minus chromium-headless-shell
    peakRssNodeDiff: number; // chromium-new-headless minus chromium-headless-shell (from samples)
  };
}

export async function writeArtifacts(
  runId: string,
  measurementDir: string,
  results: ScenarioResult[],
  samples: Sample[]
): Promise<void> {
  await fs.promises.mkdir(measurementDir, { recursive: true });

  // Write samples.jsonl — one JSON object per line
  const samplesPath = path.join(measurementDir, "samples.jsonl");
  const samplesLines = samples.map((s) => JSON.stringify(s)).join("\n");
  await fs.promises.writeFile(samplesPath, samplesLines + (samples.length > 0 ? "\n" : ""), "utf8");

  // Write scenario.json — full array of results
  const scenarioPath = path.join(measurementDir, "scenario.json");
  await fs.promises.writeFile(scenarioPath, JSON.stringify(results, null, 2), "utf8");

  // Build comparison: find results by browser mode
  const newHeadless = results.find((r) => r.browserMode === "chromium-new-headless");
  const headlessShell = results.find((r) => r.browserMode === "chromium-headless-shell");

  const launchMsDiff =
    newHeadless && headlessShell
      ? newHeadless.timings.launchMs - headlessShell.timings.launchMs
      : 0;

  // Compute peak RSS for node pid from samples for each mode
  function peakRssForPid(pid: number): number {
    let peak = 0;
    for (const sample of samples) {
      const stat = sample.pids[pid];
      if (stat && stat.rss > peak) peak = stat.rss;
    }
    return peak;
  }

  const peakRssNodeDiff =
    newHeadless && headlessShell
      ? peakRssForPid(newHeadless.nodePid) - peakRssForPid(headlessShell.nodePid)
      : 0;

  const summary: MeasurementSummary = {
    runId,
    timestamp: new Date().toISOString(),
    results,
    comparison: {
      launchMsDiff,
      peakRssNodeDiff,
    },
  };

  // Write summary.json
  const summaryPath = path.join(measurementDir, "summary.json");
  await fs.promises.writeFile(summaryPath, JSON.stringify(summary, null, 2), "utf8");
}
