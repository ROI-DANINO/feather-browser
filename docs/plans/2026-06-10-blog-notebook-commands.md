# /blog + /notebook Commands & /stop Blog Gate — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `/blog` and `/notebook` slash commands, replace `/stop`'s self-judging blog step with an always-ask gate, and fix the two stale blog docs.

**Architecture:** Approach A from the spec (`docs/specs/2026-06-10-blog-notebook-commands-design.md`): two new markdown command files in `.claude/commands/`, an in-place edit of `stop.md` step 4, and doc cleanups in `blog/`. Entry style rules stay single-sourced in `blog/README.md` — commands point at them, never copy them.

**Tech Stack:** Markdown only. No code, no tests — verification is reading the files back (grep checks) plus the behavioral checks in the spec's Testing section.

---

### Task 1: Rewrite `/stop` step 4 as the blog gate

**Files:**
- Modify: `.claude/commands/stop.md` (step 4, currently line 19)

- [ ] **Step 1: Replace step 4**

Find this exact line in `.claude/commands/stop.md`:

```markdown
4. **Blog check:** did a phase complete, or did a significant decision land this session? If yes, write or update a `blog/NNNN-slug.md` entry (first-person, hero's-journey, ends with a LinkedIn cut) and update `blog/README.md` index. If no, skip.
```

Replace it with:

```markdown
4. **Blog gate (always ask, never decide alone):**
   - Summarize in 1-2 lines what this session might be blog-worthy for, or say "nothing obvious".
   - If `blog/_pending.md` has owed lines, mention the count.
   - Ask Roi directly: **write a blog entry this session — yes or no?**
     - **Yes** → write/update `blog/NNNN-slug.md` about *this session* per the style guardrails in
       `blog/README.md` (first-person, hero's-journey, ends with a LinkedIn cut). Fold in any owed
       `blog/_pending.md` moments that fit the narrative and remove those consumed lines. Update
       the `blog/README.md` index table.
     - **No** → append one line to `blog/_pending.md` under `## Owed`:
       `- journal/ops/sessions/<nickname>-<timestamp>.md — <one-line hook> — <YYYY-MM-DD>`
       (use the session filename step 5 is about to write; capture the hook while it's fresh).

   Nothing is ever written to `blog/` without an explicit yes.
```

Numbered steps 5-16 below it stay untouched (the replacement keeps the number `4`, so no renumbering).

- [ ] **Step 2: Verify the edit**

Run: `grep -c "Blog gate" .claude/commands/stop.md && grep -c "Blog check" .claude/commands/stop.md`
Expected: `1` then `0` (grep exits 1 on the second pattern — that's the pass condition).

- [ ] **Step 3: Commit**

```bash
git add .claude/commands/stop.md
git commit -m "feat(commands): /stop blog step becomes an always-ask gate

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Create the `/blog` command

**Files:**
- Create: `.claude/commands/blog.md`

- [ ] **Step 1: Write the file**

Create `.claude/commands/blog.md` with exactly this content:

```markdown
# /blog — Write A Build-Log Entry

If slash commands are not natively supported by the current agent, open this file and execute the checklist manually.

Catch up the build log. Scan first, then ask — never decide alone what gets published.

1. Read `blog/README.md` (entry index + style guardrails) and `blog/_pending.md` (owed moments).
2. Scan for unwritten moments:
   - every line under `## Owed` in `blog/_pending.md`
   - files in `journal/ops/sessions/` dated after the newest blog entry that no existing entry covers
3. Report what was found — owed lines first, then any uncovered session that looks blog-worthy —
   each with a one-line hook. If nothing was found, say so plainly.
4. Ask Roi what to blog about: one found moment, several folded into a single entry, or a topic he
   names freely. If `/blog` was invoked with arguments, treat the arguments as the chosen topic and
   skip the ask (still fold in owed moments that fit the chosen story).
5. On Roi's explicit pick ONLY: write `blog/NNNN-slug.md` (next number from the index) per the
   style guardrails in `blog/README.md` — first-person, hero's-journey, plain language, anchored
   to the real milestone it maps to, ends with a 🔗 LinkedIn cut.
6. Add the entry to the table in `blog/README.md`.
7. Remove consumed lines from `blog/_pending.md`; leave the header and an empty `## Owed` section
   if everything was consumed.
8. Commit the new/changed files.

Never write an entry without Roi's explicit pick.
```

- [ ] **Step 2: Verify the file**

Run: `grep -c "explicit pick" .claude/commands/blog.md`
Expected: `2`

- [ ] **Step 3: Commit**

```bash
git add .claude/commands/blog.md
git commit -m "feat(commands): add /blog — scan-first build-log catch-up

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Create the `/notebook` command

**Files:**
- Create: `.claude/commands/notebook.md`

- [ ] **Step 1: Write the file**

Create `.claude/commands/notebook.md` with exactly this content:

```markdown
# /notebook — Refresh The NotebookLM Project Brain

If slash commands are not natively supported by the current agent, open this file and execute the checklist manually.

Bring `docs/feather_notebooklm_pack/` back to current truth and tell Roi what to re-upload.
The upload itself is manual — do not drive notebooklm.google.com.

1. Read `docs/feather_notebooklm_pack/README.md`: the upload list (`01`–`11`), the human-only list
   (`README`, `12`, `13`), and the maintenance rule (preserve per-file RAG boilerplate; never blur
   current state with future plans).
2. Read current truth: `journal/context/active.md`, `feather.md`, `ROADMAP.md`,
   `journal/ops/tasks.md`, and any ADR/spec in `docs/specs/` newer than the pack's
   "current as of" date.
3. For each uploadable file `01`–`11`, decide whether project truth moved out from under it
   (shipped features, API surface, roadmap shifts, safety model, test evidence). Present the
   verdicts (fresh / stale + one-line why) BEFORE editing anything.
4. Rewrite ONLY the stale files, preserving each file's boilerplate and the current/future
   separation. Touch `README`/`12`/`13` only if their own content went stale.
5. Update the pack README's "current truth as of" date.
6. Commit the changes.
7. Finish with the manual checklist: "Replace these N sources in NotebookLM: …" — and say whether
   `12_notebooklm_system_instructions.md` changed and needs re-pasting into NotebookLM's custom
   instructions field.
```

- [ ] **Step 2: Verify the file**

Run: `grep -c "do not drive notebooklm.google.com" .claude/commands/notebook.md`
Expected: `1`

- [ ] **Step 3: Commit**

```bash
git add .claude/commands/notebook.md
git commit -m "feat(commands): add /notebook — NotebookLM pack refresh ritual

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Blog doc cleanups (`_pending.md` header + README "when written" section)

**Files:**
- Modify: `blog/_pending.md` (header paragraph, lines 3-5)
- Modify: `blog/README.md` ("When a new entry gets written" section, lines 39-41)

- [ ] **Step 1: Fix the stale `fb-stop` reference in `blog/_pending.md`**

Find this exact text:

```markdown
Sessions that had blog-worthy material but were **not** written up at `/stop` time
(you chose "no blog"). The next time a blog entry IS written, `fb-stop` folds these
in so the narrative covers them — then clears this buffer back to empty.
```

Replace with:

```markdown
Sessions that had blog-worthy material but were **not** written up at `/stop` time
(you chose "no blog" at the blog gate — `/stop` appends one line per declined session).
The next entry that IS written — at `/stop` after a yes, or via `/blog` — folds in the
owed moments that fit, then removes the consumed lines.
```

- [ ] **Step 2: Update "When a new entry gets written" in `blog/README.md`**

Find this exact text:

```markdown
At the end of every phase (part of the "leave the docs true" exit ritual), and any time a significant decision lands. The blog should never silently fall behind the work.
```

Replace with:

```markdown
Entries are written in two places, both gated on Roi's explicit yes — never automatically:

- **At `/stop`:** the blog gate asks every session. A "no" records the moment as one owed line in
  [`_pending.md`](_pending.md) so it isn't lost.
- **Via `/blog`:** scans `_pending.md` and recent session files for unwritten moments, then asks
  what to write.

The blog should never silently fall behind the work — `_pending.md` is the catch-net.
```

- [ ] **Step 3: Verify both edits**

Run: `grep -c "fb-stop" blog/_pending.md blog/README.md; grep -c "catch-net" blog/README.md`
Expected: `blog/_pending.md:0` and `blog/README.md:0` (grep exits non-zero — pass), then `1`.

- [ ] **Step 4: Commit**

```bash
git add blog/_pending.md blog/README.md
git commit -m "docs(blog): retire fb-stop reference; document the ask-first blog flow

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Behavioral spot-check (no commit)

**Files:** none (read-only verification)

- [ ] **Step 1: Read all four touched files end to end**

Run: `cat .claude/commands/stop.md .claude/commands/blog.md .claude/commands/notebook.md blog/_pending.md`

Check against the spec (`docs/specs/2026-06-10-blog-notebook-commands-design.md`):
- stop.md: step 4 is the gate; steps 5-16 unchanged and still correctly numbered.
- blog.md: scan → report → ask → write-on-pick-only; argument shortcut present.
- notebook.md: verdicts-before-edits; manual upload; "current as of" date bump.
- `_pending.md`: no `fb-stop` anywhere; mechanism described matches stop.md's gate.

- [ ] **Step 2: Confirm the commands surface**

The slash-command list is built from `.claude/commands/*.md` filenames — confirm with:
Run: `ls .claude/commands/`
Expected: `blog.md` and `notebook.md` listed alongside `init.md  next.md  research.md  start.md  stop.md`.
(They become invocable as `/blog` and `/notebook` in a fresh session — full live test happens
naturally at the next real `/stop`.)
