# Active — state owner (where we are, what's next)

This is the single owner of current state + next action. Task checklist → `journal/ops/tasks.md`;
destination → `ROADMAP.md`; history → `journal/log.md` + `ops/sessions/`.

## Now

**✅ CLAUDE-COUNCIL PLUGIN INSTALLED (2026-06-06).**
- `/claude-council:ask` and `/claude-council:status` commands live.
- `council-advisor` agent installed (proactively suggests council on arch decisions + debug dead-ends).
- All provider scripts in `.claude/plugins/claude-council/scripts/`; skills in `skills/council-execution/`, `skills/deep-execution/`, `skills/provider-integration/`.
- Branch: `claude/install-claude-council-plugin-Q011s` (pushed).

## Recommend next

**▶ Run `/claude-council:ask` on feather-browser.** Start with `/claude-council:status` to verify which providers are configured, then ask a real question about the project (Phase 4b shell architecture, cookie-isolation approach, vault design — anything with genuine tradeoffs). Needs at least one API key in env: `GEMINI_API_KEY`, `OPENAI_API_KEY`, `XAI_API_KEY`, or `PERPLEXITY_API_KEY`.

---

**(History — superseded by claude-council install above.)**
**✅ HERO DEMO HARDENED + SUPERPOWERS INSTALLED (2026-06-06).** Login Continuity (`ensureHumanAuth`), burner profile isolation (`FEATHER_DIR`/`FEATHER_WARM_WORKSPACE`), `@obra/superpowers` extension. LinkedIn debut recording still pending (only step left on that track).
