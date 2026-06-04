## Active — Stabilization program closed; next is ROADMAP Phase 4 Step 0

S1 ✅ S2 ✅ S3 ✅. The Stabilization & Linux-Readiness program is functionally closed on `dev`
(`origin/dev` @ `ea0b34a`, `master` untouched). 137 unit + 33 integration green under Fastify
5.8.5 + Playwright 1.60.0. Resume: brainstorm + plan **ROADMAP Phase 4 Step 0**.

## Quick housekeeping (do first, ~10 min)

- [ ] **Reconcile stale user-facing docs.** `README.md` + `PROGRESS.md` still say "Phase 3 / S1 in
  progress / 129+32." Update to: stabilization program closed (S1+S2+S3), 137 unit + 33
  integration, Fastify 5.8.5 + Playwright 1.60.
- [ ] **Push the `/stop` handoff commit** if `dev` is ahead of `origin/dev` (policy: `dev` only).

## Next track (pick one — recommend Phase 4 Step 0)

- [ ] **ROADMAP Phase 4 Step 0 — Visual Desktop Shell (brainstorm + plan).** Candidates:
  Tauri/WebKitGTK vs GTK4-native, both with Playwright-managed Chromium. Wayland browser-surface
  embedding is unresolved and must be prototyped. Host-primary runtime (ADR-0004); Electron
  eliminated. Begins with the brainstorming skill.
- [ ] **Deferred — `FEATHER_CHROMIUM_PATH` (weight).** Spike-gated: `sudo dnf install chromium`
  (Fedora `updates` repo, NOT RPM Fusion) + launch probe → then env var in `config.ts` +
  `executablePath` in `modes.ts`. **Roi runs the sudo step** (stop-for-sudo).
- [ ] **Deferred — observability sprint.** `DebugCapture` (`src/debug/capture.ts`) is dead code:
  never instantiated, `debug.trace` never read. Wire `start()` after `setContext`, `finalize()`
  before `context.close()`, read the flag in `launch()`; then the trace e2e test.
- [ ] **Graduate `rnd`** (ADR-0006 + ROADMAP Phase-5 edit) → `dev`. Still parked.

## Exit

- [x] S2 program closed → ~~hand off to Phase 4 Step 0~~ (S3 also done; whole stabilization
  program closed). **Phase 4 Step 0 is now the live milestone.**

## Parked (Phase 5+)

- Agent perception layer (Actionable Tree / a11y-tree / ID mapping) →
  `research/2026-06-03-phase-5-agent-perception-layer-notes.md`. Revisit at Phase 5 Step 0.

## Done

### S3 — Currency & Security ✅ (2026-06-03, s3-currency-security)
- [x] Brainstormed + design spec (`fcfd2f6`); implementation plan (`15dedd0`)
- [x] Step 0 probe PASS (Fastify v5 + fastify-sse-v2, throwaway branch) → clean-bump path
- [x] Fastify v4→v5 — zero source changes (`2fb271e`)
- [x] Playwright ^1.50→^1.60, Chromium 148 unchanged (`f6daea2`)
- [x] Security checkpoint — audit triage (dev-only, no forced vitest@4) + API review (`ea0b34a`)
- [x] Reviewed diff, pushed `origin/dev`; blog/0005; stop-for-sudo memory

### Earlier (see archive/tasks-20260603-2025.md and prior)
- [x] S2 core (s2-implementation) · S2 design · repo cleanup · Task 6b · S1 Foundation · Pre-S1
