---
name: feather-human-handoff
description: Use when a Feather Browser task needs a human to step in — solving a CAPTCHA, completing MFA/2FA, approving a consent dialog, or any step the agent literally cannot do alone. Covers await-human, the on-page Resume banner, headed sessions, auto-detect via resumeOn, and the critical banner-dies-on-navigation limit. Triggers on "captcha", "pause for a human", "human in the loop", "MFA", "2FA", "verification code", "let me approve", "I'll do this part manually".
---

# Feather: Human Handoff

Builds on **using-feather-browser**. When the agent hits a wall only a human can clear, pause cleanly
with `await-human` instead of failing or guessing.

## Spotting the wall in observe

A CAPTCHA/consent wall is a *typed signal*, not a mystery: the `observe` response shows a blocking
overlay (`blocking: true`, high `coverPct`), page elements turn `state: "covered"` with `occludedBy`
set, and the only `actionable` entries carry an `overlayIndex` (they belong to the overlay). When you
see that pattern: stop, don't flail — try `dismiss` once if it's a consent banner, else hand off.
Note: `dismiss` **cannot reach buttons inside iframe overlays** (common for CAPTCHAs and consent
iframes) — those are exactly the handoff case.

## Requirements

- **Use a headed session** so the human can see and act: create with
  `"browserMode": "chromium-headed-cdp"`. A headless session has no window for the human to use.
- The server must have been started from a shell with the desktop display env
  (`WAYLAND_DISPLAY`/`DISPLAY`) or no window appears.

## Pause for a human

```http
POST /v1/sessions/:sessionId/await-human
{ "reason": "Solve the CAPTCHA, then click Resume", "banner": true }
```
- Injects an on-page **Resume** banner. Blocks until the human clicks it, an optional `resumeOn`
  signal fires, or `timeoutMs` elapses.
- Returns `resumedBy: "human" | "signal" | "timeout"`. Always branch on this — `timeout` means the
  human never acted; don't proceed as if they did.
- `banner: false` keeps the pause off-page (stealth) — only do this if you also provide `resumeOn`,
  or the pause has no visible way to resume.

## ⚠️ The one critical limit: the banner dies on navigation

The Resume banner is injected DOM. **A full page navigation destroys it** — so there's nothing left
to click and the call dangles until timeout.

- ✅ **Works:** in-place steps that stay on the same page — CAPTCHA, a consent checkbox, a
  same-page modal.
- ❌ **Breaks:** any step where the human's action causes a redirect — submitting a login, an OAuth
  hop, an MFA page that reloads. This is exactly the login/MFA case.

### Handling navigation steps

**Option A — auto-detect the landed page with `resumeOn`** (preferred for login/MFA). Instead of
relying on the banner click, tell Feather what the *post*-step page looks like and let it resume
itself when that appears:
```http
POST /v1/sessions/:sessionId/await-human
{
  "reason": "Complete the login in the window",
  "resumeOn": { "target": { "by": "text", "text": "Welcome back" }, "until": "visible" },
  "timeoutMs": 180000
}
```
This survives the navigation because it polls for an end-state, not a DOM banner.

**Option B — split the flow.** Pause *before* the navigating action for any same-page prep, let it
return, then `navigate`/`wait` for the post-login page yourself in a separate step.

## Pattern: CAPTCHA mid-task

```http
POST /v1/sessions/:sessionId/await-human
{ "reason": "Please solve the CAPTCHA shown, then click Resume ▸", "timeoutMs": 120000 }
```
Then check `resumedBy === "human"` before continuing. After resume, **re-observe** — the page
changed under you while you weren't looking; pre-pause refs are stale at best, and if the human's
action navigated they are expired (`REF_EXPIRED`). Act only on fresh refs.

## Checklist

- [ ] Headed session (`chromium-headed-cdp`)?
- [ ] Will the human's action navigate? → use `resumeOn`, not the bare banner.
- [ ] Branched on `resumedBy` (handled `timeout`)?
- [ ] Re-observed after resume, acting on fresh refs?

(Design background — why the banner is DOM-injected, and the v2 MFA Handler direction — is in
`docs/agent-playbook.md` → "The await-human navigation gotcha".)
