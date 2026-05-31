# Feather Browser

**https://github.com/ROI-DANINO/feather-browser**

A headless-first Chromium browser core for agentic automation, built around Playwright-managed sessions with a local HTTP control API.

## Status

Phase 2 Complete | 129 tests passing (98 unit, 27 integration, 4 measurement)

## What It Does

- Launches and controls isolated headless Chromium sessions over a local HTTP API
- Supports persistent workspace sessions and disposable temporary sessions
- Enforces profile file locks to prevent concurrent session conflicts
- Accepts per-session proxy configuration at launch time
- Emits structured JSONL logs with automatic credential redaction
- Captures debug bundles (console logs, network events, screenshots) on demand
- Measures session resource usage (CPU, memory) via configurable sampling runs

## Quick Start

**Prerequisites:** Node.js 20+, npm

**Install**

```
npm install
```

**Run**

```
npm run dev
```

The server binds to `127.0.0.1:3000`. A random token is generated at startup and written to the token file (path printed at startup). Pass it in the `X-Feather-Token` header on all API calls.

**Health check**

```
curl http://localhost:3000/health
```

**Authenticated request (example)**

```
TOKEN=$(cat .feather/token)
curl -H "X-Feather-Token: $TOKEN" http://localhost:3000/v1/sessions
```

See `docs/api-reference.md` for the full API reference (launch, navigate, snapshot, extract, screenshot, debug-bundle, close, and more).

## Testing

```
npm test                   # unit tests (98)
npm run test:integration   # integration tests with real Chromium headless shell (27)
npm run test:measurement   # resource measurement scenarios (4)
```

## Project Structure

See `docs/architecture.md` for a full walkthrough of the source layout and component boundaries.

## Development Status

Phase 2 (Headless Core Prototype) is complete. All exit criteria have been verified.

Phase 3 (Native Feature and Integration Layer) is next. See `ROADMAP.md` for the roadmap and `PROGRESS.md` for current state.
