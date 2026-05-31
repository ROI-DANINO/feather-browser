# Progress

## Current Phase

Phase 2: Headless Core Prototype

## Current State

Phase 0 workspace setup remains valid and complete. The restarted Phase 1 architecture decision is complete. Phase 2 Step 0 research and planning is complete.

The current architecture decision selects a Playwright-managed Chromium headless core with persistent isolated profiles, wrapped by a Feather-owned local control service. Phase 2 is active and should proceed from `docs/specs/phase-2-headless-core-prototype-plan.md` into an implementation plan before any code is written.

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
- Phase 2 Step 0 selects localhost HTTP JSON as the first local API transport, bound to `127.0.0.1` with token protection, while keeping command handlers transport-independent for later stdio JSON-RPC or Unix socket support.
- Phase 2 should default to new headless Chromium with `channel: "chromium"` and compare it against Chromium headless shell through a measurement scenario.
- The smallest Phase 2 prototype includes persistent workspace sessions, disposable temporary sessions, profile locks, per-session proxy launch configuration, structured JSONL logs, debug bundles, resource measurements, and the launch/status/navigate/snapshot/extract/screenshot/debug-bundle/close API flow.
- Real `yt-dlp` execution is deferred beyond the smallest Phase 2 prototype; Phase 2 keeps only the documented adapter boundary.

## Open Questions

- What exact RAM/CPU difference will the resource measurement scenario show between new headless Chromium and Chromium headless shell?
- Which debug bundle fields will prove most useful once real failures are captured?
- After the core prototype passes, should the next phase add the `yt-dlp` subprocess adapter or first harden profile/proxy/session reliability?

## Next Action

Write the Phase 2 implementation plan from `docs/specs/phase-2-headless-core-prototype-plan.md`; do not start implementation until that plan exists.
