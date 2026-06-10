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
observe  →  act by ref  →  re-observe (read the diff)  →  repeat
```

Never act blind. See the page (`observe`), act on a numbered ref, re-observe to confirm the change
landed — the diff tells you exactly what moved.

**`observe` vs `snapshot`:** `observe` is for *acting* — numbered element refs, overlays, change-diff.
`snapshot` is for *reading* — text, links, cleaned markdown. See feather-data-extraction.

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

1. **Observe before you touch.** Get real refs from `observe`; never invent selectors.
2. **Act by ref; fall back by meaning.** A ref from the latest observe beats everything — no
   guessing. Without one, `role`/`text`/`placeholder` beat `css`; `at` (index) is a last resort.
3. **Verify each action** by re-observing (read the diff) or `wait`. Never insert blind sleeps.
4. **Read the error `code`, recover deterministically** (table below). Don't blind-retry.
5. **Pause for a human only on in-place steps** (CAPTCHA) — `await-human` dies on navigation. See
   feather-human-handoff.

## Targeting (pick the first that uniquely matches)

| # | Target | Use |
|---|--------|-----|
| 1 | `{"by":"ref","ref":"obs_a1b2.e3"}` | From the latest `observe`. Copy verbatim — never hand-construct. Expires on the next observe or navigation (`REF_EXPIRED`); a stale ref never hits a different element. |
| 2 | `{"by":"role","role":"button","name":"Submit"}` | Has an accessible name |
| 3 | `{"by":"text","text":"Log in"}` | Visible label |
| 4 | `{"by":"placeholder","text":"Email"}` | Input placeholder |
| 5 | `{"by":"testid","testId":"email"}` | App has `data-testid` |
| 6 | `{"by":"css","selector":"input"}` | Nothing semantic |

Disambiguate with `"at": "first" | "last" | <0-based index>`. **Use the `at` field — never `>> nth=`
inside a css string.**

## Core recipes

**Observe (first, and before every action):**
```http
POST /v1/sessions/:sessionId/observe   {}
```
Returns `actions` — numbered elements `{ ref, role, name, tag, box, state, overlayIndex? }`
(`overlayIndex` = the element lives inside `overlays[i]`) — plus `overlays`
(`{ kind, name, coverPct, blocking }`) and `diff` vs the previous observe. `diff: null` = no
baseline (first observe after navigation); empty `added/removed/changed` = nothing structural moved
(typed text does NOT show in the diff — verify outcomes, not keystrokes). Options: `cap` (default
80 — raise on dense pages or elements fall past it and vanish from the diff), `viewportOnly`.

**Act by ref, then re-observe:**
```http
POST /v1/sessions/:sessionId/click     { "target": {"by":"ref","ref":"obs_a1b2.e1"} }
POST /v1/sessions/:sessionId/observe   {}
```
If click/press/select-option returns `navigated: true`, the action tore down the page mid-flight —
a **hint, not a promise**. Re-observe and verify the landed screen; don't assume failure.

If a click opened a **new tab** (`target="_blank"` link), the active page stays put. The response
*may* include `newPageId` (best-effort signal); the ground truth is `GET .../tabs` — the spawned
tab appears there moments later. Act on it via its `pageId`.

**Dismiss an overlay (consent banner, popup):**
```http
POST /v1/sessions/:sessionId/dismiss   {}
```
Safe to call speculatively (acts only when an overlay is detected; affirmative labels only —
override with `labels`). Returns `{ dismissed, overlaysRemaining, observation }`:
- **`overlaysRemaining` is the ground truth for "am I clear"** — trust it over `dismissed.length`.
  `> 0` = another wall is up; call dismiss again (one wall per call).
- `observation` is a fresh full observe — **act from its refs**; all pre-dismiss refs are expired.
  No follow-up observe needed.
- Costs ~2× an observe internally. Reaches buttons inside **same-origin** iframe overlays;
  **cross-origin** iframe overlays (third-party CAPTCHA frames) are out of reach — use
  feather-human-handoff for those.

**Navigate:** `POST .../navigate { "url": "https://...", "waitUntil": "domcontentloaded" }` — then
observe; the page changed and all refs died.

**Type:** `POST .../type { "target": {...}, "text": "..." }` — `mode`: `fill` (default) or
`sequential` (key-by-key, `delayMs`).

**Press:** `POST .../press { "key": "Enter", "target": {...}? }` (target optional; may return
`navigated: true`).

**Wait:** `POST .../wait { "target": {...}, "until": "visible|hidden|attached|detached|stable" }`
(`stable` takes `quietMs`).

**Open a tab:** `POST /v1/sessions/:sessionId/tabs` — returns `{ pageId, url, title }`. Pass the new
`pageId` in all subsequent page actions. Refs and diffs are per-page.

**List tabs:** `GET /v1/sessions/:sessionId/tabs` — all open tabs `{ pageId, url, title, loadState }`.
The discovery tool after a click spawned a tab or when you've lost track of `pageId`s.

**Health probe:** `GET /v1/sessions/:sessionId/health` — `{ state, pages, alive }`. After a failure
on *your* side, this tells you in one call whether the browser died too (`alive: false`) or is
still fine and you can resume on the same session.

**Close a tab:** `DELETE /v1/sessions/:sessionId/tabs/:pageId` — returns remaining tabs. Close tabs
you're done with; the last tab can't be closed this way (`CANNOT_CLOSE_LAST_TAB`) — end the session
instead.

**Clean up:** `DELETE /v1/sessions/:sessionId {}`.

For multi-field forms → **feather-form-filling**. For reading/scraping → **feather-data-extraction**.
For CAPTCHA/login handoff → **feather-human-handoff**.

## Error → recovery

| `code` | Meaning | Recovery |
|--------|---------|----------|
| `VALIDATION_ERROR` | Bad body | Fix it; `error.details` lists the issues |
| `ELEMENT_NOT_FOUND` | Target matched nothing | **Re-observe, re-target** (selector is wrong, not timing) |
| `REF_EXPIRED` | Ref from a superseded observe | Re-observe, use the fresh ref |
| `ELEMENT_NOT_ACTIONABLE` | Covered/disabled/off-screen | `wait` for `visible`/`stable`, `dismiss` the overlay, or re-observe for a fresh ref |
| `WAIT_TIMEOUT` | State never happened | Observe/snapshot to see what actually rendered |
| `SESSION_NOT_FOUND` / `SESSION_NOT_RUNNING` | Bad/dead session | Re-create the session |
| `CANNOT_CLOSE_LAST_TAB` | Tried to close the only tab | Use `DELETE /v1/sessions/:sessionId` to end the session |
| `PAGE_NOT_FOUND` | Bad `pageId` | Omit `pageId` or list tabs |
| `PROFILE_LOCKED` | Persistent profile in use | Close other session / different profile |
| `INTERNAL_ERROR` | Server fault (nav-teardown on click/press/select-option returns `navigated: true` now, not 500) | Re-observe, retry once with a fresh ref, then pull `debug-bundle` + report `requestId` |

**Principle:** `ELEMENT_NOT_FOUND` / `REF_EXPIRED` = wrong *target* (re-observe, re-target).
`ELEMENT_NOT_ACTIONABLE` / `WAIT_TIMEOUT` = wrong *timing/state* (wait, retry). Don't confuse them.

## Response envelope

Success: `{ "ok": true, "requestId", "data": {...} }`. Failure:
`{ "ok": false, "requestId", "error": { "code", "message", "details"? } }`. Branch on `ok`; quote
`requestId` in any bug report.
