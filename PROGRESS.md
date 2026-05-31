# Progress

## Current Phase

Phase 1: Headless Core Architecture Decision

## Current State

The project direction has been reset. Phase 0 workspace setup remains valid and complete. The previous Phase 1 architecture decision is now superseded because it optimized for a visible Playwright-managed Chromium shell and extension compatibility.

The active direction is headless-first: research and choose a lightweight Chromium-compatible core/control foundation for agentic automation, internal APIs, profile/session isolation, proxy/network configuration, scraping reliability, and later GUI wrapping.

## Decisions

- Work proceeds phase by phase.
- Only the active phase gets detailed tasks.
- Later phases stay as roadmap milestones until the previous phase is complete.
- `/start` and `/stop` are part of the project workflow.
- Fresh goal sessions should run `/init` after understanding the project and before research.
- Phase 1 started with Step 0: research and plan the phase.
- Phase 1 is restarted around a headless-first browser core.
- The browser should eventually have a visual GUI for personal use, but GUI design and scaffolding are out of scope for the active headless-core architecture phase.
- Chrome extensions are no longer the core product strategy.
- Critical capabilities should be built as native or integrated project features behind clean internal interfaces.
- Mature open-source tools should be used where they are better than reinventing the wheel.
- Resource efficiency, modularity, scraping reliability, profile/session isolation, and agent-friendly internal APIs are priority constraints.

## Open Questions

- Which foundation best fits the headless-first core: Playwright-managed Chromium, Tauri/WebView, CEF, Qt WebEngine, Chromium distribution/fork path, or custom Rust/C++ bindings?
- What should the minimal internal automation API expose first?
- What is the minimum safe profile/session/proxy isolation model?
- Which features should be native code, and which should wrap mature open-source tools?

## Next Action

Restart Phase 1 with Step 0: research and plan the headless-core architecture decision.
