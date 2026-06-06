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
| **4 — Active fingerprint hardening** | Canvas noise injection (per-session pixel variation), WebGL vendor/renderer consistency, font enumeration guard | Required for hardest sites; verify impact with self-test before enabling broadly |

---

## Site Classification and the Recommendation System

### Tier C list

A static lookup built into `src/browser/stealth.ts`. No network call. No external dependency.

Initial Tier C domains and patterns:
- `linkedin.com`, `*.linkedin.com`
- `instagram.com`, `*.instagram.com`
- `facebook.com`, `*.facebook.com`
- Any URL behind Cloudflare bot detection (detected by response headers: `cf-ray`, `cf-mitigated`)
- Any URL behind DataDome (detected by response headers: `x-datadome-*`)

The list is a plain array of matchers — easy to extend in future without a schema change.

### Two-path behavior

**Interactive session** (human is present — API call with human in the loop):
- If the target URL matches Tier C and `stealthMode` is `fast` (or unset): Feather stops before
  the session opens and returns a `stealthRecommendation` in the response.
- Response uses Feather's standard envelope with HTTP `200` and a typed soft-block:
  `{ ok: false, requestId, error: { code: 'STEALTH_UPGRADE_RECOMMENDED', message: 'LinkedIn is a Tier C site — secure mode recommended', data: { recommendation: 'secure' } } }`.
- The caller re-submits with `stealth: { mode: 'secure' }` to proceed. The session does not open
  until the caller makes a deliberate choice.

**Autonomous agent** (no human in the loop — `autonomous: true` flag on session create):
- Auto-upgrade to secure on Tier C sites. No approval gate.
- Log entry records the upgrade: `[stealth] auto-upgraded to secure — Tier C site detected (linkedin.com)`.
- `stealthApplied` in the response reflects the upgraded mode.

**Explicit override always wins:** if the caller passes `stealthMode: 'secure'` explicitly, the
classifier is bypassed and secure is applied regardless of domain. If the caller passes
`stealthMode: 'fast'` explicitly on a Tier C site, fast is used with a warning in the log — the
human made a deliberate choice.

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

// Layer 4: active fingerprint hardening (call on each new page, secure only)
export function applyFingerprintHardening(
  page: Page,
  config: StealthConfig
): Promise<void>
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

Response gains:
- `stealthApplied: 'fast' | 'secure'` — what was actually applied
- `stealthRecommendation?: string` — present when the classifier recommends a switch

When the classifier fires in interactive mode: `202` with `stealthRecommendation` instead of
opening the session. Caller re-submits with `stealthMode: 'secure'` to confirm.

### Integration point in session creation

In the session creation handler (wherever sessions are currently opened):
1. Call `resolveStealthMode({ config, url, autonomous })` — gets the resolution
2. If resolution returns a recommendation and session is interactive: return `202` with recommendation, do not open session
3. Otherwise: pass resolved mode through to `spawnAndConnect` wrapper
4. After connect: call `applyStealthCDP(context, config)`
5. On each new page (via `context.on('page', ...)`): call `applyStealthEnvironment` and (if secure) `applyFingerprintHardening`
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

### Layer 4 — Active fingerprint hardening

**Canvas noise injection:** inject a tiny, per-session, deterministic pixel variation into canvas
`getImageData` responses. The variation must be: consistent within a session (same noise seed),
invisible to the human eye, but enough to make the canvas hash unique per Feather instance.
Apply via `page.addInitScript`.

**WebGL vendor/renderer consistency:** verify the real GPU strings match a plausible desktop
value. On this machine: `Google Inc. (Intel)` / `ANGLE (Intel, Mesa Intel(R) Iris(R) Xe ...)`.
Do not spoof — verify the real values are present and flag if a SwiftShader renderer is detected
(which would mean the headless path is active and the session is already detectable).

**Font enumeration guard:** limit font probing responses to a consistent, realistic set. Many
sites enumerate installed fonts via canvas text measurement. Return a real desktop font list
(not an empty set, which is itself a tell).

**Research directive for implementing agent:**
- Search for "canvas fingerprint noise injection Playwright" and "canvas getImageData override
  stealth" for implementation approaches using `page.addInitScript`
- Read: https://coveryourtracks.eff.org/ — run this against a Feather session to see what
  the baseline fingerprint looks like before and after hardening
- Read: https://bot.sannysoft.com/ — primary reference for CDP/automation detection signals
- Read: https://arh.antoinevastel.com/bots/areyouheadless — headless/automation detector
- Search for "playwright-stealth canvas WebGL fingerprint" and review the `puppeteer-extra-plugin-stealth`
  source for each evasion technique (reference only — do not import the library)
- Search for "font enumeration fingerprinting defense" for the font guard approach

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

## Future: Declared Good-Bot Posture (not in this spec)

The sustainable long-term alternative to stealth is declaring yourself as a verified, authorized
bot via RFC 9421 HTTP Message Signatures (the Web-Bot-Auth standard). Cloudflare already accepts
this from Anchor Browser. This is:
- Standards-based and defensible
- No arms race
- Legally clean

Flag for Phase 5+ consideration. Track the standard at: https://www.rfc-editor.org/rfc/rfc9421

---

## Exit Criteria for Implementation

- [ ] `src/browser/stealth.ts` created with all exports defined above
- [ ] `StealthConfig` type added to `src/sessions/types.ts`
- [ ] Session creation handler calls `resolveStealthMode` and applies result
- [ ] `POST /v1/sessions` accepts `stealth` and `autonomous` fields; response includes `stealthApplied`
- [ ] Interactive Tier C detection returns `202` with `stealthRecommendation` before opening session
- [ ] Autonomous Tier C detection auto-upgrades and logs the upgrade
- [ ] Layer 1 (CDP surface): verified via CDP protocol inspector that `Runtime.enable` is not sent on clean session open
- [ ] Layer 2 (environment): viewport/timezone/locale/dpr consistent; verified via self-test
- [ ] Layer 3 (behavioral timing): click/type/scroll wrapped with jitter in secure mode
- [ ] Layer 4 (fingerprint hardening): canvas noise + WebGL check + font guard in secure mode
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
