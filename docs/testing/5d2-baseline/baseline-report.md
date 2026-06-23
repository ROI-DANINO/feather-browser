# 5d.2 — Measure Reality: Baseline Report

**Date:** 2026-06-23
**Design:** `docs/specs/2026-06-23-5d2-measure-reality-design.md`
**Method:** Operate-by-hand through the shipped Feather HTTP API. Disposable profile,
`chromium-headed-cdp`, **no login, public endpoints only.** Session `ses_33f90c33d9`.
**Box:** Fedora/Wayland, Intel Iris Xe / Mesa, system Chromium **148**, real residential IP
`5.29.10.11` (Israel), timezone `Asia/Jerusalem`.

> Honest framing (project rule): failures and partials are first-class outcomes. The point was to
> learn what is true, not to collect green checkmarks. One target (CreepJS headline) could not be
> read cleanly and one behavioral target (incolumitas) produced the single most important finding by
> *not* scoring — both recorded as-is, not smoothed over.

---

## 5d.1 launch self-check (what the ship-path says about itself)

The session's own always-on 5d.1 checks ran at launch on this real headed-CDP session:

```
stealthWarnings: []        # Layer 2 (environment) + Layer 4 (fingerprint) both clean
siteClass: standard
```

No SwiftShader, environment internally consistent. The shipping secure session reports itself clean
before any detector is even contacted.

---

## Per-target results

| # | Target | Axis | Verdict | What it reported |
|---|--------|------|---------|------------------|
| 1 | bot.sannysoft.com | static fingerprint | **PASS** | `WebDriver missing (passed)`, `WebDriver Advanced passed`, real `Chrome/148` UA (not HeadlessChrome), real **Intel Iris Xe** GPU (not SwiftShader), all `PHANTOM_*` / `HEADCHR_*` = `ok`, `webDriverValue: false` |
| 2 | CreepJS | static + heuristic | **PARTIAL** | `0% headless`, `0% stealth`, **`44% like headless`**, `chromium: true`; privacy/security/mode `unknown` (no privacy tooling). IP↔timezone consistent (`5.29.10.11` ↔ `Asia/Jerusalem`). Headline trust-score/lies number not readable via the cleaned snapshot (canvas/styled) — recorded as a capture limit, not a pass |
| 3 | browserscan.net/bot-detection | static + CDP | **PASS** | Headline **"Test Results: ✅ Normal"**. Per-panel all Normal: WebDriver, WebDriver Advance, Webdriverio, **CDP: Normal**, Native Navigator (native code, not deceptive) |
| 4 | bot.incolumitas.com | **behavioral** | **GAP (see gate)** | Network clean (`abuser_score` Low / Very Low). **`Your Behavioral Score: ...`** — the behavioral classifier **never produced a score**, even after filling the Bot Challenge form with the shipped secure cadence + clicks and waiting through all scoring windows (1.5/4/7/10/15s) |
| 5 | Fingerprint.com Pro Playground | **behavioral / commercial** | **PASS** | `bot: "not_detected"`, `tampering: false` (**`tampering_ml_score: 0`, confidence high**), `vpn: false` (confidence high), `incognito: false`, Virtual Machine not detected. Stable Visitor ID `kJPC2MigwthsC95p0leh`, `Chrome 148.0.0 / Linux`, `vpn_origin_timezone: Asia/Jerusalem` |

Screenshots: `docs/testing/5d2-baseline/screenshots/` (01–05). Detector pages only, no personal data.

---

## What the numbers say

**Static fingerprint axis — PASS, decisively.** Four independent detectors — including one
**commercial** (Fingerprint Pro) and one that specifically hunts **CDP-driven** sessions
(browserscan) — did not flag Feather's secure headed-CDP session. This confirms the 2026-06-05
offline baseline *live, against third parties*, and closes that report's "no external detector was
ever hit" gap.

**The verify-don't-spoof posture is validated by a commercial ML detector.** Fingerprint Pro's
browser-**tampering** signal is `ml_score: 0` (confidence high). Because Feather patches *nothing* —
no font guard, no canvas noise, no fingerprint injection (all cut in 5d.1) — there is no tampering
to detect. A spoofing stealth plugin that monkeypatches native getters would light exactly this
signal up. **Not spoofing is measurably the right call**, not just a philosophical one.

**Locale/timezone consistency holds for free.** Both CreepJS and Fingerprint independently saw the
real IP (`5.29.10.11`) and `Asia/Jerusalem` with no mismatch — the reason 5d.1 verifies rather than
spoofs locale.

**The behavioral axis is where the one real gap lives — and it is specific.** incolumitas's
behavioral classifier is driven mainly by **mouse-movement trajectories**. Feather's `click`/`type`
actions *teleport* the cursor — they generate keystroke events (now with secure cadence) but **zero
mouse-motion path**. Result: the classifier had nothing to score and left `Your Behavioral Score:
...` blank through every scoring window. CreepJS's `44% like headless` is a mild corroborating
heuristic on the same axis.

Crucially: **no detector returned an active "you are a bot" verdict.** Nothing *blocked*. The
behavioral gap is "cannot prove human," not "flagged as bot" — on these public demos.

---

## Gate decision

**PROCEED to 5d.3 → 5d.4, with the scope sharpened by this evidence.** The gate did its job: it did
not green-light the whole generic plan, and it did not kill it — it **narrowed it to one axis.**

What the measurement decided:

1. **Keystroke cadence is done.** 5d.1 shipped it; no detector here faulted typing. Do **not** invest
   further in keystroke statistics.
2. **Fingerprint spoofing stays OFF the table — now with proof.** `tampering_ml_score: 0` shows the
   honest posture wins on a commercial detector. Re-confirms the `fingerprint-generator/-injector`
   reference-only decision.
3. **The single high-value target for 5d.4 is mouse-motion synthesis** — curved, human-shaped cursor
   trajectories — not generic keystroke math. This is exactly the "kinematic input synthesis"
   already filed as 5d.1's deferred spike. 5d.2 promotes it from "deferred maybe" to **the** behavioral
   work item.
4. **5d.3 (capture) should prioritize the mouse-motion stream** over keystroke timing, since motion
   is the axis that moves the needle and the axis Feather currently can't feed at all.

**Honest caveats (do not over-read this):**
- These are public **research/demo** detectors. A production DataDome/Cloudflare deployment under
  load may weight behavior harder and *block* where these only declined to score. The "nothing
  blocked" result is about reachable demos, not a guarantee.
- Free detectors under-weight behavior; the behavioral signal here is **indicative**. The strongest
  single data point is mechanistic, not statistical: the score field stayed blank because there was
  no mouse motion to read — that conclusion does not depend on a detector's threshold.
- Single-box sample (Intel/Mesa). Renderer strings are hardware-specific.
- CreepJS verdict is PARTIAL on a capture limit, not a clean read.

---

## Done

- [x] 5 targets driven; behavioral targets received real secure-cadence input.
- [x] Per-target verdicts + screenshots recorded (PARTIAL/GAP recorded honestly, not smoothed).
- [x] 5d.1 launch self-check captured (`stealthWarnings: []`).
- [x] Gate decision written: **proceed, narrowed to mouse-motion (5d.4); capture prioritizes motion (5d.3).**
- [ ] Reflect the gate decision into ROADMAP/tasks (done in the same commit as this report).
