# Stealth Stack Design
**Date:** 2026-06-07
**Status:** 📐 Spec — ready for implementation planning
**Phase:** Phase 5 input (Agent Browsing Stack — Feature 1 of 3)
**Brief:** `docs/specs/2026-06-07-agent-browsing-stack-brief.md`
**Output spec:** `docs/specs/2026-06-07-stealth-stack-design.md` (this file)

---

## Goal

Make Feather's automated browser sessions indistinguishable from a real human browser on sites
with active bot detection (Tier C: LinkedIn, Instagram, Facebook, Cloudflare-protected,
DataDome-protected sites).

Feather already has a strong foundation: real headful system Chromium, `navigator.webdriver = false`
via CDP-attach (`spawnAndConnect`), human-warmed sessions (Cookie Mine), real GPU/fonts/canvas.
This spec fills the remaining gaps with four targeted layers and a fast/secure control model.

**Guiding constraints (from the master brief):**
- Local-first always — no cloud relay, no external fingerprinting services
- Lightweight — don't add weight unless it pulls real weight
- Legal — agent acts as the authorized user, not as an attacker; no captcha bypass, no
  paywall bypass, no mass scraping
- Gradual — each layer adds value on its own

---

## The Two Modes

### Fast (always-on, zero runtime overhead)

Applied to every session. No latency cost, no user decision required.

| Layer | What it does | Why |
|-------|-------------|-----|
| **1 — CDP surface minimization** | Do not enable `Runtime.enable` / `console.on` CDP events unless explicitly requested | Anchor Browser independently confirmed this is a real detection tell; Feather's self-test (`research/2026-06-05-anti-detection-self-test.md`) flagged it as an open gap |
| **2 — Consistent environment** | Pin viewport to 1280×900, timezone to system local, locale to `en-US`, `deviceScaleFactor` to 2 | Inconsistencies between these values and the real display are a low-cost detection signal; Feather's self-test confirms 1440×900 / dpr=2 on this box |

### Secure (opt-in or auto-applied on Tier C sites)

Adds behavioral and active hardening on top of Fast. Adds per-action latency (~50–150ms jitter).

| Layer | What it does | Why |
|-------|-------------|-----|
| **3 — Behavioral timing** | Randomized delay + jitter on every click, type, and scroll action | Synthetic events at machine speed (0ms between actions) are detectable by timing analysis; human actions have natural variance |
| **4 — Fingerprint consistency check** | WebGL vendor/renderer verification + font enumeration guard. **No canvas noise** (see note). | Catches the case where the real fingerprint has degraded (e.g. SwiftShader = headless leaked through); guards font probing against an empty-set tell |

> **Why no canvas noise injection.** An earlier draft proposed injecting per-session noise into
> canvas `getImageData`. We dropped it. Feather runs **real system Chromium with a real GPU**, so
> it already has a genuine, stable canvas fingerprint — exactly what a real human browser has.
> Injecting noise makes that fingerprint *unstable* across sessions, which is the signature of
> anti-fingerprinting tooling (Tor Browser, Brave shields) — i.e. it makes Feather look *more*
> like a privacy-hardened bot, not more human. The honest, lighter, and more human posture is to
> **leave the real canvas alone.** Layer 4 therefore *verifies* the real fingerprint is intact
> rather than *spoofing* it.

---

## Site Classification and the Recommendation System

### Tier C list

A static lookup built into `src/browser/stealth.ts`. No network call. No external dependency.

Initial Tier C domains and patterns:
- `linkedin.com`, `*.linkedin.com`
- `instagram.com`, `*.instagram.com`
- `facebook.com`, `*.facebook.com`

The list is a plain array of domain matchers — easy to extend in future without a schema change.

**v1 is domain-list only — by design.** The classifier decides from the **target URL alone**,
before any navigation. This is deliberate: the "stop before entrance" promise (below) only holds
if Feather can classify *without first visiting the site*. Header-based detection (Cloudflare
`cf-ray` / DataDome `x-datadome-*`) cannot do this — you must already be on the site to read its
response headers, by which point the fast-mode session is open and the chance to upgrade
pre-emptively is gone. Reactive header detection is therefore **deferred to a future version**
(see "Future" below), where it would surface as a post-navigation warning for the *next* visit,
not a pre-entrance gate. Keeping v1 to a domain list avoids a self-contradicting design and stays
lightweight.

### Two-path behavior

**Interactive session** (human is present — API call with human in the loop):
- If the target URL matches Tier C and `stealth.mode` is `fast` (or unset): Feather stops before
  the session opens and returns the recommendation soft-block in the response.
- Response uses Feather's standard envelope with HTTP `200` and a typed soft-block:
  `{ ok: false, requestId, error: { code: 'STEALTH_UPGRADE_RECOMMENDED', message: 'LinkedIn is a Tier C site — secure mode recommended', data: { recommendation: 'secure' } } }`.
- The caller re-submits with `stealth: { mode: 'secure' }` to proceed. The session does not open
  until the caller makes a deliberate choice.

**Autonomous agent** (no human in the loop — `autonomous: true` flag on session create):
- Auto-upgrade to secure on Tier C sites. No approval gate.
- Log entry records the upgrade: `[stealth] auto-upgraded to secure — Tier C site detected (linkedin.com)`.
- `stealthApplied` in the response reflects the upgraded mode.

**Explicit override always wins:** if the caller passes `stealth: { mode: 'secure' }` explicitly,
the classifier is bypassed and secure is applied regardless of domain. If the caller passes
`stealth: { mode: 'fast' }` explicitly on a Tier C site, fast is used with a warning in the log —
the human made a deliberate choice. (The soft-block only fires when mode was *unset*.)

---

## Architecture

### New file: `src/browser/stealth.ts`

Single-responsibility module for all stealth logic. Does not modify `modes.ts`.
Parallel to the existing proxy pattern (`ProxyConfig` in `src/sessions/types.ts`).

**Exports:**

```typescript
// Types
export type StealthMode = 'fast' | 'secure';
export interface StealthConfig { mode: StealthMode; }
export type SiteClass = 'standard' | 'tier-c';
export interface StealthResolution {
  mode: StealthMode;
  siteClass: SiteClass;
  recommendation?: string; // present when classifier fired and mode was not explicit
  autoUpgraded?: boolean;  // true when autonomous auto-upgrade occurred
}

// Site classification
export function classifySite(url: string): SiteClass

// Mode resolution (call before session opens)
export function resolveStealthMode(opts: {
  config: StealthConfig | null;
  url: string | null;
  autonomous: boolean;
}): StealthResolution

// Layer 1: CDP surface minimization (call on the context after connect)
// Suppresses Runtime.enable and disables console/error listeners on the stealth path
export function applyStealthCDP(
  context: BrowserContext,
  config: StealthConfig
): Promise<void>

// Layer 2: environment consistency (call on each new page)
export function applyStealthEnvironment(
  page: Page,
  config: StealthConfig
): Promise<void>

// Layer 3: behavioral timing wrapper
export function withStealthTiming<T>(
  fn: () => Promise<T>,
  config: StealthConfig
): Promise<T>

// Layer 4: fingerprint consistency check + font guard (call on each new page, secure only)
// Verifies real WebGL renderer is intact (flags SwiftShader); guards font enumeration.
// Does NOT spoof or inject canvas noise — see "Why no canvas noise injection" above.
export function applyFingerprintCheck(
  page: Page,
  config: StealthConfig
): Promise<{ ok: boolean; warnings: string[] }>
```

### Session type changes (`src/sessions/types.ts`)

Add `StealthConfig` to the session creation options — same pattern as `ProxyConfig`:

```typescript
export interface SessionCreateOptions {
  // ... existing fields ...
  stealth?: StealthConfig | null;
  autonomous?: boolean;
}

export interface SessionInfo {
  // ... existing fields ...
  stealthApplied: StealthMode;
  stealthRecommendation?: string;
}
```

### API changes (`POST /v1/sessions`)

Request body gains two optional fields:
- `stealth?: { mode: 'fast' | 'secure' }` — explicit mode selection
- `autonomous?: boolean` — if true, auto-upgrade on Tier C; no recommendation gate

Response gains (success case):
- `stealthApplied: 'fast' | 'secure'` — what was actually applied

When the classifier recommends an upgrade in interactive mode, the session is **not** opened.
Instead the standard envelope returns a typed soft-block (HTTP `200`, `ok: false`):
`{ ok: false, requestId, error: { code: 'STEALTH_UPGRADE_RECOMMENDED', message: '…', data: { recommendation: 'secure' } } }`.
Caller re-submits with `stealth: { mode: 'secure' }` to confirm.

### Integration point in session creation

In the session creation handler (wherever sessions are currently opened):
1. Call `resolveStealthMode({ config, url, autonomous })` — gets the resolution
2. If resolution returns a recommendation and session is interactive: return the
   `STEALTH_UPGRADE_RECOMMENDED` soft-block, do not open session
3. Otherwise: open the session as today (no change to `spawnAndConnect`)
4. After connect: call `applyStealthCDP(context, config)`
5. On each new page (via `context.on('page', ...)`): call `applyStealthEnvironment` and (if secure) `applyFingerprintCheck`
6. Action wrappers (click, type, scroll) call `withStealthTiming` when secure

---

## Layer Implementation Notes

### Layer 1 — CDP surface minimization

**What to avoid:** enabling `Runtime.enable` domain on the CDP session unless the caller
explicitly uses `console.on` or stack trace features. Playwright enables this domain when you
attach `page.on('console', ...)` listeners. Feather should not attach these by default on the
stealth path.

**Implementation direction:** audit all `page.on('console', ...)` and `page.on('pageerror', ...)`
calls in `src/`. Remove or gate any that are attached unconditionally on the real session path.
Verify with a CDP protocol inspector that `Runtime.enable` is not sent on a clean session open.

**Research directive for implementing agent:**
- Read the Chrome DevTools Protocol documentation for the `Runtime` domain:
  https://chromedevtools.github.io/devtools-protocol/tot/Runtime/
- Search for "Runtime.enable CDP detection" and "console listener webdriver detection" to
  understand how detectors observe this signal
- Check whether `playwright-core` exposes a way to suppress auto-enabling of CDP domains

### Layer 2 — Consistent environment

**What to set:** viewport, `deviceScaleFactor`, timezone ID, locale, `userAgent` (confirm it
matches the system Chromium version on the host — do not spoof a different version).

**Implementation direction:** use Playwright's `BrowserContext` options (`viewport`,
`deviceScaleFactor`, `timezoneId`, `locale`) at context creation time. Read the system timezone
via `Intl.DateTimeFormat().resolvedOptions().timeZone` at runtime rather than hardcoding.

**Research directive for implementing agent:**
- Read Playwright's `BrowserContext` options documentation for environment consistency:
  https://playwright.dev/docs/api/class-browser#browser-new-context
- Search for "Playwright timezone locale fingerprinting" for known inconsistency patterns
- Check the Feather self-test findings for what the real desktop values are on this machine

### Layer 3 — Behavioral timing

**What to add:** a randomized delay before each action completes. Range: 50–150ms per action,
drawn from a non-uniform distribution (slightly right-skewed, like real human reaction times).
Apply to: `click`, `type`/`fill`, scroll, `press`.

**Implementation direction:** wrap Feather's action handlers (in `src/sessions/` or wherever
click/type/press/scroll commands are dispatched) with `withStealthTiming`. The wrapper adds
a `await delay(randomInRange(50, 150))` before the action. For `type`, also add inter-keystroke
delay (10–30ms per character).

**Research directive for implementing agent:**
- Search for "human typing speed distribution milliseconds" and "mouse click reaction time
  distribution" for empirical data on realistic delay ranges
- Search for "bot detection timing analysis" to understand what detectors measure
- Look at how playwright-extra's `stealth` plugin handles timing, as a reference implementation
  (do not copy — understand the approach): https://github.com/berstend/puppeteer-extra
- Consider Fitts's Law for mouse movement timing if cursor path simulation is added later

### Layer 4 — Fingerprint consistency check + font guard

**No canvas spoofing.** Feather runs real Chromium on a real GPU and already has a genuine, stable
canvas/WebGL fingerprint — the same as any real human browser. Layer 4 *verifies* that real
fingerprint is intact; it does not spoof or inject noise (see "Why no canvas noise injection" in
the modes section above for the full rationale).

**WebGL vendor/renderer consistency check:** read the live GPU strings and assert they are a real
hardware renderer. On this machine the real values are `Google Inc. (Intel)` /
`ANGLE (Intel, Mesa Intel(R) Iris(R) Xe ...)`. **Flag (do not spoof)** if a `SwiftShader`
software renderer is detected — that means the headless path leaked through and the session is
already trivially detectable. Return this as a warning in `applyFingerprintCheck`'s result so the
caller/self-test can surface it.

**Font enumeration guard:** many sites enumerate installed fonts via canvas text measurement. The
guard ensures probing returns a consistent, realistic desktop font set — never an empty set, which
is itself a tell. Apply via `page.addInitScript`. This is the one active intervention in Layer 4,
and it is *additive consistency*, not spoofing.

**Research directive for implementing agent:**
- Read: https://coveryourtracks.eff.org/ — run this against a Feather session to see what
  the baseline (real) fingerprint looks like; confirm canvas/WebGL are already plausible
- Read: https://bot.sannysoft.com/ — primary reference for CDP/automation detection signals
- Read: https://arh.antoinevastel.com/bots/areyouheadless — headless/automation detector
- Search for "WebGL SwiftShader detection headless" to confirm the renderer-leak signal
- Search for "font enumeration fingerprinting defense" for the font guard approach
- Review the `puppeteer-extra-plugin-stealth` source for the font/WebGL evasions specifically
  (reference only — do not import the library; and note we deliberately skip its canvas noise)

---

## Self-Test Extension

The existing probe script (`scripts/spikes/anti-detection-probe.ts`) must be extended to:

1. Run a Feather session (fast mode) against `https://bot.sannysoft.com/` and capture the result page
2. Run again in secure mode and compare
3. Report per-signal pass/fail: webdriver, userAgent, WebGL vendor/renderer, canvas hash, CDP tell (Runtime.enable), behavioral timing consistency
4. The self-test is a developer tool only — not shipped as a production endpoint

**Research directive for implementing agent:**
- Review the existing probe script before modifying it
- Understand what signals `bot.sannysoft.com` tests — inspect the page source or its GitHub repo
  to know what to assert against programmatically
- Search for "playwright bot detection test automation" to find other test harnesses used in
  the stealth community

---

## What This Is Not

- **Not captcha bypass.** If Feather hits a captcha, it surfaces it as a human-handoff event
  (Feature 2 — MFA Handler). Captcha solving is out of scope and ToS-sensitive.
- **Not paywall bypass or scraping infrastructure.** The legal constraint from the master brief
  applies: agent acts as the authorized user, not as an attacker.
- **Not a replacement for a warmed human session.** The stealth stack makes the browser look real;
  the Cookie Mine provides the trust context (real cookies). Both are needed for Tier C sites.
- **Not an arms race commitment.** Each layer is measured against real test sites before being
  declared effective. Claims are evidence-based, not asserted.

---

## Future (not in this spec)

**Reactive header-based Tier C detection.** v1 classifies from the URL alone (domain list). A
future version could *also* detect Cloudflare (`cf-ray`, `cf-mitigated`) and DataDome
(`x-datadome-*`) from response headers after the first navigation, surfacing a "this site uses bot
detection — consider secure mode for next visit" warning. This is **reactive, not preventive** (you
must already be on the site to read its headers), so it complements — never replaces — the v1
pre-entrance domain gate.

**Declared good-bot posture (Web-Bot-Auth / RFC 9421).** The sustainable long-term alternative to
stealth is *declaring* yourself a verified, authorized bot via RFC 9421 HTTP Message Signatures.
Cloudflare already accepts this from Anchor Browser. Standards-based, no arms race, legally clean.
Track at: https://www.rfc-editor.org/rfc/rfc9421

---

## Exit Criteria for Implementation

- [ ] `src/browser/stealth.ts` created with all exports defined above
- [ ] `StealthConfig` type added to `src/sessions/types.ts`
- [ ] Session creation handler calls `resolveStealthMode` and applies result
- [ ] `POST /v1/sessions` accepts `stealth` and `autonomous` fields; response includes `stealthApplied`
- [ ] Interactive Tier C detection returns the `STEALTH_UPGRADE_RECOMMENDED` soft-block (200, `ok: false`) before opening session
- [ ] Autonomous Tier C detection auto-upgrades and logs the upgrade
- [ ] Tier C classification is domain-list only (no header-based detection in v1)
- [ ] Layer 1 (CDP surface): verified via CDP protocol inspector that `Runtime.enable` is not sent on clean session open
- [ ] Layer 2 (environment): viewport/timezone/locale/dpr consistent; verified via self-test
- [ ] Layer 3 (behavioral timing): click/type/scroll wrapped with jitter in secure mode
- [ ] Layer 4 (fingerprint check): WebGL renderer verified (SwiftShader flagged) + font guard in secure mode; **no canvas noise injection**
- [ ] Self-test extended: bot.sannysoft.com run in fast and secure mode; per-signal report
- [ ] All existing tests still pass (`npm test`, `npm run test:integration`)
- [ ] TypeScript clean (`tsc --noEmit`)

---

## Files to Read Before Implementing

- `src/browser/modes.ts` — current session launch mechanics (do not modify)
- `src/sessions/types.ts` — existing session types including `ProxyConfig` (follow this pattern)
- `scripts/spikes/anti-detection-probe.ts` — existing self-test probe to extend
- `research/2026-06-05-anti-detection-self-test.md` — baseline fingerprint findings
- `docs/specs/2026-06-07-agent-browsing-stack-brief.md` — master brief, guiding constraints
