# Progress

## Current Phase

Phase 2: Minimal Browser Shell

## Current State

Phase 1 research is complete. The selected Phase 2 foundation is a Playwright-managed persistent Chromium profile with a custom local shell/control UI. The next phase should begin with Step 0: research and plan the minimal browser shell/control plane.

## Decisions

- Work proceeds phase by phase.
- Only the active phase gets detailed tasks.
- Later phases stay as roadmap milestones until the previous phase is complete.
- `/start` and `/stop` are part of the project workflow.
- Fresh goal sessions should run `/init` after understanding the project and before research.
- Phase 1 started with Step 0: research and plan the phase.
- Phase 2 is now active and starts with Step 0: research and plan the minimal browser shell/control plane.
- Phase 2 should be agentic-AI-first, but not agent-only: the prototype should use a human-visible Chromium workspace.
- Electron is not the browser core because arbitrary Chrome extension compatibility is an explicit Electron non-goal.
- A full Chromium fork is deferred because the release/security/update burden is too high for the first build phase.
- CEF and Qt WebEngine remain later candidates if Feather needs deeper browser chrome ownership.

## Open Questions

- What exact Phase 2 shape should the control UI take: CLI first, small desktop UI, or local web dashboard?
- Which Chromium channel should Phase 2 launch by default: Playwright bundled Chromium, system Chrome/Chromium, or configurable?
- What is the minimum safe permission model for local agent control?

## Next Action

Start Phase 2 with Step 0: research and plan the minimal browser shell/control plane.
