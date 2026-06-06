# Feather Browser — Build Log

The story of building **Feather** — a Linux-native, feather-weight, agentic-AI-native + human daily-driver browser — out in the open.

This is a build-in-public journal and a decision history. It's the *why* behind the work: the narrative companion to the code, the commits, and the ADRs in `docs/specs/`. Written first-person, honest, anchored to real milestones.

## Entries

| # | Entry | Date | Milestone |
|---|-------|------|-----------|
| 0001 | [The Story So Far](0001-the-story-so-far.md) | 2026-06-03 | Phase 3 complete; stabilization program planned |
| 0002 | [Write It Down, Or It Didn't Happen](0002-write-it-down-or-it-didnt-happen.md) | 2026-06-03 | S1 Foundation complete — ADR-0004/0005, spikes |
| 0003 | [The Scaffolding Was Hiding the House](0003-the-scaffolding-was-hiding-the-house.md) | 2026-06-03 | Repo professionalized — Apache-2.0 license, journal/ consolidation, real public OSS |
| 0004 | [The Feature That Was Never There](0004-the-feature-that-was-never-there.md) | 2026-06-03 | S2 core shipped — dup-tab fix, TAB_UPDATED, resilient reads; dead trace feature found + deferred |
| 0005 | [The Migration That Needed No Code](0005-the-migration-that-needed-no-code.md) | 2026-06-03 | S3 shipped — Fastify v4→v5 (zero source changes), Playwright current, security checkpoint; stabilization program closed |
| 0006 | [The Hello World That Logged In As Me](0006-the-hello-world-that-logged-in-as-me.md) | 2026-06-04 | Phase 4 Step 0 — Cookie Mine proven end-to-end on a real site; "attach, don't launch" beat bot-detection; agent sent a message as me (ADR-0007) |
| 0007 | [The Keys Were Under the Doormat](0007-the-keys-were-under-the-doormat.md) | 2026-06-04 | Pre-shell security groundwork — found secrets stored inside the (non-gitignored) project folder; decided the Linux-native XDG fix; spec + plan landed, build next |
| 0008 | [The Shared Room](0008-the-shared-room.md) | 2026-06-04 | Pre-shell #4 done — a real warm logged-in session on disk (Google via passkey, survives restart, no bot wall); a "Save password?" box surfaced the rule that matters most: the shared browser must never hold raw credentials |
| 0009 | [The Demo That Fact-Checked Me](0009-the-demo-that-fact-checked-me.md) | 2026-06-05 | Phase 4a — Feather Core made publicly runnable: caught myself about to build the Shell against my own "Core first" rule, pivoted to an artifact-forward README + a 60-second `quickstart.sh` demo; the running demo caught two stale lies in my own docs (port + token path) |

## How entries are written (style guardrails)

- **First-person (Roi). Honest over polished.** Hero's-journey framing — the real path, including the hard parts.
- **Plain language.** Explain or avoid jargon; the people this is for are builders, not necessarily engineers.
- **The AI-collaboration is a thread, not a brag.** Feather is the story; "I direct, the AI builds" is *how* it happens.
- **Every entry is anchored to a real milestone or decision**, and cross-links the ADR/commit it maps to (`maps_to` in frontmatter).
- **Always end with a 🔗 LinkedIn cut** — a short, punchy, repost-ready version with a scroll-stopping first line.

## When a new entry gets written

At the end of every phase (part of the "leave the docs true" exit ritual), and any time a significant decision lands. The blog should never silently fall behind the work.

Design spec: `docs/specs/2026-06-03-blog-system-design.md`
