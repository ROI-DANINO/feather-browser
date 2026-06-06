# Design — Behavioral Fidelity (capture · store · replay Roi's interaction signature)

> **STATUS: STUBBED** — design COMPLETE; one harness STUB code block is included (proposal
> only, NOT written into `src/`). Nothing here is wired into shipped code. Storage backend is
> deliberately left OPEN (joint call, tied to the frozen vault). The capture step is gated on a
> hard human-in-the-loop wall: Roi must actually browse to produce real signal — no synthetic
> data is generated or implied anywhere in this design.

- **Date:** 2026-06-05
- **Phase:** Phase 5 FORWARD work (cold storage). High-value to design now; not built now.
- **Governing decisions:** [ADR-0005](adr-0005-agentic-north-star.md) (agentic North Star),
  [ADR-0007](adr-0007-phase-4-shell-sequencing.md) (headed-Chromium stopgap),
  [ADR-0008](adr-0008-credentials-vault.md) (CredentialsVault — **FROZEN, non-accepted**; backend
  is a joint call).
- **Source vision:**
  [`journal/raw/archive/2026-06-04-session-insights-behavioral-fidelity-security.md`](../../journal/raw/archive/2026-06-04-session-insights-behavioral-fidelity-security.md)
  (Insight 1: learned behavioral fidelity),
  [`research/2026-06-03-phase-5-agent-perception-layer-notes.md`](../../research/2026-06-03-phase-5-agent-perception-layer-notes.md),
  [`journal/raw/_inbox/2026-06-03-browser-agent-security-risks.md`](../../journal/raw/_inbox/2026-06-03-browser-agent-security-risks.md)
  ("browser-agent fingerprinting" — behavioral signals identify agents even when fingerprints look normal).
- **Framing (load-bearing):** **user-authorized continuity**, never "stealth / bot bypass." The
  agent acts *as Roi, on Roi's own accounts, with his consent*. The signature is treated as
  **sensitive PII / biometric-grade** data.

---

## 0. The lightweight lens (read this first)

This is a **thin, opt-in, off-by-default layer on the existing stealth/input path**. It is
**never shipped core weight**:

- Feather's default input path stays exactly as it is today: Playwright issues actions over CDP
  (`connectOverCDP` in [`src/browser/modes.ts`](../../src/browser/modes.ts)) with robotic
  default timing. Behavioral fidelity does **not** change that path for normal sessions.
- The layer is a **shim** that sits between "the agent decided to click/type X" and "CDP emits the
  input event." When the layer is **off** (the default), actions pass straight through unchanged —
  zero added weight, zero added dependency, zero behavioral change.
- When the layer is **on** (explicit opt-in, per session), the shim reshapes the *timing and
  geometry* of the same actions using a stored profile. No new rendering engine, no extra browser,
  no always-on recorder. It rides the **one shared engine / thin shell** architecture already
  committed in `project_lightweight_engine_direction`.
- It binds to the **existing** `chromium-headed-cdp` mode — the same attach-don't-launch path that
  already beat Google + Cloudflare. We add nothing to the core launch; we add an optional consumer
  of CDP that is silent unless asked for.

If this design ever starts to imply an always-running daemon, a mandatory recorder, or a second
heavy dependency, it has drifted off-lens and should be cut back.

---

## 1. Signal set — what we capture, and why each is a real detection axis

Modern anti-bot / behavioral-biometric systems do not just read a browser fingerprint; they score
*how the human moves*. Each signal below maps to a documented detection axis. We capture the
**statistical shape** of Roi's behavior, not a literal replay tape — replay (§4) re-synthesizes
fresh-but-in-distribution events so the agent is in Roi's distribution without ever emitting a
byte-identical repeat.

### 1.1 Mouse path geometry
- **Captured:** cursor trajectories between meaningful targets — sampled `(x, y, t)` points;
  derived **curvature** (humans arc, bots go straight or Bézier-perfect), **velocity and
  acceleration profiles** (humans show a ballistic launch + corrective sub-movements near the
  target, per Fitts'-law-style overshoot/settle), **micro-pauses** mid-path, and approach angle.
- **Why it's a detection axis:** straight-line or single-Bézier motion, constant velocity, and
  pixel-perfect target landings are classic synthetic-cursor tells. Behavioral-biometric vendors
  explicitly score acceleration curves and overshoot/correction. A robotic `mouse.move(x,y)` (one
  teleport-then-settle) is one of the loudest signals an automation stack emits.

### 1.2 Typing cadence
- **Captured:** **inter-key timing** (flight time between successive keys), **dwell time** (how
  long each key is held: keydown→keyup), per-key and per-digraph timing where data allows, and
  **error + correction patterns** (typos followed by Backspace, then retype — and the *rhythm* of
  that correction).
- **Why it's a detection axis:** keystroke dynamics are a textbook behavioral biometric — dwell/
  flight distributions are stable enough per-person to be used for authentication. Uniform or
  zero-variance inter-key intervals (a hallmark of `page.type()` with no delay) are trivially
  flaggable. Humans also make and fix mistakes; a flawless 0-typo entry at machine cadence is itself
  anomalous. We capture the *correction signature*, not just clean cadence.

### 1.3 Scroll behavior
- **Captured:** scroll **event cadence** (wheel-notch vs. continuous trackpad-style deltas),
  **delta magnitude distribution**, **momentum / deceleration** tails, pauses to read, and
  direction-reversal (scroll-back) frequency.
- **Why it's a detection axis:** instantaneous `scrollTo` jumps and perfectly uniform scroll steps
  are non-human. Real scrolling has variable deltas, inertia, and reading pauses. Scroll dynamics
  are a rising signal in behavioral fingerprinting precisely because automation tends to teleport
  the viewport.

### 1.4 Dwell / hesitation
- **Captured:** **think-time before an action** (page settle → first interaction), **dwell on a
  field before typing**, **hover-before-click** latency, and overall **action-to-action pacing**
  including reading pauses.
- **Why it's a detection axis:** sub-100ms reaction from page-load to a precise click, or
  zero-gap action chaining, betrays a script. Human pacing is irregular and includes "reading the
  page" gaps. This is the cheapest signal to get wrong and one of the cheapest for a defender to
  measure.

**Design note — we store distributions, not tapes.** For each signal we persist *parameters of a
distribution* (means, variances, characteristic curves, correction-rate, a few archetypal path
templates) rather than raw recordings. This (a) shrinks the stored artifact, (b) lets replay
sample fresh in-distribution values instead of looping a fixed recording (a looped recording is
itself detectable), and (c) reduces — though does **not** eliminate — the biometric sensitivity of
the artifact. Even distribution parameters are biometric-grade and must be protected as such (§3, §5).

---

## 2. Capture mechanism — opt-in recorder on the headed CDP path

### 2.1 Where it attaches
Capture rides the **existing** `chromium-headed-cdp` mode (the attach-don't-launch path proven in
pre-shell #4 — `warm-session`). That mode already gives us a real headed Chromium the human is
driving and a CDP connection (`chromium.connectOverCDP`). Capture adds **one optional CDP/event
consumer** to that already-open session. It does **not** modify
[`spawnAndConnect`](../../src/browser/modes.ts) or the launch args; it subscribes after connect.

### 2.2 Two capture surfaces (use both, reconcile)
1. **Page-side event listeners (primary, richest):** an injected, clearly-scoped capture script
   listens for `pointermove` / `pointerdown` / `pointerup`, `keydown` / `keyup` (dwell = keyup−
   keydown; flight = next keydown − this keyup), `wheel`, `scroll`, and `focus`/`blur`, timestamping
   with `performance.now()`. This gives the highest-resolution geometry and timing because it reads
   the events the page itself would see.
   - **Stealth caveat (consistent with the perception-layer notes' "minimize JS injection"):** the
     capture script runs **only during human-driven recording sessions**, never during agent
     operation, and is scoped to a recording origin. Recording is when Roi is consenting and
     present; the agent-operation path injects nothing. So injection here does not raise the
     agent's signature.
2. **CDP `Input.dispatch*` / DevTools input domain (secondary, ground-truth timing):** subscribe to
   the input/trace side over CDP to cross-check device-level timing and catch events a page
   listener might miss (e.g. trusted-event nuances). Useful as a reconciliation channel and as the
   bridge to replay (§4 emits over the same domain).

### 2.3 Off by default — explicit, per-session opt-in
- A new env/flag gate, e.g. `FEATHER_CAPTURE_BEHAVIOR=1`, **off by default**. With it unset,
  nothing is injected and nothing is recorded — the path is byte-identical to today's.
- Capture is **session-scoped and consent-scoped**: it only runs inside an explicitly-started
  recording session (the harness in §6), with an on-screen indication that recording is active.
- The recorder writes to a **quarantined raw buffer** first (not the vault), then a separate
  **distill** step (§1 note) reduces raw events to distribution parameters. Raw event tapes are
  the most sensitive artifact and should be **discarded after distillation** unless Roi explicitly
  keeps them for analysis.

### 2.4 The hard human-in-the-loop wall
Capture cannot be faked or bootstrapped. The profile is *only* meaningful if it comes from Roi's
real hands on a real session. There is **no synthetic-data path** in this design and none may be
added — fabricated "human" data would defeat the entire fidelity goal and, worse, would be a false
biometric. **A populated profile requires Roi to sit and browse.** The harness (§6) exists so that,
next session, that is the *only* thing Roi has to do.

---

## 3. Storage model — biometric-grade, vault-class boundary (backend = OPEN joint call)

The signature is treated as **credential-grade / biometric-grade** data, on the **same side of the
boundary as the CredentialsVault**, and **separate from the shared cookie jar**. The cookie jar is
shared session state; the signature is *Roi's body-metrics* and must never be commingled with it.

### 3.1 Requirements (these are firm)
- **Encryption at rest.** The stored profile (and any retained raw buffer) is encrypted at rest.
  Plaintext profiles never touch disk outside an explicit, in-memory, consent-scoped session.
- **Vault-class access boundary.** Reads/writes go through a narrow, audited accessor — the same
  *boundary discipline* as ADR-0008's vault: a single mediated gateway, not ambient file access.
- **Agent-blind where possible.** Mirroring the CredentialsVault principle (the agent never holds
  raw creds; Feather injects under the hood), the **agent should never receive the raw signature
  profile.** The replay engine (§4) consumes the profile *under the hood* to shape input; the agent
  only issues high-level intents (`click(target)`, `type(target, text)`) and never reads dwell/
  flight numbers or path templates. This keeps the biometric out of model context and out of any
  prompt-injection blast radius (see browser-agent-security-risks: ambient authority / exfiltration).
- **Separation from the cookie jar.** Distinct artifact, distinct access path, distinct lifecycle.
  A cookie-jar copy/clone operation must never sweep the signature along with it.
- **Minimization + lifecycle.** Prefer distilled distributions over raw tapes (§1 note). Support
  delete/rotate. Roi can wipe his signature at any time; deletion must be real (not tombstoned).
- **Auditability.** Every read of the profile is logged (who/when/why), consistent with the
  audit-log direction in browser-agent-security-risks.

### 3.2 What is OPEN — explicit joint-call decision (do NOT pick here)
**The storage backend is NOT chosen in this document.** It is bound to the frozen
[ADR-0008](adr-0008-credentials-vault.md) vault decision (SQLCipher vs. KeePassXC vs. other — both
spikes are **frozen** and **sudo-gated to Roi**, and ADR-0008 is **non-accepted**). Whether the
signature lives **inside** the same vault store, in a **sibling encrypted store** with the same key
management, or under a separate scheme is a **joint call** to be made *with* Roi *after* the vault
backend resolves. This design states the **requirements** the backend must satisfy; it deliberately
**does not** select one. Any future doc that implies a backed-chosen state here is wrong.

---

## 4. Replay-with-fidelity — the profile shapes synthetic CDP input

### 4.1 The shim
Replay is the inverse of capture: instead of recording events, it **synthesizes** them. It sits as
a thin shim between the agent's high-level intent and CDP emission:

```
agent intent ──▶ [behavioral shim] ──▶ CDP Input.dispatchMouseEvent / dispatchKeyEvent ──▶ page
  click(target)      reads profile         many small events with humanized timing/geometry
  type(t,"hi")       (under the hood)       (not one teleport / one zero-delay burst)
```

- **Mouse:** instead of `mouse.move(x,y)` (one jump) + `click`, the shim samples a path template
  from the profile, fits it from current cursor to target, and emits a **stream** of
  `Input.dispatchMouseEvent("mouseMoved", …)` points with the captured velocity/acceleration
  profile, a sampled overshoot+correction, and micro-pauses — then `mousePressed`/`mouseReleased`
  with a human press dwell.
- **Typing:** instead of `page.type(text)` (uniform or zero delay), the shim emits per-character
  `Input.dispatchKeyEvent` keydown/keyup pairs with **sampled dwell and flight** from Roi's
  distribution, and — where appropriate and safe — reproduces his **error+correction rhythm** (type
  a wrong char, pause, Backspace, retype) at his characteristic rate. (Correction injection is a
  configurable sub-feature; for fields where a stray char is risky, fall back to clean-but-humanly-
  timed entry.)
- **Scroll:** emit `Input.dispatchMouseEvent("mouseWheel", …)` with sampled deltas + momentum tail
  and reading pauses, never a single `scrollTo`.
- **Dwell/hesitation:** the shim inserts sampled think-time before actions and between action
  chains, drawn from §1.4.

Because the shim samples **fresh** values from distributions each time, two runs are never
byte-identical — avoiding the "looped recording" tell.

### 4.2 Headless vs. headed
- **Mechanically, replay works in BOTH** headless and headed: `Input.dispatch*` over CDP emits the
  same humanized event streams regardless of whether a window is painted.
- **For anti-detection, headed is wanted.** Behavioral fidelity is *necessary but not sufficient* —
  headless Chromium carries other tells beyond input timing. The proven low-signature path is the
  attach-don't-launch **headed** mode (pre-shell #4). So: replay is engine-agnostic, but the
  recommended production pairing is **replay + `chromium-headed-cdp`**.
- **This doc does NOT quantify the headed-vs-headless detection delta.** That belongs to the
  **live detection self-test spike** (Insight 3 / detection self-emulation, parked separately). This
  design provides the input-fidelity layer; the spike measures how much it (and headedness) actually
  move the detection needle. Keep the two concerns separate.

### 4.3 Off-by-default here too
Replay is gated the same way as capture (e.g. `FEATHER_REPLAY_BEHAVIOR=1`, off by default). With it
off, the agent uses today's robotic defaults — fully functional, just not signature-matched. The
fidelity layer is a *quality/continuity enhancement*, never a hard dependency of agent operation.

---

## 5. Security framing

- **User-authorized continuity, never stealth-for-malice.** The entire purpose is that the agent
  acts *as Roi, on Roi's own authenticated accounts, with his explicit consent and approval
  checkpoints*. This is continuity of a human's own authorized session — the opposite of
  impersonating a third party or evading access controls. We deliberately avoid "stealth / bypass /
  evade" language (per the strategic-implications and security-risks notes).
- **The signature is sensitive PII — biometric-grade.** Keystroke and mouse dynamics are usable for
  *identification*; a leaked profile is a leaked biometric. Hence the vault-class boundary (§3),
  agent-blind handling, encryption at rest, minimization, and audit.
- **Stays inside the existing threat model.** Per browser-agent-security-risks: the profile must
  sit *outside* the prompt-injection / ambient-authority / exfiltration blast radius. Agent-blind
  replay (the agent never reads the profile) is exactly that containment — untrusted page content
  influencing the agent can never cause the agent to *emit* the biometric, because the agent never
  holds it.
- **Consent + revocability are first-class.** Recording is explicit, indicated on-screen, and the
  profile is deletable. No always-on capture; no silent profiling.
- **Defensive pairing.** The fidelity layer's effectiveness is validated by the *defensive*
  detection self-test (Insight 3), not asserted. We harden continuity and then red-team it.

---

## 6. Harness plan — "next session, Roi just browses and it records"

### 6.1 Goal
A ready-to-run **capture harness** so that, next session, Roi runs one command, a headed window
opens, he browses normally (logs in, types, scrolls, clicks around for a while), and on exit the
session is distilled into a profile artifact. **Browsing is the only manual step** — that is the
human-in-the-loop wall (§2.4), and the harness exists precisely to make that wall the *whole* job.

### 6.2 Shape (mirrors the proven `warm-session` ergonomics)
It deliberately copies the UX of [`src/tools/warm-session.ts`](../../src/tools/warm-session.ts):
launch the named workspace in `chromium-headed-cdp`, print clear instructions, attach the recorder,
and finalize cleanly on Ctrl-C / window-close — at which point it **distills → encrypts → stores**
via the (joint-call) vault-class accessor.

### 6.3 STUB (proposal only — NOT to be written into `src/`)
> The following is a **standalone proposal**, intended at `src/tools/capture-behavior.ts` **when
> built**. It is **NOT** part of shipped code today and must not be written into `src/` from this
> design. It reuses the warm-session scaffolding (SessionManager, ProfileLock, headed-CDP mode).
> `TODO` markers = what's left to build.

```ts
// PROPOSED FILE (do NOT create yet): src/tools/capture-behavior.ts
//
// Behavioral-fidelity CAPTURE harness — opt-in, off-by-default, human-in-the-loop.
// Rides the SAME headed-CDP path as warm-session. Records ONLY while Roi is
// present and browsing. No synthetic data. Backend storage = JOINT CALL (stubbed).
//
// Usage:  FEATHER_CAPTURE_BEHAVIOR=1 npm run capture-behavior
// Then:   browse normally (log in, type, scroll, click) for a while, then Ctrl-C.

import { resolveDirs } from "../config";
import { FeatherPaths, ensureDirs } from "../fs-layout";
import { ProfileLock } from "../profiles/lock";
import { WorkspaceMetadata } from "../profiles/workspace";
import { SessionManager } from "../sessions/manager";

const ENABLED = process.env.FEATHER_CAPTURE_BEHAVIOR === "1"; // OFF by default
const WORKSPACE_ID = process.env.FEATHER_CAPTURE_WORKSPACE ?? "behavior-capture";

// Page-side capture script (injected ONLY during this consent-scoped recording).
// Emits high-resolution pointer/key/wheel/scroll events with performance.now() ts.
const CAPTURE_INIT_SCRIPT = `
  (() => {
    const buf = (window.__featherBehaviorBuf ||= []);
    const t = () => performance.now();
    const push = (e) => buf.push(e);
    addEventListener('pointermove', e => push({k:'pm', x:e.clientX, y:e.clientY, t:t()}), true);
    addEventListener('pointerdown', e => push({k:'pd', x:e.clientX, y:e.clientY, b:e.button, t:t()}), true);
    addEventListener('pointerup',   e => push({k:'pu', x:e.clientX, y:e.clientY, b:e.button, t:t()}), true);
    addEventListener('keydown', e => push({k:'kd', c:e.code, t:t()}), true); // dwell = ku - kd
    addEventListener('keyup',   e => push({k:'ku', c:e.code, t:t()}), true); // flight = next kd - this ku
    addEventListener('wheel',  e => push({k:'wh', dx:e.deltaX, dy:e.deltaY, t:t()}), true);
    addEventListener('scroll', () => push({k:'sc', y:scrollY, t:t()}), true);
    // Privacy: capture key TIMING/CODE only — never characters of secret fields.
    // TODO: redact/skip value-bearing keystrokes in password/sensitive inputs.
  })();
`;

async function main(): Promise<void> {
  if (!ENABLED) {
    console.error("Refusing to record: set FEATHER_CAPTURE_BEHAVIOR=1 to opt in.");
    process.exit(1);
  }

  const dirs = resolveDirs();
  await ensureDirs(dirs);
  const paths = new FeatherPaths(dirs);
  const manager = new SessionManager(paths, new ProfileLock(paths), new WorkspaceMetadata(paths));

  const session = await manager.launch({
    workspaceId: WORKSPACE_ID,
    profile: { kind: "persistent" },
    browserMode: "chromium-headed-cdp", // proven low-signature attach-don't-launch path
  });

  const context = session.getContext();
  await context.addInitScript(CAPTURE_INIT_SCRIPT); // applies to current + future pages
  // TODO: also subscribe over CDP (Input domain) as the ground-truth timing channel.

  console.log("● RECORDING. Browse normally; press Ctrl-C when done.");

  const finalize = async () => {
    // TODO: drain window.__featherBehaviorBuf from every page (page.evaluate).
    // TODO: DISTILL raw events -> distribution params (mouse curvature/vel/accel,
    //       key dwell/flight + correction rate, scroll deltas/momentum, dwell/hesitation).
    // TODO: DISCARD raw tape after distillation (unless Roi opts to keep it).
    // TODO: ENCRYPT-AT-REST + write via the vault-class accessor.
    //       >>> BACKEND IS A JOINT CALL (ADR-0008 frozen) — do NOT hardcode a store. <<<
    // TODO: audit-log the write (who/when/why).
    await manager.close(session.sessionId, { force: true });
    process.exit(0);
  };
  session.getChildProcess()?.on("exit", () => void finalize());
  process.on("SIGINT", () => void finalize());
}

main().catch((e) => { console.error(e); process.exit(1); });
```

### 6.4 What is left to build (explicit)
- **Distillation module** — raw events → distribution parameters + archetypal path templates (§1).
- **Sensitive-field redaction** — never capture *characters* of secret/password inputs (timing only).
- **CDP ground-truth channel** — the secondary `Input`-domain reconciliation subscription (§2.2).
- **Vault-class storage accessor** — encrypt-at-rest, audited, agent-blind. **Backend = joint call**
  (§3.2); the accessor interface can be designed now, the store cannot be picked now.
- **Replay shim** (§4) — the inverse path; sampler + CDP `Input.dispatch*` emitter, gated
  `FEATHER_REPLAY_BEHAVIOR=1`, off by default. Separate harness/integration, designed here, not built.
- **Detection self-test pairing** (Insight 3) — the *separate* live spike that quantifies how much
  fidelity + headedness move the detection needle. Not in scope here.

### 6.5 What is already real (reused, not rebuilt)
- The **headed-CDP attach-don't-launch path** (`chromium-headed-cdp`,
  [`modes.ts`](../../src/browser/modes.ts)) — proven low-signature, `navigator.webdriver===false`.
- The **warm-session harness ergonomics** ([`warm-session.ts`](../../src/tools/warm-session.ts)) —
  SessionManager + ProfileLock + clean Ctrl-C finalize. The capture harness clones this shape.

---

## 7. Summary of decisions vs. open items

| Item | State |
|---|---|
| Signal set (mouse geom · typing cadence · scroll · dwell) | **Decided** (this doc) |
| Capture on opt-in headed-CDP path, off by default | **Decided** (this doc) |
| Store distributions, not raw tapes; discard raw after distill | **Decided** (this doc) |
| Vault-class boundary · encrypt-at-rest · agent-blind · audit · separate from cookie jar | **Decided (requirements)** |
| **Storage backend** | **OPEN — JOINT CALL** (tied to frozen ADR-0008; do NOT pick) |
| Replay = humanized CDP `Input.dispatch*` shim, off by default | **Designed** (not built) |
| Headless-vs-headed detection delta | **Out of scope** → live detection self-test spike |
| Actual recording | **BLOCKED on the human-in-the-loop wall** — Roi must browse; no synthetic data |
