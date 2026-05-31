# Progress

## Current Phase

Phase 2: Headless Core Prototype

## Current State

Phase 0 workspace setup remains valid and complete. The restarted Phase 1 architecture decision is complete.

The current architecture decision selects a Playwright-managed Chromium headless core with persistent isolated profiles, wrapped by a Feather-owned local control service. Phase 2 is active and should start with Step 0: research and plan the smallest headless core prototype.

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
- ADR-0002 selects Playwright-managed Chromium as the Phase 2 foundation, with new headless Chromium as the default high-fidelity mode and Chromium headless shell as an optional lower-resource mode for suitable jobs.
- Feather will own the local control API, profile/session/proxy policy, locks, logs, replay/debug metadata, and native/integrated feature adapters.
- Raw CDP is an internal escape hatch for targeted gaps, not the public API surface for Phase 2.
- Tauri/WebView, CEF, Qt WebEngine, and a Chromium fork remain future or fallback options, not the Phase 2 foundation.
- Mature tools such as `yt-dlp` should be integrated behind adapter boundaries, starting with subprocess control rather than embedding.

## Open Questions

- What exact transport should the local control API use first: localhost HTTP, Unix socket, stdio JSON-RPC, or a shared command layer with multiple transports?
- What is the measured RAM/CPU difference between new headless Chromium and Chromium headless shell for Feather's target tasks?
- What debug bundle is sufficient for replaying and diagnosing failed agent sessions?
- Which `yt-dlp` integration details belong in the first prototype versus a later native/integration layer phase?

## Next Action

Start Phase 2 Step 0: research and plan the smallest headless core prototype around ADR-0002.
