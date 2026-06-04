# Branching Strategy — Domain Research Intake

- **Date:** 2026-06-03
- **Status:** Research intake / question gate
- **Scope:** Strategic long-term branch structure for Feather
- **Important:** This is not a branching decision, roadmap change, ADR, or implementation plan.
- **Requested by:** Roi

---

## Purpose

Prepare a research-based branching strategy for Feather by first identifying the real architectural domains and asking Roi clarifying questions before recommending any branch model.

This note intentionally avoids final branch names and final workflow rules. Its job is to capture:

1. Current project constraints.
2. Existing source-of-truth documents reviewed.
3. Preliminary domain map.
4. Domain risk/isolation analysis.
5. Questions that must be answered before a branching strategy is proposed.
6. Documentation surfaces likely affected by any future branching decision.

---

## Sources reviewed

Canonical / operational sources:

- `AGENTS.md`
- `ROADMAP.md`
- `PROGRESS.md`
- `journal/docs-map.md`
- `journal/context/active.md`
- `journal/ops/tasks.md`
- `journal/work/browser/context.md`

Architecture / decision sources:

- `docs/specs/adr-0003-hybrid-browser-shared-context.md`
- `docs/specs/adr-0004-runtime-target.md`
- `docs/specs/adr-0005-agentic-north-star.md`
- `docs/specs/2026-06-03-stabilization-linux-readiness-design.md`
- `docs/specs/2026-06-03-s2-tab-layer-observability-design.md`

Vision / inbox sources:

- `journal/raw/_inbox/2026-06-03-ai-browser-ecosystem-index.md`
- `journal/raw/_inbox/2026-06-03-platform-agnostic-feather-vision.md`

---

## Current branching baseline

`AGENTS.md` currently defines a simple structure:

```text
master  ← stable source of truth, never broken
  └─ dev  ← all Phase 3 work, bug fixes, new features
       └─ ui-playground  ← headed browser sandbox, never merges to master directly
```

Current rules:

- Target `dev` for all work.
- Never commit directly to `master`.
- AI-generated branches merge into `dev` for human review before graduating to `master`.
- `ui-playground` is a one-way sandbox; graduating work is cherry-picked to `dev`, not merged directly.

Observation: this model is good for the current small/core phase, but may become too flat once Phase 4 shell, Phase 5 agent runtime, provider-agnostic integrations, skills, MCP, and security models begin moving independently.

---

## Current project state relevant to branching

### Stable / current core

Feather currently has a working headless browser core:

- Playwright-managed Chromium foundation.
- Local Fastify HTTP API.
- Session/profile/workspace model.
- Token auth.
- JSONL logs.
- Debug bundles.
- SSE event stream.
- Tab/page lifecycle foundations.
- Unit and integration test baseline.

Current active work is S2: tab-layer correctness and observability.

### S2 active scope

S2 currently has three unblocked items:

1. Duplicate tab registration fix.
2. `TAB_UPDATED` event.
3. Observability hardening.

`FEATHER_CHROMIUM_PATH` / system Chromium is deferred as a follow-on because it belongs to a different theme: Linux weight, not tab correctness.

### Phase 4 future scope

Phase 4 introduces the visual desktop shell:

- Zen-inspired layout.
- Vertical tab sidebar.
- Browser surface.
- Workspace/profile controls.
- Command palette.
- Theme/layout configuration.
- RTL handling.
- Import/export settings.
- Long-running primary human session.

Phase 4 explicitly excludes agent panels, chat sidebar, and LLM controls.

### Phase 5+ future scope

Phase 5+ introduces agent runtime / daily hardening:

- Cookie Mine agent tab requests.
- Local MCP-compatible hub.
- Hermes integration, if still relevant.
- Credentials vault.
- Human approval checkpoints.
- Agent chat sidebar.
- Context shrinker / token optimizer.
- Atomic agent action protocol.
- Scripted recipes.
- Headless screencast / viewport preview.
- User-to-agent tab handoff.
- yt-dlp adapter.
- Scraping reliability / session realism.
- Stability, performance, security, update strategy.

ADR-0005 explicitly defers agent tooling selection until Phase 5 Step 0 after the MCP spec finalization date.

---

## Vision constraints that affect branching

### 1. Human browser is foundational

ADR-0003 makes Phase 4 architecturally foundational, not cosmetic. The human browser session owns the persistent trust context that Phase 5 agents depend on.

Branch implication: shell work is not merely UI polish. It can change runtime assumptions, session lifetime, profile ownership, and event consumption.

### 2. Runtime target is host-primary

ADR-0004 decides:

- Daily-driver runs host-primary.
- Flatpak is the eventual distribution sandbox.
- Podman is optional for headless/CI only.
- Browser binary path must remain decision-independent and configurable.

Branch implication: runtime/packaging experiments can affect core launch code and should be isolated when they involve system Chromium, Flatpak, Wayland, GPU, or credential access.

### 3. Agent layer is a design constraint, not current build scope

ADR-0005 decides:

- Token/context efficiency is a standing constraint.
- Tool selection is deferred.
- S2 observability should remain compact and agent-friendly.
- No agent tooling is built during stabilization.

Branch implication: agent experiments should not be allowed to leak into core branches until Phase 5 Step 0 makes explicit decisions.

### 4. Platform-agnostic vision broadens scope

The platform-agnostic vision note suggests Feather should avoid architectural lock-in to:

- Hermes
- OpenClaw
- OpenAI
- Anthropic
- Gemini
- any single model
- any single orchestration layer

Branch implication: provider/orchestration experiments are likely candidates for isolated research or spike branches, because premature coupling could distort the core architecture.

---

## Preliminary domain map

This is a research-stage map, not a final decision.

### A. Browser Runtime Core

Includes:

- SessionManager
- FeatherSession
- profiles / locks
- browser modes
- HTTP command handlers
- token auth
- navigation / snapshot / extraction / screenshot / debug-bundle routes

Current status: real and active.

Strategic role: foundation layer. Everything depends on it.

Initial branching read: should usually stay close to trunk/dev. Long-lived divergence is risky unless the experiment is intentionally a runtime fork.

---

### B. Tab Layer & Observability

Includes:

- page registration
- tab lifecycle events
- SSE event stream
- loadState/title/url payloads
- tracing verification
- status resilience

Current status: active S2.

Strategic role: bridge between core runtime, Phase 4 shell, and future agents.

Initial branching read: feature branches/spikes are useful, but this should integrate back quickly because downstream domains consume it.

---

### C. Linux Runtime / Packaging / Weight

Includes:

- `FEATHER_CHROMIUM_PATH`
- system Chromium
- Playwright browser download skipping
- Flatpak
- portals
- host-primary runtime
- possible Podman headless/CI target
- Wayland/GPU/audio constraints

Current status: partly decided, partly deferred.

Strategic role: product viability and distribution layer.

Initial branching read: strong candidate for isolated spikes and possibly long-lived research branches, because experiments may depend on host OS, Flatpak manifests, browser binaries, and launch flags.

---

### D. Desktop Shell / Human Browser UI

Includes:

- shell framework decision
- Tauri/WebKitGTK vs GTK4-native
- browser surface architecture
- vertical tabs
- profile controls
- command palette
- theme/layout
- RTL
- import/export
- primary long-running human session

Current status: Phase 4 future.

Strategic role: foundational for Cookie Mine and agent layer.

Initial branching read: likely deserves isolated long-running development once Phase 4 starts, but not as an unbounded sandbox. Shell experiments may need their own playground because Wayland/browser-surface architecture is unresolved.

---

### E. Cookie Mine / Shared Persistent Context

Includes:

- long-running human-owned context
- agent tab opening inside human session
- session reuse
- live trust context
- preserving profile lock safety

Current status: accepted architecture direction, not current build scope.

Strategic role: the core differentiator.

Initial branching read: high architectural risk. Should be protected by ADRs/specs first. Implementation should not be mixed casually with UI or generic agent experiments.

---

### F. MCP / Agent Access Layer

Includes:

- MCP-compatible hub
- Playwright MCP evaluation
- possible Feather hub
- possible CLI/hybrid path
- token/context efficiency
- ARIA/accessibility snapshots
- task protocol

Current status: explicitly deferred to Phase 5 Step 0.

Strategic role: future agent interface.

Initial branching read: research branches/spikes only until Phase 5 Step 0. Any production branch before MCP finalization risks rework.

---

### G. Provider / Model / Orchestration Abstraction

Includes:

- OpenAI / Anthropic / Gemini / local models
- user-supplied API keys
- provider setup
- orchestration adapters
- Hermes as optional integration
- model-agnostic boundaries

Current status: vision intake only.

Strategic role: enables Feather to become a platform rather than a vendor-specific app.

Initial branching read: high risk for premature abstraction. Should stay research-only until agent layer design exists. Provider-specific experiments should not touch core abstractions without ADR.

---

### H. Skills Framework / Recipes / Plugin-like System

Includes:

- skills framework
- scripted recipes
- atomic agent actions
- plugin ecosystem potential
- possibly `yt-dlp` adapter

Current status: Phase 5+ / vision only.

Strategic role: platform extensibility.

Initial branching read: likely independent enough to justify isolated long-term research later, but premature now. Needs explicit boundary from browser runtime.

---

### I. Security / Permission / Approval Model

Includes:

- token auth
- localhost binding
- credential redaction
- credentials vault
- approval checkpoints
- ambient authority controls
- prompt-injection / agent hijacking risk
- sandbox/distribution security

Current status: partially implemented in core; full agent security deferred.

Strategic role: cross-cutting constraint.

Initial branching read: should not become a detached long-lived branch unless doing isolated threat-model/prototype work. Security decisions must land close to the relevant implementation branches.

---

### J. Project Memory / Journal / Workflow System

Includes:

- `journal/`
- `/start`, `/stop`, `/init`
- `AGENTS.md`
- docs-map
- tasks / progress / context / sessions
- research inbox

Current status: real and actively used.

Strategic role: project operating system.

Initial branching read: should usually stay with trunk/dev. Long-lived branching here is risky because it can make project state lie. Documentation/workflow changes should be small and integrated quickly.

---

### K. Product Identity / UX Philosophy

Includes:

- lightweight
- quiet
- transparent
- inspectable
- user-controlled
- "quiet like a feather"
- Zen-inspired shell

Current status: vision/positioning.

Strategic role: guides product decisions and prevents feature bloat.

Initial branching read: not a code branch by itself. It should influence ROADMAP/ADRs/specs and design reviews.

---

## Preliminary domain risk matrix

| Domain | Independence | Risk | Coupling | Isolation need | Notes |
|---|---:|---:|---:|---:|---|
| Browser Runtime Core | Medium | High | Very high | Low/medium | Keep close to dev; avoid long-lived drift. |
| Tab Layer & Observability | Medium | Medium/high | High | Medium | Feature branches okay; integrate quickly. |
| Linux Runtime / Packaging | High | High | Medium/high | High | Host/Flatpak/Wayland experiments justify isolation. |
| Desktop Shell | High | High | High | High | Likely needs sandbox/playground while Phase 4 architecture is unresolved. |
| Cookie Mine | Medium | Very high | Very high | High | ADR/spec first; dangerous to mix casually. |
| MCP / Agent Access | High | Very high | High | High | Research/spike only until Phase 5 Step 0. |
| Provider / Orchestration | High | High | Medium | High | Avoid vendor lock-in; research isolation useful. |
| Skills Framework | High | Medium/high | Medium | Medium/high | Future extensibility layer; not now. |
| Security / Approval | Medium | Very high | Very high | Medium | Cross-cutting; should land with relevant work. |
| Journal / Workflow | Low/medium | Medium | High | Low | Keep integrated; docs must stay true. |
| Product Identity / UX | Low | Medium | Medium | Low | Not a branch; design constraint. |

---

## Early branching implications — not final recommendations

These are research observations only.

### Likely should stay close to trunk/dev

- Browser runtime bug fixes.
- Tab correctness fixes.
- Observability payload changes once scoped.
- Journal / docs truth updates.
- Security fixes in existing auth/session/logging paths.

Reason: many other domains depend on these staying current.

### Likely suitable for short feature branches

- `TAB_UPDATED` implementation.
- duplicate registration fix.
- tracing e2e verification.
- specific Fastify / Playwright upgrade work after plan approval.
- isolated bug fixes with tests.

Reason: bounded work with clear merge criteria.

### Likely suitable for spike branches

- system Chromium executablePath probe.
- Fastify v5 + `fastify-sse-v2` compatibility proof.
- Wayland browser surface prototypes.
- Tauri/WebKitGTK vs GTK4-native experiments.
- Playwright MCP evaluation.
- provider adapter proof-of-concept.
- local-model feasibility.

Reason: high uncertainty; outcome may be discarded.

### Likely candidates for long-lived isolated branches later

- Desktop shell playground / Phase 4 shell exploration.
- Agent runtime / MCP hub exploration, but only after Phase 5 Step 0.
- Provider/model abstraction research, if it becomes a serious subsystem.
- Skills framework/plugin ecosystem, if it becomes separable.
- Packaging/distribution experiments, if Flatpak/host/CI changes require different runtime files.

Reason: these may evolve independently and may break assumptions before they are ready.

### Likely should not become separate long-lived branches

- Project journal/workflow files.
- General docs reconciliation.
- Small API contract fixes.
- Product copy/positioning.
- Security review notes without implementation.

Reason: divergence here creates stale truth and coordination overhead.

---

## Questions for Roi before any branching strategy

### Product horizon

1. In one year, do you imagine Feather primarily as:
   - a personal research project,
   - a working local browser you personally use,
   - a public open-source tool,
   - a commercializable product,
   - or a foundation for multiple related projects?

2. What is the strongest future identity in your head right now?
   - browser runtime,
   - visual browser,
   - agentic browser,
   - local automation platform,
   - AI operating layer,
   - or something else?

3. Should Feather stay one repo for as long as possible, or are you open to splitting future subsystems into separate repos if they mature?

### Personal interest / focus

4. Which domains personally interest you most?
   - browser core,
   - UI/shell,
   - AI agents,
   - MCP/protocols,
   - provider/model abstraction,
   - skills/recipes,
   - security/permissions,
   - product UX,
   - project memory/journal system.

5. Which domains do you want freedom to explore messily without risking the main project?

6. Which domains feel like possible standalone projects later?

### Team / collaboration

7. Is this expected to stay mostly solo for the next 3–6 months?

8. Do you expect AI agents/Codex/Claude Code to be the main contributors, or human collaborators too?

9. If people join later, are they likely to work by domain (UI person, agent person, infra person), or by task?

### Risk tolerance

10. Are you comfortable with long-lived branches that may drift for weeks, or do you prefer short branches and frequent integration?

11. Should experimental branches be disposable by default, even if they contain useful ideas?

12. Do you want a strict rule that any branch touching core session/profile/security must be short-lived and heavily reviewed?

### Product architecture

13. Is the platform-agnostic vision now a real North Star, or still just an intake idea?

14. Should Hermes be treated only as optional integration from now on?

15. Do you want provider/model abstraction to become a first-class design goal, or should that wait until Phase 5?

16. Should the visual shell be developed as an isolated playground until it proves the Wayland/browser-surface architecture?

17. Should MCP/agent experiments be completely isolated until the MCP spec finalization date and Phase 5 Step 0?

### Documentation / process

18. Do you want the future branching model to be encoded in `AGENTS.md` as hard rules?

19. Should there be a separate ADR for branching strategy if the decision is substantial?

20. Should `journal/ops/tasks.md` remain single-current-phase only, or should long-lived domain branches get their own task/context files?

21. If long-lived branches exist, should each one have its own mini-`context.md` / handoff mechanism?

22. Should `raw/_inbox` be used for branch strategy research only, or should branch experiments write their results there too?

---

## Documentation surfaces likely affected by final branching decision

If a branching strategy is accepted, likely affected files:

- `AGENTS.md`
  - Branch rules.
  - AI session rules.
  - Current phase constraints.
  - Classification rules.

- `ROADMAP.md`
  - Only if strategic branches imply phase-level changes.
  - Avoid adding branch mechanics unless they alter phase sequencing.

- `docs/specs/`
  - A branching ADR may be justified if the model introduces long-lived strategic branches.
  - Possible ADR title: `ADR-0006 — Branching Strategy and Domain Isolation`.

- `journal/docs-map.md`
  - If branch-specific context files or branch-specific task files are introduced.

- `journal/ops/tasks.md`
  - Should probably remain current-phase-only unless the operating model changes.

- `journal/context/active.md`
  - Needs rules for which branch/session it describes if multiple active branch contexts exist.

- `journal/work/<desk>/context.md`
  - Could become the right place for domain-specific context.

- command docs / skills:
  - `/start`
  - `/stop`
  - `/init`
  - any future branch-aware workflow command.

- contribution process:
  - merge rules.
  - review gates.
  - spike disposal rules.
  - graduation criteria from spike/research branch to dev.

---

## Open issue: accidental temporary branch

During this research session, a temporary branch named `tmp-check` was accidentally created from commit `8f806e952918c77e294484f77f62bb9abf3547ce` while checking branch tooling.

This was not requested and should be deleted manually or by a follow-up tool if branch deletion capability is available. No project files were changed on that branch.

This reinforces one process point: future branching work should be done from an explicit plan, not from exploratory tool calls.

---

## Current recommendation gate

Do not create a final branching strategy yet.

Next step should be Roi answering the questions above, especially:

1. Is Feather mainly personal research, a future product, or a platform foundation?
2. Which domains does Roi want to explore independently?
3. Which domains should be protected from messy experiments?
4. Whether platform-agnostic Feather is now a real North Star.
5. Whether long-lived strategic branches are acceptable or should be avoided.

After that, produce:

1. Final domain map.
2. Domain-by-domain branch suitability table.
3. Branching strategy proposal.
4. Documentation update plan.
5. Optional ADR draft.
