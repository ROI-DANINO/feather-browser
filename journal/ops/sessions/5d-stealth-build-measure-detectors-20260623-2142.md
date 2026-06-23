# Session — 5d.1 built, 5d.2 measured, and the detectors disagreed

**Date:** 2026-06-23 (stop 21:42)
**Desk:** browser
**Nickname:** the-detectors-disagree

## Arc of the session

Built 5d.1 (stealth base) end-to-end, then resumed 5d.2 (measure reality) as a live operate-by-hand
run — which turned into a real, multi-round measurement effort when Roi chose to *stay on the tests
and harden them* before moving to 5d.3. The dramatic turn: the CDP `Runtime.enable` leak read **clean
on rebrowser** and **detected on Brotector** — two detectors, two techniques, opposite verdicts. The
single reassuring PASS was falsely reassuring; the second detector caught what the first missed.

## Done this session

1. **5d.1 — Stealth base SHIPPED (TDD, 9 tasks, 8 commits, pushed `e26ef63..07bb4c1`).**
   - New `src/browser/stealth.ts`: `classifySite`, `jitterDelayMs`, `applyFingerprintCheck` (Layer 4,
     no font guard), `applyStealthEnvironment` (Layer 2), Layer-1 doc-seam (CDP audit: console/pageerror
     listeners only in `src/debug/capture.ts`, opt-in).
   - `Actionable.typeSequentially` seam (`locators.ts`) — replaced the two raw casts with explicit
     per-backend adapters so secure cadence reaches **ref** (ElementHandle.type) + selector
     (Locator.pressSequentially) targets. (Plan gap caught: the two identity assertions in
     `resolve-actionable.test.ts` would break → converted to delegation assertions.)
   - `type.ts`: secure-by-default cadence (sequential+jitter unless `mode`/`delayMs` given; per-call
     override wins). `SessionRecord.stealthWarnings` + setter; manager runs checks on headed-CDP launch,
     logs `siteClass`. Probe extended (hard assertions + secure sannysoft report).
   - Gates: typecheck clean, **454u** (+16), integration green except the known pre-existing niri
     viewport red (byte-identical to base). rd-verify PASS.
2. **5d.2 — Measure reality (live, operate-by-hand, disposable headed-CDP, no login). Pushed.**
   - First pass (5 detectors): **static axis PASS** — sannysoft, browserscan (incl. **CDP: Normal**),
     **Fingerprint Pro commercial** (`bot: not_detected`, **`tampering_ml_score: 0`** → verify-don't-spoof
     validated by a commercial ML detector). CreepJS PARTIAL→ trust grade **high** on re-run. incolumitas
     **behavioral score never computed** (`...`) → gap = **mouse-motion** (clicks teleport).
   - Hardening re-run: **closed my own confound** — score stayed `...` even *with* full form + cadenced
     keystrokes + clicks across all windows → keyboard insufficient, motion is the gap. **NEW capability
     gap: no JS-dialog handling** (`confirm`/`alert`/`prompt` auto-dismissed; no `page.on("dialog")`).
   - **Research pass** (background agent → `research/2026-06-23-bot-detection-landscape-research.md`),
     adversarially corrected two of my conclusions: (a) gap is trajectory **shape**, not provenance —
     Feather already passes `isTrusted`; (b) mouse-motion is **vendor-specific** (DataDome/HUMAN win,
     ~zero for Cloudflare).
   - **Gate-check (b) — rebrowser CDP-leak:** `runtimeEnableLeak` **🟢 no leak** (6🟢/1🔴/3⚪️). One red:
     **`useragent`** — bundled **Chromium** not Google Chrome (static tell; fix = run real Chrome, gated
     on install — not on this box).
   - **Brotector — ⚠️ contradicts rebrowser:** Average **1.00 DETECTED** via `runtime.enabled`
     (`nameLookupCount:3`). `Input.untrusted` PASS (input is trusted, research validated). popupCrash
     survived (`alive`). → **gate (b) re-opened: CDP-runtime hardening is a real, possibly-higher-than-5d.4
     workstream.**
   - Evidence: `docs/testing/5d2-baseline/baseline-report.md` (+ Addenda A/B/C) + 8 screenshots.

## Left unfinished / next concrete action

**Next = isolate the Brotector CDP-runtime detection mechanism, then test a fix.**
1. Does `runtime.enabled` still fire with **zero** Feather evaluates (navigate + sit idle, no
   observe/snapshot)? → tells us inherent-attach vs. perception-triggered.
2. Does rebrowser-patches-style `Runtime.enable` suppression defeat Brotector's `nameLookupCount`
   method? If a CDP tell scores 1.00 regardless of behavior, it likely **outranks 5d.4**.
3. Then decide 5d.4 sequencing (CDP-hardening before/alongside mouse-motion).

## Decisions

- **5d.2 gate v1→v4 (evidence-driven, each refined by the next test):** proceed→narrowed-to-motion→
  bounded+gated→**CDP-hardening re-opened**. Recorded honestly, including walk-backs.
- **Subagent-driven-development was the wrong tool for 5d.2** (a one-box live measurement, not a
  parallel TDD code build) — Roi agreed; harness saved for 5d.3+.
- **Verify-don't-spoof holds**, with two named tensions: behavior (5d.4 = *generating* real input) and
  the CDP `Runtime.enable` leak (where a patch may be the only fix — now more likely after Brotector).
- Real-Chrome static win + JS-dialog gap **filed** (both Roi-gated / separate workstreams).

## Ideas / flags

- **Don't trust a single detector.** rebrowser's lone PASS was falsely reassuring; Brotector flipped it.
  Multi-detector is the honest bar.
- **A CDP tell scoring 1.00 makes mouse-motion moot on that detector** — sequencing matters.
- The mainWorldExecution check stayed neutral but relates to the deferred observe-walk isolated-world
  swap — worth a dedicated probe.

## Verbatim Roi quotes

- "i think we can resume 5d.2 — measure reality"
- "i want to stay on the tests we ran. can we learn somthing from them? can we harden the tests to make them harder? are there more tests planned ahead? should we research online what else can we do? al this before moving to 5d.3"
- "run the rebrowser leak test next"
- "push it then run the brotector test when you are done /stop and suggest next step and stuff to flag then proceed to full stop (dont waite for my answer)"

## Commits (all on `dev`)

5d.1: `1c398e2 01b3e88 66c8bde 241df1e a22582c 75cbfd3 5176b66 07bb4c1` (pushed).
5d.2: `d276170` design, `96818c3` baseline+gate (pushed), `d92b598` hardening+research, `b8e19bc`
gate-check b (pushed), `b9...`/latest Brotector commit (this stop pushes remaining).
