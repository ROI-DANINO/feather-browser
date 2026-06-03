## Active — S2 design complete; spec review gate open

Spec: `docs/specs/2026-06-03-s2-tab-layer-observability-design.md` (approved in-session).
Resume: Roi reviews spec → on approval, `superpowers:writing-plans` → S2 implementation plan → TDD.

**S2 implementation plan scope = 3 unblocked items:**

- [ ] **Item 1 — Dup-registration fix (prerequisite)**
  - Idempotent `addPage` keyed on `Page` object (reverse map `Page → pageId`)
  - `openTab()` stops assigning its own id; `setContext`/`removePage` route through it
  - Keep `TAB_OPENED` (intent) + `TAB_CREATED` (lifecycle) distinct
- [ ] **Item 2 — TAB_UPDATED (settled-only)**
  - Add `TAB_UPDATED: "tab.updated"` to EVENTS + `"tab.updated"` to SSE `LIFECYCLE_EVENTS`
  - Main-frame `framenavigated` + `waitForLoadState("domcontentloaded")` + supersede guard
  - Covers SPA `pushState`; payload `{ pageId, url, title, loadState }`
- [ ] **Item 3 — Observability hardening**
  - `getPageInfoList()` per-page try/catch → best-effort `loadState: "unknown"`
  - Trace e2e integration test: `debug.trace:true` → `trace.zip` exists + non-empty

**After plan written:**
- [ ] Execute S2 implementation plan (TDD)

## Deferred (follow-on — NOT in S2 plan)

- [ ] **`FEATHER_CHROMIUM_PATH`** — gated on `sudo dnf install chromium` (Fedora `updates` repo) +
  probe; then env var in `config.ts` + `executablePath` in `modes.ts`. Different theme (weight).

## S3 — Currency & security (brainstorm after S2)

- [ ] Fastify v4→v5 (MUST test fastify-sse-v2 compat first); Playwright bump; security checkpoint

## Exit

- [ ] Hand off to ROADMAP Phase 4 Step 0

## Parked (Phase 5+)

- Agent perception layer (Actionable Tree / a11y-tree / ID mapping) →
  `research/2026-06-03-phase-5-agent-perception-layer-notes.md`. Revisit at Phase 5 Step 0.

## Done

### S2 brainstorm + design ✅ (2026-06-03, s2-tab-design)
- [x] Parked Phase-5 agent-perception concept to `research/`
- [x] Resolved TAB_UPDATED scope: settled-only
- [x] Scope call: defer FEATHER_CHROMIUM_PATH; ship 3 items
- [x] Wrote + self-reviewed S2 design spec (approved); review gate open

### Earlier (see archive/tasks-20260603-0833.md)
- [x] Repo cleanup detour (journal/, Apache-2.0, blog/0003)
- [x] S2 brainstorm start (found dup-tab-reg bug, scope 3→4)
- [x] Task 6b (blog/0002 + /blog-entry skill)
- [x] S1 Foundation (docs reconciliation, ADR-0004/0005, spikes)
- [x] Pre-S1 (merge dev→master, program spec, S1 plan, audit)
