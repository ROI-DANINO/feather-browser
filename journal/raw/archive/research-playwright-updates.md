# Research: Playwright Updates Since 1.50
# Date: 2026-06-02 | Source: Web research pass

## Context

We're on Playwright 1.50 (released Feb 3, 2025). Tracking what's new that's relevant
to Feather Browser. Excludes test-runner features (we use Playwright for browser control,
not test authoring).

---

## Version Timeline
- 1.50.0 — Feb 3, 2025 (current)
- 1.51.0 — Mar 18, 2025
- 1.52.0 — Apr 30, 2025
- 1.53.0 — Jun 25, 2025
- 1.54.0 — Jul 22, 2025
- 1.55.0 — Aug 28, 2025
- 1.56+ — ongoing

---

## Features We Missed or Should Adopt

### page.screencast() — new in 1.51
Precise per-page video capture with start/stop control.
Currently we use `setRecordVideoDir` on context (all-or-nothing, starts at context creation).
`page.screencast()` lets us capture on demand, per page, with programmatic start/stop.
Directly relevant to Phase 5+ "Headless screencast / viewport preview portal" milestone.
**Action: upgrade to 1.51+, adopt in Phase 4 or 5.**

### context.tracing — available since ~1.40, never used
`context.tracing.start()` / `context.tracing.stop({ path })` produces a `.zip` trace file.
Contains: HAR network log + DOM snapshots + screenshots, all synchronized by timestamp.
Viewable in Playwright trace viewer (`npx playwright show-trace trace.zip`).
Our current debug bundle captures console logs, network events, screenshots separately.
Playwright traces give all three unified — and are far more useful for debugging.
**Action: add tracing to debug bundle in Phase 4 or Phase 5.**

### ARIA Snapshots — new in 1.49
`expect(locator).toMatchAriaSnapshot()` — compares accessibility tree to a YAML snapshot.
Used by Microsoft's Playwright MCP server for non-vision LLMs to "read" pages.
Not needed for Phase 3 or 4. Directly relevant for Phase 5+ agent automation.
**Note in Phase 5+ planning: Playwright MCP uses this, not screenshots.**

### Deprecated: page.type(), locator.type()
These were deprecated; use `locator.fill()` instead (faster).
We may use `.type()` anywhere — audit before upgrading past 1.55.
**Action: grep for `.type(` before upgrading, replace with `.fill()`.**

### async disposables (await using)
Many Playwright APIs now return async disposables for automatic cleanup.
```ts
await using page = await context.newPage();
// page.close() called automatically at scope exit
```
Minor ergonomic improvement. Not urgent.

### fail_on_status_code / maxRedirects
New options on apiRequest. Not directly relevant (we don't use Playwright's fetch layer).

---

## System Chromium on Linux (Avoid Bundled Download)

Playwright can use system Chromium:
```ts
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium'
});
```
Env var: `PLAYWRIGHT_CHROMIUM_SKIP_DOWNLOAD=1`

On Fedora: `sudo dnf install chromium` (from RPM Fusion — needs enabling first)
Or: `sudo dnf install chromium-headless` (headless-only, smaller)

Risk: Playwright's internal CDP commands assume a specific Chromium version.
System Chromium may be behind or ahead of what Playwright expects.
Test carefully. If version drift causes issues, stay on bundled Chromium.

**This is the highest-leverage "Feather" optimization available right now.**

---

## What's NOT Relevant to Feather

- Pytest async fixtures (Python only)
- testProject.workers, failOnFlakyTests (test runner)
- .NET / Java / Python SDKs
- UI Mode, dashboard, show command

---

## Sources
- https://playwright.dev/docs/release-notes
- https://codoid.com/automation-testing/playwright-1-56-key-features-and-updates/
- https://gist.github.com/DreamShaded/764ae360fd7dd74d1f12d23f6581b6d1
