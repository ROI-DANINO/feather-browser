## Feather Browser — Session Memory
Last updated: 2026-05-31 1133

### Where we are
Phase 2 Headless Core Prototype is **complete**.
- 129 tests passing: 98 unit / 27 integration / 4 measurement
- Latest commit: `991c6e9` (proxy-redaction integration test)
- All 9 Phase 2 exit criteria implemented and covered by tests

### Next session options
1. **Manual verification** — run `docs/specs/phase-2-verification-checklist.md` against `npm run dev`
2. **Phase 3 planning** — decide next phase scope (yt-dlp adapter, GUI layer, etc.) using `/init` + research + plan

### Project structure
```
src/
  config.ts           loadConfig()
  fs-layout.ts        FeatherPaths + ensureDirs()
  browser/modes.ts    buildLaunchOptions()
  profiles/lock.ts    ProfileLock (file-based, ProfileLockedError)
  profiles/workspace.ts WorkspaceMetadata
  sessions/types.ts   all shared types
  sessions/session.ts FeatherSession (ses_ prefix)
  sessions/manager.ts SessionManager
  logs/redact.ts      redactProxy / redactUrl
  logs/events.ts      EVENTS const
  logs/logger.ts      FeatherLogger (JSONL)
  debug/capture.ts    DebugCapture
  debug/bundle.ts     DebugBundle
  commands/           9 handlers (launch/status/list/navigate/snapshot/extract/screenshot/debug-bundle/close)
  transport/middleware.ts  injectRequestId + createTokenAuth
  transport/routes.ts     all 9 routes + health, Zod schemas
  transport/http.ts       startHttpServer()
  index.ts            entry point, graceful shutdown
  measurement/
    sampler.ts        ProcessSampler
    runner.ts         MeasurementRunner
    reporter.ts       writeArtifacts
tests/
  unit/               98 tests (vitest)
  integration/        27 tests (real chromium-headless-shell)
  measurement/        4 tests (real chromium-headless-shell)
docs/specs/
  phase-2-verification-checklist.md  manual exit criteria checklist
```

### Known tech debt
- `routes.ts` uses `manager as any` for 4 handler constructors (Navigate, Snapshot, Extract, Screenshot) because their internal `IManager` interface expects `getPage()` → `{ pageId, page }` but `FeatherSession.getPage()` returns `Page` directly. Needs proper fix.

### Key flags for future sessions
- **Context compaction**: happened mid-session. If the agent seems confused about types/method signatures, grep the source — don't trust summaries.
- **Agent crash recovery**: background agents die if the CC process exits. Check `git log` before re-dispatching — partial commits survive.
- **No Docker/Podman**: containerization abandoned as too slow. Run `npm install` on host.
- **chromium-headless-shell**: default test mode. `chromium-new-headless` requires system Chrome; manual-only for now.

### Roi's preferences (observed)
- Likes parallel agent dispatch with task dependency graphs
- Prefers bare host installs over containers
- "research → plan → build → iterate" workflow
- Phase-gated: only current phase gets detailed tasks
- Wants a lightweight browser for personal use AND for agents (internal APIs)
