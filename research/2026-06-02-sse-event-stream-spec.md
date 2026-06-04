# SSE Event Stream Research — Phase 3

**Date**: 2026-06-02
**Topic**: `GET /v1/events` — thin SSE endpoint for browser lifecycle events

---

## 1. Plugin vs Raw Stream

### Decision: Use `fastify-sse-v2`

Feather runs Fastify 4.28.0. Three options were evaluated:

| Option | Verdict |
|---|---|
| `fastify-sse-v2` (third-party, TS-native) | **Use this** |
| `@fastify/sse` (official org plugin) | Older, less async-generator support |
| `reply.raw` manual stream | **Avoid** — bypasses Fastify hooks |

**Why `fastify-sse-v2`:**
- Written in TypeScript, types built-in
- Async generator pattern: clean for a push-style event bus
- Maintains Fastify's full hook chain — token auth middleware (`onRequest`) fires normally
- Configurable `retryDelay` and `highWaterMark`
- Simple disconnect cleanup via `request.socket.on('close', ...)`

**Why not `reply.raw`:**
- Bypasses `onRequest` hooks entirely — Feather's token auth would be silently skipped
- CORS headers not set
- Manual header + stream management

---

## 2. Event Schema

Each SSE message uses all four standard SSE fields:

```
id: <monotonic-counter>
event: <event-name>
data: <JSON string>
retry: 3000
```

### Events to emit

Only browser lifecycle events — not per-command operation events:

| Event name | Constant |
|---|---|
| `session.launch.requested` | `SESSION_LAUNCH_REQUESTED` |
| `session.launch.completed` | `SESSION_LAUNCH_COMPLETED` |
| `session.launch.failed` | `SESSION_LAUNCH_FAILED` |
| `session.close.requested` | `SESSION_CLOSE_REQUESTED` |
| `session.close.completed` | `SESSION_CLOSE_COMPLETED` |
| `session.close.failed` | `SESSION_CLOSE_FAILED` |
| `tab.opened` | `TAB_OPENED` |
| `tab.created` | `TAB_CREATED` |
| `tab.closed` | `TAB_CLOSED` |

**Excluded** (per-command operation events, not lifecycle):
- `page.navigate.*`, `page.snapshot.*`, `page.extract.*`, `page.screenshot.*`
- `debug.bundle.created`, `profile.lock.*`, `service.started`

### Data payload per event type

```jsonc
// session.launch.completed
{ "sessionId": "...", "workspaceId": "...", "mode": "workspace", "ts": "2026-06-02T..." }

// session.launch.failed
{ "sessionId": "...", "error": "...", "ts": "..." }

// session.close.completed / session.close.failed
{ "sessionId": "...", "ts": "..." }

// tab.opened / tab.created / tab.closed
{ "sessionId": "...", "pageId": "...", "ts": "..." }
```

---

## 3. Reconnection / Event-ID Model

### Decision: Monotonic counter, no server-side replay

The WHATWG SSE spec: client sends `Last-Event-ID` on reconnect; server can replay missed events.

For Feather's MVP local-only use case:
- **IDs**: monotonic integer counter (process-scoped, resets on server restart)
- **No replay**: on reconnect, client receives new events only — no buffering of past events
- **Rationale**: This is a local API for a future UI on the same machine. Network partitions don't apply. Missed events on UI reconnect are acceptable. Buffer adds complexity without real benefit at this stage.
- **retry field**: send `retry: 3000` (3 second client reconnect interval) — sensible for a local server

If replay is needed later (Phase 4 UI polish), the JSONL log on disk is the source of truth and can be tailed/replayed by event ID range.

---

## 4. Internal Bus Architecture

Current state: events go to JSONL logger only (Option C — no bus). SSE needs a way to receive events in-process.

### Decision: Lightweight in-process EventEmitter alongside JSONL logger

Add a module-level `EventEmitter` in `src/logs/bus.ts` (or directly in `events.ts`). The logger emits to JSONL **and** fires on the emitter. The SSE handler subscribes on connection and unsubscribes on disconnect.

```
emit(event, payload)
  ├── JSONL logger (existing)
  └── EventEmitter.emit(eventName, payload)   ← new
           └── SSE handler subscriber(s)
```

This is the minimal change to the existing architecture. No new top-level module, no pub/sub library. The emitter is only used by the SSE route — if zero clients are connected, zero listeners, zero overhead.

---

## 5. Endpoint Spec

```
GET /v1/events
Auth: X-Feather-Token (existing middleware applies)
Response headers:
  Content-Type: text/event-stream
  Cache-Control: no-cache
  Connection: keep-alive

On connect: sends a comment ping to flush headers
  : connected

On event:
  id: <counter>
  event: session.launch.completed
  data: {"sessionId":"...","ts":"..."}
  retry: 3000
  (blank line)

On disconnect: unsubscribe from EventEmitter, no-op
```

---

## 6. Implementation Steps

1. **`src/logs/bus.ts`** — export a module-level `EventEmitter` and a typed `emitBusEvent(name, payload)` helper
2. **`src/logs/logger.ts`** (or wherever `logEvent` lives) — call `emitBusEvent` alongside the JSONL write
3. **`src/commands/events.ts`** — SSE handler: subscribe to bus, push to `res.sse()` via async generator, cleanup on disconnect
4. **`src/transport/routes.ts`** — register `GET /v1/events` with token auth
5. **Tests** — unit test the bus emitter; integration test the SSE endpoint (connect, emit a known event, read from stream)

---

## Sources

- [fastify-sse-v2 README](https://github.com/mpetrunic/fastify-sse-v2/blob/master/README.md)
- [Avoid reply.raw — Liran Tal](https://lirantal.com/blog/avoid-fastify-reply-raw-and-reply-hijack-despite-being-a-powerful-http-streams-tool)
- [WHATWG SSE spec — Last-Event-ID](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [MDN — Using server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
- [@fastify/sse on npm](https://www.npmjs.com/package/@fastify/sse)
