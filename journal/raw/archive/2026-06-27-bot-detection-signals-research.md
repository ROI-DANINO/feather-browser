# Bot/Agent Detection Signals — Primary-Source Research (2026-06-27)

> Deep-research run (91 agents, adversarial 3-vote verification; the harness's final synthesis
> stage returned a broken placeholder, so this report was reconstructed from the verified claim
> journal). Vote tally shown per claim: `3-0`/`2-1` = confirmed, `0-3`/`1-2` = killed.
> Purpose: settle whether a *rendered cursor* matters to detection, and inventory detectors for a
> self-hosted "tower" gym. Trigger: Roi (rightly) distrusted my from-training-knowledge assertions.

## Primary sources (flagged `primary` by the harness)
- **brotector** — https://github.com/kaliiiiiiiiii/brotector
- **FCaptcha** — https://github.com/WebDecoy/FCaptcha
- **FingerprintJS BotD** — https://github.com/fingerprintjs/botd
- **rebrowser-bot-detector** — https://github.com/rebrowser/rebrowser-bot-detector
- **MDN `Event.isTrusted`** — https://developer.mozilla.org/en-US/docs/Web/API/Event/isTrusted
- **Mouse-dynamics survey (arXiv 2208.09061)** — https://arxiv.org/html/2208.09061v2
- Supporting (blog): Castle (mouse / headless-Playwright), ScrapingAnt, rebrowser runtime-enable.

---

## Q1 — Does any detector check cursor RENDER / compositor? **NO. (Hypothesis disproven.)**
Multiple independent primary detectors confirmed to operate **purely on JS input events**, never on
whether a cursor sprite is painted:
- `3-0` **Brotector does NOT probe OS compositor or cursor-sprite render state.** Its *only*
  cursor-related check detects a **tool's own canvas-drawn cursor visualizer** (an arc within ±5px of
  the mouse on a pointer-events-pass-through overlay) — i.e. it flags a bot tool that *draws* a cursor,
  not the *absence* of a rendered one. (brotector)
- `3-0` Castle's mouse-movement detection operates purely on the JS `mousemove` event, not any
  rendered cursor sprite or compositor state. (Castle)
- `3-0` Cursor-based detection operates on JS `mousemove` X/Y, not renderer/compositor state. (ScrapingAnt)
- `3-0` Mouse-dynamics biometrics capture only W3C event-object fields (type, x, y, pageX/Y, deltaX/Y,
  timestamp) — coordinate/timing streams, not visible rendering. (arXiv)
- `3-0` BotD does not inspect mouse/cursor movement at all. (BotD)
- There is **no browser/JS API that exposes cursor-render/compositor presence to a page** — none
  surfaced across 11 sources / 42 claims.

**⚠️ Design trap (the real finding):** drawing an **in-page cursor overlay is itself a detectable
tell** — Brotector's one cursor check exists precisely to catch tool-drawn cursor overlays. So a
visible "watch the agent" cursor must render **out-of-page** (screen-recording layer / OS overlay),
never as an injected DOM element, *especially* during a scored run.

*Killed (don't cite):* the bare absence-claim "detection ... with no inspection of whether a cursor
sprite is rendered" was killed `1-2` — not because cursor-detection exists, but because an *absence*
is unprovable from a single source. The positive framings above (each tied to a real detector's
behavior) carried `3-0`.

## Q2 — Behavioral signals actually collected/scored
- `3-0` Near-zero **acceleration** (constant-speed straight lines) ⇒ flagged bot. (Castle)
- **Event frequency**: bots emit far fewer `mousemove`s (≈4 for an instant jump vs ≈378 for a human
  move). (Castle) — *relevant: our `/move` emits a real multi-step path, not a teleport.*
- `3-0` Trajectory geometry: per-segment + total path length, **curvature** (1st/2nd derivatives),
  horizontal/vertical velocity & acceleration, path-tangent angle; aggregated into 5 action types
  (Move/Drag/Point-click/Click/Scroll), summarized (min/max/median/mean/std/var/skew/kurtosis), then
  classified (SVM/KNN/RandomForest). (arXiv)
- `3-0` **FCaptcha** = self-hostable invisible CAPTCHA collecting **40+ behavioral signals**:
  trajectory/velocity/acceleration, **3–25 Hz micro-tremor**, click precision/overshoot, keystroke
  cadence, think-time bursts. One Docker command; Go/Python/Node. (FCaptcha)
- **Bezier-curve paths are hard to separate from human** by simple rules — needs feature-engineering +
  ML. (Castle) — *relevant: `mouse-path.ts` already generates Bezier paths; this validates the approach.*

## Q3 — GPU/renderer fingerprinting — ⚠️ WEAK COVERAGE (evidence gap)
The harness decomposed into only 3 angles (CDP-leak + behavioral heavy) and **did not deeply cover
WebGL `UNMASKED_RENDERER` / canvas / WebGPU / SwiftShader**. What's supported: detection splits into a
**static/fingerprint + CDP-protocol axis** vs a **behavioral/input axis**, repeatedly described as
*separate* (`3-0`, multiple sources). GPU fingerprinting belongs to the static axis and is unrelated
to cursor/mouse use — but the *specifics* here rest on my prior 5d.2 baseline, **not** this run.
Treat GPU specifics as **unverified this session**; a follow-up angle is owed if it matters.

## Q4 — Synthetic vs real input: can a page tell? **Partly YES — corrects my earlier claim.**
- `3-0` `Event.isTrusted` is true only for UA-generated events, false for `dispatchEvent`. Even
  `HTMLElement.click()` ⇒ `isTrusted=false`. (MDN) So `isTrusted` catches **JS-dispatched** events…
- `3-0` …but **CDP-injected input reports `isTrusted=true`** and slips past isTrusted checks.
  (Brotector, FCaptcha both concede this.)
- **`3-0` HOWEVER — CDP mouse injection IS detectable by other means:** Brotector flags CDP
  `Input.dispatchMouseEvent` via **Chrome bug crbug#1477537** (leaks coordinate data) — a positive
  tell for CDP-injected mouse, **independent of isTrusted**. (brotector)
  → **Correction to me:** "156 trusted events ⇒ undetectable" was too rosy. The events are trusted,
  but the *CDP injection method itself* leaks on Brotector. That's a real gym level, not a non-issue.
- Other CDP-presence tells (all `3-0`, none input-related):
  - **Runtime.Enable leak** → `Runtime.consoleAPICalled` observable from page JS; shared by
    Puppeteer/Playwright/Selenium. Mitigation: `Page.createIsolatedWorld`. (rebrowser)
  - **CDP serialization side-effect**: an `Error` with a getter on `.stack` fires when `console.log(e)`
    is serialized for the DevTools socket — detects **any** CDP attach (also flags humans with DevTools
    open). (Castle)
  - `navigator.webdriver`, Chrome-for-Testing **useragent**, Playwright `__pwInitScripts` global +
    `exposeFunction` leaks, chromedriver `window.cdc`, Playwright ≥1.46.1 init-script signatures.
    (rebrowser, brotector)
- *Killed:* FCaptcha "coalesced pointer-event batching" tell `0-3`; "movementX/Y vs delta coherence"
  `1-2`. So those specific synthetic-input tells are **not** reliably supported — don't build levels on them.

## Q5 — Self-hostable vs commercial (for the tower)
**Embeddable / self-hostable (build levels from these):**
- **FCaptcha** ⭐ — self-hosted, invisible, 40+ behavioral signals, one Docker command. Best behavioral level. (FCaptcha)
- **BotD** (FingerprintJS) — MIT, 100% client-side, detects automation-tool/headless presence (no
  behavioral). *But in maintenance mode; advanced detection steered to commercial Fingerprint Pro.* (BotD)
- **brotector** — open source; CDP tells incl. the `Input.dispatchMouseEvent` crbug + Runtime.enable +
  init-script fingerprints. (brotector)
- **rebrowser-bot-detector** — open source; webdriver / useragent / pwInitScripts / Runtime.enable. (rebrowser)

**Commercial SaaS only (live-endpoint "boss fights", can't self-host):** Fingerprint Pro, DataDome,
HUMAN/PerimeterX, Cloudflare, Kasada. Adversary baseline now includes Patchright + Selenium-driverless.

---

## Bottom line for the gym design
1. **Render hypothesis disproven** — no detector reads the cursor render; they read the event stream.
   Visible cursor = observability only.
2. **In-page drawn cursor is a TELL** (Brotector). Watch-the-agent cursor must be out-of-page.
3. **Feather's CDP mouse IS detectable** (Brotector crbug#1477537) — independent of isTrusted. Good
   news for the gym: a real, ownable "level," and `mouse-path.ts`'s Bezier paths are the right answer
   to the *behavioral* axis even though they don't fix the *CDP-injection* axis.
4. **Tower levels** map to: L1 automation-presence (BotD/rebrowser) · L2 CDP-protocol leaks
   (brotector/Runtime.enable/serialization) · L3 behavioral (FCaptcha) · L4 commercial boss fights.
5. **Owed follow-up:** a GPU/WebGL fingerprint angle — this run under-covered it.
