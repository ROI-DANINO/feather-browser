# Active — state owner (where we are, what's next)

This is the single owner of current state + next action. Task checklist → `journal/ops/tasks.md`;
destination → `ROADMAP.md`; history → `journal/log.md` + `ops/sessions/`.

## Now

**✅ HERO DEMO BUILT + VERIFIED WORKING LIVE (2026-06-06 18:33, `d1b5718`).** Roi: *"it works."* The
ChatGPT→Gmail cross-site script is real: `scripts/demo/hero-chatgpt-gmail.ts` drives the warmed
`primary` profile **headed** through ChatGPT (type `hello world` → send → `wait until:"stable"` on the
**last** answer → read the reply) → Gmail (compose a **draft** to Anthropic with that reply, **stops
before send**). Resilient fallback selectors (EN+HE Gmail labels), no screenshots/cookies in the repo,
browser kept open on failure. ChatGPT is warmed into `primary` (now holds Google/Gmail + ChatGPT in one
jar). Spec/plan `docs/specs|plans/2026-06-06-hero-demo-workflow*.md`. Gates: **212 unit (incl. 5 new
demo-helper tests) + `tsc --noEmit` 0**; committed + pushed (`origin/dev` in sync). ▶ **NEXT = the only
step left: record the live run (screen-capture while it drives the window) → final README touch-ups →
LinkedIn debut.** (Minor: recipient defaults to `support@anthropic.com`, overridable via `HERO_DEMO_TO`.)
Verified + journal-reconciled this session: `ops/sessions/hero-demo-verified-20260606-1854.md`.

**✅ HERO DEMO GATE CLOSED — Core input commands shipped on `dev` (2026-06-06 17:33).** Executed
`docs/plans/2026-06-06-core-input-commands.md` end-to-end (10 implementation commits
`cae8ef7`..`684396d`): `click`, `type` (`fill`/`sequential`), `press`, and `wait` are now exposed
through the HTTP API with Target locators, `at:"first"|"last"|n`, streaming-safe `wait until:"stable"`,
and coded errors (`ELEMENT_NOT_FOUND`/`ELEMENT_NOT_ACTIONABLE`/`WAIT_TIMEOUT`). Feather Core moved from
observe-only → **act**. Executed via **subagent-driven-development** (fresh implementer per task,
double-gated spec-then-quality reviews); Task 10 gate finished in a handed-off Codex session, then
**independently re-verified**: **207 unit pass, 43 integration pass** (real Chromium, incl. 6 new input
tests), **`tsc --noEmit` exit 0**, tree clean. **Pushed `origin/dev`** (`689db67..f4a0ec0`, in sync) —
no master merge (feature completion, not a milestone). Session: `ops/sessions/core-input-execution-20260606-1740.md`.
▶ **NEXT = warm a ChatGPT session** (agent-blind, Roi types creds), then **walk Roi through building +
recording** the headed ChatGPT→Gmail hero demo. The demo runs **headed** (`chromium-headed-cdp`) — visible
in real time, required (logged-in sessions + headless is bot-detectable) and ideal to screen-record.

**✅ PHASE 4a SHIPPED — Feather Core is publicly runnable & LIVE on the default branch (2026-06-05 stop).**
Executed `docs/plans/2026-06-05-core-first-reorientation.md` end-to-end via subagent-driven-development
(7 commits `8d42aab`..`16f5ab7`; pushed `387d601..16f5ab7`). GitHub default branch = `dev`, so the new
public README + demo are **live now** — no master merge needed for the debut. Shipped: ① verified
`examples/quickstart.sh` demo (full session loop ran green, 8/8 `state=closed`) + `examples/README.md`;
② artifact-forward `README.md` rewrite (fixed the `:3000` + `.feather/token` doc bugs; dropped an
unimplemented "screenshots" claim); ③ ROADMAP Core-vs-Shell split + Phase 4a/4b; ④ steering files →
4a; ⑤ final gate (**184 unit pass, tsc 0, demo re-verified green**). No `src/` feature changes — docs
+ one bash demo. Reviews double-gated every task (spec then quality); final holistic review = READY TO
SHIP, all 5 acceptance criteria MET. Blog `0009-the-demo-that-fact-checked-me.md` written. Session
record: `ops/sessions/core-first-execution-20260605-1853.md`.

**✅ `dev`→`master` MERGED (2026-06-06, PR #2 `5e808cd`).** Milestone graduation done — `origin/master`
is now at the Phase-4a tip; `origin/master..origin/dev` = **0** (fully in sync). Re-verified stable
before merging: **184 unit pass, tsc 0**, no `src/`/`tests/` changes since the last full integration
verification (37i + 4m green at `16f5ab7`) so that green still holds. Journal bridge notes committed to
`dev` first (`9c91f42`). Local `master` fast-forwarded to `origin/master`. This 37-commit graduation
carried: Phase 4a Core-readiness (README/demo/ROADMAP split/blog 0009) + post-merge tech-debt
(ozone-platform configurable, vitest ^2→^4 audit-0, Cookie-Mine loop closed, isolation/password-manager
hardening on `scratch`) + Anchor research (reference, no `src/`).

**▶ NEXT (Roi's call, 2026-06-06): build a HERO DEMO for the debut — a real cross-site agentic
workflow.** Roi: *"go to chatGPT and say hello world and send it, copy gpts respond, then go to gmail
and start a draft mail to anthropic with gpts answer as the respond."* Flow: ChatGPT → type "hello
world" → send → wait for + extract GPT's reply → Gmail → start a **draft** to Anthropic with that reply
as the body (draft, NOT send). **This replaces "just a screenshot" as the LinkedIn debut centerpiece.**

**⚠️ HONEST GATE (research-driven — verified this session, don't skip):**
1. **Core interaction commands are now present on `dev`** (`click`/`type`/`press`/`wait`), but the
   real hero flow still needs a warmed ChatGPT session and a site-specific demo script. Treat the
   demo as a recorded workflow, not a generic agent runtime.
2. **Both sites need login → Cookie Mine + headed stopgap.** `primary` already has a warmed Google
   session (Gmail ✓); **ChatGPT needs warming** (same agent-blind warm-session pattern — Roi types creds).
3. **This is a SECOND demo, not a replacement for `examples/quickstart.sh`.** Quickstart stays the
   *stranger-runnable* public artifact (no accounts); the cross-site flow is the **recorded hero demo**
   (GIF/asciinema/video) for the LinkedIn post. Decide explicitly next session.

Likely next-session shape: warm a ChatGPT session → write the headed cross-site demo script → record
for debut. Full prep: `ops/sessions/master-merge-and-hero-demo-vision-20260606-1620.md`.

**Then Phase 4b** (shell-stack joint call + GUI). Housekeeping available anytime: archive the processed
Anchor brief out of `journal/raw/_inbox/`; Anchor report §12's 5 open questions parked for Roi (none block).

**📎 Reference landed (2026-06-06, on `dev` `30cccb3`):** autonomous **Anchor Browser product-reference
research** → `research/2026-06-06-anchor-browser-product-reference.md` (+ SDK probe notes). Primary
sources + ground-truth inspection of shipped `anchorbrowser@0.16.3` (throwaway worktree, nothing run).
Net reads for later: Anchor's arch = **CDP-over-WebSocket + Playwright `connectOverCDP`** (same model as
our `spawnAndConnect`); its identity model (human-logs-in/agent-inherits) is a **direct Cookie-Mine
parallel**; "Web Action Cache"/"OmniConnect"/"Anchor Chromium" are marketing brands, stealth has no
documented mechanism, 12X/80X/23X are unverified. **Report §12 = 5 open questions for Roi** (defer; none
block). Research-only, no `src/` changes; does NOT alter the master-merge trajectory below.

**🧹 Housekeeping (2026-06-05 17:14 STOP, commit `43933fc`):** research inbox **fully processed →
empty** (positioning → `docs/public-positioning.md`; composio → memory; branching → **git-worktree
workflow now in AGENTS.md**; security-risks → absorbed). **New workflow rule:** unrelated workstreams
each get a branch in its own worktree, one chat per worktree (token/context efficiency); create
as-needed, not pre-created. Session file: `ops/sessions/inbox-processing-worktree-workflow-20260605-1714.md`.

**(History — superseded by the Core-first pivot, then by 4a shipping above.)** The shell-stack joint
call (review ADR-0009 GTK4+Casilda; run a Casilda+Chromium latency/input spike; then begin the Phase-4
GUI from `research/2026-06-05-phase4-gui-architecture-sketch.md`) is now **Phase 4b**, sequenced after
the master-merge + debut. The other two joint calls (cookie-isolation for `primary`; vault backend)
stay open/parked. Substantive state below is unchanged — pre-shell #1–6 all done; GUI is unblocked.

**🎯 AUTONOMOUS RESEARCH RUN COMPLETE (2026-06-05).** All 4 Ratchet workstreams landed on `dev`,
CI green (13 commits, `877d02a..2bbddca`; full record → `ops/sessions/autonomous-research-run-20260605.md`).
**Pre-shell #6 Cookie Mine loop is CLOSED → ADR-0007 gate cleared → the Visual Desktop Shell GUI is now
unblocked.** Net: ① ozone-platform configurable + the 2 headed tests un-gated (CI **36 passed + 1
skipped**, local Wayland 37); ② live `scratch` spikes (cookie-isolation, #6 loop, anti-detection); ③
warm-session password-manager hardening + vitest ^2→^4 (**audit now 0**); ④ shell-stack ADR-0009 +
GUI sketch + behavioral-fidelity design (parallel subagents). **`primary` was NEVER touched** (the
optional read-only closeout check was deliberately skipped given Roi's nervousness — zero primary
contact). Verification (local): **184 unit + 37 integration + 4 measurement green, typecheck 0, audit 0**.

**▶ NEXT = a joint session on the three teed-up calls** (executor must NOT decide alone):
1. **Shell-stack final pick** — ADR-0009 recommends **GTK4-native (Rust) + Casilda Wayland-compositor
   widget + headed-Chromium two-window stopgap**; Tauri stays a genuine trade. Gate acceptance on a
   **Casilda+Chromium latency/input spike** on this box. Then **start the Phase-4 GUI** (sketch ready:
   `research/2026-06-05-phase4-gui-architecture-sketch.md`).
2. **Cookie-isolation for the real `primary`** — proven safe on a *non-device-bound* session (scratch);
   does NOT transfer. **Measure `primary`'s DBSC binding read-only FIRST; never a blind clone.**
3. **Behavioral-profile / vault storage backend** — design ready (`docs/specs/2026-06-05-behavioral-fidelity-design.md`);
   backend ties to the frozen ADR-0008 vault. Recording is a you-in-the-loop wall.

Smaller open follow-up: the **Xvfb WebGL question** (does Xvfb fall back to SwiftShader?) needs a **sudo
Xvfb install → Roi** to finish the 3-way anti-detection table.

**(Prior milestone, still true)** `dev` → `master` graduated 2026-06-04 (PR #1 merged, `e39d167`); `dev`
remains the working branch and is now well ahead again with this run's work.

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

**▶ Phase 4a shipped (2026-06-05) AND graduated to `master` (2026-06-06, PR #2 `5e808cd`).** The
HERO DEMO's Core gate is now closed on `dev`: input + wait commands shipped and verified. **Immediate
next = warm a ChatGPT session** (Roi types creds, agent-blind), then write the headed cross-site demo
script → record → **LinkedIn debut** → then **Phase 4b** (shell-stack joint call + GUI). The pre-shell
sequence below is DONE; the GUI it unblocked is Phase 4b.

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
  rnd's dropped convention). **Inbox is now empty (README only)** — all 4 remaining notes processed
  2026-06-05: positioning → `docs/public-positioning.md`; composio → memory + ADR-0006; branching
  → worktree workflow in `AGENTS.md`; security-risks → already absorbed (ADR-0005/0008 + Parked list).
  (3 earlier notes archived 2026-06-04.)
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
