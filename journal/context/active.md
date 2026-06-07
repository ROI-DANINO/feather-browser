# Active - startup pointer

This file is the short live pointer for `/start`. Full phase/session map -> `ROADMAP.md`;
operational checklist -> `journal/ops/tasks.md`; machine pointer -> `journal/ops/phase.md`.

## Current pointer

- **Current phase:** Phase 4a - Feather Core Open-Source Readiness And Public Proof.
- **Current recommended session:** `ROADMAP.md` -> `### Session 4a.6b - Security & Capability
  Re-Sequencing (from council review)`. This supersedes "start 4a.7 as-is".
- **Next concrete action:** run Session 4a.6b - read `research/2026-06-07-council-design-review.md`,
  decide the 4a.7 cold-vs-deferred split, write the control-plane/capability ADR, and re-order the
  Phase 5 spine (safety gate -> Identity -> MFA -> warmed CDP -> Stealth). Planning only, no code.
- **Why:** a 5-model council review (2026-06-07) unanimously flagged that Feather is exposing
  high-privilege surfaces (CDP attach, unauth MFA routes, warmed creds on disk) before the safety
  machinery that governs them. Decision: go with the findings - security model first.
- **Task state:** roadmap rebase done; council review recorded + spec addenda added; 4a.7 flagged and
  on hold pending the re-sequencing pass.

## Files to read next

- `research/2026-06-07-council-design-review.md`
- `ROADMAP.md` (Session 4a.6b)
- `journal/ops/tasks.md`
- `docs/specs/2026-06-07-mfa-handler-design.md` (Security addendum)
- `docs/specs/2026-06-07-identity-model-design.md` (Security addendum)
- `docs/specs/adr-0008-credentials-vault.md`

## Blockers / notes

- `journal/context/next.md` exists as the reset header only; no pending `/next` entries.
- LinkedIn debut recording remains valid but blocked on installing a Niri/Wayland screen recorder
  (Kooha or `wf-recorder`).
- `journal/raw/_inbox/` still has two social-research use-case stubs plus its README; triage is
  Session 4a.10, not the next engineering session.
- Command workflow docs were already stabilized in a previous pass; do not redo them unless a direct
  contradiction blocks current work.

## Recent completed context

- Agent Browsing Stack specs are complete: Stealth Stack, MFA Handler, and Identity Model.
- Open-source integration research is complete and folded into the roadmap sequence.
- Hero demo is working: `npm run demo:hero`; recording still needs a screen recorder.
- Core open-source README and `examples/quickstart.sh` are already in place.
