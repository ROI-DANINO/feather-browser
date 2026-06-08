---
name: using-feather-browser
description: Use whenever an agent will drive a website through the Feather Browser HTTP API — creating a session, navigating, clicking, typing, reading a page, or automating any web task. The entry skill that establishes how to work Feather cleanly and efficiently. Triggers on "drive feather", "use feather browser", "feather session", "automate this site", "browse to", "fill this out on the web", "log into a site for me".
---

# Using Feather Browser

The core discipline for driving Feather efficiently. For specialized workflows pull in the focused
skills: **feather-form-filling**, **feather-human-handoff**, **feather-data-extraction**. Full
reference: `docs/agent-playbook.md`.

## The Golden Loop

```
snapshot  →  decide  →  act  →  verify  →  repeat
```

Never act blind. See the page (snapshot), choose a stable target, do one action, confirm it landed
(wait). This one habit prevents most failures.

## Setup

1. **Base URL:** read `baseUrl` from `endpoint.json` — the port is OS-assigned, never hardcode it.
2. **Auth:** every `/v1/...` call needs header `X-Feather-Token: <token>`.
3. **Create a session**, do the work, **delete the session** when done (don't leak sessions).

```http
POST /v1/sessions
{ "profile": { "kind": "disposable" }, "browserMode": "chromium-new-headless" }
```
- `profile.kind`: `disposable` (throwaway/stealth) or `persistent` (warmed, reusable identity).
- `browserMode`: `chromium-new-headless` (default), `chromium-headless-shell` (lighter),
  `chromium-headed-cdp` (visible — required when a human will watch/click).
- Returns `sessionId` + initial `pageId`. Omit `pageId` on later calls to use the active page.

## The Five Rules

1. **Snapshot before you touch.** Discover real elements; never invent selectors.
2. **Target by meaning, not position.** `role`/`text`/`placeholder` beat `css`. `at` (index) is a
   last resort — it breaks on the next redesign.
3. **Verify each action** with `wait`. Never insert blind client-side sleeps.
4. **Read the error `code`, recover deterministically** (table below). Don't blind-retry.
5. **Pause for a human only on in-place steps** (CAPTCHA) — `await-human` dies on navigation. See
   feather-human-handoff.

## Targeting (pick the first that uniquely matches)

| # | Target | Use |
|---|--------|-----|
| 1 | `{"by":"role","role":"button","name":"Submit"}` | Has an accessible name |
| 2 | `{"by":"text","text":"Log in"}` | Visible label |
| 3 | `{"by":"placeholder","text":"Email"}` | Input placeholder |
| 4 | `{"by":"testid","testId":"email"}` | App has `data-testid` |
| 5 | `{"by":"css","selector":"input"}` | Nothing semantic |

Disambiguate with `"at": "first" | "last" | <0-based index>`. **Use the `at` field — never `>> nth=`
inside a css string.**

## Core recipes

**Discover (first, and after every navigation):**
```http
POST /v1/sessions/:sessionId/snapshot   {}
```
Returns `{ url, title, text, links, meta.description, markdown }`. Read `markdown` — cleaned page
content (capped 20k). Use it to learn the page before targeting.

**Navigate:**
```http
POST /v1/sessions/:sessionId/navigate   { "url": "https://...", "waitUntil": "domcontentloaded" }
```

**Click, then confirm:**
```http
POST /v1/sessions/:sessionId/click   { "target": {"by":"role","role":"button","name":"Continue"} }
POST /v1/sessions/:sessionId/wait    { "target": {"by":"text","text":"Welcome"}, "until":"visible" }
```

**Type:** `POST .../type { "target": {...}, "text": "..." }` — `mode`: `fill` (default) or
`sequential` (key-by-key, `delayMs`).

**Press:** `POST .../press { "key": "Enter", "target": {...}? }` (target optional).

**Wait:** `POST .../wait { "target": {...}, "until": "visible|hidden|attached|detached|stable" }`
(`stable` takes `quietMs`).

**Clean up:** `DELETE /v1/sessions/:sessionId {}`.

For multi-field forms → **feather-form-filling**. For scraping → **feather-data-extraction**. For
CAPTCHA/login handoff → **feather-human-handoff**.

## Error → recovery

| `code` | Meaning | Recovery |
|--------|---------|----------|
| `VALIDATION_ERROR` | Bad body | Fix it; `error.details` lists the issues |
| `ELEMENT_NOT_FOUND` | Selector matched nothing | **Re-snapshot, re-target** (selector is wrong) |
| `ELEMENT_NOT_ACTIONABLE` | Covered/disabled/off-screen | `wait` for `visible`/`stable`, scroll, dismiss overlay, retry |
| `WAIT_TIMEOUT` | State never happened | Snapshot to see what actually rendered |
| `SESSION_NOT_FOUND` / `SESSION_NOT_RUNNING` | Bad/dead session | Re-create the session |
| `PAGE_NOT_FOUND` | Bad `pageId` | Omit `pageId` or list tabs |
| `PROFILE_LOCKED` | Persistent profile in use | Close other session / different profile |
| `INTERNAL_ERROR` | Server fault | Pull `debug-bundle`, report `requestId` |

**Principle:** `ELEMENT_NOT_FOUND` = wrong *selector* (re-target). `ELEMENT_NOT_ACTIONABLE` /
`WAIT_TIMEOUT` = wrong *timing/state* (wait, retry). Don't confuse them.

## Response envelope

Success: `{ "ok": true, "requestId", "data": {...} }`. Failure:
`{ "ok": false, "requestId", "error": { "code", "message", "details"? } }`. Branch on `ok`; quote
`requestId` in any bug report.
