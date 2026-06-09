# Feather Browser — User Flow and Example Workflows

## Basic operating loop

A normal Feather workflow looks like this:

```text
1. Start Feather server
2. Read endpoint.json
3. Read the auth token from tokenFile
4. Launch a browser session
5. Navigate to a page
6. Read/snapshot the page
7. Extract structured data or interact with the page
8. Take screenshots or create debug bundles if needed
9. Close the session
```

## Startup

The user starts the local server:

```bash
npm install
npm run dev
```

Feather starts a local server on `127.0.0.1`.

The port can be assigned automatically by the operating system, or pinned with an environment variable.

At startup, Feather writes an endpoint descriptor to disk. This tells agents where the server is and where to read the token.

## Authentication

Feather's control API is local, but it is still protected.

Every `/v1` endpoint requires an `X-Feather-Token` header.

The token is generated at startup and written to a local token file.

This means agents do not just guess or assume access. They must discover the endpoint and read the token through the local project context.

## Session launch

A client launches a session through the HTTP API.

Sessions can use either:

- Persistent profiles: keep cookies and session state.
- Disposable profiles: temporary browser state, deleted or quarantined after close.

Persistent profiles are useful when login/session continuity matters.

Disposable profiles are useful for tests, risky experiments, demos, and throwaway workflows.

## Typical session lifecycle

```text
POST /v1/sessions
    -> creates a browser session

POST /v1/sessions/:id/navigate
    -> opens a URL

POST /v1/sessions/:id/snapshot
    -> reads page text, links, and metadata

POST /v1/sessions/:id/extract
    -> extracts structured data using a CSS recipe

POST /v1/sessions/:id/screenshot
    -> captures visual state

POST /v1/sessions/:id/click
POST /v1/sessions/:id/type
POST /v1/sessions/:id/press
POST /v1/sessions/:id/wait
    -> interacts with the page

POST /v1/sessions/:id/debug-bundle
    -> creates trace/log/network/console artifacts

DELETE /v1/sessions/:id
    -> closes and cleans up
```

## Example 1 — Read and summarize a web page

```text
User asks:
"Open this article and summarize the main points."

Agent flow:
1. Launch disposable session.
2. Navigate to the article.
3. Snapshot page.
4. Extract text and links.
5. Summarize.
6. Close session.
```

## Example 2 — Compare pages

```text
User asks:
"Compare these product pages."

Agent flow:
1. Launch session.
2. Open each URL.
3. Extract the same fields from each page.
4. Build a comparison table.
5. Screenshot anything visually important.
6. Return structured results.
```

## Example 3 — Authenticated errand

```text
User asks:
"Use my logged-in session to check something."

Agent flow:
1. Use a persistent/warm profile.
2. Navigate inside an already logged-in site.
3. Read or interact with visible information.
4. Stop for human handoff if login/MFA/CAPTCHA appears.
5. Resume after the human resolves it.
6. Record debug artifacts if the workflow fails.
```

## Example 4 — Demo workflow

The current project includes quickstart and hero demo paths:

- Basic demo: drive a full session loop end to end.
- Hero demo: ChatGPT to Gmail style workflow using warmed browser session foundations.

The demo idea shows the Cookie Mine foundation: an agent can use a browser profile that the human has already warmed with real login state.

## Infographic emphasis

A good flow infographic should show:

```text
Human / Agent Request
        |
        v
Local Feather API
        |
        v
Real Chromium Session
        |
        v
Read / Extract / Click / Type / Screenshot
        |
        v
Debuggable Result
```

The key point: Feather turns browser work into a controlled local loop that an AI agent can repeat, inspect, and debug.
