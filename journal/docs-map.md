# Docs Map — Source of Truth

One line per doc surface: what it is authoritative for. If two docs disagree, the one named here wins; fix the other. **Every phase ends by reconciling these to reality ("leave the docs true").**

| File | Source of truth for |
|------|---------------------|
| `AGENTS.md` | Constraints, mission, branch rules, current phase pointer, command usage. Read first. |
| `ROADMAP.md` | Destination, phase list, milestones, exit criteria. Completed-phase detail → `journal/ops/archive/`. |
| `journal/context/active.md` | **Current state + next action (the single owner).** Resume context for `/start`. |
| `journal/ops/tasks.md` | Current-phase task checklist (checkboxes only). |
| `journal/ops/phase.md` | Machine-readable current phase/sub-phase pointer (frontmatter only). |
| `PROGRESS.md` | Thin pointer to the owners above; no longer holds state. |
| `journal/ops/sessions/` | `/stop` handoff files (history). |
| `journal/ops/archive/` | Rotated-out history (log, Phase-3 progress, completed roadmap phases). |
| `.remember/remember.md` | Short handoff to the very next session. |
| `journal/raw/_inbox/` | Research findings, rough notes, spike results. |
| `docs/specs/` | Specs and ADRs (decisions). |
| `docs/plans/` | Implementation plans (tracked). |
| `journal/README.md` | Definition of the operating-file system itself. |
| `journal/work/<desk>/context.md` | Desk-specific working context (browser/product/automation/general). |

Note: `docs/superpowers/` is git-ignored — do not put canonical docs there. Tracked specs go in `docs/specs/`, tracked plans in `docs/plans/`.
