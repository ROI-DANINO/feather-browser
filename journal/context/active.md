## Active — S2 brainstorm complete; spec written, review gate open

**Brainstorm done.** S2 design spec written + approved in-session:
`docs/specs/2026-06-03-s2-tab-layer-observability-design.md`.

**Resume here:** Roi reviews the S2 spec → on approval, invoke `superpowers:writing-plans` →
produce S2 implementation plan → execute (TDD). The spec review gate is still open (Roi hadn't given
change/approve feedback on the written file when `/stop` was called).

**S2 implementation plan scope = 3 unblocked items:**
- [ ] **Item 1 — Dup-registration fix (prerequisite).** Idempotent `addPage` keyed on the `Page`
  object (reverse map `Page → pageId`); `openTab()` stops assigning its own id; `setContext`/
  `removePage` route through it. Kills the two-IDs bug + the listener-vs-`openTab` race.
  Keep `TAB_OPENED` (intent) and `TAB_CREATED` (lifecycle) distinct.
- [ ] **Item 2 — TAB_UPDATED (settled-only).** Add `TAB_UPDATED: "tab.updated"` to EVENTS +
  `"tab.updated"` to SSE `LIFECYCLE_EVENTS`. Main-frame `framenavigated` +
  `waitForLoadState("domcontentloaded")` + supersede guard. Covers SPA `pushState`.
  Payload `{ pageId, url, title, loadState }`.
- [ ] **Item 3 — Observability hardening.** `getPageInfoList()` per-page try/catch (best-effort
  `loadState: "unknown"`); trace e2e integration test (`debug.trace:true` → `trace.zip` non-empty).

**Deferred (follow-on, NOT in this plan):**
- [ ] **`FEATHER_CHROMIUM_PATH`** — gated on `sudo dnf install chromium` (Fedora `updates` repo) +
  probe. Then `config.ts` env var + `executablePath` in `modes.ts`. Different theme (weight).

**S3 — Currency & security (brainstorm after S2):**
- [ ] Fastify v4→v5 (MUST test fastify-sse-v2 compat first); Playwright bump; security checkpoint.

**Exit:** hand off to ROADMAP Phase 4 Step 0.

## Parked (Phase 5+)

- **Agent perception layer** — Actionable Tree / accessibility-tree extraction / numeric ID mapping
  (`click(ID)`/`type(ID)`). Concept captured in
  `research/2026-06-03-phase-5-agent-perception-layer-notes.md`. Revisit at Phase 5 Step 0; validate
  against Playwright MCP's a11y-snapshot model first. ADR-0005 governs (tool choice after
  2026-07-28).

## Done

### S2 brainstorm + design ✅ (2026-06-03, s2-tab-design)
- [x] Parked Phase-5 agent-perception concept to `research/`
- [x] Resolved TAB_UPDATED scope: settled-only
- [x] Scope call: defer FEATHER_CHROMIUM_PATH; ship 3 items
- [x] Wrote + self-reviewed S2 design spec (approved); spec review gate open

### Repo cleanup detour ✅ (2026-06-03, repo-cleanup-journal)
- [x] `journal/` consolidation; Apache-2.0 LICENSE; tracked cmd/skill/doc defs; blog/0003

### S2 brainstorm start ✅ (2026-06-03)
- [x] Health check 129+32; triaged GPT audit; found dup-tab-reg bug; scope 3→4

### Task 6b ✅ — blog/0002 + `/blog-entry` skill
### S1 — Foundation ✅ COMPLETE — docs reconciliation, ADR-0004/0005, spikes
### Pre-S1 ✅ — merge dev→master, program spec, S1 plan, codebase audit
