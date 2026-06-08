# Session: v1 Instagram Test — COMPLETE
**Date:** 2026-06-08  **Closed:** ~03:45 UTC  **Branch:** dev

## What happened

The v1 Instagram test ran end-to-end and passed. This was the primary goal of Phase 4a.

### Part 1 — Account creation
- Started Feather server, created a headed persistent session on the `scratch` profile (workspaceId: scratch)
- Navigated to `instagram.com/accounts/emailsignup/`
- Filled the full signup form via the HTTP API:
  - Email: `roionly9@gmail.com` — CSS `input at 0`, sequential type
  - Password: `Feather2026!test` — CSS `input at 1`
  - Birthday: January 15 1998 — `[role=combobox]` clicks + text targeting for month/day/year
  - Name: `Roi Feather` — CSS `input at 2`
  - Username: `feather_test_roi` — CSS `input at 3`, Ctrl+A + type to replace auto-filled value; showed green checkmark (available)
- Clicked Submit → IG returned "Enter the confirmation code" screen (6-digit code to `roionly9@gmail.com`)
- Opened Gmail in a new tab (`POST /v1/sessions/:id/tabs`, then explicit navigate)
- Code not in inbox — **found in spam** (`#spam` URL fragment). Code: **814065** (visible in subject line)
- Entered code on IG tab: `fill` and `sequential type` both failed (IG input ignores them); workaround = Shift+Tab from focused Continue button to move keyboard focus to input, then individual `press` per digit
- Pressed Enter → **"Welcome to Instagram, feather_test_roi"** — account created

### Part 2 — Social errand
- Navigated to `instagram.com/shaked_golan1/`
- Clicked latest post (top-left grid item, CSS `._aagw` / `a[href*='/p/']` at 0)
- Post: Sinai desert camp (Paradise Sweir Sinai Camp), caption "אחלה סיני", 34 likes, June 3 2023
- Read comments via snapshot: Hebrew vibes — "you're a king", "beast", "amazing Shaked"
- Liked post: `svg[aria-label='Like']` → heart turned red, confirmed by screenshot
- Clicked comment button: `svg[aria-label='Comment']` → comment input appeared
- Typed comment via `textarea` selector, sequential mode: *"Sinai looks unreal bro absolute king"*
- Clicked Post → comment confirmed live in thread as `feather_test_roi`

## Key findings

1. **Spam first for confirmation emails.** IG sends to spam; wasted ~2 min searching inbox. Now a memory rule.
2. **IG confirmation input ignores `fill` + `type` modes.** Must use Shift+Tab + individual `press` keypresses to land in the field.
3. **`workspaceId` is top-level in session create**, not inside `profile`. (Bug in earlier dry-run — re-learned here.)
4. **Tab API creates blank page** — must follow with explicit `/navigate` call; the URL in the `tabs` POST doesn't auto-navigate.
5. **Screenshot + Shift+Tab trick is the pattern** for interacting with focused-but-not-clickable inputs on IG.

## Deferred (pre-existing, unchanged)
- Resume-confirmation linger ~1s (UX polish, `pause-banner.ts`)
- Disposable headed-CDP `ENOTEMPTY` cleanup race
- No `selectOption` command
- `extract` returns empty body on multi-match selectors

## Verdict
**PASS.** Agent drove Feather end-to-end on a real social site — signup, email verification from a separate tab, social interaction (like + comment). Core driving works; friction is element-discovery and a few small gaps.

## Next
**Session 4a.8 — Markdown snapshot extraction** (port Crawl4AI's DefaultMarkdownGenerator to TS). First v1 "Port".
