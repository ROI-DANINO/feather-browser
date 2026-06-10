# Design — `/blog` + `/notebook` commands and the `/stop` blog gate

- **Date:** 2026-06-10
- **Status:** APPROVED (brainstorm with Roi, this session)
- **Scope:** journal/command tooling only — no product code. Touches `.claude/commands/stop.md`,
  adds `.claude/commands/blog.md` and `.claude/commands/notebook.md`, fixes `blog/_pending.md`
  header, updates `blog/README.md`'s "When a new entry gets written" section.

## Problem

Three gaps surfaced after the Graphify graduation + NotebookLM Project Brain v2 shipped:

1. `/stop` step 4 decides **by itself** whether the session is blog-worthy. Roi does not trust
   that judgment — an entry must never be written without his explicit yes.
2. There is no way to catch **missed** blog moments. `blog/_pending.md` exists for exactly this
   but is orphaned: its header references `fb-stop`, a command that no longer exists.
3. The NotebookLM pack (`docs/feather_notebooklm_pack/`) goes stale as the project moves and has
   no refresh ritual.

## Decisions (settled in brainstorm)

| Question | Decision |
|---|---|
| Standalone `/blog` first action | **Scan first, then ask** — gap-scan, then "pick one or name a topic" |
| Declined blog at `/stop` | **One line appended to `blog/_pending.md`** (session file + hook + date) |
| `/notebook` scope | **Refresh stale pack files + end with a manual re-upload checklist** (upload stays manual) |
| `/stop` nudging `/notebook` | **No nudge.** Roi runs `/notebook` on demand. (Overrides his opening message; the answer is the fresher call.) |
| Structure | **Approach A** — two new command files, `/stop` step 4 edited in place; entry style rules stay single-sourced in `blog/README.md` ("How entries are written"). No delegation between commands, no new skill. |
| Other command changes for Graphify/NotebookLM | **None.** Graphify MCP tools auto-surface, the post-commit hook self-refreshes the graph, and AGENTS.md already carries the contributor rules. |

## Section 1 — `/stop` step 4 rewrite ("blog gate")

Replace the current step 4 of `.claude/commands/stop.md` with:

> **Blog gate (always ask, never decide alone):**
> 1. Summarize in 1-2 lines what this session might be blog-worthy for, or say "nothing obvious".
> 2. If `blog/_pending.md` has owed entries, mention the count.
> 3. Ask Roi directly: **write a blog entry this session — yes or no?**
>    - **Yes** → write/update `blog/NNNN-slug.md` about *this session*, per the style rules in
>      `blog/README.md` (first-person, hero's-journey, ends with a LinkedIn cut). Fold in any owed
>      `_pending.md` moments that fit the narrative and clear those lines. Update the
>      `blog/README.md` index.
>    - **No** → append one line to `blog/_pending.md` under `## Owed`:
>      `- journal/ops/sessions/<file>.md — <one-line hook> — <YYYY-MM-DD>`
>      (write the hook while the moment is fresh).
>
> Nothing is ever written to `blog/` without an explicit yes.

All other `/stop` steps unchanged. Note the session file referenced in the `_pending.md` line is
written in step 5, immediately after — the gate records the name `/stop` is about to use.

## Section 2 — `/blog` (new command, `.claude/commands/blog.md`)

Scan-first, then ask:

1. **Scan.** Read `blog/README.md` (index + style rules), `blog/_pending.md`, and the files in
   `journal/ops/sessions/` newer than the latest blog entry's milestone — plus any session
   explicitly named in `_pending.md` regardless of age.
2. **Report.** Present the unwritten moments found (owed lines first, then any session that looks
   blog-worthy but was never asked about), each with a one-line hook.
3. **Ask.** What to blog about: one of the found moments, several folded into one entry, or a
   topic Roi names freely. If the scan found nothing, say so and just ask for a topic.
4. **Write.** On Roi's pick only: write `blog/NNNN-slug.md` per `blog/README.md` style rules,
   update the index table, clear the consumed `_pending.md` lines.
5. **Never write without an explicit pick.** Same rule as the stop gate.

Behavior when invoked with arguments (e.g. `/blog the graphify fence story`): still run the cheap
`_pending.md` read (so owed moments can be folded in if relevant), but treat the argument as the
chosen topic and skip the ask.

## Section 3 — `/notebook` (new command, `.claude/commands/notebook.md`)

1. **Read the rules.** `docs/feather_notebooklm_pack/README.md` — upload list, human-only list,
   maintenance rule (preserve per-file RAG boilerplate; never blur current state with future plans).
2. **Read current truth.** `journal/context/active.md`, `feather.md`, `ROADMAP.md`,
   `journal/ops/tasks.md`, and recent ADRs/specs since the pack's "current as of" date.
3. **Diff.** For each uploadable file `01`–`11`, decide whether project truth moved out from under
   it (shipped features, API surface, roadmap shifts, safety model, new test evidence).
4. **Rewrite only stale files**, keeping boilerplate and the current/future separation. Update the
   pack README's "current truth as of" date. Human-only files (`README`, `12`, `13`) are touched
   only if their own content went stale.
5. **Finish with the manual checklist:** "replace these N sources in NotebookLM: …" (and whether
   `12_notebooklm_system_instructions.md` needs re-pasting). The upload itself stays manual —
   driving notebooklm.google.com via Feather is a possible later upgrade, explicitly out of scope.
6. `/stop` does not nudge this command.

## Cleanups bundled in

- `blog/_pending.md` header: replace the stale `fb-stop` reference with the real flow
  (`/stop` writes owed lines; `/blog` consumes them).
- `blog/README.md` "When a new entry gets written": describe the ask-first reality — entries are
  written at `/stop` (gated by Roi's yes) or via `/blog`; never automatically.

## Out of scope

- Any change to `/start`, `/next`, `/init`, `/research`, the Feather skills, or AGENTS.md.
- Automating the NotebookLM upload through Feather.
- Changing the blog entry style/format itself.

## Testing

Markdown checklists, not code — verification is behavioral:

- Run `/stop` on a quiet session → expect the ask, answer no → expect exactly one new line in
  `_pending.md` and zero changes under `blog/`.
- Run `/blog` → expect it to surface that owed line; pick it → expect entry + index update +
  cleared line.
- Run `/notebook` right after → expect it to report which pack files (if any) went stale and to
  end with the re-upload checklist.
