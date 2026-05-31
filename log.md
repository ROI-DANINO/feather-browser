# Event Log

Format: `YYYY-MM-DD | ACTION | source -> target | note`

---

2026-05-31 | SETUP | conversation -> feather-browser/ | Created project directory and began Phase 0 workspace setup.
2026-05-31 | UPDATE | conversation -> AGENTS.md | Added project instructions and `/init` timing rule.
2026-05-31 | PHASE | phase-0 -> phase-1 | Accepted Phase 0 setup for this session and activated Phase 1 research and architecture decision.
2026-05-31 | RESEARCH | web -> research/2026-05-31-browser-architecture-options.md | Compared Electron, CEF, Qt WebEngine, Chromium fork/distribution, Playwright persistent Chromium profile shell, and WebView2/Tauri.
2026-05-31 | DECISION | research -> docs/specs/adr-0001-browser-foundation.md | Selected Playwright-managed persistent Chromium profile plus local shell/control UI for Phase 2 planning.
2026-05-31 | PHASE | phase-1 -> phase-2 | Completed Phase 1 and opened Phase 2 Step 0 planning.
2026-05-31 | STOP | conversation -> ops/sessions/phase-2-planning-handoff-20260531-0642.md | Paused before Phase 2 Step 0 and wrote fresh-chat goal prompt.
2026-05-31 | PIVOT | conversation -> project docs | Restarted Phase 1 around a headless-first browser core, native/integrated features, and GUI-later roadmap.
2026-05-31 | SUPERSEDE | docs/specs/adr-0001-browser-foundation.md -> phase-1-restart | Marked previous visible-shell architecture decision as superseded.
2026-05-31 | HANDOFF | conversation -> ops/sessions/phase-1-headless-core-restart-20260531.md | Wrote fresh restart handoff and updated `.remember/remember.md`.
2026-05-31 | RESEARCH | web -> research/2026-05-31-headless-core-architecture-restart.md | Compared current headless-core candidates against the restarted Phase 1 criteria.
2026-05-31 | DECISION | research -> docs/specs/adr-0002-headless-core-foundation.md | Selected Playwright-managed Chromium headless core with persistent isolated profiles and a Feather-owned local control service.
2026-05-31 | PHASE | phase-1-restart -> phase-2 | Completed restarted Phase 1 and activated Phase 2 Step 0 planning.
2026-05-31 | RESEARCH | web -> research/2026-05-31-phase-2-headless-core-prototype-plan.md | Researched and narrowed the smallest Phase 2 headless core prototype around ADR-0002.
2026-05-31 | SPEC | research -> docs/specs/phase-2-headless-core-prototype-plan.md | Planned the Phase 2 prototype scope, API transport, session/profile/proxy model, debug bundle, resource measurement plan, and yt-dlp boundary.
2026-05-31 | TASKS | docs/specs/phase-2-headless-core-prototype-plan.md -> ops/tasks.md | Marked Phase 2 Step 0 complete and queued implementation-plan/build tasks without starting code.
