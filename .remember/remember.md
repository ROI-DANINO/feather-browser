# Next Session — Feather Browser

Branch: `dev` (= `origin/dev`; 6 commits pushed this session). Tests last green: 137 unit + 33
integration. Phase 4 Step 0 done (ADR-0007). Last session was ops-only (organize-housekeeping).

## Start here (recommended)

**Credentials-vault ADR candidate.** Promote the open inbox intake
`journal/raw/_inbox/2026-06-04-security-research-credentials-vault.md` into a **non-accepted**
`CredentialsVault` ADR candidate in `docs/specs/`:
- Narrow vault interface (Feather is NOT a password manager).
- First candidates: **KeePassXC** (external manager) + **SQLCipher** (encrypted storage) — NOT
  final selections.
- Scope 3 spikes: leakage harness, KeePassXC integration, SQLCipher feasibility.
- Keep explicitly **non-accepted** until spikes done. Prior session attempted this and was
  blocked — try again.
- After it lands, the inbox file becomes archive-eligible → `git mv` to `journal/raw/archive/`.

## What changed last session (context, not tasks)

- **Inbox lifecycle is live:** promoted/superseded notes move to `journal/raw/archive/` (this is
  the convention — NOT `_processed/`, which was `rnd`'s competing idea, now dropped). `/start`'s
  inbox count is meaningful again (7 open files).
- **`rnd` graduated + deleted.** ADR-0006 (agent-interface-neutrality) is now on `dev`. Stale
  branches tmp-check/copilot-dev also deleted. `ui-playground` KEPT (stealth/headed-launcher
  reference for the future attach-don't-launch productionization — do NOT delete).
- Canonical docs reconciled (specs index, README, PROGRESS all now say Step 0 done).

## Don't

- Don't run sudo (FEATHER_CHROMIUM_PATH needs `dnf install chromium` — hand that to Roi).
- Don't imply KeePassXC/SQLCipher are selected, or that the shell stack is locked.
- Don't implement credentials handling before leakage checks exist.
- Frame agent continuity as user-authorized, never stealth/bypass.
