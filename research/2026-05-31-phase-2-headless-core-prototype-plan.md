# Phase 2 Headless Core Prototype Research And Plan

Date: 2026-05-31

## Research Question

What is the smallest Phase 2 prototype that proves ADR-0002 without drifting into GUI work, Chrome extensions, Chromium source builds, or a broad integration layer?

ADR-0002 already selects a Playwright-managed Chromium headless core with persistent isolated profiles and a Feather-owned local control service. This Step 0 research narrows that decision into a concrete prototype boundary.

## Current Source Findings

### Playwright Persistent Contexts

Playwright's `browserType.launchPersistentContext(userDataDir, options)` remains the correct primitive for the prototype. It launches a browser using persistent storage in the supplied user data directory and returns the only browser context. The user data directory stores browser session data such as cookies and local storage. Passing an empty string creates a temporary directory. Playwright documents that browsers do not allow multiple launched instances to use the same user data directory.

Implication for Feather:
- Persistent workspaces should map to explicit Feather-owned profile directories.
- Disposable sessions can use Playwright's temporary user data directory behavior, but Feather should still wrap it in its own session metadata and cleanup policy.
- Feather must enforce profile locks before calling Playwright, rather than relying on Chromium failure modes as the user-facing lock mechanism.
- Feather must never point at a user's default Chrome profile.

Source:
- https://playwright.dev/docs/api/class-browsertype

### New Headless Chromium Versus Headless Shell

Playwright currently distinguishes its regular Chromium build from the separate `chromium-headless-shell`. Playwright uses the headless shell by default when running Chromium headlessly without a channel. The newer full Chromium headless mode can be selected with `channel: "chromium"`. Playwright docs describe the new headless path as closer to real browser behavior, while the shell can be a smaller/lower-resource install for jobs that do not need full behavior.

Chrome's own headless documentation says Chrome 112 unified headless and headful code paths, while the old headless implementation is now available as a standalone `chrome-headless-shell` binary from Chrome 132 onward.

Implication for Feather:
- Phase 2 should default to new headless Chromium with `channel: "chromium"` for fidelity.
- Phase 2 should include a measured comparison against headless shell, not an architectural assumption that one is always better.
- The runtime option should be explicit in API/config as `browserMode: "chromium-new-headless" | "chromium-headless-shell"`.

Sources:
- https://playwright.dev/docs/browsers
- https://developer.chrome.com/docs/chromium/headless

### Proxy And Launch Policy

Playwright exposes proxy configuration in browser/context launch options. For persistent contexts, this belongs in `launchPersistentContext(..., options)` so the proxy is bound to the browser session at launch. Because proxy credentials may be included, Feather must redact credentials in logs and status responses.

Implication for Feather:
- Proxy is session-scoped and immutable after launch in the Phase 2 prototype.
- Status should expose only a sanitized proxy summary: scheme, host, port, and whether credentials exist.
- The prototype should include a proxy launch test plan that can run with a local proxy fixture later, but Step 0 does not need to pick a production proxy provider.

Source:
- https://playwright.dev/docs/api/class-browsertype

### Debugging, Trace, And Event Capture

Playwright exposes context-level tracing, screenshots, page/context events, request/response events, console events, downloads, and storage snapshots. The tracing API can capture browser operations and network activity; with `screenshots` and `snapshots`, it can produce a `trace.zip` for trace viewer inspection. Browser context events cover close, console, download, frame navigation, request, request failed, request finished, response, service worker, and web error events.

Implication for Feather:
- The first debug bundle should be a directory, not a database.
- Each session should produce JSONL events plus selected artifacts.
- The minimum debug bundle is enough if it can answer: what launched, what URL was visited, what requests failed, what the final page looked like, what extraction returned, what error happened, and how to replay the high-level command sequence.

Sources:
- https://playwright.dev/docs/api/class-browsercontext
- https://playwright.dev/docs/api/class-tracing

### Snapshot And Extraction Surface

Playwright's newer user-facing snapshot tooling emphasizes accessibility/ARIA snapshots. Its locator and evaluation APIs also support DOM querying, text extraction, attributes, and constrained page evaluation. For Feather, the public API should not expose raw Playwright objects. The first `snapshot` should be a Feather-owned JSON shape containing URL, title, accessibility-oriented text, selected DOM summary, and optional limited HTML/text fields.

Implication for Feather:
- `page.snapshot` should be stable and agent-friendly, not a direct mirror of Playwright internals.
- `page.extract` should accept a constrained recipe format with selectors, attributes, text, and limits.
- Full arbitrary `page.evaluate` should remain an internal/trusted capability, not a default open agent command.

Sources:
- https://playwright.dev/docs/api/class-page
- https://playwright.dev/docs/api/class-locator
- https://playwright.dev/docs/aria-snapshots

### yt-dlp Boundary

`yt-dlp` remains a mature external tool with JSON output, output templates, progress controls, cookie options, verbose/debug options, and frequent project-level feature growth. Its CLI supports `--dump-json`, `--print`, `--newline`, and `--progress-template`, which are enough to design a future adapter without embedding Python.

Implication for Feather:
- A full media-download adapter does not belong in the smallest Phase 2 prototype.
- Phase 2 should write an adapter interface and possibly a no-op/stub contract only if it helps preserve architecture boundaries.
- Actual subprocess execution, cookie handoff, timeout/cancel, artifact metadata, and progress parsing should move to the native feature/integration layer after the headless core lifecycle is proven.

Source:
- https://github.com/yt-dlp/yt-dlp/blob/master/README.md

## Local API Transport Options

### Option A: Localhost HTTP With JSON

Pros:
- Easiest to inspect with `curl`.
- Works across languages and future clients.
- Natural request/response fit for launch, navigate, snapshot, extract, screenshot, and close.
- Easy to version under `/v1`.

Cons:
- Needs a port binding and localhost security policy.
- Streaming progress and long-running jobs need an event endpoint or later WebSocket/SSE.

Fit: best first transport for Phase 2.

### Option B: stdio JSON-RPC

Pros:
- Good for agent subprocess control.
- No port exposure.
- Easy to supervise from a parent process.

Cons:
- Harder to inspect manually.
- Less convenient for future local tools and multi-client inspection.
- Requires framing and process lifecycle discipline earlier.

Fit: good later transport over the same command layer, not first.

### Option C: Unix Socket

Pros:
- Better local-only security on Unix.
- Avoids port collision.

Cons:
- Less portable, especially for future Windows support.
- Slightly less convenient for manual inspection.

Fit: useful hardening option later, not the smallest first prototype.

## Recommendation

Use localhost HTTP with JSON as the first control transport, bound only to `127.0.0.1` by default, with a random or configured port and a startup token. Keep command handlers transport-independent so stdio JSON-RPC can be added later without changing the core session API.

## Smallest Prototype Scope

The Phase 2 prototype should prove:

1. Launch and close one isolated persistent workspace session.
2. Persist storage across relaunch for that workspace.
3. Launch and close one disposable temporary session.
4. Reject concurrent launches against the same persistent profile lock.
5. Accept a per-session proxy launch configuration and expose only sanitized proxy status.
6. Expose a local HTTP JSON API for:
   - `session.launch`
   - `session.status`
   - `page.navigate`
   - `page.snapshot`
   - `page.extract`
   - `page.screenshot`
   - `debug.bundle`
   - `session.close`
7. Write structured JSONL logs and a per-session debug bundle.
8. Measure resource use for new headless Chromium versus headless shell under the same task script.
9. Decide that real `yt-dlp` execution waits until after the core prototype, while the adapter boundary is documented now.

## Exclusions

- No GUI design or scaffolding.
- No Chrome-extension dependency.
- No Chromium fork or source build.
- No production media downloader.
- No stealth or anti-detection claims.
- No broad plugin system.
- No multi-profile pooling beyond one browser/session per profile.

## Phase 2 Success Criteria

Phase 2 is successful when a later implementation can demonstrate:

- A persistent workspace retains cookies/local storage across restart.
- A disposable session leaves no retained workspace profile unless debug quarantine is requested.
- A second launch against the same persistent profile is rejected by Feather before browser startup.
- Proxy settings are applied only at session launch and redacted in logs.
- The local API can run launch -> status -> navigate -> snapshot -> extract -> screenshot -> debug bundle -> close.
- Debug artifacts allow a failed command sequence to be inspected without rerunning immediately.
- Resource measurements produce comparable numbers for new headless Chromium and headless shell.
- `yt-dlp` remains a documented adapter boundary, not a blocker for the core prototype.
