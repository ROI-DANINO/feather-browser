// tower/core/sink-registry.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSinkRegistry } from "./sink-registry";
import type { DetectorReport } from "./types";

const report = (nonce: string, over: Partial<DetectorReport> = {}): DetectorReport => ({
  nonce,
  detectorId: "runtimeEnableLeak",
  verdict: "ok",
  ...over,
});

describe("sink-registry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("arm → record → recorded", () => {
    const reg = createSinkRegistry({ now: () => Date.now() });
    reg.arm("n1", { deadline: 1000 });
    expect(reg.record("n1", report("n1"))).toEqual({ status: "recorded" });
  });

  it("unknown nonce → unknown", () => {
    const reg = createSinkRegistry({ now: () => Date.now() });
    expect(reg.record("ghost", report("ghost"))).toEqual({ status: "unknown" });
  });

  it("replay (already recorded) → consumed", () => {
    const reg = createSinkRegistry({ now: () => Date.now() });
    reg.arm("n1", { deadline: 1000 });
    expect(reg.record("n1", report("n1"))).toEqual({ status: "recorded" });
    // second record on the same nonce is single-use → consumed
    expect(reg.record("n1", report("n1"))).toEqual({ status: "consumed" });
  });

  it("single-use: a third record after consumed still → consumed", () => {
    const reg = createSinkRegistry({ now: () => Date.now() });
    reg.arm("n1", { deadline: 1000 });
    reg.record("n1", report("n1"));
    reg.record("n1", report("n1"));
    expect(reg.record("n1", report("n1"))).toEqual({ status: "consumed" });
  });

  it("past deadline while armed → expired", () => {
    const reg = createSinkRegistry({ now: () => Date.now() });
    reg.arm("n1", { deadline: 100 });
    vi.setSystemTime(200);
    expect(reg.record("n1", report("n1"))).toEqual({ status: "expired" });
  });

  it("report.nonce !== nonce arg → mismatch", () => {
    const reg = createSinkRegistry({ now: () => Date.now() });
    reg.arm("n1", { deadline: 1000 });
    expect(reg.record("n1", report("other"))).toEqual({ status: "mismatch" });
  });

  it("awaitReport resolves with a report that arrived BEFORE the await", async () => {
    const reg = createSinkRegistry({ now: () => Date.now() });
    reg.arm("n1", { deadline: 1000 });
    const r = report("n1", { verdict: "blocked" });
    reg.record("n1", r);
    await expect(reg.awaitReport("n1", 1000)).resolves.toEqual(r);
  });

  it("awaitReport resolves with a report that arrives AFTER the await starts", async () => {
    const reg = createSinkRegistry({ now: () => Date.now() });
    reg.arm("n1", { deadline: 1000 });
    const r = report("n1", { verdict: "ok" });
    const pending = reg.awaitReport("n1", 1000);
    // report lands after the await has begun waiting
    reg.record("n1", r);
    await expect(pending).resolves.toEqual(r);
  });

  it("awaitReport resolves null at the deadline when no report arrives", async () => {
    const reg = createSinkRegistry({ now: () => Date.now() });
    reg.arm("n1", { deadline: 100 });
    const pending = reg.awaitReport("n1", 100);
    await vi.advanceTimersByTimeAsync(100);
    await expect(pending).resolves.toBeNull();
  });

  it("awaitReport on an unknown nonce resolves null", async () => {
    const reg = createSinkRegistry({ now: () => Date.now() });
    await expect(reg.awaitReport("ghost", 100)).resolves.toBeNull();
  });

  it("awaitReport past its deadline with no report resolves null immediately", async () => {
    const reg = createSinkRegistry({ now: () => Date.now() });
    reg.arm("n1", { deadline: 100 });
    vi.setSystemTime(500);
    await expect(reg.awaitReport("n1", 100)).resolves.toBeNull();
  });
});
