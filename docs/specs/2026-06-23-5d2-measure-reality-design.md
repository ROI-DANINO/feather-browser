# 5d.2 — Measure Reality: Design

**Date:** 2026-06-23
**Status:** 📐 Spec — ready for run-plan
**Phase:** Phase 5d (v2.5), step 2 of the stealth + Behavior-Mine arc
**Arc design (owns ordering):** `docs/specs/2026-06-23-stealth-behavior-arc-design.md`
**Consumes:** 5d.1 (the shipped secure session) — `docs/specs/2026-06-23-5d-stealth-reconciled-design.md`
**Prior baseline (offline):** `research/2026-06-05-anti-detection-self-test.md`

---

## Why this step

The arc commits to building learned, human-shaped input (5d.4) — expensive, kinematic, spike-first.
The council requirement is **measure against real detectors before investing.** 5d.2 is that
measurement, and it is a **real gate:** if behavioral detection isn't biting on Feather's targets,
5d.4 may shrink or defer. We let the numbers decide, not optimism.

The 2026-06-05 self-test already measured the **offline** vector (headed-CDP vs `--headless=new`,
JS-surface only) and found the headed path clean on the static axes. Its own "not-yet-probed" list
names exactly what is still open and is 5d.2's job:

1. **No external detector was ever hit** — everything so far was offline/deterministic.
2. **The behavioral axis is unmeasured** — static fingerprint is not what 5d.4 addresses.

## What 5d.2 is (and is not)

- **Is:** a one-shot, operate-by-hand measurement run that points the *shipped* secure Feather
  session at real online detectors and records an honest, per-target baseline + a gate decision.
- **Is not:** a code build. Near-zero new code by design (see "Code" below). Not a regression
  harness, not an automated scraper, not a parallel fan-out (one box, one server, one display, one
  real Chromium — sequential observation is what makes the data trustworthy).

## Method

Drive the running Feather HTTP API operate-by-hand — the same proven pattern as the spine live test
(`docs/v2_wrap/spine-live-test/run-report.md`).

- **Profile:** disposable, **no login, no real account**, public endpoints only → zero account/footprint risk.
- **Browser mode:** `chromium-headed-cdp` (the real Cookie-Mine path; the only one 5d.1 checks run on).
- **Record the session's own 5d.1 output** (`stealthWarnings`, `siteClass`) at launch — what the
  ship-path says about itself on this box, alongside what the detectors say.
- **Static-fingerprint targets:** navigate, let the page settle, screenshot the verdict.
- **Behavioral targets:** navigate **and drive real input through Feather's secure typing path**
  (`observe → type/click` with the shipped sequential+jitter cadence) so the behavioral detectors
  actually see Feather-shaped input, not a static page load.

## Targets

The run records whatever each target **actually reports**. A target that is down, changed, or
gives an ambiguous read becomes an honest **PARTIAL** — never a faked PASS. The list is a starting
set; the run may add/drop based on what is reachable on the day.

| Target | Axis | How driven |
|---|---|---|
| `bot.sannysoft.com` | static fingerprint | navigate + screenshot (already wired in the probe's online path) |
| CreepJS (`abrahamjuliot.github.io/creepjs`) | static + trust score | navigate, let it settle, screenshot the score |
| `browserscan.net/bot-detection` | static + "robot" verdict | navigate + screenshot |
| `bot.incolumitas.com` | **behavioral** + score | navigate **+ observe→type/click** so secure-cadence input is seen |
| Fingerprint.com bot-detection demo | **behavioral / commercial** | navigate + minimal interaction + screenshot |

The behavioral two (`incolumitas`, Fingerprint) are the point of this step — they exercise the gate
the free fingerprint pages cannot.

## Output — the deliverable

`docs/testing/5d2-baseline/` containing:

- **`baseline-report.md`** — a per-target table: *target · axis · verdict (PASS/PARTIAL/FAIL) ·
  concrete signals flagged · screenshot path*, plus:
  - the session's launch-time 5d.1 `stealthWarnings` / `siteClass` on this box,
  - a **Gate decision** section answering plainly: *does behavioral detection bite on Feather's
    targets?* → one of **proceed (build 5d.3/5d.4 as planned) · shrink · defer**, with the reasoning,
  - the honest caveats (below), recorded not hidden.
- **screenshots/** — one per target, committed as evidence (detector pages carry no personal data).

## Honest caveats (recorded, first-class)

- These are **public research/demo detectors.** A real commercial deployment (e.g. DataDome or
  Cloudflare fronting a live site under load) may behave differently. The free tier is indicative,
  not the last word.
- **Free detectors under-weight behavior.** Even `incolumitas`/Fingerprint give a *partial*
  behavioral signal. If the gate reads "behavioral not clearly biting," that is a finding about
  *these reachable targets*, not proof that no detector anywhere would bite — the report says so.
- **Failures and partials are successful outcomes** (per the project's testing-honesty rule): a
  clean FAIL with the signal recorded teaches 5d.4 exactly what to beat.
- **Single-box sample** (Intel Iris Xe / Mesa, this Fedora/Wayland box). Renderer strings are
  hardware-specific; the baseline is this machine's, noted as such.

## Code

Essentially none — a run procedure + a report. If one tiny helper proves necessary mid-run (e.g. a
curl convenience or a screenshot-fetch one-liner), it is a throwaway and gets a `ponytail:` flag. No
new module, no dependency, no change to shipped `src/`.

## Security framing (outsider / public-repo-threat first)

Everything here is a disposable profile against public endpoints with no credentials. The only thing
that lands in the repo is detector screenshots (no personal data) and a markdown report. Nothing
about `scratch`, `primary`, or any warmed/tier-c account is touched. There is no new attack surface
and nothing secret to leak.

## Done when

- Each target driven and screenshotted (or honestly marked PARTIAL/FAIL with the reason).
- The behavioral targets received real secure-cadence input, not just a page load.
- `baseline-report.md` written with the per-target verdicts + the Gate decision.
- The report's Gate decision is reflected back into the roadmap/tasks (proceed/shrink/defer) so 5d.3
  planning starts from evidence.
