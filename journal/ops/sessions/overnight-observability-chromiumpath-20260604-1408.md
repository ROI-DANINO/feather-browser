# Session — Overnight autonomous: observability + FEATHER_CHROMIUM_PATH

Date: 2026-06-04 14:08
Desk: browser
Phase: Phase 4 (Visual Desktop Shell) — pre-shell infrastructure sequence

## Context
Roi set me on autonomous work and went to sleep, asking for "tasks before phase 5 you
can run in parallel with blocks and won't need me deciding things." Chromium finished
installing mid-session (`148.0.7778.215`, Fedora updates), unblocking pre-shell #3.
This session folds in five prior-chat `next.md` sections (see below).

## Done (this session)
Four commits to `dev` (`e85ace2..8884e7a`), pushed; strict TDD throughout. All green:
**175 unit + 37 integration + 4 measurement; tsc clean.**

1. **Pre-shell #5 — observability (`46c946e`).** Wired `DebugCapture` into the session
   lifecycle. It was dead code and `LaunchSessionInput.debug` was accepted-but-ignored.
   - `manager.launch`: instantiate + `start()` when `input.debug` is set.
   - `manager.close`: `finalize()` before `context.close()` (best-effort; logs new
     `debug.capture.finalize.failed` event; never blocks close).
   - `FeatherSession`: holds the capture instance (mirrors `_childProcess`).
   - Tests: unit wiring (start-on-launch / stop-on-close / artifacts written / no
     tracing when debug absent) + real-Chromium e2e proving a valid `trace.zip` (PK
     magic bytes) and `network-summary.jsonl` land in the debug dir.
   - Closes the S2-deferred "Trace e2e + DebugCapture wiring" gap.

2. **Pre-shell #3 — `FEATHER_CHROMIUM_PATH` (`6e4f099`).** Override the CDP-attach
   binary to use the real system Chromium instead of bundled "Chrome for Testing".
   - `config.resolveChromiumExecutable(fallback)` — env override, trimmed, blank-ignored.
   - `manager.launch` resolves `executablePath` through it for `chromium-headed-cdp`.
   - Tests: config resolver (set/unset/blank); manager wiring (override reaches
     `spawnAndConnect`; falls back when unset); guarded real-Chromium probe proving the
     system build runs (CDP `browser.version()` == system `.215`, not bundled `.96`)
     with `navigator.webdriver === false`. Skips cleanly where no system Chromium.

3. **Storage-isolation tech-debt cleanups** (open threads from `next.md`):
   - `MeasurementRunner` routed through `FeatherPaths` (`5ba2fe8`); constructor accepts
     `FeatherDirs | string`; dropped dead `.feather/` strip; pinned `debugBundleSize > 0`.
   - api-flow dead `isAbsolute` ternary → explicit absolute-path contract assertion
     (`8884e7a`).

## Done (folded from next.md — prior chats, 2026-06-04)
- `/next` command designed + implemented (append-to-one-file context bridge; later
  extended to do a light tracker touch).
- Storage-isolation XDG fix shipped (`cbe939e..13101ff`).
- Attach-don't-launch: spec + plan written, then fully executed → `chromium-headed-cdp`
  (`spawnAndConnect` + CDP attach; `navigator.webdriver===false`; child killed on close);
  PR #1 (dev→master) opened, unmerged.
- Cookie-jar isolation fork + Phase-5 sequencing research note.

## Unfinished / blocked
- **Pre-shell #4 — warmed Google session.** Needs Roi's one-click Google login + the
  cookie-isolation spike must run first.
- Vault Spikes A/B — frozen, sudo-gated → Roi.
- Inbox: 5 open files (judgment calls; not auto-processed).
- PR #1 unmerged (policy: master only at a stable milestone).

## Next concrete action
**Roi wants to REVIEW this overnight work next session** (4 commits `e85ace2..8884e7a`
on `dev`) before continuing. After review: brainstorm the cookie-isolation spike, then
Roi does the Google login → pre-shell #4.

## Decisions
- Did #5 out of order — it didn't depend on #4.
- Instantiate `DebugCapture` only when `input.debug` is passed (least-surprising; makes
  the previously-ignored `debug` input actually do something; trace stays off by default,
  honoring the Spike-C secret-leak finding).
- System-binary probe asserts on CDP `browser.version()`, not `navigator.userAgent` —
  UA-Reduction freezes the build to `x.0.0.0` for both bundled and system.
- Deliberately did NOT auto-draft the cookie-isolation spike design doc — real
  architectural fork, benefits from Roi's framing, needs his login regardless.
- Journal trackers updated in working tree but left uncommitted during the run (matching
  `/next` discipline); this `/stop` commits them.

## Ideas
- Turn dead-code test branches into explicit contract assertions (applied to api-flow:
  the old `.feather/` strip became `expect(path.isAbsolute(...)).toBe(true)`).

## Verbatim Roi quotes
- "lets do it"
- "its downloading right now."
- "i want to set you on work and go to sleep are there tasks before phase 5 you can run
  in parallel with blocks and wont need me diciding things? or there is more brainstorming?"
- "okay"
- "i want to review this work next session"
