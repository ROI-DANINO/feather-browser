# ADR-0002: Headless Core Foundation

Date: 2026-05-31

## Status

Accepted.

This ADR supersedes the active direction from `adr-0001-browser-foundation.md`. ADR-0001 remains historical context for the earlier visible-shell-first phase.

## Context

Feather Browser has restarted Phase 1 around a headless-first core. The near-term product is not a normal visible browser shell. It is a lightweight Chromium-compatible automation/control system for agents, scraping, session control, data extraction, and reliable profile/proxy isolation. A GUI wrapper remains future scope.

The decision must avoid:
- GUI scaffolding in the current phase.
- Chrome extensions as the core product strategy.
- Compiling or forking Chromium unless research proves the cost is justified.
- Overbuilding browser internals before a small prototype proves the core value.

## Decision

Feather will plan Phase 2 around a Playwright-managed Chromium headless core with persistent, isolated user data directories, wrapped by a Feather-owned local control service.

The first implementation should use Playwright-managed Chromium as the browser runtime. The default high-fidelity mode should use Playwright's `chromium` channel/new headless mode when realistic browser behavior matters. Chromium headless shell may be offered as a lower-resource mode for jobs that do not need full browser behavior. Branded Chrome/Edge channels are allowed only for targeted compatibility, codec, or site-behavior checks.

Feather owns:
- workspace/profile definitions
- session lifecycle
- profile locks
- proxy/network launch policy
- internal automation API
- agent permission boundaries
- structured logs
- replay/debug metadata
- native/integrated feature adapters

Playwright owns:
- browser launch and control
- page and context automation
- navigation and DOM interaction
- browser events
- screenshots, downloads, tracing, and network hooks where available

Chromium owns:
- rendering
- JavaScript execution
- storage implementation
- web compatibility
- media behavior
- browser process isolation

Raw CDP is an internal escape hatch for narrow gaps. It is not the public API for Phase 2 unless a specific capability cannot be represented cleanly through Feather's higher-level API.

## Rationale

Playwright-managed Chromium gives Feather the fastest credible path to a useful headless core without taking on browser-engine maintenance. It supports persistent profiles, automation APIs, proxy configuration, headless execution, traces, screenshots, downloads, and browser events.

Tauri/WebView is too platform-divergent for a Chromium-compatible core because only Windows uses Chromium-based WebView2; macOS and Linux use WebKit. CEF and Qt WebEngine are stronger for future native GUI/browser-shell work than for a headless automation core. A Chromium fork gives maximum control but creates a permanent build, update, security, and packaging burden before Feather has proven its automation value.

Starting with a Feather-owned API around Playwright also preserves future optionality. The API can remain stable if specific internals later move to Rust, raw CDP, CEF, or a Chromium fork.

## Architecture Direction

### Runtime

- Launch one browser/session per isolated workspace profile.
- Use a unique user data directory per persistent workspace.
- Use temporary user data directories for disposable jobs.
- Enforce profile locks so one user data directory is not opened by multiple browser instances.
- Keep browser binary choice explicit: managed Chromium by default, headless shell for low-resource jobs, branded Chrome/Edge only for compatibility checks.

### Control Service

- Provide a local-only Feather control service.
- Start with the smallest implementation that can launch, inspect, control, and close sessions.
- Keep the public contract independent from Playwright object shapes.
- Prefer a simple transport for Phase 2, likely localhost HTTP or stdio JSON-RPC; decide during Phase 2 Step 0.
- Record structured event logs for launches, navigations, extraction jobs, errors, downloads, and teardown.

### First Internal Automation API Shape

Phase 2 should define and prototype these capability groups:

- `session.launch`: workspace/profile, headless mode, proxy, viewport, permissions, timeout policy.
- `session.status`: process state, active pages, endpoint metadata, profile path, proxy summary.
- `session.close`: graceful close, forced close, crash metadata capture.
- `page.navigate`: URL, wait policy, timeout, referrer where needed.
- `page.snapshot`: accessibility snapshot, DOM summary, title, URL, text, selected metadata.
- `page.query`: selector or semantic locator, attribute/text extraction.
- `page.extract`: structured extraction recipe returning JSON.
- `page.evaluate`: constrained script evaluation for trusted internal use.
- `page.screenshot`: viewport/full-page screenshots.
- `network.observe`: request/response metadata, blocked URLs, content-type summaries.
- `storage.read`: cookies/local storage for a scoped origin or profile export operation.
- `download.start`: browser downloads and external adapter jobs such as `yt-dlp`.
- `debug.bundle`: traces, screenshots, console logs, network summary, error stack, timings.

### Profile, Session, And Proxy Isolation

- A workspace maps to a Feather-owned profile directory and metadata file.
- A running session owns exactly one profile lock.
- Proxy configuration is session-scoped and applied at browser launch.
- Credentials must not be written to general logs.
- Cookie export/import is explicit and scoped.
- Disposable sessions must delete or quarantine temporary profile data after completion, depending on debug policy.
- Persistent sessions retain storage only inside their workspace profile directory.

### Native And Integrated Features

Feather should build core policy and control features directly:
- profile/session/proxy management
- automation API contracts
- agent permissions
- extraction schemas
- logs and replay bundles
- resource measurements
- error classification

Feather should integrate mature tools through adapters when they are clearly better than rebuilding:
- `yt-dlp` for media extraction/downloads
- `ffmpeg` later if media post-processing is needed
- external proxy/VPN tooling only through explicit configuration boundaries

The first `yt-dlp` integration should be a subprocess adapter, not an embedded Python API. It should use strict argument construction, per-job output directories, progress parsing, timeout/cancel support, artifact metadata, and explicit cookie handoff from Feather profiles only when requested.

## Consequences

Positive:
- Fastest path to a working headless prototype.
- Strong agent automation fit.
- Real Chromium behavior without maintaining Chromium.
- Strong profile/session isolation primitive.
- Low architectural commitment because Feather owns the API boundary.
- Future GUI remains possible without contaminating Phase 2.

Negative:
- Node/Playwright adds some overhead outside Chromium.
- Deep browser UI or engine changes are out of scope.
- Some low-level features may require CDP adapters.
- Headless shell and new headless Chromium may behave differently.
- Stealth and scraping reliability still require empirical measurement, not assumptions.

## Non-Goals For Phase 2

- No GUI design or scaffolding.
- No Chrome-extension dependency as a product strategy.
- No broad extension compatibility claim.
- No Chromium fork or from-source Chromium build.
- No daily-driver browser shell.
- No sync service, password manager, or full download manager.
- No anti-detection promises. Feather can improve session realism and observability, but must measure behavior honestly.

## Phase 2 Planning Direction

Phase 2 should start with Step 0 and plan the smallest prototype that proves:

- Launch and close an isolated headless Chromium session.
- Persist cookies/storage in a workspace profile.
- Run a disposable profile session.
- Apply a proxy per session.
- Expose a local API for launch, status, navigate, snapshot, extract, screenshot, and close.
- Record structured logs and a debug bundle.
- Measure memory and CPU for at least new headless Chromium versus headless shell.
- Validate a minimal `yt-dlp` adapter plan without building it unless it belongs in the Phase 2 prototype.

## Revisit Triggers

Reconsider the foundation if:
- Playwright persistent profiles cannot provide reliable isolation.
- Per-session proxy configuration is insufficient.
- Resource measurements show unacceptable overhead from Playwright/Node relative to raw CDP.
- Critical automation APIs require too much CDP passthrough.
- The project becomes GUI-first again.
- Feather needs engine-level behavior changes that cannot be handled through launch policy, Playwright, CDP, or adapters.

## Source Research

See `research/2026-05-31-headless-core-architecture-restart.md`.
