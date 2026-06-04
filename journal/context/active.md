# Active — state owner (where we are, what's next)

This is the single owner of current state + next action. Task checklist → `journal/ops/tasks.md`;
destination → `ROADMAP.md`; history → `journal/log.md` + `ops/sessions/`.

## Now

**🎯 MILESTONE: `dev` → `master` GRADUATED (2026-06-04 21:01 UTC).** PR #1 **MERGED** (merge commit
`e39d167`, by ROI-DANINO). `master` now carries the full stable set: Phase 3 + S1–S3 stabilization +
pre-shell infrastructure #1–5 + CI (GitHub Actions, green). Merge gated on green CI (175 unit + 35
integration + 2 Wayland-gated skips); prod-dep audit 0; tree clean. Merged as a **merge commit**
(history preserved, not squashed). `dev` stays the working branch (master is now 1 merge-commit ahead;
dev fully contained). **Next focus = the post-merge tech-debt queue (ozone-platform configurable →
un-gate the 2 tests; vitest 2→4), then pre-shell #6 (prove e2e Cookie Mine loop) → Visual Desktop
Shell GUI.** Details below + `context/next.md`.

**Pre-shell #4 (warmed Google session) is DONE and verified end-to-end (2026-06-04 23:07).**
`npm run warm-session` (`src/tools/warm-session.ts`) launches the `primary` persistent workspace in
stealth `chromium-headed-cdp` against system Chromium 148 (`/usr/bin/chromium-browser`). Roi logged
into real Google (**passkey/Face-ID new-device flow, NO bot-block/CAPTCHA**), Ctrl-C finalized,
**relaunch landed already logged in** (no password prompt). Both acceptance halves met: persistence
+ un-flagged. Agent-blind preserved (Roi typed creds; Feather never saw them). The Cookie Mine
foundation is **real now**, not just spiked. Pushed `dev` (`cbdeef9..b9528c4`).

**Pre-shell sequence status:** #1 storage-isolation ✅, #2 attach-don't-launch ✅ (PR #1), #3
`FEATHER_CHROMIUM_PATH` ✅, #4 warmed Google session ✅, #5 observability ✅. Only **#6** (prove the
end-to-end Cookie Mine loop on the headed stopgap) remains before GUI.

**▶ master merge-readiness — VERIFICATION PASS DONE GREEN (2026-06-04 23:24).** Roi's ask (*"make
sure feather is stabel enugh to push to master"*) is answered: **`dev` is a genuine stable
milestone.** Evidence (all fresh): unit **175/175**, integration (real Chromium) **37/37**,
measurement **4/4**, `tsc --noEmit` exit 0, `tsc` build exit 0, tree clean, `dev`==`origin/dev`.
Prod-dep audit **0 vulns** (the 5 audit findings are dev-only test tooling, never shipped). The
**111-commit** `master..dev` delta is linear, coherent, no half-finished work (+1637/−75; all maps to
S1–S3 + pre-shell #1–5). PR #1 OPEN · **MERGEABLE** · not draft; title already full-scope. **The
actual merge is HELD as Roi's milestone call** — not auto-merged. ▶ NEXT = Roi decides on PR #1; if
go, merge `dev`→`master`.

**CI ADDED (2026-06-04, commit `3863da9`) + it immediately earned its keep.** `.github/workflows/ci.yml`
runs the full suite on ubuntu/Node-22 (push to dev/master + PRs). The **first run went RED on
integration** — surfacing a real latent bug local runs hid: `spawnAndConnect` (`src/browser/modes.ts:44`)
**hardcodes `--ozone-platform=wayland`** + spawns headed, so the CDP-attach path only runs on a
Wayland desktop; on a display-less runner Chromium exits before exposing CDP. Fix taken (fast,
honest, Roi's "merge first, break later"): **env-gate the 2 headed tests** (`attach-cdp`,
`system-chromium`) on `WAYLAND_DISPLAY`, mirroring the existing skip pattern → CI shows **35 passed +
2 skipped**, local (Wayland) stays **37 passed**. Real fix = make ozone-platform configurable so they
run on CI/X11/headless — **tracked post-merge** in `tasks.md`. Docs corrected to match (README CI/test
lines now state the gating; no overstated "all-green-everywhere"). **Honest status: stable for merge
once the re-run CI is green** — not the unqualified "green everywhere" first claimed.

Remaining non-blocking caveat: dev-tooling vuln cleanup needs a breaking `vitest@4` bump (deferred).
Snapshot: `context/next.md`.

**Then (substantive, not next): cookie-isolation spike** — the Phase-4→5-seam experiment. Needs its
own **safe** design: two simultaneous live sessions from cloned cookies can look like session theft
→ could flag/invalidate the freshly warmed `primary` session. NEW signal: the login is **device-bound
(passkey)** so DBSC is live → copy-to-isolated is the real open question. Deserves a brainstorm, not
a blind run. Reasoning + procedure:
`research/2026-06-04-cookie-jar-isolation-and-phase5-sequencing.md`.

**Before any agent action (hardening):** `warm-session` must disable Chromium's built-in password
manager by policy — see Flags (credentials-in-the-jar boundary) + `tasks.md`.

## Recommend next

**Pre-shell infrastructure sequence (locked 2026-06-04) — MUST precede any Visual Desktop Shell GUI:**
1. ✅ **Storage-isolation fix — DONE** (XDG split shipped, pushed `dev`).
2. ✅ **Attach-don't-launch — DONE** (`chromium-headed-cdp`; `navigator.webdriver===false`; PR #1).
3. ✅ **`FEATHER_CHROMIUM_PATH` — DONE** (`6e4f099`; system-Chromium probe; testing banner gone).
4. ✅ **Warmed persistent Google session on disk — DONE (verified e2e 2026-06-04).**
   `npm run warm-session` → `primary` persistent workspace, stealth `chromium-headed-cdp`, system
   Chromium 148. Roi logged into real Google (passkey/Face-ID **new-device** flow, **no bot-block**),
   relaunch landed already logged in. Agent-blind preserved. Tool: `src/tools/warm-session.ts`.
   **Decided: warm first, spike as non-blocking follow-on.** ▶ **NEXT = cookie-isolation spike** —
   now with live DBSC (the login is device-bound via passkey), so copy-to-isolated-context is the
   real open question (`research/2026-06-04-cookie-jar-isolation-and-phase5-sequencing.md`).
5. ✅ **Observability sprint — DONE** (`46c946e`; `DebugCapture` wired; trace.zip e2e). Did out of
   order — it didn't depend on #4.
6. **Prove end-to-end Cookie Mine loop on the headed-Chromium stopgap (ADR-0007 gate)** — *then*
   design the GUI. The painted-in shell is the deferred end-state, not the next step.

**Banner note (cosmetic, not a blocker):** `--disable-blink-features=AutomationControlled` is
**load-bearing** — empirically, removing it flips `navigator.webdriver` back to `true` even on
system Chromium (CDP-driven pages report webdriver=true by default; the flag forces it false). It
triggers a visible "unsupported command-line flag" infobar, but that's **browser chrome — invisible
to websites**, so it does not threaten detection (Roi's Google login succeeded with it showing).
`--test-type` removes the banner and keeps `webdriver===false` (both probed) — deferred as optional
polish, not bolted on. Anti-detection in `modes.ts` stays minimal/spike-grade.

**Project milestone (vault):** **Spike A — SQLCipher** (then Spike B — KeePassXC). Both **sudo-gated
→ Roi**, and now explicitly **frozen** (architecture stands; not deleted). ADR-0008 stays 🚧
non-accepted until A/B clear. Full task list in `journal/ops/tasks.md`.

Evidence to keep honoring (research-driven, not arrogance-driven):
`research/2026-06-04-credentials-vault-spike-c-leakage-probe-findings.md` — traces leak off-screen
secrets (`fill()` arg + POST body → off-by-default policy, not redaction); `network-summary` records
URLs only, never POST bodies; password fields protect nothing at the data layer; screenshots leak
visually but are text-invisible → policy, not OCR. Design:
`docs/specs/2026-06-04-secret-leakage-harness-design.md`. Plan:
`docs/plans/2026-06-04-secret-leakage-harness.md`.

## Flags

- ADR-0008 is the first **non-accepted** ADR in `docs/specs/` — index marks it 🚧 CANDIDATE. Don't
  let any doc imply KeePassXC/SQLCipher are selected or the vault backend is locked.
- Anti-detection in `src/browser/modes.ts` is minimal/spike-grade: the one real measure is
  `--disable-blink-features=AutomationControlled` in `spawnAndConnect` — **load-bearing** (removing
  it flips `navigator.webdriver` to `true`). It paints a cosmetic "unsupported flag" infobar
  (invisible to sites). `--test-type` hides it without breaking webdriver===false (deferred polish).
- **Credentials-in-the-jar boundary (NEW 2026-06-04):** the warm `primary` profile must **never use
  Chromium's built-in password manager** — raw creds belong in Proton Pass now / Feather vault later,
  separate from the shared jar. Chrome saved a few during the #4 login (cleared via
  `chrome://password-manager`; UI disable toggle not found → enforce by policy). Dormant in Phase 4;
  hard deadline = first agent action. Hardening task in `tasks.md`; detail in ADR-0008 corollary.
- Shell stack is **active R&D** — don't let any doc imply it's locked (ADR-0007).
- Inbox lifecycle is live: promoted/superseded notes → `journal/raw/archive/` (NOT `_processed/`,
  rnd's dropped convention). Inbox holds 2 genuinely-open files (branching-strategy gate +
  browser-agent-security-risks); 3 promoted notes archived 2026-06-04.
- `rnd` branch deleted (ADR-0006 graduated; now a standing design lens on `dev`). `ui-playground`
  KEPT as stealth/attach-don't-launch reference.
- **`.remember` plugin DISABLED + CLEANED for this project** (2026-06-04) → journal is the **sole**
  history engine. Disabled via `.claude/settings.local.json` flag (kept; not uninstalled globally).
  The `.remember/` data dir + tracked `remember.md` are **deleted**, and the vestigial "write
  `.remember/remember.md`" step is **removed from both `/stop` ritual files**. Built-in `MEMORY.md`
  auto-memory is separate and unaffected. Reversible (flip flag to `true`). Historical `.remember`
  mentions across journal/docs left intact (audit trail).

## Parked (Phase 5; frame as user-authorized continuity, NOT "stealth/bypass")

- **Sensitive-session flag + no-trace policy; mediated late credential release** (trace/screenshot
  mitigation deferred from Spike C).
- **Learned behavioral fidelity** — agent acts with Roi's mouse/typing signature.
- **Observe-to-learn** — agent sees Roi's screen on request → understand context; learn workflows.
- **Detection self-emulation** — model sites' bot-ID techniques to find weak spots (defensive).
- **Agent perception layer** — `research/2026-06-03-phase-5-agent-perception-layer-notes.md`.
- Details: `journal/raw/archive/2026-06-04-session-insights-behavioral-fidelity-security.md`.

## Done — see `journal/ops/tasks.md` (current-phase checklist) and `journal/log.md` + `ops/sessions/` (history).
