# Progress

## Current Phase

Phase 2 complete. Phase 3 not yet started.

## Current State

Phase 2 Headless Core Prototype is complete as of 2026-05-31. All 9 exit criteria met. 129 tests passing (98 unit, 27 integration, 4 measurement). Ready to plan Phase 3.

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
- Phase 2 defaults to new headless Chromium with `channel: "chromium"` and compares it against Chromium headless shell through a measurement scenario.
- The smallest Phase 2 prototype includes persistent workspace sessions, disposable temporary sessions, profile locks, per-session proxy launch configuration, structured JSONL logs, debug bundles, resource measurements, and the launch/status/navigate/snapshot/extract/screenshot/debug-bundle/close API flow.
- Real `yt-dlp` execution is deferred beyond the smallest Phase 2 prototype; Phase 2 keeps only the documented adapter boundary.
- Phase 2 is implemented as a Node/TypeScript service using Fastify for HTTP and Playwright for browser control.
- SessionManager manages both workspace (persistent) and disposable session types with distinct lifecycle rules.
- ProfileLock uses file-based locking to enforce single-session-per-profile constraints.
- Credential redaction (redactProxy/redactUrl) is applied at the log emission layer to prevent secrets from appearing in JSONL logs or API responses.
- DebugCapture and DebugBundle collect console logs, network events, and screenshots for post-hoc failure analysis.
- ProcessSampler and MeasurementRunner drive resource measurement scenarios and write artifacts alongside test output.

## Open Questions

These were unresolved at Phase 2 close and should inform Phase 3 planning:

- What exact RAM/CPU difference does the resource measurement scenario show between new headless Chromium and Chromium headless shell?
- Which debug bundle fields prove most useful once real failures are captured in production-like runs?
- Should Phase 3 add the `yt-dlp` subprocess adapter first, or harden profile/proxy/session reliability first?

## Next Action

Plan Phase 3: run `/init` and decide scope (yt-dlp adapter vs profile/proxy hardening vs GUI scaffolding).
