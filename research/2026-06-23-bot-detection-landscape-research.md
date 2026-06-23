# Bot-Detection Landscape Research — for 5d.2 suite + 5d.4 mouse-motion aim

> Date: 2026-06-23 · Research pass for Feather's stealth arc (5d.4 = synthesize/replay human mouse motion).
> Feather's posture is **verify-don't-spoof**: it drives a REAL headed Chromium via CDP attach, on the
> user's real IP, patching nothing. The 5d.2 measurement run found one behavioral gap: **mouse-motion**
> (clicks/types teleport the cursor). This report stress-tests that finding against current sources and
> picks harder targets + a numeric yardstick for 5d.4.
>
> **TL;DR (read the adversarial caveats):** mouse-motion is the *correct* next target, but it is the
> dominant signal only for a *subset* of vendors (DataDome, HUMAN/PerimeterX, Kasada). Cloudflare Bot
> Management — the one Feather hits most — does **not** weight mouse-motion at all server-side; it is
> network/ML/fingerprint. And the *cheapest* behavioral check (`isTrusted`) Feather **already passes** by
> virtue of using real CDP input. The gap 5d.4 closes is narrower than "behavioral classifiers get
> nothing": it's trajectory *shape*, not event *provenance*.

---

## 1. Current best PUBLIC bot/automation detectors to test against

Beyond the five we already used (bot.sannysoft.com, CreepJS, browserscan.net, bot.incolumitas.com,
demo.fingerprint.com), these are the live, maintained, 2025-era targets worth adding. Most public
detectors are **static** (fingerprint/CDP-leak); genuinely **behavioral** public targets are rare —
only three below actually score mouse/keystroke, which is exactly why they matter for 5d.4.

| Detector | What it tests | Static vs Behavioral |
|---|---|---|
| **rebrowser-bot-detector** (`bot-detector.rebrowser.net`) | The canonical CDP-leak suite: `runtimeEnableLeak`, `sourceUrlLeak`, `mainWorldExecution`, `navigatorWebdriver`, `bypassCsp`, `viewport`, `dummyFn`, `useragent`, `pwInitScripts`, `exposeFunctionLeak`. Authoritative for the `Runtime.enable` leak (Q2). | **Static** (all ~10 tests). No mouse/keystroke. |
| **Brotector** (`ttlns.github.io/brotector/`, repo `kaliiiiiiiiii/brotector`) | "Advanced antibot for webdrivers." CDP/webdriver leaks **plus** behavioral: `Input.untrusted` (mouse event `isTrusted` check), `canvasMouseVisualizer` (renders the cursor path it sees), `Input.cordinatesLeak`, `popupCrash`. Can crash some drivers. | **Both** — one of the few public tools with a real behavioral check. The canvas cursor-path visualizer is a free 5d.4 debugging aid. |
| **deviceandbrowserinfo.com/are_you_a_bot** (Antoine Vastel / datadome-adjacent figure) | Static fingerprint + a newer behavioral test ("mouse movements, typing speed, form submission"). Shows raw detection details. | **Both.** Behavioral test is newer/less documented; no public numeric API found. |
| **pixelscan.net/bot-check** & **pixelscan.dev/bot** | Claims to catch 95%+ of Puppeteer/Playwright/Selenium defaults; hundreds of params, WebRTC leaks, network-integrity verdict. "Final exam" reputation vs iphey's "basic check." | **Static** (fingerprint + network consistency). No behavioral score. |
| **iphey.com** | Fingerprint consistency / "trustworthy" verdict. Lighter than pixelscan. | **Static.** |
| **browserleaks.com** | Per-surface fingerprint detail (canvas, WebGL, fonts, WebRTC, TLS/JA3, ClientRects). Diagnostic, not a verdict. | **Static.** Useful to confirm verify-don't-spoof leaves no spoof artifacts. |
| **FCaptcha** (`WebDecoy/FCaptcha`, self-hostable) | Invisible CAPTCHA, "40+ behavioral signals + device/TLS fingerprint + SHA-256 proof-of-work." Explicitly claims to **detect synthetic input that reports `isTrusted: true`** via input-event forensics + "LLM think-time cadence." | **Both** — and it's the one that targets *exactly* Feather's class (real CDP input + agent cadence). Self-host it as an adversary. |
| **Kameleo / Multilogin test pages** | Vendor pages framing antidetect-browser checks (Runtime.enable, fingerprint). | **Static**, marketing-flavored. Low priority vs the above. |

Notes / dead-source flags:
- **bot.incolumitas.com** (we used it) is still the best *single-page numeric behavioral* score — keep it, see Q4.
- **demo.fingerprint.com** = static identification; no behavioral. Fine as-is.
- Kameleo/Multilogin "test pages" are mostly blog/marketing; not rigorous standalone detectors.

---

## 2. CDP runtime-leak / `Runtime.enable` detection — state of the art (hits Feather's exact architecture)

**The leak.** Puppeteer/Playwright/Selenium drive the browser via CDP and call `Runtime.enable` to manage
execution contexts. `Runtime.enable` emits a `Runtime.consoleAPICalled` event and produces a detectable
side-effect any page can probe in a few lines of JS. **All major anti-bots (Cloudflare, DataDome) use
this.** (rebrowser blog, rebrowser-bot-detector `runtimeEnableLeak`.)

**Attach vs launch — the key question for Feather.** Neither the rebrowser blog nor the rebrowser-patches
docs distinguish `connectOverCDP` (attach to an already-running browser) from launch. The detection is on
the *protocol event*, not on how the session started — so **attaching does not inherently avoid the
`Runtime.enable` leak.** If Feather's attach path ever calls `Runtime.enable` on a frame, it leaks the
same way a launched browser does. This needs an empirical check against `bot-detector.rebrowser.net`:
*does Feather's CDP attach trigger `runtimeEnableLeak`?* If yes, that is a static leak no amount of
mouse-motion fixes.

**Mitigation (rebrowser-patches, latest fully-tested 24.8.1, 2025-05-06).** Disables the automatic
`Runtime.enable` on every frame; instead manually creates contexts with unknown IDs (or `Runtime.enable`
→ immediate `Runtime.disable`). Currently undetectable by Cloudflare/DataDome per the author. **But it
only patches the CDP leak** — explicitly NOT canvas/WebGL/UA/proxy/behavioral. (rebrowser-patches README.)

**A related CDP signal just DIED (adversarial nuance, don't conflate with `Runtime.enable`).** Castle.io
documented that the classic *console-getter / error-serialization* CDP signal — log an error with a custom
getter, CDP serialization fires the getter, flag flips — **stopped working in May 2025**: two V8 commits
(`getErrorProperty()`) now skip user-defined getters during error preview ("prevent side effects during
error preview"). So one whole family of CDP detection silently broke. Castle's takeaway is the strategic
point: vendors are **moving off CDP signals** toward "behavioral analysis, environment fingerprinting,
network detection" because "bots today are more realistic out of the box, even the cheap ones." This is
*tailwind* for verify-don't-spoof on the static side, and *headwind* on the behavioral side (it's why
5d.4 exists).

**⚠ Existential architecture risk — Chrome 136 (April 2025).** Chrome 136+ **no longer respects
`--remote-debugging-port` / `--remote-debugging-pipe` against the DEFAULT user-data-dir.** You must pass a
custom `--user-data-dir` pointing to a non-standard directory (different encryption key). The
`DevToolsActivePort` file is not created for the default profile, so the CDP handshake never completes.
**Chrome for Testing is exempt.** This directly threatens Feather's "attach to the user's REAL headed
Chromium / warmed human profile" model: you can no longer CDP-attach to a stock Chrome running the
default profile. Workarounds — launch the real Chrome with an explicit non-default `--user-data-dir`
(i.e. copy/point the warmed profile into a custom dir), or use Chrome for Testing. **This is not a stealth
problem — it's a "can we even attach" problem, and it deserves its own verification before 5d.4.**
(developer.chrome.com remote-debugging-port blog; browser-use #1520; chrome-devtools-mcp #1830.)

---

## 3. What commercial anti-bot actually weights BEHAVIORALLY (the honest, adversarial answer)

The 5d.2 finding ("mouse-motion is THE behavioral gap") is **right for some vendors and wrong for
others.** Don't over-index — it depends entirely on *which* anti-bot the target site runs.

| Vendor | Mouse-motion weight | Keystroke weight | What actually dominates |
|---|---|---|---|
| **DataDome** | **High / decisive.** "Starts with behavior"; collects mouse coordinate sequences, scroll acceleration, click timing, keystroke sequences; checks movements are *smooth/curved, not straight lines*; 2025 models specifically detect *synthetic* mouse movement. Bypass guides (Kameleo, ZenRows) say fingerprint spoofing **alone fails** — you need a ghost-cursor. | Collected, secondary to mouse. | **Behavioral mouse is genuinely the differentiator** here. This vendor most validates 5d.4. |
| **HUMAN / PerimeterX** | **High.** "Tracks mouse movements, click patterns, keystroke timing, navigation"; "100+ signals incl. behavioral biometrics (mouse, scroll, keystroke)." | High (timing). | Behavioral biometrics core + fingerprint. Validates 5d.4. |
| **Kasada** | Behavioral analysis present, but **proof-of-work** (computational challenge) + threat intel are the headline. | Present. | **PoW + env**, not primarily mouse. Mouse-motion helps less here. |
| **Akamai (Bot Manager)** | Present, but **TLS/JA3 fingerprinting at the edge** is the famous strength — blocks before request reaches origin. | Present. | **Network/TLS first.** Mouse-motion is downstream. |
| **Cloudflare Bot Management** | **Server-side: NOT used.** Cloudflare's own docs list Heuristics, JavaScript Detections (headless), ML on *request features* (headers/session/browser signals), Anomaly Detection. **No mouse/keystroke.** Mouse/behavior only enters via the separate **Turnstile** challenge widget (timing jitter, focus, mouse) — and only when the request score is already borderline. | Only in Turnstile, not core BM. | **Network heuristics + ML + headless-JS fingerprint.** Mouse-motion does ~nothing for core Cloudflare. |

**The honest synthesis.** Modern anti-bot is *multi-layer* (TLS/JA3 → HTTP header order → IP/proxy
reputation → JS-execution → fingerprint consistency → behavior). For 2025, the repeated cross-source
verdict is **"static and behavioral are both necessary; coherence across them is what's scored — rotating
a low-fidelity fingerprint without stable identity context is itself the tell."**

For Feather specifically this is *unusually favorable*: verify-don't-spoof on a **real profile + real IP +
real fingerprint** already wins the static/TLS/fingerprint-coherence layers that trip up antidetect
browsers (those *spoof*, and the spoof is the leak). That collapses Feather's remaining exposure onto:
(a) the `Runtime.enable`/CDP static leak (Q2 — verify it!), and (b) behavior. And of the behavior, the
**cheapest universal check is `isTrusted`, which Feather already passes** because CDP `Input.*` events are
OS-level and report `isTrusted: true` (Crawlstack, MDN, Brotector's own `Input.untrusted` exists *because*
naive JS `dispatchEvent` fails it — CDP doesn't). So the real residual behavioral gap is the **trajectory
shape / cadence layer** that DataDome/HUMAN score: curved vs teleported paths, click-timing, "LLM
think-time cadence" (FCaptcha). **That is exactly 5d.4's target — and it's narrower than "classifiers get
nothing."**

**Is mouse-motion over-indexed? Partly.** If Feather's traffic is mostly Cloudflare-protected sites,
mouse-motion buys little and the `Runtime.enable`/headless-JS static checks matter more. If it's
DataDome/HUMAN sites (e-commerce, ticketing, travel, social), mouse-motion is the single highest-leverage
behavioral fix. **Recommendation: confirm which anti-bots the 5d.2 corpus actually runs before scoping
5d.4 width.**

---

## 4. Open behavioral test harnesses (numeric human-vs-bot yardstick for 5d.4 regression)

Genuinely scored, runnable behavioral targets are scarce. Best options, in order:

1. **bot.incolumitas.com (Behavioral classification)** — *the* pragmatic yardstick. Emits a
   **single behavioral score 0 (bot) → 1 (human)**, < 0.5 = likely bot, recomputed at **1.5s, then 4/7/10/15s**
   of interaction, from "30+ classificators." Caveat: false positives in 0.7–1.0; no documented programmatic
   API (read it off the DOM via Feather's own observe loop). **Use this as the 5d.4 regression number:
   drive a fixed task, read the score at the 15s mark, track teleport-cursor (baseline) vs synthesized-motion.**
2. **deviceandbrowserinfo.com/are_you_a_bot** — has a behavioral test (mouse/typing/form). Less granular,
   no clean numeric API found; good as a second, independent pass/fail.
3. **Brotector `canvasMouseVisualizer`** — not a score, but it **renders the cursor trajectory the page
   observed**. Invaluable as a *visual* 5d.4 debugger: confirm synthesized motion actually produces a
   curved, human-shaped path rather than a straight segment or no path.
4. **FCaptcha (self-hosted)** — closest adversary to Feather's class (synthetic-`isTrusted` forensics +
   LLM-cadence). No public score page; stand it up locally as a hard regression gate if 5d.4 wants a
   stronger bar than incolumitas.
5. **Research datasets (for synthesis fidelity, not as a live gate):** ReMouse (MDPI, repeat human
   sessions), DELBOT-Mouse (labeled human/bot). Humans show *lower path efficiency* (peak ~0.3–0.4, with
   detours/overshoot); bots show *high efficiency* (~0.05–0.2, optimized straight paths). DMTG (arXiv
   2410.18233) = diffusion-based human-like trajectory generator that drops discriminator accuracy ~10% —
   a reference design for *how* to synthesize, and a fidelity target. **The efficiency/overshoot metric is
   a cheap internal self-check 5d.4 can compute without any external page.**

---

## Recommended harder targets for the 5d.2 suite

| Target | URL | Static / Behavioral | Why it's harder |
|---|---|---|---|
| rebrowser-bot-detector | `bot-detector.rebrowser.net` | Static (CDP) | Authoritative `Runtime.enable`/CDP-leak suite — verifies Feather's attach path doesn't leak (Q2). Must-add. |
| Brotector | `ttlns.github.io/brotector/` | Both | Behavioral `isTrusted` check + canvas cursor-path visualizer; can crash naive drivers. |
| deviceandbrowserinfo (bot test) | `deviceandbrowserinfo.com/are_you_a_bot` | Both | Vastel-adjacent; static + newer mouse/typing behavioral test. |
| pixelscan | `pixelscan.net/bot-check` / `pixelscan.dev/bot` | Static | "Final exam"; catches 95%+ of automation defaults + network-integrity verdict. |
| iphey | `iphey.com` | Static | Fingerprint-consistency verdict; quick sanity that verify-don't-spoof reads clean. |
| browserleaks | `browserleaks.com` | Static | Per-surface (canvas/WebGL/fonts/JA3) — confirms no spoof artifacts. |
| FCaptcha (self-host) | `github.com/WebDecoy/FCaptcha` | Both | Targets Feather's exact class: synthetic-`isTrusted` forensics + LLM think-time cadence. Hardest behavioral. |
| bot.incolumitas (behavioral) | `bot.incolumitas.com` | Behavioral (scored) | Numeric 0–1 yardstick over time — the 5d.4 regression number. Already in suite; promote it. |

---

## What this means for 5d.4

1. **Mouse-motion synthesis is the right target — but it's a DataDome/HUMAN/PerimeterX win, not a
   Cloudflare win.** Scope width to what the 5d.2 corpus actually runs. If it's Cloudflare-heavy, the
   `Runtime.enable`/headless-JS static surface matters more than curves.
2. **The gap is trajectory SHAPE, not event PROVENANCE.** CDP `Input.dispatchMouseEvent` already yields
   `isTrusted: true`, so Feather already beats the cheapest behavioral check (the one Brotector's
   `Input.untrusted` and naive Playwright `dispatchEvent` fail). 5d.4 only needs to add *curved, variable,
   overshoot-y, human-timed* motion between clicks — not fake trust. That's a smaller, well-bounded job.
3. **Synthesize via CDP `Input.dispatchMouseEvent` step sequences, not JS event injection** — keep
   `isTrusted` true. Model on the research priors: low path-efficiency, overshoot/correction, variable
   velocity (DMTG-style if you want fidelity). Add click-dwell and inter-action cadence jitter (FCaptcha's
   "LLM think-time" tell).
4. **Yardstick: bot.incolumitas behavioral score at the 15s mark**, baseline (teleport) vs synthesized,
   plus Brotector's canvas visualizer for a visual confirm, plus an internal path-efficiency metric.
5. **Two prerequisite verifications before building 5d.4 (both could moot or reshape it):**
   - **(a) Chrome 136 attach:** confirm Feather can still CDP-attach given Chrome 136+ blocks the default
     profile. May force a custom `--user-data-dir` for the warmed profile, or Chrome for Testing. This is
     architecture-critical and independent of stealth.
   - **(b) `Runtime.enable` leak:** run Feather against `bot-detector.rebrowser.net` and check
     `runtimeEnableLeak`. If it leaks, that's a static giveaway no mouse-motion fixes — possibly higher
     priority than 5d.4, and verify-don't-spoof may need a *narrow, justified* exception (rebrowser-patches
     is the only thing that touches it, and it patches *nothing else*).
6. **Thesis check (verify-don't-spoof):** the landscape *supports* the thesis on static/fingerprint/TLS
   coherence (real profile + real IP is exactly what spoofers can't fake and what 2025 detectors reward).
   The two places it bends: behavior (5d.4, additive — not spoofing, *generating* real input) and the
   `Runtime.enable` CDP leak (where the only fix is a patch — a genuine, if narrow, exception to "patch
   nothing"). Worth naming that tension explicitly in the 5d.4 design.

---

## Sources

- rebrowser — Runtime.enable detection & fix: https://rebrowser.net/blog/how-to-fix-runtime-enable-cdp-detection-of-puppeteer-playwright-and-other-automation-libraries
- rebrowser-bot-detector (tests): https://github.com/rebrowser/rebrowser-bot-detector · live: https://bot-detector.rebrowser.net/
- rebrowser-patches (scope/limits): https://github.com/rebrowser/rebrowser-patches
- Castle.io — classic CDP signal broke (V8 May 2025): https://blog.castle.io/why-a-classic-cdp-bot-detection-signal-suddenly-stopped-working-and-nobody-noticed/
- Chrome 136 remote-debugging hardening (official): https://developer.chrome.com/blog/remote-debugging-port
- browser-use #1520 (Chrome 136 default-profile CDP break): https://github.com/browser-use/browser-use/issues/1520
- chrome-devtools-mcp #1830 (same, macOS): https://github.com/ChromeDevTools/chrome-devtools-mcp/issues/1830
- Brotector (behavioral + CDP): https://github.com/kaliiiiiiiiii/brotector · live: https://ttlns.github.io/brotector/
- deviceandbrowserinfo bot test: https://deviceandbrowserinfo.com/are_you_a_bot
- pixelscan: https://pixelscan.net/bot-check · https://pixelscan.dev/bot
- bot.incolumitas (behavioral score): https://bot.incolumitas.com/
- FCaptcha (synthetic-isTrusted + behavioral, self-host): https://github.com/WebDecoy/FCaptcha
- isTrusted + CDP OS-level input (true): MDN https://developer.mozilla.org/en-US/docs/Web/API/Event/isTrusted · Crawlstack https://crawlstack.dev/
- DataDome behavioral weighting / bypass: https://www.zenrows.com/blog/datadome-bypass · https://kameleo.io/blog/guide-to-bypassing-datadome · https://scrapebadger.com/blog/how-to-bypass-datadome-anti-bot-protection-a-complete-2026-guide
- Cloudflare detection engines (official, no mouse server-side): https://developers.cloudflare.com/bots/concepts/bot-detection-engines/
- Cloudflare vs DataDome vs HUMAN (what each checks): https://torchproxies.com/cloudflare-vs-datadome-vs-human-security-what-each-bot-system-actually-checks-2026/ (403 to fetch; via search snippet)
- HUMAN/PerimeterX behavioral: https://scrapebadger.com/blog/how-to-bypass-perimeterx-human-security-complete-2026-guide · https://scrapfly.io/blog/posts/how-to-bypass-perimeterx-human-anti-scraping
- Multi-layer "coherence matters" 2025: https://thescraper.substack.com/p/the-anti-bot-evolution-2025s-invisible · https://scrapingant.com/blog/proxy-strategy-in-2025-beating-anti-bot-systems-without
- Mouse-trajectory research (synthesis fidelity + efficiency metric): ReMouse https://www.mdpi.com/2624-800X/3/1/7 · DMTG https://arxiv.org/html/2410.18233v1 · Bureau https://bureau.id/resources/blog/mouse-movement-behavioral-patterns-can-reliably-tell-bots-from-humans
