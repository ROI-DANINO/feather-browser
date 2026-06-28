// tower/core/server.test.ts
import { describe, it, expect } from "vitest";
import { buildServer } from "./server";
import type { DetectorReport } from "./types";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { RunRecord } from "./types";

describe("buildServer", () => {
  it("GET /health -> ok", async () => {
    const app = buildServer({ onReport: () => {} });
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
    await app.close();
  });

  it("POST /sink/:nonce with a matching nonce forwards the report", async () => {
    const seen: DetectorReport[] = [];
    const app = buildServer({ onReport: (r) => seen.push(r) });
    const res = await app.inject({
      method: "POST",
      url: "/sink/n123",
      payload: { nonce: "n123", detectorId: "rebrowser", verdict: "ok" },
    });
    expect(res.statusCode).toBe(200);
    expect(seen).toHaveLength(1);
    expect(seen[0].verdict).toBe("ok");
    await app.close();
  });

  it("POST /sink/:nonce rejects a nonce mismatch with 400 and does not forward", async () => {
    const seen: DetectorReport[] = [];
    const app = buildServer({ onReport: (r) => seen.push(r) });
    const res = await app.inject({
      method: "POST",
      url: "/sink/n123",
      payload: { nonce: "DIFFERENT", detectorId: "rebrowser", verdict: "ok" },
    });
    expect(res.statusCode).toBe(400);
    expect(seen).toHaveLength(0);
    await app.close();
  });

  it("GET /levels/placeholder serves an HTML page", async () => {
    const app = buildServer({ onReport: () => {} });
    const res = await app.inject({ method: "GET", url: "/levels/placeholder" });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.body).toContain("Tower placeholder level");
    await app.close();
  });

  it("GET / with a fixture run renders the run page", async () => {
    const dir = mkdtempSync(join(tmpdir(), "tower-render-"));
    const file = join(dir, "runs.jsonl");
    const rec: RunRecord = {
      runId: "r1", towerId: "tower-1", toolId: "feather",
      startedAt: "2026-06-28T00:00:00.000Z",
      levels: [{ levelId: "security", verdict: "blocked", outcome: "FAIL",
        cause: "stub canary leaked", suggestedFix: "add an injection guard",
        totalMs: 310, parts: [{ part: "drive", ms: 250 }] }],
      stoppedAtLevel: "security",
    };
    writeFileSync(file, JSON.stringify(rec) + "\n");
    const app = buildServer({ onReport: () => {}, resultsFile: file });
    const res = await app.inject({ method: "GET", url: "/" });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.body).toContain("feather");
    expect(res.body).toContain("security");
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("GET / with no results file renders the empty state", async () => {
    const app = buildServer({ onReport: () => {}, resultsFile: join(tmpdir(), "tower-nope", "missing.jsonl") });
    const res = await app.inject({ method: "GET", url: "/" });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.body).toContain("No runs recorded yet");
    await app.close();
  });
});
