# Next — Context Bridge

---
## 2026-06-07 23:03 — Session 4a.6b: security & capability re-sequencing (council reversal)

### Session pointer
- Roadmap/session pointer: Phase 4a; **4a.6b done**, next = **4a.7 cold-profile CDP interop**
  (`docs/sessions/4a.7-cdp-cold-profile-interop.md`).

### Summary
- Acted on the 2026-06-07 5-model council review: reversed to "security model first, interop through it."
- Wrote ADR-0010 (capability model), re-scoped 4a.7, re-ordered the Phase 5 spine, split the roadmap,
  folded security tasks into the MFA + Identity plans. **Docs-only; no product code.**

### Completed
- New ADR `docs/specs/adr-0010-local-control-plane-capability-model.md` (CANDIDATE): three privilege
  tiers, capability-grant primitive, global `Origin`/`Host` hook, session-hold primitive.
- 4a.7 re-scoped → cold/throwaway profiles only; warmed attach deferred to new Phase 5c behind gate.
- Phase 5 spine re-ordered: `gate (5.0.0) → Identity (5a) → MFA (5b) → warmed CDP (5c) → Stealth (5d,
  last) → Agent Runtime (5e)`; renumbering map + dependency graph + security gates in `ROADMAP.md`.
- `ROADMAP.md` split into thin index + `docs/sessions/<id>.md` (8 files incl. README).
- MFA plan + Identity plan: folded council Security Tasks; fixed stale build-order/architecture lines.
- Reconciled `active.md`, `tasks.md`, `phase.md`.
- Verified all ADR backlinks + session-file references resolve.

### User decisions / quotes
- Decision: split `ROADMAP.md` now into index + per-session files. Quote: "Split now into index and
  session files".
- Decision: 4a.7 scope — Roi deferred to recommendation. Quote: "i dont know this things and i dont
  know how to choose." → went with **cold-profile proof now, warmed deferred** (recommended option).

### Agent decisions / assumptions / rationale
- Two dependency-breaking decisions recorded as load-bearing: (1) session-hold primitive replaces
  MFA's `setStealthMode` → frees Stealth to be last; (2) Identity stores stealth/MFA policy as
  opaque/versioned refs (not concrete imports) → frees Identity to be first. Both per council guidance.
- ADR-0010 written as CANDIDATE (joint-call style like ADR-0009); acceptance + open questions deferred
  to Session 5.0.0.
- Did NOT formally run the brainstorming skill: the design space was already explored by the 5-model
  council; this was synthesis + Roi's two forks, not open-ended ideation.
- Phases with existing plan files (5a/5b/5d) point to those plans rather than duplicating into session
  files; completed-session history left to git + `journal/ops/sessions/`.

### Files read or touched
- Read: `research/2026-06-07-council-design-review.md`, `journal/work/browser/context.md`,
  `docs/specs/2026-06-07-mfa-handler-{design,plan}.md`,
  `docs/specs/2026-06-07-identity-model-{design,plan}.md`, `docs/specs/adr-0009-shell-stack.md`,
  `src/transport/{http,middleware,routes}.ts`.
- Touched (new): `docs/specs/adr-0010-local-control-plane-capability-model.md`, `docs/sessions/` (8).
- Touched (modified): `ROADMAP.md`, `docs/specs/2026-06-07-mfa-handler-plan.md`,
  `docs/specs/2026-06-07-identity-model-plan.md`, `journal/context/active.md`,
  `journal/ops/tasks.md`, `journal/ops/phase.md`.

### Open threads / unresolved questions
- ADR-0010 open questions (defer to 5.0.0): capability-token shape; human-approval surface in Phase 4a
  (no shell yet); whether to ship the global `Origin`/`Host` hook as a standalone early hardening;
  audit durability.
- Nothing committed/pushed yet — `dev` has these docs-only changes uncommitted.

### Next action
- Start **Session 4a.7** (implementation): expose CDP/WS endpoint for cold/disposable sessions only,
  token-gated + loopback-bound, with a test asserting absence on warmed profiles. Verify Playwright
  1.60 endpoint shape from docs first.

### Next session should read
- `docs/sessions/4a.7-cdp-cold-profile-interop.md`
- `docs/specs/adr-0010-local-control-plane-capability-model.md`
- `research/2026-06-07-open-source-integration-research.md`
- `src/browser/modes.ts`, `src/sessions/session.ts`, `src/sessions/manager.ts`, `src/transport/routes.ts`

### Risks / blockers
- 4a.9 LinkedIn recording still blocked on a Niri/Wayland screen recorder (Kooha / `wf-recorder`).
- Two social-research inbox stubs still un-triaged (Session 4a.10).
- Uncommitted docs-only changes on `dev`; commit/push deferred to `/stop`.
