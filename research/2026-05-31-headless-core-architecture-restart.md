# Headless Core Architecture Research Restart

Date: 2026-05-31

## Research Question

Which foundation best fits Feather Browser after the Phase 1 restart: a headless-first, Chromium-compatible browser core for agents, scraping, session control, profile/proxy isolation, and later GUI wrapping?

This research supersedes the visible-shell-first emphasis in `research/2026-05-31-browser-architecture-options.md`. The earlier research remains useful history, but the current decision no longer optimizes for a custom visible shell or Chrome extension compatibility.

## Evaluation Criteria

- Chromium compatibility and modern browser behavior.
- Low RAM and CPU overhead beyond the browser process itself.
- Reliable automation surface for agents.
- Persistent profile/session isolation.
- Per-session proxy and network configuration.
- Scraping reliability and realistic enough session behavior.
- Ability to expose Feather-owned internal APIs.
- Native or integrated feature strategy without depending on Chrome extensions.
- Security and update burden suitable for a personal project.
- Future GUI optionality without building GUI in this phase.

## Findings

### Playwright-Managed Chromium Persistent Profiles

Playwright remains the strongest near-term foundation for the headless core. Its `launchPersistentContext(userDataDir, options)` API launches a browser with persistent storage in a user data directory and returns the single persistent context. Playwright's docs explicitly note that this directory stores cookies and local storage, and that browsers do not allow multiple instances using the same user data directory.

Playwright can use its managed open-source Chromium builds, branded Chrome/Edge channels already installed on the host, and a separate Chromium headless shell. Its current browser docs distinguish the default headless shell from "new headless" via the `chromium` channel. New headless is closer to the real browser and better for high-accuracy testing and extension tests, while headless shell can be more performant for tasks that do not need the full browser feature set.

Playwright also has first-class proxy options, browser contexts, tracing, screenshots, downloads, network routing, permissions, and structured page/locator APIs. That makes it a strong substrate for a Feather-owned API without forcing Feather to implement CDP protocol coverage directly.

Tradeoffs:
- Playwright is an automation library, not a browser product framework.
- The core service must own lifecycle, profile locks, policy, logging, and API boundaries.
- Raw CDP may still be needed for low-level operations not exposed by Playwright.
- Branded Chrome/Edge can differ from managed Chromium, especially around policies and media codecs.

Implication: best Phase 2 foundation. Use Playwright-managed Chromium as the browser runtime, persistent user data directories as the session primitive, and a Feather-owned local service as the control plane.

### Tauri and System WebView Approaches

Tauri is attractive for small desktop applications because it uses system webviews instead of bundling a browser engine. Its documentation says Windows uses WebView2, which is Chromium-based, while macOS and Linux use WebKit through WKWebView/WebKitGTK. That directly conflicts with Feather's cross-platform Chromium-compatible core requirement.

WebView2 may be useful later for a Windows-specific GUI or utility surface. Tauri may also be useful later for a small local dashboard. It is not a good foundation for the automation core because it does not provide a uniform Chromium runtime across platforms, and browser automation APIs are not its primary purpose.

Implication: keep Tauri/WebView as future GUI/control-surface context only. Do not use it as the headless core.

### Chromium Embedded Framework

CEF is a mature way to embed Chromium in native applications, with C and C++ support and official examples. It is appropriate when the product needs a native app that embeds browser views and owns more of the browser shell.

For Feather's current headless-first phase, CEF adds cost before proving the core idea. It requires native packaging, application layout, subprocess management, Chromium/CEF branch tracking, and security-sensitive integration. It also points the project toward an embedded browser application rather than a lightweight headless automation service.

Implication: credible later option if Feather needs a deeply owned native shell, but too expensive and GUI-biased for Phase 2.

### Qt WebEngine

Qt WebEngine embeds Chromium in Qt applications and can support browser-like native UI work. Current Qt documentation states that Qt WebEngine is based on Chromium, does not include Google Chrome services/add-ons, and does not allow direct DOM access from C++ APIs. The Qt Chromium version table shows a lagging Chromium base with security patches backported.

Qt WebEngine fits a later keyboard-first personal browser experiment better than a headless automation core. Its value is UI integration, not agent control. Direct DOM automation would still need JavaScript injection, DevTools, WebChannel, or a parallel automation path.

Implication: good candidate for future GUI experiments, not for the current headless core.

### Chromium Fork or Distribution Path

A Chromium fork gives maximum control, but the maintenance burden is disproportionate for the current phase. Chromium/Chrome has historically shipped frequent milestones and security updates, and Chrome's official developer blog says the stable release cadence moves from four weeks to two weeks starting September 2026. Extended Stable remains eight weeks, but a fork still inherits ongoing rebase, build, security, packaging, and platform work.

Chromium's Linux build documentation also shows that simply building Chromium requires dedicated build tooling, dependencies, hooks, and system tuning for official builds.

Implication: do not fork or build Chromium in Phase 2. Revisit only if a proven Feather core later needs engine-level changes that cannot be achieved through launch policy, CDP, Playwright, or a native shell.

### Rust/C++ Control-Layer Options

There are two realistic control-layer routes:

1. Use Playwright as the primary high-level automation layer, then wrap it behind a Feather-owned local API.
2. Use raw CDP from Rust or C++ through libraries such as `rust-headless-chrome`, `chromiumoxide`, or a custom CDP client.

CDP is the correct low-level protocol boundary for Chromium. The official CDP docs describe browser endpoints, remote debugging ports, JSON protocol discovery, and multiple-client support. Rust CDP libraries are attractive for a small native service, but they expose more protocol burden to Feather. The `rust-headless-chrome` README itself notes that the Chrome DevTools Protocol is huge and that Puppeteer supports more of it.

For Phase 2, a TypeScript/Node Playwright service is the most pragmatic control layer despite Node overhead. The browser dominates resource use, Playwright is the most mature high-level API, and Feather can keep its public API independent so the implementation can later move hot paths or supervision into Rust.

Implication: start with a Feather-owned local control service backed by Playwright. Treat raw CDP as an internal adapter for targeted gaps, not as the first public API.

### Mature Tool Integration: yt-dlp

`yt-dlp` is a mature external downloader with broad extractor support, release binaries, pip installation, self-update support, plugins, and Python 3.10+ support. It should not be reimplemented inside Feather.

The right integration pattern is an adapter boundary:
- Feather exposes a stable media-download request API.
- The adapter invokes `yt-dlp` as an external process first, with strict argument construction, per-job directories, logs, progress parsing, and timeouts.
- Cookie handoff from a Feather profile is explicit and user-controlled.
- The adapter stores metadata and artifacts in Feather-owned job directories.
- Embedding the Python API can be considered later only if subprocess control becomes a real limitation.

Implication: use mature tools behind Feather-owned interfaces. Do not make them core architecture dependencies.

## Recommended Architecture

Use a Playwright-managed Chromium headless core with persistent, isolated user data directories, wrapped by a Feather-owned local control service.

Default runtime:
- Playwright-managed Chromium.
- `channel: "chromium"` new headless mode when realistic browser behavior matters.
- Chromium headless shell as an optional lower-resource mode for extraction jobs that do not need full browser behavior.
- Branded Chrome/Edge channels only for targeted compatibility or codec checks.

Control plane:
- Local-only API owned by Feather.
- First implementation can be TypeScript/Node because Playwright support is strongest there.
- API is implementation-neutral so Rust supervision or CDP-specific workers can replace pieces later.
- One launched browser/session per isolated profile unless research proves a safe pooling model.

Session model:
- Workspace/profile directories are Feather-owned.
- Each active session has a unique user data directory lock.
- Proxy settings are session-scoped at launch.
- Persistent storage is opt-in per workspace; temporary profiles are allowed for throwaway jobs.

Automation API:
- Navigation, page lifecycle, DOM snapshot/query, text extraction, structured extraction, screenshot/PDF, download handling, cookies/storage, permissions, network observation, request blocking, script evaluation, and debug metadata.
- Raw CDP is internal-only unless a specific advanced need justifies exposing a narrow pass-through.

Native/integrated feature strategy:
- Build profile/session/proxy policy, logs, replay metadata, extraction contracts, and agent permissions as Feather-owned features.
- Integrate mature external tools such as `yt-dlp` through adapters.
- Do not depend on Chrome extensions as the core strategy.

## Ranking

| Option | Phase 2 Fit | Reason |
| --- | --- | --- |
| Playwright-managed Chromium persistent profiles | Best | Strongest automation API, real Chromium behavior, low engine maintenance, immediate headless prototype path. |
| Raw CDP Rust/C++ control layer | Useful internal adapter | Lower overhead and more control, but too much protocol burden for first prototype. |
| Chromium fork/distribution | Poor early fit | Maximum control, but unacceptable update/build/security burden before proving value. |
| CEF | Poor early fit | Powerful native embedding, but too much native shell and packaging work for a headless core. |
| Qt WebEngine | Poor early fit | Useful for later GUI, weaker direct automation and no direct DOM API. |
| Tauri/WebView | Poor core fit | Lightweight UI framework, but not cross-platform Chromium-compatible. |

## Phase 2 Questions To Validate

- Measure memory and CPU for new headless Chromium vs headless shell under common scraping tasks.
- Confirm proxy isolation behavior per persistent session.
- Confirm profile lock behavior and crash recovery.
- Confirm cookie/storage export/import boundaries.
- Decide whether the local API should be HTTP, Unix socket, stdio JSON-RPC, or all three through a shared command layer.
- Define what session replay metadata is enough for debugging failed agent runs.

## Primary Sources

- Playwright BrowserType `launchPersistentContext`: https://playwright.dev/docs/api/class-browsertype
- Playwright Browsers and headless modes: https://playwright.dev/docs/browsers
- Playwright Chrome extensions and persistent context constraints: https://playwright.dev/docs/chrome-extensions
- Chrome DevTools Protocol: https://chromedevtools.github.io/devtools-protocol/
- Puppeteer headless modes: https://pptr.dev/guides/headless-modes
- Tauri WebView versions: https://v2.tauri.app/reference/webview-versions/
- Chromium Embedded Framework documentation: https://chromiumembedded.github.io/cef/
- CEF GitHub repository: https://github.com/chromiumembedded/cef
- Qt WebEngine overview: https://doc.qt.io/qt-6/qtwebengine-overview.html
- Qt WebEngine Chromium versions: https://wiki.qt.io/QtWebEngine/ChromiumVersions
- Chromium Linux build instructions: https://chromium.googlesource.com/chromium/src/+/main/docs/linux/build_instructions.md
- Chrome two-week release cycle announcement: https://developer.chrome.com/blog/chrome-two-week-release
- rust-headless-chrome repository: https://github.com/rust-headless-chrome/rust-headless-chrome
- chromiumoxide repository: https://github.com/mattsse/chromiumoxide
- yt-dlp README: https://github.com/yt-dlp/yt-dlp/blob/master/README.md
- yt-dlp installation wiki: https://github.com/yt-dlp/yt-dlp/wiki/Installation
- yt-dlp FAQ: https://github.com/yt-dlp/yt-dlp/wiki/FAQ
