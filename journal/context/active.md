# Active — state owner (where we are, what's next)

This is the single owner of current state + next action. Task checklist → `journal/ops/tasks.md`;
destination → `ROADMAP.md`; history → `journal/log.md` + `ops/sessions/`.

## Now

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

**Storage-isolation fix (Task #1) is spec'd + planned, NOT yet built.** Spec:
`docs/specs/2026-06-04-storage-isolation-xdg-design.md` (`5f8f4e7`). Plan:
`docs/plans/2026-06-04-storage-isolation-xdg.md` (`0fa0b8a`) — 5 TDD tasks. Decision: **full XDG
split** (profiles/vault→DATA, logs/debug/measurements→STATE, disposable→CACHE, token/endpoint→RUNTIME,
runtime falls back to STATE not workspace); `FeatherPaths`/`ensureDirs` accept `FeatherDirs | string`
so the 14 single-root test files stay untouched. **NEXT SESSION: execute this plan** (pick
subagent-driven vs inline — that choice was open at `/stop`).

## Recommend next

**Pre-shell infrastructure sequence (locked 2026-06-04) — MUST precede any Visual Desktop Shell GUI:**
1. **Storage-isolation fix (CRITICAL — currently violated): ▶ READY TO EXECUTE** — spec'd + planned
   (`docs/plans/2026-06-04-storage-isolation-xdg.md`). `src/config.ts` still defaults `featherDir` to
   repo-relative `.feather` (not gitignored). Plan relocates to the XDG split + gitignores `.feather/`.
   (Enforces the Agent-Blind Vault boundary.) **This is the immediate next action.**
2. **Productionize attach-don't-launch** into `src/browser/modes.ts` (no anti-detection yet) +
   `FEATHER_CHROMIUM_PATH` (sudo `dnf install chromium`).
3. **Warmed persistent Google session on disk** — long-running primary authenticated context
   (Cookie Mine foundation); single-click Google Auth, agent blind, Feather injects under the hood.
4. **Observability sprint** — wire `DebugCapture` (dead code).
5. **Prove end-to-end Cookie Mine loop on the headed-Chromium stopgap (ADR-0007 gate)** — *then*
   design the GUI. The painted-in shell is the deferred end-state, not the next step.

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
- Anti-detection is **spike-only**; `src/browser/modes.ts` has none yet.
- Shell stack is **active R&D** — don't let any doc imply it's locked (ADR-0007).
- Inbox lifecycle is live: promoted/superseded notes → `journal/raw/archive/` (NOT `_processed/`,
  rnd's dropped convention). Inbox holds 6 genuinely-open files.
- `rnd` branch deleted (ADR-0006 graduated; now a standing design lens on `dev`). `ui-playground`
  KEPT as stealth/attach-don't-launch reference.
- **`.remember` plugin DISABLED for this project** (`.claude/settings.local.json`, 2026-06-04) →
  journal is the **sole** history engine. No SessionStart `.remember` injection, no PostToolUse
  auto-extraction/consolidation; `/stop` (this file + `log.md`) is the sole handoff writer. Built-in
  `MEMORY.md` auto-memory is separate and unaffected. Reversible (flip to `true`). NOTE: `/stop`
  step 11 (write `.remember/remember.md`) is now **vestigial** — drop it next ritual edit.

## Parked (Phase 5; frame as user-authorized continuity, NOT "stealth/bypass")

- **Sensitive-session flag + no-trace policy; mediated late credential release** (trace/screenshot
  mitigation deferred from Spike C).
- **Learned behavioral fidelity** — agent acts with Roi's mouse/typing signature.
- **Observe-to-learn** — agent sees Roi's screen on request → understand context; learn workflows.
- **Detection self-emulation** — model sites' bot-ID techniques to find weak spots (defensive).
- **Agent perception layer** — `research/2026-06-03-phase-5-agent-perception-layer-notes.md`.
- Details: `journal/raw/_inbox/2026-06-04-session-insights-behavioral-fidelity-security.md`.

## Done — see `journal/ops/tasks.md` (current-phase checklist) and `journal/log.md` + `ops/sessions/` (history).
