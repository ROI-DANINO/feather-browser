# Active — state owner (where we are, what's next)

This is the single owner of current state + next action. Task checklist → `journal/ops/tasks.md`;
destination → `ROADMAP.md`; history → `journal/log.md` + `ops/sessions/`.

## Now

**Uncommitted tree (2026-06-04 21:56):** ritual/cleanup detour this session left changes staged-ish
but **not committed** — `.remember` plugin clean (dir + tracked file deleted; `/stop` step removed)
+ `/start` desk-context timing fix. Commit on `dev`, then resume review-first. Detail: `next.md`.

Phase 4 Step 0 is done (Cookie Mine proven; ADR-0007). The **`CredentialsVault` ADR candidate
landed** as `docs/specs/adr-0008-credentials-vault.md` (🚧 non-accepted). **Spike C (secret-leakage
harness) is shipped** on `dev`: `assertNoSecretLeak`, a real-Chromium gate, and the clean-tier URL
redaction fix (`TAB_UPDATED` + `network-summary`). ADR-0008 stays **non-accepted** until Spikes A/B
clear.

**Token Diet complete** (2026-06-04): Step 1 (`.remember` plugin lobotomy) + Step 2 (ROADMAP
collapse). Projected hot auto-load **~5,037 → ~3,635 tok**. **Verified 2026-06-04**: the
`=== HANDOFF/REMEMBER/MEMORY ===` SessionStart block is gone. Config was correct all along;
plugin hooks load at CC launch, so the disable only took effect after a **full Claude Code restart**
(not `/clear`).

**Pre-shell #1 (storage-isolation) and #2 (attach-don't-launch) are DONE and pushed to `dev`.**
Storage: XDG split shipped + `.feather/` gitignored (`cbe939e..13101ff`). Attach-don't-launch: new
`chromium-headed-cdp` mode (`spawnAndConnect()` + `connectOverCDP`; `navigator.webdriver === false`;
child process killed on close) — 167 unit + 35 integration green; **PR #1 opened (dev→master,
unmerged — not a stable milestone yet)**.

**Overnight autonomous run (2026-06-04, while Roi slept):** chromium got installed
(`148.0.7778.215`), unblocking the decision-free queue. Shipped + pushed `dev` (4 commits,
`e85ace2..8884e7a`; 175u+37i+4m green, tsc clean):
- **Pre-shell #5 observability** (`46c946e`) — `DebugCapture` wired into launch/close; `input.debug`
  was accepted-but-ignored, now drives capture; real-Chromium e2e proves a valid `trace.zip`.
- **Pre-shell #3 `FEATHER_CHROMIUM_PATH`** (`6e4f099`) — `resolveChromiumExecutable()`; guarded probe
  proves the system build runs (CDP version `.215`, not bundled `.96`) with `webdriver===false`.
- **Two storage-isolation tech-debt cleanups** (`5ba2fe8`, `8884e7a`) — `MeasurementRunner` →
  `FeatherPaths`; api-flow dead `.feather` strip → absolute-path contract assertion.

**NEXT SESSION = REVIEW FIRST (Roi's explicit ask).** Review the overnight autonomous work — 4
commits `e85ace2..8884e7a` on `dev` (DebugCapture wiring `46c946e`, FEATHER_CHROMIUM_PATH `6e4f099`,
2 cleanups `5ba2fe8`/`8884e7a`) — before continuing. Nothing merged to master; PR #1 still unmerged.

**Then (substantive): pre-shell #4 — warmed Google session.** Needs Roi (one-click Google login) +
**run the cookie-isolation spike first** (procedure in
`research/2026-06-04-cookie-jar-isolation-and-phase5-sequencing.md` → "Queued action"). The spike
design doc was intentionally NOT auto-drafted (real fork + needs Roi's framing/login) — quick
brainstorm pending.

**New design thread (2026-06-04, not a decision):** the shared cookie jar means agent activity can
**poison the human's trust context**; whether to isolate the agent's context is a real **fork**
decided by a spike (does copied Google auth survive DBSC device-binding?). Phase 4 is human-only so
the risk is **dormant** — the gate is the **first agent action in the real warm jar**. Run the
**cookie-isolation spike before pre-shell #4 (warmed Google session)**. Full reasoning:
`research/2026-06-04-cookie-jar-isolation-and-phase5-sequencing.md`.

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
