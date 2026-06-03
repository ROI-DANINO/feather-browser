## Active — S3 shipped; Stabilization program closed; next is ROADMAP Phase 4 Step 0

**S3 — Currency & Security shipped on `dev`** (pushed `origin/dev` @ `ea0b34a`; `master` untouched).
137 unit + 33 integration passing, typecheck clean, under **Fastify 5.8.5 + Playwright 1.60.0**.

> **Sync (2026-06-03 23:36):** consolidation commit `a73ce95` (canonical-state reconcile) pushed to
> `origin/dev`. Local `dev` is **0 ahead / 0 behind**. Clean baseline to start Phase 4 Step 0.

The **Stabilization & Linux-Readiness program is functionally closed** — S1 ✅ S2 ✅ S3 ✅. Two
sprints remain *explicitly deferred* (not blockers): `FEATHER_CHROMIUM_PATH` (weight) and
`DebugCapture`/trace (observability).

What landed this session (3 commits + spec + plan, all on `dev`):
- ✅ **Fastify v4→v5** (`2fb271e`) — **zero source changes**. Every v5 breaking change was N/A
  (Zod validation not Fastify schemas; object-form `listen()`; no `connection`/`hostname`/
  `getDefaultRoute`; DELETE callers send non-empty bodies). Probe-proven `fastify-sse-v2` compat.
- ✅ **Playwright `^1.50→^1.60`** (`f6daea2`) — latest stable; bundled Chromium **148 unchanged**,
  so measurement docs + system-Chromium spike stay valid (no re-run).
- ✅ **Security checkpoint** (`ea0b34a`) — audit triage (5 dev-only Vitest vulns, accepted risk,
  no forced `vitest@4`) + API surface review (all intact). Findings:
  `docs/specs/2026-06-03-s3-security-checkpoint-findings.md`.

Spec: `docs/specs/2026-06-03-s3-currency-security-design.md`. Plan:
`docs/plans/2026-06-03-s3-currency-security.md`. Blog: `blog/0005`.

## Next track (recommend the first)

- [ ] **ROADMAP Phase 4 Step 0** — research + plan the Visual Desktop Shell (Tauri/WebKitGTK vs
  GTK4-native; Wayland browser-surface embedding unresolved — must prototype). This is the next
  milestone now that stabilization is closed. Begins with brainstorm.
- [ ] **Deferred — `FEATHER_CHROMIUM_PATH`** (weight): spike-gated on `sudo dnf install chromium`
  (Fedora `updates` repo) + launch probe, then env var in `config.ts` + `executablePath` in
  `modes.ts`. **Roi runs the sudo step.**
- [ ] **Deferred — observability sprint**: wire `DebugCapture` (`src/debug/capture.ts` is dead
  code — never instantiated, `debug.trace` never read). `start()` after `setContext`, `finalize()`
  before `context.close()`, read the flag in `launch()`; then the trace e2e test.
- [ ] **Graduate `rnd`** (ADR-0006 + ROADMAP Phase-5 edit) → `dev`. Still parked.

## Flags

- **STALE user-facing docs (do early next session):** `README.md` and `PROGRESS.md` still say
  "Phase 3 Complete / S1 in progress / 129 unit + 32 integration." Reality: S1+S2+S3 done,
  stabilization program closed, **137 unit + 33 integration**, Fastify 5.8.5 + Playwright 1.60.
  They sit outside the `/stop` journal scope, so they weren't updated. Quick docs-reconciliation.
- **Possibly-unpushed tracking commit:** the `/stop` handoff commit may be local-only — check
  `git status -sb`; if `dev` is ahead of `origin/dev`, push it (policy: `dev` only).
- `FEATHER_HOST` can override bind to `0.0.0.0` — safe default `127.0.0.1`; add a guardrail/warning
  if Feather is ever packaged. (Findings doc.)
- Vitest-toolchain vulns will reappear in any `npm audit`; deferral of `vitest@4` is recorded —
  don't re-triage from scratch.

## Parked (Phase 5+)

- **Agent perception layer** — Actionable Tree / a11y-tree / numeric ID mapping.
  `research/2026-06-03-phase-5-agent-perception-layer-notes.md`. Revisit at Phase 5 Step 0;
  validate against Playwright MCP's a11y-snapshot model first. ADR-0005 governs.

## Done

### S3 — Currency & Security ✅ (2026-06-03, s3-currency-security)
- [x] Brainstormed + spec (`fcfd2f6`); plan (`15dedd0`)
- [x] Step 0 probe PASS (throwaway branch) → clean-bump path
- [x] Fastify v5 (zero code), Playwright 1.60, security checkpoint → 137+33 green, pushed `dev`
- [x] blog/0005; stop-for-sudo memory saved

### Earlier (see ops/sessions/ and archive/)
- [x] S2 core (s2-implementation) · S2 design · repo cleanup · Task 6b · S1 Foundation · Pre-S1
