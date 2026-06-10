# Feather Agent Playbook

How to drive Feather Browser **efficiently and professionally**. This is not an API dump — it
teaches the *way* to work the system so an agent gets the job done in a few clean calls instead of
flailing through brittle guesswork.

> **Layered doc.**
> **Part 1 — Agent Quick Reference** is for an AI agent at runtime: terse, imperative, copy-paste
> recipes. Feed it into the agent's context before it drives Feather.
> **Part 2 — How & Why** is for humans building on or extending Feather: the reasoning, the
> trade-offs, and the operational details behind the recipes.
>
> Companion: [`api-reference.md`](./api-reference.md) is the exhaustive endpoint spec. This playbook
> is the *opinionated* layer on top of it.

---

# Part 1 — Agent Quick Reference

## The Golden Loop

```
observe  →  act by ref  →  observe (read diff)  →  repeat
```

Never act blind. Every page interaction starts by *seeing* the page (`observe`), acting on a
numbered ref, and re-observing to confirm the change landed. The diff tells you exactly what moved.

**`observe` vs `snapshot`:** `observe` is for *acting* — it returns numbered element refs, overlays,
and a change-diff. `snapshot` is for *reading* — it returns text, links, and markdown when you need
to understand page content rather than interact with it.

## Setup (once per task)

- **Base URL:** read `baseUrl` from `endpoint.json` (the port is OS-assigned — never hardcode it).
- **Auth:** every `/v1/...` call needs the header `X-Feather-Token: <token>`. (The two `/resume`
  routes are the only unauthenticated endpoints — they're human-facing.)
- **Create a session** before doing anything else (see recipe below).
- **Delete the session** when done. Don't leak sessions or profile dirs.

## The Five Rules

1. **Observe before you touch.** Get real element refs from `observe`; don't invent selectors from
   the URL or your assumptions about the page. Use `snapshot` when you need to read content.
2. **Target by meaning, not position.** Prefer `role`/`text`/`placeholder` over `css`. Index
   selectors (`at`) are a last resort and break on the next site redesign.
3. **Verify each action.** Use `wait` (`visible`/`hidden`/`stable`) between steps. Never insert blind
   client-side sleeps to "let the page settle."
4. **Read the error `code`, recover deterministically.** Every failure returns a typed code (see the
   table below). Map it to a recovery action — don't blindly retry the same call.
5. **Pause for a human only on in-place steps.** `await-human` works for a CAPTCHA on the same page.
   It does **not** survive a full navigation (login redirect) — see the gotcha.

## Targeting cheat sheet

Pick the **first** type that uniquely identifies the element. Top = most robust, bottom = most
brittle.

| Preference | Target | When |
|-----------|--------|------|
| 1 (best) | `{ "by": "ref", "ref": "obs_a1b2.e3" }` | From the latest `observe`; most robust + fastest, no guessing. Refs are **observe-scoped** (`<observeId>.e<i>`) — always copy the `ref` field verbatim, never hand-construct one. **Valid only until the next `observe` on this page** (else `REF_EXPIRED`). |
| 2 | `{ "by": "role", "role": "button", "name": "Submit" }` | Buttons, links, inputs with an accessible name |
| 3 | `{ "by": "text", "text": "Log in" }` | Visible label, no clear role |
| 4 | `{ "by": "placeholder", "text": "Email" }` | Form inputs with placeholder text |
| 5 | `{ "by": "testid", "testId": "email-field" }` | App exposes `data-testid` |
| 6 (last) | `{ "by": "css", "selector": "input" }` | Nothing semantic exists |

**Disambiguating multiple matches:** add `"at"` to any target — `"first"`, `"last"`, or a 0-based
index. **Use the `at` field — do not write `>> nth=N` inside a css selector string.**

```json
{ "by": "css", "selector": "input", "at": 2 }
```

## Research doctrine: Google-first on a warmed profile

When a task needs *information* (a fact, a date, an address, "find X"), **search Google on a
warmed profile** — don't guess a topical website and don't reach for weaker engines.

- **Why Google:** highest-quality results, AI Overview, and the warmed session renders it
  cleanly. Cold/headless disposable profiles hit bot walls on every major engine (measured:
  DDG serves CAPTCHA to headless Chromium on both its endpoints) — search is a **warmed-profile
  capability** until headless-warm is proven (v2).
- **Source page is the answer; AI Overview is a hint.** Use the SERP (including the AI
  Overview) to *find and rank* sources, then navigate to a result and extract the fact from
  the source page. Don't quote the AI Overview as the verified answer — it isn't citable and
  isn't always present.
- **SERPs are self-describing in `observe`:** each organic result is one action entry with
  title + source + URL breadcrumb in its `name`. Pick by meaning, click by ref. (No need to
  extract hrefs and navigate manually; a nav-click returns `navigated: true` — re-observe to
  confirm the landed page.)
- **Respect the profile's locale.** Warmed profiles may render Google in the human's language
  (e.g. Hebrew UI). Don't force `hl=en` — operate as the human would; the organic results
  remain identifiable by name/URL.
- **Mind temporal meaning.** "Next holiday" means *after today* — resolve relative dates
  against the current date before acting on extracted facts, and verify the final artifact
  (calendar date, form value) semantically, not just that a write happened.

## Recipes

### Start a session
```http
POST /v1/sessions
{ "profile": { "kind": "disposable" }, "browserMode": "chromium-new-headless" }
```
- `profile.kind`: `"disposable"` (fresh throwaway) or `"persistent"` (a warmed, reusable identity).
- `browserMode` (optional): `"chromium-new-headless"` (default, invisible),
  `"chromium-headless-shell"` (lighter headless), `"chromium-headed-cdp"` (visible window — needed
  when a human will watch/click).
- Returns a `sessionId` and an initial `pageId`.

### Observe the page and get actionable refs (do this before every action)
```http
POST /v1/sessions/:sessionId/observe
{}
```
Returns numbered actionable elements (`obs_a1b2.e0`, `obs_a1b2.e1`, …), overlays (banners/modals/iframes), and a
change-diff vs the previous observe. **Use the refs to act — no selector guessing.**

Trimmed example response:
```jsonc
{
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
```

Optional fields: `cap` (default 80 elements), `viewportOnly` (skip off-screen elements),
`includeText` (append page body text). `diff` is `null` on the first observe after navigation; on
subsequent observes it lists `added`/`removed`/`changed` elements.

### Discover page content (reading tasks)
```http
POST /v1/sessions/:sessionId/snapshot
{}
```
Returns `{ url, title, text, links, meta.description, markdown }`. **Read `markdown`** — it's the
cleaned page content (nav/ads stripped, capped at 20k chars). Use this when you need to *read*
content; use `observe` when you need to *act*.

### Dismiss an overlay / consent banner (opt-in)
```http
POST /v1/sessions/:sessionId/dismiss
{}
```
Runs an internal `observe`, finds the first element whose name matches an affirmative-dismiss label
(`Accept all`, `I agree`, `Allow all`, `Got it`, `Accept`, `Close`, `Continue`), clicks it, then
**re-observes to verify**. Only fires when the observe detects an overlay — safe to call speculatively.

Returns:
```jsonc
{
  "pageId": "pg_1",
  "dismissed": [{ "ref": "obs_a1b2.e3", "name": "Accept all" }],  // verified-gone only; ref is from baseline observe
  "overlaysRemaining": 0,       // from the post-click re-observe (or baseline count when nothing was clicked)
  "observation": { /* full ObserveResult — use these refs; your old refs are expired */ }
}
```

- `dismissed` lists only overlays **confirmed absent** in the post-click re-observe. A click
  that throws but the overlay vanishes still counts as dismissed.
- **`overlaysRemaining` is the ground truth for "am I clear."** Trust it over `dismissed.length`
  alone — on multi-pane popups whose label text changes between panes, `dismissed` can misjudge;
  `overlaysRemaining` is computed from the verify observe.
- `overlaysRemaining > 0` means another wall is up: call dismiss again (one wall per call) or
  pass different `labels`.
- `observation` is a full, fresh `ObserveResult`. Any refs from before the dismiss call are
  expired — act from `observation`'s refs directly. No need to call `observe` again after dismiss.
- When nothing was clicked, `dismissed` is `[]` and `observation` is the baseline observe.
- **Same-origin iframe overlays are dismissable** (2026-06-10): buttons inside a same-origin
  consent iframe inherit the iframe overlay's `overlayIndex` in observe, so `/dismiss` reaches
  them. **Cross-origin iframe overlays remain out of reach** (their documents are never walked —
  e.g. third-party CAPTCHA frames): use `await-human` for those.

Pass `"labels"` to override the default label list. Re-call if a second overlay appears (`overlaysRemaining > 0`).
- **Cost:** dismiss runs up to two full observes internally (baseline + verify), so it costs ~2× an observe on dense pages — budget accordingly.

### Navigate
```http
POST /v1/sessions/:sessionId/navigate
{ "url": "https://example.com", "waitUntil": "domcontentloaded" }
```
Then snapshot again — the page changed.

### Fill a form field
```http
POST /v1/sessions/:sessionId/type
{ "target": { "by": "placeholder", "text": "Email" }, "text": "user@example.com" }
```
- `mode`: `"fill"` (default, instant set) or `"sequential"` (key-by-key, with optional `delayMs` —
  use for fields that validate on keystroke).

### Pick from a native `<select>` dropdown
```http
POST /v1/sessions/:sessionId/select-option
{ "target": { "by": "css", "selector": "#country" }, "values": "US" }
```
- `values` accepts a string or array (for multi-selects). Returns `{ selected, navigated? }`.
- **Only for native `<select>`.** Custom dropdown widgets (`role="combobox"`, `role="listbox"`) are
  not `<select>` — drive those with `click` instead.
- If `navigated: true` is in the response, `selected` echoes the requested values unverified —
  re-observe and confirm the landed page before continuing.

### Click and confirm a result
```http
POST /v1/sessions/:sessionId/click
{ "target": { "by": "role", "role": "button", "name": "Continue" } }
```
Then verify the expected next state appeared:
```http
POST /v1/sessions/:sessionId/wait
{ "target": { "by": "text", "text": "Welcome" }, "until": "visible" }
```
If the response contains `"navigated": true`, the click fired and the page navigated away — this
is a hint, not a promise. Re-observe and verify the screen before continuing; don't assume the
click failed.

### Press a key
```http
POST /v1/sessions/:sessionId/press
{ "key": "Enter", "target": { "by": "placeholder", "text": "Search" } }
```
`target` is optional — omit it to press at the page level. If the response contains
`"navigated": true` (e.g. Enter in a submit form), re-observe and verify the screen.

### Wait for the page to settle
```http
POST /v1/sessions/:sessionId/wait
{ "target": { "by": "css", "selector": "main" }, "until": "stable", "quietMs": 500 }
```
`until`: `visible` | `hidden` | `attached` | `detached` | `stable`. `stable` waits until the element
stops changing for `quietMs`.

### Extract structured data from a list
```http
POST /v1/sessions/:sessionId/extract
{ "recipe": { "fields": {
    "title": { "selector": "h2.title", "type": "text" },
    "link":  { "selector": "a.more", "type": "attribute", "attribute": "href" }
} } }
```
Each field selector resolves to its **first match**. To collect repeating rows, scope selectors to
the row container.

### Hand off a step to a human (CAPTCHA, consent click)
```http
POST /v1/sessions/:sessionId/await-human
{ "reason": "Solve the CAPTCHA, then click Resume", "banner": true }
```
- Blocks until the human clicks the on-page **Resume** banner, an optional `resumeOn` signal fires,
  or `timeoutMs` elapses. Returns `resumedBy: "human" | "signal" | "timeout"`.
- **Use a headed session** (`chromium-headed-cdp`) so the human can see and click.
- **Critical limit — see gotcha #1:** this only works for steps that *stay on the same page*. If the
  human's action triggers a full navigation (e.g. submitting a login), the banner is destroyed and
  this call dangles until timeout. For login/redirect steps, use `resumeOn` to auto-detect the
  landed page instead, or split the flow.

### Open a new tab (reuse the session, don't spin up a new one)
```http
POST /v1/sessions/:sessionId/tabs
```
Returns `{ pageId, url, title }`. The new tab shares the session's cookies and trust context —
this is the Cookie Mine entry point. Pass the returned `pageId` in all subsequent page actions.

### Close a tab when done
```http
DELETE /v1/sessions/:sessionId/tabs/:pageId
```
Returns `{ sessionId, closedPageId, pages }` — the `pages` array is the remaining tab list.
**Reuse the session; don't leak tabs.** When you're done with a tab, close it with this route
instead of opening endless new tabs or tearing down the whole session. The server refuses to close
the last remaining tab (`CANNOT_CLOSE_LAST_TAB`) — use `DELETE /v1/sessions/:sessionId` to end
the session.

### Clean up
```http
DELETE /v1/sessions/:sessionId
{}
```
Add `"quarantineDisposableProfile": true` if you want the disposable profile kept for forensics
instead of deleted.

## Error → recovery

| `code` | HTTP | What it means | Recovery |
|--------|------|---------------|----------|
| `VALIDATION_ERROR` | 400 | Your request body is malformed | Fix the body; `error.details` lists the exact Zod issues |
| `UNAUTHORIZED` | 401 | Missing/wrong `X-Feather-Token` | Add the correct header |
| `SESSION_NOT_FOUND` | 404 | Bad `sessionId` | Re-create the session |
| `PAGE_NOT_FOUND` | 404 | Bad `pageId` | Omit `pageId` (uses active page) or list tabs |
| `ELEMENT_NOT_FOUND` | 404 | Target matched nothing | **Observe again** — the page/selector is wrong, not the timing. Re-target. |
| `ELEMENT_NOT_ACTIONABLE` | 409 | Found but covered/disabled/off-screen | `wait` for it to be `visible`/`stable`, `dismiss` the overlay, or re-observe and use a fresh ref |
| `REF_EXPIRED` | 409 | Ref is from a superseded observe (another `observe` was called, or the page navigated) | Re-observe, then use the fresh ref from the new response |
| `WAIT_TIMEOUT` | 408 | Condition never met | The expected state didn't happen — snapshot to see what actually rendered |
| `PROFILE_LOCKED` | 409 | Persistent profile already in use | Close the other session or use a different profile |
| `SESSION_NOT_RUNNING` | 409 | Session not in `running` state | Re-create the session |
| `CANNOT_CLOSE_LAST_TAB` | 409 | Tried to close the only remaining tab | Use `DELETE /v1/sessions/:sessionId` to end the session instead |
| `INTERNAL_ERROR` | 500 | Unexpected server error | Navigation-teardown on click/press/select-option **no longer lands here** — those return `navigated: true` instead (re-observe and verify the screen). For a genuine 500: re-observe to check page state, retry once with a fresh ref, then pull a `debug-bundle` and report the `requestId`. |

**Recovery principle:** `ELEMENT_NOT_FOUND` → your *selector* is wrong (re-snapshot, re-target).
`ELEMENT_NOT_ACTIONABLE` / `WAIT_TIMEOUT` → your *timing/state* is wrong (wait, then retry). Don't
confuse the two.

## Known limits & gotchas

1. **The await-human banner dies on navigation.** It's injected DOM; a full page load wipes it.
   Good for same-page steps (CAPTCHA), not for login/redirect handoffs.
2. **`select-option` is native `<select>` only.** Custom widgets need `click`.
3. **`extract` returns the first match per field.** No built-in multi-row collection yet — scope
   your selectors.
4. **Index targeting (`at`) is brittle.** It breaks across site redesigns. Always prefer a semantic
   target; reach for `at` only when nothing else identifies the element.
5. **Snapshot `markdown` is capped at 20k chars** and is not request-configurable (the `limits` you
   can pass only affect `textChars` and `links`).

---

# Part 2 — How & Why (for humans extending Feather)

## The response envelope

Every endpoint returns the same shape, so clients can branch on `ok` once:

```jsonc
// success
{ "ok": true,  "requestId": "...", "data": { /* endpoint result */ } }
// failure
{ "ok": false, "requestId": "...", "error": { "code": "...", "message": "...", "details"?: ... } }
```

`requestId` correlates a response to server logs — always quote it when reporting a bug.

## Profiles: persistent vs disposable

- **`disposable`** — a fresh temp profile, deleted on session close. Use for one-shot tasks and any
  stealth-sensitive flow where you don't want state to persist. (The disposable close path now waits
  for Chromium's child process to fully exit before deleting the dir, avoiding the old `ENOTEMPTY`
  race.)
- **`persistent`** — a reusable on-disk profile that keeps cookies/logins (a "warmed identity").
  Only one live session may hold a given persistent profile at a time (`PROFILE_LOCKED` otherwise).

**Rule of thumb:** throwaway/anonymous → disposable; "act as this logged-in human" → persistent.

## Browser modes

| Mode | Visible? | Use for |
|------|----------|---------|
| `chromium-new-headless` | No | Default. Real headless Chromium, full feature set. |
| `chromium-headless-shell` | No | Lighter-weight headless when you don't need the full browser. |
| `chromium-headed-cdp` | **Yes** | Anything a human watches or interacts with (`await-human`, filmed runs). Requires the **server process** to have `WAYLAND_DISPLAY`/`DISPLAY` in its environment. |

## Why snapshot-first is the whole game

The single biggest source of friction is **element discovery**. Real-world markup (Instagram, etc.)
often has no `placeholder`, no `name`, and only partial ARIA labels — so an agent that guesses
selectors burns round-trips on `ELEMENT_NOT_FOUND`. The fix is structural: `snapshot` returns
cleaned `markdown` + `links`, giving the agent the page's real content and structure up front. One
snapshot replaces several blind probing calls. The markdown field (4a.8) exists specifically to shrink
this discovery cost.

## The await-human navigation gotcha (design note)

The resume banner is a DOM flag injected over CDP and polled by the server — chosen because every
page→localhost network path is blocked by Chromium's Private Network Access. The consequence: a full
navigation destroys the banner, so the one-click resume backbone only covers **in-place** human
steps. The login/MFA case (which redirects) is exactly where this breaks — and is exactly the v2 MFA
Handler's job. Three paths forward when you hit it: (a) re-inject the banner on `framenavigated`
while a pause is active; (b) use `await-human`'s `resumeOn` to auto-detect the post-login page; (c) a
persistent off-page resume surface. Until then: don't span a navigation with a single `await-human`.

## Server lifecycle (operating Feather)

- **Find the server:** read `baseUrl` (and the pid) from `endpoint.json`. The port is OS-assigned;
  grep tolerantly: `grep -o '"baseUrl": *"[^"]*"' endpoint.json`.
- **Stop the server:** kill by the pid from `endpoint.json`. **Never** `pkill -f "ts-node src/index"`
  — the pattern matches its own shell and kills the kill command (exit 144).
- **Headed windows** only appear if the server was started from a shell that has the desktop display
  env (`WAYLAND_DISPLAY`/`DISPLAY`).
- **`continuity.test.ts`** is a known pre-existing flake — ignore it in test runs; it's unrelated to
  feature work.

## Where these rules came from

This playbook distills the v1 Instagram dry-run: end-to-end agent driving *works* (Google login
handoff → full signup form filled over the HTTP API). The friction was never the core driving — it
was (1) element discovery and (2) the navigation-resume gap. Every rule above targets one of those
two. Keep that framing when extending Feather: reduce discovery cost, and make human handoffs survive
navigation.
