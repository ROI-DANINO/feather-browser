# Blog Backlog

Sessions that had blog-worthy material but were **not** written up at `/stop` time
(you chose "no blog" at the blog gate — `/stop` appends one line per declined session).
The next entry that IS written — at `/stop` after a yes, or via `/blog` — folds in the
owed moments that fit, then removes the consumed lines.

If this list is empty, nothing is owed.

## Owed

<!-- One line per deferred session:
- `journal/ops/sessions/<nickname>-<timestamp>.md` — <one-line hook> — <YYYY-MM-DD>
-->
<!-- Cleared 2026-06-09: the owed E1–E3 fork→fresh beat was folded into blog/0016-ten-errands.md. Nothing owed. -->
- `journal/ops/sessions/fable-workflow-v1-acquittal-20260611-1430.md` — The workflow that put Feather on trial and acquitted it: parallel forensics agents proved both showcase failures were environmental (the "CDP socket death" was my own harness's API connection; the "Instagram like" never happened — a grep had matched the errand prompt), found Feather's one real bug (headed viewport silently ignored — diagnosed mid-errand by an agent reading Feather's own source), and an adversarial reviewer caught ME flattering Feather on M2. Then it fixed the lot — and the code reviewer caught a real security hole in my fix before push — 2026-06-11
- `journal/ops/sessions/native-capabilities-placed-20260610-0950.md` — The idea that wanted to eat the roadmap: placing the native-capabilities router *behind* the safety gate instead of chasing it, plus catching the "Capability Registry" naming collision — 2026-06-10
- `journal/ops/sessions/observe-bug-fixes-shipped-20260610-1203.md` — The review that caught my tests lying: a reviewer ran the new nav-click tests against the buggy commit, watched all of them pass, and proved they pinned nothing (Chromium silently blocks data:-URL navigation) — testing honesty as a process, not a slogan — 2026-06-10
- `journal/ops/sessions/skills-asserts-iframe-dismiss-20260610-1243.md` — I made my eval suite stop lying to me: PASS used to mean "the click returned 200"; now H3's like must flip to Unlike and the comment must quote the post's own caption — the first honest PARTIAL taught more than any green checkmark (IG gives CSS nothing; the snapshot text had the caption all along). Bonus beat: a "known limitation" shrank to a one-line bug once we actually read the walker (same-origin iframe dismiss, TDD'd in an hour mid-/stop) — 2026-06-10
