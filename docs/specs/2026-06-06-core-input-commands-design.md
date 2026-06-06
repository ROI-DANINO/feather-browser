# Design: Core Input Commands — Feather learns to act

**Date:** 2026-06-06
**Status:** Approved
**Phase:** 4 — HERO DEMO enablement (gating Core work; precedes the ChatGPT→Gmail demo)

## Problem

Feather Core is **observe-only**. The command surface is `close, debug-bundle, extract,
launch, navigate, open-tab, screenshot, snapshot, status` — Feather can look at a page but
cannot touch it. The HERO DEMO (ChatGPT → type "hello world" → send → wait for the streamed
reply → extract it → Gmail draft) requires Feather to **act**: click, type, press a key, and
**wait for a streaming answer to finish** before reading it.

Playwright underneath fully supports all of this. The gap is purely Feather's own surface:
command handlers + a targeting model + the API contract + tests.

This is **Feather Core** work, not Phase 5. We are adding verbs to the existing local API
(the same kind of thing `navigate` is). We are **not** building an agent: no perception, no
decision-making, no autonomy. The "agent" that drives these commands in the demo is an
ordinary script calling the HTTP API in order.

## Scope

**In:** four new commands — `click`, `type`, `press`, `wait` — plus one shared element-targeting
helper, their Zod schemas + routes, unit + real-Chromium integration tests, and an
`api-reference.md` update.

**Out (separate downstream tasks, not this spec):** warming a ChatGPT session, the cross-site
demo script itself, and recording the demo. Also out: drag, hover, select-option, file upload,
scroll, multi-element batch actions — add later only if a real need appears (YAGNI).

No new browser mode. These commands are **mode-agnostic** — they operate on the Playwright
`Page` and work identically under `chromium-new-headless` (used by the CI integration test) and
the `chromium-headed-cdp` stopgap (used by the real demo).

## Targeting model — how a command finds its element

A single **`Target`** object, a discriminated union on `by`. This is the robust, Playwright-
recommended approach: prefer "the button labelled Send" over "the third div", so the demo
survives ChatGPT/Gmail reshuffling their obfuscated markup. Raw CSS stays available as the
escape hatch and keeps parity with the existing `extract` command.

```typescript
export type Target =
  | { by: "role"; role: string; name?: string; exact?: boolean }   // getByRole
  | { by: "text"; text: string; exact?: boolean }                  // getByText
  | { by: "placeholder"; text: string }                            // getByPlaceholder
  | { by: "testid"; testId: string }                               // getByTestId
  | { by: "css"; selector: string };                               // locator(css)
```

### Shared resolver — `src/browser/locators.ts` (new file)

The single source of truth for targeting, imported by all four commands. One isolated,
independently testable unit: input a `Page` + `Target`, output a Playwright `Locator`.

```typescript
import type { Page, Locator } from "playwright";
import type { Target } from "../sessions/types";

export function resolveLocator(page: Page, target: Target): Locator {
  switch (target.by) {
    case "role":
      return page.getByRole(
        target.role as Parameters<Page["getByRole"]>[0],
        target.name !== undefined ? { name: target.name, exact: target.exact } : undefined,
      ).first();
    case "text":
      return page.getByText(target.text, { exact: target.exact }).first();
    case "placeholder":
      return page.getByPlaceholder(target.text).first();
    case "testid":
      return page.getByTestId(target.testId).first();
    case "css":
      return page.locator(target.selector).first();
  }
}
```

`.first()` everywhere mirrors `extract.ts` — a multi-match never throws Playwright's strict-mode
error; the caller narrows via a more specific target if needed.

## The four commands

All follow the existing handler pattern exactly: a small `*Handler` class implementing
`CommandHandler<TIn, TOut>`, constructed with the manager, resolving the page via
`session.getPage(pageId)`, returning a plain object wrapped by the route in the
`{ ok, requestId, data }` envelope. Like `navigate`/`snapshot`/`extract`, **handlers emit no
events** (the `PAGE_*` event names in `events.ts` are defined but currently unused; staying
consistent — no new events in this spec).

### `click` — `src/commands/click.ts`

```typescript
export interface ClickInput  { sessionId: string; pageId?: string; target: Target; timeoutMs?: number; }
export interface ClickOutput { pageId: string; clicked: true; }
```

`await resolveLocator(page, target).click({ timeout: timeoutMs })`. Default `timeoutMs` 15000.

### `type` — `src/commands/type.ts`

Named `type` (plain English for what it does); implemented with Playwright `fill` (clears the
field, sets the value, dispatches proper `input`/`change` events — the recommended way to drive
React/ProseMirror-controlled inputs like ChatGPT's composer).

```typescript
export interface TypeInput  { sessionId: string; pageId?: string; target: Target; text: string; timeoutMs?: number; }
export interface TypeOutput { pageId: string; typed: true; }
```

`await resolveLocator(page, target).fill(text, { timeout: timeoutMs })`. Default 15000.
(Character-by-character `pressSequentially` and a `clear` toggle are deliberately deferred —
add only if a real input rejects `fill`.)

### `press` — `src/commands/press.ts`

```typescript
export interface PressInput  { sessionId: string; pageId?: string; target?: Target; key: string; timeoutMs?: number; }
export interface PressOutput { pageId: string; pressed: string; }
```

- With `target`: `await resolveLocator(page, target).press(key, { timeout: timeoutMs })`
  (focuses the element, then presses).
- Without `target`: `await page.keyboard.press(key)` (presses on whatever is focused — e.g.
  Enter right after a `type` into the composer).

`key` uses Playwright key syntax (`"Enter"`, `"Tab"`, `"Control+A"`). Default 15000.

### `wait` — `src/commands/wait.ts`

Two flavours, discriminated on `until`.

**Flavour A — wait for an element state** (everyday waiting):

```typescript
{ sessionId, pageId?, target: Target, until: "visible" | "hidden" | "attached" | "detached", timeoutMs? }
```

`await resolveLocator(page, target).waitFor({ state: until, timeout: timeoutMs })`. Default 15000.
(These are Playwright's native `waitFor` states. `enabled`/`disabled` are deferred — not needed
for the demo, and avoidable polling.)

**Flavour B — wait for the answer to settle** (`until: "stable"`, the streaming primitive):

```typescript
{ sessionId, pageId?, target: Target, until: "stable", quietMs?, pollMs?, timeoutMs? }
```

Watches the target's text and resolves once it **stops changing**. Site-agnostic — it does not
depend on ChatGPT's buttons or internal "done" markers, just notices the typing stopped.

Algorithm:
1. `quietMs` default 1500, `pollMs` default 250, `timeoutMs` default 30000.
2. First wait for the target to be `attached` (so a not-yet-rendered answer node doesn't read as
   instantly "stable" at empty string).
3. Loop every `pollMs`: read `await locator.textContent()` (best-effort; treat read failure as
   "unchanged"). Track `lastValue` and `lastChangedAt`.
4. When `now - lastChangedAt >= quietMs`, resolve `{ settled: true, elapsedMs, text }` where
   `text` is the final observed value (truncated to 20000 chars, matching `snapshot`).
5. If total elapsed exceeds `timeoutMs` before settling, throw `WAIT_TIMEOUT`.

```typescript
export type WaitOutput =
  | { pageId: string; matched: true }                                       // flavour A
  | { pageId: string; settled: true; elapsedMs: number; text: string };     // flavour B
```

Returning the settled `text` lets the demo read the reply in the same call; the caller may still
re-`extract` if it wants structured fields. The settle loop lives inline in `wait.ts` (small,
single-purpose); extract to `src/browser/wait-stable.ts` only if it grows.

## Files

| File | Change |
|---|---|
| `src/sessions/types.ts` | Add `Target` union + the four command I/O interfaces |
| `src/browser/locators.ts` | **New** — `resolveLocator(page, target)` |
| `src/commands/click.ts` | **New** — `ClickHandler` |
| `src/commands/type.ts` | **New** — `TypeHandler` |
| `src/commands/press.ts` | **New** — `PressHandler` |
| `src/commands/wait.ts` | **New** — `WaitHandler` (both flavours) |
| `src/transport/routes.ts` | 4 Zod schemas + 4 POST routes; 2 error codes in `ERROR_STATUS` |
| `docs/api-reference.md` | Document the 4 new commands + the `Target` model |

## API contract

Four new authenticated routes, mirroring the existing per-session command routes:

```
POST /v1/sessions/:sessionId/click
POST /v1/sessions/:sessionId/type
POST /v1/sessions/:sessionId/press
POST /v1/sessions/:sessionId/wait
```

`TargetSchema` is a Zod `discriminatedUnion("by", [...])` matching the `Target` type. New error
codes in `ERROR_STATUS`:

- `ELEMENT_NOT_FOUND` → **404** — target never resolved / action timed out (Playwright
  `TimeoutError` from an action is caught in the handler and rethrown with this code + a clear
  message).
- `WAIT_TIMEOUT` → **408** — a `wait` did not satisfy its condition within `timeoutMs`.

`VALIDATION_ERROR` (400) continues to be handled by the existing `ZodError` branch for malformed
target specs.

## Tests

TDD, real-Chromium gate — the same bar every Core feature has cleared.

**Unit — `tests/unit/browser/locators.test.ts`:** a fake `Page` records which `getBy*` / `locator`
method is called with which args; assert each `by` value routes correctly and `.first()` is
applied.

**Unit — `tests/unit/commands/{click,type,press,wait}.test.ts`:** fake manager → fake page → fake
locator that records calls. Assert each handler calls the right Playwright method with the right
args (e.g. `type` → `fill(text, {timeout})`; `press` with no target → `keyboard.press(key)`;
`wait` flavour A → `waitFor({state})`). For `wait` flavour B, drive a fake locator whose
`textContent()` returns a growing string for a few polls then a constant, and assert it resolves
after the quiet period with the final text; assert the `WAIT_TIMEOUT` path when it never settles.
Use fake timers.

**Integration — `tests/integration/input-commands.integration.test.ts`** (real Chromium,
`chromium-new-headless` so it runs on CI without Wayland). Pages are inline `data:` URLs — no
fixture files, fully self-contained:

1. **Form fixture** — a `placeholder="Message"` input, a `<button>Send</button>`, and JS that on
   click copies the input value into `#result`. Test: `type` by placeholder → `click` by
   role+name "Send" → assert `#result` (via `extract`) equals the typed text. Proves act +
   robust targeting end to end.
2. **press fixture** — an input whose `keydown` Enter handler writes `#result`. Test: `type`
   then `press` `Enter` (no target, on focused element) → assert handler fired.
3. **Streaming fixture** — a `<button>Go</button>` that on click appends a word to `#answer`
   every 200ms for ~1.4s then stops. Test: `click` Go → `wait` `until:"stable"` on `#answer` →
   assert returned `text` contains the full final string **and** that wait did not return early
   (elapsedMs ≥ the streaming duration). This is the proof the streaming primitive works.

## Sequencing & verification

Build order: `locators.ts` → `click` → `type` → `press` → `wait` → routes → api-reference.
Each command unit-tested before wiring its route. Final gate before "done": full unit suite,
`tsc --noEmit` clean, and the new integration test green against real Chromium (locally on
Wayland and on CI).

After this lands, the downstream HERO DEMO tasks (warm ChatGPT, write the cross-site script,
record) can proceed — Feather will have hands.
