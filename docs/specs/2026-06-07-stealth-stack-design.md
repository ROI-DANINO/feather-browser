# Stealth Stack Design
**Date:** 2026-06-07 (rev 2 — post Opus/Gemini council audit)
**Status:** 📐 Spec — ready for implementation planning
**Phase:** Phase 5 input (Agent Browsing Stack — Feature 1 of 3)
**Brief:** `docs/specs/2026-06-07-agent-browsing-stack-brief.md`
**Audit:** `research/2026-06-07-council-audit-stealth-stack.md`

---

## Goal

Make Feather's automated browser sessions indistinguishable from a real human on sites with
active bot detection (LinkedIn, Instagram, Cloudflare/DataDome-protected), while staying
lightweight, local-first, and honest.

**The core insight (from the council audit):** Feather's real stealth is its *architecture*, not
this module. Attaching to **real headful system Chromium on the user's real IP** already provides a
genuine TLS/JA3/JA4 fingerprint, real HTTP/2 framing, real GPU/fonts, a residential IP, and an
IP-matched locale — exactly the signals Cloudflare and DataDome lean on hardest, all for free. This
module's job is narrow and honest:

1. **Keep the architecture's tells from leaking** (don't enable automation-revealing CDP surface).
2. **Verify they haven't leaked** (consistency checks — never spoof).
3. **Add the one thing the architecture can't give for free: human-shaped *input*** — but only when
   the *agent* is the one generating that input.

**Guiding constraints (from the master brief):** local-first always; lightweight; legal (agent acts
as the authorized user, never bypasses captcha/paywalls/scraping limits); gradual delivery.

---

## The Mode Model: secure (default) vs assisted

The single knob is **who is generating the input** — not "how much do we hide."

- When an **agent** drives, every click and keystroke is synthetic. That is exactly where behavioral
  detection bites, so it needs human-shaped input synthesis. → **secure**
- When a **human** drives (hands actually on the keyboard/mouse), the input is *genuinely* human —
  there is nothing to fake, and adding artificial delay only hurts the human's experience for zero
  stealth gain. → **assisted**

| Mode | When to use | Behavioral layer | Fingerprint layers |
|------|-------------|------------------|--------------------|
| **`secure`** (default) | the **agent** is the input source | human-shaped input (typing cadence in v1; kinematic mouse/typing after the spike — see Deferred) | **always on** |
| **`assisted`** | a **human** is the input source, or a friendly/dev site | none — real human input needs no synthesis; clicks/typing fire at native machine speed | **always on** |

**The only mechanical difference between the modes is input behavior.** Fingerprint cleanliness
(CDP surface, environment, WebGL) is identical and always on in both. "assisted" is not "less safe"
— it is *safe because a real human (or a trusted context) is producing the behavior*.

> **Precision that matters:** assisted is for when the human is *driving*, not merely *watching*. A
> human passively observing an autonomous agent is still a synthetic-input session → that stays
> `secure`. The trigger is "human is the input source," full stop.

### Mode is mutable (reflects who's driving *now*)

A session's mode can change during its life because *who is driving* can legitimately change. The
canonical case is a human takeover: agent works in `secure` → hits a login wall → human takes the
wheel (`assisted`) → finishes the sensitive step → hands back to the agent (`secure`). This is
exactly the handoff the **MFA Handler (Feature 2)** will own, so the mode-switch primitive is
designed here and consumed there.

> Supersedes rev 1's "immutable per session." The council flagged immutability as a direct conflict
> with the MFA handler (a captcha in a locked mode forces a teardown that destroys the very session
> state the handoff exists to preserve). Mutable mode resolves this.

### Why this dissolves the mid-navigation trap

Rev 1 classified the launch URL and gated fast/secure before opening. The council showed that gate
was trivially bypassed: launch on `google.com` (fast), then *navigate* to `linkedin.com` and you're
stuck in fast on a hostile site. **Secure-by-default removes the trap entirely:** the dangerous case
(an autonomous agent anywhere) is already `secure`. The only way to be in `assisted` is to
deliberately take the wheel — and a human on LinkedIn is just a human on LinkedIn. No classification
gate, no soft-block, no auto-upgrade machinery needed.

---

## The Layers

Three of the four layers are **always on** (they cost nothing and concern the browser's *identity*,
not its behavior). Only the behavioral layer is mode-differentiated.

### Always-on (both modes)

| Layer | What it does | Notes |
|-------|-------------|-------|
| **1 — CDP surface minimization** | Do not enable `Runtime.enable` / attach `console`/`pageerror` listeners on the real session path | Inherently a "don't do X" layer. Enforced by audit + self-test assertion, not by positive runtime code. The detection tell is Playwright auto-sending `Runtime.enable` when console listeners attach. |
| **2 — Environment consistency check** | Verify viewport/screen/dpr/languages/timezone are internally consistent; **warn, never spoof** | Spoofing locale/timezone without a matching geo-proxy *introduces* an Accept-Language/timezone-vs-IP mismatch — a real DataDome/Cloudflare tell. On a real desktop the values already match the IP. Warnings surface in the session record. |
| **4 — Fingerprint consistency check** | Verify the real WebGL renderer is intact; flag `SwiftShader` (the headless-leak signal) | **No canvas noise. No font guard.** (See "Cut from rev 1.") Real Chromium on a real GPU already has a genuine, stable fingerprint; *tampering* is what detectors look for first. |

### Behavioral (mode-differentiated) — Layer 3

This is the only layer that differs by mode, and it is the honest weak point of v1.

- **`assisted`:** native machine-speed input. No synthesis.
- **`secure`, v1:** human typing cadence only — type sequentially with a per-keystroke jitter
  (≈50–150 ms) instead of an instant `fill()`. Clicks/keypresses remain native in v1 (see below).
- **`secure`, after the spike:** full kinematic input — curved mouse trajectories with overshoot and
  variable speed (not dead-center, not instant), plus statistically-modeled keystroke cadence. This
  is **deferred behind a spike** (Roi's call: spike first, then build).

> **Honest limitation, stated plainly (per the council):** a pre-click *sleep* before a Playwright
> `click()` that teleports the cursor and fires instantly is **not** human behavior — possibly a
> *worse* signal than a fast click. So v1 deliberately does **not** add a pre-click delay. The only
> real behavioral improvement v1 ships is typing cadence. Genuine behavioral indistinguishability
> requires kinematic input, which needs the spike. Until then, v1's protection is overwhelmingly the
> always-on fingerprint layers, and `secure`/`assisted` differ behaviorally only in typing.

---

## Architecture

### New file: `src/browser/stealth.ts`

Single-responsibility module, parallel to the existing proxy pattern (`ProxyConfig` in
`src/sessions/types.ts`). `modes.ts` is not modified.

```typescript
import type { Page } from "playwright";

export type StealthMode = "secure" | "assisted";
export type SiteClass = "standard" | "tier-c";
export interface StealthConfig { mode: StealthMode; }
export interface StealthCheckResult { ok: boolean; warnings: string[]; }

// Mode resolution — trivial by design (secure-by-default; no classification gate).
export function resolveStealthMode(config: StealthConfig | null): StealthMode; // => config?.mode ?? "secure"

// Site classification — OBSERVABILITY ONLY (labeling/logging), never a control-flow gate.
export function classifySite(url: string): SiteClass;

// Layer 1 — documented seam; the real guarantee is the audit + self-test (no positive code).
// (Kept as a no-op seam for symmetry; may be omitted in favor of a comment — see plan.)

// Layer 2 — environment consistency check (always on).
export function applyStealthEnvironment(page: Page, config: StealthConfig): Promise<StealthCheckResult>;

// Layer 4 — fingerprint consistency check (always on). No font guard.
export function applyFingerprintCheck(page: Page, config: StealthConfig): Promise<StealthCheckResult>;

// Layer 3 (typing cadence) lives in the type command handler, keyed on session.stealthMode.
// A per-keystroke jitter helper:
export function jitterDelayMs(): number; // [50,150]
```

### Session type changes (`src/sessions/types.ts`)

```typescript
export type StealthMode = "secure" | "assisted";
export interface StealthConfig { mode: StealthMode; }

export interface SessionRecord {
  // ... existing ...
  proxy: ProxySummary | null;
  stealthApplied: StealthMode;       // current mode (mutable)
  stealthWarnings: string[];         // env + fingerprint check warnings, surfaced to caller
  startedAt: string;
  // ... rest ...
}
```

`ISession` gains a **mutable** `stealthMode` (getter + `setStealthMode(mode)`), so action handlers
read the current mode and the MFA handler can switch it.

### API changes (`POST /v1/sessions`)

Request body gains:
- `stealth?: { mode: "secure" | "assisted" }` — optional; **defaults to `secure`**.

Response (`SessionRecord`) gains:
- `stealthApplied: "secure" | "assisted"`
- `stealthWarnings: string[]`

**No soft-block, no `url` gate, no `autonomous` flag, no auto-upgrade** — all deleted with the
classification gate. Autonomous agents are simply `secure` by default, which covers the original
"autonomous must be safe on flagged sites" requirement more completely (secure everywhere, not just
on a hardcoded list).

### Mode-switch primitive (the MFA seam)

A minimal mutation endpoint so a human takeover (or, later, the MFA handler) can flip the mode:

```
POST /v1/sessions/:sessionId/stealth   body: { mode: "secure" | "assisted" }
→ 200 { ok, data: { stealthApplied } }
```

> **Convention for Feature 2 (carried from the council):** model "needs a human decision" as a
> **first-class result type** (e.g. `{ status: "needs-confirmation", ... }`), *not* a thrown
> control-flow exception. Rev 1's `STEALTH_UPGRADE_RECOMMENDED` thrown error is deleted; the MFA
> handler should establish the result-type pattern instead.

### Integration point in session creation

1. `resolveStealthMode(input.stealth ?? null)` → mode (default `secure`).
2. Construct the session with that mode.
3. Open as today (no change to `spawnAndConnect` / `buildLaunchOptions`).
4. On the headed-CDP path, against the first page (best-effort; never block launch):
   - Layer 2: `applyStealthEnvironment` → collect warnings.
   - Layer 4: `applyFingerprintCheck` → collect warnings.
   - Store warnings on the record (`stealthWarnings`); also log them.
   - Log the site class of the first page via `classifySite` (observability).
5. Action handlers (`type`) read `session.stealthMode` to choose typing cadence.

---

## Cut from rev 1 (council consensus)

- **Font guard (`FONT_GUARD_INIT`) — deleted entirely.** Both reviewers flagged it, emphatically: it
  monkeypatches a native function so `document.fonts.check.toString()` no longer returns
  `[native code]` — a loud, actively-probed bot tell (CF Turnstile / DataDome) — and it defends a
  non-existent problem (a real Linux desktop already enumerates a realistic font set). It directly
  contradicts the "verify, don't spoof" principle. Keep only the WebGL/SwiftShader verification.
- **Classification gate, soft-block, `url` param, `autonomous` flag, auto-upgrade, `StealthUpgradeRecommendedError`
  — all deleted.** Secure-by-default makes them unnecessary. `classifySite` survives as an
  observability label only.
- **`withStealthTiming` pre-action sleep — deleted.** A sleep before a teleport-click is not behavior
  and may be a worse signal. Typing cadence (real) replaces it as v1's only behavioral difference.

---

## Self-Test (extend `scripts/spikes/anti-detection-probe.ts`)

The probe is a throwaway developer tool (ships nothing). Extend it to assert the load-bearing tells,
including two the council flagged as cheap-but-currently-unverified:

- **`navigator.webdriver === false`** — HARD assertion (one line, fundamental; if ever true, every
  other layer is moot).
- **`Runtime.enable` absent on a clean session open** — HARD assertion (the Layer 1 guarantee).
- Per-signal report for a `secure`-mode session against `https://bot.sannysoft.com/` (online,
  opt-in via env flag): WebGL renderer, env consistency, fingerprint consistency.

---

## Deferred (not in v1)

- **Kinematic input synthesis (the real Layer 3).** Roi's decision: **spike first, then build.** A
  research spike must prove curved mouse trajectories (overshoot, variable speed, non-center targets)
  + statistically-modeled keystroke cadence, measured against real detectors, *before* it is built.
  The build is a follow-up plan gated on the spike's findings. This is the **single highest-value
  missing piece** per both reviewers — v1 establishes the mode architecture it will slot into.
- **Passive header observation.** Record Cloudflare (`cf-ray`) / DataDome (`x-datadome-*`) presence
  *after* navigation, as observability only (never a gate), to grow the Tier-C label set over time
  and cover the long tail behind those vendors (which a hardcoded domain list cannot). Cheap; defer
  to keep v1 tight.
- **Declared good-bot posture (Web-Bot-Auth / RFC 9421).** The sustainable long-term alternative to
  stealth — *declare* yourself a verified bot instead of hiding. Track: https://www.rfc-editor.org/rfc/rfc9421

---

## Composition With Features 2 and 3

| This feature EXPOSES | Consumed by |
|---|---|
| `StealthConfig` / `StealthMode` on session create | **Identity Model** — a named identity carries a default `StealthConfig`. |
| `session.stealthMode` getter + `setStealthMode` + `POST …/stealth` | **MFA Handler** — human-takeover handoff is a `secure → assisted → secure` switch. |
| The "captcha/wall = hand off to human, never bypass" stance | **MFA Handler** — Feature 2 *is* that handoff. |
| `classifySite` (observability) | **Identity Model** — pre-label an identity's site list. |

This feature consumes nothing from the others — it is the root dependency, built first.

---

## What This Is Not

- Not captcha/paywall bypass or scraping infrastructure. Walls are handed to the human (Feature 2).
- Not fingerprint *spoofing* — it verifies the real one and keeps it from leaking.
- Not a replacement for a warmed human session — the Cookie Mine provides the trust context (real
  cookies); stealth keeps the browser's tells clean. Both are needed for Tier C.
- Not an arms-race commitment — every claim is measured against real detectors before being believed.

---

## Files to Read Before Implementing

- `src/browser/modes.ts` — current launch mechanics (do not modify)
- `src/sessions/types.ts`, `src/sessions/session.ts`, `src/sessions/manager.ts` — session lifecycle;
  `ProxyConfig` is the pattern to mirror
- `src/commands/type.ts`, `click.ts`, `press.ts` — action handlers (typing cadence wires into `type`)
- `src/transport/routes.ts` — HTTP surface + envelope helpers
- `scripts/spikes/anti-detection-probe.ts` — self-test probe to extend
- `research/2026-06-05-anti-detection-self-test.md` — baseline fingerprint findings
- `research/2026-06-07-council-audit-stealth-stack.md` — the audit that shaped this rev
