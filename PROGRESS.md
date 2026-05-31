# Progress

## Current Phase

Phase 2 complete. Phase 3 not yet started.

## Current State

Phase 2 Headless Core Prototype is complete as of 2026-05-31. All 9 exit criteria met. 129 tests passing (98 unit, 27 integration, 4 measurement). Ready to plan Phase 3.

## Architecture Decisions

- Playwright-managed Chromium is the Phase 2 foundation. New headless Chromium is the default high-fidelity mode; Chromium headless shell is an optional lower-resource mode.
- Chrome extensions are not the core product strategy. Critical capabilities are native or integrated project features behind clean internal interfaces.
- Localhost HTTP JSON is the Phase 2 transport, bound to `127.0.0.1` with token protection. Command handlers are transport-independent for later stdio JSON-RPC or Unix socket support.
- Raw CDP is an internal escape hatch for targeted gaps, not the public API surface.
- `yt-dlp` and similar tools are integrated behind adapter boundaries via subprocess control. Real execution is deferred to Phase 3.
- Tauri/WebView, CEF, Qt WebEngine, and a Chromium fork remain future or fallback options.
- Credential redaction (`redactProxy`/`redactUrl`) is applied at the log emission layer to prevent secrets from appearing in JSONL logs or API responses.
- ProfileLock uses file-based locking to enforce single-session-per-profile constraints.

## Open Questions

These were unresolved at Phase 2 close and should inform Phase 3 planning:

- What exact RAM/CPU difference does the resource measurement scenario show between new headless Chromium and Chromium headless shell?
- Which debug bundle fields prove most useful once real failures are captured in production-like runs?
- Should Phase 3 add the `yt-dlp` subprocess adapter first, or harden profile/proxy/session reliability first?

## Next

Plan Phase 3: decide scope (yt-dlp adapter vs profile/proxy hardening vs GUI scaffolding).
