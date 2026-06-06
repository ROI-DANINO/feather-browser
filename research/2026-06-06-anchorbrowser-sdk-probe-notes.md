# anchorbrowser SDK — raw probe notes

**Date:** 2026-06-06 · **Companion to:** `2026-06-06-anchor-browser-product-reference.md`
**Probe:** `npm pack anchorbrowser` (v0.16.3) in throwaway worktree `crash/anchor-sdk-probe`
(`../feather-anchor-probe`). Package unpacked and read; **nothing installed or executed**. Artifacts
were throwaway and not committed. This file preserves the ground-truth evidence.

## Package facts

```
name: anchorbrowser  version: 0.16.3
description: "The official TypeScript library for the Anchorbrowser API"
repo: github.com/anchorbrowser/AnchorBrowser-SDK-Typescript   (Stainless-generated)
dependencies: { "playwright": "^1.57.0", "ws": "^8.18.3" }
main: ./index.js   (also ESM .mjs)   total files: 577
```

## Resource surface (`package/resources/`)

`agent`, `sessions`, `tools`, `task`, `identities`, `applications`, `profiles`, `extensions`,
`events`, `browser`, `shared`.

## Connect mechanism (`lib/browser.js`) — verified, not marketing

```js
// apiBaseURL https→wss, then:
getCdpUrl = (apiBaseURL, sessionId, apiKey) =>
  `${apiBaseURL→wss}/ws?sessionId=${sessionId}`        // + apiKey
connect = async (...) => chromium.connectOverCDP(getCdpUrl(...))   // playwright
```
→ Cloud browser = **CDP-over-WebSocket**; SDK attaches Playwright. Same control model as Feather's
local `spawnAndConnect`; difference is deployment (cloud ephemeral VM) not mechanism.

## Key signatures (`resources/agent.d.ts`, `browser.d.ts`)

```ts
// browser.d.ts
class Browser { connect(sessionId): Promise<playwright Browser>;
                create({sessionOptions?}): Promise<playwright Browser>; }

// agent.d.ts
class Agent {
  task(prompt, {sessionOptions?, taskOptions?, sessionId?}): Promise<AgentTaskResult>;
  browserTask(prompt, {...}): Promise<{ sessionId, taskResultPromise, playwrightBrowser }>;
  // private: setupWebSocket()  // "agent step notifications" live stream
}
// agent.js: task payload carries cdp_url: getCdpUrl(baseURL, sessionId, apiKey)
```

`browserTask` returning a live `playwrightBrowser` alongside `taskResultPromise` = the **AI + deterministic
Playwright interleave** in one session.

## Session config knobs (`resources/sessions/sessions.d.ts`)

Flat `{active:boolean}`-style feature flags on the session `browser`/`session` config:
`adblock`, `extra_stealth`, `headless` (toggle; default headful), `captcha`, `popup_blocker`,
`recording`, `viewport`, `profile`, `web_bot_auth`, and `proxy` =
`anchor_proxy` (`country_code` enum ≈150 countries for geolocation) **or** `custom` proxy.
Identities passed at create via `identities: [{ id }]`. Integration type seen: `'1PASSWORD'`.

## What this confirms vs. docs/marketing

- ✅ connect-over-CDP + bundled Playwright (architecture)
- ✅ one-line `agent.task(prompt)` MVP
- ✅ hybrid AI/deterministic control (`browserTask`)
- ✅ ~150-country geolocation, proxy/stealth/captcha as session flags
- ✅ headful default (headless is opt-in)
- ⚠️ stealth *mechanism* still opaque (SDK only sets `extra_stealth:{active}` — server-side logic)
</content>
