# Next — Context Bridge

_Empty buffer. The last entries (pass-2 observe measurement, graphify worktree analysis + wiring,
NotebookLM Project Brain v2 spec/ship, observe-bug-fixes brainstorm pause) were consumed at the
2026-06-10 ~06:52 `/stop` (graphify graduation) and archived to
`journal/archive/next/2026-06-10/0652-stop-bundle-graphify-graduation.md`. Current state lives in
`journal/context/active.md`._

<!-- Append `/next` bridge entries below this line when moving between work sessions mid-thread. -->

---
## 2026-06-10 08:20 — native capabilities research placement

### Session pointer
- Roadmap/session pointer: Phase 4a / v1 live; new raw idea for native capabilities router, not yet placed in roadmap.

### Summary
- Roi raised a product/architecture idea: Feather should not be browser-only; it should route work across native APIs, MCP tools, generated connectors, browser observe-act, and human handoff.
- Two raw inbox artifacts now capture the idea and a first research map; next chat should deepen the research and decide when/how this belongs in the existing plan.
- The key product frame: native capability when reliable, browser as universal fallback when the real web has no better interface.

### Completed
- Added raw idea note: `journal/raw/_inbox/2026-06-10-native-capabilities-router.md`.
- Added initial research map: `journal/raw/_inbox/2026-06-10-native-capabilities-research-map.md`.
- Read `/next` command contract: `docs/commands/next.md`.

### User decisions / quotes
- Decision: Next chat should focus on deeper research analysis and deciding when to start planning implementation so it fits naturally into the existing roadmap.
- Quote: "בצ׳אט הבא אני רוצה למקם את הניתוח המחקר המעמיק והחלטה על מתי מתחילים לתכנן להטמיע את הרעיון באופן שישתלב בתוכנית הקיימת בצורה טבעית"
- Decision: Ignore the `/next` doc's "no git commit" instruction for this connector-based write.

### Agent decisions / assumptions / rationale
- Treat this as a `/next` bridge, not a `/stop`: no session file, no phase change, no blog, no task archive.
- Do not jump into implementation. Next step is placement and planning decision: whether capability routing belongs before v2 Gate A, inside v2 Gate A, or after current observe bug fixes.
- Keep the product boundary: avoid becoming a Zapier/Make clone; frame as a capability layer and execution router.

### Files read or touched
- Read: `docs/commands/next.md`
- Touched: `journal/context/next.md`
- Touched: `journal/log.md`
- Touched: `journal/context/active.md`
- Prior touched/read inputs: `journal/raw/_inbox/2026-06-10-native-capabilities-router.md`, `journal/raw/_inbox/2026-06-10-native-capabilities-research-map.md`

### Open threads / unresolved questions
- Should native capabilities become part of v2 Gate A / ADR-0010 capability-safety gate, or remain a later v2/v3 feature?
- What is the first MVP layer: manual capability manifests, Google Workspace MCP import, X/OpenAPI study, or data.gov.il connector?
- How should generated/imported capabilities be constrained: allowlists, risk labels, confirmation gates, auth storage, and browser fallback?
- How does this interact with Graphify: code-wiring map only, or also used to evaluate connector blast radius?

### Next action
- In the next chat, read `active.md`, both native-capability inbox files, and roadmap/tasks; then produce a placement recommendation and decide whether to write a spec/plan for a Capability Registry / Router.

### Next session should read
- `journal/context/active.md`
- `journal/ops/tasks.md`
- `ROADMAP.md`
- `docs/roadmap/v1.md`
- `docs/roadmap/v2.md`
- `journal/raw/_inbox/2026-06-10-native-capabilities-router.md`
- `journal/raw/_inbox/2026-06-10-native-capabilities-research-map.md`
- `docs/specs/adr-0010-local-control-plane-capability-model.md` if present / find the ADR-0010 capability model location

### Risks / blockers
- Risk: attractive integration work could distract from the currently recommended observe-bug-fixes → v2 Gate A sequence.
- Risk: official APIs/MCPs can be safer for structure but widen permission blast radius; security model must lead before write actions.
- Blocker: no decision yet on roadmap placement or MVP scope.

---
## 2026-06-10 09:28 — /blog + /notebook commands, /stop blog gate, CLAUDE.md→AGENTS.md fix

### Session pointer
- Roadmap/session pointer: Phase 4a / v1 live; this was journal/command-tooling meta-work, not phase work.

### Summary
- Brainstormed → specced → shipped the command-layer changes Roi wanted after graphify/notebooklm landed: /stop can no longer publish blog entries on its own judgment, /blog is the scan-first catch-up tool, /notebook is the NotebookLM pack refresh ritual.
- Assessed Graphify coverage: MCP tools are self-serve (live-probed: NL question → file:line answer, no coaching needed); no skill/command warranted. Real gap found instead: AGENTS.md was NOT auto-loading into Claude Code sessions (no CLAUDE.md existed) — fixed with a 4-line CLAUDE.md carrying an @AGENTS.md import.

### Completed
- Spec `docs/specs/2026-06-10-blog-notebook-commands-design.md` + plan `docs/plans/2026-06-10-blog-notebook-commands.md` (committed).
- `/stop` step 4 → blog gate: always asks Roi yes/no; "no" appends an owed one-liner to `blog/_pending.md`; never writes without a yes.
- New `.claude/commands/blog.md`: scan `_pending.md` + uncovered sessions → report with hooks → ask → write on explicit pick only; args = chosen topic, skip the ask.
- New `.claude/commands/notebook.md`: pack-rule read → truth diff → fresh/stale verdicts BEFORE edits → rewrite stale only → bump "current as of" date → manual re-upload checklist. No /stop nudge (Roi's call).
- Cleanups: dead `fb-stop` ref retired from `_pending.md`; `blog/README.md` "when written" section now documents ask-first.
- `CLAUDE.md` created (imports AGENTS.md every session). All pushed to origin/dev through `3cb86dc` (rebased over the parallel native-capabilities session's 5 commits, no collisions).

### User decisions / quotes
- Decision: standalone /blog = scan first then ask; declined blog at /stop → `_pending.md` owed line; /notebook = refresh + manual upload list; NO /stop nudge for /notebook (overrode his opening "i want stop to suggest these" — answer was the fresher call); structure = Approach A (two command files, stop edited in place, style rules single-sourced in blog/README.md); CLAUDE.md fix approved ("yes add it").
- Quote: "stop already writes an entery to blog and it supposed to ask or suggest it but im not sure i trust its dicision making so make it has to ask me before enteries"
- Quote: "i think its kinda messy in my mind so lets brainstorm about this"
- Quote: "i havent read it but i trust you, do you need to think deeper about it?"

### Agent decisions / assumptions / rationale
- Worked directly on `dev` (project convention for journal/tooling; no worktree/branch for 4 markdown edits).
- Rebased local commits over the parallel session's push rather than merging (no file overlap; linear history).
- No /graph command, no graphify skill: tools self-describing; PR tools (`triage_prs`, `get_pr_impact`) dormant in a direct-to-dev repo.
- Could not witness the @AGENTS.md import working from inside this session (imports resolve at session start) — needs a fresh-session check.

### Files read or touched
- Read: `.claude/commands/stop.md`, `blog/README.md`, `blog/_pending.md`, `AGENTS.md`, `docs/feather_notebooklm_pack/README.md`, journal pointers.
- Touched: `.claude/commands/{stop,blog,notebook}.md`, `blog/{_pending,README}.md`, `docs/specs/2026-06-10-blog-notebook-commands-design.md`, `docs/plans/2026-06-10-blog-notebook-commands.md`, `CLAUDE.md`.

### Open threads / unresolved questions
- Verify the @AGENTS.md import actually loads in a fresh session (ask the agent cold: "what's the Graphify rebuild verb?" — expect `graphify update .` without file reads).
- The new /stop blog gate is untested live until the next real /stop.
- Pre-existing threads untouched: observe-bug-fixes brainstorm (still the recommended next), native-capabilities placement (parallel session's thread, see 08:20 entry above).

### Next action
- Roi's call between the two open threads: resume observe-bug-fixes brainstorm (active.md's standing recommendation) or the native-capabilities placement analysis (08:20 bridge). The fresh session doubles as the @AGENTS.md import check.

### Next session should read
- `journal/context/active.md`
- `docs/specs/2026-06-10-blog-notebook-commands-design.md` (only if touching the new commands)

### Risks / blockers
- Two sessions pushed to `dev` concurrently today (had to rebase) — watch for tracker-file conflicts if parallel chats keep running.
