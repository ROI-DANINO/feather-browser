---
title: Repo Structure Cleanup — journal/ Consolidation
date: 2026-06-03
status: implemented
type: design
supersedes: none
maps_to: journal/docs-map.md, journal/README.md, AGENTS.md
---

# Repo Structure Cleanup — `journal/` Consolidation

## Problem

The repository root is dominated by personal operating-system scaffolding, which buries
the actual product. A first-time visitor to the public repo
(`github.com/ROI-DANINO/feather-browser`) sees ~15 directories and ~14 loose files, most
of them workflow plumbing (`context/`, `ops/`, `work/`, `raw/`, `research/`, plus
`log.md`, `schema.md`, `index.md`). The product — a browser (`src/`, `tests/`, `docs/`,
`README`) — is four lines lost among ten lines of process scaffolding.

Three additional gaps undercut the "professional, build-in-public" goal:

- **No `LICENSE`.** Without one, nobody can legally use or contribute to the code, and a
  missing license reads as "unfinished."
- **Empty `ui-playground/`** directory left in the tree.
- **Dead `index.md`** — a "knowledge map" template whose sections (product, browser, etc.)
  were never filled in and which no workflow references. Safe to remove.

Separately, several files that *are* the project's operating system are not tracked in git
at all, so they have no history and no backup, and one of them
(`docs/commands/stop.md`) is declared canonical in `docs-map.md` yet exists nowhere in the
repo:

- `.claude/commands/` (slash-command definitions)
- `skills/` (skill definitions)
- `docs/commands/` (canonical command docs)
- `work/<desk>/context.md` (desk contexts)

## Goals

1. Make the repo root read as a deliberate, professional browser project.
2. Keep the build-in-public ethos: the workflow stays **public and visible**, just
   organized under one clear home — nothing hidden, nothing deleted except genuine dead
   weight.
3. Close the objective gaps: add a `LICENSE`, remove dead files, and bring the project's
   operating-system files (process defs + desk contexts) under version control.
4. Break nothing: the `/start` → `/stop` workflow and the application build must work
   exactly as before.

## Non-Goals

- No changes to application code (`src/`, `tests/`).
- No relocation of build/config files (`tsconfig.json`, `vitest*.config.ts`,
  `package*.json`) — config at the root is the professional norm and moving it only risks
  breaking tooling.
- No relocation of `.claude/` or `skills/` — those are where Claude Code's tooling expects
  to find commands and skills; moving them would break discovery.
- No rewriting of historical records (see Path Handling).
- No license-monetization machinery (AGPL + commercial dual-licensing). Apache-2.0 only
  for now; revisit if/when Feather gets traction.

## Decisions

- **License: Apache-2.0.** Permissive plus an explicit patent grant. At this stage
  adoption and credibility outweigh defensibility; a commercial layer (Hermes) is
  permitted on top regardless; and as sole copyright holder Roi can relicense future
  versions later if defensibility ever matters.
- **Workflow home name: `journal/`** — visible (not a dotfolder), and the name fits the
  build-in-public narrative.

## Design

### 1. The move

A new top-level `journal/` directory becomes the single home for the living operating
process and its running state.

| From | To | Rationale |
|------|----|-----------|
| `context/` | `journal/context/` | resume state (`active.md`) |
| `ops/` | `journal/ops/` | `phase.md`, `tasks.md`, `sessions/`, `archive/` |
| `work/` | `journal/work/` | desk contexts |
| `raw/` | `journal/raw/` | research intake (`_inbox/`) |
| `log.md` | `journal/log.md` | work log |
| `schema.md` | `journal/README.md` | it *describes* the journal, so it becomes the journal's front-door readme |
| `docs/docs-map.md` | `journal/docs-map.md` | source-of-truth map is workflow-meta, not project documentation |

**Stays put:** `src/`, `tests/`, `docs/` (technical docs — architecture, api-reference,
`specs/`, `plans/`), `blog/`, `README.md`, `ROADMAP.md`, `PROGRESS.md`, `AGENTS.md`, all
config files, `.claude/`, `skills/`.

**Ignored-and-invisible-to-public, left in place:** `.superpowers/`, `.remember/`,
`research/` (all gitignored; they do not affect the public view).

**Add:** `LICENSE` (Apache-2.0, copyright holder Roi Danino).

**Delete:** empty `ui-playground/`; dead `index.md`.

**Resulting public root:**

```
README  ROADMAP  PROGRESS  AGENTS  LICENSE
package.json  package-lock.json  tsconfig.json  vitest*.config.ts
src/  tests/  docs/  blog/        ← the product, unmissable
journal/                          ← the whole build-in-public process, one click
.claude/  skills/                 ← tooling (tracked)
research/  .superpowers/  .remember/  ← ignored plumbing
```

### 2. Path handling

References to the moved paths fall into two classes, handled differently:

- **Live operative docs — rewritten** to the new paths, because the workflow acts on them:
  - `AGENTS.md`
  - `journal/README.md` (the former `schema.md`)
  - `journal/docs-map.md` (the former `docs/docs-map.md`)
  - `.claude/commands/*.md` (`start.md`, `stop.md`, `research.md`, `init.md`)
  - `docs/commands/*.md` (the canonical command-doc mirror of the above)
  - `skills/*/SKILL.md` (`fb-start`, `fb-stop`, `blog-entry`, `research`)
  - `ROADMAP.md` (confirmed to reference workflow paths; `README.md` and `PROGRESS.md` do
    not, and are left alone)

  **Enumeration caveat:** several of these (`.claude/commands/`, `skills/`,
  `docs/commands/`) are currently git-ignored/untracked, so a `git ls-files`-based search
  or a single `grep -r .` that honours ignore rules will *not* surface them — yet they are
  the files most needing rewrites. The sweep MUST scan the working tree directly and name
  these directories explicitly.
- **Historical records — left exactly as written**, because they are point-in-time
  snapshots and rewriting them would falsify history. They move physically with their
  parent folder; their text is untouched:
  - `journal/ops/sessions/*`, `journal/ops/archive/*`
  - `journal/raw/_inbox/*`
  - past `docs/plans/*`, `docs/specs/*`

The `docs-map.md` table and `schema.md`/`journal/README.md` body are updated to describe
the new locations (they are the source of truth for where things live).

### 3. Tracking & gitignore

Done once, as part of this change. After it:

- **Tracked (newly):** `.claude/commands/`, `skills/`, `docs/commands/`,
  `journal/work/*/context.md`.
- **Stays ignored:** `.claude/settings.local.json` (machine-local), `.remember/` buffers
  (except the already-tracked `remember.md`), `.superpowers/`, `research/`.

**Non-anchored pattern trap (critical).** The current `.gitignore` rules `context/`,
`ops/`, `work/`, `raw/`, and `log.md` have no leading slash, so git matches them against a
directory/file of that name *at any depth*. After the move, `journal/context/`,
`journal/ops/`, `journal/work/`, `journal/raw/`, and `journal/log.md` would therefore
**still be ignored**. Moving content under `journal/` does not escape these rules. The
`.gitignore` rewrite must remove or re-anchor the old patterns and add explicit rules for
the new `journal/` layout, or newly created files there (e.g. future session files, the
now-tracked desk contexts) will be silently dropped.

`.gitignore` is therefore rewritten so the broad name-anywhere ignores are replaced with
targeted, anchored rules: ignore machine-local and buffer content
(`.claude/settings.local.json`, `.remember/*` except `remember.md`, `.superpowers/`,
`research/`), but track the operating-system definitions (`.claude/commands/`, `skills/`,
`docs/commands/`) and the relocated `journal/` tracked content. Existing force-added
tracked files (e.g. `journal/context/active.md`, `journal/ops/tasks.md`, `journal/log.md`)
remain tracked across the `git mv`; the rewrite ensures *new* siblings are tracked too.

### 4. Verification

After the move, before committing:

1. Working-tree `grep` (NOT `git ls-files`, NOT ignore-aware tools) for any *live*
   reference to an old top-level path (`context/`, `ops/`, `work/`, `raw/`, `schema.md`,
   `log.md`, `docs/docs-map.md`), explicitly including the untracked dirs `.claude/`,
   `skills/`, `docs/commands/`. Confirm the only remaining hits are inside historical
   records (sessions, archive, raw notes, past plans/specs).
2. Run the test suites (`vitest` unit/integration) to prove the application is unaffected.
3. Dry-run `/start` mentally against the new paths: confirm every path it reads now
   resolves under `journal/`.
4. Confirm the gitignore fix worked: create a throwaway file under `journal/ops/` and
   `journal/work/` and verify `git status` would track it (then remove it). This proves
   the non-anchored-pattern trap is closed.
5. Confirm `git status` shows the moves as renames and that the newly tracked
   files (`.claude/commands/`, `skills/`, `docs/commands/`, desk contexts) appear.
6. Confirm via `git ls-files` diff (before vs after) that the tracked set only *grew* —
   nothing previously tracked was accidentally dropped.

## Risks & Mitigations

- **Risk:** a live path reference is missed and `/start`/`/stop` silently reads the wrong
  place. **Mitigation:** the working-tree grep sweep in Verification step 1 (explicitly
  including untracked dirs) plus the enumerated live-docs list in Path Handling. This is a
  known blind spot: an ignore-aware search hides the very command/skill files that need
  rewriting.
- **Risk:** the non-anchored gitignore patterns silently re-ignore content moved under
  `journal/`. **Mitigation:** the gitignore rewrite re-anchors them, verified by the
  throwaway-file check in Verification step 4.
- **Risk:** moving files git-detaches history. **Mitigation:** use `git mv` so history
  follows; confirm via `git status` (Verification step 5).
- **Risk:** gitignore rewrite accidentally untracks something currently tracked.
  **Mitigation:** diff `git ls-files` before vs after; the set should only grow
  (Verification step 6).

## Rollout

Single coordinated change on the `dev` branch (the move + path rewrites + LICENSE +
deletions + gitignore must land together so the repo is never in a half-moved state),
verified per section 4, then committed. Detailed step ordering is deferred to the
implementation plan.
