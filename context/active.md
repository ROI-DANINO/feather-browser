---
updated: 2026-05-31
session: phase-2-headless-core-prototype-planning
---

## Active plan
Plan: Phase 2 - Headless Core Prototype
Step: Step 0 - Research and plan the Phase 2 prototype
Why: The restarted Phase 1 decision is complete. ADR-0002 selects a Playwright-managed Chromium headless core with persistent isolated profiles and a Feather-owned local control service.

## Key decisions
- Work uses a phase-gated roadmap.
- Only the current phase gets detailed tasks.
- Phase 0 is workspace setup, including `/start` and `/stop` session tracking.
- Fresh goal sessions should run `/init` after project orientation and before research.
- Phase 0 remains accepted and complete.
- The previous Phase 1 architecture decision is superseded.
- Phase 1 is restarted around a headless-first browser core.
- The browser should eventually have a visual GUI for personal use, but GUI work is future scope.
- Chrome extensions are no longer the core strategy; critical capabilities should be native or integrated through Feather-owned interfaces.
- Mature open-source tools are preferred when they beat rebuilding from scratch.
- ADR-0002 selects Playwright-managed Chromium as the Phase 2 foundation.
- Feather should own the local control API, profile/session/proxy policy, structured logs, replay/debug metadata, and adapter boundaries.
- New headless Chromium is the default high-fidelity mode; Chromium headless shell is an optional lower-resource mode for suitable extraction jobs.
- Raw CDP is an internal escape hatch, not the public Phase 2 API.

## Voice snapshot
"the way i like to workon stuf is reaserch plan build iterate."
"only the first phase gets tasks, when phase 1 is done, we plan phase 2."
"phase 0 is workspace setup with dir structior and and /start /stop commends to track sessions"
"i would want ui for this browser but it will be smarter to start headless"
"i want it to be a real lightweght broweser for me and for my agents to use seamlessly with internal apis"

## Next action
Start Phase 2 Step 0: research and plan the smallest prototype that proves launch/control, persistent and disposable profile isolation, per-session proxy launch, local API shape, debug metadata, and resource measurements.

## Latest handoff
No new `/stop` handoff was written for the Phase 1 completion. The latest historical handoff remains `ops/sessions/phase-1-headless-core-restart-20260531.md`; current state is in ADR-0002, `PROGRESS.md`, and `ops/tasks.md`.

## Available tools
Skills: superpowers:brainstorming, superpowers:writing-plans, superpowers:verification-before-completion
MCPs:
