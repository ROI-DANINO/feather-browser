# Next — Context Bridge

_Empty buffer. The last bundle (5 entries, 2026-06-10 12:48 → 2026-06-11: suite run → M1/H3
redesigns → agent-driven showcase + C4C comparison → rerun blockers cleared → Fable workflow
queued) was consumed at the 2026-06-11 ~14:30 `/stop` (fable-workflow-v1-acquittal) and archived
to `journal/archive/next/2026-06-11/1430-stop-bundle-fable-workflow.md`. Current state lives in
`journal/context/active.md`._

<!-- Append `/next` bridge entries below this line when moving between work sessions mid-thread. -->

---
## 2026-06-11 17:05 — Gate A: ADR-0010 accepted + A0 transport hardening shipped; A1 next

### Session pointer
- Roadmap/session pointer: Phase 5.0.0 (Gate A), `journal/ops/tasks.md` §5.0.0; ADR-0010 (ACCEPTED).

### Summary
- Took Gate A from proposal → accepted model → shipped first slice. ADR-0010 ACCEPTED; Gate A split
  into **A0 (transport hardening — DONE)** + **A1 (capability system — NEXT)**.

### Completed
- **#3 merged** — ADR-0010 flipped to ACCEPTED (4 open Qs resolved + revoke-teeth decision) + new
  `docs/specs/2026-06-11-gate-a-capability-system-design.md`.
- **#4 merged** — `docs/specs/2026-06-11-a0-transport-hardening-plan.md` (plan-only).
- **#5 merged (CI green)** — A0 code: global `createOriginHostGuard` onRequest hook in
  `src/transport/middleware.ts`, wired in `http.ts`. `FORBIDDEN_HOST` (loopback-only Host, kills
  rebind) + `FORBIDDEN_ORIGIN` (cross-origin Origin/Referer on unsafe methods, kills CSRF). 14 unit
  + 6 integration tests; `docs/api-reference.md` updated; port/Referer rationale in code comments.
- **Task 0 verified**: `/resume` is same-origin (pause banner is CDP-polled DOM flag, no network) →
  **R1** chosen; stale `http.ts:31-33` comment corrected.

### User decisions / quotes
- Decision: ADR-0010 resolutions — Q1 opaque single-use nonce + grant registry; Q2 local approval
  page (MFA pattern); Q3 ship A0 ahead; Q4 audit on bus **and** durable append-only log; revoke
  **tears down in-flight ops** via a hold that owns the live resource ("Lock Option A").
- Decision: A0 port handling stays lenient-when-absent; Referer stays Origin-fallback (both confirmed
  safe; rationale captured in comments per request).
- Quote: "we will work on a1"
- Quote: "please delete the merged remote branches to keep the repo clean."

### Agent decisions / assumptions / rationale
- A0 enforces Origin only on unsafe methods (POST/PUT/PATCH/DELETE), not GET — so cross-origin GET
  navigation to the resume link isn't broken. Standard CSRF pattern.
- Merged #5 on strength of run-1 green + comments-only delta + local unit re-run; the re-run also
  confirmed green (17:02:59).

### Files read or touched
- Touched (merged to dev): `docs/specs/adr-0010-...md`, `docs/specs/2026-06-11-gate-a-...md`,
  `docs/specs/2026-06-11-a0-transport-hardening-plan.md`, `src/transport/middleware.ts`,
  `src/transport/http.ts`, `docs/api-reference.md`, `tests/unit/transport/origin-host-guard.test.ts`,
  `tests/integration/origin-host-hardening.integration.test.ts`.
- Read (for A0): `src/transport/{routes,sse,resume-page,server-info}.ts`,
  `src/commands/await-human.ts`, `src/browser/pause-banner.ts`.

### Open threads / unresolved questions
- **Merged remote branches NOT deleted** — git proxy blocks ref deletion (HTTP 403) and no GitHub MCP
  delete-branch tool exists. Branches still on origin: `claude/session-branch-work-leu1oj`,
  `claude/a0-transport-hardening-plan`, `claude/a0-transport-hardening-code`,
  `claude/last-15-commits-8aizhv`. Needs GitHub UI or a relaxed network policy.

### Next action
- Start **A1** with a plan-first pass (same cadence as A0): write the A1 implementation plan
  (tiers + session-hold primitive + capability-grant registry + dangerous-mode policy + dual audit)
  per ADR-0010 §1,2,4,5 and the Gate A design doc. Plan-only first; get approval before code.

### Next session should read
- `docs/specs/adr-0010-local-control-plane-capability-model.md` (the accepted model)
- `docs/specs/2026-06-11-gate-a-capability-system-design.md` (A0/A1 seams)
- `src/transport/middleware.ts` (the A0 guard, the pattern A1 extends)

### Risks / blockers
- A1 touches core session/profile/security — heavily-reviewed, short-lived per AGENTS.md domain-risk
  note. No pre-committed cross-module TS interfaces (ADR-0010 scope): hold + grant are seams.
