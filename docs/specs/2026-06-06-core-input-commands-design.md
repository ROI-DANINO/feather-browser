# Design: Core Input Commands — Feather learns to act

**Date:** 2026-06-06
**Status:** Approved (hardened pass — verified against installed Playwright 1.60.0 + real code)
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

## Verified facts (Playwright 1.60.0, this machine — not assumed)

These were checked against `node_modules` and the live `require("playwright")`, because the
whole design rests on them:

- `Locator.fill()` officially accepts `<input>`, `<textarea>`, **and `[contenteditable]`** — so
  ChatGPT's ProseMirror composer is supported. It **throws** on any other element type.
- `Locator.pressSequentially()` exists (the contenteditable fallback path).
- `Locator.first()`, `.last()`, `.nth(index)` all exist (positional targeting).
- `Locator.waitFor({ state })` states are exactly `"attached" | "detached" | "visible" | "hidden"`.
- `getByTestId` resolves the **`data-testid`** attribute by default.
- `require("playwright").errors.TimeoutError` is an exported constructor → reliable
  `err instanceof errors.TimeoutError` checks.
- `src/transport/http.ts` runs `Fastify({ logger: false })`; the sole `onRequest` hook only
  injects a request id; no route logs `request.body`. **Command payloads are not logged today**
  (see Security).

## Targeting model — how a command finds its element

A single **`Target`** object: a discriminated union on `by`, plus an optional positional
selector `at`. This is the robust, Playwright-recommended approach — prefer "the button labelled
Send" over "the third div" so the demo survives ChatGPT/Gmail reshuffling their obfuscated
markup. Raw CSS stays available as the escape hatch and keeps parity with `extract`.

```typescript
type TargetBy =
  | { by: "role"; role: string; name?: string; exact?: boolean }   // getByRole
  | { by: "text"; text: string; exact?: boolean }                  // getByText
  | { by: "placeholder"; text: string }                            // getByPlaceholder
  | { by: "testid"; testId: string }                               // getByTestId (data-testid)
  | { by: "css"; selector: string };                               // locator(css)

export type Target = TargetBy & {
  /** Which match to use when several match. Default "first". */
  at?: "first" | "last" | number;
};
```

**Why `at` is not optional polish:** ChatGPT renders the user message *and* its reply as sibling
"message" nodes. A target that matches "assistant message" matches both, and the **new reply is
the last one**. With only `.first()` hardwired, the demo would forever read the oldest message
and the streamed reply would be unreachable by role/text. `at: "last"` makes it reachable.

### Shared resolver — `src/browser/locators.ts` (new file)

The single source of truth for targeting, imported by all four commands. One isolated,
independently testable unit: input a `Page` + `Target`, output a Playwright `Locator`.

```typescript
import type { Page, Locator } from "playwright";
import type { Target } from "../sessions/types";

function base(page: Page, t: Target): Locator {
  switch (t.by) {
    case "role":
      return page.getByRole(
        t.role as Parameters<Page["getByRole"]>[0],
        t.name !== undefined ? { name: t.name, exact: t.exact } : undefined,
      );
    case "text":        return page.getByText(t.text, { exact: t.exact });
    case "placeholder": return page.getByPlaceholder(t.text);
    case "testid":      return page.getByTestId(t.testId);
    case "css":         return page.locator(t.selector);
  }
}

export function resolveLocator(page: Page, target: Target): Locator {
  const loc = base(page, target);
  const at = target.at ?? "first";
  if (at === "first") return loc.first();
  if (at === "last") return loc.last();
  return loc.nth(at); // non-negative integer
}
```

Always reducing to a single-element locator (`first`/`last`/`nth`) means Playwright's strict-mode
"multiple matches" error can never be thrown by our commands — the caller narrows via a more
specific target or `at`.

**Locators are lazy** — they re-query the DOM on every action. This matters for `wait stable`
(below): ChatGPT replaces the answer node mid-stream, and a freshly-evaluated locator picks up
the replacement automatically.

## The four commands

All follow the existing handler pattern exactly: a small `*Handler` class implementing
`CommandHandler<TIn, TOut>`, constructed with the manager, resolving the page via
`session.getPage(pageId)`, returning a plain object the route wraps in `{ ok, requestId, data }`.
Like `navigate`/`snapshot`/`extract`, **handlers emit no events** (the `PAGE_*` names in
`events.ts` are defined but currently unused; staying consistent — no new events here).

Every command applies its **own default timeout in the handler** (`timeoutMs ?? <default>`) rather
than relying on Playwright's 30s global default, so behaviour is explicit and testable. Every
action is wrapped by the shared error mapper (see API contract) so Playwright internals never
leak raw to the client.

### `click` — `src/commands/click.ts`

```typescript
export interface ClickInput  { sessionId: string; pageId?: string; target: Target; timeoutMs?: number; }
export interface ClickOutput { pageId: string; clicked: true; }
```

`await resolveLocator(page, target).click({ timeout: timeoutMs ?? 15000 })`.

### `type` — `src/commands/type.ts`

Named `type` (plain English); default implementation is Playwright `fill` (clears the field,
sets the value, dispatches `input`/`change` — the recommended way to drive React/ProseMirror
inputs). A `sequential` mode is included because contenteditable editors occasionally ignore
`fill`'s synthetic input and only react to real keystrokes — cheap insurance for the exact demo
target.

```typescript
export interface TypeInput {
  sessionId: string; pageId?: string; target: Target; text: string;
  mode?: "fill" | "sequential";   // default "fill"
  delayMs?: number;               // only for sequential; per-keystroke delay
  timeoutMs?: number;
}
export interface TypeOutput { pageId: string; typed: true; }
```

- `mode: "fill"` (default): `loc.fill(text, { timeout: timeoutMs ?? 15000 })`.
- `mode: "sequential"`: `loc.pressSequentially(text, { delay: delayMs, timeout: timeoutMs ?? 15000 })`.
  (`pressSequentially` does not clear first; intended for empty/contenteditable composers.)

### `press` — `src/commands/press.ts`

```typescript
export interface PressInput  { sessionId: string; pageId?: string; target?: Target; key: string; timeoutMs?: number; }
export interface PressOutput { pageId: string; pressed: string; }
```

- With `target`: `await resolveLocator(page, target).press(key, { timeout: timeoutMs ?? 15000 })`
  (focuses the element, then presses) — **the deterministic, recommended form**.
- Without `target`: `await page.keyboard.press(key)` (presses on whatever is focused). `fill`
  leaves focus on the filled element, so `type` then bare `press "Enter"` works — but the demo
  should prefer the target form to avoid focus-timing assumptions.

`key` uses Playwright key syntax (`"Enter"`, `"Tab"`, `"Control+A"`).

### `wait` — `src/commands/wait.ts`

Two flavours, discriminated on `until`.

**Flavour A — wait for an element state** (everyday waiting):

```typescript
{ sessionId, pageId?, target: Target, until: "visible" | "hidden" | "attached" | "detached", timeoutMs? }
```

`await resolveLocator(page, target).waitFor({ state: until, timeout: timeoutMs ?? 15000 })`.
Returns `{ pageId, matched: true }`. (Playwright's native `waitFor` states only;
`enabled`/`disabled` deferred — not needed for the demo, and avoidable polling.)

**Flavour B — wait until the answer settles** (`until: "stable"`, the streaming primitive):

```typescript
{ sessionId, pageId?, target: Target, until: "stable", quietMs?, pollMs?, timeoutMs? }
```

Watches the target's text and resolves once it **stops changing**. Site-agnostic — depends on no
ChatGPT button or internal "done" marker, just notices the typing stopped.

**Hardened algorithm** (the naive "unchanged for quietMs" version falsely settles on the
attached-but-empty answer node ChatGPT creates before streaming begins):

1. Defaults: `quietMs` 1500, `pollMs` 250, `timeoutMs` 30000.
2. `await loc.waitFor({ state: "attached", timeout: timeoutMs })` first (a not-yet-rendered
   answer must not read as instantly stable).
3. Poll loop every `pollMs`, re-reading `await loc.textContent({ timeout: 1000 })` each tick
   (per-poll timeout so one hung read can't wedge the loop; a thrown/transient read — e.g. the
   node detaching mid-re-render — is treated as "unchanged, keep waiting").
4. Track `lastValue` and `lastChangedAt`. **The quiet timer only counts while the current text is
   non-empty.** Settle when: current text is **non-empty** AND unchanged for ≥ `quietMs`. Empty
   text never satisfies the condition (handles the attached-but-empty window).
5. On settle, resolve `{ pageId, settled: true, elapsedMs, text }` — `text` is the final observed
   value, trimmed and truncated to 20000 chars (matching `snapshot`). `textContent()` (not
   `innerText`) is used throughout: it's cheaper (no layout) and adequate for change detection.
6. If total elapsed exceeds `timeoutMs` before settling, throw `WAIT_TIMEOUT`.

```typescript
export type WaitOutput =
  | { pageId: string; matched: true }                                       // flavour A
  | { pageId: string; settled: true; elapsedMs: number; text: string };     // flavour B
```

**Known tunable tradeoff:** if a model pauses mid-answer longer than `quietMs`, settle can fire
early; the demo can raise `quietMs` (e.g. 2500). Returning `text` lets the demo read the reply in
the same call; it may still re-`extract` for structured fields. The settle loop lives inline in
`wait.ts` (small, single-purpose); extract to `src/browser/wait-stable.ts` only if it grows.

## Files

| File | Change |
|---|---|
| `src/sessions/types.ts` | Add `Target` (union + `at`) + the four command I/O interfaces |
| `src/browser/locators.ts` | **New** — `resolveLocator(page, target)` incl. `at` handling |
| `src/commands/click.ts` | **New** — `ClickHandler` |
| `src/commands/type.ts` | **New** — `TypeHandler` (`fill` / `sequential`) |
| `src/commands/press.ts` | **New** — `PressHandler` |
| `src/commands/wait.ts` | **New** — `WaitHandler` (both flavours) |
| `src/transport/routes.ts` | 4 Zod schemas + 4 POST routes; 3 new error codes in `ERROR_STATUS`; shared action-error mapper |
| `docs/api-reference.md` | Document the 4 new commands + the `Target` model |

## API contract

Four new authenticated routes, mirroring the existing per-session command routes:

```
POST /v1/sessions/:sessionId/click
POST /v1/sessions/:sessionId/type
POST /v1/sessions/:sessionId/press
POST /v1/sessions/:sessionId/wait
```

**`TargetSchema`** — Zod `discriminatedUnion("by", [...])` matching `TargetBy`, intersected with
`{ at: z.union([z.enum(["first","last"]), z.number().int().nonnegative()]).optional() }`.
Field validation: `role`/`text`/`selector`/`testId`/`key` are `z.string().min(1)`;
`quietMs`/`pollMs`/`timeoutMs`/`delayMs` are `z.number().int().positive().optional()`;
`mode` is `z.enum(["fill","sequential"]).optional()`; `until` per flavour via discriminated union.

**Error mapping.** A shared helper wraps each action: on `errors.TimeoutError` from an *action*
(`click`/`type`/`press`/`waitFor`), it inspects `await loc.count()` to give the caller a precise,
debuggable reason rather than a raw Playwright stack:

- `ELEMENT_NOT_FOUND` → **404** — count is 0 (target never matched).
- `ELEMENT_NOT_ACTIONABLE` → **409** — count > 0 but the action timed out (e.g. covered,
  disabled, off-screen).
- `WAIT_TIMEOUT` → **408** — `wait` did not satisfy its condition within `timeoutMs`.

These are added to `ERROR_STATUS`. `VALIDATION_ERROR` (400) continues via the existing `ZodError`
branch for malformed bodies/targets. The handler throws plain objects shaped `{ code, message }`
(message includes the human-readable target description), consistent with how existing errors
flow through `handleRouteError`.

## Security & logging (invariant)

Verified this session: Fastify's logger is **off** (`logger: false`) and no route or hook logs
`request.body`, so a `type` command's `text` — which **will** carry credentials in a future
agent flow — is **not** written to logs, traces (off by default per Spike C), or
`network-summary` (URLs only). **This spec must not introduce body logging.** The redaction layer
(`src/logs/redact.ts`) operates on URLs; command payload secrecy is preserved by *not emitting
the payload at all*, which is the stronger guarantee. (For the demo itself the typed text is
"hello world" — non-secret — but the invariant is set now so it holds when real creds flow.)

## Tests

TDD, real-Chromium gate — the same bar every Core feature has cleared.

**Unit — `tests/unit/browser/locators.test.ts`:** a fake `Page` records which `getBy*`/`locator`
method is called with which args, and which of `first`/`last`/`nth` is applied. Assert every `by`
routes correctly; assert `at` ("first" default / "last" / numeric `nth`) maps correctly.

**Unit — `tests/unit/commands/{click,type,press,wait}.test.ts`:** fake manager → fake page →
fake locator recording calls. Assert each handler calls the right Playwright method with the
right args and default timeout (`type` default → `fill(text,{timeout:15000})`; `type` sequential
→ `pressSequentially(text,{delay,timeout})`; `press` no-target → `keyboard.press(key)`; `press`
target → `loc.press(key,{timeout})`; `wait` A → `waitFor({state})`). For `wait` B, drive a fake
locator whose `textContent()` returns "" for the first ticks (assert it does **not** settle while
empty), then a growing string, then a constant — assert it settles after `quietMs` with the final
text; assert `WAIT_TIMEOUT` when it never settles. Use fake timers. Unit-test the error mapper:
`TimeoutError` + `count()===0` → `ELEMENT_NOT_FOUND`; `count()>0` → `ELEMENT_NOT_ACTIONABLE`.

**Integration — `tests/integration/input-commands.integration.test.ts`** (real Chromium,
`chromium-new-headless` so it runs on CI without Wayland). Pages are inline `data:` URLs — no
fixture files, fully self-contained:

1. **Form fixture** — a `placeholder="Message"` input, a `<button>Send</button>`, JS copying the
   input value into `#result` on click. Test: `type` by placeholder → `click` by role+name
   "Send" → assert `#result` (via `extract`) equals the typed text. Proves act + robust targeting.
2. **Contenteditable fixture** — a `[contenteditable]` div mirroring its text into `#result` on
   `input`. Test: `type` (default `fill`) into it → assert `#result`. Proves the ChatGPT-composer
   element type works (the riskiest demo assumption).
3. **`at: "last"` fixture** — two elements sharing a role/text; assert `click`/read with
   `at:"last"` hits the second, `at:"first"` (default) hits the first. Proves the new-reply
   targeting the demo depends on.
4. **press fixture** — an input whose Enter `keydown` writes `#result`. Test: `type` then `press`
   `Enter` with the target → assert handler fired.
5. **Streaming fixture** — a `<button>Go</button>` that, on click, first attaches an **empty**
   `#answer` node, waits 400ms, then appends a word every 200ms for ~1.4s, then stops. Test:
   `click` Go → `wait until:"stable"` on `#answer` → assert returned `text` contains the full
   final string AND `elapsedMs` ≥ the empty-window + streaming duration (proves it did **not**
   settle on the empty node and did **not** return mid-stream). This is the streaming-primitive
   proof.
6. **Error-path** — `click` a target that matches nothing → assert `404 ELEMENT_NOT_FOUND`.

## Sequencing & verification

Build order: `locators.ts` → `click` → `type` → `press` → `wait` → routes + error mapper →
api-reference. Each command unit-tested before wiring its route. Final gate before "done": full
unit suite, `tsc --noEmit` clean, and the new integration test green against real Chromium
(locally on Wayland and on CI).

After this lands, the downstream HERO DEMO tasks (warm ChatGPT, write the cross-site script,
record) can proceed — Feather will have hands.
