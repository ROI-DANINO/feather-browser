# Phase 2 Headless Core Prototype Plan

Date: 2026-05-31

## Status

Planned.

This spec defines the smallest Phase 2 prototype around ADR-0002. It is not an implementation. It is the boundary for the next build step.

## Goal

Build the smallest functional headless core prototype that proves Feather can launch, control, inspect, measure, and close isolated Chromium sessions through a Feather-owned local API.

## Non-Goals

- No GUI design or scaffolding.
- No Chrome-extension dependency as product strategy.
- No Chromium fork or source build.
- No daily-driver browser shell.
- No production media downloader.
- No anti-detection promise.
- No general plugin architecture.
- No multi-session pooling against the same profile.

## Prototype Decisions

### Runtime

Use Playwright-managed Chromium through Node/TypeScript for the first implementation.

The default runtime mode is:

```text
browserMode = "chromium-new-headless"
```

That mode should launch Playwright Chromium with `channel: "chromium"` and `headless: true`.

The comparison mode is:

```text
browserMode = "chromium-headless-shell"
```

That mode should use Playwright's default Chromium headless shell path when no Chromium channel is specified.

Branded Chrome/Edge channels are out of prototype scope except as later compatibility checks.

### Session Model

One Feather session owns one Playwright persistent browser context.

Session types:

```text
persistent workspace session
disposable temporary session
```

Persistent sessions use a Feather-owned workspace profile directory:

```text
.feather/
  profiles/
    <workspaceId>/
      profile/
      workspace.json
      lock
```

Disposable sessions use a temporary user data directory owned by the session:

```text
.feather/
  tmp/
    sessions/
      <sessionId>/
        profile/
        session.json
```

Disposable profile data is deleted on successful close by default. If debug capture is requested after failure, the profile can be moved into:

```text
.feather/
  debug/
    <sessionId>/
      quarantined-profile/
```

### Profile Locks

Feather must create and own a lock before launching a persistent workspace session.

Lock behavior:
- Reject a second launch for the same workspace while a valid lock exists.
- Store session ID, process ID, created timestamp, workspace ID, browser mode, and sanitized proxy summary in the lock metadata.
- On startup, stale locks may be reported but should not be silently deleted in the first prototype.
- Closing a session releases the lock after Playwright context close succeeds or after forced close cleanup finishes.

### Proxy Policy

Proxy configuration is session-scoped and launch-only.

Accepted shape:

```json
{
  "server": "http://127.0.0.1:8080",
  "username": "optional",
  "password": "optional",
  "bypass": "optional comma-separated bypass list"
}
```

Status and logs must redact credentials:

```json
{
  "server": "http://127.0.0.1:8080",
  "hasCredentials": true,
  "bypass": "localhost,127.0.0.1"
}
```

Changing proxy settings for a running session is out of scope.

## First Local API Transport

Use localhost HTTP with JSON.

Binding rules:
- Bind to `127.0.0.1` by default.
- Use a configured port or choose a random free port.
- Print/write an endpoint file on startup.
- Require a startup token header for non-health endpoints.

Endpoint file:

```json
{
  "transport": "http",
  "baseUrl": "http://127.0.0.1:17321",
  "tokenFile": ".feather/run/control-token",
  "pid": 12345,
  "startedAt": "2026-05-31T00:00:00.000Z"
}
```

HTTP is chosen first because it is easy to inspect manually, agent-friendly, language-neutral, and enough for the Phase 2 command surface. The implementation should still keep command handlers independent from HTTP so stdio JSON-RPC or Unix socket transport can be added later.

## API Shape

All responses share this envelope:

```json
{
  "ok": true,
  "requestId": "req_01",
  "data": {}
}
```

Errors use:

```json
{
  "ok": false,
  "requestId": "req_01",
  "error": {
    "code": "PROFILE_LOCKED",
    "message": "Workspace profile is already in use.",
    "details": {}
  }
}
```

### `POST /v1/sessions`

Launch a session.

Request:

```json
{
  "workspaceId": "default",
  "profile": {
    "kind": "persistent"
  },
  "browserMode": "chromium-new-headless",
  "viewport": {
    "width": 1280,
    "height": 800
  },
  "proxy": null,
  "debug": {
    "trace": true,
    "screenshots": true
  }
}
```

Response data:

```json
{
  "sessionId": "ses_01",
  "workspaceId": "default",
  "profileKind": "persistent",
  "browserMode": "chromium-new-headless",
  "state": "running",
  "profilePath": ".feather/profiles/default/profile",
  "debugDir": ".feather/debug/ses_01",
  "proxy": null
}
```

### `GET /v1/sessions`

List active sessions with sanitized metadata.

### `GET /v1/sessions/:sessionId`

Return status:

```json
{
  "sessionId": "ses_01",
  "state": "running",
  "workspaceId": "default",
  "profileKind": "persistent",
  "browserMode": "chromium-new-headless",
  "startedAt": "2026-05-31T00:00:00.000Z",
  "pages": [
    {
      "pageId": "page_01",
      "url": "https://example.com",
      "title": "Example Domain"
    }
  ],
  "proxy": null,
  "profileLocked": true
}
```

### `POST /v1/sessions/:sessionId/navigate`

Request:

```json
{
  "pageId": "page_01",
  "url": "https://example.com",
  "waitUntil": "domcontentloaded",
  "timeoutMs": 30000
}
```

If `pageId` is omitted, use the session's default page.

### `POST /v1/sessions/:sessionId/snapshot`

Return an agent-friendly page state:

```json
{
  "pageId": "page_01",
  "url": "https://example.com",
  "title": "Example Domain",
  "text": "Example Domain\nThis domain is for use in illustrative examples...",
  "links": [
    {
      "text": "More information...",
      "href": "https://www.iana.org/domains/example"
    }
  ],
  "meta": {
    "description": ""
  },
  "limits": {
    "textChars": 20000,
    "links": 200
  }
}
```

### `POST /v1/sessions/:sessionId/extract`

Request:

```json
{
  "pageId": "page_01",
  "recipe": {
    "fields": {
      "heading": {
        "selector": "h1",
        "type": "text"
      },
      "canonical": {
        "selector": "link[rel='canonical']",
        "type": "attribute",
        "attribute": "href"
      }
    },
    "limits": {
      "items": 100,
      "textChars": 5000
    }
  }
}
```

Response data:

```json
{
  "heading": "Example Domain",
  "canonical": null
}
```

Arbitrary script evaluation is not exposed in this first public API. It can exist internally for implementing constrained extraction.

### `POST /v1/sessions/:sessionId/screenshot`

Request:

```json
{
  "pageId": "page_01",
  "fullPage": true
}
```

Response data:

```json
{
  "artifactId": "art_01",
  "path": ".feather/debug/ses_01/screenshots/page_01-20260531T000000Z.png",
  "mimeType": "image/png"
}
```

### `POST /v1/sessions/:sessionId/debug-bundle`

Finalize or return the current debug bundle manifest.

Response data:

```json
{
  "sessionId": "ses_01",
  "path": ".feather/debug/ses_01",
  "manifest": ".feather/debug/ses_01/manifest.json"
}
```

### `DELETE /v1/sessions/:sessionId`

Close gracefully by default.

Request:

```json
{
  "force": false,
  "quarantineDisposableProfile": false
}
```

## Structured Logs

Use JSONL files for the prototype.

Session event file:

```text
.feather/logs/sessions/<sessionId>.jsonl
```

Event shape:

```json
{
  "ts": "2026-05-31T00:00:00.000Z",
  "level": "info",
  "event": "page.navigate.completed",
  "sessionId": "ses_01",
  "requestId": "req_01",
  "data": {
    "url": "https://example.com",
    "status": 200,
    "durationMs": 742
  }
}
```

Credentials and cookies must never be written to general logs.

Minimum events:
- `service.started`
- `session.launch.requested`
- `session.launch.completed`
- `session.launch.failed`
- `profile.lock.created`
- `profile.lock.rejected`
- `page.navigate.requested`
- `page.navigate.completed`
- `page.navigate.failed`
- `page.snapshot.completed`
- `page.extract.completed`
- `page.screenshot.completed`
- `debug.bundle.created`
- `session.close.requested`
- `session.close.completed`
- `session.close.failed`

## Debug Bundle

Directory:

```text
.feather/debug/<sessionId>/
```

Minimum contents:

```text
manifest.json
commands.jsonl
events.jsonl
network-summary.jsonl
console.jsonl
errors.jsonl
screenshots/
trace.zip
extract-results/
```

`manifest.json` should include:
- session ID
- workspace ID
- profile kind
- browser mode
- sanitized proxy summary
- profile path or temporary profile policy
- start and end timestamps
- close reason
- artifact list
- Feather version or git commit when available
- Playwright version when available
- browser executable path/version when available

## Resource Measurement Plan

Measure both browser modes:

```text
chromium-new-headless
chromium-headless-shell
```

Run the same scenario for each mode:

1. Launch persistent workspace session.
2. Navigate to a static page.
3. Capture snapshot.
4. Capture screenshot.
5. Run a simple extraction recipe.
6. Close session.
7. Repeat with a disposable profile.

Metrics:
- launch duration
- navigation duration
- snapshot duration
- screenshot duration
- extraction duration
- close duration
- peak RSS for Node service
- peak RSS for browser process tree
- average CPU percent during scenario
- profile directory size before and after
- debug bundle size

Measurement method:
- Record process IDs for the Node service and browser process tree.
- Sample process metrics at a fixed interval during the scenario.
- Store raw samples as JSONL.
- Store summary JSON per run.

Artifacts:

```text
.feather/measurements/<runId>/
  samples.jsonl
  summary.json
  scenario.json
```

The first measurement target is comparison, not absolute performance tuning.

## yt-dlp Decision

Do not build real `yt-dlp` execution in the Phase 2 prototype.

Reason:
- Phase 2 must prove the headless core lifecycle, API shape, profile isolation, proxy launch behavior, logs, debug bundles, and resource measurements first.
- A downloader adapter adds subprocess, artifact, cookie handoff, cancellation, and progress parsing concerns that are valuable but not needed to prove the core.

Keep this adapter boundary documented for a later phase:

```json
{
  "command": "media.download",
  "input": {
    "url": "https://example.com/video",
    "workspaceId": "default",
    "cookieSource": "none | explicit-profile-export",
    "outputDir": ".feather/downloads/job_01"
  }
}
```

When implemented later, it should use subprocess execution with strict argument construction, per-job output directories, timeout/cancel support, progress parsing from newline/progress-template output, and explicit cookie handoff only when requested.

## Implementation Plan Boundary

The next implementation plan should contain only Phase 2 prototype tasks:

1. Scaffold a minimal Node/TypeScript service.
2. Add configuration and filesystem layout helpers.
3. Add profile/workspace metadata and lock handling.
4. Add Playwright session lifecycle for persistent and disposable profiles.
5. Add HTTP JSON transport and token-protected routes.
6. Add navigation, snapshot, extraction, screenshot, and close commands.
7. Add structured logs.
8. Add debug bundle artifacts.
9. Add resource measurement scenario runner.
10. Add tests for profile locking, API validation, log redaction, disposable cleanup, and command behavior.
11. Run manual verification against new headless Chromium and headless shell.

The implementation plan should not include GUI, Chrome extensions, Chromium builds, or real `yt-dlp` execution.

## Exit Criteria For Phase 2 Prototype

Phase 2 implementation is complete when:

- The local service launches and closes a persistent headless Chromium session.
- A persistent workspace keeps browser storage across relaunch.
- A disposable session can run and clean up its temporary profile.
- A concurrent launch against the same persistent profile is rejected by Feather.
- A session can be launched with proxy configuration and report only redacted proxy metadata.
- The HTTP API completes launch -> status -> navigate -> snapshot -> extract -> screenshot -> debug bundle -> close.
- JSONL logs and a debug bundle are written for the session.
- Resource measurement artifacts compare new headless Chromium and headless shell.
- The `yt-dlp` adapter remains deferred with a documented boundary.

## Source Research

See `research/2026-05-31-phase-2-headless-core-prototype-plan.md`.
