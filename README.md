# Feather Browser

**https://github.com/ROI-DANINO/feather-browser**

A headless-first Chromium browser core for agentic automation, built around Playwright-managed sessions with a local HTTP control API.

## Status

Phase 3 Complete | Stabilization & Linux-Readiness program closed (S1 + S2 + S3) | 137 unit + 33 integration tests passing | Fastify 5.8.5 + Playwright 1.60

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
npm test                   # unit tests (137)
npm run test:integration   # integration tests with real Chromium headless shell (33)
npm run test:measurement   # resource measurement scenarios (4)
```

## Project Structure

See `docs/architecture.md` for a full walkthrough of the source layout and component boundaries.

## Development Status

Phase 3 (Browser Core Stabilization & UI Readiness) is complete and merged to `master`.

The **Stabilization & Linux-Readiness program** that bridged Phase 3 → Phase 4 is now closed (S1 Foundation, S2 tab-layer & observability, S3 currency & security — all shipped on `dev`). It reconciled the docs and runtime decisions, completed the tab-event model and SSE stream, and migrated Fastify v4 → v5 and Playwright 1.50 → 1.60. See `docs/specs/2026-06-03-stabilization-linux-readiness-design.md`. **Phase 4 (Visual Desktop Shell) is next, beginning with Step 0 (research + plan).** See `ROADMAP.md` and `PROGRESS.md`.

Feather Browser targets **Linux (Fedora)** as its primary platform.
