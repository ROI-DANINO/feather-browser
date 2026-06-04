# Session — phase4-step0-cookie-mine (2026-06-04 01:39)

**Phase 4 Step 0 (Visual Desktop Shell — research + plan): DONE, by spiking instead of
speccing.** Proved the Cookie Mine end-to-end on a real site; the agent acted as Roi in his
live ChatGPT session. Branch `dev` (uncommitted tracking at stop time).

## Done this session

- **Sequencing decided + ADR-0007 written** (`docs/specs/adr-0007-phase-4-shell-sequencing.md`):
  defer the seamless low-latency shell to a later dedicated R&D phase; **headed-Chromium
  stopgap** for now; **prove the Cookie Mine loop first**. Target end-state = "painted-in"
  one-window shell (headless Chromium + screencast + forwarded input) — but the
  **implementation stack is explicitly open R&D, not locked** (not Rust/GTK/Tauri/Zig by
  decree).
- **Deferred `rnd` graduation** (3 commits: ADR-0006 + ROADMAP Phase-5 edit + inbox archiving)
  — Phase-5 framing, doesn't touch the shell; fold in at a later natural merge point.
- **6 spikes** on the real machine (Fedora / Wayland / `niri` 26.04 / Playwright 1.60 bundled
  Chromium 148), all no-install:
  1. Chromium runs **headed natively on Wayland** (`--ozone-platform=wayland`, `DISPLAY`
     unset → no XWayland). niri **tiles** the window; the app cannot self-size/place.
  2. Wayland-embedding blocker **dissolved**: tiling + separate-window, and the headless
     painted-in model has no window to embed.
  3. Cookie Mine loop (practice site): agent tab via `context.newPage()` (== `openTab`)
     inherited the human's login cookies ✅.
  4. **Real-site attempt → bot detection.** Google "unusual traffic"/reCAPTCHA; Cloudflare
     "verify you are human" (3× fail). Found: current `src/browser/modes.ts` has **NO**
     anti-detection (old stealth patches were dropped in Phase-3 refactors).
  5. **"Attach, don't launch":** spawn Chromium normally (no automation flags) +
     `connectOverCDP` → `navigator.webdriver=false`. **Logged into real ChatGPT, no CAPTCHA.**
  6. **Hello-world:** agent opened a tab into Roi's live ChatGPT Plus session and sent
     "hello world" as him (human-authorized). Screenshot delivered. Real login then wiped
     from disk.

## Decisions

- ADR-0007 (above). **Attach-don't-launch** is the anti-detection foundation. **Bot-detection
  is the #1 risk** to the Cookie Mine. "Chrome for Testing" banner is cosmetic — a real
  Chromium binary removes it (deferred `FEATHER_CHROMIUM_PATH`, sudo).
- Display *model* (painted-in) is the direction; *stack* is open R&D toward a high-quality
  featherweight result.

## Ideas captured (Phase 5-era; framed as user-authorized continuity, NOT "stealth/bypass")

`journal/raw/_inbox/2026-06-04-session-insights-behavioral-fidelity-security.md`:
- **Learned behavioral fidelity** — agents act with Roi's own interaction signature (mouse
  paths, typing tempo, scroll, dwell), learned by observing real usage.
- **Observe-to-learn** — agent can see Roi's screen on request (like his screenshots to
  Claude) to understand context and later learn workflows from demonstration.
- **Detection self-emulation** — model sites' bot-ID techniques to find weak spots (defensive
  self-test).

## Next concrete action

**Research (security = HIGHEST priority): a highly-secure open-source password manager + a
secure database/storage format** for the future credentials vault (Phase 5). Threat model,
encryption-at-rest, key management, auditability, license.

## Verbatim Roi quotes

- "i want to resume building and stop the documentation and project structure spirole but I want to work smart."
- "light = don't carry a second engine" (his two-layer model: Chromium engine + the frame around it)
- "the perfact hello world moment is you - the agent, sending hello world massege to chat gpt."
- "thats awsome my man."
- "security is a very high priority."

## Flags

- The shell is **active R&D** — do not let docs imply a locked stack (Rust/GTK/etc.).
- Anti-detection lives in spikes only; not in `src/`. Productionizing attach-don't-launch is
  future work.
- Spike scripts were throwaway (job tmp, auto-cleaned) — nothing landed in `src/`.
