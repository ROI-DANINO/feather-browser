# Tower PR-1 · Chunk 1 — Engine + Website Skeleton — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the empty Tower engine + website skeleton — typed records, the verdict mapping (with the PARTIAL invariant), per-level/per-part timing, the append-only JSONL run log, a sequential runner that walks levels and stops on the first non-WIN, and a minimal Fastify control plane that serves a placeholder challenge page and an out-of-band verdict sink — all driven by **stub** levels/adapters so it is testable end-to-end before real ones exist.

**Architecture:** A thin TypeScript core under `tower/core/`, extending the existing `tower/` (it does **not** touch `behavioral.ts` / `classify.ts`). The runner depends only on small `Adapter` / `Level` / `Tower` interfaces, so Chunk 2 (real adapters) and Chunk 3 (real levels) just implement those interfaces. All verdicts come from the level's grader; the core never decides a score.

**Tech Stack:** TypeScript 5.4 (CommonJS), Node 20, Fastify 5, Zod 3, Vitest 4, ts-node. No new dependencies.

## Global Constraints

- **CommonJS only** — repo has no `"type":"module"`; `__dirname` is available; no top-level `await`. (`package.json`)
- **No new dependencies.** Use only what `package.json` already has (fastify ^5.8.5, zod ^3.23.8, vitest ^4.1.8, ts-node). 
- **Tests live next to code as `*.test.ts`** under `tower/` — Vitest already includes `tower/**/*.test.ts` (`vitest.config.ts:7`). No config change needed.
- **Run a single test file:** `npx vitest run <path>`. **Run all:** `npm test`.
- **Do NOT modify** `tower/behavioral.ts`, `tower/classify.ts`, `tower/classify.test.ts`, or `tower/results.md` — the legacy detector stays as-is with its old PASS/FAIL/BLOCKED vocabulary.
- **The core never decides a score.** Verdicts (`ok|gated|blocked|error`) come from a level's grader; the core only maps verdict → outcome and applies the PARTIAL invariant.
- **The PARTIAL invariant:** a `gated` verdict maps to PARTIAL **only if** it carries BOTH a non-empty `cause` AND a non-empty `suggestedFix`; otherwise it downgrades to FAIL.
- **No CDP/Playwright attach in the core.** The core is a control plane + page host only; it never drives the measured browser.
- **Commit after every task** with the message shown in the task's final step.

---

## File Structure

| File | Responsibility |
|---|---|
| `tower/core/types.ts` | All Zod schemas + inferred types + the `Adapter`/`Level`/`Tower` interfaces. The shared vocabulary every other file imports. |
| `tower/core/verdict.ts` | Pure: map a grader verdict → outcome, applying the PARTIAL invariant. |
| `tower/core/timing.ts` | Pure-ish: a stopwatch that times named "parts" and reports total + per-part ms. `now()` injected for determinism. |
| `tower/core/store.ts` | Append-only JSONL run log under `tower/results/` + a reader. |
| `tower/core/runner.ts` | The sequential runner: walk a tower's ordered levels, time each, stop on first non-WIN, produce a `RunRecord`. |
| `tower/core/server.ts` | Minimal Fastify app: `/health`, the out-of-band `POST /sink/:nonce`, and a placeholder challenge page. Built via a factory so tests use `app.inject` (no real port). |
| `tower/core/stubs.ts` | A stub `Adapter` and a stub `Level`/`Tower` factory used by tests (and a smoke `serve`) so the runner is exercisable before Chunks 2–3. |
| `tower/serve.ts` | Tiny entrypoint: build the server, listen on `FEATHER_TOWER_PORT` (default 0 = OS-assigned). Wired to `npm run tower:serve`. |

---

### Task 1: Core types (Zod schemas + interfaces)

**Files:**
- Create: `tower/core/types.ts`
- Test: `tower/core/types.test.ts`

**Interfaces:**
- Consumes: nothing (leaf).
- Produces:
  - `LevelVerdict` = `z.enum(["ok","gated","blocked","error"])` + type
  - `LevelOutcome` = `z.enum(["WIN","PARTIAL","FAIL","UNTESTABLE"])` + type
  - `PartTiming` = `{ part: string; ms: number }`
  - `TowerTask` = `{ levelId: string; url: string; goal: string }`
  - `Grade` = `{ verdict: LevelVerdict; cause: string | null; suggestedFix: string | null }`
  - `LevelResult` = `{ levelId; verdict; outcome; cause; suggestedFix; totalMs; parts: PartTiming[] }`
  - `RunRecord` = `{ runId; towerId; toolId; startedAt; levels: LevelResult[]; stoppedAtLevel: string | null }`
  - `DetectorReport` = `{ nonce: string; detectorId: string; verdict: LevelVerdict; detail?: Record<string, unknown> }`
  - Interfaces: `Adapter { id: string; run(task: TowerTask): Promise<void> }`, `Level { id: string; task: TowerTask; grade(): Promise<Grade> }`, `Tower { id: string; levels: Level[] }`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tower/core/types.test.ts`
Expected: FAIL — cannot resolve `./types`.

- [ ] **Step 3: Write minimal implementation**

```ts
// tower/core/types.ts
import { z } from "zod";

/** The grader's native per-level verdict (Paterson ordinal). Set by the level's grader, never the core. */
export const LevelVerdict = z.enum(["ok", "gated", "blocked", "error"]);
export type LevelVerdict = z.infer<typeof LevelVerdict>;

/** What the Tower does with a verdict. */
export const LevelOutcome = z.enum(["WIN", "PARTIAL", "FAIL", "UNTESTABLE"]);
export type LevelOutcome = z.infer<typeof LevelOutcome>;

export const PartTiming = z.object({ part: z.string(), ms: z.number() });
export type PartTiming = z.infer<typeof PartTiming>;

/** What a level asks a tool to do. */
export const TowerTask = z.object({ levelId: z.string(), url: z.string(), goal: z.string() });
export type TowerTask = z.infer<typeof TowerTask>;

/** A grader's output: the verdict plus the explanation the PARTIAL invariant needs. */
export const Grade = z.object({
  verdict: LevelVerdict,
  cause: z.string().nullable(),
  suggestedFix: z.string().nullable(),
});
export type Grade = z.infer<typeof Grade>;

export const LevelResult = z.object({
  levelId: z.string(),
  verdict: LevelVerdict,
  outcome: LevelOutcome,
  cause: z.string().nullable(),
  suggestedFix: z.string().nullable(),
  totalMs: z.number(),
  parts: z.array(PartTiming),
});
export type LevelResult = z.infer<typeof LevelResult>;

export const RunRecord = z.object({
  runId: z.string(),
  towerId: z.string(),
  toolId: z.string(),
  startedAt: z.string(),
  levels: z.array(LevelResult),
  stoppedAtLevel: z.string().nullable(),
});
export type RunRecord = z.infer<typeof RunRecord>;

/** Payload the challenge page self-posts out-of-band to the sink, keyed by per-run nonce. */
export const DetectorReport = z.object({
  nonce: z.string(),
  detectorId: z.string(),
  verdict: LevelVerdict,
  detail: z.record(z.unknown()).optional(),
});
export type DetectorReport = z.infer<typeof DetectorReport>;

/** A tool driver. Drives the tool to the task's URL/goal; throws on a drive error. Never grades. */
export interface Adapter {
  id: string;
  run(task: TowerTask): Promise<void>;
}

/** A challenge level. The adapter runs first, then grade() returns the verdict + explanation. */
export interface Level {
  id: string;
  task: TowerTask;
  grade(): Promise<Grade>;
}

/** An ordered set of levels — "tower 1", "tower 2", … */
export interface Tower {
  id: string;
  levels: Level[];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tower/core/types.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add tower/core/types.ts tower/core/types.test.ts
git commit -m "feat(tower-core): Zod records + Adapter/Level/Tower interfaces"
```

---

### Task 2: Verdict mapping + the PARTIAL invariant (pure)

**Files:**
- Create: `tower/core/verdict.ts`
- Test: `tower/core/verdict.test.ts`

**Interfaces:**
- Consumes: `LevelVerdict`, `LevelOutcome`, `Grade` from `./types`.
- Produces: `decideOutcome(grade: Grade): LevelOutcome`.

- [ ] **Step 1: Write the failing test**

```ts
// tower/core/verdict.test.ts
import { describe, it, expect } from "vitest";
import { decideOutcome } from "./verdict";

const g = (verdict: any, cause: string | null, suggestedFix: string | null) =>
  ({ verdict, cause, suggestedFix });

describe("decideOutcome", () => {
  it("ok -> WIN", () => expect(decideOutcome(g("ok", null, null))).toBe("WIN"));
  it("blocked -> FAIL", () => expect(decideOutcome(g("blocked", null, null))).toBe("FAIL"));
  it("error -> UNTESTABLE", () => expect(decideOutcome(g("error", null, null))).toBe("UNTESTABLE"));

  it("gated WITH cause+fix -> PARTIAL", () =>
    expect(decideOutcome(g("gated", "tripped soft check", "add X"))).toBe("PARTIAL"));

  it("gated WITHOUT a fix -> downgrades to FAIL", () =>
    expect(decideOutcome(g("gated", "tripped soft check", null))).toBe("FAIL"));

  it("gated WITHOUT a cause -> downgrades to FAIL", () =>
    expect(decideOutcome(g("gated", null, "add X"))).toBe("FAIL"));

  it("gated with empty-string fix -> downgrades to FAIL", () =>
    expect(decideOutcome(g("gated", "c", "   "))).toBe("FAIL"));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tower/core/verdict.test.ts`
Expected: FAIL — cannot resolve `./verdict`.

- [ ] **Step 3: Write minimal implementation**

```ts
// tower/core/verdict.ts
import type { Grade, LevelOutcome, LevelVerdict } from "./types";

const MAP: Record<LevelVerdict, LevelOutcome> = {
  ok: "WIN",
  gated: "PARTIAL",
  blocked: "FAIL",
  error: "UNTESTABLE",
};

const present = (s: string | null): boolean => !!s && s.trim().length > 0;

/**
 * Map a grader verdict to a Tower outcome. THE PARTIAL INVARIANT: a `gated` verdict stays PARTIAL
 * only if it carries BOTH a cause and a suggestedFix (a partial with no actionable explanation is a
 * dead end for the user, so it downgrades to FAIL).
 */
export function decideOutcome(grade: Grade): LevelOutcome {
  const base = MAP[grade.verdict];
  if (base === "PARTIAL" && !(present(grade.cause) && present(grade.suggestedFix))) {
    return "FAIL";
  }
  return base;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tower/core/verdict.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add tower/core/verdict.ts tower/core/verdict.test.ts
git commit -m "feat(tower-core): verdict->outcome map with the PARTIAL invariant"
```

---

### Task 3: Stopwatch (per-part timing)

**Files:**
- Create: `tower/core/timing.ts`
- Test: `tower/core/timing.test.ts`

**Interfaces:**
- Consumes: `PartTiming` from `./types`.
- Produces: `stopwatch(now: () => number): Stopwatch` where `Stopwatch = { part<T>(name: string, fn: () => Promise<T>): Promise<T>; parts(): PartTiming[]; totalMs(): number }`.

- [ ] **Step 1: Write the failing test**

```ts
// tower/core/timing.test.ts
import { describe, it, expect } from "vitest";
import { stopwatch } from "./timing";

describe("stopwatch", () => {
  it("records per-part and total ms using the injected clock", async () => {
    let t = 0;
    const clock = () => t;
    const sw = stopwatch(clock);

    await sw.part("a", async () => { t += 10; });
    await sw.part("b", async () => { t += 25; });

    expect(sw.parts()).toEqual([{ part: "a", ms: 10 }, { part: "b", ms: 25 }]);
    expect(sw.totalMs()).toBe(35);
  });

  it("times a part even when the fn throws, then re-throws", async () => {
    let t = 0;
    const sw = stopwatch(() => t);
    await expect(
      sw.part("boom", async () => { t += 5; throw new Error("x"); }),
    ).rejects.toThrow("x");
    expect(sw.parts()).toEqual([{ part: "boom", ms: 5 }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tower/core/timing.test.ts`
Expected: FAIL — cannot resolve `./timing`.

- [ ] **Step 3: Write minimal implementation**

```ts
// tower/core/timing.ts
import type { PartTiming } from "./types";

export interface Stopwatch {
  part<T>(name: string, fn: () => Promise<T>): Promise<T>;
  parts(): PartTiming[];
  totalMs(): number;
}

/** A stopwatch that times named parts. `now` is injected so tests are deterministic. */
export function stopwatch(now: () => number): Stopwatch {
  const recorded: PartTiming[] = [];
  return {
    async part<T>(name: string, fn: () => Promise<T>): Promise<T> {
      const start = now();
      try {
        return await fn();
      } finally {
        recorded.push({ part: name, ms: now() - start });
      }
    },
    parts: () => recorded.slice(),
    totalMs: () => recorded.reduce((sum, p) => sum + p.ms, 0),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tower/core/timing.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add tower/core/timing.ts tower/core/timing.test.ts
git commit -m "feat(tower-core): injectable stopwatch for per-part timing"
```

---

### Task 4: JSONL run store (append + read)

**Files:**
- Create: `tower/core/store.ts`
- Test: `tower/core/store.test.ts`

**Interfaces:**
- Consumes: `RunRecord` from `./types`.
- Produces: `appendRun(file: string, rec: RunRecord): void`, `readRuns(file: string): RunRecord[]`.

- [ ] **Step 1: Write the failing test**

```ts
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tower/core/store.test.ts`
Expected: FAIL — cannot resolve `./store`.

- [ ] **Step 3: Write minimal implementation**

```ts
// tower/core/store.ts
import { appendFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { RunRecord } from "./types";

/** Append one RunRecord as a JSON line. Truth lives in git as append-only NDJSON. Validates first. */
export function appendRun(file: string, rec: RunRecord): void {
  const valid = RunRecord.parse(rec); // throws on a malformed record — never write garbage
  mkdirSync(dirname(file), { recursive: true });
  appendFileSync(file, JSON.stringify(valid) + "\n");
}

/** Read all RunRecords. Missing file ⇒ []. Blank lines skipped. */
export function readRuns(file: string): RunRecord[] {
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => RunRecord.parse(JSON.parse(line)));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tower/core/store.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add tower/core/store.ts tower/core/store.test.ts
git commit -m "feat(tower-core): append-only JSONL run store with schema validation"
```

---

### Task 5: Stub adapter + stub level/tower (test fixtures)

**Files:**
- Create: `tower/core/stubs.ts`
- Test: `tower/core/stubs.test.ts`

**Interfaces:**
- Consumes: `Adapter`, `Level`, `Tower`, `Grade`, `TowerTask` from `./types`.
- Produces:
  - `stubAdapter(opts?: { id?: string; fail?: boolean }): Adapter` — `run()` resolves, or rejects with `Error("stub adapter failure")` when `fail`.
  - `stubLevel(id: string, grade: Grade): Level` — a level whose `grade()` returns the given `Grade`; `task` derived from `id`.
  - `stubTower(id: string, levels: Level[]): Tower`.

- [ ] **Step 1: Write the failing test**

```ts
// tower/core/stubs.test.ts
import { describe, it, expect } from "vitest";
import { stubAdapter, stubLevel, stubTower } from "./stubs";

describe("stubs", () => {
  it("stubAdapter resolves by default and rejects when fail=true", async () => {
    await expect(stubAdapter().run({ levelId: "l", url: "u", goal: "g" })).resolves.toBeUndefined();
    await expect(
      stubAdapter({ fail: true }).run({ levelId: "l", url: "u", goal: "g" }),
    ).rejects.toThrow("stub adapter failure");
  });

  it("stubLevel returns its preset grade and a task derived from its id", async () => {
    const lvl = stubLevel("l1", { verdict: "ok", cause: null, suggestedFix: null });
    expect(lvl.task.levelId).toBe("l1");
    expect((await lvl.grade()).verdict).toBe("ok");
  });

  it("stubTower keeps level order", () => {
    const t = stubTower("tower-1", [
      stubLevel("a", { verdict: "ok", cause: null, suggestedFix: null }),
      stubLevel("b", { verdict: "ok", cause: null, suggestedFix: null }),
    ]);
    expect(t.levels.map((l) => l.id)).toEqual(["a", "b"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tower/core/stubs.test.ts`
Expected: FAIL — cannot resolve `./stubs`.

- [ ] **Step 3: Write minimal implementation**

```ts
// tower/core/stubs.ts
import type { Adapter, Grade, Level, Tower } from "./types";

/** A no-op adapter for exercising the runner before real tools exist. */
export function stubAdapter(opts: { id?: string; fail?: boolean } = {}): Adapter {
  return {
    id: opts.id ?? "stub",
    async run() {
      if (opts.fail) throw new Error("stub adapter failure");
    },
  };
}

/** A level whose grade() is fixed up front. Its task is derived from the id. */
export function stubLevel(id: string, grade: Grade): Level {
  return {
    id,
    task: { levelId: id, url: `https://tower.local/levels/${id}`, goal: `complete ${id}` },
    async grade() {
      return grade;
    },
  };
}

export function stubTower(id: string, levels: Level[]): Tower {
  return { id, levels };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tower/core/stubs.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add tower/core/stubs.ts tower/core/stubs.test.ts
git commit -m "test(tower-core): stub adapter + stub level/tower fixtures"
```

---

### Task 6: The sequential runner

**Files:**
- Create: `tower/core/runner.ts`
- Test: `tower/core/runner.test.ts`

**Interfaces:**
- Consumes: `Adapter`, `Tower`, `RunRecord`, `LevelResult`, `Grade` from `./types`; `stopwatch` from `./timing`; `decideOutcome` from `./verdict`.
- Produces: `runTower(tower: Tower, adapter: Adapter, deps: RunDeps): Promise<RunRecord>` where `RunDeps = { runId: string; startedAt: string; now: () => number }`.

**Behavior contract:**
- Walk `tower.levels` in order. For each level: time a `"drive"` part (`adapter.run(level.task)`) then a `"grade"` part (`level.grade()`).
- If `adapter.run` throws, that level's grade is `{ verdict: "error", cause: <message>, suggestedFix: null }` (no `grade()` call), outcome UNTESTABLE, and the walk stops.
- Map verdict→outcome via `decideOutcome`. Append a `LevelResult` (with timing).
- **Stop on the first non-WIN** and set `stoppedAtLevel` to that level's id. If every level is WIN, `stoppedAtLevel` is `null`.

- [ ] **Step 1: Write the failing test**

```ts
// tower/core/runner.test.ts
import { describe, it, expect } from "vitest";
import { runTower } from "./runner";
import { stubAdapter, stubLevel, stubTower } from "./stubs";

const deps = () => {
  let t = 0;
  return { runId: "run-1", startedAt: "2026-06-28T00:00:00Z", now: () => (t += 1) };
};

describe("runTower", () => {
  it("walks all levels when every level WINs; stoppedAtLevel = null", async () => {
    const tower = stubTower("tower-1", [
      stubLevel("a", { verdict: "ok", cause: null, suggestedFix: null }),
      stubLevel("b", { verdict: "ok", cause: null, suggestedFix: null }),
    ]);
    const rec = await runTower(tower, stubAdapter(), deps());
    expect(rec.levels.map((l) => l.outcome)).toEqual(["WIN", "WIN"]);
    expect(rec.stoppedAtLevel).toBeNull();
  });

  it("stops at the first non-WIN level", async () => {
    const tower = stubTower("tower-1", [
      stubLevel("a", { verdict: "ok", cause: null, suggestedFix: null }),
      stubLevel("b", { verdict: "blocked", cause: "detected", suggestedFix: null }),
      stubLevel("c", { verdict: "ok", cause: null, suggestedFix: null }),
    ]);
    const rec = await runTower(tower, stubAdapter(), deps());
    expect(rec.levels.map((l) => l.levelId)).toEqual(["a", "b"]);
    expect(rec.levels[1].outcome).toBe("FAIL");
    expect(rec.stoppedAtLevel).toBe("b");
  });

  it("a PARTIAL with no fix downgrades to FAIL and stops", async () => {
    const tower = stubTower("tower-1", [
      stubLevel("a", { verdict: "gated", cause: "soft challenge", suggestedFix: null }),
    ]);
    const rec = await runTower(tower, stubAdapter(), deps());
    expect(rec.levels[0].outcome).toBe("FAIL");
    expect(rec.stoppedAtLevel).toBe("a");
  });

  it("an adapter failure becomes verdict=error / UNTESTABLE and stops", async () => {
    const tower = stubTower("tower-1", [
      stubLevel("a", { verdict: "ok", cause: null, suggestedFix: null }),
    ]);
    const rec = await runTower(tower, stubAdapter({ fail: true }), deps());
    expect(rec.levels[0].verdict).toBe("error");
    expect(rec.levels[0].outcome).toBe("UNTESTABLE");
    expect(rec.levels[0].cause).toContain("stub adapter failure");
    expect(rec.stoppedAtLevel).toBe("a");
  });

  it("records per-part timing for each level", async () => {
    const tower = stubTower("tower-1", [
      stubLevel("a", { verdict: "ok", cause: null, suggestedFix: null }),
    ]);
    const rec = await runTower(tower, stubAdapter(), deps());
    expect(rec.levels[0].parts.map((p) => p.part)).toEqual(["drive", "grade"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tower/core/runner.test.ts`
Expected: FAIL — cannot resolve `./runner`.

- [ ] **Step 3: Write minimal implementation**

```ts
// tower/core/runner.ts
import type { Adapter, Grade, LevelResult, RunRecord, Tower } from "./types";
import { stopwatch } from "./timing";
import { decideOutcome } from "./verdict";

export interface RunDeps {
  runId: string;
  startedAt: string;
  now: () => number;
}

/**
 * Drive `adapter` through `tower`'s ordered levels. Times a "drive" then a "grade" part per level,
 * maps verdict→outcome (PARTIAL invariant applied in decideOutcome), and STOPS on the first non-WIN.
 * An adapter throw becomes an `error` verdict (UNTESTABLE) and stops the walk.
 */
export async function runTower(tower: Tower, adapter: Adapter, deps: RunDeps): Promise<RunRecord> {
  const levels: LevelResult[] = [];
  let stoppedAtLevel: string | null = null;

  for (const level of tower.levels) {
    const sw = stopwatch(deps.now);
    let grade: Grade;
    try {
      await sw.part("drive", () => adapter.run(level.task));
      grade = await sw.part("grade", () => level.grade());
    } catch (e) {
      grade = {
        verdict: "error",
        cause: e instanceof Error ? e.message : String(e),
        suggestedFix: null,
      };
    }

    const outcome = decideOutcome(grade);
    levels.push({
      levelId: level.id,
      verdict: grade.verdict,
      outcome,
      cause: grade.cause,
      suggestedFix: grade.suggestedFix,
      totalMs: sw.totalMs(),
      parts: sw.parts(),
    });

    if (outcome !== "WIN") {
      stoppedAtLevel = level.id;
      break;
    }
  }

  return {
    runId: deps.runId,
    towerId: tower.id,
    toolId: adapter.id,
    startedAt: deps.startedAt,
    levels,
    stoppedAtLevel,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tower/core/runner.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add tower/core/runner.ts tower/core/runner.test.ts
git commit -m "feat(tower-core): sequential runner — walk levels, time parts, stop on first non-WIN"
```

---

### Task 7: Minimal Fastify server (health · sink · placeholder page)

**Files:**
- Create: `tower/core/server.ts`
- Test: `tower/core/server.test.ts`

**Interfaces:**
- Consumes: `DetectorReport` from `./types`.
- Produces: `buildServer(deps: ServerDeps): FastifyInstance` where `ServerDeps = { onReport: (r: DetectorReport) => void }`.
- Routes:
  - `GET /health` → `200 { ok: true }`
  - `POST /sink/:nonce` → validates body as `DetectorReport`, requires `body.nonce === params.nonce`; on success calls `deps.onReport(report)` and returns `200 { ok: true }`; on mismatch/invalid returns `400 { ok: false, error }`.
  - `GET /levels/placeholder` → `200`, `text/html`, a tiny page containing the marker text `Tower placeholder level`.

- [ ] **Step 1: Write the failing test**

```ts
// tower/core/server.test.ts
import { describe, it, expect } from "vitest";
import { buildServer } from "./server";
import type { DetectorReport } from "./types";

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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tower/core/server.test.ts`
Expected: FAIL — cannot resolve `./server`.

- [ ] **Step 3: Write minimal implementation**

```ts
// tower/core/server.ts
import Fastify, { type FastifyInstance } from "fastify";
import { DetectorReport } from "./types";

export interface ServerDeps {
  /** Called with a validated, nonce-matched detector report from the out-of-band sink. */
  onReport: (report: DetectorReport) => void;
}

const PLACEHOLDER_HTML = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Tower</title></head>
<body><main><h1>Tower placeholder level</h1>
<p>This page is a stand-in. Real challenge levels arrive in Chunk 3.</p></main></body></html>`;

/** The Tower control plane + page host. No CDP/Playwright — it never drives the measured browser. */
export function buildServer(deps: ServerDeps): FastifyInstance {
  const app = Fastify();

  app.get("/health", async () => ({ ok: true }));

  app.post("/sink/:nonce", async (req, reply) => {
    const { nonce } = req.params as { nonce: string };
    const parsed = DetectorReport.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ ok: false, error: "invalid DetectorReport" });
    }
    if (parsed.data.nonce !== nonce) {
      return reply.code(400).send({ ok: false, error: "nonce mismatch" });
    }
    deps.onReport(parsed.data);
    return reply.code(200).send({ ok: true });
  });

  app.get("/levels/placeholder", async (_req, reply) => {
    return reply.code(200).type("text/html").send(PLACEHOLDER_HTML);
  });

  return app;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tower/core/server.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add tower/core/server.ts tower/core/server.test.ts
git commit -m "feat(tower-core): Fastify control plane — health, out-of-band sink, placeholder page"
```

---

### Task 8: Serve entrypoint + npm script + end-to-end smoke

**Files:**
- Create: `tower/serve.ts`
- Modify: `package.json:8-22` (add the `tower:serve` script)
- Test: `tower/core/smoke.test.ts`

**Interfaces:**
- Consumes: `buildServer` from `./core/server`, `runTower` from `./core/runner`, `stubAdapter`/`stubLevel`/`stubTower` from `./core/stubs`, `appendRun`/`readRuns` from `./core/store`.
- Produces: `tower/serve.ts` (a runnable entrypoint; no exports required). The smoke test wires runner→store directly (it does not import `serve.ts`).

- [ ] **Step 1: Write the failing test**

```ts
// tower/core/smoke.test.ts
// End-to-end of the Chunk-1 spine: run a stub tower, persist the record, read it back.
import { describe, it, expect, afterEach } from "vitest";
import { rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runTower } from "./runner";
import { appendRun, readRuns } from "./store";
import { stubAdapter, stubLevel, stubTower } from "./stubs";

const file = join(tmpdir(), `tower-smoke-${process.pid}.jsonl`);
afterEach(() => { if (existsSync(file)) rmSync(file); });

describe("chunk-1 spine smoke", () => {
  it("runs a stub tower, stops on the FAIL, and persists a readable record", async () => {
    const tower = stubTower("tower-1", [
      stubLevel("detect", { verdict: "ok", cause: null, suggestedFix: null }),
      stubLevel("security", { verdict: "blocked", cause: "canary leaked", suggestedFix: "add guard" }),
    ]);
    let t = 0;
    const rec = await runTower(tower, stubAdapter(), {
      runId: "smoke-1", startedAt: "2026-06-28T00:00:00Z", now: () => (t += 1),
    });
    appendRun(file, rec);

    const back = readRuns(file);
    expect(back).toHaveLength(1);
    expect(back[0].stoppedAtLevel).toBe("security");
    expect(back[0].levels.map((l) => l.outcome)).toEqual(["WIN", "FAIL"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tower/core/smoke.test.ts`
Expected: FAIL — the imported core modules from earlier tasks exist, but if run in isolation before they are present it fails to resolve. (If Tasks 1–7 are done, this fails only until the test file itself exists — write it, then it should pass at Step 4.)

- [ ] **Step 3: Write the serve entrypoint and add the npm script**

Create `tower/serve.ts`:

```ts
// tower/serve.ts — runnable entrypoint. Boots the control plane; on boot also runs a stub tower
// once and persists the record, so `npm run tower:serve` proves the whole spine on a clean checkout.
import { join } from "node:path";
import { buildServer } from "./core/server";
import { runTower } from "./core/runner";
import { appendRun } from "./core/store";
import { stubAdapter, stubLevel, stubTower } from "./core/stubs";
import type { DetectorReport } from "./core/types";

const RESULTS = join(__dirname, "results", "runs.jsonl");

async function main(): Promise<void> {
  const reports: DetectorReport[] = [];
  const app = buildServer({ onReport: (r) => reports.push(r) });

  // Prove the spine: drive a stub tower once and persist the record.
  const tower = stubTower("tower-1", [
    stubLevel("detect", { verdict: "ok", cause: null, suggestedFix: null }),
    stubLevel("security", { verdict: "blocked", cause: "stub canary leaked", suggestedFix: "add an injection guard" }),
  ]);
  let t = 0;
  const rec = await runTower(tower, stubAdapter(), {
    runId: `serve-${new Date().toISOString()}`,
    startedAt: new Date().toISOString(),
    now: () => Date.now() - (t === 0 ? (t = Date.now()) : 0) + t * 0, // wall-clock deltas
  });
  appendRun(RESULTS, rec);
  console.log(`[tower] stub run persisted -> ${RESULTS} (stoppedAtLevel=${rec.stoppedAtLevel})`);

  const port = Number(process.env.FEATHER_TOWER_PORT ?? 0);
  const address = await app.listen({ host: "127.0.0.1", port });
  console.log(`[tower] control plane listening at ${address}`);
  console.log(`[tower] try: curl ${address}/health  ·  ${address}/levels/placeholder`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

> Note: keep the `now` clock simple — if the expression above is awkward, replace the `now` line with a monotonic counter seeded from `Date.now()`: `const base = Date.now(); ... now: () => Date.now() - base` declared before `runTower`. The persisted timing just needs to be real wall-clock deltas; the smoke test (which is the graded artifact) uses an injected counter and is unaffected.

Add to `package.json` scripts (after the `tower:behavioral` line, `package.json:16`):

```json
    "tower:behavioral": "ts-node tower/behavioral.ts",
    "tower:serve": "ts-node tower/serve.ts",
```

- [ ] **Step 4: Run the smoke test to verify it passes**

Run: `npx vitest run tower/core/smoke.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Manually verify the entrypoint boots**

Run: `npm run tower:serve` (then Ctrl-C after it prints the listening address).
Expected: prints `stub run persisted` + `control plane listening at http://127.0.0.1:<port>`. In another terminal, `curl http://127.0.0.1:<port>/health` returns `{"ok":true}`.

- [ ] **Step 6: Run the whole suite to confirm nothing regressed**

Run: `npm test`
Expected: all prior tests + the new `tower/core/*` tests PASS (the legacy `tower/classify.test.ts` and `tests/unit/**` are untouched).

- [ ] **Step 7: Commit**

```bash
git add tower/serve.ts tower/core/smoke.test.ts package.json
git commit -m "feat(tower-core): serve entrypoint + npm run tower:serve + end-to-end spine smoke"
```

---

## Self-Review

**Spec coverage (against `docs/specs/2026-06-28-tower-pr1-mvp-design.md` §7–8, Chunk 1):**
- Fastify control plane → Task 7. ✓
- Serves challenge pages (the website) → Task 7 (`/levels/placeholder`; real levels are Chunk 3). ✓
- Zod `TowerTask` / `TowerResult`(=`LevelResult`+`RunRecord`) / `DetectorReport` → Task 1. ✓
- Four registries → **deliberately deferred.** Chunk 1 needs only the `Adapter`/`Level`/`Tower` interfaces to be testable; the four Zod registries are scaffolding with one entry each and are pulled forward to Chunk 2 (adapters) / Chunk 3 (levels) where they get their first real entry. Noted here so it is not silently dropped.
- Sequential runner with per-level + per-part timing + stop-on-first-non-WIN → Tasks 3, 6. ✓
- JSONL-in-git truth log → Task 4 (`tower/results/runs.jsonl`). SQLite read-index → **deferred** (spec: "added only when the in-memory fold gets painful"). ✓
- Verdict model (ok/gated/blocked/error → WIN/PARTIAL/FAIL/UNTESTABLE) + PARTIAL invariant → Task 2. ✓
- Does NOT touch `behavioral.ts`/`classify.ts` → respected (new code under `tower/core/`). ✓
- AI summaries, scoring/CI math, real detectors, adapters → Chunks 2–4, correctly absent here. ✓

**Placeholder scan:** no TBD/TODO; every code step shows complete code. The one soft spot (the `now` clock in `serve.ts`) carries an explicit fallback and is not on the graded path (the smoke test uses an injected counter). ✓

**Type consistency:** `Grade` shape (`verdict`/`cause`/`suggestedFix`) is identical across Tasks 1, 2, 5, 6. `decideOutcome(grade: Grade)` is called the same way in Task 2's tests and Task 6's runner. `stopwatch(now)` signature matches between Tasks 3 and 6. `DetectorReport` matches between Tasks 1 and 7. `RunRecord` matches between Tasks 1, 4, 6, 8. ✓

**Branch:** this whole plan is Chunk 1 → build on branch `tower-core-skeleton` off `dev`; merge to `dev` when `npm test` is green and the diff is reviewed.
