# Active — state owner (where we are, what's next)

This is the single owner of current state + next action. Task checklist → `journal/ops/tasks.md`;
destination → `ROADMAP.md`; history → `journal/log.md` + `ops/sessions/`.

## Now

**✅ AGENT BROWSING STACK — ALL 3 SPEC SESSIONS DONE (2026-06-07).** Brief: `docs/specs/2026-06-07-agent-browsing-stack-brief.md`. All specs carry design + plan. No phase numbers yet — roadmap re-sequencing pass assigns them.

- **Feature 1 — Stealth Stack ✅** spec+plan rev 2 (commits `bb3c065`/`8a46065`, local dev, unpushed to origin).
  Docs: `docs/specs/2026-06-07-stealth-stack-{design,plan}.md`. Audit: `research/2026-06-07-council-audit-stealth-stack.md`.
  Secure/assisted mode model; fingerprint layers always-on; kinematic input = spike-first.

- **Feature 2 — MFA Handler ✅** spec+plan (14 TDD tasks, composable).
  Docs: `docs/specs/2026-06-07-mfa-handler-{design,plan}.md`.
  Scope: TOTP + SMS + push. Approach B (Feather types code, agent never sees it). Telegram seam designed in.

- **Feature 3 — Identity Model ✅** spec rev 2 + plan (13 TDD tasks, self-contained).
  Docs: `docs/specs/2026-06-07-identity-model-{design,plan}.md`. Session: `ops/sessions/agent-browsing-stack-identity-spec-20260607.md`.
  Identity ID = workspaceId. Warm-status via event bus. PATCH omitted v1. vaultRef dormant. 3 guardrails: no cloud sync, 1:1:1 mapping, no RBAC.

**✅ OPEN-SOURCE INTEGRATION RESEARCH DONE (2026-06-07).** Research doc: `research/2026-06-07-open-source-integration-research.md`. Constraint block in tasks.md must be incorporated in the re-sequencing pass.

**✅ BURNER DEMO FULLY WORKING (2026-06-06, `a2e9ec9`).** `npm run demo:hero` — gating: needs a Niri/Wayland screen recorder (Kooha / wf-recorder).

## Recommend next

**▶ Roadmap re-sequencing pass.** All 3 plans are written; now assign phases/milestones, incorporate integration research constraints, and cut into work sessions. Read all 3 plans + the constraint block in tasks.md. Output: updated `ROADMAP.md` + revised `journal/ops/tasks.md` with phased work sessions.

**Also pending before re-sequencing:** push local `dev` commits (`bb3c065`, `8a46065`, MFA+Stealth specs) to `origin/dev`. These are on the local branch but not remote.

Alternatives: process inbox files (Track C), or install screen recorder and record hero demo (Track A).

**⚑ ROADMAP RE-SEQUENCING CONSTRAINT (2026-06-07):** When assigning tasks and phases during the
re-sequencing pass, incorporate findings from `research/2026-06-07-open-source-integration-research.md`:
- **Stealth Stack implementation sprint:** evaluate `fingerprint-injector` + `fingerprint-generator`
  + `idcac-playwright` (independent npm packages, no AGPL) before building fingerprint injection from scratch.
- **CDP/WS endpoint exposure:** add to Feather's `LaunchSession` response — unlocks Browser Use + Crawl4AI
  agent attach with zero further Feather changes (high-leverage, low-effort).
- **Markdown extraction (snapshot upgrade):** port Crawl4AI's `DefaultMarkdownGenerator` logic to TS —
  add `markdown` output to snapshot command; highest-leverage content-quality improvement.
- **MCP surface (Phase 5):** once built, a ~200-line `FeatherBrowserTool` makes Feather a browser
  runtime for OpenHands agents; Maxun sidecar HTTP path also becomes available.
- **Maxun AGPL:** permanent blocker — never import code; schema patterns only.

---

**(History — superseded.)**
**✅ CLAUDE-COUNCIL PLUGIN INSTALLED (2026-06-06).** `/claude-council:ask` + `/claude-council:status` live; `council-advisor` agent. Pending: run it on a real project question (needs API key).
**✅ HERO DEMO HARDENED + SUPERPOWERS INSTALLED (2026-06-06).** Login Continuity, burner profile isolation, `@obra/superpowers` extension.
