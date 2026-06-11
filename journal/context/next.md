# Next — Context Bridge

_Empty buffer. The last bundle (5 entries, 2026-06-10 12:48 → 2026-06-11: suite run → M1/H3
redesigns → agent-driven showcase + C4C comparison → rerun blockers cleared → Fable workflow
queued) was consumed at the 2026-06-11 ~14:30 `/stop` (fable-workflow-v1-acquittal) and archived
to `journal/archive/next/2026-06-11/1430-stop-bundle-fable-workflow.md`. Current state lives in
`journal/context/active.md`._

<!-- Append `/next` bridge entries below this line when moving between work sessions mid-thread. -->

---
## 2026-06-11 14:24 — v1 finale blogged; next session = brainstorm v2 Gate A

### Session pointer
- Roadmap/session pointer: Phase 4a / Feather v1 wrap COMPLETE. Next = **v2 Gate A planning/brainstorm** (Session 5.0.0, ADR-0010). v1 wrap is acquitted (see `docs/v1_wrap/META-ANALYSIS.md`), gap-fixes shipped (`60ef4fd..235ebbb`), and now the blog finale is written.

### Summary
- This session bridges the v1-wrap close and the Gate A brainstorm. The only *work* was the `/blog` v1 finale (last owed item before Gate A) plus a deep read of the C4C-vs-Feather comparison + meta-analysis to answer Roi's "can I feel good about v1 / should I start Gate A?" question.
- Verdict delivered: **yes feel good; yes start Gate A — nothing holds it up.** The v2 security spine is unchanged by the v1-wrap analysis; the ★ v1-core fixes that *preceded* Gate A are all landed + green; remaining v1 leftovers are small (◇ defer-with-reason). Caveat per AGENTS.md: Gate A = **planning/reconciliation pass first, not implementation**.

### Completed
- Answered (grounded in docs, not commit msgs) what the C4C-vs-Feather back-to-back experiment gave us: equal-capability wash on the 8/8 shared errands; the two non-PASSes were environmental (M2 transient/cause-undetermined; H3 harness-side death) + one humble real bug (headed-CDP viewport). The experiment's real deliverable = it corrected its own dramatic first read (META-ANALYSIS wins over the 06-10 COMPARISON/CAPABILITY docs where they disagree).
- `/blog` finale shipped as **two** entries (Roi picked "Finale + separate 06-10 entry"):
  - `blog/0019-the-reviews-that-caught-me-lying.md` (2026-06-10) — folds the 06-10 trio (observe-bug-fixes vacuous-tests catch + iframe-dismiss one-line shrink + native-capabilities parked-behind-gate) into one testing/measurement/roadmap-honesty arc.
  - `blog/0020-feather-on-trial.md` (2026-06-11) — the Fable forensics finale (socket-death + IG-like reversals, the viewport bug, the M2 overclaim caught by the adversarial reviewer, the security hole caught in the fix pre-push).
- Updated `blog/README.md` index (rows 0019, 0020); cleared all 4 owed lines from `blog/_pending.md` (Owed now empty).
- **Committed + pushed** as `af83a65` on branch `claude/last-15-commits-8aizhv` (NOTE: task-harness branch, NOT `dev` — see Risks).

### User decisions / quotes
- Decision: blog scope = **"Finale + separate 06-10 entry"** (2 entries, not 1 folded, not 4 separate).
- Decision (via /next args): the **next session is the v2 Gate A brainstorm**.
- Quote: "session we'll brainstorm gate a"

### Agent decisions / assumptions / rationale
- Numbered the 06-10 trio `0019` and the 06-11 finale `0020` (the AskUserQuestion option text had labeled the finale 0019) so the index stays **date-ordered** (0018 is also 06-10). Flagged to Roi as trivially swappable.
- Both entries `status: draft` in frontmatter, matching every prior entry.
- Committed to the designated task branch `claude/last-15-commits-8aizhv` per this session's git directive, NOT `dev` — the harness branch rule overrides AGENTS.md's `dev`-trunk default for this session.

### Files read or touched
- Read: `docs/v1_wrap/claude-for-chrome/COMPARISON.md`, `docs/v1_wrap/META-ANALYSIS.md`, `docs/v1_wrap/claude-for-chrome/CAPABILITY-AND-V2-GAPS.md`, `journal/context/active.md`, the 4 owed session files (`fable-workflow-v1-acquittal-20260611-1430`, `native-capabilities-placed-20260610-0950`, `observe-bug-fixes-shipped-20260610-1203`, `skills-asserts-iframe-dismiss-20260610-1243`), `blog/README.md`, `blog/_pending.md`, `blog/0017-teaching-it-to-see.md`.
- Touched (committed `af83a65`): `blog/0019-the-reviews-that-caught-me-lying.md` (new), `blog/0020-feather-on-trial.md` (new), `blog/README.md`, `blog/_pending.md`.

### Open threads / unresolved questions
- **v2 Gate A brainstorm not started** — that's the whole next session. Inputs to pull forward: ADR-0010 (capability grants / deny-by-default), the §4 ◇ deferred items in META-ANALYSIS (general `/evaluate` deferred to Gate A; batch endpoint at 5.0.1; Stealth 5d), and the Gate B posture borrowings from C4C (declared-origin allowlist per session; credentials-never-typed / CredentialsVault injection).
- Entry-number swap (0019↔0020) offered to Roi, not yet confirmed.
- Small v1 leftovers still open (from the 14:30 stop, not this session): prune duplicate Sep-12 "Rosh Hashana" events on scratch Google; H3 viewport acceptance check (does 1280×800 headed render IG desktop — counterfactual never tested); remove dead `run_h3` from `showcase.sh` when next touched.

### Next action
- Start the **v2 Gate A planning/brainstorm session (5.0.0)**: fresh session, planning-first (no implementation per AGENTS.md phase-boundary rule). Orient via `/start`, then open ADR-0010 and the Gate A design surface.

### Next session should read
- `journal/context/active.md` (state owner), `ROADMAP.md`
- `docs/specs/adr-0010-*` (capability grants / Gate A sequencing — confirm exact filename)
- `docs/v1_wrap/META-ANALYSIS.md` §4 (deferred items) + §5 (corrected verdict)
- `docs/sessions/5.0.0-*` if it exists (Gate A session stub)

### Risks / blockers
- **Branch divergence:** the blog finale is committed to `claude/last-15-commits-8aizhv`, NOT `dev`. Per AGENTS.md the blog lives on `dev`; the next human step is to reconcile/cherry-pick `af83a65` onto `dev` (or merge the task branch) so the finale isn't stranded. Don't double-write the entries on `dev`.
- AGENTS.md phase-boundary rule: do the Gate A planning/reconciliation pass **before** any implementation — don't jump straight into building the gate.

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

---
## 2026-06-11 17:28 — A1 slice 1: session-hold primitive shipped (simplified workflow)

### Session pointer
- Phase 5.0.0 (Gate A) → A1; `journal/ops/tasks.md` §5.0.0 A1; ADR-0010 §4 + Gate A design §2.

### Summary
- Shipped the FIRST A1 slice — the session-hold primitive in core. Workflow simplified: working
  directly on the session branch, no PR-per-slice; plan→implement→test→summarize.

### Completed
- **`src/capability/holds.ts`** — `SessionHoldRegistry`: refcounted holds with `reason`
  (`mfa | human-approval | cdp-attach | shutdown`), optional teardown closure run once on release
  (the revoke-teeth seam), `observe`/`has`/`count` read surface for the future policy layer,
  `releaseAllForSession(id, reason?)` revoke hammer. Idempotent release; async teardown awaited;
  throwing teardown → `onTeardownError`, never propagated. Instance-scoped (not a module singleton).
- **`tests/unit/capability/holds.test.ts`** — 11 unit tests.
- Committed on `claude/session-branch-work-leu1oj` (rebased onto dev so the branch carries A0 + the
  current tracking state — it was cut from a pre-A0 base; rebase made it `dev + holds`).
- **Pure infrastructure — NO live session paths wired** (no behavior change to running sessions).

### User decisions / quotes
- Decision: SIMPLIFIED WORKFLOW (new default) — no PR-per-step unless explicitly asked; work on the
  active branch; plan briefly, implement, test, summarize; don't stop for approval on every step.
  Pause only if: touches real warmed profiles/personal accounts; materially CHANGES security
  architecture (vs. executing accepted ADR-0010); deletes/rewrites large parts; CI fails non-obviously;
  unclear architectural tradeoff.
- Quote: "Stop using a PR-per-step process unless I explicitly ask for it."
- Quote: "For A1, continue with a compact plan and then start the first safe implementation slice."
- Quote: "I want to review it" — Roi reviews slice 1 before the grant-registry slice proceeds.

### Agent decisions / assumptions / rationale
- Implementing the ACCEPTED ADR-0010 design = in scope (no pause); only a genuine under-specified fork
  would trigger a pause. Confirmed reading with Roi up front.
- Chose the hold primitive as slice 1 because the Gate A build-order names it first (MFA + CDP both
  depend on it; it unblocks Stealth-last) and it is pure infra — safest first slice.
- Did NOT wire holds into the live session-close path this slice — that wiring belongs with the grant
  work (build-order step 4), keeping slice 1 zero-behavior-change.
- Instance-scoped registry (not module singleton like pause-registry) — clean per-test, and the grant
  registry will need the same treatment.

### Files read or touched
- Touched: `src/capability/holds.ts`, `tests/unit/capability/holds.test.ts`.
- Read: `docs/specs/adr-0010-local-control-plane-capability-model.md`,
  `docs/specs/2026-06-11-gate-a-capability-system-design.md`, `src/transport/middleware.ts`,
  `src/sessions/{session,types}.ts`, `src/commands/pause-registry.ts`.

### Open threads / unresolved questions
- Roi wants to review slice 1 before continuing. Hold the grant-registry slice until reviewed.
- Merged-branch deletion still BLOCKED (git proxy 403, no MCP delete-branch tool) — unchanged.

### Next action
- After Roi's review: build A1 slice 2 — capability-grant registry + state machine
  (`requested → granted → used → {expired|revoked}`, opaque single-use nonce → server-side registry
  record `{sessionId, capability, ttl, status}`). Infra only; local approval page + Dangerous-tier
  wiring come after.

### Next session should read
- `src/capability/holds.ts` (the seam slice 2 builds on)
- `docs/specs/2026-06-11-gate-a-capability-system-design.md` §3 (grant lifecycle)
- `docs/specs/adr-0010-local-control-plane-capability-model.md` §2 (grant primitive)

### Risks / blockers
- A1 is core security infra — short-lived branch, heavy review per AGENTS.md domain-risk note.
- Slice 1 has no call sites yet (by design) — slice 2+ must actually wire it or it's dead code.
