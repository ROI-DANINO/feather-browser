# Blog System — Design Spec

- **Date:** 2026-06-03
- **Status:** Approved
- **Owner:** Roi

## Purpose

A public, build-in-public blog that doubles as the project's decision-history. It tells
the Feather story as a first-person hero's-journey, anchored to real milestones and
decisions, and feeds LinkedIn. It is the narrative companion to the dry `ops/` tracking
and the formal `docs/specs/` ADRs — not a replacement for either.

Decided in brainstorming:
- **Audience:** public (future users, devs, the Linux/AI-agent community) + decision archive.
- **Voice:** first-person Roi, hero's-journey, authentic over polished, plain language.
- **AI-collaboration angle:** a *thread*, not the headline — present and honest, but the
  spine is Feather itself, so the blog ages well if the "building with AI" novelty cools.
- **Backed by research:** 2026 LinkedIn/build-in-public trends favor founder hero's-journey
  and raw authenticity; neutral-narrator/documentation voice underperforms.

## Structure

- `blog/` at the repo root, tracked in git.
- `blog/README.md` — the index (newest first) + the style guardrails (below).
- Entries: `blog/NNNN-slug.md` — zero-padded sequence number + slug (e.g.
  `0001-the-story-so-far.md`). Sequence reads as chapters; the real date is in frontmatter.

### Entry shape

```markdown
---
title: <Title>
date: YYYY-MM-DD
entry: NNNN
milestone: "<what just shipped / was decided>"
maps_to: [<adr-id / file / commit>, ...]
tags: [<...>]
status: published | draft
---

# <Title>

<first-person narrative — hero's journey, AI-collaboration as a thread, plain language>

---

## 🔗 LinkedIn cut

<short, punchy, repost-ready version with a scroll-stopping first line>
```

## Style guardrails (kept in `blog/README.md`)

- First-person (Roi). Honest over polished. Hero's-journey framing.
- Plain language; explain or avoid jargon (the audience hook is non-technical builders).
- AI-collaboration is a thread, not a brag.
- Every entry anchored to a real milestone or decision; cross-link the ADR/commit via `maps_to`.
- Always end with a LinkedIn cut.

## Cadence

Writing/refreshing a blog entry is folded into the **per-phase exit ritual** already
defined for the stabilization program ("leave the docs true" → now also "write the blog
entry for what just shipped"). Plus ad-hoc whenever a significant decision lands. This
keeps the blog from silently falling behind.

**S1 follow-through:** S1's AGENTS.md polish task (plan Task 6) should add the blog cadence
to the per-phase exit checklist so future sessions remember it.

## First entry

`blog/0001-the-story-so-far.md` — one honest retrospective covering the spark and vision →
Phase 1 foundation + headless-first restart → Phase 2 working core (129 tests) → Phase 3
stabilization, the Cookie Mine insight (ADR-0003), the live event stream → the Linux-only
pivot (Electron eliminated) → where we are now (stabilization plan, S1 next). Threaded with
the "I direct, the AI builds" story. Ends with a LinkedIn cut.

## Non-goals

- Not a replacement for ADRs (`docs/specs/`) or the `ops/` tracking — it links to them.
- No blog engine/static-site generator yet (plain markdown in-repo). Publishing pipeline
  (e.g. to a static site) is a later, optional concern.
- No backfilled per-phase diary entries — the past is captured as one honest retrospective.
