# Browser Architecture Options Research

Date: 2026-05-31

## Research Question

What technical foundation best fits Feather Browser: a lightweight, highly configurable, Chromium-compatible hobby browser with a calm workflow feel and first-class Playwright support for agentic AI?

This research compares realistic foundations without assuming whether the first product path should be daily-driver browser first or agentic-AI browser first.

## Evaluation Criteria

- Chromium compatibility: modern Blink/Chromium behavior and compatibility with Chrome/Edge sites.
- Extension support: realistic path to Chrome/WebExtension support, especially MV3-era extensions.
- Playwright support: can agents control the browser reliably with Playwright, not only low-level CDP.
- Lightweight hobby scope: can one developer make useful progress over roughly a year.
- Configurability: can the project own keyboard, workspace, profile, and workflow behavior.
- Security/update burden: can the project stay reasonably current without maintaining a browser engine.
- Daily-driver potential: can this plausibly become stable enough for personal daily use.

## Findings

### Electron

Electron is mature and fast for building a custom desktop shell around Chromium web contents. It exposes `BrowserWindow`, `webContents`, and Chrome DevTools Protocol integration points, so it is practical for a configurable UI and web-content control.

The limiting factor is extension compatibility. Electron's official documentation says it supports only a subset of Chrome Extensions APIs, primarily for DevTools and Chromium-internal extensions, and that arbitrary Chrome Web Store extension compatibility is explicitly a non-goal. Extensions must be loaded unpacked and are not remembered unless loaded again at startup.

Implication: Electron is strong for a custom app-like shell, weak for "Chromium-compatible browser with Chrome extension expectations." It can be useful for a control UI, but not as the primary browser engine if extension compatibility is a core goal.

### Chromium Embedded Framework

CEF is designed to embed Chromium-based browser views in native applications. It is a serious option for custom shells in C++ or bindings. It gives more native control than Electron and avoids Node in the browser process by default.

The project cost is high for a hobby browser. CEF means owning native app complexity, browser process plumbing, packaging, update cadence, and security-sensitive integration. Public documentation emphasizes embedding Chromium, not reproducing full Chrome browser behavior. General Chrome extension and Web Store parity is not a safe assumption.

Implication: CEF is a credible long-term engine for a custom native browser shell, but it is too expensive for the first year unless the project rejects full extension parity and accepts native complexity.

### Qt WebEngine

Qt WebEngine embeds Chromium inside Qt and is attractive for a calm, keyboard-first native UI. Qt tracks Chromium versions per Qt WebEngine release and backports security patches. Recent Qt WebEngine versions have active WebExtensions work, and Qt 6.10+ appears materially better for extension experiments than older Qt releases.

The tradeoff is that Qt WebEngine is not Chrome. Chromium version lag, Qt-specific APIs, incomplete browser feature parity, and extension support maturity all matter. It may suit a qutebrowser-like personal browser, but it is risky if the project promise is broad Chrome extension compatibility plus first-class Playwright.

Implication: Qt WebEngine is attractive for a daily-driver-inspired native browser, especially keyboard workflows, but it is not the strongest foundation for first-class agent automation or Chrome-extension compatibility.

### Full Chromium Fork or Distribution

A Chromium fork/distribution gives the most real browser control and the best route to extension parity. It is how serious Chromium-based browsers can alter UI, policies, defaults, services, and extension behavior.

The maintenance burden is the largest by far. Chromium's official release cycle ships a new milestone every four weeks, with stable refreshes weekly for security fixes. A hobby fork would inherit a permanent rebase, build, packaging, security, and update burden. Even setting up and building Chromium is a large commitment before product work starts.

Implication: a Chromium fork is the most powerful final form but a poor Phase 2 starting point. It should remain a later milestone only if the prototype proves there is enough value to justify engine-level maintenance.

### Playwright Persistent Chromium Profile With Custom Shell/Control UI

Playwright can launch a persistent Chromium context with a real user data directory. It can also connect to existing Chromium-based browsers over CDP, though the official docs warn CDP is lower-fidelity than Playwright's own protocol connection. Playwright's bundled Chromium is kept ahead of stable Chrome, and Playwright can also run branded Chrome or Edge channels when needed.

This option fits the agentic-AI goal better than embedded shells. It lets Feather start as a profile manager, launcher, command surface, and companion/control UI around real Chromium rather than pretending to be a full browser engine. It can expose Playwright-first affordances from day one: isolated profiles, persistent sessions, permission boundaries, task logs, screenshots, traces, and stable endpoints.

The main drawback is product shape. This is not initially a fully custom browser chrome. The first useful artifact would be an agent-friendly Chromium workspace launcher and control plane, with a calm local UI layered beside or around Chromium. Daily-driver polish comes later if the automation-first foundation proves valuable.

Implication: this is the best Phase 2 foundation because it maximizes learning, minimizes engine maintenance, and directly tests Feather's unique agentic premise.

### WebView2 / Tauri

WebView2 is Chromium-based on Windows and has documented Playwright automation through CDP. Tauri can be light because it uses system webviews, but that means WebView2 on Windows and WebKit on macOS/Linux. That conflicts with "Chromium-compatible" as a cross-platform browser goal.

Implication: WebView2/Tauri is useful context, and WebView2 could matter for Windows-only tools, but it should not be Feather's primary architecture if cross-platform Chromium behavior matters.

## Daily-Driver First vs Agentic-AI First

Daily-driver first would require solving hard browser problems early: extension compatibility, password/session safety, crash recovery, updates, security posture, import/export, sync alternatives, performance, downloads, file handlers, and user trust. Electron, CEF, and Qt WebEngine all make some of those harder, and a Chromium fork makes all of them possible but too expensive.

Agentic-AI first has a narrower proof: can Feather create a calm, persistent, inspectable Chromium workspace that agents can operate reliably while the user remains in control? Playwright already supplies much of the automation substrate. The project can still preserve daily-driver optionality by using real Chromium profiles, extension-capable Chromium builds, and a roadmap milestone for daily hardening.

Recommendation: start agentic-AI first, but not agent-only. The Phase 2 prototype should be a human-visible Chromium workspace with a local control UI and durable profile model. That keeps the browser feeling real while testing the strongest differentiator first.

## Recommended Architecture

Adopt a Playwright-managed persistent Chromium profile with a custom local shell/control UI for Phase 2.

Core idea:
- Feather owns profiles, workspaces, command/config model, agent permissions, logs, and launch lifecycle.
- Chromium owns web compatibility, extension runtime, rendering, media, downloads, and site behavior.
- Playwright owns automation control where possible; CDP is used only for attach/interoperability cases where lower fidelity is acceptable.
- A local companion/control UI provides calm workflow controls, configuration, session visibility, and agent controls.

## Architecture Ranking

| Option | Fit | Why |
| --- | --- | --- |
| Playwright persistent Chromium profile + control UI | Best Phase 2 fit | Highest automation fit, lowest engine burden, preserves Chromium behavior. |
| Qt WebEngine | Good later daily-browser experiment | Strong native UI feel, but extension and Playwright parity are weaker. |
| CEF | Good later custom-shell candidate | Powerful embedding route, but high native and packaging burden. |
| Electron | Useful for control UI, weak as browser core | Fast UI development, but extension parity is an official non-goal. |
| Chromium fork/distribution | Best ultimate control, worst early cost | Real browser parity, but permanent release/security maintenance burden. |
| WebView2/Tauri | Windows/tooling candidate only | Lightweight but not cross-platform Chromium-compatible. |

## Primary Sources

- Electron `webContents`: https://www.electronjs.org/docs/latest/api/web-contents
- Electron Chrome Extension Support: https://www.electronjs.org/docs/latest/api/extensions/
- Electron Web Embeds: https://www.electronjs.org/docs/latest/tutorial/web-embeds
- Chromium Embedded Framework documentation: https://chromiumembedded.github.io/cef/
- Qt WebEngine overview: https://doc.qt.io/qt-6.9/qtwebengine-overview.html
- Qt WebEngine Chromium versions: https://wiki.qt.io/QtWebEngine/ChromiumVersions
- Chromium release cycle: https://chromium.googlesource.com/chromium/src/+/master/docs/process/release_cycle.md
- Chromium build instructions: https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/mac_build_instructions.md
- Chrome DevTools Protocol: https://chromedevtools.github.io/devtools-protocol/
- Chrome `chrome.debugger` API: https://developer.chrome.com/docs/extensions/reference/debugger
- Playwright browser types and persistent contexts: https://playwright.dev/docs/api/class-browsertype
- Playwright browsers: https://playwright.dev/docs/browsers
- Playwright Chrome extensions: https://playwright.dev/docs/chrome-extensions
- Playwright WebView2: https://playwright.dev/docs/webview2
- Microsoft WebView2 introduction: https://learn.microsoft.com/en-us/microsoft-edge/webview2/
- Tauri webview versions: https://v2.tauri.app/reference/webview-versions/
