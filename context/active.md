---
updated: 2026-05-31
session: phase-1-headless-core-restart
---

## Active plan
Plan: Phase 1 Restart — Headless Core Architecture Decision
Step: Step 0 — Research and plan Phase 1 restart
Why: The project direction changed from visible-shell-first and extension-compatible to headless-core-first, native/integrated-feature-first, and GUI-later.

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

## Voice snapshot
"the way i like to workon stuf is reaserch plan build iterate."
"only the first phase gets tasks, when phase 1 is done, we plan phase 2."
"phase 0 is workspace setup with dir structior and and /start /stop commends to track sessions"
"i would want ui for this browser but it will be smarter to start headless"
"i want it to be a real lightweght broweser for me and for my agents to use seamlessly with internal apis"

## Next action
Start Phase 1 restart Step 0: research and plan the headless-core architecture decision. Keep active tasks detailed in `ops/tasks.md`; keep later phases high-level in `ROADMAP.md`.

## Latest handoff
See `ops/sessions/phase-1-headless-core-restart-20260531.md`.

## Available tools
Skills: superpowers:brainstorming, superpowers:writing-plans, superpowers:verification-before-completion
MCPs:
