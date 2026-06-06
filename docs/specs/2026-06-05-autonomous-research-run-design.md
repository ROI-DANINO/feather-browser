# Autonomous Research Run — Design

**Date:** 2026-06-05
**Status:** 🚧 Approved in brainstorm; spec for an unattended autonomous run (Roi out of the loop)
**Phase:** Phase 4 (Visual Desktop Shell) — pre-shell tail + Phase-5 research seeding
**Related:** `ROADMAP.md`, `journal/context/active.md`, ADR-0007 (shell sequencing), ADR-0008 (vault, frozen),
`research/2026-06-04-cookie-jar-isolation-and-phase5-sequencing.md`,
`research/2026-06-03-phase-5-agent-perception-layer-notes.md`

---

## 1. Mission

One uninterrupted autonomous run where Feather's backlog is worked **without Roi in the loop**, in the
research-driven style (ground every call in evidence — probes, docs, real code; let spikes answer; do
not assert from priors). The run continues until it hits a genuine **you-only wall**, then hands off.
Deliverables are deliberately mixed: **shipped green code + empirical findings + decision docs** teed
up for the next (collaborative) session.

Roi calls the shots up front (this brainstorm). Roi will **not** read the spec/plan before the run —
he is delegating on the strength of the brainstorm. Therefore the executor is the **only check** before
unattended execution: the bar on self-review and plan self-containment is raised accordingly.

## 2. Operating constraints (non-negotiable)

- **Iron rule — `scratch` only.** All live browser work runs against a **burnable throwaway** Google
  account in a `scratch` workspace. The real warmed `primary` session is **never opened, cloned, or
  driven** — at most one read-only "still logged in?" check at the very end. If Google invalidates
  `scratch` mid-spike, that is a *finding*, not a failure; record it and move on (it cannot be
  re-logged-in autonomously, and does not need to be).
- **Lightweight lens (Roi's standing principle).** Lightness comes from *architecture* (one shared
  engine, thin shell), not from bloating the core. Every artifact is evaluated against: *does this add
  **shipped** weight, and can it be a thin / opt-in / off-by-default layer?* Most of this run produces
  **knowledge, not weight** (see §4). Distinguish shipped-weight from test-only / deployment-only.
- **Security is top priority.** Agent-blind boundary preserved; any behavioral signature is treated as
  sensitive (biometric-grade), stored like a credential. Anti-detection framed as **user-authorized
  continuity**, never stealth/bypass-for-malice.
- **Push policy.** Push to **`dev` only**. Never master (Roi's milestone call). Each code item is its
  own CI-green commit. Never leave the tree broken.
- **Research-driven calibration.** Code workstreams get precise steps; the live spike gets a fixed
  procedure; the research tail gets **objectives + questions to answer**, not pre-scripted conclusions.

## 3. Pre-run setup (Roi, ~2 min, then out of the loop)

```
FEATHER_WARM_WORKSPACE=scratch npm run warm-session
```

Log into a **throwaway** Google account using **passkey / Face-ID** — mirroring `primary`'s
device-bound (DBSC) condition so the cookie-isolation findings actually transfer. Ctrl-C to finalize.
Delete the passkey afterward (per-account). `warm-session` already supports the `FEATHER_WARM_WORKSPACE`
override (`src/tools/warm-session.ts:25`) — **no code change required** to set the ground.

The run does not begin until `scratch` exists.

## 4. Workstreams (Ratchet order)

The run is ordered so guaranteed wins land first and the most interruption-tolerant work absorbs the
tail. If the budget runs short, **④ is trimmed first** — by design.

### ① Bank a guaranteed win — ozone-platform fix *(code → dev)*
Make `--ozone-platform` configurable in `spawnAndConnect` (`src/browser/modes.ts:44`, currently
hardcodes `--ozone-platform=wayland`), then **un-gate** the 2 Wayland-pinned integration tests
(`attach-cdp`, `system-chromium`) so they run on CI / X11 / headless. Confirms CI is healthy *and* puts
the anti-detection path under CI. Drive ozone-platform from env / auto-detect (e.g. unset → Chromium
default, or `FEATHER_OZONE_PLATFORM`); optionally support a headless spawn for CI. Each step CI-green
before moving on. **Shipped weight:** negligible (config plumbing).

### ② Live spike block — the high-information core *(runs on `scratch`; produces research docs)*
- **Cookie-isolation spike.** Clone `scratch`'s Google cookies into a fresh isolated context; measure
  whether auth survives **and** whether DBSC device-binding flags it. → findings doc in `research/`.
  Procedure anchored to `research/2026-06-04-cookie-jar-isolation-and-phase5-sequencing.md`.
- **Pre-shell #6 — Cookie Mine loop (ADR-0007 gate).** Demonstrate the human-warm → agent-piggybacks →
  background-task loop end-to-end **on `scratch`**. Proving the *mechanism* is the goal, not the
  specific account; `primary` stays untouched.
- **Anti-detection self-test.** Fire a battery of real bot-detection probes at our own session
  (`navigator.webdriver`, CDP runtime leaks, canvas / WebGL / font fingerprint, headless tells,
  timing / mouse naturalness) → empirical "how detectable is Feather right now" report.
  **Three-way comparison baked in: headless vs headed-CDP vs Xvfb-headed** — directly answering
  "can we ever run this headless?" with numbers instead of assertion (see §6). **Shipped weight:** none
  (throwaway probe harness).

### ③ Rest of the code *(code → dev)*
- **`warm-session` password-manager-disable-by-policy hardening.** Keep raw creds out of the shared jar
  (`credentials_enable_service=false` / `PasswordManagerEnabled` policy on the profile). Dormant in
  Phase 4 but must precede any agent action. **Shipped weight:** negligible (policy flag).
- **vitest `^2 → ^4` bump** (clears the dev-only audit). **Dead-last and auto-revert:** if it is not
  cleanly green fast, throw the change away and leave a findings note — never wake Roi to a half-broken
  test config. (This is the one item that most wants a human watching; auto-revert is the guardrail.)

### ④ Research tail — degrades gracefully, soaks up remaining budget *(decision docs)*
Objectives + questions, not pre-scripted answers. Depth-adaptive; mark **complete vs. stubbed**.

- **Shell-stack R&D.** Tauri/WebKitGTK vs GTK4-native on Wayland with Playwright-managed Chromium —
  grounded comparison + a **recommendation** (draft ADR; the *final* pick is a joint call). Carry the
  weight lever: the shell stack + single-shared-engine are where weight is actually won (Chromium
  dominates the controller's footprint).
- **Architecture sub-analyses (Roi's questions, answered with evidence):**
  - *Process boundaries vs. "microservices."* Microservices as a distributed architecture are
    anti-Feather (weight + IPC overhead for a local single-user tool). But **process boundaries for
    security and fault isolation** (vault isolation so the agent never shares memory with raw creds; a
    crashed browser not taking down the hub) *do* earn their keep. Map where a boundary pays vs. where
    it is just overhead.
  - *Language strategy.* Evidence-first: **language is irrelevant to stealth** (the site only ever sees
    Chromium); **marginal to weight** (Chromium dwarfs the controller — rewriting for weight is YAGNI).
    The one narrow win is **precise input timing for behavioral fidelity** (lower-level scheduling beats
    Node's event loop), which **converges for free on the shell decision** (if Tauri wins, Rust comes
    along). Conclusion to defend: no gut rewrite; let the shell decision + fidelity-timing drive any
    language addition.
- **Phase 4 GUI architecture sketch.** How the Zen-shell consumes the Phase-3 SSE event stream to drive
  tab list + session state.
- **Behavioral-fidelity design + capture harness.** Design (what signals to capture; secure storage as
  a sensitive signature; replay-with-fidelity) **+** a ready-to-run capture harness wired into the
  headed session, so next session Roi just browses and it records. Designed as a **thin, opt-in,
  off-by-default layer on the stealth path** — never core weight. This work is *forward* of Phase 4
  (Phase 5 cold storage): the design is high-value now; the harness is "build only if budget reaches
  it" (it sits in the tail; may return as a stub). The actual recording is a hard you-in-the-loop wall.

## 5. Hard-stop / handoff conditions (where the run halts or defers)

- **Anything requiring sudo** → defer to Roi (vault Spikes A/B are sudo-gated and frozen — out of scope
  anyway).
- **Any Google challenge needing Roi's face/passkey** → on `scratch`, record as a finding and move to
  the next workstream (do not halt the whole run); never attempt on `primary`.
- **Any master-merge / milestone decision** → never auto-merge; leave for Roi.
- **Behavioral-fidelity recording** → design + harness only; recording needs Roi browsing.
- **Anything that would touch `primary`** → never; hard rule.
- **A code change that cannot go green** → revert it, leave a findings note; tree never left broken.

## 6. The headless question (recorded, to be answered empirically)

Behavioral fidelity (mouse/keyboard replay) works **mechanically** in headless and headed alike — both
inject synthetic CDP input; there is no physical pointer in either. **But headless carries its own
static fingerprints** (software-renderer WebGL, empty plugins, window/screen quirks) independent of
behavior — so for anti-detection, headless undermines the goal regardless of how human the motion is.
This is *why* the Cookie Mine path already uses headed `chromium-headed-cdp`. For display-less
deployment the answer is **Xvfb / virtual-display + real headed Chromium** (headless-*like* ops without
the headless *fingerprint*), not `--headless`. Exact current detectability of new-headless is an
empirical question → workstream ②'s self-test quantifies the headless / headed-CDP / Xvfb-headed gap.

## 7. What the executor will NOT decide alone (teed up for the joint session)

Shell-stack final pick · whether cookie-isolation is safe enough for the *real* `primary` · any
master-merge · the behavioral-profile storage backend (ties to the frozen vault). The run **recommends
with evidence**; Roi + executor decide together.

## 8. Deliverables manifest (what Roi reviews next session)

- Shipped, CI-green commits on `dev`: ozone-platform + un-gated tests; password-manager hardening;
  vitest bump *or* its auto-revert findings note.
- `research/2026-06-05-cookie-isolation-spike-findings.md` (auth survival + DBSC binding result).
- `research/2026-06-05-anti-detection-self-test.md` (probe battery + headless/headed/Xvfb comparison).
- Pre-shell #6 loop demonstration + writeup (ADR-0007 gate evidence).
- `docs/specs/` draft ADR: shell-stack recommendation (+ process-boundary & language sub-analyses).
- Phase 4 GUI architecture sketch.
- Behavioral-fidelity design doc + (budget permitting) a ready-to-run capture harness.
- Full journal handoff: `journal/context/active.md`, `next.md`, `log.md`, an `ops/sessions/` file.

## 9. Honest expectations

Depth-adaptive. ①–③ are expected to land; ④ proceeds as far as budget reaches, with each artifact
clearly marked **complete vs. stubbed**. The anti-detection self-test is *executed*; behavioral fidelity
stops exactly at the you-in-the-loop wall. No uniform-depth promise across all four workstreams.
