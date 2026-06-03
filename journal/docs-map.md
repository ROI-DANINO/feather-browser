# Docs Map — Source of Truth

One line per doc surface: what it is authoritative for. If two docs disagree, the one named here wins; fix the other. **Every phase ends by reconciling these to reality ("leave the docs true").**

| File | Source of truth for |
|------|---------------------|
| `AGENTS.md` | Constraints, mission, branch rules, current phase pointer, command usage. Read first. |
| `ROADMAP.md` | Destination, phase list, milestones, exit criteria. |
| `PROGRESS.md` | What is done / in progress now; open questions. |
| `journal/ops/phase.md` | Machine-readable current phase/sub-phase state. |
| `journal/ops/tasks.md` | Detailed tasks for the *current* phase only. |
| `journal/context/active.md` | Resume context for `/start`. |
| `journal/ops/sessions/` | `/stop` handoff files (history). |
| `.remember/remember.md` | Short handoff to the very next session. |
| `journal/raw/_inbox/` | Research findings, rough notes, spike results. |
| `docs/specs/` | Specs and ADRs (decisions). |
| `docs/plans/` | Implementation plans (tracked). |
| `journal/README.md` | Definition of the operating-file system itself. |
| `journal/work/<desk>/context.md` | Desk-specific working context (browser/product/automation/general). |

Note: `docs/superpowers/` is git-ignored — do not put canonical docs there. Tracked specs go in `docs/specs/`, tracked plans in `docs/plans/`.
