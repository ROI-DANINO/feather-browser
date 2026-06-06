# Feather Browser

**Feather is a local Chromium runtime for AI agents.**

It gives agents (and you) controlled, real Chromium sessions over a small local HTTP API —
persistent or disposable profiles, page snapshots, structured extraction, screenshots, and
debug bundles. It is infrastructure for when a plain API isn't enough: sites with no useful
API, visual state that matters, logins and cookies that must persist, or automation you need
to reproduce and debug.

> Linux-first, developed on Fedora (Wayland). Cross-platform support is not promised yet.
> This is an early, developer-focused open-source project — see the honest limits below.

## Who it's for

Developers building local AI agents and browser automation: MCP and Playwright users, people
wiring up personal AI workflows, and researchers working on browser agents who need
persistent, authenticated sessions an agent can drive.

## See it work (~60 seconds)

**Prerequisites:** Node.js 20+, `curl`.

```bash
npm install
npm run dev          # starts the server; prints its address + token/endpoint file paths
```

In another terminal, run the demo — it drives a full session loop end to end
(launch → navigate → snapshot → extract → screenshot → debug-bundle → close):

```bash
./examples/quickstart.sh
```

The server binds to `127.0.0.1` on an **OS-assigned port** (set `FEATHER_PORT` to pin one).
The exact address and the auth token path are written to `endpoint.json` at startup and
printed on the `Endpoint:` / `Token file:` lines — the demo reads them automatically. See
`examples/README.md`.

## What works today

- Launch and control isolated Chromium sessions over a local HTTP API
- Persistent **and** disposable profiles, with profile locks to prevent collisions
- Page snapshots, structured (CSS-recipe) extraction, screenshots
- Drive pages: click, type, and press keys (robust role/text/CSS targeting), plus a streaming-safe
  wait for dynamic content to settle
- On-demand debug bundles (trace, console, network) + a read-only event stream
- Structured JSONL logs with automatic credential redaction
- Per-session proxy configuration; resource measurement
- Transport-separated handlers, so the same core can later expose MCP/other protocols

## What it doesn't do yet

Stated plainly so the scope is honest:

- Not a Chrome replacement or a general consumer browser
- Not an Arc / Zen / Dia / Comet competitor
- Not a polished cross-platform GUI product
- Not a complete agent framework, and not a broad integration/connector platform

## Architecture

A headless-first Chromium core: Playwright-managed sessions behind a Fastify local control
service, with transport-separated command handlers. Full walkthrough in
[`docs/architecture.md`](docs/architecture.md).

## For AI agents

The machine-readable contract is [`docs/api-reference.md`](docs/api-reference.md). In short:
discover the base URL from `endpoint.json` (`baseUrl` field), send the token from its
`tokenFile` in the `X-Feather-Token` header, and every response uses the envelope
`{ ok, requestId, data | error }`.

## Testing

```bash
npm test                   # unit tests
npm run test:integration   # integration tests against real Chromium
npm run test:measurement   # resource measurement scenarios
```

## Status — built in the open

Phases 0–3 are complete. The project is currently developed openly on the default `dev`
branch. Current focus is **Feather Core open-source readiness** (Phase 4a) ahead of the
visual desktop shell (Phase 4b) — see [`ROADMAP.md`](ROADMAP.md). This project is built in
the open: the full design history, decisions, and session-by-session log live under
[`journal/`](journal/) and [`docs/specs/`](docs/specs/) for anyone who likes to read how
it's made.
