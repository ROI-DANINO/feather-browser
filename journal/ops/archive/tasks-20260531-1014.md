## In Progress

## Active
- [ ] Phase 2: Headless Core Prototype
  - [ ] Write the Phase 2 implementation plan from `docs/specs/phase-2-headless-core-prototype-plan.md`
  - [ ] Scaffold the minimal Node/TypeScript headless control service
  - [ ] Add configuration and Feather filesystem layout helpers
  - [ ] Add workspace/profile metadata and lock handling
  - [ ] Add Playwright persistent and disposable session lifecycle
  - [ ] Add localhost HTTP JSON transport and token-protected routes
  - [ ] Add launch, status, navigate, snapshot, extract, screenshot, debug bundle, and close commands
  - [ ] Add structured JSONL logs with credential redaction
  - [ ] Add per-session debug bundle artifacts
  - [ ] Add resource measurement scenario for new headless Chromium versus headless shell
  - [ ] Verify persistent storage, disposable cleanup, profile lock rejection, proxy launch metadata, API flow, debug bundle, and measurement output

## Done
- [x] Phase 2 Step 0: Research and plan Phase 2 prototype
  - [x] Define the smallest prototype scope around ADR-0002
  - [x] Choose localhost HTTP JSON as the first local API transport
  - [x] Define the workspace/profile configuration model
  - [x] Define session lifecycle, profile lock, and proxy launch behavior
  - [x] Define the first debug bundle and resource measurement plan
  - [x] Decide that real `yt-dlp` execution waits beyond the smallest Phase 2 prototype
  - [x] Write research findings in `research/2026-05-31-phase-2-headless-core-prototype-plan.md`
  - [x] Write prototype plan/spec in `docs/specs/phase-2-headless-core-prototype-plan.md`

- [x] Phase 0: Workspace setup
  - [x] Create project directory
  - [x] Create baseline directory structure
  - [x] Add roadmap, progress, phase, task, context, and log files
  - [x] Add `/start` and `/stop` command definitions
  - [x] Add `/init` orientation command and agent instructions
  - [x] Initialize git tracking
  - [x] Review Phase 0 setup with Roi

- [x] Phase 1: Research and Architecture Decision
  - [x] Step 0: Research and plan Phase 1
  - [x] Gather current primary-source research on browser architecture candidates
  - [x] Compare Electron, CEF, Qt WebEngine, Chromium fork/distribution, and Playwright persistent Chromium profile shell
  - [x] Evaluate daily-driver-first versus agentic-AI-first path
  - [x] Write research findings in `research/`
  - [x] Write architecture decision/spec in `docs/specs/`
  - [x] Update roadmap and project tracking files
  - [x] Verify task state and commit Phase 1 decision work

- [x] Phase 1 Restart: Headless Core Architecture Decision
  - [x] Step 0: Research and plan Phase 1 restart
  - [x] Re-evaluate architecture candidates for a headless-first core
  - [x] Compare Playwright-managed Chromium, Tauri/WebView, CEF, Qt WebEngine, Chromium fork/distribution paths, and Rust/C++ control-layer options
  - [x] Define non-goals: no GUI scaffolding, no Chrome-extension dependency, no full Chromium compile unless justified by research
  - [x] Specify the first internal automation API shape
  - [x] Specify profile/session/proxy isolation requirements
  - [x] Specify native/integrated feature strategy, including when to wrap mature open-source tools
  - [x] Write fresh research findings in `research/2026-05-31-headless-core-architecture-restart.md`
  - [x] Write a fresh architecture decision in `docs/specs/adr-0002-headless-core-foundation.md`
  - [x] Update roadmap and tracking files after the decision

## Superseded
- [x] Previous Phase 1 direction: Playwright-managed visible Chromium shell with extension compatibility
- [x] Previous Phase 2 plan: Minimal Browser Shell
