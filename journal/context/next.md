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
