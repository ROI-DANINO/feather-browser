# Session — Warm Google Session (pre-shell #4) + credentials boundary

**Date:** 2026-06-04 23:07
**Desk:** browser
**Phase:** Phase 4 (Visual Desktop Shell) — pre-shell infrastructure sequence
**Branch:** dev (pushed `cbdeef9..b9528c4`)

## Done this session
(Includes prior-chat context folded from `journal/context/next.md` 2026-06-04 21:56.)

- **Committed the prior-chat ritual/cleanup work** (was uncommitted in `next.md`): `.remember`
  plugin clean + `/start` desk-context timing fix → landed as `cbdeef9` before this session.
- **Processed the inbox.** Archived 3 promoted notes (`git mv` → `journal/raw/archive/`):
  chromium-executablePath spike (answered by pre-shell #3), session-insights-behavioral-fidelity
  (in active.md Parked + roadmap North Star + memory), mcp-playwright research (in roadmap-future).
  Kept 2 genuinely-open: branching-strategy gate, browser-agent-security-risks. Fixed active.md
  pointers + inbox count. Verified along the way: ADR-0006 is "Agent-Facing Interface Neutrality"
  (not branching); the stray `tmp-check` branch is already gone. (`c3323e3`)
- **Reviewed the overnight commits `e85ace2..8884e7a`** (Roi's review-first ask). Read all 4 diffs
  + surrounding code; re-ran suites (175u + 37i green, tsc clean); confirmed the three real-Chromium
  proofs (trace.zip e2e, system-Chromium probe, CDP anti-detection gate). **Verdict: approve.**
  Found 2 minor non-blocking issues → `DebugCapture.recordCommand()` has no caller (commands.jsonl
  always empty); `finalize()` can drop an in-flight network request. Tech-debt note placed under the
  Phase-5 Anti-Bot Self-Detection North Star (its natural future consumer). (`00b9501`)
- **Built + verified pre-shell #4 — warmed Google session.** New `npm run warm-session`
  (`src/tools/warm-session.ts`): launches the named `primary` persistent workspace in stealth
  `chromium-headed-cdp` against **system Chromium** (resolves `/usr/bin/chromium-browser` etc.;
  `FEATHER_CHROMIUM_PATH` overrides; env overrides `FEATHER_WARM_WORKSPACE`/`FEATHER_WARM_URL` for
  testing). Human logs in; profile persists session on disk; Ctrl-C/window-close finalizes cleanly
  (force-close, lock released, child killed); stale locks self-heal via `ProfileLock`. Smoke-tested
  isolated (temp `FEATHER_DIR` + example.com, never touched real `primary`). (`1195c58`)
  - **Verified end-to-end with Roi:** real Google login via **passkey/Face-ID new-device flow** —
    **NO bot-block/CAPTCHA** — then Ctrl-C, relaunch landed **already logged in, no password prompt**.
    Both acceptance halves met: persistence + un-flagged. Agent-blind preserved (Roi typed creds).
- **Investigated the AutomationControlled banner** (Roi flagged the yellow "unsupported
  command-line flag" infobar). Probed empirically: the flag `--disable-blink-features=
  AutomationControlled` is **load-bearing** — removing it flips `navigator.webdriver` back to `true`
  even on system Chromium (CDP-driven pages report webdriver=true by default). The banner is
  **cosmetic / invisible to websites** (browser chrome), so it does not threaten detection.
  `--test-type` removes it and keeps webdriver===false (both probed) → deferred as optional polish.
- **Caught the credentials-in-the-jar boundary.** Chromium's built-in password manager offered to
  save the warm login's passwords into the `primary` profile; Roi saved a few (then cleared via
  `chrome://password-manager`; the in-UI disable toggle wasn't found). Recorded the principle —
  **the warm/Cookie-Mine profile must NEVER use Chrome's built-in password manager** — in ADR-0008
  ("Real-world corollary"), a tasks.md hardening item, an active.md flag, and the security memory.
  Also corrected two stale facts in the memory (storage-isolation now resolved; archived
  session-insights path). (`b9528c4`)
- **Pushed `dev`** (`cbdeef9..b9528c4`).

## Left unfinished / open threads
- **Master merge-readiness** (Roi's stated next focus) — `dev` is **110 commits ahead of master**;
  PR #1 (dev→master) is OPEN. Need a stabilization pass to decide if this is a stable milestone.
- **Cookie-isolation spike** — next substantive Phase-4→5-seam task; needs **safe design** (two live
  sessions from cloned cookies can look like session theft → could flag/invalidate the freshly warmed
  `primary` session). DBSC now live (passkey login) makes copy-to-isolated the real open question.
  Deserves its own brainstorm.
- **warm-session pwd-mgr-disable hardening** — must land before any agent action.
- **`--test-type` banner cleanup** — optional cosmetic polish.
- **2 open inbox files** — branching-strategy gate (needs Roi's answers), browser-agent-security-risks.
- **Pre-shell #6** (prove end-to-end Cookie Mine loop on the stopgap) — then GUI.

## Next concrete action
**Master merge-readiness review.** Full verification pass (unit + integration + measurement + tsc),
review the 110-commit `dev`-vs-`master` delta, confirm clean state, then decide whether to merge
PR #1 (graduate `dev` → `master` as a stable milestone).

## Decisions
- **Sequencing (locked):** warm the real session first; cookie-isolation spike is a non-blocking
  follow-on — safe because no agent acts in Phase 4 (the poisoning gate is the first agent action).
- **Credentials never in the shared jar:** the warm/Cookie-Mine profile must never use Chrome's
  built-in password manager. Creds → Proton Pass now / Feather vault (ADR-0008) later, always
  separate from the profile agents piggyback on.
- **AutomationControlled flag stays** (load-bearing); banner is cosmetic; `--test-type` deferred.
- **warm-session defaults to system Chromium** (RPM `/usr/bin/chromium-browser`).
- Reviewed overnight work is sound → no rework needed.

## Ideas
- `warm-session` could enforce pwd-mgr-disable via Chrome policy (`credentials_enable_service=false`
  / `PasswordManagerEnabled`) so creds can't accumulate in the jar by accident.
- The passkey/device-bound login makes the cookie-isolation spike's DBSC question concrete — good
  real data for that experiment.

## Verbatim Roi quotes
- "i thik we already proved the mechanizm work in the hello world test so lets start warming up for me"
- "we are in again!!"
- "does that save in our password manger? or in chromume"
- "i already saved before i read your answer, did it for my proton password manger as well and to my meta account.."
- "i want to make sure feather is stabel enugh to push to master"
