## In Progress

## Active
- [ ] Phase 2 → Phase 3 transition
  - [ ] Manual verification: run `docs/specs/phase-2-verification-checklist.md` against live service
  - [ ] Phase 3 planning: decide next phase scope (yt-dlp adapter, GUI layer, or other)

## Done
- [x] Phase 2: Headless Core Prototype — Implementation (COMPLETE, 2026-05-31)
  - [x] Part 1: scaffold, config, FS layout, types, redaction, profile lock, browser modes (30 tests)
  - [x] Part 2: FeatherSession, SessionManager, FeatherLogger, DebugCapture, DebugBundle (56 tests)
  - [x] Part 3: all 9 command handlers (98 unit tests)
  - [x] Part 4: Fastify HTTP transport, token middleware, routes, src/index.ts, 7 integration tests
  - [x] Part 5a: api-flow integration test (9 tests)
  - [x] Part 5b: profile-lock integration test (4 tests)
  - [x] Part 5c: disposable-cleanup integration test (3 tests)
  - [x] Part 5d: proxy-redaction integration test (4 tests)
  - [x] Part 5e: ProcessSampler, MeasurementRunner, writeArtifacts reporter
  - [x] Part 5f: measurement scenario test (4 tests)
  - [x] Part 5g: manual verification checklist

- [x] Phase 2 Step 0: Research and plan Phase 2 prototype
- [x] Phase 2: Write implementation plan (5 files, docs/superpowers/plans/)
- [x] Phase 1 Restart: headless core ADR (ADR-0002)
- [x] Phase 1: browser architecture research and ADR (ADR-0001, superseded)
- [x] Phase 0: workspace setup
