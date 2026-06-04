# /init — Feather Browser Phase-Boundary Ritual

If slash commands are not natively supported by the current agent, open this file and execute the
checklist manually.

`/init` is the **phase-boundary ritual**: run it once at a phase boundary to close the completed
phase and open the next one. It is distinct from per-session `/stop` (which closes a single working
session). `/init` is a per-phase superset; `/stop` still closes the final session inside a phase.

Run **A** always. Run **B** only when a phase has actually completed. Run **C** when opening the
next phase (or when you arrive with a new goal and just need orientation + a gate-check).

---

## A. Orient (always)

1. Confirm project path: `/home/roking/Desktop/Projects/feather-browser`.
2. Read the hot orientation set (single-owner hierarchy — keep it lean, do not re-add demoted files):
   - `AGENTS.md`
   - `README.md`
   - `ROADMAP.md`
   - `journal/context/active.md` — **the single state owner** (where we are, what's next)
   - `journal/ops/tasks.md` — current-phase checklist
   - `journal/ops/phase.md` — machine pointer (frontmatter only)
   - last 15 lines of `journal/log.md`

   Warm (load on demand, not here): `PROGRESS.md` (pointer), `journal/README.md`,
   `journal/docs-map.md`, `journal/ops/archive/`.
3. Report: current phase · current milestone target · active task · next concrete action ·
   files expected to change.

---

## B. Phase wrap (only when a phase has completed)

Skip this section entirely if the current phase is still in progress.

4. **Verify exit criteria** — check the completing phase's milestones/exit criteria in `ROADMAP.md`;
   report each ✓/✗ with evidence (commit, ADR, test run). Do not claim a phase done on an ✗.
5. **Leave the docs true** — reconcile every state owner to reflect the boundary:
   - `ROADMAP.md` phase status · `journal/ops/phase.md` frontmatter · `journal/context/active.md`
   - `journal/ops/tasks.md` (archive the closed phase's checklist) · `journal/log.md` (rotate
     pre-current-phase entries → `journal/ops/archive/log-archive.md`)
   - `AGENTS.md` pointer · `README.md` status line · `journal/docs-map.md`
6. **Blog** — add a phase-exit entry if the project keeps a build-in-public log.
7. **Core memory** — write one only if the boundary was identity-defining (rare).

---

## C. Open next phase

8. Ask: "Run a web research pass — recent tech news, ecosystem updates, doc/spec changes relevant to
   the next phase — and suggest roadmap/task updates? Or skip straight to work?"
   - Yes → step 9. No → step 11.
9. Web research: search for recent updates relevant to Feather's stack and the next phase's goals
   (Playwright, browser automation, agentic patterns, relevant API/spec changes, etc.).
10. Brainstorm findings: relevant vs. noise, then surface concrete suggestions — new tasks, phase
    adjustments, approaches worth reconsidering. Present and confirm before touching any files.
11. Gate-check the goal against the workflow:
    - Milestones are solid; phases are flexible until active.
    - Every phase starts with Step 0: research and plan.
    - Only the current phase gets detailed tasks.
12. If the goal fits, proceed. If it skips a phase or creates detailed future-phase tasks, stop and
    ask for confirmation.

Do not begin research or implementation before this command has been followed.
