# Session Handoff — Security Research: Credentials Vault

Date: 2026-06-04
Branch: `dev`

## Summary

This session resumed Feather with `/start`, then began the highest-priority security research track for the future Phase 5 credentials vault.

The main output was a single research intake file:

- `journal/raw/_inbox/2026-06-04-security-research-credentials-vault.md`

Commit for the research intake:

- `adfcb2f81d3bf410b527e87c9726bf2a27d9764e`

## Completed

- Ran the `/start` flow and loaded current state.
- Confirmed the next track from `journal/ops/tasks.md`: credentials-vault security research.
- Read the relevant prior intake:
  - `journal/raw/_inbox/2026-06-04-session-insights-behavioral-fidelity-security.md`
- Discussed the security direction with Roi in short form.
- Decided to keep exactly one research file in `journal/raw/_inbox/` for now.
- Wrote the research intake file:
  - `journal/raw/_inbox/2026-06-04-security-research-credentials-vault.md`

## Research conclusions captured

The research intake recommends:

- Feather should **not** become a full password manager.
- Feather should define a narrow `CredentialsVault` interface.
- First external-manager candidate: **KeePassXC**.
- First internal encrypted-storage candidate: **SQLCipher**.
- Bitwarden, Proton Pass, and 1Password are useful security-model references but not first implementation dependencies.
- No real credentials workflow should ship before secret-leakage checks exist.

## Attempted but not completed

Tried to create an ADR candidate at:

- `docs/specs/2026-06-04-credentials-vault-adr-candidate.md`

The file was **not created**. A later fetch confirmed it does not exist.

Reason: the first attempt was blocked by safety checks; the session then switched to `/stop` before a successful write.

## Blog check

No blog entry created.

Reason: no phase completed and no accepted ADR/major decision landed. This session produced research intake only.

## Next session focus

Recommended next focus:

1. Create a short ADR candidate / mini-spec from the research intake.
2. Keep it explicitly non-accepted until spikes are done.
3. Define the three follow-up spikes:
   - leakage harness design
   - KeePassXC integration
   - SQLCipher feasibility

## Flags

- The credentials-vault direction is research, not an accepted architecture decision yet.
- Do not imply Feather has selected SQLCipher or KeePassXC as final architecture.
- Do not implement credentials handling before defining leakage checks.
- Keep framing as secure user-approved continuity, not stealth or bypass.
