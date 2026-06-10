# Next — Context Bridge

_Empty buffer. The last entry (daily-driver background launch + `primary` re-warm) was consumed at the
2026-06-10 ~01:42 `/stop` and archived to
`journal/archive/next/2026-06-10/0142-daily-driver-background-launch.md`. Current state lives in
`journal/context/active.md`._

<!-- Append `/next` bridge entries below this line when moving between work sessions mid-thread. -->

---
## 2026-06-10 04:06 — Graphify standalone read-only MCP PoC (isolated worktree)

### Session pointer
- Roadmap/session pointer: side-experiment, OFF the v1/v2 critical path. Branch `graphify-test`
  (worktree `feather-browser-graphify-test`). Not part of Phase 4a tasks; evaluate-then-decide.

### Summary
- Wired Graphify (`safishamsi/graphify`, PyPI `graphifyy[mcp]`) as a **standalone stdio MCP server**
  in Claude Code WITHOUT its installer — no CLAUDE.md / skills / PreToolUse hook pollution.
- Proved deterministic "blast radius" both via CLI (`graphify affected`) and via the MCP tool
  (`query_graph`). Auto-sync + hot-reload chain is live and verified.

### Completed
- Confirmed Graphify is real; identified + avoided the `graphify install --platform claude` trap
  (it copies CLAUDE.md + installs a PreToolUse hook).
- `uv tool install "graphifyy[mcp]"` (base pkg omits the `mcp` extra → first connect failed; fixed).
- `.graphifyignore` — indexes code wiring only; fences `*.md`, `docs/ journal/ blog/ research/
  inbox/ skills/ .claude/ .pi/ .github/`, deps/build, media. Leak check: 0 fenced paths in graph.
- Built graph: 719 nodes / 1592 edges / 39 communities from 135 code files in ~1.8s, no LLM.
- Registered MCP at **local scope** (`~/.claude.json`, this project only): `graphify-mcp <graph.json>`.
  `claude mcp get graphify` → ✔ Connected; 10 tools (query_graph, get_neighbors, shortest_path,
  god_nodes, graph_stats, get_community, get_node, +3 PR-impact).
- Auto-sync: worktree-scoped `.githooks/post-commit` runs `graphify update .` (incremental, no-LLM,
  detached/background so commits never block). Isolated via `git config --worktree core.hooksPath`
  so the MAIN feather-browser repo is untouched (verified: hooksPath only in worktree config).
- Verified server hot-reloads graph.json on mtime/size change (read serve.py `_maybe_reload`), so
  commit → hook rewrite → next MCP query auto-reloads. No restart needed.
- Committed PoC baseline `401b176` (.graphifyignore + .githooks/post-commit + .gitignore graphify-out/).
  Post-commit hook fired automatically on that commit (no-op: no code topology change — correct).

### User decisions / quotes
- Decision: standalone MCP only, zero skill pollution; fence all docs/markdown; seamless zero-friction
  auto-sync; commit the PoC baseline.
- Quote: "DO NOT run `graphify install --platform claude`. ... Configure Graphify strictly as a
  standalone MCP server so it only acts as an available tool without hijacking my workflow."
- Quote: "the benefits MUST outweigh the integration costs."

### Agent decisions / assumptions / rationale
- Chose `graphify update .` (no-LLM AST re-extract) over full `graphify .` build — matches the
  lightweight, no-API, no-heavy-rebuild constraint; sufficient for blast-radius/query tools.
- Local MCP scope (not project `.mcp.json`) so nothing committed/shared leaks the server config.
- Worktree-scoped hooks (extensions.worktreeConfig + `--worktree core.hooksPath`) for true isolation
  vs. a guard-in-shared-hook; cleaner, main repo never runs it.
- Did NOT write a memory (PoC-specific, may be ephemeral) — revisit if Graphify graduates.

### Files read or touched
- Touched: `.graphifyignore`, `.githooks/post-commit`, `.gitignore` (added `graphify-out/`),
  `graphify-out/*` (generated, gitignored).
- Config touched: `~/.claude.json` (local MCP server `graphify`); git `extensions.worktreeConfig=true`
  (shared) + `core.hooksPath` (worktree only).
- Read: serve.py (`~/.local/share/uv/tools/graphifyy/.../graphify/serve.py`) for hot-reload behavior.

### Open threads / unresolved questions
- Verdict pending from Roi: keep Graphify or discard the worktree? (Setup says benefits clear the bar
  for this repo; cost is near-zero.)
- Not tested: MCP tool call from a *fresh* Claude Code session (current session predates registration).
  Needs a new session in this worktree to confirm `mcp__graphify__*` tools surface to the agent.
- `god_nodes`/PR-impact tools (list_prs/get_pr_impact/triage_prs) unexercised — need GitHub context.

### Next action
- Open a fresh Claude Code session in this worktree and ask it to use the graphify MCP server for a
  blast-radius query (confirms the tools surface to the agent, not just the raw stdio probe).

### Next session should read
- `journal/context/next.md` (this entry); `.graphifyignore`; `.githooks/post-commit`.
- Commit `401b176` for the baseline. `graphify --help` for the CLI verb surface.

### Risks / blockers
- This is an isolated experiment worktree; nothing pushed to remote. Decide keep/discard before merge.
- `extensions.worktreeConfig=true` is a shared-repo flag (harmless enable). To fully revert the PoC:
  `git config --worktree --unset core.hooksPath`, `claude mcp remove graphify -s local`,
  `uv tool uninstall graphifyy`, delete the worktree.

---
## 2026-06-10 05:35 — NotebookLM Project Brain v2 spec + implementation plan

### Session pointer
- Roadmap/session pointer: documentation/knowledge-pack side task in `graphify-test` worktree; not part of the
  Phase 4a/v2 critical path unless Roi decides to keep/merge it.

### Summary
- Designed a full v2 rewrite of `docs/feather_notebooklm_pack/` as a current-truth "Feather Project Brain" for
  Roi + technical collaborators, optimized for NotebookLM/RAG chunking.
- Wrote tracked design spec + implementation plan; user wants implementation in a fresh chat using
  subagent-driven development.

### Completed
- Used brainstorming workflow; approved structure: files `01`-`11` are uploadable sources, `README`,
  `12_notebooklm_system_instructions.md`, and `13_notebooklm_studio_prompts.md` are human-only.
- Incorporated user RAG constraints: per-file Feather boilerplate, clean citation-facing H1s, glossary `### Term`
  headings, README not uploaded, file 12 copied to NotebookLM system instructions, file 13 Studio prompt table.
- Created `docs/specs/2026-06-10-notebooklm-project-brain-v2-design.md`.
- Created `docs/plans/2026-06-10-notebooklm-project-brain-v2.md`.
- Created earlier source-verified callflow pack `docs/feather_notebooklm_pack/08_session_launch_callflow.md` and
  updated pack README, but the new plan supersedes this old `08` filename with `08_roadmap_v1_v2_v3.md`.
- Gave Roi a pasteable fresh-chat prompt to implement the plan with subagent-driven development.

### User decisions / quotes
- Decision: all-in-one project brain, current truth as of today plus future plans, for Roi + technical collaborators.
- Decision: include curated `06_codebase_topology.md` derived from `GRAPH_REPORT.md`, not raw graph dumps.
- Decision: full coherent v2 rewrite, not a patch.
- Decision: README, file 12, and file 13 must not be uploaded to NotebookLM as sources.
- Quote: "i trust your gut"
- Quote: "The architectural design is excellent and deeply aligned with the project's current truth."

### Agent decisions / assumptions / rationale
- Stored the design spec under `docs/specs/` and plan under `docs/plans/` because `docs/superpowers/` is ignored in
  this repo.
- Recommended subagent-driven execution for the rewrite; fresh chat prompt includes constraints and validation.

### Files read or touched
- Read: `docs/commands/next.md`, `journal/context/active.md`, `journal/context/next.md`,
  `journal/ops/tasks.md`, `feather.md`, roadmap/API/operator docs, `graphify-out/GRAPH_REPORT.md`.
- Touched: `docs/specs/2026-06-10-notebooklm-project-brain-v2-design.md`,
  `docs/plans/2026-06-10-notebooklm-project-brain-v2.md`,
  `docs/feather_notebooklm_pack/README.md`,
  `docs/feather_notebooklm_pack/08_session_launch_callflow.md`.

### Open threads / unresolved questions
- NotebookLM Project Brain implementation is not done in this chat; execute the plan in a fresh chat.
- Decide later whether to keep/merge the broader Graphify worktree experiment.
- Existing dirty journal files predated some of this turn; do not assume all dirty tracking file changes are from
  one task without checking diff.

### Next action
- Fresh chat should read the design spec and implementation plan, then implement
  `docs/plans/2026-06-10-notebooklm-project-brain-v2.md` using subagent-driven development.

### Next session should read
- `AGENTS.md`
- `journal/context/active.md`
- `journal/context/next.md`
- `docs/specs/2026-06-10-notebooklm-project-brain-v2-design.md`
- `docs/plans/2026-06-10-notebooklm-project-brain-v2.md`

### Risks / blockers
- Do not run `graphify codex install` or edit `AGENTS.md`.
- Do not move `graphify-out/GRAPH_REPORT.md`.
- Do not upload/copy raw `graphify-out/graph.json`.
- Keep README/file 12/file 13 human-only, not NotebookLM sources.

---
## 2026-06-10 06:15 — NotebookLM Project Brain v2 SHIPPED

### Session pointer
- Roadmap/session pointer: side-task, in `graphify-test` worktree. Branch `graphify-test`.

### Summary
- Rebuilt `docs/feather_notebooklm_pack/` into a current, RAG-aware Feather Project Brain for NotebookLM.
- Replaced the existing infographic-oriented pack with a layered source set: current truth, product model, architecture, API loop, session lifecycle, Graphify topology, safety, roadmap, evidence, limits, glossary, and two human-only helper files.

### Completed
- Rewrote files `01`-`11` as uploadable sources with standardized Feather boilerplate.
- README modified to human-only guide.
- Created `12_notebooklm_system_instructions.md` (System instructions field, non-source).
- Created `13_notebooklm_studio_prompts.md` (Studio format cheat-sheet, non-source).
- Glossary terms formatted with `### Term` headers.
- Curated topology source (`06_codebase_topology.md`) built from Graphify CLI query outputs.
- Deleted obsolete old pack files.
- Validated RAG packaging rules and safety claims (no stale language, no overstatements).
- Committed to `graphify-test` branch (`d3eb790`).

### User decisions / quotes
- Decision: Use subagent-driven development to implement the plan.
- Constraint: 01-11 are sources; README/12/13 are human-only.
- Constraint: every source must have the boilerplate.

### Files read or touched
- Created/Modified: `docs/feather_notebooklm_pack/*.md`.
- Read: `journal/context/active.md`, `ROADMAP.md`, `docs/specs/adr-*.md`, `graphify-out/GRAPH_REPORT.md`.

### Next action
- Roi reviews the new pack; decides on Graphify keep/discard.
