# Session — claude-council install (2026-06-06 21:56)

## Done

- Installed `claude-council` plugin v2026.6.1 from `github.com/hex/claude-council` (manual install — plugin marketplace not available in this env).
- Created full directory structure:
  - `.claude/commands/claude-council/ask.md` — `/claude-council:ask` command (live immediately)
  - `.claude/commands/claude-council/status.md` — `/claude-council:status` command
  - `.claude/agents/council-advisor.md` — proactive advisor agent (suggests council on arch decisions + debug dead-ends)
  - `.claude/plugins/claude-council/scripts/` — all provider scripts (Gemini, OpenAI, Grok, Perplexity, codex CLI, gemini CLI) + lib/
  - `skills/council-execution/`, `skills/deep-execution/`, `skills/provider-integration/` — supporting skills
- Updated `.gitignore` to track `.claude/agents/` and `.claude/plugins/` (previously only `.claude/commands/` was tracked).
- Resolved `${CLAUDE_PLUGIN_ROOT}` → `.claude/plugins/claude-council` in all markdown files (scripts self-locate via `BASH_SOURCE`).
- Committed + pushed to `claude/install-claude-council-plugin-Q011s` (32 files, 3566 insertions).

## Prior session (folded from next.md)

- Hero demo hardened: `ensureHumanAuth` continuity, `FEATHER_DIR`/`FEATHER_WARM_WORKSPACE` burner isolation, `@obra/superpowers` installed.
- Burner profile ready at `/run/user/1000/feather-demo`.
- LinkedIn debut recording still pending.

## Next

Run `/claude-council:ask` on feather-browser — get multi-model perspectives on an architectural decision or open question in the project. Requires at least one provider API key set (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `XAI_API_KEY`, or `PERPLEXITY_API_KEY`). Run `/claude-council:status` first to verify connectivity.
