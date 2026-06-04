---
name: blog-entry
description: Write a new Feather Browser blog entry. Gathers context from session records, writes a complete first-person draft in Roi's voice, presents it for review. Use when a phase exit triggers the blog cadence, or when a significant decision lands.
---

# Blog Entry

Write a complete draft for `blog/`. Present it to Roi for review. He approves or adjusts the whole piece — no step-by-step check-ins.

## 1. Gather context

Read these sources in order to reconstruct the story without having been in those sessions:

1. `.remember/remember.md` — session handoff, what completed, what's next
2. Find the last blog commit to set the lower bound: `git log --oneline --all -- blog/` (top line) — note its date.
3. **Every `journal/ops/sessions/` file written since that last blog entry** — the detailed stop record for *each* session in the arc this entry covers, not just the last one. The filename timestamp tells you which are newer than the last blog entry; read them oldest → newest. (If none are newer — no sessions since the last entry — read just the most recent file.) This is what keeps a multi-session phase from collapsing into only its final session.
4. `git log --oneline -20` — commit trail since the last blog entry
5. Last 15 lines of `journal/log.md` — JSONL-style work log with timestamps
6. `blog/README.md` — last entry's milestone, so the new entry advances the story

## 2. Voice guardrails

Entry 0001 (`blog/0001-the-story-so-far.md`) and entry 0002 (`blog/0002-write-it-down-or-it-didnt-happen.md`) are the gold standard. Match this voice:

- **First-person (Roi).** Write as him, not about him.
- **Honest over polished.** Say what actually happened, including inconclusive results and things that didn't work.
- **Hero's journey.** There's a before, a challenge or decision, and a new position. Not a changelog.
- **Plain language.** If a technical term appears, either explain it in one clause or don't use it. The audience is builders, not necessarily engineers.
- **AI-collaboration is a thread, not a headline.** The story is Feather; "I direct, the AI builds" is the method, mentioned where it's relevant, not foregrounded.
- **Anchored to a real milestone or decision.** Every entry maps to something concrete — a merged phase, an ADR, a spike result. No entries about intentions.
- **Short paragraphs.** Two to four sentences each. White space is part of the voice.

## 3. Completeness checklist

Before presenting the draft:

- [ ] Frontmatter complete: `title`, `date`, `entry` (next number from README), `milestone`, `maps_to` (ADR slugs or plan paths), `tags`, `status: published`
- [ ] Opening hook earns the read — one or two sentences that pull in a non-technical person
- [ ] Narrative arc present: why we got here → what happened → where we are now
- [ ] Each section heading is a phrase, not a label (e.g. "The decisions" not "ADR Summary")
- [ ] LinkedIn cut at the end — scroll-stopping first line, 4–6 bullet points, relevant hashtags
- [ ] `blog/README.md` entry table updated with new row

## 4. File naming

`blog/NNNN-slug-from-title.md` — next number in sequence, slug is kebab-case title.

## 5. Commit

After Roi approves: commit blog entry + README update together.
Commit message: `blog(NNNN): <title>`
