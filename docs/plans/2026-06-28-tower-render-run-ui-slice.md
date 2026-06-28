# Tower "Render The Run" UI Slice — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve a real `GET /` page that renders the latest persisted `RunRecord` as clean product-style result cards.

**Architecture:** A pure `renderRun(record)` function (HTML string in, no I/O — unit-testable without Fastify) plus a thin `GET /` seam on the existing Fastify app that reads the latest run via the tolerant `readRuns` and hands it to `renderRun`. Mirrors the Chunk-1 style: pure core + thin server wrapper.

**Tech Stack:** TypeScript 5.4 / Node 20 / Fastify 5 / Zod 3 / Vitest. Inline `<style>` in the rendered HTML — no new dependencies, no asset pipeline, no client JS.

## Global Constraints

- **No new dependencies.** Server-rendered HTML with an inline `<style>` block only.
- **Do not touch** `tower/behavioral.ts`, `tower/classify.ts`, the runner, the verdict→outcome map, or any Zod schema. This slice only *renders* what a `RunRecord` already carries.
- **Escape all grader-authored strings** (`cause`, `suggestedFix`, ids) before emitting — they are untrusted.
- **AI paragraph slot on every card incl. WIN** — a labeled placeholder (`AI summary — wired in Chunk 4`); AI explains every level, never scores.
- **All four outcome states styled now** (`WIN` green · `PARTIAL` amber · `FAIL` red · `UNTESTABLE` grey) even though the stub emits only WIN/FAIL — this is the real Chunk-4 shell.
- **Latest run only** — `records.at(-1) ?? null`. No history list, run picker, live refresh, or real AI.
- Tests live beside source as `*.test.ts`; run with `npx vitest run tower/core/<file>.test.ts`.

Reference spec: `docs/specs/2026-06-28-tower-render-run-ui-slice-design.md`.

---

### Task 1: Pure `renderRun` renderer

**Files:**
- Create: `tower/core/render.ts`
- Test: `tower/core/render.test.ts`

**Interfaces:**
- Consumes: `RunRecord`, `LevelResult`, `LevelOutcome` from `./types` (already defined).
- Produces:
  - `export function renderRun(record: RunRecord | null): string` — a full HTML document.
  - `export function escapeHtml(s: string): string` — HTML-entity escaping (used by Task 1 internally; exported for the escaping test).

- [ ] **Step 1: Write the failing test**

```ts
// tower/core/render.test.ts
import { describe, it, expect } from "vitest";
import { renderRun, escapeHtml } from "./render";
import type { RunRecord, LevelResult } from "./types";

const winLevel: LevelResult = {
  levelId: "detect",
  verdict: "ok",
  outcome: "WIN",
  cause: null,
  suggestedFix: null,
  totalMs: 500,
  parts: [{ part: "drive", ms: 412 }, { part: "grade", ms: 88 }],
};

const failLevel: LevelResult = {
  levelId: "security",
  verdict: "blocked",
  outcome: "FAIL",
  cause: "stub canary leaked",
  suggestedFix: "add an injection guard",
  totalMs: 310,
  parts: [{ part: "drive", ms: 250 }, { part: "grade", ms: 60 }],
};

const record: RunRecord = {
  runId: "serve-2026-06-28T00:00:00.000Z",
  towerId: "tower-1",
  toolId: "feather",
  startedAt: "2026-06-28T00:00:00.000Z",
  levels: [winLevel, failLevel],
  stoppedAtLevel: "security",
};

describe("escapeHtml", () => {
  it("escapes HTML-significant characters", () => {
    expect(escapeHtml(`<script>"&'`)).toBe("&lt;script&gt;&quot;&amp;&#39;");
  });
});

describe("renderRun", () => {
  it("renders the empty state when record is null", () => {
    const html = renderRun(null);
    expect(html).toContain("No runs recorded yet");
    expect(html).toContain("npm run tower:serve");
  });

  it("renders the run header with tower, tool and stopped-at badge", () => {
    const html = renderRun(record);
    expect(html).toContain("tower-1");
    expect(html).toContain("feather");
    expect(html).toContain("stopped at: security");
  });

  it("a WIN card omits the cause/fix block", () => {
    const html = renderRun({ ...record, levels: [winLevel], stoppedAtLevel: null });
    expect(html).not.toContain('<div class="cause">'); // substring "cause" also lives in the CSS — match the block markup
    expect(html).toContain("WIN");
    expect(html).toContain("AI summary — wired in Chunk 4");
  });

  it("a FAIL card shows both cause and suggestedFix", () => {
    const html = renderRun({ ...record, levels: [failLevel] });
    expect(html).toContain("stub canary leaked");
    expect(html).toContain("add an injection guard");
  });

  it("renders all four outcome chips by label", () => {
    const four: LevelResult[] = (["WIN", "PARTIAL", "FAIL", "UNTESTABLE"] as const).map((o, i) => ({
      levelId: `l${i}`, verdict: "ok", outcome: o, cause: null, suggestedFix: null,
      totalMs: 1, parts: [],
    }));
    const html = renderRun({ ...record, levels: four, stoppedAtLevel: null });
    for (const o of ["WIN", "PARTIAL", "FAIL", "UNTESTABLE"]) expect(html).toContain(o);
  });

  it("escapes a grader-authored cause containing markup", () => {
    const html = renderRun({ ...record, levels: [{ ...failLevel, cause: "<script>x</script>" }] });
    expect(html).not.toContain("<script>x</script>");
    expect(html).toContain("&lt;script&gt;x&lt;/script&gt;");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tower/core/render.test.ts`
Expected: FAIL — cannot resolve `./render` (module does not exist yet).

- [ ] **Step 3: Write the implementation**

```ts
// tower/core/render.ts
import type { LevelOutcome, LevelResult, RunRecord } from "./types";

const OUTCOME_CLASS: Record<LevelOutcome, string> = {
  WIN: "win",
  PARTIAL: "partial",
  FAIL: "fail",
  UNTESTABLE: "untestable",
};

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const STYLES = `
:root { --bg:#f6f7f9; --card:#fff; --ink:#1c2330; --muted:#6b7280; --line:#e6e8ec;
  --win:#1a8a4b; --partial:#b5760a; --fail:#c0392b; --untestable:#6b7280; }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--ink);
  font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }
main { max-width: 980px; margin: 0 auto; padding: 40px 24px; }
.run-head h1 { margin:0 0 4px; font-size:1.6rem; }
.run-head .meta { margin:0; color:var(--muted); font-size:.85rem; }
.run-head .stopped { display:inline-block; margin-top:10px; padding:2px 10px; border-radius:999px;
  background:#fdecea; color:var(--fail); font-size:.8rem; font-weight:600; }
.grid { margin-top:28px; display:grid; gap:18px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
.card { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:20px;
  box-shadow:0 1px 2px rgba(16,24,40,.04); }
.card-head { display:flex; align-items:center; gap:10px; }
.card-head h2 { margin:0; font-size:1.05rem; }
.chip { padding:2px 10px; border-radius:999px; font-size:.72rem; font-weight:700; color:#fff;
  letter-spacing:.03em; }
.chip.win { background:var(--win); } .chip.partial { background:var(--partial); }
.chip.fail { background:var(--fail); } .chip.untestable { background:var(--untestable); }
.verdict, .timing { margin:8px 0 0; color:var(--muted); font-size:.82rem; }
.cause { margin-top:12px; padding-top:12px; border-top:1px dashed var(--line); }
.cause p { margin:4px 0; font-size:.9rem; }
.cause .label { display:inline-block; min-width:38px; color:var(--muted); font-weight:600;
  text-transform:uppercase; font-size:.7rem; }
.ai-slot { margin-top:14px; padding:10px 12px; border:1px dashed var(--line); border-radius:10px;
  background:#fafbfc; color:var(--muted); font-size:.8rem; font-style:italic; }
.empty { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:40px;
  text-align:center; color:var(--muted); }
.empty code { background:#eef0f3; padding:2px 6px; border-radius:6px; font-style:normal; }
`;

function renderCard(level: LevelResult): string {
  const cls = OUTCOME_CLASS[level.outcome];
  const parts = level.parts.map((p) => `${escapeHtml(p.part)} ${Math.round(p.ms)}ms`).join(" · ");
  const timing = `${parts}${parts ? " · " : ""}total ${Math.round(level.totalMs)}ms`;
  const causeBlock =
    level.cause !== null || level.suggestedFix !== null
      ? `<div class="cause">` +
        (level.cause !== null
          ? `<p><span class="label">cause</span> ${escapeHtml(level.cause)}</p>` : "") +
        (level.suggestedFix !== null
          ? `<p><span class="label">fix</span> ${escapeHtml(level.suggestedFix)}</p>` : "") +
        `</div>`
      : "";
  return `<article class="card">
    <div class="card-head"><span class="chip ${cls}">${level.outcome}</span>` +
      `<h2>${escapeHtml(level.levelId)}</h2></div>
    <p class="verdict">verdict: ${escapeHtml(level.verdict)}</p>
    <p class="timing">${timing}</p>
    ${causeBlock}
    <div class="ai-slot">AI summary — wired in Chunk 4</div>
  </article>`;
}

export function renderRun(record: RunRecord | null): string {
  const body =
    record === null
      ? `<div class="empty"><p>No runs recorded yet — run <code>npm run tower:serve</code>.</p></div>`
      : `<header class="run-head">
           <h1>${escapeHtml(record.towerId)} · ${escapeHtml(record.toolId)}</h1>
           <p class="meta">${escapeHtml(record.runId)} · ${escapeHtml(record.startedAt)}</p>` +
        (record.stoppedAtLevel !== null
          ? `<p class="stopped">stopped at: ${escapeHtml(record.stoppedAtLevel)}</p>` : "") +
        `</header>
         <section class="grid">${record.levels.map(renderCard).join("")}</section>`;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tower — run</title>
<style>${STYLES}</style></head>
<body><main>${body}</main></body></html>`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tower/core/render.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: clean (no errors).

- [ ] **Step 6: Commit**

```bash
git add tower/core/render.ts tower/core/render.test.ts
git commit -m "feat(tower): pure renderRun — result cards for a RunRecord"
```

---

### Task 2: `GET /` route + `resultsFile` server dep

**Files:**
- Modify: `tower/core/server.ts` (extend `ServerDeps`; add the `GET /` route)
- Modify: `tower/core/server.test.ts` (add two `GET /` tests)

**Interfaces:**
- Consumes: `renderRun` from `./render` (Task 1); `readRuns` from `./store` (existing: `readRuns(file: string): RunRecord[]`).
- Produces: `ServerDeps` gains optional `resultsFile?: string`; `GET /` returns `text/html`. Defaults to `join(__dirname, "..", "results", "runs.jsonl")` (the path `serve.ts` writes) when the dep is omitted, so existing callers are unaffected.

- [ ] **Step 1: Write the failing tests**

Add to `tower/core/server.test.ts` (new imports at top, new cases in the `describe`):

```ts
// add to the existing imports
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { RunRecord } from "./types";

// add inside describe("buildServer", () => { ... })
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
});

it("GET / with no results file renders the empty state", async () => {
  const app = buildServer({ onReport: () => {}, resultsFile: join(tmpdir(), "tower-nope", "missing.jsonl") });
  const res = await app.inject({ method: "GET", url: "/" });
  expect(res.statusCode).toBe(200);
  expect(res.body).toContain("No runs recorded yet");
  await app.close();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tower/core/server.test.ts`
Expected: FAIL — `GET /` returns 404 (route not defined), so the new assertions fail.

- [ ] **Step 3: Implement the route + dep**

In `tower/core/server.ts`, add imports at the top:

```ts
import { join } from "node:path";
import { readRuns } from "./store";
import { renderRun } from "./render";
```

Extend the deps interface:

```ts
export interface ServerDeps {
  /** Called with a validated, nonce-matched detector report from the out-of-band sink. */
  onReport: (report: DetectorReport) => void;
  /** Append-only run log GET / renders. Defaults to the path serve.ts writes. */
  resultsFile?: string;
}
```

Inside `buildServer`, after `const app = Fastify();`, resolve the path and add the route (place the `GET /` route alongside the others):

```ts
  const resultsFile = deps.resultsFile ?? join(__dirname, "..", "results", "runs.jsonl");

  app.get("/", async (_req, reply) => {
    const runs = readRuns(resultsFile);
    return reply.code(200).type("text/html").send(renderRun(runs.at(-1) ?? null));
  });
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tower/core/server.test.ts`
Expected: PASS (all existing tests + the 2 new ones).

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add tower/core/server.ts tower/core/server.test.ts
git commit -m "feat(tower): GET / renders the latest run (resultsFile dep + tolerant read)"
```

---

### Task 3: Wire `serve.ts` explicitly + live verification

**Files:**
- Modify: `tower/serve.ts` (pass `resultsFile` into `buildServer` so production is authoritative, not relying on the default)

**Interfaces:**
- Consumes: the extended `ServerDeps.resultsFile` from Task 2. `serve.ts` already has `const RESULTS = join(__dirname, "results", "runs.jsonl")`.

- [ ] **Step 1: Pass the results path into the server**

In `tower/serve.ts`, change the `buildServer` call to pass the path it already writes:

```ts
  const app = buildServer({
    onReport: (r) => console.log("[tower] sink report", r.detectorId, r.verdict),
    resultsFile: RESULTS,
  });
```

- [ ] **Step 2: Full suite + typecheck (no regressions)**

Run: `npx vitest run && npm run typecheck`
Expected: all green (the prior 521 + the new render/server tests), typecheck clean.

- [ ] **Step 3: Live verification**

Run the server and hit the new page:

```bash
FEATHER_TOWER_PORT=4870 npm run tower:serve &
sleep 2
curl -s http://127.0.0.1:4870/ | grep -o 'stopped at: security'   # expect a match
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' http://127.0.0.1:4870/   # expect 200 text/html
kill %1
```

Expected: the `grep` prints `stopped at: security` (the stub run rendered), and the status line is `200 text/html...`. This confirms `GET /` reads the run `serve.ts` just persisted and renders the FAIL card with its cause/fix.

- [ ] **Step 4: Commit**

```bash
git add tower/serve.ts
git commit -m "chore(tower): serve passes resultsFile so GET / reads the live run log"
```

---

## Self-Review

**Spec coverage** (against `docs/specs/2026-06-28-tower-render-run-ui-slice-design.md`):
- §3 pure `renderRun` + `GET /` seam + `resultsFile` injection → Tasks 1 & 2. ✓
- §4 run header / per-level cards / chips / per-part timing / cause-fix-when-present / AI slot every card / empty state → Task 1 tests + implementation. ✓
- §5 clean product-card styling, inline `<style>`, responsive grid, no JS → `STYLES` in Task 1. ✓
- §6 all listed render tests + the two server tests (fixture + empty) → Tasks 1 & 2. ✓
- §7 grid in run order; four outcomes styled; latest-run-only; AI slot incl. WIN → covered across tasks. ✓
- §8 escaping; no touch to behavioral/classify/runner/verdict/schemas; resultsFile keeps GET / off the real log in tests → Global Constraints + Task 2. ✓

**Placeholder scan:** No TBD/TODO/"handle edge cases"/"similar to" — every code step shows complete code. ✓

**Type consistency:** `renderRun(record: RunRecord | null): string` and `escapeHtml(s: string): string` are used identically in Tasks 1–2; `ServerDeps.resultsFile?: string` defined in Task 2 and consumed in Task 3; `readRuns(file)` matches the existing store signature. ✓
</content>
