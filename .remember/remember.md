# Handoff — 2026-06-03

## Where We Are

**S2 brainstorm in progress.** Branch: `dev`.

S1 + Task 6b complete. S2 brainstorm started this session but stopped mid-flow.

## What's Next

Fresh session → **`/start`** → **invoke `superpowers:brainstorming` skill** → resume S2 brainstorm.

### Resume point: TAB_UPDATED scope question

> Navigation only (URL + title on `framenavigated`) vs navigation + load state transitions (`domcontentloaded`, `load`) too?

After that: approaches → design → design doc → `writing-plans` skill → S2 implementation plan.

## S2 Scope (4 items — finalized this session)

1. **Fix duplicate tab registration bug** — `openTab()` + `context.on("page")` both register same page under different IDs. Must fix before TAB_UPDATED. Single source: make listener the only registration path.
2. **FEATHER_CHROMIUM_PATH** — spike first (`sudo dnf install chromium` — Fedora `updates` repo, NOT RPM Fusion), then add to `config.ts` + wire `executablePath` in `modes.ts`.
3. **TAB_UPDATED** — navigation event on top-level frame. Scope TBD (see resume point above).
4. **Observability hardening** — capture.ts trace e2e + `getPageInfoList()` best-effort per-page (try/catch, `loadState: "unknown"`).

## Key Findings This Session

- **Chromium**: standard Fedora `updates` repo (not RPM Fusion — spike doc was wrong). Version 148 same as bundled. Low skew risk. 116 MB download / 318 MB installed.
- **Playwright cache**: already has `chromium-1223/` (377 MB) + `chromium_headless_shell-1223/` (260 MB).
- **ROADMAP.md fixed**: "without triggering bot detection" → "operating inside explicit user-authorized session state with human approval checkpoints" (commit 53ac42d).
- **GPT repo audit** (8 commits pulled from remote): 7 findings triaged. Only real new bug = dup-tab-reg.

## Strategic Notes (research intake this session)

- Hermes = orchestration layer above Feather. OpenClaw = research reference only.
- Positioning: "local, inspectable browser runtime for human-approved agentic automation."
- 7 research files in `raw/_inbox/2026-06-03-*.md` — not yet triaged to canonical `research/`.
- MCP: protocol-aware but don't commit to hub design before 2026-07-28 spec final.

## Blog Status

- `blog/0002` ✅. Next entry: at S2 exit via `/blog-entry`.

## Program Structure

- **S1 — Foundation** ✅
- **Task 6b** ✅
- **S2 — Linux weight & observability** ← ACTIVE (brainstorm mid-flow)
- **S3 — Currency & security** (after S2)
- → Phase 4 Step 0

## How Roi Works

- Vibecoder, no technical background. Make technical calls, explain plainly.
- Feedback this session: load desk context (`work/<desk>/context.md`) without asking.
- Research-driven; phases → tasks; security matters; one session per chunk.
