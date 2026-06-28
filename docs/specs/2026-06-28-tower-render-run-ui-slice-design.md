# Tower — "Render The Run" UI Slice (design)

> **Status:** approved 2026-06-28. A deliberate **deviation from PR-1 plan order** (Roi's call):
> build the website *shell* over the existing stub run **before** Chunk 2, for the visual payoff.
> Parent design → `docs/specs/2026-06-28-tower-pr1-mvp-design.md` (the HTML render is Chunk 4 there;
> this slice pulls the shell forward). Live pointer → `journal/context/active.md`.

## 1. Why this exists

Chunk 1 shipped the engine + a bare placeholder page. Running `npm run tower:serve` persists a
real `RunRecord` (a WIN→FAIL stub run, stop-at-security, with cause/fix + per-part timing) but
there is nothing to *look at*. Roi repeatedly wants to **see the actual website**; a pure-backend
Chunk 2 (Python adapter shim) would show nothing. This slice is low-risk frontend over data that
**already exists on disk** — it de-risks the Chunk-4 website design early and becomes the shell
Chunk 4 fills in.

**Outcome:** `GET /` renders the latest run as clean product-style result cards.

## 2. Scope (YAGNI-bounded)

In:
- A `GET /` route that reads the latest `RunRecord` and renders it as HTML.
- A pure `render(record)` function (HTML string in, no I/O) — unit-testable without Fastify.
- All four outcome states styled (`WIN`/`PARTIAL`/`FAIL`/`UNTESTABLE`) so this is the real
  Chunk-4 shell, even though the stub only emits WIN + FAIL.
- An empty state when no runs exist.

Out (later / Chunk 4):
- Real AI paragraphs (this slice renders a labeled **placeholder slot** only).
- Run history list, run picker, live refresh / SSE, scoring/CI/`tie` rendering.
- Any change to `behavioral.ts`, `classify.ts`, the runner, the verdict map, or the schemas.

## 3. Architecture

A pure renderer + a thin server seam — mirrors the Chunk-1 style (pure core, thin Fastify wrapper).

- **`tower/core/render.ts`** — `export function renderRun(record: RunRecord | null): string`.
  Pure: returns a full HTML document string, no filesystem, no Fastify. All dynamic text is
  HTML-escaped (cause/suggestedFix are grader-authored strings).
- **`tower/core/server.ts`** — add `GET /` that:
  1. reads runs via the existing tolerant `readRuns(resultsFile)`,
  2. takes `records.at(-1) ?? null` (latest run; tolerant reader already skips bad lines),
  3. returns `renderRun(latest)` as `text/html`.
- **Results path injection:** `buildServer` gains a `resultsFile` dep (so a test can point at a
  fixture file). `serve.ts` passes the same `tower/results/runs.jsonl` it already writes; the dep
  defaults to that path so existing callers/tests are unaffected.

No new dependencies. Inline `<style>` in the rendered document (no asset pipeline).

## 4. What renders

**Run header**
- `{towerId} · {toolId}` (e.g. `Tower 1 · feather`).
- `runId` and `startedAt` in small secondary text.
- A `stopped at: {stoppedAtLevel}` badge when `stoppedAtLevel` is non-null.

**One card per level, in `record.levels` order**, in a responsive grid (wraps; collapses to 1-up
on narrow viewports). Each card:
- **Outcome chip**, color-coded — all four styled now:
  `WIN` green · `PARTIAL` amber · `FAIL` red · `UNTESTABLE` grey.
- Level id + the native verdict (`ok`/`gated`/`blocked`/`error`) in small text.
- **Timing:** per-part (`drive 412ms · grade 88ms`) plus `total {totalMs}ms`.
- **cause / suggestedFix block** — rendered only when present. WIN cards (cause/fix null) omit it.
- **AI paragraph slot** — a visually distinct, clearly-labeled placeholder
  (`AI summary — wired in Chunk 4`). Present on **every** card including WIN
  (Roi's rule: AI explains every level regardless of outcome, and never scores).

**Empty state** (record is null / no runs): a friendly panel —
`No runs recorded yet — run \`npm run tower:serve\`.`

## 5. Styling

- "Clean product cards" direction (Roi's pick): spacious cards, modern system sans-serif stack,
  soft palette, rounded corners, generous spacing. Not a terminal/scoreboard look.
- Inline `<style>` block; outcome colors as the only semantic accents.
- Mobile-friendly via a simple responsive grid (`grid` + `auto-fit`/`minmax`), no JS.

## 6. Testing (TDD, matches Chunk-1 discipline)

`render.test.ts` (pure, no server):
- empty state renders the "no runs" panel.
- a WIN level card **omits** the cause/fix block.
- a FAIL level card **shows** both cause and suggestedFix.
- all four outcome chips render with their distinct labels/classes.
- HTML-escaping: a `cause` containing `<script>` is escaped, not emitted raw.

`server.test.ts` (extend existing):
- `GET /` with a fixture results file returns `200` + `content-type: text/html` and contains the
  stub run's tool id and a level id.
- `GET /` with a missing/empty results file returns `200` + the empty-state text (tolerant path).

## 7. Decisions (locked in brainstorm)

- **Cards in run order, responsive grid** — not the literal 2-up mockup; 5-level towers later
  still read top-to-bottom.
- **All four outcome colors styled now** — cheap, makes this the real Chunk-4 shell.
- **Latest run only** — `records.at(-1)`; no history UI in this slice.
- **AI slot on every card incl. WIN** — preserves "AI explains, never scores, every level."

## 8. Risks / guards

- Keep `behavioral.ts` / `classify.ts` untouched (legacy detector discipline).
- Don't change the verdict→outcome map or the PARTIAL invariant — this slice only *renders* what
  the record already carries.
- Grader-authored strings (`cause`, `suggestedFix`) are escaped before emission.
- The `resultsFile` dep keeps `GET /` testable against a fixture and off the real run log.
</content>
</invoke>
