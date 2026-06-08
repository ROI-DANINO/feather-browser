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

All four commands locate elements with a shared **Target** object:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `by` | `"role"` \| `"text"` \| `"placeholder"` \| `"testid"` \| `"css"` | Yes | Locator strategy |
| `role` | string | Yes (if `by="role"`) | ARIA role, e.g. `"button"` |
| `name` | string | No (`by="role"`) | Accessible name to match |
| `text` | string | Yes (if `by="text"` or `"placeholder"`) | Visible text / placeholder text |
| `testId` | string | Yes (if `by="testid"`) | Value of the `data-testid` attribute |
| `selector` | string | Yes (if `by="css"`) | CSS selector |
| `exact` | boolean | No (`role`/`text`) | Exact (not substring) match |
| `at` | `"first"` \| `"last"` \| number | No | Which match to use when several match (default `"first"`) |

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

**Response `data`:** `{ "pageId": string, "clicked": true }`

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

**Response `data`:** `{ "pageId": string, "pressed": string }`

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

**Response `data`:** `{ "pageId": string, "selected": string[] }`

The `selected` array contains the values of the options that were actually selected (as confirmed by Playwright).

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
| `PAGE_NOT_FOUND` | 404 | The requested `pageId` does not exist within the session |
| `ELEMENT_NOT_FOUND` | 404 | No element matched the target locator |
| `ELEMENT_NOT_ACTIONABLE` | 409 | Element matched but the action timed out (covered, disabled, or off-screen) |
| `WAIT_TIMEOUT` | 408 | `wait` condition not met within the allotted timeout |
| `INTERNAL_ERROR` | 500 | An unexpected server-side error occurred; check server logs with the `requestId` |
