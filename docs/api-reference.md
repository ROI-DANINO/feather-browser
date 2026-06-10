# Feather Browser HTTP API Reference

## Overview

Feather Browser exposes a localhost HTTP JSON API for controlling headless Chromium browser sessions.

- **Base URL:** `http://<host>:<port>` — the exact address is written to the endpoint file on startup (see `endpointFile` in the service paths layout)
- **API version prefix:** `/v1`
- **Content-Type:** All request and response bodies are `application/json`
- **Authentication:** Every `/v1/` endpoint requires a token passed in the `X-Feather-Token` request header
- **Request IDs:** Every response includes a `requestId` field of the form `req_<8-hex-chars>`, injected server-side per request. Use this field to correlate requests with server logs.

### Standard Response Envelope

All responses follow this envelope:

**Success:**
```json
{
  "ok": true,
  "requestId": "req_a1b2c3d4",
  "data": { ... }
}
```

**Error:**
```json
{
  "ok": false,
  "requestId": "req_a1b2c3d4",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description.",
    "details": [ ... ]
  }
}
```

The `details` field is only present on `VALIDATION_ERROR` responses (it contains the Zod validation error array).

---

## Authentication

The service generates a random 64-character hex token at startup and writes it to a token file (`paths.tokenFile()`). Callers must read that file and pass the token in every request to authenticated endpoints.

**Header:**

```
X-Feather-Token: <token>
```

If the header is absent or the token does not match, the server returns `401 UNAUTHORIZED`.

> The `GET /health` endpoint does **not** require authentication.

---

## Endpoints

### Health Check

#### `GET /health`

Returns service liveness. No authentication required.

**Request body:** none

**Response `data`:**

| Field | Type | Description |
|-------|------|-------------|
| `status` | `string` | Always `"ok"` |

**Example:**

```bash
curl http://localhost:4000/health
```

```json
{ "ok": true, "data": { "status": "ok" } }
```

Note: the health response omits `requestId` — it is the only endpoint that does not inject one.

---

### Sessions

#### `POST /v1/sessions` — Launch a session

Launches a new headless Chromium browser session.

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `profile` | object | Yes | Profile configuration (see below) |
| `profile.kind` | `"persistent"` \| `"disposable"` | Yes | Whether to use a persisted profile directory or a temporary one deleted on close |
| `workspaceId` | string | No | Caller-supplied workspace identifier attached to the session record |
| `browserMode` | `"chromium-new-headless"` \| `"chromium-headless-shell"` \| `"chromium-headed-cdp"` | No | Which Chromium binary/mode to use |
| `viewport` | object | No | Initial viewport size. In `chromium-headed-cdp` mode this sets the real OS **window** size via `--window-size` (content viewport ≈ window minus browser chrome) — Playwright viewport emulation is deliberately not used there, to keep the headed fingerprint faithful. Defaults to 1280×800 in all modes. |
| `viewport.width` | number | Yes (if `viewport` present) | Viewport width in pixels |
| `viewport.height` | number | Yes (if `viewport` present) | Viewport height in pixels |
| `proxy` | object \| `null` | No | Proxy configuration; pass `null` to explicitly disable. **Not applied in `chromium-headed-cdp` mode** — supplying one there logs a `session.option.ignored` warning instead of silently dropping it |
| `proxy.server` | string | Yes (if `proxy` present) | Proxy server URL (e.g. `"http://proxy.example.com:8080"`) |
| `proxy.username` | string | No | Proxy authentication username |
| `proxy.password` | string | No | Proxy authentication password |
| `proxy.bypass` | string | No | Comma-separated list of hosts to bypass the proxy |
| `debug` | object | No | Debug recording options |
| `debug.trace` | boolean | No | Enable Playwright trace recording |
| `debug.screenshots` | boolean | No | Enable automatic debug screenshots |

**Response `data`:** A `SessionRecord` object.

| Field | Type | Description |
|-------|------|-------------|
| `sessionId` | string | Unique session identifier |
| `workspaceId` | string | Workspace identifier (defaults to a generated value if not supplied) |
| `profileKind` | `"persistent"` \| `"disposable"` | Profile kind used |
| `browserMode` | `"chromium-new-headless"` \| `"chromium-headless-shell"` \| `"chromium-headed-cdp"` | Browser mode in use |
| `state` | `"launching"` \| `"running"` \| `"closing"` \| `"closed"` \| `"failed"` | Current session lifecycle state |
| `profilePath` | string | Absolute path to the browser profile directory |
| `debugDir` | string | Absolute path to the session debug artifact directory |
| `proxy` | `ProxySummary` \| `null` | Sanitised proxy info (credentials are not echoed back) |
| `proxy.server` | string | Proxy server URL |
| `proxy.hasCredentials` | boolean | Whether credentials were provided (password is never returned) |
| `proxy.bypass` | string | Bypass list, if provided |
| `startedAt` | string (ISO 8601) | Session start timestamp |
| `pages` | `PageInfo[]` | List of open pages |
| `pages[].pageId` | string | Page identifier |
| `pages[].url` | string | Current page URL |
| `pages[].title` | string | Current page title |
| `profileLocked` | boolean | Whether the profile directory is currently locked by another session |

**Error responses:**

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Request body fails schema validation |
| 409 | `PROFILE_LOCKED` | The requested persistent profile is already in use by another session |
| 500 | `INTERNAL_ERROR` | Unexpected server-side error |

**Example:**

```bash
curl -s -X POST http://localhost:4000/v1/sessions \
  -H "X-Feather-Token: $(cat /path/to/token)" \
  -H "Content-Type: application/json" \
  -d '{
    "profile": { "kind": "disposable" },
    "browserMode": "chromium-new-headless",
    "viewport": { "width": 1280, "height": 800 }
  }'
```

---

#### `GET /v1/sessions` — List all sessions

Returns all active sessions.

**Request body:** none

**Response `data`:** Array of `SessionRecord` objects (same schema as the launch response `data` field).

**Error responses:**

| Status | Code | When |
|--------|------|------|
| 500 | `INTERNAL_ERROR` | Unexpected server-side error |

**Example:**

```bash
curl -s http://localhost:4000/v1/sessions \
  -H "X-Feather-Token: $(cat /path/to/token)"
```

---

#### `GET /v1/sessions/:sessionId` — Get a session

Returns the `SessionRecord` for a single session.

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sessionId` | string | Session identifier returned by the launch endpoint |

**Request body:** none

**Response `data`:** A `SessionRecord` object (same schema as the launch response).

**Error responses:**

| Status | Code | When |
|--------|------|------|
| 404 | `SESSION_NOT_FOUND` | No session exists with the given `sessionId` |
| 500 | `INTERNAL_ERROR` | Unexpected server-side error |

**Example:**

```bash
curl -s http://localhost:4000/v1/sessions/ses_abc123 \
  -H "X-Feather-Token: $(cat /path/to/token)"
```

---

#### `DELETE /v1/sessions/:sessionId` — Close a session

Closes a browser session and cleans up associated resources. For `disposable` profiles, the profile directory is deleted unless `quarantineDisposableProfile` is set.

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sessionId` | string | Session identifier |

**Request body (optional — defaults to `{}`):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `force` | boolean | No | If `true`, forcibly terminates the browser process without a graceful shutdown |
| `quarantineDisposableProfile` | boolean | No | If `true`, the disposable profile directory is preserved (quarantined) rather than deleted |

**Response `data`:**

| Field | Type | Description |
|-------|------|-------------|
| `sessionId` | string | The closed session's identifier |
| `state` | `"closed"` | Always `"closed"` on success |

**Error responses:**

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Request body fails schema validation |
| 404 | `SESSION_NOT_FOUND` | No session exists with the given `sessionId` |
| 500 | `INTERNAL_ERROR` | Unexpected server-side error |

**Example:**

```bash
curl -s -X DELETE http://localhost:4000/v1/sessions/ses_abc123 \
  -H "X-Feather-Token: $(cat /path/to/token)" \
  -H "Content-Type: application/json" \
  -d '{ "force": false }'
```

---

### Tab Management

#### `POST /v1/sessions/:sessionId/tabs` — Open a new tab

Opens a new page (tab) within an existing running session's `BrowserContext`. The new tab shares the session's cookies, storage, and trust context — this is the Cookie Mine entry point for agents piggybacking on a human browser session. The session must be in the `running` state.

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sessionId` | string | Session identifier of the running session to open a tab in |

**Request body:** none (empty body accepted)

**Response `data`:**

| Field | Type | Description |
|-------|------|-------------|
| `pageId` | string | Unique page identifier for the new tab (use this in subsequent navigate/snapshot/etc. calls) |
| `url` | string | Current URL of the new tab (`about:blank` on creation) |
| `title` | string | Page title of the new tab (empty string on creation) |

**Error responses:**

| Status | Code | When |
|--------|------|------|
| 404 | `SESSION_NOT_FOUND` | No session exists with the given `sessionId` |
| 409 | `SESSION_NOT_RUNNING` | The session exists but is not in the `running` state (e.g. closing or failed) |
| 500 | `INTERNAL_ERROR` | Unexpected server-side error |

**Example:**

```bash
# Open a new tab in an existing session
curl -s -X POST http://localhost:4000/v1/sessions/ses_abc123/tabs \
  -H "X-Feather-Token: $(cat /path/to/token)"

# Then navigate that tab to a URL
curl -s -X POST http://localhost:4000/v1/sessions/ses_abc123/navigate \
  -H "X-Feather-Token: $(cat /path/to/token)" \
  -H "Content-Type: application/json" \
  -d '{"pageId": "page_xyz789", "url": "https://example.com"}'
```

---

#### `GET /v1/sessions/:sessionId/tabs` — List open tabs

Enumerates every open tab in the session, including tabs spawned by page-side actions (a
`target="_blank"` link click, `window.open`). This is the **ground truth for tab discovery**: a
click that opens a new tab returns `clicked: true` (plus a best-effort `newPageId` when the event
lands in the click window) without navigating the active page — list the tabs to find the new page.

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sessionId` | string | Session identifier |

**Response `data`:**

| Field | Type | Description |
|-------|------|-------------|
| `sessionId` | string | The session identifier |
| `pages` | `PageInfo[]` | All open tabs |
| `pages[].pageId` | string | Page identifier |
| `pages[].url` | string | Current page URL |
| `pages[].title` | string | Current page title |
| `pages[].loadState` | string | Current page load state |

**Error responses:**

| Status | Code | When |
|--------|------|------|
| 404 | `SESSION_NOT_FOUND` | No session exists with the given `sessionId` |

**Example:**

```bash
curl -s http://localhost:4000/v1/sessions/ses_abc123/tabs \
  -H "X-Feather-Token: $(cat /path/to/token)"
```

---

#### `GET /v1/sessions/:sessionId/health` — Session health probe

Answers "is the browser actually alive?" in one call, so a coordinator can distinguish *my agent
died* from *the browser died* after a failure. `alive: true` means the session's default page
answered a `title()` round-trip within ~2 s.

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sessionId` | string | Session identifier |

**Response `data`:**

| Field | Type | Description |
|-------|------|-------------|
| `sessionId` | string | The session identifier |
| `state` | string | Session lifecycle state (`running`, `closing`, …) |
| `pages` | number | Count of open tabs |
| `alive` | boolean | Whether the browser answered the probe (always `false` when not `running`) |

**Error responses:**

| Status | Code | When |
|--------|------|------|
| 404 | `SESSION_NOT_FOUND` | No session exists with the given `sessionId` |

**Example:**

```bash
curl -s http://localhost:4000/v1/sessions/ses_abc123/health \
  -H "X-Feather-Token: $(cat /path/to/token)"
```

---

#### `DELETE /v1/sessions/:sessionId/tabs/:pageId` — Close a tab

Closes a single tab within an existing session without ending the session. Refuses to close the last remaining tab — use `DELETE /v1/sessions/:sessionId` to end the session instead.

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sessionId` | string | Session identifier |
| `pageId` | string | Page identifier of the tab to close |

**Request body:** none

**Response `data`:**

| Field | Type | Description |
|-------|------|-------------|
| `sessionId` | string | The session identifier |
| `closedPageId` | string | The identifier of the tab that was closed |
| `pages` | `PageInfo[]` | Remaining open tabs after the close |
| `pages[].pageId` | string | Page identifier |
| `pages[].url` | string | Current page URL |
| `pages[].title` | string | Current page title |
| `pages[].loadState` | string | Current page load state |

**Error responses:**

| Status | Code | When |
|--------|------|------|
| 404 | `PAGE_NOT_FOUND` | No tab with the given `pageId` exists in this session |
| 404 | `SESSION_NOT_FOUND` | No session exists with the given `sessionId` |
| 409 | `CANNOT_CLOSE_LAST_TAB` | The tab is the only remaining tab — close the session instead |
| 500 | `INTERNAL_ERROR` | Unexpected server-side error |

**Example:**

```bash
# Close a specific tab; inspect the remaining pages list
curl -s -X DELETE http://localhost:4000/v1/sessions/ses_abc123/tabs/page_xyz789 \
  -H "X-Feather-Token: $(cat /path/to/token)"
```

```json
{
  "ok": true,
  "requestId": "req_a1b2c3d4",
  "data": {
    "sessionId": "ses_abc123",
    "closedPageId": "page_xyz789",
    "pages": [
      { "pageId": "page_def456", "url": "https://example.com", "title": "Example", "loadState": "load" }
    ]
  }
}
```

---

### Page Actions

All page action endpoints accept an optional `pageId` field. If omitted, the session's first (default) page is used. When a session has multiple tabs (opened via `POST /v1/sessions/:sessionId/tabs`), always specify `pageId` explicitly to target the correct tab.

---

#### `POST /v1/sessions/:sessionId/navigate` — Navigate to URL

Navigates the browser page to a given URL and waits for the specified load event.

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sessionId` | string | Session identifier |

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string (URL) | Yes | The URL to navigate to. Must be a valid URL. |
| `pageId` | string | No | Target page within the session; defaults to the first page |
| `waitUntil` | `"load"` \| `"domcontentloaded"` \| `"networkidle"` \| `"commit"` | No | Navigation wait condition (Playwright semantics) |
| `timeoutMs` | integer (> 0) | No | Navigation timeout in milliseconds |

**Response `data`:**

| Field | Type | Description |
|-------|------|-------------|
| `pageId` | string | The resolved page identifier |
| `url` | string | The final URL after navigation (may differ from request `url` due to redirects) |
| `status` | integer \| `null` | HTTP response status code; `null` if no network response was received |

**Error responses:**

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | `url` is missing or not a valid URL, or other schema violation |
| 404 | `SESSION_NOT_FOUND` | No session exists with the given `sessionId` |
| 404 | `PAGE_NOT_FOUND` | No page found for the given `pageId` |
| 500 | `INTERNAL_ERROR` | Unexpected server-side error (including navigation timeout) |

**Example:**

```bash
curl -s -X POST http://localhost:4000/v1/sessions/ses_abc123/navigate \
  -H "X-Feather-Token: $(cat /path/to/token)" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "waitUntil": "networkidle",
    "timeoutMs": 15000
  }'
```

---

#### `POST /v1/sessions/:sessionId/snapshot` — Take a page snapshot

Extracts a text snapshot of the current page, including body text, all hyperlinks, and the `<meta name="description">` tag. Also generates a clean Markdown representation of the page, suitable for LLM context.

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sessionId` | string | Session identifier |

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pageId` | string | No | Target page; defaults to the first page |
| `limits` | object | No | Output size limits (schema-level; see note) |
| `limits.textChars` | integer (> 0) | No | Maximum number of characters for the `text` field |
| `limits.links` | integer (> 0) | No | Maximum number of links in the `links` array |

> **Note on limits:** The `limits` fields in the request body are validated by the schema but the current handler implementation applies fixed internal limits of 20,000 characters for text and 200 links, regardless of what is passed. The response `limits` object reflects the values actually applied.

**Response `data`:**

| Field | Type | Description |
|-------|------|-------------|
| `pageId` | string | The resolved page identifier |
| `url` | string | The current page URL |
| `title` | string | The page title |
| `text` | string | Extracted `document.body.innerText`, truncated to the active limit |
| `links` | array | Array of link objects from `document.links` |
| `links[].text` | string | Visible link text (trimmed) |
| `links[].href` | string | Resolved absolute `href` |
| `meta.description` | string | Content of `<meta name="description">`, or `""` if absent |
| `limits.textChars` | integer | The text character limit that was applied (`20000`) |
| `limits.links` | integer | The links count limit that was applied (`200`) |
| `markdown` | string | Clean Markdown of the page content — boilerplate (nav, header, footer) stripped; headings, links, lists, code blocks preserved |
| `limits.markdownChars` | integer | The markdown character limit applied (`20000`) |

**Error responses:**

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Request body fails schema validation |
| 404 | `SESSION_NOT_FOUND` | No session exists with the given `sessionId` |
| 404 | `PAGE_NOT_FOUND` | No page found for the given `pageId` |
| 500 | `INTERNAL_ERROR` | Unexpected server-side error |

**Example:**

```bash
curl -s -X POST http://localhost:4000/v1/sessions/ses_abc123/snapshot \
  -H "X-Feather-Token: $(cat /path/to/token)" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

#### `POST /v1/sessions/:sessionId/observe` — Observe actionable elements

Returns numbered, actionable elements on the current page, first-class overlay detection, and a
change-diff vs the previous observe on this page. This is the primary perception primitive for
acting — use refs from the response as `{ "by": "ref", "ref": "obs_a1b2.e0" }` targets in
subsequent commands.

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sessionId` | string | Session identifier |

**Request body (optional — defaults to `{}`):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pageId` | string | No | Target page; defaults to the first page |
| `cap` | integer (> 0) | No | Maximum number of elements to return (default 80). Elements are sorted actionable-first; excess elements are dropped and their handles disposed. |
| `viewportOnly` | boolean | No | If `true`, offscreen elements are excluded before applying `cap` (default `false`) |
| `includeText` | boolean | No | If `true`, appends the page's `document.body.innerText` (truncated to 4000 chars) as the `text` field (default `false`). Prefer `snapshot` for reading tasks. |

**Response `data`:**

| Field | Type | Description |
|-------|------|-------------|
| `pageId` | string | The resolved page identifier |
| `url` | string | Current page URL |
| `title` | string | Current page title |
| `observeId` | string | Identity token for this observe (e.g. `obs_a1b2`). Passed internally to compute the diff on the next observe; not needed by callers. |
| `actions` | `ObserveAction[]` | Actionable elements, sorted: `actionable` → `covered` → `disabled` → `offscreen`, in-viewport first within each state |
| `actions[].ref` | string | Observe-scoped ref (e.g. `obs_a1b2.e0`, `obs_a1b2.e1`) — valid only until the next `observe` on this page or a navigation. Copy verbatim; never hand-construct. |
| `actions[].role` | string \| null | ARIA role, or `null` if none |
| `actions[].name` | string | Accessible name (from `aria-label` → `placeholder` → `<label>` → `name`/`title` → `innerText`). **Never `el.value`** — typed passwords are never leaked. |
| `actions[].tag` | string | HTML tag name in uppercase (e.g. `"BUTTON"`, `"INPUT"`) |
| `actions[].box` | object | Bounding box: `{ x, y, w, h }` in pixels |
| `actions[].state` | `"actionable"` \| `"covered"` \| `"disabled"` \| `"offscreen"` | Interactability state |
| `actions[].occludedBy` | object \| undefined | Present when `state` is `"covered"`: `{ kind: "overlay" \| "iframe" \| "element", name?: string }` |
| `actions[].overlayIndex` | number \| undefined | When present, this element is contained inside `overlays[overlayIndex]` — it is part of that popup. Elements inside a **same-origin iframe** whose `<iframe>` element is (or sits inside) a detected overlay inherit that overlay's index, so `dismiss` can reach them. |
| `overlays` | `Overlay[]` | Viewport-covering fixed/absolute layers detected on the page |
| `overlays[].kind` | `"modal"` \| `"banner"` \| `"iframe"` | Overlay type |
| `overlays[].name` | string | Name / text content of the overlay (truncated to 60 chars) |
| `overlays[].coverPct` | number | Percentage of the viewport covered (0–100) |
| `overlays[].blocking` | boolean | `true` if `coverPct >= 60` |
| `diff` | object \| null | Change-diff vs the previous observe on this page. `null` on the first observe after navigation or session start. |
| `diff.added` | array | Elements present now but not before: `[{ ref, desc }]` |
| `diff.removed` | array | Elements present before but gone now: `[{ desc }]` |
| `diff.changed` | array | Same-signature elements whose state or name changed: `[{ ref, change, was }]` |
| `text` | string | (Only present when `includeText: true`) First 4000 chars of `document.body.innerText` |
| `stats` | object | `{ totalInteractive, returned, elapsedMs }` — total interactive elements found, how many were returned after capping, and elapsed time |

**Notes:**
- `observe` is **read-only** — it fires no events, mutates no DOM, and leaks no input values.
- The per-page observe cache is cleared on navigation (`framenavigated`) and on tab close, so refs
  are always scoped to the current page state.
- A non-HTML page (`about:blank`, PDF) returns empty `actions`/`overlays` and `diff: null` — not an error.

**Error responses:**

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Request body fails schema validation |
| 404 | `SESSION_NOT_FOUND` | No session exists with the given `sessionId` |
| 404 | `PAGE_NOT_FOUND` | No page found for the given `pageId` |
| 500 | `INTERNAL_ERROR` | Unexpected server-side error |

**Example:**

```bash
curl -s -X POST http://localhost:4000/v1/sessions/ses_abc123/observe \
  -H "X-Feather-Token: $(cat /path/to/token)" \
  -H "Content-Type: application/json" \
  -d '{}'
```

```jsonc
{
  "ok": true,
  "requestId": "req_a1b2c3d4",
  "data": {
    "pageId": "pg_1",
    "url": "https://example.com/login",
    "title": "Log in",
    "observeId": "obs_a1b2",
    "actions": [
      { "ref": "obs_a1b2.e0", "role": "textbox", "name": "Email", "tag": "INPUT",
        "box": { "x": 40, "y": 120, "w": 268, "h": 38 }, "state": "actionable" },
      { "ref": "obs_a1b2.e1", "role": "button", "name": "Log in", "tag": "BUTTON",
        "box": { "x": 40, "y": 180, "w": 268, "h": 44 }, "state": "actionable" }
    ],
    "overlays": [],
    "diff": null,
    "stats": { "totalInteractive": 5, "returned": 2, "elapsedMs": 42 }
  }
}
```

---

#### `POST /v1/sessions/:sessionId/dismiss` — Dismiss an overlay (opt-in)

Runs an internal `observe`, matches elements against an affirmative-dismiss label list, and clicks
the best match by ref. Only acts when the internal observe detects an overlay — safe to call
speculatively. Returns an empty `dismissed` array (not an error) when nothing matched.

This is the successor to the hardcoded `dismiss_got_it` approach. It is opt-in and separate from
`observe` so that `observe` stays strictly read-only.

**Security scoping:** only considers elements that the internal observe flagged as overlay-related
(inside or occluded by an overlay). It never clicks arbitrary page buttons. Affirmative labels only
(`Accept all`, `I agree`, `Allow all`, `Got it`, `Accept`, `Close`, `Continue`) unless `labels` is
overridden.

**Cost:** dismiss runs up to two full observes internally (baseline + verify), so it costs ~2× an observe on dense pages — budget accordingly.

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sessionId` | string | Session identifier |

**Request body (optional — defaults to `{}`):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pageId` | string | No | Target page; defaults to the first page |
| `labels` | string[] | No | Override the default affirmative-dismiss label list. Each entry is matched case-insensitively as an exact match or prefix of the element name. |

**Response `data`:**

| Field | Type | Description |
|-------|------|-------------|
| `pageId` | string | The resolved page identifier |
| `dismissed` | array | Overlays verified gone after the click: `[{ ref: string, name: string }]`. Empty when no matching overlay/label was found. Only overlays confirmed absent in the post-click re-observe appear here — a click that fails but the overlay vanishes still counts. |
| `overlaysRemaining` | number | Count of overlays still present in the post-click re-observe (or the baseline count when nothing was clicked). `> 0` means another wall is up — call dismiss again (one wall per call) or pass different `labels`. This is the ground truth for "am I clear"; trust it over `dismissed.length` alone (on multi-pane popups whose label text changes between panes, `dismissed` can misjudge). |
| `observation` | object | Full, fresh `ObserveResult` from the internal post-click re-observe. Any refs from before the dismiss call are expired; act from `observation`'s refs — no need to call `observe` again after dismiss. When nothing was clicked, `observation` is the baseline observe. |

**Error responses:**

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Request body fails schema validation |
| 404 | `SESSION_NOT_FOUND` | No session exists with the given `sessionId` |
| 404 | `PAGE_NOT_FOUND` | No page found for the given `pageId` |
| 500 | `INTERNAL_ERROR` | Unexpected server-side error |

**Example:**

```bash
# Dismiss a cookie consent banner (no-op if no overlay present)
curl -s -X POST http://localhost:4000/v1/sessions/ses_abc123/dismiss \
  -H "X-Feather-Token: $(cat /path/to/token)" \
  -H "Content-Type: application/json" \
  -d '{}'
```

```json
{
  "ok": true,
  "requestId": "req_a1b2c3d4",
  "data": {
    "pageId": "pg_1",
    "dismissed": [{ "ref": "obs_a1b2.e3", "name": "Accept all" }],
    "overlaysRemaining": 0,
    "observation": {
      "pageId": "pg_1",
      "url": "https://example.com/",
      "title": "Example",
      "observeId": "obs_c3d4",
      "actions": [],
      "overlays": [],
      "diff": { "added": [], "removed": [{ "desc": "Accept all" }], "changed": [] },
      "stats": { "totalInteractive": 3, "returned": 3, "elapsedMs": 38 }
    }
  }
}
```

---

#### `POST /v1/sessions/:sessionId/extract` — Extract structured data

Runs a field-extraction recipe against the current page using CSS selectors. Each field reads text content, an element attribute, or an input's current value from the first matching element.

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sessionId` | string | Session identifier |

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pageId` | string | No | Target page; defaults to the first page |
| `recipe` | object | Yes* | Extraction recipe. *Ergonomic fallback: a body with `fields` at the top level (no `recipe` wrapper) is accepted and wrapped automatically |
| `recipe.fields` | object | Yes | Map of field name → field descriptor |
| `recipe.fields.<name>.selector` | string | Yes | CSS selector for the target element |
| `recipe.fields.<name>.type` | `"text"` \| `"attribute"` \| `"value"` | No | What to extract. Defaults to `"text"`; inferred as `"attribute"` when an `attribute` name is present. `"value"` reads an input/textarea/select's **current value** (invisible to text reads) — yields `null` on non-input elements |
| `recipe.fields.<name>.attribute` | string | No (required when `type` is explicitly `"attribute"`) | Attribute name to read (e.g. `"href"`, `"src"`) |
| `recipe.limits` | object | No | Output limits |
| `recipe.limits.items` | integer (> 0) | No | Reserved for future multi-result extraction; currently ignored (the first matching element is always used) |
| `recipe.limits.textChars` | integer (> 0) | No | Truncates extracted text values to this many characters |

**Response `data`:**

A flat object where each key matches a field name from `recipe.fields`. Values are `string | null` — `null` means no element matched the selector or the requested attribute was absent.

Example:
```json
{
  "title": "Buy Widgets Online",
  "price": "$9.99",
  "imageUrl": "https://example.com/img/widget.png",
  "outOfStock": null
}
```

**Error responses:**

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Request body fails schema validation |
| 404 | `SESSION_NOT_FOUND` | No session exists with the given `sessionId` |
| 404 | `PAGE_NOT_FOUND` | No page found for the given `pageId` |
| 500 | `INTERNAL_ERROR` | Unexpected server-side error |

**Example:**

```bash
curl -s -X POST http://localhost:4000/v1/sessions/ses_abc123/extract \
  -H "X-Feather-Token: $(cat /path/to/token)" \
  -H "Content-Type: application/json" \
  -d '{
    "recipe": {
      "fields": {
        "heading": { "selector": "h1", "type": "text" },
        "canonicalUrl": { "selector": "link[rel=canonical]", "type": "attribute", "attribute": "href" }
      },
      "limits": { "textChars": 500 }
    }
  }'
```

---

### Input (acting on a page)

All input commands locate elements with a shared **Target** object. The `by` field selects the
locator strategy; use `{ "by": "ref" }` when you have a ref from a recent `observe`.

**Target union:**

| `by` value | Extra fields | `at` allowed? | Notes |
|-----------|--------------|---------------|-------|
| `"ref"` | `ref: string` | No | Opaque observe-scoped token (format `<observeId>.e<i>`, e.g. `obs_a1b2.e0`) — copy it verbatim from the most recent `observe`. Fastest + most robust. Expires on the next `observe` or navigation (`REF_EXPIRED`); a stale ref never resolves to a different element. |
| `"role"` | `role: string`, `name?: string`, `exact?: boolean` | Yes | ARIA role |
| `"text"` | `text: string`, `exact?: boolean` | Yes | Visible text |
| `"placeholder"` | `text: string` | Yes | Input placeholder |
| `"testid"` | `testId: string` | Yes | `data-testid` attribute |
| `"css"` | `selector: string` | Yes | CSS selector |

The `at` field (`"first"` \| `"last"` \| number) selects among multiple matches (default `"first"`).
It is not valid with `by="ref"` (refs are already single elements).

**Legacy field-by-field view** (for reference):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `by` | `"ref"` \| `"role"` \| `"text"` \| `"placeholder"` \| `"testid"` \| `"css"` | Yes | Locator strategy |
| `ref` | string | Yes (if `by="ref"`) | Element ref from the most recent `observe` response |
| `role` | string | Yes (if `by="role"`) | ARIA role, e.g. `"button"` |
| `name` | string | No (`by="role"`) | Accessible name to match |
| `text` | string | Yes (if `by="text"` or `"placeholder"`) | Visible text / placeholder text |
| `testId` | string | Yes (if `by="testid"`) | Value of the `data-testid` attribute |
| `selector` | string | Yes (if `by="css"`) | CSS selector |
| `exact` | boolean | No (`role`/`text`) | Exact (not substring) match |
| `at` | `"first"` \| `"last"` \| number | No | Which match to use when several match (default `"first"`); not valid with `by="ref"` |

#### `POST /v1/sessions/:sessionId/click` — Click an element

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sessionId` | string | Session identifier |

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `target` | Target | Yes | Element to click |
| `pageId` | string | No | Page to act on (defaults to the active page) |
| `timeoutMs` | number | No | Action timeout (default 15000) |

**Response `data`:**

| Field | Type | Description |
|-------|------|-------------|
| `pageId` | string | The resolved page identifier |
| `clicked` | `true` | Always `true` on success |
| `navigated` | `true` \| undefined | Present when the click triggered a page navigation and the element/context was torn down before Playwright could confirm completion. This is a hint, never a promise — re-observe and verify the screen before continuing. Previously these cases surfaced as `INTERNAL_ERROR` 500. |
| `newPageId` | string \| undefined | Present when the click spawned a new tab (e.g. a `target="_blank"` link) **and** the new-page event landed inside the click window. **Strictly best-effort** — the event usually arrives after the click response, so absence proves nothing. `GET /v1/sessions/:sessionId/tabs` is the ground truth for tab discovery (same signal-vs-ground-truth pattern as `/dismiss`). |

**Error responses:**

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Request body / target fails schema validation |
| 404 | `ELEMENT_NOT_FOUND` | No element matched the target |
| 409 | `ELEMENT_NOT_ACTIONABLE` | Target matched but the action timed out (covered, disabled, off-screen) |

---

#### `POST /v1/sessions/:sessionId/type` — Type text into a field

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sessionId` | string | Session identifier |

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `target` | Target | Yes | Field to type into (`<input>`, `<textarea>`, or `[contenteditable]`) |
| `text` | string | Yes | Text to enter |
| `mode` | `"fill"` \| `"sequential"` | No | `fill` (default) clears + sets; `sequential` types key-by-key (for editors that ignore `fill`) |
| `delayMs` | number | No | Per-keystroke delay in milliseconds (sequential only) |
| `pageId` | string | No | Page to act on (defaults to the active page) |
| `timeoutMs` | number | No | Action timeout (default 15000) |

**Response `data`:** `{ "pageId": string, "typed": true }`

**Error responses:**

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Request body / target fails schema validation |
| 404 | `ELEMENT_NOT_FOUND` | No element matched the target |
| 409 | `ELEMENT_NOT_ACTIONABLE` | Target matched but the action timed out (covered, disabled, off-screen) |

---

#### `POST /v1/sessions/:sessionId/press` — Press a key

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sessionId` | string | Session identifier |

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | string | Yes | Playwright key name, e.g. `"Enter"`, `"Tab"`, `"Control+A"` |
| `target` | Target | No | Element to focus first; omit to press on the currently focused element |
| `pageId` | string | No | Page to act on (defaults to the active page) |
| `timeoutMs` | number | No | Action timeout when `target` is provided (default 15000) |

**Response `data`:**

| Field | Type | Description |
|-------|------|-------------|
| `pageId` | string | The resolved page identifier |
| `pressed` | string | The key that was pressed |
| `navigated` | `true` \| undefined | Present when the key press triggered a page navigation and the element/context was torn down before Playwright could confirm completion (e.g. Enter in a form). This is a hint, never a promise — re-observe and verify the screen before continuing. |

**Error responses:**

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Request body / target fails schema validation |
| 404 | `ELEMENT_NOT_FOUND` | No element matched the target |
| 409 | `ELEMENT_NOT_ACTIONABLE` | Target matched but the action timed out (covered, disabled, off-screen) |

---

#### `POST /v1/sessions/:sessionId/select-option` — Select options in a `<select>` element

Selects one or more options in a native `<select>` dropdown element.

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sessionId` | string | Session identifier |

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `target` | Target | Yes | The `<select>` element to drive |
| `values` | string \| string[] | Yes | Option value(s) to select — matched against option `value` attributes |
| `pageId` | string | No | Page to act on (defaults to the active page) |
| `timeoutMs` | number | No | Action timeout in milliseconds (default 15000) |

**Response `data`:**

| Field | Type | Description |
|-------|------|-------------|
| `pageId` | string | The resolved page identifier |
| `selected` | string[] | Values of the options that were actually selected (as confirmed by Playwright). When `navigated: true` is also present, this echoes the requested values, unverified — the page navigated before Playwright could confirm selection. |
| `navigated` | `true` \| undefined | Present when selecting the option triggered a page navigation and the element/context was torn down before Playwright could confirm completion (e.g. `onchange` redirect). This is a hint, never a promise — re-observe and verify the screen before continuing. |

**Error responses:**

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Request body / target fails schema validation |
| 404 | `ELEMENT_NOT_FOUND` | No element matched the target |
| 409 | `ELEMENT_NOT_ACTIONABLE` | Target matched but the action timed out (covered, disabled, off-screen) |

---

#### `POST /v1/sessions/:sessionId/wait` — Wait for an element or for text to settle

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sessionId` | string | Session identifier |

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `target` | Target | Yes | Element to watch |
| `until` | `"visible"` \| `"hidden"` \| `"attached"` \| `"detached"` \| `"stable"` | Yes | Condition to wait for |
| `quietMs` | number | No | (`stable`) settle once text is unchanged this long (default 1500) |
| `pollMs` | number | No | (`stable`) poll interval in milliseconds (default 250) |
| `pageId` | string | No | Page to act on (defaults to the active page) |
| `timeoutMs` | number | No | Overall timeout (default 15000; `stable` default 30000) |

**Response `data`:** `{ "pageId": string, "matched": true }` for element states (`visible`/`hidden`/`attached`/`detached`), or
`{ "pageId": string, "settled": true, "elapsedMs": number, "text": string }` for `until="stable"`.

**Error responses:**

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Request body / target fails schema validation |
| 404 | `ELEMENT_NOT_FOUND` | No element matched the target |
| 408 | `WAIT_TIMEOUT` | `wait` condition not met within the timeout |
| 409 | `ELEMENT_NOT_ACTIONABLE` | Target matched but the action timed out (covered, disabled, off-screen) |

---

#### `POST /v1/sessions/:sessionId/await-human` — Pause until a human completes a step

Blocks until the human clicks the Resume link, an optional `resumeOn` element reaches its state, or
`timeoutMs` elapses. Use for walls only a human can clear (CAPTCHA, "confirm you're human").

> **Long-running.** Set your HTTP client timeout above `timeoutMs` (default 300000 ms / 5 min).

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sessionId` | string | Session identifier |

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | string | Yes | Human-facing instruction, shown on the Resume page and emitted on the event stream |
| `resumeOn` | `{ target: Target, until: "visible" \| "hidden" \| "attached" \| "detached" }` | No | Auto-resume when this element reaches the given state (same `target` shapes as `wait`) |
| `timeoutMs` | number | No | Overall timeout (default 300000) |
| `pageId` | string | No | Page to act on (defaults to the active page) |

**Response `data`:** `{ "pageId": string, "resumedBy": "human" \| "signal" \| "timeout", "elapsedMs": number }`.
A `"timeout"` is a normal result, not an error — re-prompt or retry as needed.

**Events:** on pause, `human.pause.requested` carries `{ reason, resumePath }` on `GET /v1/events`; on
resolution, `human.pause.resolved` carries `{ resumedBy }`. Compose the absolute Resume URL by prefixing
`resumePath` with `baseUrl` from `endpoint.json`, and show it to the human.

---

#### `GET /v1/sessions/:sessionId/resume?token=<one-time>` — Resume page (human-facing)

**No API token.** Authorised by the single-use `token` minted by `await-human`. Serves a small local
HTML page with the `reason` and a Resume button. A missing/used/unknown token renders a friendly
"already resumed or expired" page.

#### `POST /v1/sessions/:sessionId/resume?token=<one-time>` — Confirm resume (human-facing)

**No API token.** The Resume button's action. Validates and consumes the single-use `token`, ends the
matching pause, and renders a confirmation. Idempotent: a reused/expired token renders the
"already resumed" page. The token is session-scoped — a mismatched `sessionId` is rejected.

---

#### `POST /v1/sessions/:sessionId/screenshot` — Take a screenshot

Captures a PNG screenshot of the current page and saves it to the session's debug directory.

> **The response is an artifact descriptor (JSON), not image bytes.** Read the PNG from the
> returned `path` (e.g. with your file-read tool) — don't `curl -o image.png` this endpoint.
> Screenshot-then-read is the sanctioned **vision fallback** when structured reads (`snapshot` /
> `observe`) overflow or the answer is inherently visual.

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sessionId` | string | Session identifier |

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pageId` | string | No | Target page; defaults to the first page |
| `fullPage` | boolean | No | If `true`, captures the full scrollable page height; defaults to viewport only |

**Response `data`:**

| Field | Type | Description |
|-------|------|-------------|
| `artifactId` | string | Unique artifact identifier of the form `art_<10-char-hex>` |
| `path` | string | Absolute server-side filesystem path to the saved PNG file |
| `mimeType` | string | Always `"image/png"` |

**Error responses:**

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Request body fails schema validation |
| 404 | `SESSION_NOT_FOUND` | No session exists with the given `sessionId` |
| 404 | `PAGE_NOT_FOUND` | No page found for the given `pageId` |
| 500 | `INTERNAL_ERROR` | Unexpected server-side error |

**Example:**

```bash
curl -s -X POST http://localhost:4000/v1/sessions/ses_abc123/screenshot \
  -H "X-Feather-Token: $(cat /path/to/token)" \
  -H "Content-Type: application/json" \
  -d '{ "fullPage": true }'
```

---

#### `POST /v1/sessions/:sessionId/debug-bundle` — Finalize debug bundle

Finalizes and indexes the session's debug artifacts (traces, screenshots, logs) into a manifest file. Useful for collecting diagnostic data before or after closing a session.

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sessionId` | string | Session identifier |

**Request body:** none (empty body accepted)

**Response `data`:**

| Field | Type | Description |
|-------|------|-------------|
| `sessionId` | string | The session identifier |
| `path` | string | Absolute path to the session's debug artifact directory |
| `manifest` | string | Absolute path to the generated manifest file within the debug directory |

**Error responses:**

| Status | Code | When |
|--------|------|------|
| 404 | `SESSION_NOT_FOUND` | No session exists with the given `sessionId` |
| 500 | `INTERNAL_ERROR` | Unexpected server-side error |

**Example:**

```bash
curl -s -X POST http://localhost:4000/v1/sessions/ses_abc123/debug-bundle \
  -H "X-Feather-Token: $(cat /path/to/token)"
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | `X-Feather-Token` header is missing or does not match the server token |
| `VALIDATION_ERROR` | 400 | Request body failed Zod schema validation; `error.details` contains the array of Zod issues |
| `SESSION_NOT_FOUND` | 404 | No session exists with the requested `sessionId` |
| `PROFILE_LOCKED` | 409 | A persistent profile directory is already locked by another active session |
| `SESSION_NOT_RUNNING` | 409 | The session exists but is not in `running` state; cannot open a tab |
| `CANNOT_CLOSE_LAST_TAB` | 409 | Refusing to close the only remaining tab; use `DELETE /v1/sessions/:sessionId` to end the session |
| `PAGE_NOT_FOUND` | 404 | The requested `pageId` does not exist within the session |
| `ELEMENT_NOT_FOUND` | 404 | No element matched the target locator |
| `ELEMENT_NOT_ACTIONABLE` | 409 | Element matched but the action timed out (covered, disabled, or off-screen) |
| `REF_EXPIRED` | 409 | A `{ "by": "ref" }` target refers to a ref from a superseded observe (another `observe` was called on this page, or the page navigated); re-observe and use a fresh ref |
| `WAIT_TIMEOUT` | 408 | `wait` condition not met within the allotted timeout |
| `INTERNAL_ERROR` | 500 | An unexpected server-side error occurred. Navigation-teardown on click/press/select-option no longer lands here — those return `navigated: true` instead. For a genuine 500: re-observe to check page state, retry once with a fresh ref, then report the `requestId` from server logs. |
