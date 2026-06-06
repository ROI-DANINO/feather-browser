# Session — Inbox processing + git-worktree workflow

- **When:** 2026-06-05, ~16:30–17:14
- **Branch:** `dev`
- **Commit landed:** `43933fc` (inbox processing); journal/tracking files committed at stop.
- **Shape:** hygiene + one process decision — not Phase-4 build work.

## Done this session

- **Processed the research inbox to empty (README only).** All 4 remaining notes `git mv`'d to
  `journal/raw/archive/` (trail preserved). Committed `43933fc`. Dispositions:
  - `2026-06-05-feather-open-source-positioning-and-adoption.md` → drafted
    **`docs/public-positioning.md`** ("Core first, Shell later"; one-sentence = "a local Chromium
    runtime for AI agents"; honest Linux-first limits; Core-vs-Shell split). Roi approved drafting it.
  - `2026-06-05-composio-comparison-feather-agent-tooling-direction.md` → saved project memory
    `project_feather_agent_runtime_direction` (Feather = **MCP Browser Runtime** with per-tool risk
    levels; browser-native, NOT a Composio-style integration platform; Phase-5-Step-0 input). Already
    constrained by ADR-0006, so no new ADR.
  - `2026-06-03-branching-strategy-domain-research-intake.md` → resolved into a **git-worktree
    workflow** (see Decisions); intake note archived but kept as the domain-risk reference (linked
    from AGENTS.md).
  - `2026-06-03-browser-agent-security-risks.md` → already absorbed (ADR-0005/0008 + the Parked
    Phase-5 list in `active.md`); archived with trail intact.
- **Added a "Parallel workstreams via git worktrees" section to `AGENTS.md`** under Branch Rules.
- `active.md` inbox flag updated to "empty".

## Prior-chat context folded from next.md (already had permanent homes — not re-recorded here)

The bridge had accumulated since the last `/stop` (2026-06-04 23:07) because only `/next` ran in
between. All already recorded in their own homes:
- Master merge-readiness verification + CI added (first run caught the hardcoded-Wayland bug) →
  `log.md`, `active.md`.
- PR #1 merged `dev`→`master` (`e39d167`).
- Autonomous research run COMPLETE (4 workstreams, CI green) → its own session file
  `autonomous-research-run-20260605.md`.

## Decisions

- **Adopt git worktrees for parallel, unrelated workstreams.** One branch per workstream
  (`shell-gui`, `spike-cookie-primary`, `vault-backend`, …) off `dev`, each in its own worktree
  folder, **one chat/session per worktree** → each session's context stays small and cheap, and
  unrelated work can't collide. Short-lived; merge back to `dev` when green; `dev`→`master`
  unchanged. Core session/profile/security work stays short-lived + heavily reviewed (no drift).
  **Roi chose: document the rule, create worktrees as-needed (no pre-created idle desks).**
  This is what the branching-strategy intake was really asking for — practical parallelism + token/
  context efficiency, not a 22-question strategic branch model.
- **Public positioning = "Core first, Shell later"** — promoted to `docs/public-positioning.md`.
- **Blog skipped** — modest process decision, no phase completion / architecture shift.

## Left unfinished / open threads (unchanged by this session)

- The **three joint-call decisions** still open: ① shell-stack final pick (ADR-0009: GTK4-native +
  Casilda; gate on a Casilda+Chromium latency/input spike) → then start the Phase-4 GUI from
  `research/2026-06-05-phase4-gui-architecture-sketch.md`; ② cookie-isolation for the real `primary`
  (measure DBSC binding **read-only first**, never blind-clone); ③ vault/behavioral storage backend
  (ADR-0008 frozen).
- Minor: **sudo Xvfb install (Roi)** to finish the 3-way anti-detection WebGL table.

## Verbatim Roi quotes

- "I want to process the inbox"
- "I want to make branches so I can work on unrelated stuff simultaneously and be token and context efficient"
- "i want b... i want to resume the work when we done in a different chat"
- "document the workflow and let you create worktrees as needed"
- "yes, looks right — focus on the shell-stack joint call"

## Next concrete action

Fresh session → `/start`, then open the **shell-stack joint call**: review ADR-0009, run a
Casilda+Chromium latency/input spike on this box to gate the pick, then begin the Phase-4 GUI. If
splitting that from other work (e.g. cookie-isolation-for-`primary`), create a worktree per
workstream per the new AGENTS.md rule and drive each in its own chat.
