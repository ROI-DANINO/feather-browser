## Active — S2 core implementation COMPLETE (3 of 4 items); pick next track

**S2 core shipped on `dev` (pushed `origin/dev` @ `ea4e30d`).** All three scoped items
implemented via TDD, 137 unit + 33 integration passing, typecheck clean:

- ✅ **Item 1 — Dup-registration fix.** Idempotent `addPage` keyed on the `Page` object
  (reverse map `Page → pageId`); `setContext`/`openTab` route through it; `removePage` clears
  both maps. Two-ids-per-tab bug killed. (`4fdf9cc`)
- ✅ **Item 2 — TAB_UPDATED (settled-only).** `EVENTS` + SSE `LIFECYCLE_EVENTS` entry;
  `framenavigated` main-frame handler with `waitForLoadState("domcontentloaded")` + supersede
  guard; payload `{ pageId, url, title, loadState }`; real-Chromium e2e test. (`ef87440`,
  `6f35876`, `ea4e30d`)
- ✅ **Item 3a — getPageInfoList resilience.** Per-page try/catch → best-effort
  `loadState:"unknown"`. (`42c73c3`)

Plan: `docs/plans/2026-06-03-s2-tab-layer-observability.md`.

**Resume here:** pick the next track. Recommended = brainstorm **S3** (program order). Options below.

## Next options

- [ ] **S3 — Currency & security (brainstorm).** Fastify v4→v5 (MUST test `fastify-sse-v2` compat
  first — `TAB_UPDATED` now rides SSE); Playwright bump; security checkpoint.
- [ ] **Deferred observability sprint — trace + `DebugCapture` wiring.** `DebugCapture`
  (`src/debug/capture.ts`) is dead code: never instantiated, `debug.trace` never read, `trace.zip`
  never produced. Wire `start()` after `setContext`, `finalize()` before `context.close()`, read
  the flag in `launch()`. Cut from S2 deliberately (stabilization discipline).
- [ ] **`FEATHER_CHROMIUM_PATH`** — spike-gated (`sudo dnf install chromium` + launch probe), then
  `config.ts` env var + `executablePath` in `modes.ts`. Different theme (weight).
- [ ] **Graduate `rnd` planning changes (ADR-0006 + ROADMAP Phase-5 edit) → `dev`.** Still parked.

**Exit:** after S2's program fully closes → hand off to ROADMAP Phase 4 Step 0.

## Parked (Phase 5+)

- **Agent perception layer** — Actionable Tree / accessibility-tree extraction / numeric ID
  mapping. Concept in `research/2026-06-03-phase-5-agent-perception-layer-notes.md`. Revisit at
  Phase 5 Step 0; validate against Playwright MCP's a11y-snapshot model first. ADR-0005 governs.

## Done

### S2 core implementation ✅ (2026-06-03, s2-implementation)
- [x] Reviewed + approved S2 design spec
- [x] Wrote S2 implementation plan (writing-plans)
- [x] Discovered `DebugCapture` is dead code; decided to cut trace from S2 + defer wiring
- [x] Implemented Items 1, 2, 3a via TDD (6 commits); 137 unit + 33 integration green; pushed
- [x] blog/0004 "The Feature That Was Never There"

### S2 brainstorm + design ✅ (2026-06-03, s2-tab-design)
- [x] Parked Phase-5 agent-perception concept to `research/`
- [x] Resolved TAB_UPDATED scope: settled-only; scope call: defer FEATHER_CHROMIUM_PATH
- [x] Wrote + approved S2 design spec

### Repo cleanup detour ✅ (2026-06-03) · S2 brainstorm start ✅ · Task 6b ✅ · S1 Foundation ✅ · Pre-S1 ✅
