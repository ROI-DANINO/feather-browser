// tower/core/store.test.ts
import { describe, it, expect, afterEach } from "vitest";
import { rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { appendRun, readRuns } from "./store";
import type { RunRecord } from "./types";

const file = join(tmpdir(), `tower-store-test-${process.pid}.jsonl`);
afterEach(() => { if (existsSync(file)) rmSync(file); });

const rec = (runId: string): RunRecord => ({
  runId, towerId: "tower-1", toolId: "stub", startedAt: "2026-06-28T00:00:00Z",
  levels: [], stoppedAtLevel: null,
});

describe("jsonl store", () => {
  it("appends records and reads them back in order", () => {
    appendRun(file, rec("r1"));
    appendRun(file, rec("r2"));
    const back = readRuns(file);
    expect(back.map((r) => r.runId)).toEqual(["r1", "r2"]);
  });

  it("readRuns of a missing file is []", () => {
    expect(readRuns(join(tmpdir(), `nope-${process.pid}.jsonl`))).toEqual([]);
  });

  it("rejects a record that fails schema validation", () => {
    expect(() => appendRun(file, { runId: "bad" } as unknown as RunRecord)).toThrow();
  });

  it("tolerates a corrupt/truncated line and returns only the valid records", () => {
    appendRun(file, rec("r1"));
    // Append a truncated (invalid JSON) line directly — simulates a mid-write crash
    const { appendFileSync } = require("node:fs");
    appendFileSync(file, '{"runId":"oops"\n'); // truncated — no closing }
    const back = readRuns(file);
    expect(back).toHaveLength(1);
    expect(back[0].runId).toBe("r1");
  });
});
