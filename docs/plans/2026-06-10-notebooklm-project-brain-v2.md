# NotebookLM Project Brain v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `docs/feather_notebooklm_pack/` into a current, RAG-aware Feather Project Brain for NotebookLM.

**Architecture:** Replace the existing infographic-oriented pack with a layered source set: current truth, product model, architecture, API loop, session lifecycle, Graphify topology, safety, roadmap, evidence, limits, glossary, and two human-only helper files. Uploaded source files must be self-contextual for NotebookLM chunk retrieval; README, system instructions, and Studio prompts remain human-only artifacts.

**Tech Stack:** Markdown documentation, local repo source files, Graphify CLI output, NotebookLM/RAG packaging constraints.

---

## Source Spec

Use this design as the authority:

- `docs/specs/2026-06-10-notebooklm-project-brain-v2-design.md`

Do not implement behavior outside that spec.

## File Structure

Create or replace these files:

- Modify: `docs/feather_notebooklm_pack/README.md`
- Replace: `docs/feather_notebooklm_pack/01_current_truth.md`
- Replace: `docs/feather_notebooklm_pack/02_product_model.md`
- Replace: `docs/feather_notebooklm_pack/03_architecture_overview.md`
- Replace: `docs/feather_notebooklm_pack/04_api_and_operating_loop.md`
- Replace: `docs/feather_notebooklm_pack/05_session_profile_lifecycle.md`
- Replace: `docs/feather_notebooklm_pack/06_codebase_topology.md`
- Replace: `docs/feather_notebooklm_pack/07_safety_security_model.md`
- Replace: `docs/feather_notebooklm_pack/08_roadmap_v1_v2_v3.md`
- Replace: `docs/feather_notebooklm_pack/09_evidence_and_test_history.md`
- Replace: `docs/feather_notebooklm_pack/10_limits_open_questions.md`
- Replace: `docs/feather_notebooklm_pack/11_glossary.md`
- Create: `docs/feather_notebooklm_pack/12_notebooklm_system_instructions.md`
- Create: `docs/feather_notebooklm_pack/13_notebooklm_studio_prompts.md`

Remove these old pack files after their content is superseded:

- Delete: `docs/feather_notebooklm_pack/07_infographic_brief.md`
- Delete: `docs/feather_notebooklm_pack/08_session_launch_callflow.md`

Keep these files outside the pack untouched:

- `graphify-out/GRAPH_REPORT.md`
- `graphify-out/graph.json`
- `AGENTS.md`
- `feather.md`
- `ROADMAP.md`
- `journal/context/active.md`
- `journal/context/next.md`
- `journal/ops/tasks.md`

## Shared Boilerplate

Every uploaded source file (`01` through `11`) must begin with a local context paragraph after the H1:

```markdown
Feather is a local Chromium browser runtime that lets AI agents operate real browser sessions through a controlled HTTP API. This source explains <file-specific scope sentence>.
```

The first sentence must stay substantially consistent across files. The second sentence must name the file's scope.

README, file 12, and file 13 do not use this boilerplate because they are not uploaded as knowledge sources.

---

### Task 1: Re-read Authoritative Inputs

**Files:**
- Read: `docs/specs/2026-06-10-notebooklm-project-brain-v2-design.md`
- Read: `journal/context/active.md`
- Read: `journal/context/next.md`
- Read: `journal/ops/tasks.md`
- Read: `ROADMAP.md`
- Read: `feather.md`
- Read: `docs/roadmap/v1.md`
- Read: `docs/roadmap/v2.md`
- Read: `docs/roadmap/v3.md`
- Read: `docs/api-reference.md`
- Read: `docs/agent-playbook.md`
- Read: `docs/specs/adr-0010-local-control-plane-capability-model.md`
- Read: `docs/specs/adr-0011-open-source-consumption-doctrine.md`
- Read: `graphify-out/GRAPH_REPORT.md`

- [ ] **Step 1: Read the design spec**

Run:

```bash
sed -n '1,560p' docs/specs/2026-06-10-notebooklm-project-brain-v2-design.md
```

Expected: the spec includes README as human-only, files 1-11 as uploaded sources, file 12 as system instructions, and file 13 as Studio prompts.

- [ ] **Step 2: Read live project state**

Run:

```bash
sed -n '1,220p' journal/context/active.md
sed -n '1,220p' journal/context/next.md
sed -n '1,240p' journal/ops/tasks.md
```

Expected: active state says Phase 4a/v1 is late stage, daily-driver background launch shipped, primary is Roi's real warmed Google identity, scratch is the test identity, Graphify is a side experiment in this worktree, and next choices include observe-loop measurement or v2 Gate A.

- [ ] **Step 3: Read product and roadmap sources**

Run:

```bash
sed -n '1,220p' feather.md
sed -n '1,220p' ROADMAP.md
sed -n '1,220p' docs/roadmap/v1.md
sed -n '1,240p' docs/roadmap/v2.md
sed -n '1,220p' docs/roadmap/v3.md
```

Expected: these files provide Core vs Shell, v1/v2/v3, security-first spine, and future plans.

- [ ] **Step 4: Read API and operator sources**

Run:

```bash
sed -n '1,260p' docs/api-reference.md
sed -n '1,260p' docs/agent-playbook.md
```

Expected: these files provide endpoint discovery, token auth, session launch, snapshot, observe, act-by-ref, await-human, and close behavior.

- [ ] **Step 5: Read Graphify report**

Run:

```bash
sed -n '1,260p' graphify-out/GRAPH_REPORT.md
```

Expected: report includes corpus size, graph freshness, god nodes, surprising connections, import cycles, communities, knowledge gaps, and suggested questions.

### Task 2: Refresh Graphify-Derived Facts

**Files:**
- Read: `graphify-out/GRAPH_REPORT.md`
- Read: `graphify-out/graph.json`
- Later modify: `docs/feather_notebooklm_pack/06_codebase_topology.md`

- [ ] **Step 1: Run targeted Graphify queries**

Run:

```bash
graphify affected "FeatherSession" --depth 3 --graph graphify-out/graph.json
graphify affected "LaunchSessionHandler" --depth 3 --graph graphify-out/graph.json
graphify explain "SessionManager" --graph graphify-out/graph.json
graphify path ".launch()" "spawnAndConnect()" --graph graphify-out/graph.json
```

Expected: output confirms `FeatherSession` and `SessionManager` as high-blast-radius nodes and confirms `SessionManager.launch()` calls `spawnAndConnect()`.

- [ ] **Step 2: Extract graph node summary**

Run:

```bash
jq -r '.nodes[] | select((.label // "" | tostring) | test("FeatherPaths|FeatherSession|CommandContext|CommandHandler|SessionManager|ProfileLock|WorkspaceMetadata|startHttpServer|resolveActionable"; "i")) | [.label,.source_file,.source_location,.community] | @tsv' graphify-out/graph.json
```

Expected: output lists the major topology nodes with source files and communities.

- [ ] **Step 3: Record Graphify limitations for the topology source**

Add these facts later to `06_codebase_topology.md`:

```text
Graphify is useful for static structure, imports, calls, and blast-radius hints.
Graphify should not be treated as perfect dynamic-call truth.
Interface dispatch can hide direct runtime calls, so critical call paths are cross-checked against TypeScript source.
```

### Task 3: Rewrite README as Human-Only Ingestion Guide

**Files:**
- Modify: `docs/feather_notebooklm_pack/README.md`

- [ ] **Step 1: Replace README with human-only instructions**

Write `docs/feather_notebooklm_pack/README.md` with these sections:

```markdown
# Feather NotebookLM Project Brain

This README is for humans. Do not upload this README to NotebookLM as a source.

## What This Pack Is

## Upload These Files as NotebookLM Sources

## Do Not Upload These Files

## Optional Separate Source

## Manual NotebookLM Setup

## Maintenance Rule
```

- [ ] **Step 2: Ensure upload list excludes README, file 12, and file 13**

The uploaded list must contain exactly:

```text
01_current_truth.md
02_product_model.md
03_architecture_overview.md
04_api_and_operating_loop.md
05_session_profile_lifecycle.md
06_codebase_topology.md
07_safety_security_model.md
08_roadmap_v1_v2_v3.md
09_evidence_and_test_history.md
10_limits_open_questions.md
11_glossary.md
```

The non-upload list must contain exactly:

```text
README.md
12_notebooklm_system_instructions.md
13_notebooklm_studio_prompts.md
```

### Task 4: Write Current Truth Source

**Files:**
- Replace: `docs/feather_notebooklm_pack/01_current_truth.md`

- [ ] **Step 1: Replace file with current-state source**

Use this H1 and sections:

```markdown
# Feather Current Truth and Working State

Feather is a local Chromium browser runtime that lets AI agents operate real browser sessions through a controlled HTTP API. This source explains the current project state, active identities, shipped proof points, and near-term choices as of 2026-06-10.

## Status Snapshot

## Built and Verified

## Active Identities

## Current Worktree: Graphify Side Experiment

## Immediate Next Choices

## Known Caveats

## What NotebookLM Should Not Infer
```

- [ ] **Step 2: Include required current facts**

The source must explicitly state:

```text
Built/Verified: v1 Instagram test completed.
Built/Verified: showcase suite completed.
Built/Verified: observe / act-by-ref loop shipped.
Built/Verified: daily-driver background launch shipped.
Built/Verified: primary re-warmed with Roi's real Google identity.
Risk: primary is Roi's real personal identity and must not be treated as a sacrificial test profile.
Built/Verified: scratch is the test identity.
Parked: pi_agency is parked after an honest PARTIAL.
Risk: continuity.test.ts is a known pre-existing failure.
Parked/Pending: Graphify side experiment awaits keep/discard decision.
Planned: next major safety work is v2 Gate A.
```

### Task 5: Write Product Model Source

**Files:**
- Replace: `docs/feather_notebooklm_pack/02_product_model.md`

- [ ] **Step 1: Replace file with product model source**

Use this H1 and sections:

```markdown
# Feather Product Model and Doctrine

Feather is a local Chromium browser runtime that lets AI agents operate real browser sessions through a controlled HTTP API. This source explains Feather's product model, Core/Shell split, Cookie Mine concept, and native-by-default doctrine.

## One-Sentence Product Model

## Feather Core

## Feather Shell

## Cookie Mine

## Native by Default

## Recipe Books, Not Dependencies

## What Feather Is Not

## Why Human Browsing and Agent Automation Are Coupled
```

- [ ] **Step 2: Include doctrine facts**

The file must include:

```text
Feather Core is the current open-source surface.
Feather Shell is the larger future daily-driver browser shell.
Cookie Mine means human browsing builds persistent trust context that local agents can later use under control.
Critical product capabilities should be Feather-owned native TypeScript features unless a package is clearly worth buying.
Open-source projects are recipe books consulted per feature, not shopping lists.
Feather is not a Chrome extension, cloud service, full agent platform, or finished consumer browser.
```

### Task 6: Write Architecture Overview Source

**Files:**
- Replace: `docs/feather_notebooklm_pack/03_architecture_overview.md`

- [ ] **Step 1: Replace file with architecture overview**

Use this H1 and sections:

```markdown
# Feather Architecture Overview

Feather is a local Chromium browser runtime that lets AI agents operate real browser sessions through a controlled HTTP API. This source explains the high-level architecture layers and the major supporting systems.

## Layer Diagram

## HTTP Transport

## Command Handlers

## SessionManager

## FeatherSession

## Browser Runtime

## Cross-Cutting Systems

## Source File Map
```

- [ ] **Step 2: Include source file map**

The source map must include:

```text
src/transport/http.ts: starts Fastify server and writes endpoint/token metadata.
src/transport/routes.ts: registers routes and command handlers.
src/commands/*.ts: transport-independent command handlers.
src/sessions/manager.ts: lifecycle orchestration and registry.
src/sessions/session.ts: in-memory session object and page map.
src/browser/modes.ts: browser launch mode helpers.
src/profiles/lock.ts: persistent profile lock.
src/profiles/workspace.ts: workspace metadata.
src/fs-layout.ts: filesystem layout.
src/logs/logger.ts: structured logs.
src/debug/*: debug capture and bundles.
```

### Task 7: Write API and Operating Loop Source

**Files:**
- Replace: `docs/feather_notebooklm_pack/04_api_and_operating_loop.md`

- [ ] **Step 1: Replace file with API source**

Use this H1 and sections:

```markdown
# Feather API and Agent Operating Loop

Feather is a local Chromium browser runtime that lets AI agents operate real browser sessions through a controlled HTTP API. This source explains how an agent discovers Feather, authenticates, and drives the browser loop.

## Endpoint Discovery

## Authentication

## Response Envelope

## Basic Session Loop

## Reading Pages: Snapshot vs Observe

## Acting by Reference

## Human Handoff

## Debugging and Evidence

## Profile Safety Rules
```

- [ ] **Step 2: Include current golden loop**

The source must include this loop exactly as a code block:

```text
observe -> act by ref -> observe -> read diff -> repeat
```

- [ ] **Step 3: Include profile caution**

The file must state:

```text
Use scratch for sacrificial tests and demos.
Treat primary as Roi's real personal identity.
Do not imply agents should freely operate primary before v2 safety gates.
```

### Task 8: Write Session and Profile Lifecycle Source

**Files:**
- Replace: `docs/feather_notebooklm_pack/05_session_profile_lifecycle.md`
- Source: `docs/feather_notebooklm_pack/08_session_launch_callflow.md`
- Source: `src/transport/routes.ts`
- Source: `src/commands/launch.ts`
- Source: `src/sessions/manager.ts`
- Source: `src/sessions/session.ts`
- Source: `src/browser/modes.ts`
- Source: `src/profiles/lock.ts`

- [ ] **Step 1: Replace file with lifecycle source**

Use this H1 and sections:

```markdown
# Feather Session and Profile Lifecycle

Feather is a local Chromium browser runtime that lets AI agents operate real browser sessions through a controlled HTTP API. This source explains how sessions and profiles are created, initialized, tracked, and cleaned up.

## Launch Call Flow

## LaunchSessionHandler

## SessionManager.launch

## FeatherSession

## Profile Paths and Locks

## Browser Launch Modes

## Page Registration

## Close and Cleanup

## High-Risk Invariants

## Known Lifecycle Risks
```

- [ ] **Step 2: Preserve high-risk invariant content**

Include these invariants:

```text
Session id exists before disposable paths are derived.
Persistent profile lock must be acquired before Chromium launch.
Session is added to registry only after context and listeners are ready.
Initial pages need explicit lifecycle listeners.
Observe cache is invalidated on page removal and navigation.
Persistent locks are released on close.
Disposable profiles are removed or quarantined on close.
```

- [ ] **Step 3: Include lifecycle risk**

Include this risk note:

```text
Risk: if persistent launch fails after ProfileLock.create() but before normal close handling, the lock can remain while the server process is alive. This is a source-level observation from the current launch flow and should be verified before changing lifecycle code.
```

### Task 9: Write Codebase Topology Source

**Files:**
- Replace: `docs/feather_notebooklm_pack/06_codebase_topology.md`
- Source: `graphify-out/GRAPH_REPORT.md`
- Source: targeted Graphify CLI output from Task 2

- [ ] **Step 1: Replace file with curated topology source**

Use this H1 and sections:

```markdown
# Feather Codebase Topology

Feather is a local Chromium browser runtime that lets AI agents operate real browser sessions through a controlled HTTP API. This source explains the codebase topology using curated Graphify results and source-verified interpretation.

## Graph Snapshot

## God Nodes

## Human-Named Communities

## Blast Radius Notes

## Import Cycles

## Weak or Isolated Nodes

## Graphify Limitations

## Architecture Questions This Source Can Answer
```

- [ ] **Step 2: Include graph snapshot**

Use facts from `GRAPH_REPORT.md`:

```text
135 files
719 nodes
1592 edges
39 communities
No import cycles detected
Graph built from commit c0a3c0a9
```

- [ ] **Step 3: Include god nodes**

Include at least these nodes and why they matter:

```text
FeatherPaths: filesystem layout bridge.
FeatherSession: in-memory browser context and page state.
CommandContext: command handler shared context type.
CommandHandler: transport-separated command pattern.
SessionManager: lifecycle orchestrator and registry.
ProfileLock: persistent profile collision prevention.
WorkspaceMetadata: persistent workspace metadata owner.
startHttpServer: HTTP transport bootstrap.
resolveActionable: input target resolution core.
```

### Task 10: Write Safety and Security Source

**Files:**
- Replace: `docs/feather_notebooklm_pack/07_safety_security_model.md`
- Source: `docs/specs/adr-0010-local-control-plane-capability-model.md`
- Source: `docs/roadmap/v2.md`
- Source: `ROADMAP.md`

- [ ] **Step 1: Replace file with safety source**

Use this H1 and sections:

```markdown
# Feather Safety and Security Model

Feather is a local Chromium browser runtime that lets AI agents operate real browser sessions through a controlled HTTP API. This source explains why browser control is privileged and how Feather sequences safety before high-risk agent capabilities.

## Why Browser Control Is Privileged

## Security-First Spine

## Gate A: Capability Gate

## Gate B: First-Agent Safety Gate

## Identity Model

## MFA and Human Handoff

## Warmed-Profile Attach

## Stealth Last

## What NotebookLM Must Not Overstate
```

- [ ] **Step 2: Include sequencing**

Include this exact sequence:

```text
capability/safety gate -> Identity -> MFA -> warmed-profile attach -> Stealth hardening
```

- [ ] **Step 3: Include real-account warning**

Include:

```text
Risk: primary is a real personal identity. NotebookLM must not describe current Feather as safe for unrestricted agent operation on real personal accounts before v2 safety gates are built.
```

### Task 11: Write Roadmap Source

**Files:**
- Replace: `docs/feather_notebooklm_pack/08_roadmap_v1_v2_v3.md`
- Source: `feather.md`
- Source: `docs/roadmap/v1.md`
- Source: `docs/roadmap/v2.md`
- Source: `docs/roadmap/v3.md`
- Source: `ROADMAP.md`

- [ ] **Step 1: Replace file with roadmap source**

Use this H1 and sections:

```markdown
# Feather Roadmap and Future Plans

Feather is a local Chromium browser runtime that lets AI agents operate real browser sessions through a controlled HTTP API. This source explains the v1, v2, and v3 roadmap and how current proof points lead into future safety work.

## Roadmap Summary

## v1: It Runs Errands for Me

## v2: It Survives Scary Sites, Safely

## v3: The Polished Product

## Current Next Choices

## Deferred and Parked Work
```

- [ ] **Step 2: Label each item**

Use labels:

```text
Built
Verified
Planned
Deferred
Parked
Risk
```

### Task 12: Write Evidence and Test History Source

**Files:**
- Replace: `docs/feather_notebooklm_pack/09_evidence_and_test_history.md`
- Source: `journal/context/active.md`
- Source: `journal/ops/tasks.md`

- [ ] **Step 1: Replace file with evidence source**

Use this H1 and sections:

```markdown
# Feather Evidence and Test History

Feather is a local Chromium browser runtime that lets AI agents operate real browser sessions through a controlled HTTP API. This source explains what has actually been proven, including successful tests, partial outcomes, and known evidence limits.

## Testing Honesty Rule

## Instagram v1 Test

## Showcase Suite

## Close-Tab Primitive

## Perception and Observation Loop

## Daily-Driver Background Launch

## Primary Re-Warm

## pi_agency Partial Result

## Known Test Caveats
```

- [ ] **Step 2: Include PARTIAL framing**

Include:

```text
PARTIAL is a first-class honest result, not a failure to hide. The pi_agency run proved useful behavior and hit a real Google phone wall.
```

### Task 13: Write Limits and Open Questions Source

**Files:**
- Replace: `docs/feather_notebooklm_pack/10_limits_open_questions.md`
- Source: `journal/context/active.md`
- Source: `journal/ops/tasks.md`
- Source: `README.md`

- [ ] **Step 1: Replace file with limits source**

Use this H1 and sections:

```markdown
# Feather Limits, Risks, and Open Questions

Feather is a local Chromium browser runtime that lets AI agents operate real browser sessions through a controlled HTTP API. This source explains what Feather does not do yet, known risks, parked work, and unresolved questions.

## Product Limits

## Safety Limits

## Technical Risks

## Known Test Issues

## Parked Work

## External Blockers

## Questions for Future Planning
```

- [ ] **Step 2: Include explicit non-claims**

Include:

```text
Feather is not a polished consumer browser.
Feather is not a production cloud service.
Feather is not a Chrome extension strategy.
Feather is not yet a complete MCP product surface.
Feather is not yet safe for unrestricted real-account agent operation.
```

### Task 14: Write Glossary Source

**Files:**
- Replace: `docs/feather_notebooklm_pack/11_glossary.md`

- [ ] **Step 1: Replace file with glossary source**

Use this H1 and intro:

```markdown
# Feather Glossary

Feather is a local Chromium browser runtime that lets AI agents operate real browser sessions through a controlled HTTP API. This source defines Feather-specific terms so NotebookLM can map project vocabulary to precise meanings.
```

- [ ] **Step 2: Use strict term headers**

Every glossary term must use this format:

```markdown
### Cookie Mine
The Cookie Mine is Feather's model where human browsing builds persistent trusted session context that local AI agents can later use under explicit control and safety gates.
```

- [ ] **Step 3: Include required terms**

Define these terms with `###` headers:

```text
Feather Core
Feather Shell
Cookie Mine
primary
scratch
persistent profile
disposable profile
observe
act-by-ref
snapshot
await-human
Gate A
Gate B
Identity
MFA Handler
warmed attach
stealth stack
Graphify
```

### Task 15: Write NotebookLM System Instructions Artifact

**Files:**
- Create: `docs/feather_notebooklm_pack/12_notebooklm_system_instructions.md`

- [ ] **Step 1: Create file 12**

Use this H1 and warning:

```markdown
# NotebookLM System Instructions for Feather

Do not upload this file as a NotebookLM source. Copy the instruction block below into NotebookLM's system/custom instructions field.
```

- [ ] **Step 2: Include copy-paste instruction block**

The file must include a fenced block titled `Copy this into NotebookLM` containing instructions to:

```text
Use the Feather sources as a current technical project brain.
Prioritize 01_current_truth.md for current state.
Distinguish Built, Verified, Planned, Deferred, Parked, and Risk.
Do not describe Feather as a Chrome extension, cloud service, finished consumer browser, or full agent platform.
When answering architecture questions, prioritize 03_architecture_overview.md, 05_session_profile_lifecycle.md, and 06_codebase_topology.md.
When answering safety questions, prioritize 07_safety_security_model.md and 08_roadmap_v1_v2_v3.md.
When answering evidence questions, prioritize 09_evidence_and_test_history.md.
Warn when a claim depends on future v2 safety gates.
Prefer technical accuracy over flattering summaries.
```

### Task 16: Write NotebookLM Studio Prompts Artifact

**Files:**
- Create: `docs/feather_notebooklm_pack/13_notebooklm_studio_prompts.md`

- [ ] **Step 1: Create file 13**

Use this H1 and warning:

```markdown
# NotebookLM Studio Prompts for Feather

Do not upload this file as a NotebookLM source. Use it as a personal cheat-sheet for NotebookLM Studio generation features after uploading the Feather source files.
```

- [ ] **Step 2: Create required table**

The table must have exactly these columns:

```markdown
| Studio Format | Strategic Goal | Optimized Prompt |
|---|---|---|
```

- [ ] **Step 3: Add one row per Studio format**

Add rows for exactly these formats:

```text
Audio Overview
Video Overview
Reports
Quiz
Data Table
Presentation
Mind Map
Flashcards
Infographics
```

- [ ] **Step 4: Make prompts source-targeted**

Each optimized prompt must explicitly name the source files to prioritize. Across the table, use all of these at least once:

```text
01_current_truth.md
02_product_model.md
03_architecture_overview.md
04_api_and_operating_loop.md
05_session_profile_lifecycle.md
06_codebase_topology.md
07_safety_security_model.md
08_roadmap_v1_v2_v3.md
09_evidence_and_test_history.md
10_limits_open_questions.md
11_glossary.md
```

- [ ] **Step 5: Cover practical outcomes**

Across the table, the strategic goals must cover:

```text
educational content for Instagram and LinkedIn
project management
architecture review
v2 capability mapping
safety/security explanation
codebase topology understanding
```

### Task 17: Delete Superseded Old Pack Files

**Files:**
- Delete: `docs/feather_notebooklm_pack/07_infographic_brief.md`
- Delete: `docs/feather_notebooklm_pack/08_session_launch_callflow.md`

- [ ] **Step 1: Confirm their content is superseded**

Run:

```bash
test -f docs/feather_notebooklm_pack/07_infographic_brief.md && sed -n '1,80p' docs/feather_notebooklm_pack/07_infographic_brief.md
test -f docs/feather_notebooklm_pack/08_session_launch_callflow.md && sed -n '1,80p' docs/feather_notebooklm_pack/08_session_launch_callflow.md
```

Expected: old file 07 is superseded by product/evidence/Studio prompt sources; old file 08 is superseded by `05_session_profile_lifecycle.md`.

- [ ] **Step 2: Delete the files**

Use `apply_patch` delete hunks for both files.

Expected: `git status --short` shows the files as deleted and the new replacements as modified/created.

### Task 18: Validate RAG Packaging Rules

**Files:**
- Check: `docs/feather_notebooklm_pack/*.md`

- [ ] **Step 1: Check file list**

Run:

```bash
find docs/feather_notebooklm_pack -maxdepth 1 -type f -name '*.md' | sort
```

Expected file list:

```text
docs/feather_notebooklm_pack/01_current_truth.md
docs/feather_notebooklm_pack/02_product_model.md
docs/feather_notebooklm_pack/03_architecture_overview.md
docs/feather_notebooklm_pack/04_api_and_operating_loop.md
docs/feather_notebooklm_pack/05_session_profile_lifecycle.md
docs/feather_notebooklm_pack/06_codebase_topology.md
docs/feather_notebooklm_pack/07_safety_security_model.md
docs/feather_notebooklm_pack/08_roadmap_v1_v2_v3.md
docs/feather_notebooklm_pack/09_evidence_and_test_history.md
docs/feather_notebooklm_pack/10_limits_open_questions.md
docs/feather_notebooklm_pack/11_glossary.md
docs/feather_notebooklm_pack/12_notebooklm_system_instructions.md
docs/feather_notebooklm_pack/13_notebooklm_studio_prompts.md
docs/feather_notebooklm_pack/README.md
```

- [ ] **Step 2: Check boilerplate**

Run:

```bash
for f in docs/feather_notebooklm_pack/{01,02,03,04,05,06,07,08,09,10,11}_*.md; do echo "--- $f"; sed -n '1,5p' "$f"; done
```

Expected: each uploaded source starts with an H1 followed by the standardized Feather boilerplate.

- [ ] **Step 3: Check human-only warnings**

Run:

```bash
rg -n "Do not upload this file|Do not upload this README|upload files 1-11 only|12_notebooklm|13_notebooklm" docs/feather_notebooklm_pack
```

Expected: README, file 12, and file 13 all clearly say they are not uploaded as sources.

- [ ] **Step 4: Check glossary headers**

Run:

```bash
rg -n "^### " docs/feather_notebooklm_pack/11_glossary.md
```

Expected: every required glossary term appears as a `###` header.

### Task 19: Validate Current-Truth and Safety Claims

**Files:**
- Check: `docs/feather_notebooklm_pack/*.md`

- [ ] **Step 1: Search for stale language**

Run:

```bash
rg -n "first test|mostly there|not done yet|about to|future Instagram test" docs/feather_notebooklm_pack
```

Expected: no matches, or matches only in a section explicitly explaining stale language to avoid.

- [ ] **Step 2: Search for unsafe overstatements**

Run:

```bash
rg -n "agents can freely use primary|production-ready|Chrome replacement|cloud service|extension" docs/feather_notebooklm_pack
```

Expected: no matches that present those phrases as true. Matches are acceptable only in "what Feather is not" or "must not overstate" contexts.

- [ ] **Step 3: Check current identity language**

Run:

```bash
rg -n "primary|scratch|real personal|test identity|Gate A|continuity.test.ts|Graphify" docs/feather_notebooklm_pack
```

Expected: pack distinguishes primary as Roi's real identity, scratch as test identity, Gate A as planned safety work, continuity test as known pre-existing issue, and Graphify as side experiment.

### Task 20: Final Review and Commit

**Files:**
- Review: `docs/feather_notebooklm_pack/*.md`
- Review: `docs/specs/2026-06-10-notebooklm-project-brain-v2-design.md`
- Review: `docs/plans/2026-06-10-notebooklm-project-brain-v2.md`

- [ ] **Step 1: Review full docs diff**

Run:

```bash
git diff -- docs/feather_notebooklm_pack docs/specs/2026-06-10-notebooklm-project-brain-v2-design.md docs/plans/2026-06-10-notebooklm-project-brain-v2.md
```

Expected: diff shows only the NotebookLM pack rewrite, the design spec, and this plan.

- [ ] **Step 2: Check unrelated dirty files**

Run:

```bash
git status --short --branch
```

Expected: the repo may still show pre-existing dirty journal files. Do not include unrelated journal changes unless Roi explicitly asks.

- [ ] **Step 3: Commit only the NotebookLM project brain changes**

Run:

```bash
git add docs/feather_notebooklm_pack docs/specs/2026-06-10-notebooklm-project-brain-v2-design.md docs/plans/2026-06-10-notebooklm-project-brain-v2.md
git commit -m "docs: rebuild NotebookLM project brain pack"
```

Expected: commit succeeds and excludes unrelated journal files.

---

## Plan Self-Review

Spec coverage:

- README human-only trap: Task 3 and Task 18.
- Files 1-11 uploaded source pack: Tasks 4 through 14.
- File 12 system instructions, not uploaded: Task 15 and Task 18.
- File 13 Studio prompts, not uploaded: Task 16 and Task 18.
- Glossary `### Term` formatting: Task 14 and Task 18.
- Curated Graphify topology: Task 2 and Task 9.
- Current truth plus future plans: Tasks 4, 10, 11, 12, and 13.
- Validation: Tasks 18 and 19.

Placeholder scan:

- No implementation step uses unresolved placeholder markers.
- No task delegates vague content without concrete headings and required facts.

Type and filename consistency:

- Filenames match the approved spec.
- README, file 12, and file 13 are consistently human-only.
- Uploaded source files are consistently files 1-11.
