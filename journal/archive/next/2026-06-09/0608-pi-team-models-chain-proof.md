# Next — Context Bridge

_Empty active buffer. Prior entries through 2026-06-09 were consumed by the `/stop` on 2026-06-09 (showcase plan +
pi_agency/Codex execution pivot) and archived to
`journal/archive/next/2026-06-09/0219-stop-bundle-showcase-plan-pi-handoff.md`._

---
## 2026-06-09 04:38 — pi_agency ⇄ Feather thin integration (Stage 1 built; skills-wall NOT holding at runtime)

### Session pointer
- Roadmap/session pointer: Phase 4a / v1. New thread = "pi_agency ⇄ Feather integration (thin)".
  Spec `docs/specs/2026-06-09-pi-agency-feather-integration-design.md`; plan
  `docs/specs/2026-06-09-pi-agency-feather-integration-plan.md`. This is Claude doing the grounding
  (replaces the Codex-setup framing); pi team still runs the showcase suite.

### Summary
- Decided: thin, project-local `.pi/` so Roi's pi team can drive Feather inside this repo only. Heavy
  "Feather-as-native-Pi-tool/MCP" integration deferred to v2/v3 (Phase 5e).
- Built + committed Stage 1 (`.pi/` config). BUT Roi ran Pi and **all global skills still appear** — the
  trust wall is not holding at the parent-session level (see Open threads). This is the headline issue.

### Completed
- Spec written, reviewed by Roi (ChatGPT-assisted), folded 5 changes, committed (`35b492c`, `bbec46b`).
- Implementation plan written + committed (`a2a27c0`); VPN marked optional/deferred (`c1903ef`).
- Stage 1 `.pi/` authored + committed (`91754f6`): `.pi/settings.json` (no skills/packages),
  `.pi/agents/{coder,validator,opus-reviewer,operator}.md` (package `feather`, `inheritSkills:false`,
  `skills:feather-operator`), `.pi/chains/showcase-run.chain.md`, `.pi/skills/feather-operator/SKILL.md`.
- Structural wall checks passed (file-level only).

### User decisions / quotes
- Decision: heavy integration later; thin now. VPN dismissed for now ("my accounts arnt in that kind of
  risk to subotaj the eval testings").
- Decision: keep workspace name `scratch` but rebuild fresh with NEW sacrificial Google+IG accounts before
  the suite (Stage 3); pre-suite account creation = first autonomous Feather op, Roi-gated.
- Quote (NEXT-SESSION TASK): "next session i want you to walk me throgh the piagents configs and existence.
  when i run it now it has all the global skills, i want only relevant skills (feather and pi-subagents +
  feather journal logic to document theire work and sessions as we like to do in this project)"

### Agent decisions / assumptions / rationale
- Grounded the whole design in pi-subagents v0.28.0 source: project scope = `<cwd>/.pi/...`
  (`agents.ts:242/788/803/320/258`); force scope via create `scope:project` + run `agentScope:project`
  (`schemas.ts:253/271`); skills allowlist via frontmatter `skills:` + `inheritSkills:false`
  (`agent-management.ts:261-264`, parsed `agents.ts:654`).
- LIKELY CAUSE of "all global skills" (to verify next session): `inheritSkills:false` only controls what a
  **subagent** inherits. The **parent Pi session** loads skills from global `~/.pi/agent/settings.json`
  `skills: ["+skills/hebrew-*"...]` regardless of project. So restricting skills needs the PARENT session
  scoped too — not just the subagent flag.

### Files read or touched
- Touched (committed): `.pi/**`, `docs/specs/2026-06-09-pi-agency-feather-integration-design.md`,
  `docs/specs/2026-06-09-pi-agency-feather-integration-plan.md`.
- Read (pi internals): `~/.pi/agent/settings.json` (global skills array = the suspect),
  `~/.pi/agent/npm/node_modules/pi-subagents/src/agents/{agents,agent-management,skills,agent-scope}.ts`,
  `pi_agency/.pi/{settings.json,agents/*,chains/*,skills/roi-agent-operations}`.

### Open threads / unresolved questions
- **Skills wall not holding at runtime (HEADLINE).** Find how the parent Pi session loads skills and how to
  scope it to this project only. Candidates: project `.pi/settings.json` `skills` with `-`/disable entries;
  a `--skills`/exclude mechanism; or per-agent `systemPromptMode:replace` + explicit allowlist already
  covers subagents but not the parent. Research `pi-subagents/src/agents/skills.ts` enable/disable (`+`/`-`)
  semantics and global-vs-project precedence.
- Desired skill set for this project: **feather-operator** + **pi-subagents' own package skills** + a NEW
  **feather-journal** skill (teach the pi agents to document their work/sessions in the repo journal the way
  this project does — RDW-style log/next/session discipline).
- Stage 2 (behavioral verify: `/agents`, `subagent get`, loop test) still unrun.

### Next action
- Walk Roi through each `.pi/` agent/chain/skill (what it is, why it's there), THEN fix the skills wall so
  only feather + pi-subagents + a new feather-journal skill are active (kill the global Hebrew/content skills
  for this project), then run Stage 2.

### Next session should read
- `docs/specs/2026-06-09-pi-agency-feather-integration-design.md`
- `docs/specs/2026-06-09-pi-agency-feather-integration-plan.md`
- `~/.pi/agent/npm/node_modules/pi-subagents/src/agents/skills.ts` (enable/disable + scope precedence)
- `~/.pi/agent/settings.json` (global skills array) + `.pi/settings.json`
- `pi_agency/.pi/skills/roi-agent-operations/` (pattern for a project skill)

### Risks / blockers
- My "wall holds" claim was FILE-LEVEL only; Roi's live run disproved it for the parent session. Treat the
  wall as unproven until Stage 2 passes (Testing Honesty).
- Need a `feather-journal` skill design (what/when the pi agents log) — small brainstorm before building.
