// tower/levels/runtime-enable/level.test.ts
import { describe, it, expect } from "vitest";
import { makeRuntimeEnableLevel } from "./level";
import { decideOutcome } from "../../core/verdict";
import type { SinkRegistry } from "../../core/sink-registry";
import type { DetectorReport } from "../../core/types";

const report = (over: Partial<DetectorReport>): DetectorReport => ({
  nonce: "n1",
  detectorId: "runtimeEnableLeak",
  verdict: "ok",
  ...over,
});

const TIMEOUT = 15_000;

/** Build a level whose registry hands grade() the given report. */
function levelWith(reportToReturn: DetectorReport | null) {
  const arms: Array<{ nonce: string; deadline: number }> = [];
  const registry: SinkRegistry = {
    arm(nonce, opts) {
      arms.push({ nonce, deadline: opts.deadline });
    },
    record() {
      return { status: "recorded" };
    },
    async awaitReport() {
      return reportToReturn;
    },
  };
  const level = makeRuntimeEnableLevel({
    registry,
    baseUrl: "http://127.0.0.1:1234",
    nonce: "n1",
    now: () => 1000,
    timeoutMs: TIMEOUT,
  });
  return { level, arms };
}

describe("makeRuntimeEnableLevel — construction", () => {
  it("arms the nonce with deadline = now + timeoutMs before any drive", () => {
    const { arms } = levelWith(null);
    expect(arms).toEqual([{ nonce: "n1", deadline: 1000 + TIMEOUT }]);
  });

  it("builds a load/observe task keyed by nonce at the same-origin page", () => {
    const { level } = levelWith(null);
    expect(level.id).toBe("runtime-enable");
    expect(level.task.levelId).toBe("runtime-enable");
    expect(level.task.url).toBe("http://127.0.0.1:1234/levels/runtime-enable?nonce=n1");
    // The goal must NOT instruct clicking/typing — the page self-reports on load.
    expect(level.task.goal.length).toBeGreaterThan(0);
    expect(level.task.goal.toLowerCase()).toContain("load");
  });

  it("defaults the nonce to a random uuid when none is injected", () => {
    const arms: Array<{ nonce: string; deadline: number }> = [];
    const registry: SinkRegistry = {
      arm(nonce, opts) {
        arms.push({ nonce, deadline: opts.deadline });
      },
      record: () => ({ status: "recorded" }),
      awaitReport: async () => null,
    };
    const a = makeRuntimeEnableLevel({ registry, baseUrl: "http://127.0.0.1:1" });
    const b = makeRuntimeEnableLevel({ registry, baseUrl: "http://127.0.0.1:1" });
    expect(arms[0].nonce).toMatch(/^[0-9a-f-]{36}$/);
    expect(arms[0].nonce).not.toBe(arms[1].nonce); // fresh per run
    expect(a.task.url).toContain(arms[0].nonce);
    expect(b.task.url).toContain(arms[1].nonce);
  });
});

describe("makeRuntimeEnableLevel — grade() report→Grade mapping (design §1.4)", () => {
  it("'blocked' report → blocked Grade carrying the stackLookupCount, → FAIL", async () => {
    const { level } = levelWith(report({ verdict: "blocked", detail: { stackLookupCount: 7 } }));
    const grade = await level.grade();
    expect(grade).toEqual({
      verdict: "blocked",
      cause: "Runtime.enable leaked (stackLookupCount=7)",
      suggestedFix: null,
    });
    expect(decideOutcome(grade)).toBe("FAIL");
  });

  it("'ok' report → ok Grade (no cause/fix), → WIN", async () => {
    const { level } = levelWith(report({ verdict: "ok" }));
    const grade = await level.grade();
    expect(grade).toEqual({ verdict: "ok", cause: null, suggestedFix: null });
    expect(decideOutcome(grade)).toBe("WIN");
  });

  it("'gated' report → gated Grade with BOTH cause and fix, → PARTIAL", async () => {
    const { level } = levelWith(report({ verdict: "gated" }));
    const grade = await level.grade();
    expect(grade.verdict).toBe("gated");
    // The PARTIAL invariant: gated stays PARTIAL only with a non-empty cause AND fix.
    expect(grade.cause).toBeTruthy();
    expect(grade.suggestedFix).toBeTruthy();
    expect(grade.cause?.trim().length).toBeGreaterThan(0);
    expect(grade.suggestedFix?.trim().length).toBeGreaterThan(0);
    expect(decideOutcome(grade)).toBe("PARTIAL");
  });

  it("no report by the deadline → error Grade naming the timeout, → UNTESTABLE", async () => {
    const { level } = levelWith(null);
    const grade = await level.grade();
    expect(grade).toEqual({
      verdict: "error",
      cause: `no report within ${TIMEOUT}ms`,
      suggestedFix: null,
    });
    expect(decideOutcome(grade)).toBe("UNTESTABLE");
  });

  it("silence is never guessed as blocked (null → error, not blocked)", async () => {
    const { level } = levelWith(null);
    const grade = await level.grade();
    expect(grade.verdict).not.toBe("blocked");
    expect(grade.verdict).toBe("error");
  });

  it("'blocked' report with no detail still yields a well-formed cause", async () => {
    const { level } = levelWith(report({ verdict: "blocked" }));
    const grade = await level.grade();
    expect(grade.verdict).toBe("blocked");
    expect(grade.cause).toContain("Runtime.enable leaked");
    expect(decideOutcome(grade)).toBe("FAIL");
  });
});
