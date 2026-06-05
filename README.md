# Feather Browser

**https://github.com/ROI-DANINO/feather-browser**

A headless-first Chromium browser core for agentic automation, built around Playwright-managed sessions with a local HTTP control API.

## Status

Phase 3 Complete | Stabilization & Linux-Readiness program closed (S1 + S2 + S3) | Phase 4 Step 0 done (Cookie Mine proven) | 182 unit + 37 integration + 4 measurement tests passing | CI: GitHub Actions on ubuntu, full suite incl. the headed CDP-attach gate (36 passed + 1 skipped) | Fastify 5.8.5 + Playwright 1.60

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
npm test                   # unit tests (175)
npm run test:integration   # integration tests with real Chromium headless shell (37)
npm run test:measurement   # resource measurement scenarios (4)
```

Two integration tests (`attach-cdp`, `system-chromium`) drive Chromium via `spawnAndConnect`, whose
ozone/headless/sandbox spawn args are now env-driven (`resolveSpawnExtraArgs`:
`FEATHER_OZONE_PLATFORM`, `WAYLAND_DISPLAY`, `FEATHER_SPAWN_HEADLESS`, `FEATHER_SPAWN_NO_SANDBOX`).
CI runs the full suite on a display-less runner by attaching over CDP to `--headless=new` Chromium
with `--no-sandbox` — `attach-cdp` (the anti-detection gate; `navigator.webdriver === false`) runs
there. `system-chromium` is skipped on CI (`process.env.CI`) because ubuntu's `/usr/bin/chromium` is
a snap build that doesn't expose CDP under headless+no-sandbox; it runs on every local dev machine
with a real system Chromium. So CI reports **36 passed + 1 skipped**; a local Wayland run is
**37 passed**.

## Project Structure

See `docs/architecture.md` for a full walkthrough of the source layout and component boundaries.

## Development Status

Phase 3 complete (merged to `master`); the Stabilization & Linux-Readiness program (S1/S2/S3) is closed; **Phase 4 (Visual Desktop Shell) Step 0 is done** (Cookie Mine proven by spikes). Feather Browser targets **Linux (Fedora)** as its primary platform. For the current state and next action see `journal/context/active.md`; for the roadmap see `ROADMAP.md`.
