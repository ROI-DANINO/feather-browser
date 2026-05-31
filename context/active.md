---
updated: 2026-05-31
session: phase-2-headless-core-prototype-planning
---

## Active plan
Plan: Phase 2 - Headless Core Prototype
Step: Write implementation plan before code
Why: Phase 2 Step 0 is complete. The prototype boundary is defined in `docs/specs/phase-2-headless-core-prototype-plan.md`.

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
- Phase 2 Step 0 selected localhost HTTP JSON as the first local control transport, bound to `127.0.0.1` with token protection.
- The prototype defaults to new headless Chromium via Playwright `channel: "chromium"` and measures it against Chromium headless shell.
- The first API flow is launch, status, navigate, snapshot, extract, screenshot, debug bundle, and close.
- Persistent workspace sessions, disposable sessions, profile locks, session-scoped proxy launch config, structured JSONL logs, and per-session debug bundles are in Phase 2 scope.
- Real `yt-dlp` execution is deferred; the adapter boundary is documented for later.

## Voice snapshot
"the way i like to workon stuf is reaserch plan build iterate."
"only the first phase gets tasks, when phase 1 is done, we plan phase 2."
"phase 0 is workspace setup with dir structior and and /start /stop commends to track sessions"
"i would want ui for this browser but it will be smarter to start headless"
"i want it to be a real lightweght broweser for me and for my agents to use seamlessly with internal apis"

## Next action
Write the Phase 2 implementation plan from `docs/specs/phase-2-headless-core-prototype-plan.md`. Do not start code until that plan exists.

## Latest handoff
No new `/stop` handoff was written in this session. Current state is in ADR-0002, `research/2026-05-31-phase-2-headless-core-prototype-plan.md`, `docs/specs/phase-2-headless-core-prototype-plan.md`, `PROGRESS.md`, and `ops/tasks.md`.

## Available tools
Skills: superpowers:brainstorming, superpowers:writing-plans, superpowers:verification-before-completion
MCPs:
