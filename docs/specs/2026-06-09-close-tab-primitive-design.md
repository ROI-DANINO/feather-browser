# Close-Tab Primitive — Design

_Date: 2026-06-09 · Phase 4a (Feather v1) · Status: APPROVED (brainstorm)_

## Problem

Feather can **open** tabs (`POST /v1/sessions/:sessionId/tabs`) and **close whole sessions**
(`DELETE /v1/sessions/:sessionId`), but there is **no way to close a single tab**. Inside one
long-lived session, tabs can only accumulate. This blocks "efficient tab usage" — an agent that
wants to keep a warmed session alive across several errands has to either leak tabs or nuke the
whole session (releasing the profile lock and losing the warm context).

Observed live: the showcase hard tier and the prior discovery session left a scratch session with
6 orphaned tabs because there was no per-tab teardown.

Confirmed gap in `journal/context/next.md` (~09:55 entry): _"no single-tab close route —
`DELETE /v1/sessions/:id/pages/:pageId` → 404; only whole-session `DELETE` exists."_

## Goal

Add a core close-tab primitive so an agent can free a tab it is done with **without** tearing down
the session. Keep behavior predictable across both browser modes (headless persistent context and
headed-CDP).

## Non-goals (out of scope)

- **Perception / observation loop** (cheap structured "observe", auto-dismiss interstitials,
  screenshot cleanup) — the *next* brainstorm; tracked separately. This spec does not touch it.
- **Orphaned/idle-session reaping** — the 6-tab leftover was a session never closed, a different
  problem (idle reaping / startup cleanup). Not addressed here.
- **Bulk operations** ("close all tabs except", "close all") — YAGNI.

## The API

Symmetric with the existing open-tab route:

```
DELETE /v1/sessions/:sessionId/tabs/:pageId
```

No request body. Success returns the standard envelope, including the **remaining** tabs so the
caller immediately knows the new state:

```json
{
  "ok": true,
  "requestId": "req_…",
  "data": {
    "sessionId": "ses_…",
    "closedPageId": "page_…",
    "pages": [ /* remaining PageInfo[]: { pageId, url, title, loadState } */ ]
  }
}
```

### Errors (via the existing `ERROR_STATUS` map)

| Condition | Code | HTTP |
|---|---|---|
| Unknown `pageId` | `PAGE_NOT_FOUND` | 404 (already mapped) |
| Closing the only remaining tab | `CANNOT_CLOSE_LAST_TAB` | 409 (**new**) |
| Unknown `sessionId` | `SESSION_NOT_FOUND` | 404 (already mapped) |

**Last-tab rule:** closing the last tab is refused. The caller should `DELETE` the session instead.
This avoids zombie sessions (headed Chromium tends to quit when its last window closes, which would
leave a `running` session whose browser is dead) and keeps the profile-lock lifecycle tied to
session close, not tab close.

## Plumbing (mirrors `open-tab.ts`)

- **`src/commands/close-tab.ts`** — `CloseTabHandler`, same shape as `OpenTabHandler`. Calls
  `manager.closeTab(sessionId, pageId)`.
- **`manager.closeTab(sessionId, pageId)`** — resolves the session, delegates to
  `session.closeTab(pageId)`, returns `{ sessionId, closedPageId, pages: getPageInfoList() }`.
  Logging of `tab.closed` is handled by the per-page `close` listener (single source of truth),
  not duplicated here.
- **`session.closeTab(pageId)`**:
  1. throw `PageNotFoundError` if the id is not in `_pages`;
  2. throw `CannotCloseLastTabError` if `_pages.size <= 1`;
  3. `await page.close()`, then `this.removePage(pageId)` (idempotent — the `close` event also
     removes it; either order is safe).
- **`CannotCloseLastTabError`** — new error class in `session.ts` with `code = "CANNOT_CLOSE_LAST_TAB"`,
  added to `ERROR_STATUS` as `409`.
- **Route** wired in `src/transport/routes.ts` next to the `POST .../tabs` route, using the existing
  `tokenAuth` preHandler and `handleRouteError` pattern.

## Required fix: per-page listeners on initial tabs

The per-page listeners — `page.on("close")` (→ `removePage` + emit `tab.closed`) and
`page.on("framenavigated")` (→ emit `tab.updated`) — are currently attached **only inside
`context.on("page")`** in `manager.ts`, which fires for tabs created *after* launch. The **initial**
tab(s) added by `session.setContext()` (which loops `context.pages()` and calls `addPage` directly)
**never get these listeners**. So closing the default/initial tab today would not reap it from the
page map or emit `tab.closed`.

**Fix:** extract an `attachPageListeners(session, page)` helper and call it from **both**:
- `setContext()` — for each initial page, and
- `context.on("page")` — for each later page.

This makes tab tracking correct for *every* tab, which the close-tab feature depends on. No
double-attach risk: initial pages do not trigger `context.on("page")`, and event-created pages are
not in the `setContext` loop. `session.closeTab` still calls `removePage` explicitly so the API
response's `pages` list is accurate even before the async `close` event fires.

> Note: `attachPageListeners` needs access to the logger and session. Keep the helper in `manager.ts`
> (where the logger lives) taking the session as an argument, rather than moving listener logic into
> `session.ts`.

## Session-close (the second ask) — verified, no change

"Close all tabs when a session is closed" **already works**: `manager.close()` calls
`context.close()` (Playwright closes every page in the context) and then `childProcess.kill()` for
headed-CDP mode. No code change. A test will assert it so it stays true.

## Tests (TDD — write first)

**Unit (`session.closeTab`):**
- closing a tab when `>1` open removes it from the page map and returns;
- closing the only tab throws `CannotCloseLastTabError`;
- closing an unknown `pageId` throws `PageNotFoundError`.

**Integration (real Chromium, headless):**
- open session → open 2 extra tabs (3 total) → `DELETE .../tabs/:pageId` → 200, closed id gone from
  `pages`, 2 remain;
- close down to 1 tab → closing the last returns **409 `CANNOT_CLOSE_LAST_TAB`**, session still has 1
  tab and is still `running`;
- `DELETE .../tabs/:bogusPageId` → **404 `PAGE_NOT_FOUND`**;
- closing the **initial** tab (with another tab open) reaps it correctly and emits `tab.closed`
  (covers the listener fix);
- close a session with 3 tabs → all pages torn down, lock released (covers the second ask).

## Docs

- `docs/api-reference.md` — add the `DELETE .../tabs/:pageId` route + `CANNOT_CLOSE_LAST_TAB`.
- `docs/agent-playbook.md` — document close-tab as the way to reuse a session efficiently.
- `skills/using-feather-browser` — mention close-tab in the tab-handling section.
- Clears the "no single-tab close route" gap noted in `journal/context/next.md`.

## Affected files

- new: `src/commands/close-tab.ts`
- edit: `src/sessions/session.ts` (error class + `closeTab` method)
- edit: `src/sessions/manager.ts` (`closeTab`, `attachPageListeners` helper, call from `setContext`
  path + `context.on("page")`)
- edit: `src/transport/routes.ts` (route + `CANNOT_CLOSE_LAST_TAB` status)
- edit: command wiring where `OpenTabHandler` is constructed (mirror for `CloseTabHandler`)
- tests: unit (session) + integration
- docs: api-reference, agent-playbook, using-feather-browser skill
