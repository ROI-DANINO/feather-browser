---
updated: 2026-06-03
session: repo-cleanup-journal
---

## Active Plan

Program: Stabilization & Linux-Readiness (bridges Phase 3 → Phase 4)
Spec: docs/specs/2026-06-03-stabilization-linux-readiness-design.md
Sub-phase: **S2 — Linux weight & observability** (brainstorm in progress)
Branch: dev (pushed to origin/dev)

## Last Session (detour — repo professionalization)

Not S2 work. Consolidated all workflow scaffolding into `journal/`, added Apache-2.0
LICENSE, made the repo a real public OSS project. Also: added conditional desk-context
reconciliation to `/stop`; fixed `/blog-entry` to read all sessions since last entry;
wrote `blog/0003`. Spec: `docs/specs/2026-06-03-repo-structure-cleanup-design.md`.
**Note:** operating files now live under `journal/` (was `context/`, `ops/`, `work/`,
`raw/`, `log.md`, `schema.md`→`journal/README.md`, `docs/docs-map.md`→`journal/docs-map.md`).

## Immediate Next Action

Fresh session → `/start` → invoke `superpowers:brainstorming` skill → resume S2 brainstorm.

**Brainstorm is mid-flow.** Resume at TAB_UPDATED scope question:
> Navigation only (URL + title on `framenavigated`) vs navigation + load state transitions (`domcontentloaded`, `load`) too?

Then: approaches → design → design doc → implementation plan.

## S2 Scope (4 items — finalized)

1. **Fix duplicate tab registration** — `openTab()` + `context.on("page")` both register the same page. Make listener the single source. Prerequisite for TAB_UPDATED.
2. **FEATHER_CHROMIUM_PATH** — add env var to `config.ts`, wire `executablePath` in `modes.ts`. Spike first: `sudo dnf install chromium` (Fedora `updates` repo, not RPM Fusion), then probe from S1 plan Task 11 Step 2.
3. **TAB_UPDATED** — top-level navigation event. Scope pending.
4. **Observability hardening** — capture.ts trace e2e + `getPageInfoList()` best-effort per-page.

## Key Findings This Session

- **Duplicate tab registration bug**: `FeatherSession.openTab()` calls `context.newPage()` → fires `context.on("page")` → `addPage()`. Then `openTab()` also sets `_pages` directly. Two IDs for one page. Not tested.
- **System Chromium**: available from standard Fedora `updates` repo (NOT RPM Fusion — spike doc was wrong). Version 148.0.7778.215 — same major as bundled 148.0.7778.96. Low version-skew risk.
- **ROADMAP.md wording fixed**: "without triggering bot detection" → "operating inside explicit user-authorized session state with human approval checkpoints" (commit 53ac42d).

## Program Structure

- **S1 — Foundation** ✅ COMPLETE
- **Task 6b** ✅ COMPLETE
- **S2 — Linux weight & observability** ← ACTIVE (brainstorm in progress)
- **S3 — Currency & security** (after S2; gated by fastify-sse-v2 spike)
- → Exit: hand off to ROADMAP Phase 4 Step 0

## Key Decisions (cumulative)

- Phase 0/1/2/3 complete. Phase 3 merged to master 2026-06-03. Do not reopen.
- **Feather = Linux-only (Fedora target).**
- **Runtime: host-primary**; Flatpak distribution later; Podman optional (ADR-0004).
- **Agentic North Star**: token/context efficiency standing constraint; tool choice deferred to Phase 5 Step 0 after 2026-07-28 MCP spec final (ADR-0005).
- **Electron eliminated.** Phase 4 shell candidates: Tauri/WebKitGTK or GTK4-native.
- **fastify-sse-v2**: peerDep `>=4` covers v5 by range but only tested against v4 — NOT proven. S3 must test.
- **Hermes** = planned orchestration layer above Feather. **OpenClaw** = research reference only.
- **Positioning**: "local, inspectable browser runtime for human-approved agentic automation" — not "AI browser."
- "Leave the docs true" = permanent per-phase exit check.
- Blog cadence: write/refresh at every phase exit via `/blog-entry`.
- **License = Apache-2.0** (copyright Roi Danino). Revisit AGPL+commercial only at traction.
- **`journal/` = visible workflow home** (build-in-public: organize the process, don't hide it).
- **Branch policy**: merge dev→master only at a stable/mergeable milestone; otherwise push remote `dev` only.

## How Roi Works

- Vibecoder, no technical background — make the technical calls, explain plainly, only ask decisions that are genuinely his.
- Research-driven; phases → tasks; agility; security matters; one session per chunk with documented handoffs.
- Push back and propose smarter structure when warranted.

## Reference Files

- AGENTS.md — constraints, branch rules, command usage
- journal/docs-map.md — source-of-truth table for all doc surfaces
- Program spec: docs/specs/2026-06-03-stabilization-linux-readiness-design.md
- S1 plan: docs/plans/2026-06-03-s1-foundation.md
- ADR-0003: docs/specs/adr-0003-hybrid-browser-shared-context.md
- ADR-0004: docs/specs/adr-0004-runtime-target.md
- ADR-0005: docs/specs/adr-0005-agentic-north-star.md
- Spike results: journal/raw/_inbox/spike-fastify-sse-v2-v5-compat.md, journal/raw/_inbox/spike-system-chromium-executablepath.md
- Research intake: journal/raw/_inbox/2026-06-03-*.md (7 files — not yet triaged to canonical research/)
- Session handoff: journal/ops/sessions/s2-brainstorm-start-20260603-0436.md
