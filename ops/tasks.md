## In Progress

Session 1B — Lock decisions (ADRs): write ADR-0004 + ADR-0005.

## Active — S1 (Foundation) execution

Plan: `docs/plans/2026-06-03-s1-foundation.md` · Spec: `docs/specs/2026-06-03-stabilization-linux-readiness-design.md`
No production code. Execute inline, session by session. **Do not run `/init`** (continuing the plan).

**Session 1A — Reconcile reality (docs): ✅ COMPLETE**
- [x] Task 1 — Fix README status (Phase 3 complete, program active)
- [x] Task 2 — Fix PROGRESS.md (Current Phase / State / Next)
- [x] Task 3 — Update ops/phase.md
- [x] Task 4 — Update context/active.md
- [x] Task 5 — Reconcile ROADMAP.md (fix "Electron first", mark Phase 3 complete, Linux-only/MCP date)
- [x] Task 6 — Polish AGENTS.md (current phase, tech-stack note, research/→raw/_inbox fix, command-usage section, decision pointers)
- [x] Task 7 — Create docs/docs-map.md + link from /init and /start command docs

**Session 1B — Lock decisions (ADRs):**
- [ ] Task 8 — ADR-0004 runtime target (host-primary, Flatpak, Podman optional)
- [ ] Task 9 — ADR-0005 agentic North Star (token/context efficiency; tool choice deferred to Phase 5 Step 0)

**Session 1C — Answer unknowns (spikes):**
- [ ] Task 10 — Spike: fastify-sse-v2 v5 compatibility (gates S3) → raw/_inbox/
- [ ] Task 11 — Spike: system Chromium as executablePath (informs S2) → raw/_inbox/

**S1 exit:** all docs true; ADR-0004 + ADR-0005 written; both spikes recorded; no src/ changes; then brainstorm S2.

## Queued — after S1 (brainstorm each when reached)

- [ ] S2 — Linux weight & observability: FEATHER_CHROMIUM_PATH, TAB_UPDATED, verify tracing exposure
- [ ] S3 — Currency & security: Fastify v4→v5, Playwright 1.50→1.5x bump, security checkpoint
- [ ] → Hand off to ROADMAP Phase 4 Step 0

## Done (this planning session)

- [x] Merge dev → master (Phase 3 baseline, commit b278409)
- [x] Brainstorm + write program spec (cafbca2)
- [x] Write S1 (Foundation) implementation plan (f509e01)
- [x] Codebase audit + correction of stale 7-target list (spec §2)
