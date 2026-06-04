# Spike: system Chromium as Playwright executablePath
# Date: 2026-06-03 | S1 Session 1C

## Question
Can Playwright drive Fedora's system Chromium via `executablePath`, so we can drop
the ~300MB bundled Chromium download? Informs S2 (FEATHER_CHROMIUM_PATH).

## Environment
- System Chromium path(s): not installed
- System Chromium version: not installed
- Playwright version: 1.50 (current)
- Checked: `which chromium chromium-browser chromium-headless` → no output
- Checked: `rpm -q chromium chromium-headless` → "not installed"

## Result: NOT TESTED (system Chromium not installed)

The probe script was not run because there is no system Chromium binary to test against.
Fedora requires an explicit install from RPM Fusion (non-free) or the official Chromium
flatpak — neither is present in this environment.

## Install prerequisite (for S2)
```bash
# Enable RPM Fusion (non-free) if not already:
sudo dnf install https://download1.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm

# Install system Chromium:
sudo dnf install chromium
# Expected binary: /usr/bin/chromium
```

## Implication for S2
- S2 must install system Chromium first, then re-run this spike in that session.
- The probe script (to write to `/tmp/feather-chromium-spike.mjs`) is already
  specified in the S1 plan at Task 11 Step 2 — reuse it verbatim in S2.
- Expected risk: Playwright version skew. The bundled Chromium shipped with
  Playwright 1.50 is approximately Chromium 132. Fedora's RPM Fusion package
  may be an older or different build; CDP protocol mismatches cause silent failures
  (page loads succeed but evaluate/waitForSelector timeouts). Record the version
  from `rpm -q chromium` and the probe's reported version string before concluding.
- If the probe passes: `FEATHER_CHROMIUM_PATH=/usr/bin/chromium` is viable.
  Document the supported version skew window and make it an opt-in env var.
- If the probe fails: keep bundled Chromium as the default, expose
  `FEATHER_CHROMIUM_PATH` as an opt-in override, and note the minimum compatible
  Chromium version in the README.
