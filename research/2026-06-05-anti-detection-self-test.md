# Anti-Detection Self-Test — Findings

**Date:** 2026-06-05
**Status:** ✅ COMPLETE for headed-CDP vs `--headless=new`; ⏸ Xvfb mode blocked (sudo install → Roi)
**Workstream:** Autonomous research run ②.3
**Probe script (throwaway, ships nothing):** `scripts/spikes/anti-detection-probe.ts`
**Frames:** spec §6 (the headless question), `journal/context/active.md` (anti-detection =
user-authorized continuity, defensive — never stealth-for-malice)

> No account involved — the probe fingerprints Feather's **own** browser on a fresh throwaway
> profile per run (zero `scratch`/`primary` exposure). System Chromium 148, `spawnAndConnect`.

---

## Question

How detectable is Feather's automated session right now, and **can we ever run it headless?**
Measure a fingerprint vector across spawn modes instead of asserting from priors.

## Modes

- **headed-CDP (Wayland)** — the current Cookie-Mine default (`chromium-headed-cdp`).
- **`--headless=new`** — `FEATHER_SPAWN_HEADLESS=1`.
- **Xvfb-headed** — *intended third mode; NOT run here* — Xvfb needs a `sudo` install on this
  Fedora box (hand-off to Roi). Recorded as a gap, not faked. (Hypothesis below.)

## Results (system Chromium 148, this Fedora/Wayland box)

| signal | headed-CDP (wayland) | `--headless=new` | tell? |
|---|---|---|---|
| **webdriver** | `false` | `false` | ✅ clean both |
| **userAgent** | `…Chrome/148.0.0.0…` | `…HeadlessChrome/148.0.0.0…` | 🚩 **headless** |
| **webglVendor** | `Google Inc. (Intel)` | `Google Inc. (Google)` | 🚩 headless |
| **webglRenderer** | `ANGLE (Intel, Mesa Intel(R) Iris(R) Xe Graphics …)` | `ANGLE (Google, Vulkan … SwiftShader …)` | 🚩 **headless** |
| **screen** | `1440x900` | `800x600` (default) | 🚩 headless |
| **devicePixelRatio** | `2` | `1` | 🚩 headless |
| **maxTouchPoints** | `10` | `0` | 🚩 headless |
| **canvasHash** | `65bc81db` | `cbd997fe` | 🚩 (follows the GPU diff) |
| languages | `en-US,en` | `en-US,en` | ✅ clean |
| plugins.length | `5` | `5` | ✅ clean (new-headless keeps them) |
| mimeTypes.length | `2` | `2` | ✅ clean |
| window.chrome | `object` | `object` | ✅ clean |
| hardwareConcurrency | `8` | `8` | ✅ clean |
| notificationPermission | `denied` | `denied` | ✅ clean (no perm/Notification mismatch) |

## Conclusions

1. **`--headless=new` is trivially detectable — full stop.** Two independent dead-giveaways:
   - the UA literally contains **`HeadlessChrome`** (a one-line regex flags it), and
   - WebGL reports a **SwiftShader** software renderer (the canonical "no GPU / headless" tell).
   Plus default `800x600` screen, `dpr=1`, `maxTouchPoints=0`. **Behavioral fidelity cannot fix
   any of these** — they are static, present before the session moves the mouse. This is exactly
   the spec §6 thesis, now with numbers: **do not run the real Cookie-Mine path headless.**
2. **The headed path is clean on the axes that matter.** `navigator.webdriver === false`,
   `plugins.length = 5`, real `window.chrome`, real languages, a real GPU renderer (Intel Iris Xe),
   no Notification/permission mismatch. The one load-bearing measure
   (`--disable-blink-features=AutomationControlled`) holds; the attach-don't-launch design pays off.
3. **Display-less deployment ⇒ Xvfb, not `--headless`.** A real headed Chromium under Xvfb gets the
   real **`Chrome/`** UA (no `HeadlessChrome`), a real configurable screen size, and real touch/dpr
   — eliminating the UA/screen/dpr/touch tells. **Open empirical question (needs the sudo Xvfb
   install):** whether WebGL under Xvfb on a GPU-less/headless GPU context still falls back to
   **SwiftShader**. If it does, the renderer tell persists under Xvfb too and would need a GPU
   (or a renderer-spoof) — so this must be **measured**, not assumed. → Roi-gated next step.
4. **CI implication (consistent):** CI runs `--headless=new` + `--no-sandbox` deliberately and only
   asserts `webdriver === false` (identical headless/headed). CI is **not** an anti-detection
   environment and was never meant to be — the real path is headed. No conflict.

## Limitations / not-yet-probed

- **CDP runtime-leak detection** (e.g. `Runtime.enable` stack-trace artifacts, `console.debug`
  timing) was **not** deeply probed — only the JS-surface vector. A dedicated CDP-artifact probe is
  a worthwhile follow-up (some detectors target the DevTools-protocol attach itself).
- **No external detector** was hit (kept offline/deterministic). Pointing the headed mode at a
  public bot-detection page would add third-party validation — a cheap follow-up.
- Single-box sample (Intel Iris Xe / Mesa). Renderer strings are hardware-specific.

## Lightweight lens

Ships nothing — probe lives in `scripts/spikes/`, throwaway profiles, raw vector kept in `/tmp`.
Knowledge, not weight.
