---
title: Hired on Probation
date: 2026-06-10
entry: 0018
milestone: "Adopted my first piece of third-party agent tooling — Graphify, a tool that maps how the code is actually wired together so an AI can ask 'what breaks if I touch this?' and get a real answer. But I didn't let it near the main project until it earned its way in: it ran in a fenced-off copy, by my rules, with its invasive installer refused. It proved its value, shipped a rebuilt NotebookLM 'project brain' along the way, and today it graduated into the real repo — through one explicit keep-or-discard decision."
maps_to: ["commit 401b176", "commit d3eb790", "commit e3de005", docs/specs/2026-06-10-notebooklm-project-brain-v2-design.md]
tags: [build-in-public, ai-collaboration, tooling, dev-workflow, knowledge-graph, notebooklm]
status: draft
---

# Hired on Probation

There's a tool called Graphify that makes a big promise: it reads your whole codebase and builds a map of how everything is actually wired together — which file calls which, what depends on what. With that map, an AI agent can ask "if I change this, what breaks?" and get a real answer in two seconds, instead of guessing from text search and hoping.

For a project like mine — where AI agents write most of the code and I direct — that's not a nice-to-have. The number one way agent coding goes wrong is *invisible collateral damage*: the agent fixes one thing and quietly breaks another, three files away, where it never looked. A wiring map is a seatbelt for exactly that.

So I wanted it. But I've been burned by the eager-installer pattern before.

## The trap in the welcome mat

When Claude and I dug into how Graphify actually installs itself, we found it doesn't just add a tool — it wants to *move in*. Its official installer copies in its own instructions file and installs a hook that intercepts the AI's basic file-reading commands and reroutes them through itself. On a fresh project, maybe fine. On mine? I've spent weeks building a custom workflow — my own skills, my own rituals, my own journal system that gives every session a memory. Letting a third-party tool hijack the agent's hands would collide head-on with all of it.

The verdict was clear: I wanted Graphify's *map*, not its *management style*. Take the query layer, refuse the installer.

## The fence

Even then, I didn't trust it in the main project. So we did something I'd recommend to anyone working with AI tooling: we gave it a probation period in a **fenced-off parallel copy** of the project — same code, separate folder, separate branch, with a written rule in my journal: *if any session finds itself in the main project, this task does not exist.* Nothing crosses back without an explicit decision.

Inside the fence, Graphify got wired up the polite way: as a standalone tool the agent can call, nothing more. We fenced all my markdown out of its map too — my specs, my journal, my decisions are *my intent layer*, and a code-mapping tool has no business ingesting them. It maps the wiring; I keep the meaning.

And it delivered. The map built in under two seconds, no AI calls, 719 pieces of code and 1,592 connections between them. We asked it real questions — "what's affected if I touch the observe handler?" — and got real answers with file names and line numbers.

The sandbox paid an unexpected bonus, too: with the wiring map available, we rebuilt my NotebookLM "project brain" from scratch — the document pack that lets me ask an AI notebook honest questions about my own project. The new version is built for how these systems actually read documents, and it includes a curated map of the codebase's real shape. My notebook now knows not just what Feather *is*, but how it's *built*.

## Graduation day

Today I made the call the fence was designed for: **keep it.** One explicit decision, recorded, and the sandbox merged into the real project.

The merge itself told a small, satisfying story. The code merged without a single conflict — the fence had held perfectly, nothing had leaked. The *only* friction was my journal files, because both timelines had been writing their diaries in parallel. Two threads of work, each documented, folded back into one history.

We rebuilt the map fresh in the main project and got the exact same numbers — 719 nodes, 1,592 edges — mathematical proof that the experiment never drifted from reality. The auto-refresh hook got rewritten so it works anywhere instead of being hardwired to the sandbox, and now every commit quietly updates the map in the background. Two seconds, no AI, never blocks me. I will never think about it again — it's just always current.

Then we deleted the sandbox. Probation over. Hired.

## What I actually learned

Adopt tools the way you'd hire people. Don't let enthusiasm install them straight into production. Give them a fenced trial, by the rules of *your* house, with a clear bar to clear and one explicit yes/no at the end. The fence isn't bureaucracy — the fence is what made saying "yes" cheap. If Graphify had disappointed, I'd have deleted one folder and lost nothing.

And the deeper pattern, the one this whole project keeps teaching me: my setup now has three layers that compound. A **memory layer** (the journal — every session starts warm). A **truth layer** (the wiring map + the project brain — agents argue from evidence, not vibes). An **execution layer** (Claude and its sub-agents doing the work). Today the truth layer got measurably stronger, and it cost me one decision.

---

🔗 **LinkedIn cut**

I just "hired" my first third-party AI tool — and I made it pass probation first.

The tool maps how my codebase is wired, so my AI agents can ask "what breaks if I touch this?" and get a real answer. Exactly what agent-driven coding needs: the #1 failure mode is fixing one thing and silently breaking another.

But its installer wanted to hijack my whole AI workflow. So I did what you'd do with any new hire:

→ Probation: it ran in a fenced-off copy of the project. Written rule: nothing crosses back without an explicit decision.
→ House rules: my docs and decisions stayed out of its map. It maps the wiring; I keep the meaning.
→ Performance review: real questions, real answers, file and line. Map builds in 2 seconds, no AI calls.
→ Graduation: one recorded yes. Merge was clean — the fence held, zero leakage. Then I deleted the sandbox.

The lesson: adopt tools like you hire people. The fence isn't bureaucracy — the fence is what makes saying "yes" cheap.

#BuildInPublic #AI #DevTools #AgenticCoding
