# NotebookLM Project Brain v2 Design

## Purpose

Upgrade `docs/feather_notebooklm_pack/` from a lightweight infographic-oriented source pack into a
coherent "Feather Project Brain" for NotebookLM. The upgraded pack should represent current truth as
of 2026-06-10, include future plans, serve Roi and technical collaborators, and support both product
explanation and technical architecture questions.

The pack must be optimized for NotebookLM/RAG behavior, not just human documentation style.

## Audience

Primary audience:

- Roi
- technical collaborators
- future technical reviewers who need to understand Feather without reading the entire repository

Secondary outputs NotebookLM should be able to produce:

- project summaries
- architecture explanations
- roadmap explanations
- safety model explanations
- codebase orientation
- technical Q&A grounded in current state
- public-facing drafts when asked, but without losing technical accuracy

## Current Problems

The existing pack is useful but not reliable enough as a project brain.

Problems to fix:

- Several files still reflect older v1 framing, especially "first test" language.
- The pack was originally framed around infographic generation, not broad project memory.
- Core product explanation repeats in some places but is missing from others.
- Technical architecture is split unevenly: files 1-7 are concise, while the new session callflow file
  is much deeper.
- Graphify findings are not yet represented as a curated source.
- NotebookLM chunking can retrieve isolated chunks without enough local context.
- A "prompting guide" uploaded as a normal source would be interpreted as facts, not operating
  instructions.

## RAG-Specific Requirements

### 1. Per-File Local Context Boilerplate

Every markdown file in the uploaded source pack must begin with a standardized 1-2 sentence
boilerplate that defines Feather and names the file's scope.

Reason: NotebookLM chunks sources. If a chunk is retrieved from the middle of a specialized file, it
still needs local context so NotebookLM does not blur the topic or lose the project frame.

Boilerplate pattern:

```markdown
Feather is a local Chromium browser runtime that lets AI agents operate real browser sessions through
a controlled HTTP API. This source explains <specific scope of this file>.
```

Each file may adjust the second sentence, but the first sentence should stay substantially consistent.

### 2. System Instructions Are Not an Uploaded Source

Do not upload the prompting guide as a normal NotebookLM source.

Instead, file 12 must be:

```text
12_notebooklm_system_instructions.md
```

It is a copy/paste artifact for NotebookLM's external "System Instructions" field. Its header and
body must explicitly state that it is not a knowledge source and should not be uploaded with the
source pack.

Reason: NotebookLM treats uploaded sources as facts about the world. A source that says "prioritize
this file" or "answer in this style" can pollute the fact base. Those are runtime instructions, not
domain facts.

### 3. Clean Citation Titles

NotebookLM exposes filenames in citation tooltips, but the internal H1 headers also need to be clean
and human-readable.

Requirements:

- Keep numeric filenames for ordering.
- Make each H1 match the human-readable intent of the file.
- Avoid vague H1s such as "Notes" or "Overview" without project context.
- Avoid implementation-only H1s when the file is broader than code.

Example:

```markdown
# Feather Current Truth and Working State
```

not:

```markdown
# Current Truth
```

## Recommended Source Pack Structure

The upgraded pack should replace the current set with a coherent v2 layout:

```text
README.md
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
12_notebooklm_system_instructions.md
13_notebooklm_studio_prompts.md
```

Upload to NotebookLM:

- `01_current_truth.md`
- `02_product_model.md`
- `03_architecture_overview.md`
- `04_api_and_operating_loop.md`
- `05_session_profile_lifecycle.md`
- `06_codebase_topology.md`
- `07_safety_security_model.md`
- `08_roadmap_v1_v2_v3.md`
- `09_evidence_and_test_history.md`
- `10_limits_open_questions.md`
- `11_glossary.md`

Do not upload:

- `README.md`
- `12_notebooklm_system_instructions.md`
- `13_notebooklm_studio_prompts.md`

The README is for human ingestion workflow only. Uploading it would pollute NotebookLM's fact base
with meta-instructions about how to use the pack.

Instead, manually paste the contents of file 12 into NotebookLM's system/custom instructions field.
File 13 is a personal Studio prompt cheat-sheet for Roi. It is not a knowledge source.

Optional separate upload:

- `graphify-out/GRAPH_REPORT.md`

This raw Graphify report may be uploaded if Roi wants broad graph metadata available, but it should
remain separate from the curated pack and should not be moved.

## File Responsibilities

### README.md - Feather NotebookLM Project Brain

Owns the pack index and ingestion instructions.

Must clearly say:

- upload files 1-11 only
- do not upload README, file 12, or file 13
- optionally upload `graphify-out/GRAPH_REPORT.md`
- this pack represents current truth plus future plans as of 2026-06-10

### 01_current_truth.md - Feather Current Truth and Working State

Owns current state.

Must include:

- Phase 4a / Feather v1 current position
- v1 proofs completed
- observe / act-by-ref loop shipped
- daily-driver background launch shipped
- `primary` is Roi's real warmed Google identity and must be handled carefully
- `scratch` is the test identity
- Graphify side experiment status in this worktree
- immediate next major choices: observe-loop measurement or v2 Gate A
- known pre-existing `continuity.test.ts` issue

### 02_product_model.md - Feather Product Model and Doctrine

Owns product framing.

Must include:

- Feather Core vs Feather Shell
- Cookie Mine model
- native-by-default doctrine
- recipe-book approach to open source
- what Feather is not
- why human browsing and agent automation are coupled

### 03_architecture_overview.md - Feather Architecture Overview

Owns high-level architecture.

Must include:

- layer diagram
- Fastify transport
- command handlers
- SessionManager
- FeatherSession
- Playwright / Chromium
- filesystem, logging, profile locks, debug bundles
- source references at file level

### 04_api_and_operating_loop.md - Feather API and Agent Operating Loop

Owns how agents drive Feather.

Must include:

- endpoint discovery
- token file
- response envelope
- launch / navigate / read / observe / act / debug / close loop
- snapshot vs observe
- observe -> act-by-ref -> observe loop
- `await-human`
- profile caution: use `scratch` for tests, be careful with `primary`

### 05_session_profile_lifecycle.md - Feather Session and Profile Lifecycle

Owns the launch and cleanup lifecycle.

Should reuse and compress the current `08_session_launch_callflow.md`.

Must include:

- `POST /v1/sessions` chain
- `LaunchSessionHandler`
- `SessionManager.launch`
- `FeatherSession`
- profile path derivation
- persistent lock behavior
- browser launch modes
- page listener setup
- close cleanup
- high-risk invariants

### 06_codebase_topology.md - Feather Codebase Topology

Owns curated Graphify-derived architecture.

Must include:

- graph corpus size and freshness
- god nodes and why they matter
- curated community map with human-readable names
- blast-radius notes
- no import cycles
- weak/isolated node caveat
- suggested architecture questions
- relationship to raw `graphify-out/GRAPH_REPORT.md`

Must not:

- dump raw `graph.json`
- copy the full `GRAPH_REPORT.md`
- overstate Graphify's dynamic-call precision

### 07_safety_security_model.md - Feather Safety and Security Model

Owns safety sequencing.

Must include:

- browser control is privileged
- security-first spine
- Gate A capability gate
- Gate B first-agent safety gate
- Identity model
- MFA/human handoff
- warmed-profile attach constraints
- stealth last
- explicit warning that real personal accounts should not be freely operated by agents before safety
  gates

### 08_roadmap_v1_v2_v3.md - Feather Roadmap and Future Plans

Owns roadmap.

Must include:

- v1: "It runs errands for me"
- v2: "It survives scary sites, safely"
- v3: "The polished product"
- current status of each
- build order
- deferred/parked features
- why v2 Gate A is first real safety work

### 09_evidence_and_test_history.md - Feather Evidence and Test History

Owns proof history.

Must include:

- v1 Instagram test result
- showcase suite result
- close-tab primitive
- perception/observation loop
- daily-driver background launch
- primary re-warm
- pi_agency PARTIAL result and why PARTIAL is honest evidence
- Testing Honesty doctrine

### 10_limits_open_questions.md - Feather Limits, Risks, and Open Questions

Owns caveats.

Must include:

- what Feather does not do yet
- real-account safety caveats
- known test issue: `continuity.test.ts`
- v2 stealth gaps
- Graphify side experiment not yet merged/kept
- launch/session lifecycle risk notes if relevant
- external blockers

### 11_glossary.md - Feather Glossary

Owns terminology.

Formatting requirement:

- Use strict markdown headers for terms:

```markdown
### Cookie Mine
Definition text here.
```

- Do not use dense tables for primary definitions. Headers help the RAG parser map each term to its
  definition entity.

Must define:

- Feather Core
- Feather Shell
- Cookie Mine
- primary
- scratch
- persistent profile
- disposable profile
- observe
- act-by-ref
- snapshot
- await-human
- Gate A
- Gate B
- Identity
- MFA Handler
- warmed attach
- stealth stack
- Graphify

### 12_notebooklm_system_instructions.md - NotebookLM System Instructions for Feather

Owns copy/paste instructions, not project facts.

Must clearly say:

- "Do not upload this file as a source."
- "Copy this text into NotebookLM system/custom instructions."

Instruction content should tell NotebookLM:

- prioritize current truth
- distinguish built/verified/planned/deferred/parked/risk
- do not describe Feather as a Chrome extension, cloud service, finished consumer browser, or full
  agent platform
- cite source files when answering
- prefer technical accuracy over flattering summaries
- separate product narrative from implementation detail
- warn when a claim depends on future v2 safety gates

### 13_notebooklm_studio_prompts.md - NotebookLM Studio Prompts for Feather

Owns copy/paste prompts for NotebookLM Studio generation features. This file is for Roi's personal
workflow and must not be uploaded as a source.

Must clearly say:

- "Do not upload this file as a source."
- "Use this as a personal Studio prompt cheat-sheet."

Authoring stance:

- Act as an expert AI prompt engineer and NotebookLM specialist.
- Prompts must be optimized for NotebookLM Studio's source-grounded generation behavior.
- Prompts must force targeted synthesis from specific Feather source files instead of broad, blind
  summary.

Required output format:

```markdown
| Studio Format | Strategic Goal | Optimized Prompt |
|---|---|---|
| Audio Overview | ... | ... |
```

The table must include optimized copy-paste prompts for each NotebookLM Studio format:

- Audio Overview
- Video Overview
- Reports
- Quiz
- Data Table
- Presentation
- Mind Map
- Flashcards
- Infographics

Prompt goals must be hyper-specific to Feather and support practical outcomes:

- educational content for Instagram and LinkedIn
- project management and planning
- architecture review
- v2 capability mapping
- safety/security explanation
- codebase topology understanding

Every prompt should explicitly name source files to prioritize, such as:

- `01_current_truth.md`
- `02_product_model.md`
- `05_session_profile_lifecycle.md`
- `06_codebase_topology.md`
- `07_safety_security_model.md`
- `08_roadmap_v1_v2_v3.md`
- `09_evidence_and_test_history.md`
- `10_limits_open_questions.md`

## Status Labels

Use these labels consistently:

- `Built`: implemented in code or docs.
- `Verified`: tested or demonstrated with evidence.
- `Planned`: designed but not built.
- `Deferred`: intentionally postponed.
- `Parked`: stopped unless Roi explicitly resumes.
- `Risk`: known caveat or failure mode.

The labels should appear in source files where NotebookLM might otherwise blend current and future
states.

## Source Inputs

Primary inputs:

```text
AGENTS.md
journal/context/active.md
journal/context/next.md
journal/ops/tasks.md
ROADMAP.md
feather.md
docs/roadmap/v1.md
docs/roadmap/v2.md
docs/roadmap/v3.md
docs/api-reference.md
docs/agent-playbook.md
docs/specs/adr-0010-local-control-plane-capability-model.md
docs/specs/adr-0011-open-source-consumption-doctrine.md
graphify-out/GRAPH_REPORT.md
graphify-out/graph.json through targeted CLI queries
existing docs/feather_notebooklm_pack/*.md
```

Avoid reading archive-heavy history by default unless current docs explicitly require it. The pack
should represent live state and durable decisions, not every historical branch.

## Validation Plan

Docs-only validation:

1. Confirm all files have the standardized Feather boilerplate near the top.
2. Confirm H1 headers are human-readable and match each file's intent.
3. Confirm README says README, file 12, and file 13 are not uploaded.
4. Confirm file 12 says it is a copy/paste system instruction artifact.
5. Confirm file 13 says it is a personal Studio prompt cheat-sheet, not a source.
6. Confirm `11_glossary.md` uses `### Term` headers for each term.
7. Search for stale language:

```text
first test
mostly there
not done yet
about to
future Instagram test
```

8. Search for unsafe overstatements:

```text
agents can freely use primary
production-ready
Chrome replacement
cloud service
extension
```

9. Cross-check current facts against `journal/context/active.md` and `journal/ops/tasks.md`.
10. Cross-check topology against `graphify-out/GRAPH_REPORT.md` and targeted Graphify CLI output.
11. Run `git diff -- docs/feather_notebooklm_pack` and review the full rewritten pack.

No code tests are required because the implementation is documentation-only.

## Non-Goals

- Do not move `graphify-out/GRAPH_REPORT.md`.
- Do not upload or copy raw `graphify-out/graph.json` into the pack.
- Do not upload `README.md`, `12_notebooklm_system_instructions.md`, or
  `13_notebooklm_studio_prompts.md` to NotebookLM as sources.
- Do not add secrets, credentials, cookie contents, or private account details beyond high-level
  identity labels already present in project state.
- Do not rewrite product roadmap source files outside `docs/feather_notebooklm_pack/` as part of this
  task.
- Do not run Graphify installer commands for Codex or modify `AGENTS.md`.
- Do not treat file 12 as an uploaded source.

## Open Decisions Before Implementation

No major design decisions remain open. Implementation can proceed after Roi reviews and approves this
spec.
