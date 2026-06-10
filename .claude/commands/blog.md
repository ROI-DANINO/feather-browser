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
