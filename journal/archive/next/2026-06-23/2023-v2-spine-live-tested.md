# Archived /next buffer — consumed at the 2026-06-23 20:23 /stop ("Stealth Arc + the Behavior Mine")

> Single pending entry (2026-06-23 ~16:20), written via `/rdw-next` after the 09:10 /stop and folded
> into the 20:23 /stop as prior-chat context. Original content below, verbatim.

---
## 2026-06-23 ~16:20 — v2 spine live-tested end-to-end (5b bug found+fixed live)

### Session pointer
- Phase/plan pointer: Phase 4a; `phase.md` sub_phase = v2-safety-spine-PROVEN-LIVE-PASS (now also 5b typed-code PROVEN LIVE). v2 wrapped.

### Summary
- Fixed Finding #1 (identityId→LaunchSchema), ran the spine live test, then live-tested the 5b typed-code inject → found+fixed a real bug → v2 now FULLY proven live.

### Completed
- **Finding #1 fixed** (`4c75a1e`): `identityId` wired into `LaunchSchema`+`LaunchInput`; launch-by-identity reachable from API (was an original 5a gap, NOT the ponytail audit).
- **Spine live test:** Run A GitHub = PARTIAL (no wall); Run B Instagram = PASS (brake + await-human handoff held through password + 2 CAPTCHAs + email-link across 2 tabs; logged in as `roionly9`).
- **5b typed-code (Run C):** drove the inject live (no real wall — `mfa/challenge` at a Wikipedia search box) → **real bug:** `resolveChallenge` typed the code while its own MFA pause was active → braked its own injection (`HUMAN_IN_CONTROL`). **Fixed (TDD):** `TypeInput.allowDuringHumanControl` (internal-only) + `type.ts` honors it + manager sets it; regression test w/ REAL pause registry (red→green). Re-ran live → `123456` injected, resolved, brake released. (`a08f4e7`)
- Gates: typecheck clean, 438u (+1), MFA integration 5/5. All pushed `origin/dev` (`a08f4e7`).
- Captured Roi's notes → `research/2026-06-23-agent-speed-perception-toolbox-intake.md` (deferred).

### User decisions / quotes
- Quote: "i think it couns as a pass no?" → confirmed PASS for the safety spine.
- Quote: "we don't really need wire to Telegram. We can do it in a different tab. Just open a fresh tab. I paste digits, and we go on" → drove the 5b inject test this way; Telegram confirmed optional.
- Decision (earlier): password recovered from git history to unblock IG login — accepted as a throwaway ("it's okay for this one"); the "agent never holds the secret" property = deferred vault gap.
- Decision: speed/perception/toolbox work deferred ("after the stealth thing… whenever").

### Agent decisions / assumptions / rationale
- 5b fix kept the agent frozen through the WHOLE resolution (bypass flag on the single sanctioned type) rather than un-pausing-then-typing, so no mid-resolution race; flag is absent from the Zod TypeSchema so it's unreachable externally.
- Used Wikipedia `#searchInput` as a stable real-origin target to exercise the inject mechanism without needing a real MFA wall.

### Files read or touched
- Touched: `src/transport/routes.ts`, `src/commands/launch.ts`, `src/sessions/types.ts`, `src/commands/type.ts`, `src/mfa/manager.ts`
- Touched (tests): `tests/unit/transport/launch-schema.test.ts`, `tests/integration/identity.integration.test.ts` (reverted), `tests/unit/mfa/manager.test.ts`
- Touched (docs/journal): `docs/v2_wrap/spine-live-test/run-report.md` (+2 screenshots), `research/2026-06-23-agent-speed-perception-toolbox-intake.md`, `journal/context/active.md`, `journal/ops/tasks.md`, `journal/ops/phase.md`, `journal/ops/run-notes.md`, `journal/log.md`

### Open threads / unresolved questions
- 5b "agent never holds the secret" property still relies on a future credential-vault (out-of-band password). Vault work deferred.
- Speed/perception/toolbox ideas captured but not built.

### Next action
- Pick the next thread: **5d Stealth** · **Phase 2 warmed step-up** · **4b visual shell**. (v2 is fully proven live; nothing blocks.)

### Next session should read
- `journal/context/active.md` (NOW pointer), `docs/v2_wrap/spine-live-test/run-report.md`, `research/2026-06-23-agent-speed-perception-toolbox-intake.md`

### Risks / blockers
- none (all gates green, pushed, clean teardown).
