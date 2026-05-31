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
| `browserMode` | `"chromium-new-headless"` \| `"chromium-headless-shell"` | No | Which Chromium binary/mode to use |
| `viewport` | object | No | Initial viewport size |
| `viewport.width` | number | Yes (if `viewport` present) | Viewport width in pixels |
| `viewport.height` | number | Yes (if `viewport` present) | Viewport height in pixels |
| `proxy` | object \| `null` | No | Proxy configuration; pass `null` to explicitly disable |
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
| `browserMode` | `"chromium-new-headless"` \| `"chromium-headless-shell"` | Browser mode in use |
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

### Page Actions

All page action endpoints accept an optional `pageId` field. If omitted, the session's first (default) page is used.

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

Extracts a text snapshot of the current page, including body text, all hyperlinks, and the `<meta name="description">` tag.

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

#### `POST /v1/sessions/:sessionId/extract` — Extract structured data

Runs a field-extraction recipe against the current page using CSS selectors. Each field either reads text content or an attribute from the first matching element.

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sessionId` | string | Session identifier |

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pageId` | string | No | Target page; defaults to the first page |
| `recipe` | object | Yes | Extraction recipe |
| `recipe.fields` | object | Yes | Map of field name → field descriptor |
| `recipe.fields.<name>.selector` | string | Yes | CSS selector for the target element |
| `recipe.fields.<name>.type` | `"text"` \| `"attribute"` | Yes | Whether to extract text content or an element attribute |
| `recipe.fields.<name>.attribute` | string | No (required when `type` is `"attribute"`) | Attribute name to read (e.g. `"href"`, `"src"`) |
| `recipe.limits` | object | No | Output limits |
| `recipe.limits.items` | integer (> 0) | No | Maximum number of items (reserved for future multi-match extraction) |
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

#### `POST /v1/sessions/:sessionId/screenshot` — Take a screenshot

Captures a PNG screenshot of the current page and saves it to the session's debug directory.

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
| `PAGE_NOT_FOUND` | 404 | The requested `pageId` does not exist within the session |
| `INTERNAL_ERROR` | 500 | An unexpected server-side error occurred; check server logs with the `requestId` |
