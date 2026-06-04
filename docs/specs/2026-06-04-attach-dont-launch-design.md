# Design: Productionize Attach-Don't-Launch (Task #2)

**Date:** 2026-06-04
**Status:** Approved
**Phase:** 4 — pre-shell infrastructure sequence, step 2

## Problem

`src/sessions/manager.ts` uses `chromium.launchPersistentContext()` to start all browser sessions. Playwright-launched browsers carry an automation fingerprint (`navigator.webdriver=true`), which gets flagged by Google, Cloudflare, and similar bot-detection systems. This blocks the Cookie Mine (ADR-0007).

The proven fix (spiked 2026-06-04): spawn Chromium normally via `child_process.spawn` (no automation flags), then connect via `connectOverCDP` → `navigator.webdriver=false`. Logged into real ChatGPT with no CAPTCHA.

## Scope

Minimal viable, done cleanly. No gold-plating. Existing headless modes (`chromium-new-headless`, `chromium-headless-shell`) stay untouched.

`FEATHER_CHROMIUM_PATH` env-var configuration is **Task #3 (separate)**. Task #2 uses `chromium.executablePath()` (bundled Playwright Chromium) as the hardwired default.

## Changes

| File | Change |
|---|---|
| `src/sessions/types.ts` | Add `"chromium-headed-cdp"` to `BrowserMode` union |
| `src/browser/modes.ts` | Add `spawnAndConnect()` function |
| `src/sessions/session.ts` | Add `_childProcess` field + `setChildProcess()` / `getChildProcess()` |
| `src/sessions/manager.ts` | Branch on `"chromium-headed-cdp"` in `launch()`; kill child process in `close()` |

No new files. No config, transport, or unrelated changes.

## `spawnAndConnect()` — the core function

Lives in `src/browser/modes.ts`. Signature:

```typescript
export async function spawnAndConnect(opts: {
  profilePath: string;
  executablePath: string;
}): Promise<{ context: BrowserContext; childProcess: ChildProcess }>
```

`browser` is used internally but not returned — the close sequence (`context.close()` + `childProcess.kill()`) needs no browser reference.

**Step 1 — Spawn.** `child_process.spawn` with these flags and nothing else:
- `--remote-debugging-port=0` (OS picks a free port)
- `--user-data-dir=<profilePath>`
- `--no-first-run`
- `--no-default-browser-check`
- `--ozone-platform=wayland` (Fedora/Wayland target; proven in spike — without this, falls back to XWayland)

No `--headless`, no `--enable-automation`, no `--no-sandbox`, no Playwright automation args.

Proxy is **out of scope** for `"chromium-headed-cdp"` in Task #2 — the human-facing session won't use a proxy. Add in a future task if needed.

**Step 2 — Wait for CDP.** Chromium writes `DevTools listening on ws://127.0.0.1:<port>/...` to stderr when ready. We listen on stderr, parse that line, extract the WebSocket URL. If it doesn't appear within 10 seconds, reject with a clear error message and kill the spawned process.

**Step 3 — Connect.** `await chromium.connectOverCDP(wsEndpoint)`. Take `browser.contexts()[0]` as the context (Chromium always has a default context). Return `{ browser, context, childProcess }`.

## Process lifecycle

`FeatherSession` grows two additions:
- `_childProcess: ChildProcess | null = null`
- `setChildProcess(cp: ChildProcess): void`
- `getChildProcess(): ChildProcess | null`

The session already owns `BrowserContext`; owning the process is consistent — one object holds everything needed to shut down a session.

In `manager.ts` `close()`: after `context.close()`, call `session.getChildProcess()?.kill()`. One line.

## `manager.ts` launch branch

```
if (browserMode === "chromium-headed-cdp") {
  const executablePath = chromium.executablePath();
  const { context, childProcess } = await spawnAndConnect({ profilePath, executablePath });
  session.setContext(context);
  session.setChildProcess(childProcess);
} else {
  // existing launchPersistentContext path
}
```

Note: `chromium.executablePath()` will be replaced by the `FEATHER_CHROMIUM_PATH`-aware resolver in Task #3.

## Tests

**Unit (`tests/unit/browser/modes.test.ts`):**
- Mock `child_process.spawn` + `chromium.connectOverCDP`
- Assert correct CDP line parsing → wsEndpoint extracted
- Assert timeout path: rejects with clear error + kills process
- Assert returned shape `{ browser, context, childProcess }`

**Integration (`tests/integration/attach-cdp.integration.test.ts`):**
- Actually spawn the bundled Playwright Chromium
- Connect via `spawnAndConnect()`
- Assert `await page.evaluate(() => navigator.webdriver) === false`
- Clean shutdown

The integration test is the anti-detection proof. It validates the reason this task exists.

## Future: `src/browser/attach.ts`

When `modes.ts` grows (beyond ~100–150 lines) or the CDP-attach path diverges from Playwright-native launch options, extract `spawnAndConnect()` into a dedicated `src/browser/attach.ts`. Don't split prematurely.
