## Active — S2 core implemented (3 of 4 items); pick next track

Plan: `docs/plans/2026-06-03-s2-tab-layer-observability.md`. Shipped on `dev` @ `ea4e30d`,
137 unit + 33 integration passing. Resume: choose the next track (recommend S3 brainstorm).

## Next track (pick one)

- [ ] **S3 — Currency & security (brainstorm + plan).** Fastify v4→v5 (MUST test `fastify-sse-v2`
  compat first — `TAB_UPDATED` rides SSE now); Playwright bump; security checkpoint.
- [ ] **Deferred observability sprint — trace + `DebugCapture` wiring.** Dead code today
  (`src/debug/capture.ts` never instantiated; `debug.trace` never read). Wire `start()` after
  `setContext`, `finalize()` before `context.close()`, read the flag in `launch()`; then the
  trace e2e test the S2 spec originally wanted.
- [ ] **`FEATHER_CHROMIUM_PATH`** — gated on `sudo dnf install chromium` (Fedora `updates` repo) +
  probe; then env var in `config.ts` + `executablePath` in `modes.ts`. Theme: weight.
- [ ] **Graduate `rnd` planning changes (ADR-0006 + ROADMAP Phase-5 edit) → `dev`.** Parked.

## Exit

- [ ] After S2 program fully closes → hand off to ROADMAP Phase 4 Step 0.

## Parked (Phase 5+)

- Agent perception layer (Actionable Tree / a11y-tree / ID mapping) →
  `research/2026-06-03-phase-5-agent-perception-layer-notes.md`. Revisit at Phase 5 Step 0.

## Done

### S2 core implementation ✅ (2026-06-03, s2-implementation)
- [x] Reviewed + approved S2 design spec; wrote implementation plan (writing-plans)
- [x] Found `DebugCapture` dead code → cut trace from S2, deferred wiring (stabilization discipline)
- [x] Item 1 — idempotent `addPage` keyed on `Page` (dup-reg bug killed) (`4fdf9cc`)
- [x] Item 3a — `getPageInfoList` per-page resilience (`42c73c3`)
- [x] Item 2 — `TAB_UPDATED` settled-only: catalog+SSE (`ef87440`), emission (`6f35876`), e2e (`ea4e30d`)
- [x] 137 unit + 33 integration green; pushed `origin/dev`; blog/0004

### Earlier (see archive/tasks-20260603-2025.md and prior)
- [x] S2 brainstorm + design (s2-tab-design) · Repo cleanup detour · S2 brainstorm start
- [x] Task 6b (blog/0002 + /blog-entry skill) · S1 Foundation · Pre-S1
