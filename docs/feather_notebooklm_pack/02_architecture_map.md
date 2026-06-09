# Feather Browser — Architecture Map

## High-level architecture

Feather is a Node.js and TypeScript service that controls Playwright-managed Chromium.

The key architectural idea is separation:

- The HTTP transport receives requests.
- Command handlers interpret operations.
- SessionManager owns session lifecycle.
- FeatherSession wraps the live browser context.
- Playwright/Chromium performs the actual browser work.
- Cross-cutting systems handle files, logs, profile locks, debugging, and measurement.

## Layer diagram

```text
Client / Agent
    |
    v
HTTP Transport
Fastify server, token auth, request IDs, validation, response envelope
    |
    v
Command Handlers
Launch, Navigate, Snapshot, Extract, Screenshot, Click, Type, Press, Wait, Debug, Close
    |
    v
SessionManager
In-memory session registry, launch/get/list/close lifecycle
    |
    v
FeatherSession
One live browser context, page map, session state machine
    |
    v
Playwright / Chromium
Real browser runtime
```

## Cross-cutting systems

```text
FeatherPaths       -> central filesystem layout
FeatherLogger      -> JSONL logs with credential redaction
ProfileLock        -> prevents persistent profile collisions
DebugCapture       -> network, console, errors, commands, traces
DebugBundle        -> readable artifacts for failed or important runs
Measurement        -> resource and performance measurement
```

## HTTP Transport

The transport layer is built with Fastify.

It handles:

- Localhost server startup.
- Token authentication.
- Request ID injection.
- Zod validation.
- Uniform response envelopes.
- Mapping errors to HTTP status codes.

Every authenticated API response follows the same shape:

```json
{
  "ok": true,
  "requestId": "req_12345678",
  "data": {}
}
```

Errors follow:

```json
{
  "ok": false,
  "requestId": "req_12345678",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable explanation"
  }
}
```

## Command Handlers

Command handlers are transport-independent. They do not depend on Fastify directly.

This is important because the same core operations could later be exposed through:

- HTTP
- MCP
- WebSocket
- JSON-RPC
- Another local tool interface

The current handlers cover the main browser loop: launch, navigate, read, extract, interact, debug, and close.

## SessionManager

SessionManager is the central orchestrator.

It:

- Creates sessions.
- Tracks live sessions in memory.
- Acquires and releases profile locks.
- Creates workspace metadata.
- Starts Playwright contexts.
- Cleans up disposable profiles.
- Keeps persistent profiles safe from collisions.

## FeatherSession

A FeatherSession represents one live browser context.

It owns:

- A Playwright BrowserContext.
- One or more pages.
- Feather-assigned session IDs.
- Feather-assigned page IDs.
- A typed lifecycle state.

Session states include:

```text
launching -> running -> closing -> closed
                         |
                         v
                       failed
```

## Playwright / Chromium

Feather uses Playwright to launch and control Chromium.

The point is not to expose raw Playwright directly to agents. Feather wraps it behind a stable, smaller, safer API contract.

That lets the internal runtime evolve without breaking external callers.

## Architecture takeaway

Feather is designed like a browser control service, not a pile of automation scripts.

The important distinction:

- Scripts automate one task.
- Feather provides a reusable browser runtime that agents can use across many tasks.
