# Repo Structure Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the public repo read as a deliberate, professional browser project by consolidating personal workflow scaffolding under one visible `journal/` home, adding a LICENSE, removing dead files, and bringing the project's operating-system files under version control — without breaking the app or the `/start`→`/stop` workflow.

**Architecture:** Move the living operating process (`context/`, `ops/`, `work/`, `raw/`, `log.md`, `schema.md`, `docs/docs-map.md`) into a new top-level `journal/` directory. Rewrite the git-ignore rules (currently non-anchored, so they would re-ignore the moved content) and rewrite path references in *live* operative docs only — historical records keep their original text. Application code (`src/`, `tests/`) is untouched and proves the move is safe.

**Tech Stack:** git (`git mv`, `.gitignore`), Node/TypeScript app verified via `vitest`. No application code changes.

**Spec:** `docs/specs/2026-06-03-repo-structure-cleanup-design.md`

---

## File Structure

**New:**
- `LICENSE` — Apache-2.0 license text.
- `journal/` — workflow home. Receives `context/`, `ops/`, `work/`, `raw/`, `log.md`, plus `journal/README.md` (from `schema.md`) and `journal/docs-map.md` (from `docs/docs-map.md`).

**Deleted:**
- `ui-playground/` (empty), `index.md` (dead template).

**Rewritten (paths only):** `.gitignore`, `AGENTS.md`, `ROADMAP.md`, `journal/README.md`, `journal/docs-map.md`, `.claude/commands/*.md`, `docs/commands/*.md`, `skills/*/SKILL.md`, `journal/context/active.md`.

**Untouched:** `src/`, `tests/`, all config files, `README.md`, `PROGRESS.md`, `blog/`, `docs/` technical content, and all historical records (`journal/ops/sessions/*`, `journal/ops/archive/*`, `journal/raw/_inbox/*`, past `docs/plans/*`, `docs/specs/*`).

**Path mapping (used in Task 6):**

| Old | New |
|-----|-----|
| `context/` | `journal/context/` |
| `ops/` | `journal/ops/` |
| `work/` | `journal/work/` |
| `raw/` | `journal/raw/` |
| `log.md` | `journal/log.md` |
| `schema.md` | `journal/README.md` |
| `docs/docs-map.md` | `journal/docs-map.md` |

---

## Task 1: Add LICENSE (Apache-2.0)

**Files:**
- Create: `LICENSE`

- [ ] **Step 1: Write the LICENSE file**

Create `LICENSE` containing the **verbatim** Apache License 2.0 text (the canonical, unmodified document from `https://www.apache.org/licenses/LICENSE-2.0.txt`). In the appendix boilerplate at the bottom, fill the copyright line:

```
   Copyright 2026 Roi Danino

   Licensed under the Apache License, Version 2.0 (the "License");
   ...
```

(The body of the license is fixed legal text — do not edit it beyond the copyright line.)

- [ ] **Step 2: Verify the file is complete**

Run: `head -1 LICENSE && wc -l LICENSE`
Expected: first line `                                 Apache License`, ~202 lines total.

- [ ] **Step 3: Commit**

```bash
git add LICENSE
git commit -m "docs: add Apache-2.0 LICENSE"
```

---

## Task 2: Remove dead weight

**Files:**
- Delete: `ui-playground/`, `index.md`

- [ ] **Step 1: Confirm both are safe to remove**

Run: `ls -A ui-playground/ ; echo "---" ; cat index.md`
Expected: `ui-playground/` lists nothing (empty); `index.md` shows only empty `##` section headers.

- [ ] **Step 2: Remove them**

```bash
rm -r ui-playground
rm index.md
```

(`index.md` is untracked-or-tracked; `git rm` is unnecessary since the next `git add -A` records the deletion. If `git status` shows it as tracked, use `git rm index.md` instead.)

- [ ] **Step 3: Verify gone**

Run: `ls ui-playground index.md 2>&1`
Expected: "No such file or directory" for both.

- [ ] **Step 4: Commit**

```bash
git add -A ui-playground index.md
git commit -m "chore: remove empty ui-playground and dead index.md"
```

---

## Task 3: Track the in-place operating-system files

These directories do **not** move — `.claude/commands/`, `skills/`, `docs/commands/`. Bring them under version control now, independently of the move, so this safe win lands before the riskier restructure.

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Snapshot the current tracked set (baseline for later diff)**

```bash
git ls-files | sort > /tmp/tracked-before.txt
wc -l /tmp/tracked-before.txt
```

- [ ] **Step 2: Re-anchor `.claude` and un-ignore the definition dirs**

Edit `.gitignore`. Replace the line `.claude/` with rules that ignore only machine-local content but keep `commands/`:

```gitignore
# Claude Code: track command/skill definitions, ignore machine-local state
.claude/*
!.claude/commands/
.claude/settings.local.json
```

Remove the standalone `skills/` line (so `skills/` becomes tracked).
Remove the `docs/commands/` line (so the canonical command docs become tracked).

- [ ] **Step 3: Stage the now-tracked files**

```bash
git add .gitignore .claude/commands skills docs/commands
git status --short
```

Expected: new `A` entries for `.claude/commands/*.md`, `skills/*/SKILL.md`, `docs/commands/*.md`, and a modified `.gitignore`.

- [ ] **Step 4: Verify the tracked set only grew**

```bash
git ls-files | sort > /tmp/tracked-after.txt
comm -23 /tmp/tracked-before.txt /tmp/tracked-after.txt
```

Expected: **no output** (nothing was dropped). Then:

```bash
comm -13 /tmp/tracked-before.txt /tmp/tracked-after.txt
```

Expected: lists the newly tracked command/skill/doc files.

- [ ] **Step 5: Commit**

```bash
git commit -m "chore: track command, skill, and canonical command-doc definitions"
```

---

## Task 4: Create `journal/` and move the workflow content

**Files:**
- Create: `journal/`
- Move: `context/`, `ops/`, `work/`, `raw/`, `log.md`, `schema.md`, `docs/docs-map.md`

> No commit at the end of this task — the repo's live docs will still reference old paths until Task 6. Tasks 4–6 land in one commit (Task 6, Step 5) so no committed state is ever half-moved.

- [ ] **Step 1: Create the directory**

```bash
mkdir journal
```

- [ ] **Step 2: Move tracked files with `git mv` (preserves history)**

`git mv` only works on tracked paths. Move the tracked workflow content:

```bash
git mv context journal/context
git mv ops journal/ops
git mv log.md journal/log.md
git mv schema.md journal/README.md
git mv docs/docs-map.md journal/docs-map.md
```

If any `git mv` errors with "not under version control" for a whole dir, fall back to per-file `git mv` for the tracked files inside it, then handle untracked files in Step 3.

- [ ] **Step 3: Move untracked workflow content with plain `mv`**

`work/` (desk contexts) and `raw/` are currently untracked, so use plain `mv`:

```bash
mv work journal/work
mv raw journal/raw
```

- [ ] **Step 4: Verify the moves landed**

```bash
ls journal
ls journal/context journal/ops journal/work journal/raw
```

Expected: `journal/` contains `context  docs-map.md  log.md  ops  raw  README.md  work`; subdirs contain their files (`active.md`, `tasks.md`/`phase.md`/`sessions`/`archive`, desk `context.md`s, `_inbox`).

---

## Task 5: Rewrite `.gitignore` for the new `journal/` layout

The current ignore patterns `context/`, `ops/`, `work/`, `raw/`, `log.md` are **non-anchored** — they match those names at any depth, so they would silently re-ignore `journal/context/`, `journal/ops/`, etc. Fix this before staging.

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Re-anchor / remove the moved-content rules**

Edit `.gitignore`:
- Delete the lines `context/`, `ops/`, `work/`, `raw/`, `log.md` (their content now lives under `journal/` and should be tracked).
- Keep `research/`, `.superpowers/`, `node_modules/`, `dist/`, `build/`, `.next/`, `.cache/`, `coverage/`, `.env`, `.env.*`, `*.log`, `*.tmp`, `.DS_Store`.
- Keep `.remember/` handling as-is (the nested `.remember/.gitignore` with `*` plus the already-force-tracked `remember.md`).
- Add an anchored rule only for genuinely churny history if desired (optional, default: track all of `journal/`):

```gitignore
# journal/ is tracked (the build-in-public process). Nothing under it is ignored
# except via the patterns above (e.g. *.log, *.tmp).
```

- [ ] **Step 2: Stage the moved content and verify the non-anchored trap is closed**

```bash
git add -A journal .gitignore docs
git status --short
```

Expected: renames (`R`) for the `git mv`'d files, new `A` for `journal/work/*` and `journal/raw/*`, modified `.gitignore`, and a deletion/rename for `docs/docs-map.md`.

Prove new files under `journal/` are no longer ignored:

```bash
touch journal/ops/__probe__ journal/work/__probe__
git status --porcelain journal/ops/__probe__ journal/work/__probe__
rm journal/ops/__probe__ journal/work/__probe__
```

Expected: both probe files appear as untracked (`??`) — meaning git would track them. If they do **not** appear, a non-anchored ignore rule is still active; fix `.gitignore` before continuing.

- [ ] **Step 3: Verify the tracked set only grew (no accidental drops)**

```bash
git ls-files | sort > /tmp/tracked-after2.txt
comm -23 /tmp/tracked-before.txt /tmp/tracked-after2.txt | grep -vE '^(context/|ops/|log\.md$|schema\.md$|docs/docs-map\.md$)'
```

Expected: **no output** — the only paths that left the old locations are the ones we deliberately moved (they reappear under `journal/`). Confirm their new homes:

```bash
git ls-files journal | grep -E 'context/active|ops/tasks|log\.md|README\.md|docs-map'
```

Expected: lists the moved files at their `journal/` paths.

---

## Task 6: Rewrite live path references, verify, and commit the restructure

Only **live operative docs** are rewritten. Historical records keep their original text.

**Files (live docs to rewrite):**
- Modify: `AGENTS.md`, `ROADMAP.md`, `journal/README.md`, `journal/docs-map.md`, `journal/context/active.md`, `.claude/commands/*.md`, `docs/commands/*.md`, `skills/*/SKILL.md`

- [ ] **Step 1: Define the live-doc file set**

```bash
LIVE="AGENTS.md ROADMAP.md journal/README.md journal/docs-map.md journal/context/active.md \
$(ls .claude/commands/*.md) $(ls docs/commands/*.md) $(ls skills/*/SKILL.md)"
echo "$LIVE"
```

- [ ] **Step 2: Apply the path rewrites to the live-doc set**

Run each replacement across only the live-doc set (longest/most-specific paths first to avoid partial overlaps; `schema.md`→`journal/README.md` last):

```bash
for f in $LIVE; do
  sed -i \
    -e 's#docs/docs-map\.md#journal/docs-map.md#g' \
    -e 's#\bcontext/active\.md#journal/context/active.md#g' \
    -e 's#\bcontext/#journal/context/#g' \
    -e 's#\bops/#journal/ops/#g' \
    -e 's#\bwork/#journal/work/#g' \
    -e 's#\braw/_inbox#journal/raw/_inbox#g' \
    -e 's#\braw/#journal/raw/#g' \
    -e 's#\blog\.md#journal/log.md#g' \
    -e 's#\bschema\.md#journal/README.md#g' \
    "$f"
done
```

- [ ] **Step 3: Manually fix `journal/README.md` self-reference**

The former `schema.md` now lives at `journal/README.md`. Open it and ensure it reads as the journal's front-door readme: its title and intro should describe "the journal — the project's operating-file system," and its own entries should use `journal/`-relative paths. Also confirm `journal/docs-map.md` lists every relocated surface at its new path.

- [ ] **Step 4: Run the full verification gate**

```bash
# 4a. No live reference to an OLD path remains (scan working tree, INCLUDE untracked dirs)
grep -rnE '(^|[^/])(context|ops|work|raw)/|(^|[^/])schema\.md|(^|[^/])log\.md|docs/docs-map\.md' \
  AGENTS.md ROADMAP.md journal/README.md journal/docs-map.md journal/context/active.md \
  .claude/commands docs/commands skills \
  | grep -v 'journal/'
```

Expected: **no output** (every remaining workflow path is `journal/`-prefixed). Any hit is a missed reference — fix it.

```bash
# 4b. The application is untouched — full test suite passes
npx vitest run
```

Expected: same pass count as before the reorg (no failures, no path errors).

```bash
# 4c. /start dry-run: every file the start command reads now resolves
for p in README.md ROADMAP.md PROGRESS.md journal/README.md journal/ops/tasks.md \
         journal/ops/phase.md journal/context/active.md journal/log.md; do
  test -e "$p" && echo "OK  $p" || echo "MISSING  $p"
done
```

Expected: all `OK`.

- [ ] **Step 5: Stage everything and commit the restructure**

```bash
git add -A
git status --short    # final human-readable review of the whole change
git commit -m "refactor: consolidate workflow under journal/, tidy repo root

- move context/ ops/ work/ raw/ log.md schema.md docs/docs-map.md into journal/
- rename schema.md -> journal/README.md (journal front-door)
- re-anchor .gitignore so journal/ content is tracked
- rewrite live path references; historical records left as snapshots"
```

- [ ] **Step 6: Mark the spec done and leave the docs true**

Edit `docs/specs/2026-06-03-repo-structure-cleanup-design.md` frontmatter: `status: draft` → `status: implemented`. Update `journal/context/active.md` if the active plan should note the reorg. Then:

```bash
git add docs/specs/2026-06-03-repo-structure-cleanup-design.md journal/context/active.md
git commit -m "docs: mark repo-structure cleanup implemented"
```

---

## Self-Review

**Spec coverage:**
- LICENSE (Apache-2.0) → Task 1 ✔
- Remove `ui-playground/` + `index.md` → Task 2 ✔
- Track `.claude/commands/`, `skills/`, `docs/commands/` → Task 3 ✔
- Track desk contexts (`work/`→`journal/work/`) → Task 4 (move) + Task 5 (gitignore) ✔
- Move workflow content to `journal/` → Task 4 ✔
- `schema.md` → `journal/README.md`; `docs-map.md` → `journal/docs-map.md` → Task 4 + Task 6 Step 3 ✔
- Non-anchored gitignore trap → Task 5 (re-anchor) + Step 2 probe-file check ✔
- Live-vs-historical path handling → Task 6 Steps 1–2 (live set only) ✔
- `docs/commands/*` added to rewrite list → Task 6 Step 1 ✔
- Verification (working-tree grep incl. untracked dirs, vitest, ls-files diff, gitignore probe) → Task 5 Steps 2–3 + Task 6 Step 4 ✔
- "Leave the docs true" + spec status → Task 6 Step 6 ✔

**Placeholder scan:** Apache license body is referenced as canonical external text (fixed legal document, not authored content) — acceptable. No TBD/TODO steps. All commands concrete.

**Type/path consistency:** path-mapping table matches the sed rules in Task 6 Step 2 and the verification globs in Task 6 Step 4. Baseline file `/tmp/tracked-before.txt` is created in Task 3 Step 1 and reused in Task 5 Step 3.
