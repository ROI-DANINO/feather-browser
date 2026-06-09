# Session closeout — pi team: model lineup + Stage 2 + chain dispatch proven

**Timestamp:** 2026-06-09 06:08
**Phase:** 4a / Feather v1
**Thread:** pi_agency ⇄ Feather integration (thin, project-local `.pi/`)
**Prior-chat context folded:** `journal/context/next.md` Stage-1 bridge (2026-06-09 04:38).

## Done this session

- **Pi mechanics nailed down (from source + bundled docs, not priors):**
  - Pi reads **`AGENTS.md`** (then `CLAUDE.md`) as project context — **there is no `PI.md`.** Feather's root
    `AGENTS.md` already serves this. (`dist/core/resource-loader.js:30`.)
  - Project **`.pi/settings.json` overrides global** — so the parent/orchestrator model can be pinned
    **project-locally** with no blast radius to Roi's other Pi projects. (`docs/settings.md:3,272`.)
  - Chain run command = **`/run-chain <chainName> -- <task>`**; chains open a clarify/preview UI by default.
- **OpenRouter model lineup set per role** (committed `f873667`; orchestrator tweak folded this session):
  parent **qwen3.7-max**, planner **minimax-m3**, coder **glm-5.1**, operator **glm-5-turbo→glm-5.1**,
  validator **kimi-k2.6**, reviewer **opus-4.8**. Each agent has an OpenRouter fallback. (Roi swapped the
  operator off xiaomi/mimo to glm; coder confirmed glm-5.1 over qwen3-coder-plus — GLM leads agentic coding.)
- **RESOLVED the "skills wall" headline (was UNPROVEN):** subagents ARE walled by `inheritSkills:false` +
  `skills:` allowlist — Pi injects only those (`skills.ts` `resolveSkills`). The "all global skills appear"
  Roi saw is the **parent session's catalog**, which is global by design and unfixable per-project (no
  subtract mechanism) — cosmetic noise, never reaches the walled subagents. The prior "wall not holding"
  was a misread of which layer was showing the skills.
- **Stage 2 PASS (operator loop PROVEN):** trust accepted; project-scope team lists clean (4 feather.* +
  chain + builtins). Operator golden loop ran end-to-end (health→session→navigate→snapshot(markdown)→wait→
  screenshot→close), real 17.5KB PNG. First attempt was a **transient `glm-5-turbo` connection error**
  (slug is valid: openrouter.ai/z-ai/glm-5-turbo); clean re-run succeeded.
- **Subagent vs skill clarified:** dispatching a subagent is a parent CHOICE (a tool call it can shortcut).
  Solo "drive Feather" → the `feather-operator` SKILL is enough (parent drives inline; proven). The suite →
  the `showcase-run` CHAIN forces per-model coder/reviewer/validator dispatch (no shortcut).
- **Thin skill polished** (`.pi/skills/feather-operator/SKILL.md`): `wait` always needs a `target` (even
  `until:"stable"`); close = `DELETE /v1/sessions/:id` with **no** `Content-Type` header (empty body → 400).
- **Chain dry-run PASSED:** 4-step chain (planner→coder→reviewer→validator, 6m20s, no commits, clean blast
  radius). Planner (CONFIRMED minimax-m3 via UI badge) scoped one task + flagged/resolved a `browserMode`
  discrepancy BEFORE coding; coder wrote a clean **116-line `examples/showcase.sh`** stub (tri-state,
  mktemp+EXIT trap, verbatim quickstart helpers); opus-reviewer verified API vs source + Testing Honesty
  → PROCEED; validator stayed read-only (static checks + listed what it would run).

## Caveats found (the "stumbles" to fix next session)

1. **Model self-ID is unreliable.** Chain steps 2–4 self-reported "Claude" though configured glm-5.1/kimi.
   Only the planner's `minimax-m3` was confirmed *via the pi UI badge*. **Trust the UI badge, not prose** —
   and we do NOT actually know glm-5.1/kimi ran for steps 2–4. Verify next session.
2. **Chain output persistence breaks with inline task overrides.** Only `plan.md` persisted; coder/reviewer/
   validator outputs were streamed and lost, forcing a recovery re-run. **Use the chain's TEMPLATE VARS**
   (`{task}`, `{outputs.X}`) for the real suite, not fully-custom inline step tasks.
3. **~6m20s for one trivial task** — each step reloads spec/source. A 10-task suite this way is slow/costly.
4. **OpenRouter connection errors recurred** (operator first attempt; the parallel recovery re-run hit
   "Retry failed after 3 attempts"). Reliability watch-item — fallbacks didn't always rescue in time.

## Left unfinished / deferred

- Fix the 4 caveats above before running the suite.
- **(deferred) Task-intake format** — how Roi phrases task requests (goal/scope/constraints/success/gates
  template) feeding the planner. Plain-English ad-hoc is loose. The planner subagent already gives "plan
  before execute"; this is the separate intake contract. Roi: "later on, not now."
- **(deferred) `feather-journal` skill** — teach pi agents to document work/sessions in the repo journal.
- **Stage 3** — rebuild fresh `scratch` + create/warm new sacrificial Google + IG (Roi-gated, VPN optional).

## Next concrete action (per Roi)

Next session: **fix whatever we stumbled upon this session before running the suite**, then **re-run the
small tests** (operator loop + chain dry-run) to fish for more bugs (hoping for none). When that runs
clean, **resume to Stage 3** (sacrificial accounts) → full showcase suite (Phases A–D), running the chain
with template vars.

## Decisions

- OpenRouter lineup per role; orchestrator = qwen3.7-max (project-local override).
- Skill for solo ops, chain for the suite. Don't ditch subagents; don't force them for one-offs either.
- Keep `examples/showcase.sh` (the dry-run stub) as the suite's reviewed starting seed.
- Skills wall is **not a defect** — closed.

## Roi quotes (verbatim)

- "i want only the relevant agents ... i waant to make sure pi acts and uses feather as best as we can optimize it."
- "choose z-ai/glm-5.1 which i trust better than any xiaomi slop machine"
- "the idea is using only orchestrator and spawning agents only when needed right?"
- "we didnt settle yet on how i request actual tasks right? ... we need to work on how it plans what its going to do and how its going to tuckel chalenges before it actually starts. later on, not now."
- "next session i want to fix whatever we stumbled apone this session before we run the suite, run the small tests again to fish more bugs and problems ... when this works well, we resume to Stage 3"

## Next session should read

- This file + `journal/context/active.md`
- `.pi/` (agents/chains/skills/settings — the model lineup + polished skill)
- `docs/specs/2026-06-09-showcase-eval-suite-plan.md` (the suite the chain will build)
- `examples/showcase.sh` (the dry-run stub seed)
- `docs/specs/2026-06-09-pi-agency-feather-integration-{design,plan}.md`
