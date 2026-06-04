## Decision Needed

**Health check before S2?**
- [ ] Decide: run `npm test && npm run test:integration` before S2 brainstorm?
  - No code changed since Phase 3 merge (all S1 + task 6b was docs/content)
  - Last known state: 129 unit + 32 integration passing
  - Low-cost to verify; Roi's call

## Active — S2 brainstorm (after health-check decision)

**S2 — Linux weight & observability:**
- [ ] Brainstorm + plan S2 tasks
  - FEATHER_CHROMIUM_PATH (prerequisite: `sudo dnf install chromium` via RPM Fusion, then run spike probe from S1 plan Task 11 Step 2)
  - TAB_UPDATED event (deferred from Phase 3)
  - Verify tracing exposure (`capture.ts`)

**S3 — Currency & security (brainstorm after S2, gated by spike):**
- [ ] Brainstorm + plan S3 tasks
  - Fastify v4→v5 (MUST test fastify-sse-v2 compat first — peer range covers v5 but untested)
  - Playwright 1.50 → latest 1.5x bump
  - Security checkpoint

**Exit:**
- [ ] Hand off to ROADMAP Phase 4 Step 0

## Done

### Task 6b ✅ (2026-06-03)
- [x] Write `blog/0002-write-it-down-or-it-didnt-happen.md` — S1 Foundation milestone entry
- [x] Write `skills/blog-entry/SKILL.md` — context-gathering recipe, voice guardrails, completeness checklist

### S1 — Foundation ✅ COMPLETE (2026-06-03)

**Session 1A — Reconcile reality (docs): ✅**
- [x] Task 1 — Fix README status
- [x] Task 2 — Fix PROGRESS.md
- [x] Task 3 — Update ops/phase.md
- [x] Task 4 — Update context/active.md
- [x] Task 5 — Reconcile ROADMAP.md
- [x] Task 6 — Polish AGENTS.md
- [x] Task 7 — Create docs/docs-map.md + link from command docs

**Session 1B — Lock decisions (ADRs): ✅**
- [x] Task 8 — ADR-0004 runtime target (host-primary, Flatpak, Podman optional)
- [x] Task 9 — ADR-0005 agentic North Star (token/context efficiency; tool choice deferred to Phase 5 Step 0)

**Session 1C — Answer unknowns (spikes): ✅**
- [x] Task 10 — Spike: fastify-sse-v2 v5 compat → PARTIAL/UNTESTED (peerDep >=4 but only tested v4)
- [x] Task 11 — Spike: system Chromium executablePath → NOT TESTED (not installed; install via RPM Fusion in S2)

### Pre-S1
- [x] Merge dev → master (Phase 3 baseline)
- [x] Brainstorm + write program spec
- [x] Write S1 plan (11 tasks, 3 sessions)
- [x] Codebase audit + correction of stale target list
