// tower/core/server.test.ts
import { describe, it, expect } from "vitest";
import { buildServer, type ServerDeps } from "./server";
import { createSinkRegistry } from "./sink-registry";
import type { DetectorReport } from "./types";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { RunRecord } from "./types";

/** A registry with the nonce pre-armed far in the future, plus a capture buffer for onReport. */
function harness(opts: { arm?: string; deadline?: number } = {}): {
  deps: ServerDeps;
  seen: DetectorReport[];
  registry: ReturnType<typeof createSinkRegistry>;
} {
  const registry = createSinkRegistry();
  if (opts.arm) registry.arm(opts.arm, { deadline: opts.deadline ?? Date.now() + 60_000 });
  const seen: DetectorReport[] = [];
  return { registry, seen, deps: { registry, onReport: (r) => seen.push(r) } };
}

describe("buildServer", () => {
  it("GET /health -> ok", async () => {
    const { deps } = harness();
    const app = buildServer(deps);
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
    await app.close();
  });

  it("POST /sink/:nonce with an armed, matching nonce records and forwards the report (200)", async () => {
    const { deps, seen } = harness({ arm: "n123" });
    const app = buildServer(deps);
    const res = await app.inject({
      method: "POST",
      url: "/sink/n123",
      payload: { nonce: "n123", detectorId: "rebrowser", verdict: "ok" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
    expect(seen).toHaveLength(1);
    expect(seen[0].verdict).toBe("ok");
    await app.close();
  });

  it("POST /sink/:nonce rejects a nonce mismatch with 400 and does not forward", async () => {
    const { deps, seen } = harness({ arm: "n123" });
    const app = buildServer(deps);
    const res = await app.inject({
      method: "POST",
      url: "/sink/n123",
      payload: { nonce: "DIFFERENT", detectorId: "rebrowser", verdict: "ok" },
    });
    expect(res.statusCode).toBe(400);
    expect(seen).toHaveLength(0);
    await app.close();
  });

  it("POST /sink/:nonce with an unknown (never-armed) nonce -> 410 and does not forward", async () => {
    const { deps, seen } = harness(); // nothing armed
    const app = buildServer(deps);
    const res = await app.inject({
      method: "POST",
      url: "/sink/ghost",
      payload: { nonce: "ghost", detectorId: "rebrowser", verdict: "ok" },
    });
    expect(res.statusCode).toBe(410);
    expect(seen).toHaveLength(0);
    await app.close();
  });

  it("POST /sink/:nonce replay after a recorded report -> 409 and forwards only once", async () => {
    const { deps, seen } = harness({ arm: "n123" });
    const app = buildServer(deps);
    const payload = { nonce: "n123", detectorId: "rebrowser", verdict: "ok" };
    const first = await app.inject({ method: "POST", url: "/sink/n123", payload });
    const second = await app.inject({ method: "POST", url: "/sink/n123", payload });
    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(409);
    expect(seen).toHaveLength(1); // onReport fired only on the recorded (first) report
    await app.close();
  });

  it("POST /sink/:nonce past the deadline -> 410 (expired) and does not forward", async () => {
    const { deps, seen } = harness({ arm: "n123", deadline: Date.now() - 1 });
    const app = buildServer(deps);
    const res = await app.inject({
      method: "POST",
      url: "/sink/n123",
      payload: { nonce: "n123", detectorId: "rebrowser", verdict: "ok" },
    });
    expect(res.statusCode).toBe(410);
    expect(seen).toHaveLength(0);
    await app.close();
  });

  it("POST /sink/:nonce with an invalid DetectorReport body -> 400 WITHOUT touching the registry", async () => {
    const { deps, seen, registry } = harness({ arm: "n123" });
    const app = buildServer(deps);
    const res = await app.inject({
      method: "POST",
      url: "/sink/n123",
      payload: { nonce: "n123", detectorId: "rebrowser" /* missing verdict */ },
    });
    expect(res.statusCode).toBe(400);
    expect(seen).toHaveLength(0);
    // The armed nonce was never consumed — a subsequent well-formed report still records (200).
    const ok = await app.inject({
      method: "POST",
      url: "/sink/n123",
      payload: { nonce: "n123", detectorId: "rebrowser", verdict: "ok" },
    });
    expect(ok.statusCode).toBe(200);
    expect(registry.record("n123", { nonce: "n123", detectorId: "x", verdict: "ok" }).status).toBe("consumed");
    await app.close();
  });

  it("a text/plain beacon body parses identically to a JSON body", async () => {
    const report = { nonce: "beacon", detectorId: "runtimeEnableLeak", verdict: "blocked" as const, detail: { count: 3 } };

    // JSON transport (fetch keepalive).
    const jsonH = harness({ arm: "beacon" });
    const jsonApp = buildServer(jsonH.deps);
    const jsonRes = await jsonApp.inject({
      method: "POST",
      url: "/sink/beacon",
      headers: { "content-type": "application/json" },
      payload: report,
    });

    // text/plain transport (navigator.sendBeacon sends the JSON as a string).
    const beaconH = harness({ arm: "beacon" });
    const beaconApp = buildServer(beaconH.deps);
    const beaconRes = await beaconApp.inject({
      method: "POST",
      url: "/sink/beacon",
      headers: { "content-type": "text/plain" },
      payload: JSON.stringify(report),
    });

    expect(beaconRes.statusCode).toBe(jsonRes.statusCode);
    expect(beaconRes.statusCode).toBe(200);
    expect(beaconH.seen).toEqual(jsonH.seen);
    expect(beaconH.seen[0]).toMatchObject({ nonce: "beacon", detectorId: "runtimeEnableLeak", verdict: "blocked", detail: { count: 3 } });
    await jsonApp.close();
    await beaconApp.close();
  });

  it("a malformed text/plain body (not JSON) -> 400 and does not forward", async () => {
    const { deps, seen } = harness({ arm: "n123" });
    const app = buildServer(deps);
    const res = await app.inject({
      method: "POST",
      url: "/sink/n123",
      headers: { "content-type": "text/plain" },
      payload: "this is not json",
    });
    expect(res.statusCode).toBe(400);
    expect(seen).toHaveLength(0);
    await app.close();
  });

  it("GET /levels/placeholder serves an HTML page", async () => {
    const { deps } = harness();
    const app = buildServer(deps);
    const res = await app.inject({ method: "GET", url: "/levels/placeholder" });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.body).toContain("Tower placeholder level");
    await app.close();
  });

  it("GET /levels/runtime-enable is wired into buildServer (same-origin as the sink)", async () => {
    const { deps } = harness();
    const app = buildServer(deps);
    const res = await app.inject({ method: "GET", url: "/levels/runtime-enable", query: { nonce: "wired-1" } });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    // The injected nonce and the vendored probe are both present in the served page.
    expect(res.body).toContain("wired-1");
    expect(res.body).toContain("stackLookupCount");
    expect(res.body).toContain("/sink/");
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
    const { deps } = harness();
    const app = buildServer({ ...deps, resultsFile: file });
    const res = await app.inject({ method: "GET", url: "/" });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.body).toContain("feather");
    expect(res.body).toContain("security");
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("GET / with no results file renders the empty state", async () => {
    const { deps } = harness();
    const app = buildServer({ ...deps, resultsFile: join(tmpdir(), "tower-nope", "missing.jsonl") });
    const res = await app.inject({ method: "GET", url: "/" });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.body).toContain("No runs recorded yet");
    await app.close();
  });
});
