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
| 0010 | [The Three Locks](0010-the-three-locks.md) | 2026-06-07 | Agent Browsing Stack vision — studied Anchor Browser as product reference; found the architecture is already right; identified the three locks between agents and every site (fingerprint, login wall, identity); three-feature plan written |
| 0011 | [The Doors Before the Guards](0011-the-doors-before-the-guards.md) | 2026-06-07 | Council design review — asked five AI models to tear apart the roadmap + agent-stack plans; unanimous verdict: high-privilege surfaces (CDP attach, unauth MFA page, warmed credentials) were sequenced before the safety layer; decision: reverse it — security model first; re-sequencing session queued |
| 0012 | [The Map I Drew for Myself](0012-the-map-i-drew-for-myself.md) | 2026-06-08 | Got lost in my own plans — too many well-specced features, no single picture. Stopped mid-planning, zoomed out, and reframed the whole product as v1 → v2 → v3 (feather.md + three version roadmaps). Wrote the open-source rule in one line: build native by default (ADR-0011). No code shipped; clarity restored |
| 0013 | [The Test That Passed](0013-the-test-that-passed.md) | 2026-06-08 | v1 proven end-to-end: agent created a throwaway Instagram account, retrieved the confirmation code from Gmail spam, then liked a real post and posted a comment — all over Feather's local HTTP API. The v1 claim ("it runs errands for me") is no longer a plan. |
| 0014 | [Tests That Can Fail](0014-tests-that-can-fail.md) | 2026-06-09 | Caught myself building a showcase suite engineered to always pass; Roi reframed it — test for truth, not green checkmarks. Made `PARTIAL`+lesson a first-class result, baked "Testing Honesty" into root AGENTS.md, and decided the suite gets run by Roi's own Pi-harness agent team (Codex sets the ground). |
| 0015 | [The Relay](0015-the-relay.md) | 2026-06-09 | Handed Feather to a team of agents for the first time: five OpenRouter models, one role each (planner → coder → reviewer → validator → driver). Proved the solo operator loop and the full multi-model chain end-to-end — then logged four honest stumbles (slow, model self-ID unreliable, dropped outputs, connection flakiness) instead of celebrating the green PASS. |
| 0016 | [Ten Errands](0016-ten-errands.md) | 2026-06-09 | The showcase suite ran end to end — all ten errands, three tiers, green. Fixed the agent team's broken hand-off (fork→fresh) and they shipped the easy tier; drove medium + hard the rest of the way. Hard tier proved the cookie mine: an agent writing to my real Google Calendar, searching as me, and acting on Instagram as my test account — all on sessions warmed by hand. Running it surfaced the next problem (agent is slow + blind to banners); shipped the first fix (close-tab) and named the rest. |

## How entries are written (style guardrails)

- **First-person (Roi). Honest over polished.** Hero's-journey framing — the real path, including the hard parts.
- **Plain language.** Explain or avoid jargon; the people this is for are builders, not necessarily engineers.
- **The AI-collaboration is a thread, not a brag.** Feather is the story; "I direct, the AI builds" is *how* it happens.
- **Every entry is anchored to a real milestone or decision**, and cross-links the ADR/commit it maps to (`maps_to` in frontmatter).
- **Always end with a 🔗 LinkedIn cut** — a short, punchy, repost-ready version with a scroll-stopping first line.

## When a new entry gets written

At the end of every phase (part of the "leave the docs true" exit ritual), and any time a significant decision lands. The blog should never silently fall behind the work.

Design spec: `docs/specs/2026-06-03-blog-system-design.md`
