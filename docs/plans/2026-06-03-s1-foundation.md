# S1 — Foundation: Truth, Decisions & Spikes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the canonical docs true, lock the two foundational decisions (runtime target; agentic North Star) as ADRs, and answer the two cheap unknowns (fastify-sse-v2 v5 compatibility; system Chromium as executablePath) so S2 and S3 can be planned with real information.

**Architecture:** S1 changes **no production code**. It is documentation reconciliation, two new ADR files, a docs map, AGENTS.md polish, and two recorded research spikes. Work happens on the `dev` branch in small commits. Parent spec: `docs/specs/2026-06-03-stabilization-linux-readiness-design.md`.

**Tech Stack:** Markdown docs; `npm`/`npm view` for the dependency spike; a throwaway Playwright script for the Chromium spike (deleted after the finding is recorded).

**Branch:** All commits target `dev`. Never commit to `master`. Confirm with `git branch --show-current` before the first commit.

---

## File map

**Session 1A — Reconcile reality (docs only):**
- Modify: `README.md` (Status + Development Status sections)
- Modify: `PROGRESS.md` (Current Phase + Current State + Next)
- Modify: `ops/phase.md` (frontmatter state)
- Modify: `context/active.md` (header + active plan)
- Modify: `ROADMAP.md` (fix stale "Electron first" Phase 4 line; mark Phase 3 complete; add Linux-only/Flatpak/MCP-date notes)
- Modify: `AGENTS.md` (Current Phase, Tech Stack note, research/ → raw/_inbox/ fix, command-usage section, decision pointers)
- Create: `docs/docs-map.md` (source-of-truth map)
- Modify: `docs/commands/init.md` and `docs/commands/start.md` (one-line pointer to docs map)

**Session 1B — Lock decisions (new ADR files):**
- Create: `docs/specs/adr-0004-runtime-target.md`
- Create: `docs/specs/adr-0005-agentic-north-star.md`

**Session 1C — Answer unknowns (recorded findings):**
- Create: `raw/_inbox/spike-fastify-sse-v2-v5-compat.md`
- Create: `raw/_inbox/spike-system-chromium-executablepath.md`
- Temporary (deleted in-task): `/tmp/feather-chromium-spike.mjs`

---

## SESSION 1A — Reconcile reality

> No code. Blocks: none. Goal: every canonical doc states "Phase 3 complete; Stabilization & Linux-Readiness program (S1) active," and the Linux-only/runtime/agentic facts are present where a future session will look.

### Task 1: Fix README status

**Files:**
- Modify: `README.md` (lines ~7-9 "Status"; lines ~66-71 "Development Status")

- [ ] **Step 1: Read the file**

Run: `Read README.md`. Confirm line 9 currently reads `Phase 2 Complete | 129 tests passing (98 unit, 27 integration, 4 measurement)`.

- [ ] **Step 2: Replace the Status line**

Replace line 9 with:

```markdown
Phase 3 Complete | Stabilization & Linux-Readiness program (S1) in progress | 129 unit + 32 integration tests passing
```

- [ ] **Step 3: Replace the Development Status section**

Replace the "## Development Status" section (lines ~66-71) with:

```markdown
## Development Status

Phase 3 (Browser Core Stabilization & UI Readiness) is complete and merged to `master`.

A short **Stabilization & Linux-Readiness program** now bridges Phase 3 → Phase 4: it patches dependencies, reduces weight (Linux-native Chromium), completes the tab-event model, and records the runtime and agentic decisions. See `docs/specs/2026-06-03-stabilization-linux-readiness-design.md`. Phase 4 (Visual Desktop Shell) begins after it. See `ROADMAP.md` and `PROGRESS.md`.

Feather Browser targets **Linux (Fedora)** as its primary platform.
```

- [ ] **Step 4: Verify no stale string remains**

Run: `grep -n "Phase 2 Complete" README.md`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs(s1): reconcile README status — Phase 3 complete, stabilization program active"
```

### Task 2: Fix PROGRESS.md

**Files:**
- Modify: `PROGRESS.md` (lines 3-9 "Current Phase"/"Current State"; lines 110-112 "Next")

- [ ] **Step 1: Read the file** — confirm line 5 reads `Phase 3 in progress. Started 2026-05-31.`

- [ ] **Step 2: Replace "Current Phase" and "Current State" sections (lines 3-9)**

```markdown
## Current Phase

Phase 3 complete (merged to `master` 2026-06-03). **Stabilization & Linux-Readiness program — S1 (Foundation)** in progress.

## Current State

All Phase 3 milestones are closed (129 unit + 32 integration tests passing, typecheck clean). The Stabilization & Linux-Readiness program now bridges Phase 3 → Phase 4 in three themed sub-phases (S1/S2/S3); see `docs/specs/2026-06-03-stabilization-linux-readiness-design.md`. S1 (Foundation) reconciles the docs, writes ADR-0004 (runtime target) and ADR-0005 (agentic North Star), and runs two research spikes.
```

- [ ] **Step 3: Replace the "## Next" section (lines ~110-112)**

```markdown
## Next

S1 (Foundation) is the active work. After S1: brainstorm and plan S2 (Linux weight & observability), then S3 (currency & security: Fastify v5, Playwright bump), then hand off to ROADMAP Phase 4 Step 0.
```

- [ ] **Step 4: Verify**

Run: `grep -n "Phase 3 in progress" PROGRESS.md`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add PROGRESS.md
git commit -m "docs(s1): reconcile PROGRESS — Phase 3 complete, S1 active"
```

### Task 3: Update ops/phase.md

**Files:**
- Modify: `ops/phase.md` (entire frontmatter block)

- [ ] **Step 1: Replace the whole file with:**

```markdown
---
phase: stabilization-linux-readiness
sub_phase: S1-foundation
plan: docs/plans/2026-06-03-s1-foundation.md
spec: docs/specs/2026-06-03-stabilization-linux-readiness-design.md
step: "in-progress"
prior_phase: phase-3-complete
sessions: ["1A-reconcile", "1B-decisions", "1C-spikes"]
blocking: null
next: "brainstorm S2 (linux weight & observability) after S1 exit"
note: "Linux-only, host-primary runtime (ADR-0004). Agentic North Star recorded (ADR-0005). S2/S3 planned per-phase."
---
```

- [ ] **Step 2: Commit**

```bash
git add ops/phase.md
git commit -m "docs(s1): set phase.md to stabilization program / S1"
```

### Task 4: Update context/active.md

**Files:**
- Modify: `context/active.md`

- [ ] **Step 1: Replace the file's header and "Active Plan"/"Immediate Next Action" sections (lines 1-28) with:**

```markdown
---
updated: 2026-06-03
session: s1-foundation
---

## Active Plan

Program: Stabilization & Linux-Readiness (bridges Phase 3 → Phase 4)
Spec: docs/specs/2026-06-03-stabilization-linux-readiness-design.md
Plan: docs/plans/2026-06-03-s1-foundation.md
Sub-phase: S1 (Foundation) — docs reconciliation, ADR-0004 + ADR-0005, two research spikes
Branch: dev (Phase 3 merged to master 2026-06-03)

## Immediate Next Action

Execute S1 by session:
- 1A: reconcile docs (README, PROGRESS, phase.md, ROADMAP, AGENTS.md) + docs map
- 1B: write ADR-0004 (runtime: host-primary, Flatpak later, Podman optional) and ADR-0005 (agentic North Star: token/context efficiency, defer tool choice to Phase 5 Step 0)
- 1C: spike fastify-sse-v2 v5 compat (gates S3) + system Chromium executablePath (informs S2)

After S1 exit: brainstorm S2.
```

Keep the existing "## Key Decisions (cumulative)" and later sections below this; just update them if any line is now stale (e.g., "pending merge" → "merged 2026-06-03").

- [ ] **Step 2: Verify**

Run: `grep -n "pending merge" context/active.md`
Expected: no output (fix any hit to "merged 2026-06-03").

- [ ] **Step 3: Commit**

```bash
git add context/active.md
git commit -m "docs(s1): point active.md at the stabilization program / S1"
```

### Task 5: Reconcile ROADMAP.md

**Files:**
- Modify: `ROADMAP.md` (Phase 3 status line ~77-80; Phase 4 Step 0 line ~110)

- [ ] **Step 1: Read the file.** Confirm line ~110 reads: `- Step 0: research and plan Phase 4 (desktop shell technology choice: Electron first, Tauri as candidate).`

- [ ] **Step 2: Fix the stale "Electron first" line.** Replace that bullet with:

```markdown
- Step 0: research and plan Phase 4. Feather is **Linux-only (Fedora)**; **Electron is eliminated** (it bundles a second Chromium — anti-Feather). Candidate shells: Tauri/WebKitGTK or GTK4-native, both with Playwright-managed Chromium. Browser-surface architecture on Wayland is unresolved and must be prototyped. Runtime is host-primary with Flatpak as the eventual distribution sandbox (ADR-0004).
```

- [ ] **Step 3: Mark Phase 3 complete.** Under "## Phase 3", change the `Status:` line to:

```markdown
Status: Complete. Completed 2026-06-02, merged to `master` 2026-06-03. All milestones met; 129 unit + 32 integration tests passing.
```

- [ ] **Step 4: Add a one-line stabilization note** immediately after the Phase 3 status line:

```markdown
Bridged to Phase 4 by the Stabilization & Linux-Readiness program — see `docs/specs/2026-06-03-stabilization-linux-readiness-design.md`.
```

- [ ] **Step 5: Add MCP timing note to Phase 5+ planning notes.** In the "## Phase 5+" planning notes, ensure a bullet states: `- MCP spec is final 2026-07-28. Do not design the hub before then.` (Add it if absent.)

- [ ] **Step 6: Verify**

Run: `grep -n "Electron first" ROADMAP.md`
Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add ROADMAP.md
git commit -m "docs(s1): reconcile ROADMAP — Linux-only, Electron eliminated, Phase 3 complete"
```

### Task 6: Polish AGENTS.md

**Files:**
- Modify: `AGENTS.md` (Current Phase ~26-36; Tech Stack ~61-65; Research Rules ~78-83; add Command-usage section)

- [ ] **Step 1: Replace the "## Current Phase" section (lines ~26-36) with:**

```markdown
## Current Phase

**Stabilization & Linux-Readiness program — S1 (Foundation)** (active as of 2026-06-03).

Phase 3 (Browser Core Stabilization & UI Readiness) is complete and merged to `master`. A short bridge program now hardens the core before Phase 4 (the visual shell). Feather targets **Linux (Fedora)**; runtime is **host-primary** (ADR-0004).

- Program spec: `docs/specs/2026-06-03-stabilization-linux-readiness-design.md`
- Current S1 plan: `docs/plans/2026-06-03-s1-foundation.md`
- Current progress: `PROGRESS.md`
- Full roadmap: `ROADMAP.md`

Do not reopen Phase 2 or Phase 3 unless there is a critical correctness issue.
```

- [ ] **Step 2: Update the "## Tech Stack" line (~63) to flag pending upgrades:**

```markdown
TypeScript 5.4 / Node.js 20 / Fastify 4.x / Playwright 1.50 / Zod 3.x / Vitest

> **Upgrade pending (program phase S3):** Fastify 4 → 5 (v4 LTS ended June 2025 — security) and Playwright 1.50 → latest 1.5x. Do not assume these are done until S3 closes.
```

- [ ] **Step 3: Fix the research location in "## Research Rules" (~83).** Change `Record findings in `research/`` to:

```markdown
- Record research findings in `raw/_inbox/` (the project's research inbox) and decisions/specs in `docs/specs/`.
```

- [ ] **Step 4: Add a "## When To Use Each Command" section** immediately before "## Tech Stack":

```markdown
## When To Use Each Command

- **`/start`** — at the beginning of *every* session. Always. Loads context and reports state (read-only).
- **`/stop`** — at the end of *every* session. Always. Writes the handoff and commits tracking files.
- **`/init`** — only when you arrive with a *new goal* you want gate-checked against the current phase before any work. It overlaps with `/start` for normal continuation, so it is optional day-to-day.
```

- [ ] **Step 5: Add decision pointers** to the end of the "## Technical Vision" section:

```markdown
- Runtime target is **host-primary**; Flatpak is the eventual distribution sandbox; Podman is optional for headless/CI only (ADR-0004, `docs/specs/adr-0004-runtime-target.md`).
- Agents must use the browser's API auth token and their LLM context efficiently — a standing design constraint; tool selection deferred to Phase 5 Step 0 (ADR-0005, `docs/specs/adr-0005-agentic-north-star.md`).
```

- [ ] **Step 6: Verify**

Run: `grep -n "research/\`" AGENTS.md`
Expected: no output (the bare `research/` reference is gone). Then confirm the new sections exist: `grep -n "When To Use Each Command" AGENTS.md` → one hit.

- [ ] **Step 7: Commit**

```bash
git add AGENTS.md
git commit -m "docs(s1): polish AGENTS.md — current phase, command usage, research location, decision pointers"
```

### Task 7: Create the docs map

**Files:**
- Create: `docs/docs-map.md`

- [ ] **Step 1: Write `docs/docs-map.md` with this content:**

```markdown
# Docs Map — Source of Truth

One line per doc surface: what it is authoritative for. If two docs disagree, the one named here wins; fix the other. **Every phase ends by reconciling these to reality ("leave the docs true").**

| File | Source of truth for |
|------|---------------------|
| `AGENTS.md` | Constraints, mission, branch rules, current phase pointer, command usage. Read first. |
| `ROADMAP.md` | Destination, phase list, milestones, exit criteria. |
| `PROGRESS.md` | What is done / in progress now; open questions. |
| `ops/phase.md` | Machine-readable current phase/sub-phase state. |
| `ops/tasks.md` | Detailed tasks for the *current* phase only. |
| `context/active.md` | Resume context for `/start`. |
| `ops/sessions/` | `/stop` handoff files (history). |
| `.remember/remember.md` | Short handoff to the very next session. |
| `raw/_inbox/` | Research findings, rough notes, spike results. |
| `docs/specs/` | Specs and ADRs (decisions). |
| `docs/plans/` | Implementation plans (tracked). |
| `schema.md` | Definition of the operating-file system itself. |
| `work/<desk>/context.md` | Desk-specific working context (browser/product/automation/general). |

Note: `docs/superpowers/` is git-ignored — do not put canonical docs there. Tracked specs go in `docs/specs/`, tracked plans in `docs/plans/`.
```

- [ ] **Step 2: Add a pointer from `docs/commands/init.md`.** After the "## Steps" list, add:

```markdown
> Source-of-truth for each doc surface: see `docs/docs-map.md`.
```

- [ ] **Step 3: Add the same pointer to `docs/commands/start.md`** after its "## Steps" list:

```markdown
> Source-of-truth for each doc surface: see `docs/docs-map.md`.
```

- [ ] **Step 4: Verify**

Run: `grep -rn "docs-map.md" docs/commands/`
Expected: two hits (init.md, start.md).

- [ ] **Step 5: Commit**

```bash
git add docs/docs-map.md docs/commands/init.md docs/commands/start.md
git commit -m "docs(s1): add docs map (source-of-truth) and link from command docs"
```

---

## SESSION 1B — Lock the decisions

> No code. Blocks: Session 1A complete. Goal: two ADR files that record decisions already approved by the project owner in planning.

### Task 8: Write ADR-0004 (runtime target)

**Files:**
- Create: `docs/specs/adr-0004-runtime-target.md`

- [ ] **Step 1: Write the file with this content:**

```markdown
# ADR-0004 — Runtime Target: Host-Primary, Flatpak Distribution, Podman Optional

- **Date:** 2026-06-03
- **Status:** Accepted
- **Context phase:** Stabilization & Linux-Readiness program, S1

## Context

Feather is Linux-only (Fedora target). Until now, "where does Feather run" was an
undocumented assumption: all prior research silently assumed a host process
(system Chromium via RPM Fusion, libsecret, XDG portals, Wayland sockets, D-Bus).
The option of running Feather inside a Podman container was raised and needs an
explicit decision, because it changes how Chromium, Wayland, GPU, and credentials
are reached.

Feather's endgame is a GUI daily-driver browser (Phase 4 shell + Wayland + GPU +
audio). GUI apps in containers fight Wayland/GPU/audio passthrough. The
desktop-native sandbox for a GUI app is Flatpak (uses XDG portals), which the
research already recommends for distribution. Podman's strengths (reproducible
isolation, Fedora-native, rootless) apply best to the headless service / CI /
future agent-runtime side, not the daily-driver path.

## Decision

1. **Host-primary.** The daily-driver runs as a host process. This is the primary
   supported runtime.
2. **Flatpak** is the eventual distribution/sandbox format (planned in/around
   Phase 4), using XDG portals for file/credential/screen access.
3. **Podman** is an *optional* target for the headless service and CI only — not
   the primary runtime, not the daily-driver path.
4. **Decision-independent code.** Anything that references the browser binary must
   be configurable (e.g. `FEATHER_CHROMIUM_PATH`) so it works whether Chromium is
   host-installed (RPM Fusion) or baked into a container image. No hardcoded host
   paths.

## Consequences

- Phase 4's Wayland/GPU/GUI path stays simple (no container passthrough).
- The S2 `executablePath` work serves host and container equally.
- Flatpak packaging and portal integration become explicit Phase 4/5 concerns.
- If a future need makes a containerized daily-driver compelling, this ADR must be
  revisited; it is not a permanent ban on Podman, only a primary-path decision.
```

- [ ] **Step 2: Verify it is committed to docs/specs (tracked) — confirm not ignored:**

Run: `git check-ignore docs/specs/adr-0004-runtime-target.md`
Expected: no output (not ignored).

- [ ] **Step 3: Commit**

```bash
git add docs/specs/adr-0004-runtime-target.md
git commit -m "docs(s1): ADR-0004 — host-primary runtime, Flatpak distribution, Podman optional"
```

### Task 9: Write ADR-0005 (agentic North Star)

**Files:**
- Create: `docs/specs/adr-0005-agentic-north-star.md`

- [ ] **Step 1: Write the file with this content:**

```markdown
# ADR-0005 — Agentic North Star: Token & Context Efficiency (Constraint + Deferral)

- **Date:** 2026-06-03
- **Status:** Accepted (constraint); tool selection deferred
- **Context phase:** Stabilization & Linux-Readiness program, S1

## Context

Feather's vision is an agentic-AI-native + human daily-driver browser (Cookie Mine
model, ADR-0003): local AI agents open tabs inside the human's running session and
piggyback on its accumulated trust context. For that to be good, agents must use
two scarce resources efficiently:

1. **The browser's API auth token** — agents reuse the human session's token and
   live context rather than launching isolated, re-authenticated contexts.
2. **Their own LLM context window** — how browser state is fed to the model must be
   compact.

Research informing this:
- Microsoft's Playwright MCP server (~30K stars) feeds pages to non-vision models as
  **ARIA accessibility snapshots** (YAML), not screenshots.
- Token cost differs sharply by interface: Playwright **MCP ≈ 114K tokens** vs.
  **CLI ≈ 27K tokens** for the same task. CLI is ~4× cheaper but is task-focused and
  loses persistent state.
- The Cookie Mine model needs **persistent state**, which favors MCP over CLI.
- The MCP spec is in a release candidate; **final 2026-07-28** with major changes
  (stateless core, Tasks-as-extension). Designing the hub before then risks rework.

## Decision

- Record **token & context efficiency as a standing design constraint** for all
  agent-facing work.
- **Defer the tool-selection decision** (build on Playwright MCP vs. a Feather hub
  vs. Playwright CLI vs. a hybrid) to **ROADMAP Phase 5 Step 0**, after the
  2026-07-28 MCP spec is final.
- Until then, treat this as a **design lens, not a build task.** Specifically: the
  S2 observability work (tab events, tracing, any future page/context snapshot)
  should produce data that is compact and agent-friendly, so we are not forced into
  a wasteful representation later.

## Consequences

- No agent tooling is built during the stabilization program.
- S2 design reviews check event/context payloads for compactness.
- Phase 5 Step 0 inherits a clear, pre-recorded requirement and the research above.
```

- [ ] **Step 2: Commit**

```bash
git add docs/specs/adr-0005-agentic-north-star.md
git commit -m "docs(s1): ADR-0005 — agentic North Star (token/context efficiency, tool choice deferred)"
```

---

## SESSION 1C — Answer the unknowns

> Throwaway research probes; no production code is changed or kept. Blocks: none (can run anytime, but record findings before planning S2/S3).

### Task 10: Spike — fastify-sse-v2 v5 compatibility

**Files:**
- Create: `raw/_inbox/spike-fastify-sse-v2-v5-compat.md`

- [ ] **Step 1: Query the published metadata**

Run:
```bash
npm view fastify-sse-v2 version
npm view fastify-sse-v2 peerDependencies
npm view fastify-sse-v2 dist-tags
```
Expected: prints the latest version, its `fastify` peer-dependency range, and tags. Read whether the peer range allows `5.x` (e.g. `">=4.0.0"` or `"^5.0.0"` includes 5; `"^4.0.0"` does NOT).

- [ ] **Step 2: If the peer range is ambiguous, check the changelog/repo**

Run: `npm view fastify-sse-v2 repository.url` then `WebFetch` the repo's releases/CHANGELOG to confirm a release that lists Fastify v5 support. Record the version number and the source URL.

- [ ] **Step 3: Record the finding** in `raw/_inbox/spike-fastify-sse-v2-v5-compat.md`:

```markdown
# Spike: fastify-sse-v2 + Fastify v5 compatibility
# Date: 2026-06-03 | S1 Session 1C

## Question
Does our SSE plugin `fastify-sse-v2` (currently ^4.2.2) support Fastify v5?
This gates the S3 Fastify v4→v5 migration.

## Method
`npm view fastify-sse-v2 version | peerDependencies | dist-tags`; changelog if needed.

## Findings
- Latest version: <fill from Step 1>
- fastify peer range: <fill from Step 1>
- Supports Fastify v5? <YES / NO / PARTIAL — with evidence URL>

## Implication for S3
- If YES: Fastify v5 migration is a small phase — bump fastify + sse-v2, run tests.
- If NO: S3 must plan a workaround (pin sse-v2, replace the SSE plugin, or
  implement SSE without the plugin). Note candidate replacements here.
```

- [ ] **Step 4: Commit**

```bash
git add raw/_inbox/spike-fastify-sse-v2-v5-compat.md
git commit -m "docs(s1): record fastify-sse-v2 v5 compatibility spike (gates S3)"
```

### Task 11: Spike — system Chromium as executablePath

**Files:**
- Create: `raw/_inbox/spike-system-chromium-executablepath.md`
- Temporary: `/tmp/feather-chromium-spike.mjs` (deleted in Step 5)

- [ ] **Step 1: Locate a system Chromium binary**

Run:
```bash
which chromium chromium-browser chromium-headless 2>/dev/null; rpm -q chromium chromium-headless 2>/dev/null; echo "done"
```
Expected: zero or more paths. If none found, record that system Chromium is not installed and note the install command (`sudo dnf install chromium` from RPM Fusion) as a prerequisite, then skip to Step 4 with result = "NOT TESTED (not installed)".

- [ ] **Step 2: Write a throwaway probe script** at `/tmp/feather-chromium-spike.mjs`:

```javascript
import { chromium } from "playwright";

const execPath = process.env.SPIKE_CHROMIUM_PATH;
if (!execPath) { console.error("set SPIKE_CHROMIUM_PATH"); process.exit(2); }

try {
  const ctx = await chromium.launchPersistentContext("/tmp/feather-spike-profile", {
    headless: true,
    executablePath: execPath,
  });
  const page = await ctx.pages()[0] ?? await ctx.newPage();
  await page.goto("data:text/html,<title>spike-ok</title>", { timeout: 15000 });
  const title = await page.title();
  const version = ctx.browser()?.version?.() ?? "unknown";
  console.log("LAUNCH_OK", "title=", title, "version=", version);
  await ctx.close();
  process.exit(0);
} catch (e) {
  console.error("LAUNCH_FAIL", e.message);
  process.exit(1);
}
```

- [ ] **Step 3: Run the probe against the found path** (substitute the path from Step 1):

Run:
```bash
SPIKE_CHROMIUM_PATH=/usr/bin/chromium node /tmp/feather-chromium-spike.mjs; echo "exit=$?"
```
Expected: `LAUNCH_OK title= spike-ok version= <NNN>` and `exit=0` on success, or `LAUNCH_FAIL <message>` and `exit=1` on failure (record the message — it usually reveals a CDP/version mismatch).

- [ ] **Step 4: Record the finding** in `raw/_inbox/spike-system-chromium-executablepath.md`:

```markdown
# Spike: system Chromium as Playwright executablePath
# Date: 2026-06-03 | S1 Session 1C

## Question
Can Playwright drive Fedora's system Chromium via `executablePath`, so we can drop
the ~300MB bundled Chromium download? Informs S2 (FEATHER_CHROMIUM_PATH).

## Environment
- System Chromium path(s): <from Step 1, or "not installed">
- System Chromium version: <from rpm -q or probe output>
- Playwright version: 1.50 (current)

## Result
- LAUNCH_OK / LAUNCH_FAIL / NOT TESTED: <fill>
- Evidence (probe output line): <paste LAUNCH_OK/LAUNCH_FAIL line>

## Implication for S2
- If OK: FEATHER_CHROMIUM_PATH is viable now; document the supported version skew.
- If FAIL (version mismatch): keep bundled Chromium as default, make
  FEATHER_CHROMIUM_PATH opt-in, and note the minimum compatible Chromium version.
```

- [ ] **Step 5: Delete the throwaway script and probe profile**

Run:
```bash
rm -f /tmp/feather-chromium-spike.mjs; rm -rf /tmp/feather-spike-profile; echo "cleaned"
```
Expected: `cleaned`. Confirm no source files changed: `git status --short src/` → no output.

- [ ] **Step 6: Commit**

```bash
git add raw/_inbox/spike-system-chromium-executablepath.md
git commit -m "docs(s1): record system-Chromium executablePath spike (informs S2)"
```

---

## S1 exit checklist

- [ ] README / PROGRESS / ops/phase.md / context/active.md / ROADMAP / AGENTS.md all reflect "Phase 3 complete; stabilization program S1 active" and Linux-only/runtime facts.
- [ ] `grep -rn "Phase 2 Complete" README.md ROADMAP.md PROGRESS.md` → no output.
- [ ] `docs/docs-map.md` exists; `/init` and `/start` command docs point to it.
- [ ] `docs/specs/adr-0004-runtime-target.md` and `docs/specs/adr-0005-agentic-north-star.md` exist and are tracked.
- [ ] Both spike findings recorded in `raw/_inbox/` with a concrete YES/NO/result.
- [ ] `git status --short src/ tests/` → no output (no production code changed).
- [ ] **Docs-true check passes.** Then run `/stop` to hand off and update tracking; next session brainstorms S2.

---

## Self-review notes (for the executor)

- This plan changes **no production code**; therefore no automated tests run. Verification is by `grep` of stale strings and by the spike probe exit codes. That is intentional for a Foundation phase.
- ADR-0004 and ADR-0005 record decisions already approved by the owner during planning; the executor writes them as given, not as open questions.
- Spike findings (Tasks 10–11) are inputs to the *next* planning passes (S3 and S2 respectively) — record them precisely; do not act on them in S1.
```
