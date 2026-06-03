# Session Handoff — s2-brainstorm-start — 2026-06-03 04:36

## What Happened

- Ran health check: 129 unit + 32 integration tests passing (confirmed baseline clean)
- Updated `work/browser/context.md` — was stale from Phase 1; now reflects S2 scope and key decisions
- Saved feedback memory: load desk context without asking
- Pulled remote dev branch — 8 new research commits (GPT repo audit + competitive landscape scan)
- Triaged all 7 GPT audit findings against local planning files (see table below)
- Fixed bot-detection wording in ROADMAP.md → committed (53ac42d)
- Started S2 brainstorm — completed context exploration, found a real bug, expanded scope

## Key Finding — Duplicate Tab Registration Bug

`FeatherSession.openTab()` calls `context.newPage()` which fires `context.on("page")` in `manager.ts` → `session.addPage(page)`. Then `openTab()` also calls `this._pages.set(pageId, page)` directly. Same Playwright Page object gets two different Feather page IDs. Not caught by any test (unit tests mock Playwright). Must fix before TAB_UPDATED.

## Chromium Finding (corrects spike doc)

- System Chromium available from standard Fedora `updates` repo — NOT RPM Fusion non-free (spike doc was wrong)
- RPM Fusion is already enabled anyway
- Version: 148.0.7778.215 — same major as Playwright bundled 148.0.7778.96 → version skew risk LOW
- Playwright already has two builds in `~/.cache/ms-playwright/`:
  - `chromium-1223/` → 377 MB (new headless, "Google Chrome for Testing 148")
  - `chromium_headless_shell-1223/` → 260 MB (what we currently use)
- `sudo dnf install chromium` → 116 MB download, 318 MB installed, lands at `/usr/bin/chromium`
- Weight win only materializes when user already has Chromium — installing it just for feather doesn't save weight

## GPT Audit Triage

| Item | Status | Action |
|---|---|---|
| Duplicate tab registration in `openTab()` | Valid, unplanned — real bug | Added to S2 |
| `getPageInfoList()` brittle on page close | Valid, unplanned | Added to S2 observability |
| DebugCapture trace e2e reachability | Already planned (S2) | Covered |
| Fastify v5 / SSE compat | Already planned (S3) | Covered |
| FEATHER_CHROMIUM_PATH | Already planned (S2) | Covered |
| Docs ahead of product reality | Largely covered by docs-map | No new task |
| "bot detection" wording in ROADMAP.md | Fixed this session | Done |

## S2 Scope (finalized — 4 items, up from 3)

1. **Fix duplicate tab registration** — make `context.on("page")` the single registration source; `openTab()` calls `newPage()` and returns the ID the listener assigned. Prerequisite for TAB_UPDATED.
2. **FEATHER_CHROMIUM_PATH** — add to `config.ts`, wire `executablePath` in `modes.ts`. Requires spike first: `sudo dnf install chromium`, then run probe from S1 plan Task 11 Step 2.
3. **TAB_UPDATED** — emit on top-level navigation. Scope question pending: navigation only (URL + title on `framenavigated`) vs navigation + load state transitions (`domcontentloaded`, `load`).
4. **Observability hardening** — capture.ts trace e2e verification + `getPageInfoList()` best-effort (per-page try/catch, `loadState: "unknown"` on failure).

## S2 Brainstorm Status

- Brainstorm is MID-FLOW via `/brainstorm` skill
- Context exploration: DONE
- Clarifying questions: PARTIAL — got to TAB_UPDATED scope question, then stopped
- Approaches: NOT YET PRESENTED
- Design doc: NOT YET WRITTEN

## Next Session

1. `/start` → invoke `superpowers:brainstorming` skill
2. Resume at TAB_UPDATED scope question: navigation only vs navigation + load state transitions
3. Continue through approaches → design → doc → plan

## Roi Quotes

- "what will it install? isnt it installed yet? is it the full chromium browser or only what we need for the project?"
- "fix the bot detection wording now"
- "should you load? i think you should, when should you not read it lol"
- "pull from git hub the dev branch and see if the new commits relevant for this session"
- "i want to /stop now and resume the brainstorm in a frash session"

## Strategic Notes (from research intake)

- Hermes = planned orchestration layer; OpenClaw = research reference only, not a dependency
- Feather positioning: "local, inspectable browser runtime for human-approved agentic automation" (not "AI browser")
- Observability (logs, traces, replayability) validated as a first-class Feather strength
- MCP: remain protocol-aware but don't commit to hub architecture before MCP spec final (2026-07-28)
- Research intake files in `raw/_inbox/2026-06-03-*.md` — not yet triaged into canonical `research/`
