# Feather Browser — Phase 2 Architecture

## Overview

Feather Browser Phase 2 is a headless Chromium control service built for agent-driven automation, structured data extraction, and reliable session isolation. It exposes a localhost HTTP API that lets callers launch isolated browser sessions, navigate pages, capture snapshots and screenshots, extract structured data, and close sessions cleanly — all without touching Playwright or Chromium directly.

The service runs as a Node/TypeScript process. It wraps Playwright's `launchPersistentContext` to manage Chromium, enforces one-lock-per-profile isolation, redacts credentials from all logs and status responses, and writes structured JSONL event logs and debug bundles to a dedicated `.feather` workspace directory. The design keeps Feather's API contract entirely separate from Playwright's object model, so the internal runtime can evolve without breaking callers.

---

## Layer Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         HTTP Transport                              │
│  Fastify server · token auth middleware · request-ID injection      │
│  Zod request validation · uniform { ok, requestId, data } envelope  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ calls
┌──────────────────────────▼──────────────────────────────────────────┐
│                      Command Handlers                               │
│  LaunchSession · Navigate · Snapshot · Extract · Screenshot        │
│  GetSession · ListSessions · DebugBundle · CloseSession            │
│  (each implements CommandHandler<TIn, TOut> — no Fastify coupling) │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ calls
┌──────────────────────────▼──────────────────────────────────────────┐
│                      SessionManager                                 │
│  In-memory registry · launch / get / list / close lifecycle        │
│  Delegates to: ProfileLock · WorkspaceMetadata · FeatherLogger     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ creates / owns
┌──────────────────────────▼──────────────────────────────────────────┐
│                       FeatherSession                                │
│  Holds BrowserContext + page map · state machine (launching →      │
│  running → closing → closed/failed) · toRecord() serialisation     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ wraps
┌──────────────────────────▼──────────────────────────────────────────┐
│             Playwright / Chromium  (managed binary)                 │
│  chromium.launchPersistentContext · Page · BrowserContext · Tracing │
└─────────────────────────────────────────────────────────────────────┘

Cross-cutting concerns (available throughout all layers):
┌─────────────┐  ┌──────────────────┐  ┌───────────────────┐  ┌──────────────────┐
│  FeatherPaths│  │  FeatherLogger   │  │   ProfileLock     │  │  DebugCapture /  │
│  (fs-layout) │  │  (JSONL + redact)│  │  (file-based)     │  │  DebugBundle     │
└─────────────┘  └──────────────────┘  └───────────────────┘  └──────────────────┘
```

---

## Component Descriptions

### HTTP Transport (`src/transport/`)

The transport layer starts a Fastify server (`http.ts`) on the configured host and port. At startup it generates a 32-byte random hex bearer token, writes it to `.feather/run/control-token` (mode `0600`), and writes a JSON endpoint descriptor to `.feather/run/endpoint.json` containing the base URL, pid, and token file path. Two pieces of middleware run on every request: `injectRequestId` stamps each request with a `req_<8-char-uuid>` identifier before any handler runs, and `createTokenAuth` checks the `X-Feather-Token` header against the in-memory token, returning 401 on mismatch. The routes module (`routes.ts`) registers all nine REST endpoints, instantiates one command handler per route at startup, parses request bodies with Zod schemas, and formats all responses using a consistent `{ ok, requestId, data }` envelope. A single `handleRouteError` helper maps `ZodError` to 400, domain error codes (`SESSION_NOT_FOUND`, `PROFILE_LOCKED`, etc.) to their correct HTTP status codes, and everything else to 500.

### Config & Filesystem Layout (`src/config.ts`, `src/fs-layout.ts`)

`loadConfig` reads three environment variables (`FEATHER_PORT`, `FEATHER_HOST`, `FEATHER_DIR`) with sensible defaults (`port=0` for OS-assigned, `host=127.0.0.1`, `dir=.feather`). `FeatherPaths` is a thin path-factory class that centralises every file and directory path used by the service. `ensureDirs` creates six required directories under the feather root at startup: `profiles/`, `tmp/sessions/`, `debug/`, `logs/sessions/`, `run/`, and `measurements/`. All runtime code receives a `FeatherPaths` instance through constructor injection — no module hard-codes a path string.

### SessionManager (`src/sessions/manager.ts`)

`SessionManager` is the central orchestrator. It holds an in-memory `Map<sessionId, FeatherSession>` registry and coordinates three sub-concerns during session lifecycle: profile locking (`ProfileLock`), workspace metadata persistence (`WorkspaceMetadata`), and structured event logging (`FeatherLogger`). On `launch`, it determines the profile path (persistent workspace path or disposable temp path), acquires the profile lock for persistent sessions, calls `buildLaunchOptions` to assemble Playwright options, calls `chromium.launchPersistentContext`, and transitions the session to `running`. On `close`, it closes the Playwright context, releases the lock for persistent sessions, and either deletes or quarantines the temporary directory for disposable sessions. Force-close swallows context-close errors to ensure cleanup always completes.

### FeatherSession (`src/sessions/session.ts`)

`FeatherSession` is the runtime object representing one live browser context. It owns the Playwright `BrowserContext` reference and an internal `Map<pageId, Page>` keyed by Feather-assigned opaque page IDs (prefixed `page_`). The session ID itself uses a `ses_` prefix. The object transitions through a typed state machine: `launching` (constructed, no context yet) → `running` (context attached via `setContext`) → `closing` / `closed` / `failed` (managed by `SessionManager.close`). `getPage(pageId?)` returns either the named page or the first available page when no ID is given, throwing `PageNotFoundError` if the map is empty or the ID is unknown. `toRecord()` serialises the session to the `SessionRecord` shape used by the API response; it always reports `profileLocked: true` for persistent sessions and `false` for disposable ones.

### Profile Lock (`src/profiles/lock.ts`)

`ProfileLock` provides mutual exclusion over persistent workspace profiles using a plain JSON file at `.feather/profiles/<workspaceId>/lock`. On `create`, it checks for the lock file's existence: if the file already exists it parses the `LockData` (sessionId, pid, browserMode, proxySummary, createdAt) and throws `ProfileLockedError` with code `PROFILE_LOCKED`, which the route layer maps to HTTP 409. If the file is absent (`ENOENT`), it writes the lock. On `release`, it unlinks the file, tolerating `ENOENT` in case the file was already removed. This file-based approach survives process restarts where an in-memory lock would be lost — a stale lock from a crashed process can be detected and cleared by inspecting the recorded pid.

### Browser Modes (`src/browser/modes.ts`)

`buildLaunchOptions` translates a `BrowserMode` enum value and optional proxy/viewport into a Playwright `BrowserContextOptions` object. The two supported modes are: `chromium-new-headless`, which sets `channel: "chromium"` to use Playwright's managed Chromium binary in its new headless implementation (full renderer, realistic browser behaviour); and `chromium-headless-shell`, which omits the channel and uses the legacy headless shell binary (lower resource consumption, fewer capabilities). Proxy configuration is applied verbatim to `opts.proxy` when provided; credentials are passed through here from the full `ProxyConfig` (they have already been redacted to `ProxySummary` for any log or status use before this point). The default viewport is `1280x800`.

### Logger (`src/logs/logger.ts`, `src/logs/events.ts`, `src/logs/redact.ts`)

`FeatherLogger.log` appends a single JSON line to a per-session log file at `.feather/logs/sessions/<sessionId>.jsonl`. Log events without a `sessionId` are silently dropped — the logger is session-scoped. Each line carries `ts`, `level`, `event` (a typed `EventName` constant from `EVENTS`), `sessionId`, and optional `requestId` and `data` fields. The `EVENTS` catalog defines 17 named event types covering the full lifecycle from `service.started` through `session.launch.*`, `page.navigate.*`, `page.snapshot/extract/screenshot`, `debug.bundle.created`, and `session.close.*`. The `redact` module ensures credentials never reach logs: `redactProxy` converts a `ProxyConfig` (which carries `username`/`password`) to a `ProxySummary` (which records only `hasCredentials: boolean`); `redactUrl` strips userinfo from URLs.

### Debug Capture & Bundle (`src/debug/capture.ts`, `src/debug/bundle.ts`)

`DebugCapture` attaches event listeners to a `BrowserContext` at session launch to collect network requests (`requestfinished` / `requestfailed`), console messages, and page errors in memory. It also records structured command entries via `recordCommand`. When `finalize` is called it flushes four JSONL files to `.feather/debug/<sessionId>/`: `commands.jsonl`, `network-summary.jsonl`, `console.jsonl`, and `errors.jsonl`. If tracing was enabled at launch it also stops the Playwright trace and writes `trace.zip`. `DebugBundle` complements `DebugCapture` by writing a `manifest.json` to the same debug directory, enumerating all artifact file names alongside session metadata (sessionId, workspaceId, profileKind, browserMode, proxySummary, profilePath, startedAt, endedAt, closeReason, featherVersion, playwrightVersion).

### Measurement (`src/measurement/`)

The measurement subsystem benchmarks the two browser modes end-to-end. `ProcessSampler` polls a set of PIDs via `pidusage` at a configurable interval (default 500 ms), accumulating `{ ts, pids: { rss, cpu } }` samples; the interval timer is unreffed so it does not prevent process exit. `MeasurementRunner` drives a full scenario through the live HTTP API — launch, navigate to `example.com`, snapshot, screenshot, extract, debug-bundle, close — recording wall-clock timings for each step and measuring profile-directory sizes before and after close. `writeArtifacts` (reporter) persists three files to `.feather/measurements/<runId>/`: `samples.jsonl`, `scenario.json`, and `summary.json`. The summary includes a comparison section with `launchMsDiff` and `peakRssNodeDiff` (both computed as `chromium-new-headless` minus `chromium-headless-shell`).

---

## Data Flow — Typical Session Lifecycle

```
Client                     Fastify              Command Handler      SessionManager       Playwright
  │                           │                        │                   │                  │
  │ POST /v1/sessions         │                        │                   │                  │
  │ X-Feather-Token: <tok>    │                        │                   │                  │
  │ { profile:{kind:"persistent"}, browserMode, ... } │                   │                  │
  │──────────────────────────►│                        │                   │                  │
  │                           │ injectRequestId        │                   │                  │
  │                           │ tokenAuth              │                   │                  │
  │                           │ LaunchSchema.parse()   │                   │                  │
  │                           │───────────────────────►│                   │                  │
  │                           │                        │ manager.launch()  │                  │
  │                           │                        │──────────────────►│                  │
  │                           │                        │                   │ ProfileLock.create()
  │                           │                        │                   │ WorkspaceMetadata.ensureExists()
  │                           │                        │                   │ buildLaunchOptions()
  │                           │                        │                   │──────────────────►│
  │                           │                        │                   │  launchPersistentContext()
  │                           │                        │                   │◄──────────────────│
  │                           │                        │                   │ session.setContext()
  │                           │                        │                   │ registry.set(sessionId, session)
  │                           │                        │                   │ logger.log(SESSION_LAUNCH_COMPLETED)
  │                           │                        │◄──────────────────│                  │
  │                           │                        │ session.toRecord() + getPageInfoList()
  │                           │◄───────────────────────│                   │                  │
  │◄──────────────────────────│ { ok:true, data: SessionRecord }           │                  │
  │                           │                        │                   │                  │
  │ POST /v1/sessions/:id/navigate { url }             │                   │                  │
  │──────────────────────────►│                        │                   │                  │
  │                           │ NavigateSchema.parse() │                   │                  │
  │                           │───────────────────────►│                   │                  │
  │                           │                        │ manager.get(id).getPage()            │
  │                           │                        │──────────────────────────────────────►
  │                           │                        │     page.goto(url, waitUntil, timeout)
  │                           │                        │◄──────────────────────────────────────
  │◄──────────────────────────│ { ok:true, data: { pageId, url, status } }│                  │
  │                           │                        │                   │                  │
  │ POST /v1/sessions/:id/snapshot                     │                   │                  │
  │──────────────────────────►│ ──────────────────────►│──────────────────────────────────────►
  │                           │                        │  page.evaluate(innerText, links, meta)
  │◄──────────────────────────│ { ok:true, data: SnapshotResult }         │                  │
  │                           │                        │                   │                  │
  │ DELETE /v1/sessions/:id   │                        │                   │                  │
  │──────────────────────────►│ ──────────────────────►│                   │                  │
  │                           │                        │ manager.close()   │                  │
  │                           │                        │──────────────────►│ context.close()  │
  │                           │                        │                   │──────────────────►│
  │                           │                        │                   │ ProfileLock.release()
  │                           │                        │                   │ registry.delete()
  │◄──────────────────────────│ { ok:true, data: {} }  │                   │                  │
```

---

## Key Design Decisions

**1. Transport-independent command handlers**

Each operation (launch, navigate, snapshot, etc.) is a standalone class implementing `CommandHandler<TIn, TOut>`. Routes instantiate handlers and pass manager references to them; handlers never import Fastify types. This means command logic can be unit-tested without an HTTP server, and the same handlers could be wired to a stdio JSON-RPC or WebSocket transport in a future phase without rewriting the core logic.

**2. File-based profile locks instead of in-memory locks**

An in-memory lock is lost when the process crashes. A file lock written to `.feather/profiles/<workspaceId>/lock` survives a restart: on the next launch attempt the service finds the stale file, reads its `pid`, and can decide whether the owning process is still alive. The lock file stores enough metadata (`sessionId`, `pid`, `browserMode`, `proxySummary`) to diagnose stuck sessions without querying the registry. The trade-off is that cleaning up orphaned locks requires explicit tooling, but that is a deliberate choice aligned with ADR-0002's "Feather owns profile locks" principle.

**3. Proxy credentials redacted at the boundary**

`redactProxy` is called exactly once, immediately when a `ProxyConfig` arrives in `SessionManager.launch`, converting it to a `ProxySummary` (which records only `hasCredentials: boolean`). The full credentials are passed only to `buildLaunchOptions` for Playwright launch and are never stored on the session object, written to logs, or returned via the API. This makes it structurally impossible for a logging or serialisation bug to accidentally leak credentials.

**4. JSONL for session logs**

Each session's log is a newline-delimited JSON file at `.feather/logs/sessions/<sessionId>.jsonl`. JSONL is streamable and appendable — the logger uses `fs.appendFile` with no file-handle management — and each line is independently parseable even if the process crashes mid-session. This contrasts with a structured database or single JSON array, both of which require a finalisation step that may be skipped on crash.

**5. Disposable profiles with quarantine option**

Disposable sessions store their Chromium user data directory under `.feather/tmp/sessions/<sessionId>/profile/`. On normal close the entire `tmp/sessions/<sessionId>/` tree is deleted. If the caller passes `quarantineDisposableProfile: true` in the close request, the profile directory is moved to `.feather/debug/<sessionId>/quarantined-profile/` instead, making it available for post-hoc inspection without leaving temporary state permanently on disk.

---

## Directory Structure

```
src/
├── index.ts                    # Entry point: wires config, paths, lock, workspace, manager, logger, HTTP server
├── config.ts                   # Reads FEATHER_PORT / FEATHER_HOST / FEATHER_DIR env vars
├── fs-layout.ts                # FeatherPaths factory + ensureDirs bootstrap
│
├── transport/
│   ├── http.ts                 # Fastify server init, token generation, endpoint.json writer
│   ├── middleware.ts           # injectRequestId and createTokenAuth Fastify hooks
│   └── routes.ts               # Route registration, Zod schemas, response envelope helpers
│
├── commands/
│   ├── handler.ts              # CommandHandler<TIn,TOut> interface + CommandContext type
│   ├── launch.ts               # LaunchSessionHandler — calls manager.launch()
│   ├── status.ts               # GetSessionHandler, ListSessionsHandler
│   ├── navigate.ts             # NavigateHandler — calls page.goto()
│   ├── snapshot.ts             # SnapshotHandler — evaluates innerText, links, meta description
│   ├── extract.ts              # ExtractHandler — runs structured field extraction recipe
│   ├── screenshot.ts           # ScreenshotHandler — calls page.screenshot()
│   ├── debug-bundle.ts         # DebugBundleHandler — triggers DebugBundle.finalize()
│   └── close.ts                # CloseSessionHandler — calls manager.close()
│
├── sessions/
│   ├── types.ts                # Shared types: BrowserMode, ProfileKind, SessionState, SessionRecord, etc.
│   ├── session.ts              # FeatherSession class: state machine, page map, toRecord()
│   └── manager.ts              # SessionManager: registry, launch/close orchestration, logging
│
├── profiles/
│   ├── lock.ts                 # ProfileLock: file-based workspace mutex, ProfileLockedError
│   └── workspace.ts            # WorkspaceMetadata: workspace.json read/write/ensureExists
│
├── browser/
│   └── modes.ts                # buildLaunchOptions: BrowserMode + proxy + viewport → Playwright options
│
├── logs/
│   ├── events.ts               # EVENTS catalog of 17 typed event-name constants
│   ├── logger.ts               # FeatherLogger: appends LogEvent as JSONL line per session
│   └── redact.ts               # redactProxy (ProxyConfig → ProxySummary), redactUrl
│
├── debug/
│   ├── capture.ts              # DebugCapture: attaches network/console/error listeners, finalizes to JSONL + trace.zip
│   └── bundle.ts               # DebugBundle: writes manifest.json enumerating all debug artifacts
│
└── measurement/
    ├── sampler.ts              # ProcessSampler: polls pids via pidusage at configurable interval
    ├── runner.ts               # MeasurementRunner: drives full launch→close scenario via HTTP API
    └── reporter.ts             # writeArtifacts: writes samples.jsonl, scenario.json, summary.json
```

---

## Known Tech Debt

**`routes.ts` — `manager as any` cast for four handlers**

`NavigateHandler`, `SnapshotHandler`, `ExtractHandler`, and `ScreenshotHandler` each define a local `IManager` interface whose `get()` method returns an object with `getPage(pageId?)` typed to return `{ pageId: string; page: Page }`. The concrete `SessionManager.get()` returns a `FeatherSession`, which does satisfy that shape at runtime, but TypeScript cannot verify this because `FeatherSession` is not declared to implement the handler's anonymous `IManager` interface. The workaround in `routes.ts` is four `manager as any` casts:

```typescript
const navigateHandler  = new NavigateHandler(manager as any);
const snapshotHandler  = new SnapshotHandler(manager as any);
const extractHandler   = new ExtractHandler(manager as any);
const screenshotHandler = new ScreenshotHandler(manager as any);
```

The correct fix is to either: (a) extract an `ISessionManager` interface in `sessions/manager.ts` that exactly matches what the handlers expect and have `SessionManager` implement it, or (b) move the `IManager` local interfaces out of each handler file into a shared contract file so all parties reference the same type. Until this is resolved, TypeScript provides no safety check that `SessionManager.getPage()` continues to satisfy the handler's expected shape across refactors.
