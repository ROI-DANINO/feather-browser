# Feather Architecture Overview

Feather is a local Chromium browser runtime that lets AI agents operate real browser sessions through a controlled HTTP API. This source explains the high-level architecture layers and the major supporting systems.

## Layer Diagram
Fastify HTTP Transport -> Command Handlers -> SessionManager -> FeatherSession -> Playwright/Chromium.

## HTTP Transport
A Fastify local control service.

## Command Handlers
Transport-separated command pattern for click, type, press, wait, observe, etc.

## SessionManager
Lifecycle orchestrator and registry for sessions.

## FeatherSession
In-memory session object and page map.

## Browser Runtime
Headless-first Chromium core managed by Playwright.

## Cross-Cutting Systems
Filesystem layout, structured logging, persistent profile locks, and debug bundles.

## Source File Map
- `src/transport/http.ts`: starts Fastify server and writes endpoint/token metadata.
- `src/transport/routes.ts`: registers routes and command handlers.
- `src/commands/*.ts`: transport-independent command handlers.
- `src/sessions/manager.ts`: lifecycle orchestration and registry.
- `src/sessions/session.ts`: in-memory session object and page map.
- `src/browser/modes.ts`: browser launch mode helpers.
- `src/profiles/lock.ts`: persistent profile lock.
- `src/profiles/workspace.ts`: workspace metadata.
- `src/fs-layout.ts`: filesystem layout.
- `src/logs/logger.ts`: structured logs.
- `src/debug/*`: debug capture and bundles.
