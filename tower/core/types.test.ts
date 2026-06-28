// tower/core/types.test.ts
import { describe, it, expect } from "vitest";
import { DetectorReport, RunRecord, LevelVerdict } from "./types";

describe("core types", () => {
  it("accepts a valid DetectorReport", () => {
    const r = DetectorReport.parse({ nonce: "abc", detectorId: "d1", verdict: "ok" });
    expect(r.verdict).toBe("ok");
  });

  it("rejects an unknown verdict", () => {
    expect(() => LevelVerdict.parse("sometimes")).toThrow();
  });

  it("rejects a RunRecord missing stoppedAtLevel", () => {
    expect(() =>
      RunRecord.parse({ runId: "r", towerId: "t", toolId: "x", startedAt: "now", levels: [] }),
    ).toThrow();
  });
});
