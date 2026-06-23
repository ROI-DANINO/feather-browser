# Stealth Stack — Reconciled Design (5d, secure-only)

**Date:** 2026-06-23 (rev 3 — reconciled against shipped Gate A / 5a Identity / 5b MFA / perception loop)
**Status:** 📐 Spec — ready for implementation planning
**Phase:** Phase 5d (v2.5) — now the LAST spine feature, not the first
**Supersedes:** the mode-model + integration half of `docs/specs/2026-06-07-stealth-stack-{design,plan}.md`
(rev 2). The rev-2 *thesis* (verify-don't-spoof, always-on checks, no font guard, kinematic-spike-first)
stands; its *mutable-mode / MFA-seam / two-mode* machinery is dead and removed here.

---

## Why this rev exists

The rev-2 design + plan were written 2026-06-07, **before** Gate A, 5a Identity, 5b MFA, the
perception loop, and the human-in-control guard shipped. Reconciling rev-2 against the current tree
(grep-verified) found three things the old plan assumed that are no longer true:

1. **Build order inverted.** Rev 2 framed stealth as the *root dependency* built first ("consumes
   nothing"). Post-council-reversal, stealth is built **last**. Identity + MFA are done; stealth now
   *consumes* Identity's dormant policy slot and exposes nothing the others need.

2. **The MFA seam is dead.** Rev 2's headline integration point — mutable `setStealthMode()` +
   `POST /v1/sessions/:id/stealth`, consumed by MFA for human-takeover — is gone. The tree confirms
   it in three places (`src/mfa/manager.ts:141`, `src/capability/holds.ts:8`,
   `tests/unit/mfa/manager.test.ts:53`): MFA shipped using an `mfa` hold + a banner-free pause
   instead. And mutability now buys nothing — during human control the agent is blocked
   (`HUMAN_IN_CONTROL`), so the human types natively regardless of mode; the cadence layer only ever
   applies to *agent* typing.

3. **The fast path already exists per-call.** `TypeSchema` (`src/transport/routes.ts:142-143`)
   already exposes `mode: "fill" | "sequential"` and `delayMs`. A caller wanting machine-speed typing
   on a friendly site passes `mode: "fill"` on that call — today, no stealth module required.

Together (2) and (3) remove the entire reason for a session-level `secure`/`assisted` split. **This
rev is secure-only.**

---

## The model: secure-only

Every agent session is secure. There is no mode enum, no mode field, no mode-switch endpoint.
"Secure-by-default" reduces, in code, to a single behavior change: **when a `type` call specifies
neither `mode` nor `delayMs`, default to `sequential` typing with per-keystroke jitter instead of the
current instant `fill()`.** The explicit per-call `mode: "fill"` / `delayMs` override stays as the
fast escape hatch (already shipped).

Consequences (all simplifications):
- **No `stealthMode` on the session** — a constant is not worth storing; the `type` handler always
  defaults to human cadence unless overridden.
- **Identity's `stealthPolicy` slot stays dormant.** It already defaults to `{ v: 1, mode: "secure" }`
  (`src/identity/manager.ts:65`) and deliberately does not import `StealthConfig`. With one mode there
  is nothing to resolve at launch — the slot waits, untouched, until a real per-identity knob exists.
- **No launch-time `stealth` param** — nothing to pass.

> The core insight (unchanged from rev 2): Feather's real stealth is its *architecture* — attaching to
> real headful system Chromium on the user's real IP gives a genuine TLS/JA3/JA4 fingerprint, real
> HTTP/2 framing, real GPU/fonts, residential IP, IP-matched locale, all for free. This module's job
> is narrow: keep those tells from leaking, verify they haven't, and add human-shaped *agent* typing.

---

## The layers

| Layer | What it does | Form |
|-------|-------------|------|
| **1 — CDP surface minimization** | Don't enable `Runtime.enable` / attach `console`/`pageerror` on the session path. | **Doc-comment seam only** — no positive code. Guaranteed by a grep-audit + the self-test assertion. |
| **2 — Environment consistency** | Verify viewport/screen/dpr/languages/timezone are internally consistent. **Warn, never spoof.** | `applyStealthEnvironment(page) → { ok, warnings[] }` |
| **4 — Fingerprint consistency** | Verify the real WebGL renderer is intact; flag SwiftShader (the headless-leak tell). **No canvas noise, no font guard.** | `applyFingerprintCheck(page) → { ok, warnings[] }` |
| **3 — Behavioral (typing cadence)** | Agent typing types sequentially with `[50,150]ms` per-keystroke jitter. | `type`-handler default flip + `jitterDelayMs()` |

Layers 1, 2, 4 are always on. Layer 3 is the `type` default flip. Click/press stay native in v1 — a
pre-click *sleep* before a teleport-click is not human behavior (council finding) and may be a worse
signal; genuine click realism needs kinematic mouse paths (deferred spike).

**Why no spoofing (Layer 2/4 are checks, not fixes):** spoofing locale/timezone without a matching
geo-proxy *introduces* an Accept-Language/timezone-vs-IP mismatch — itself a DataDome/Cloudflare tell.
On a real desktop the values already match the real IP. Detectors look for *tampering* first, so the
font guard (which monkeypatches a native function, leaving a `[native code]` tell) is **cut** — it
defends a non-existent problem and creates a real one.

---

## Architecture

### New file: `src/browser/stealth.ts`
A pure function library (no class — matches the codebase's function-handler style). Parallel to the
proxy pattern. Exports:

```typescript
import type { Page } from "playwright";

export type SiteClass = "standard" | "tier-c";
export interface StealthCheckResult { ok: boolean; warnings: string[]; }

// OBSERVABILITY ONLY — logged at launch, never a control-flow gate.
export function classifySite(url: string): SiteClass;

// Layer 2 — environment consistency CHECK (always on; warn, never spoof).
export function applyStealthEnvironment(page: Page): Promise<StealthCheckResult>;

// Layer 4 — fingerprint consistency CHECK (always on; no font guard, no canvas noise).
export function applyFingerprintCheck(page: Page): Promise<StealthCheckResult>;

// Layer 3 — per-keystroke human delay in [50,150] ms.
export function jitterDelayMs(): number;

// Layer 1 — a documented seam comment only (no positive code).
```

### Wiring point A — session manager (headed-CDP launch path only)
After the context opens, against the first page, run both checks **best-effort (never block launch)**,
store the combined warnings on the record, and log the site class. Mirror the existing best-effort
launch-time logging.

### Wiring point B — `type` handler default flip (`src/commands/type.ts`)
When the caller passes neither `mode` nor `delayMs`, default to `sequential` + `jitterDelayMs()`
instead of `fill()`. Explicit `mode`/`delayMs` win. The existing `allowDuringHumanControl`,
`assertPageNotPaused`, and ref/probe-act logic are untouched.

### Session type change (`src/sessions/types.ts`)
`SessionRecord` gains exactly one field:

```typescript
  stealthWarnings: string[];   // L2 + L4 check output, surfaced to the caller
```

No `stealthApplied`, no `stealthMode`.

### Self-test (`scripts/spikes/anti-detection-probe.ts` — ships nothing)
Extend the existing throwaway probe:
- **Hard assertions** (exit non-zero on fail): `navigator.webdriver === false`; `Runtime.enable`
  absent on a clean session open.
- **Opt-in online report** (`FEATHER_PROBE_ONLINE=1`): secure-mode env + fingerprint report against
  `https://bot.sannysoft.com/` with a screenshot.

---

## Data flow

```
launch (headed-CDP)
  → open context as today (no change to spawnAndConnect / buildLaunchOptions)
  → applyStealthEnvironment(firstPage)  ─┐ best-effort, never block
  → applyFingerprintCheck(firstPage)    ─┘
  → record.stealthWarnings = [...env.warnings, ...fp.warnings]
  → log siteClass = classifySite(firstPage.url())

type (any session)
  → caller gave mode/delayMs?  → honor it (fast path stays reachable)
  → else                       → sequential + jitterDelayMs()   (secure default)
```

---

## Explicitly dropped from rev 2 (dead or redundant)

- `secure`/`assisted` mode enum, `StealthConfig.mode`, mutable mode, `setStealthMode()`.
- `POST /v1/sessions/:id/stealth` mode-switch endpoint (the MFA seam — MFA uses pause/hold).
- Launch-time `stealth` param.
- The "needs-confirmation first-class result type" convention (MFA already owns the handoff shape).
- The Identity→Stealth policy *resolve* task (slot stays dormant under secure-only).
- Font guard (`FONT_GUARD_INIT`) — stays cut, as in rev 2.
- The classification *gate* / soft-block / `url` param / `autonomous` flag / auto-upgrade — stayed cut
  from rev 2; `classifySite` survives as an observability label only.

## Still deferred (filed, NOT in this slice)

- **Kinematic input synthesis** (the real Layer 3) — spike-first, then build. Single highest-value
  deferred piece. Curved mouse trajectories + statistically-modeled keystroke cadence, measured
  against real detectors before belief. Needs a cursor-position model the action handlers don't have.
- **Observe-walk isolated-world swap** — `walk.ts` runs `frame.evaluateHandle(WALK_SRC)` in the page
  main world (DOM-method traps can see/tamper). Moving the identical walk into a CDP isolated world is
  a clean swap, parked for stealth.
- **niri viewport-pin** — pin the render viewport via CDP `Emulation.setDeviceMetricsOverride`,
  flag-gated (a window-vs-viewport mismatch is itself a mild tell).
- **Live probes** — typed-code proof vs a real TOTP wall, IG password-rotation stealth probe,
  LinkedIn exit test.

## One decided tension, recorded

The OSS-research / tasks note "evaluate `fingerprint-generator`/`-injector`/`idcac-playwright` before
custom injection." Those packages are **injectors** — they spoof. That directly contradicts this
spec's verify-don't-spoof spine. **Decision: reference-only.** Feather does not inject fabricated
fingerprints; it verifies the real one and keeps it from leaking. Revisit only if the posture itself
is ever deliberately changed.

---

## What this is not

- Not captcha/paywall bypass — walls are handed to the human (the 5b MFA handler / `await-human`).
- Not fingerprint *spoofing* — it verifies the real one and keeps it from leaking.
- Not a replacement for a warmed human session — the Cookie Mine provides the trust context (real
  cookies); stealth keeps the browser's tells clean.

## Files to read before implementing

- `src/commands/type.ts` — the cadence default flip (note the current ref/probe + `allowDuringHumanControl` shape).
- `src/sessions/manager.ts` — headed-CDP launch path; where the checks wire in (mirror best-effort launch logging).
- `src/sessions/types.ts` — `SessionRecord`; add `stealthWarnings`.
- `src/identity/types.ts`, `src/identity/manager.ts` — confirm the `stealthPolicy` slot stays dormant.
- `scripts/spikes/anti-detection-probe.ts` — the self-test probe to extend.
- `research/2026-06-05-anti-detection-self-test.md` — baseline fingerprint vector (headed-CDP vs headless).
- `research/2026-06-07-council-audit-stealth-stack.md` — the audit that shaped the verify-don't-spoof spine.
