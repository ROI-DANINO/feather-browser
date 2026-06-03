---
phase: stabilization-linux-readiness
sub_phase: S2-core-implemented
plan: docs/plans/2026-06-03-s2-tab-layer-observability.md
spec: docs/specs/2026-06-03-s2-tab-layer-observability-design.md
step: "pick-next-track: S3 brainstorm | deferred-observability | graduate-rnd"
prior_phase: phase-3-complete
sessions: ["1A-reconcile✅", "1B-decisions✅", "1C-spikes✅", "task-6b-blog+skill✅", "s2-brainstorm-start-partial", "repo-cleanup-journal✅(detour)", "s2-tab-design✅", "s2-implementation✅"]
blocking: null
next: "Pick next track — recommend S3 (currency/security) brainstorm. Alternatives: deferred observability/DebugCapture wiring, FEATHER_CHROMIUM_PATH spike, or graduate rnd/ADR-0006 to dev. After S2 program closes → ROADMAP Phase 4 Step 0."
note: "S2 CORE COMPLETE (3 of 4 items) on dev @ ea4e30d. Shipped: idempotent page registration (dup-reg bug killed), TAB_UPDATED settled-only (catalog+SSE+emission+e2e test), getPageInfoList resilience. 137 unit + 33 integration green, typecheck clean, pushed origin/dev. CUT from S2: trace e2e + DebugCapture wiring — found DebugCapture is dead code (never instantiated, debug.trace never read); deferred to observability sprint (stabilization discipline). FEATHER_CHROMIUM_PATH still spike-gated. blog/0004 published. master untouched."
---
