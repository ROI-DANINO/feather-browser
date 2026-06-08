# Pause-for-Human — Design

**Date:** 2026-06-08
**Status:** Design approved (brainstorm), pending spec review → implementation plan.
**Phase:** 4a / Feather v1 — precursor to the v1 Instagram test.
**Classification:** Core agent-driving primitive. Low-risk (read-only waiting; no capability gate).

> The thin, ungated version of human-in-the-loop. The **Resume** half is the exact seam the
> v2 MFA Handler (`docs/specs/2026-06-07-mfa-handler-design.md`) later grows into. Nothing here is
> throwaway.

## Why

An agent driving Feather over HTTP hits walls only a human can clear (CAPTCHA, "confirm you're
human", an occasional manual verify). Today the only "pause" is ad-hoc chat coordination ("type
'done' and I'll continue"), which is flimsy, and `scripts/demo/continuity.ts` — a login-specific
poll loop that auto-detects a success element. We want a **reusable, dependable** way for the agent
to say "I need a human here," wait, and resume cleanly on **any** wall.

An agent over HTTP is never "interrupted" — it *chooses* to pause by calling a blocking operation,
and "resume" means that call returns. External "detect the human grabbing the mouse" interruption is
explicitly **out of scope** (that is v2+).

## Goal

One small, reusable primitive: the agent calls **pause**, Feather surfaces the reason + a **Resume**
control and waits; the wait ends when the human clicks Resume (backbone), an optional success signal
appears (accelerator), or a timeout passes. Feather reports *how* it resumed and the agent continues.

## Non-goals (YAGNI)

- No automatic detection of the human taking control (no mouse/pointer interception). v2+.
- No capability gate / `humanToken` security stack / CSRF / Origin-Host hardening. This is the v1
  throwaway-profile path; the gated version is v2 (Gate A → MFA Handler).
- No Telegram / remote notification channel (v2 designed-in seam, not built here).
- No credential handling. The agent reads its own throwaway email off the warm Gmail session; it
  never receives raw credentials.

## Behavior

1. Agent calls **pause** with a short `reason` and, optionally, a `resumeOn` success signal.
2. Feather:
   - logs the `reason` + Resume URL (structured JSONL, existing redaction applies),
   - emits a `human-pause` event on the existing SSE bus (`src/transport/sse.ts`),
   - starts waiting.
3. Human performs the step in the browser window.
4. The wait ends on the **first** of:
   - **human** — the human clicks Resume (always available; the backbone),
   - **signal** — the optional `resumeOn` target reaches its state (the accelerator),
   - **timeout** — the deadline passes (never hangs forever).
5. Feather returns `{ resumedBy: "human" | "signal" | "timeout", elapsedMs }`. The agent continues;
   on `timeout` it can re-prompt rather than fail.

## API surface

Follows existing route/handler/Zod patterns in `src/transport/routes.ts`.

### Pause (agent side, token-authed like all other commands)

`POST /v1/sessions/:sessionId/await-human`

```jsonc
// body
{
  "reason": "Solve the CAPTCHA, then click Resume.",   // required, human-facing
  "resumeOn": {                                          // optional accelerator
    "target": { "by": "role", "role": "heading", "name": "Home" },
    "until": "visible"                                   // reuses Wait semantics
  },
  "timeoutMs": 300000                                    // optional; default 300000 (5 min)
}
```

```jsonc
// data (success envelope { ok, requestId, data })
{ "resumedBy": "human", "elapsedMs": 42318 }
```

`resumeOn.target` reuses the existing `TargetSchema` + locator resolution; `until` reuses the
element-state set from Wait (`visible | hidden | attached | detached`). When `resumeOn` is omitted,
only the human click or timeout can end the wait.

### Resume (human side, clicked from a browser — cannot send the API token header)

Because a browser click cannot set `X-Feather-Token`, **pause mints a single-use resume token** and
embeds it in the link. (This single-use token prefigures v2's `humanToken`.)

- `GET /v1/sessions/:sessionId/resume?token=<one-time>` → serves a tiny local HTML page showing the
  `reason` and a **Resume** button. Lives entirely off the target site (zero injection into the page
  under test → no stealth impact).
- `POST /v1/sessions/:sessionId/resume?token=<one-time>` → the button's action; validates the
  single-use token, ends the matching wait, renders "✓ Resumed — you can return to the agent."

A stale/used/wrong token renders a clear "already resumed or expired" page (idempotent, no error
spam).

## Components (all small)

| Piece | Where | Notes |
|---|---|---|
| `AwaitHumanHandler` | `src/commands/await-human.ts` | the blocking wait; races human-signal vs `resumeOn` locator vs timeout |
| pause/resume routes | `src/transport/routes.ts` | mirror existing handler-wiring; new error codes as needed |
| resume token registry | small in-memory map keyed by sessionId | single-use; cleared on resume/timeout |
| resume HTML page | inline template (one file) | reason + button; no framework |
| SSE event | `src/transport/sse.ts` | add `human-pause` event type |
| types | `src/sessions/types.ts` | `AwaitHumanInput` / `AwaitHumanOutput` |

## Data flow

```
agent --POST await-human--> Feather: mint resume token, log+SSE(reason,link), start race
human --opens Resume link (GET)--> tiny page (reason + button)
human --clicks Resume (POST,token)--> Feather: validate token, settle race -> resumedBy:"human"
            (or resumeOn target appears -> resumedBy:"signal")
            (or deadline -> resumedBy:"timeout")
Feather --returns {resumedBy, elapsedMs}--> agent continues
```

## Error / edge handling

- **Timeout:** returns `resumedBy:"timeout"` (not an error) so the agent re-prompts gracefully.
- **Double resume / stale token:** idempotent; second click shows "already resumed."
- **Session closed mid-wait:** the wait rejects with the existing `SESSION_NOT_RUNNING` semantics.
- **Token leakage:** local-only (`127.0.0.1`), single-use, short-lived; throwaway-profile scope.

## Testing

- **Unit (`AwaitHumanHandler`):** three exit paths — human-resume, signal-resume, timeout — plus
  single-use-token validation (valid / reused / unknown).
- **Integration:** launch a real session, call `await-human`, drive the resume route, assert the call
  returns `resumedBy:"human"`; and a `resumeOn` auto-resume path against a real element.
- Preserve existing snapshot/wait behavior (no regressions).

## Relation to v2

The **Resume** control (single-use token + local "Done" page) is a v1-thin instance of the v2 MFA
Handler's human-resolve step. v2 wraps the same shape in Gate A (Origin/Host, CSRF, the session-hold
primitive) and adds Telegram + code-typing-the-agent-never-sees. This design deliberately keeps the
*shape* compatible so v2 extends rather than replaces it.

## Addendum (2026-06-08) — on-page banner surface

After the dress-rehearsal, Roi asked for the resume control to be **visible on the working page**
rather than living only in a background tab he has to hunt for. Added a banner surface:

- On pause, inject a fixed strip at the top of the working page: `⏸ Feather paused: <reason>` + a
  **Resume ▸** button. Remove it the instant the pause resolves (so the DOM is clean before any
  automated action resumes).
- The button is a **cross-origin form POST** (`target="_blank"`) to the existing resume route — one
  click resumes, the `✓ Resumed` confirmation opens in a new tab, and the working page keeps its
  state. A form POST is a "simple request" (no CORS needed to *send*); we only can't read the
  response, which is fine because the confirmation renders in its own tab.
- **Requires** a Fastify parser for `application/x-www-form-urlencoded` (empty body, ignored) — its
  absence is what produced a 415 on form submit. Added globally; no other route uses urlencoded.
- The absolute resume URL (needed in the cross-origin form `action`) comes from a tiny
  `server-info` module that `startHttpServer` populates with `baseUrl` after `listen()`.
- **Toggle:** `banner` field on `await-human` (default `true` for v1 usability). `banner:false`
  keeps the stealth-safe off-page-only behavior. The off-page resume route is unchanged and still
  the fallback.

**Stealth note (reverses the original "off-page only" stance for v1):** the banner is injected only
while paused and removed before automation resumes, so the injected-DOM window is narrow. v2's
hardened mode should flip the default to `false` / make it conditional on flagged-sensitive sites.

**Known limitation:** an on-page banner does not survive a full page navigation (a CAPTCHA that
reloads drops it). The SSE `human.pause.requested` event + the off-page resume URL remain as the
navigation-proof fallback.

## Open questions

- None blocking. Naming (`await-human` / `resume`) can change in the plan if a clearer term surfaces.
