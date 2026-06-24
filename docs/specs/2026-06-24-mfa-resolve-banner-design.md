# MFA Resolve-Banner — local in-browser channel (2026-06-24)

> **Status:** Accepted (Roi, 2026-06-24). Small feature on the MFA/security path. Lets a solo operator
> resolve an MFA challenge **without Telegram**: an in-browser banner opens Feather's resolve form.

## Problem

After the Phase-1a fix, the MFA bearer token (`humanToken`) no longer prints to the console — it only
travels a private channel (Telegram). With no Telegram configured, a local operator has no way to reach
the token-bearing resolve page (`/v1/mfa/<id>?t=<token>`). This adds a local channel.

## Design

When an MFA challenge fires on a headed session, Feather injects a banner at the top of the watched
page: *"🔒 Feather needs a 2FA code — Open 2FA tab ▸"*. Clicking it opens a new tab at the resolve
form; the human enters the code and submits (the existing resolve flow). Banner clears on resolve/expire.

### Security property (the reason this needs care)

MFA often fires on the hostile site demanding 2FA, so **the token must never enter the watched page's
DOM**:

- The banner button carries **no token and makes no network call** — it only sets a DOM flag
  (`data-open-resolve="1"`), exactly like the existing Resume banner (PNA/CORS-proof).
- **Feather** polls that flag over CDP and **opens the new tab itself** (`context.newPage()` →
  `goto(tokenUrl)`). The watched page's JS is never involved and cannot read another tab's URL.
- Even if a malicious page force-sets the flag, the worst case is an extra resolve tab opens — the token
  still never reaches the watched page, and the form still requires the human to type the code.

### Components

1. **`src/browser/pause-banner.ts`** — refactor the injector into a shared `injectBanner(page, spec)`;
   keep `showBanner` (Resume, unchanged behavior) and add `showResolveBanner` (separate id
   `__feather_resolve_banner__`, "Open 2FA tab ▸" button, `data-open-resolve` flag), plus
   `resolveTabRequested` / `removeResolveBanner` / `markBannerOpened`.
2. **`src/mfa/resolve-banner.ts`** — `startResolveBanner({ page, context, prompt, humanUrl })`: shows the
   banner, re-injects on `domcontentloaded`, polls the flag, opens **one** new tab at `humanUrl` over
   CDP, returns a `dispose()` (stop poll, remove banner). Plus `makeResolveBannerController(sessions)`
   that resolves the real page/context from a session id.
3. **`src/mfa/manager.ts`** — optional injected `banner` controller. `createChallenge` calls
   `banner.show(...)` (best-effort, never breaks the challenge) and stores the handle in internals;
   `resolveChallenge`/`expire` call `handle.dispose()`.
4. **`src/transport/routes.ts`** — wire the real controller (it has the full `SessionManager`).

Default-on, best-effort: a headless/no-page session just no-ops. Rejected alternatives: a `BannerNotifier`
(the notifier interface has no page handle) and generalizing await-human (YAGNI — this is MFA-specific).

## Testing (TDD)

- **Integration (real Chromium):** banner appears; the watched page DOM never contains the token; setting
  the flag makes Feather open exactly one new tab at the token URL; `dispose()` removes the banner.
- **Unit:** the manager calls `banner.show` on create and `handle.dispose` on resolve/expire (mock controller).
