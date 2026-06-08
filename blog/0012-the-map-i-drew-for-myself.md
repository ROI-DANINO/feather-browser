---
title: The Map I Drew for Myself
date: 2026-06-08
entry: 0012
milestone: "Stopped mid-planning and admitted I'd lost track of what I was building. The fix wasn't a new feature — it was one map: Feather as v1 → v2 → v3. Wrote feather.md + three version roadmaps, and a one-line rule for how we borrow from open-source (build native by default)."
maps_to: [feather.md, docs/specs/adr-0011-open-source-consumption-doctrine.md, docs/roadmap/v1.md]
tags: [build-in-public, browser-dev, open-source, agents, ai-collaboration, product, focus]
status: draft
---

# The Map I Drew for Myself

This session was supposed to be small: tidy up how we borrow features from other open-source projects, write it down, move on. Instead, halfway through, I typed the most useful sentence I've written in weeks:

*"I got really confused with all these features — I don't know anymore what I'm building."*

## How you lose your own project

It creeps up on you. You read a cool open-source repo on a Saturday. You think "that'd be nice in Feather." You spec it. Then another. Then a five-model council reorders everything, and now there are phases and sub-phases and letters — 4a, 4b, 5.0.0, 5a, 5b, 5d, 5e — and a dozen plan files, each one sensible on its own.

Every piece was real. Every piece was *planned well.* And somehow the sum of all that good planning was that I, the person building it, couldn't tell you in one breath what the thing actually is.

That's the trap nobody warns you about. It's not that you stop working. It's that the planning gets so detailed it becomes its own fog.

## I stopped asking the AI to plan, and asked it to zoom out

Here's the part I'm a little proud of: instead of pushing through with another planning doc, I told my AI partner to put all the docs down and just *answer me* — what are the actual features, and what will I have when this is done?

Pulled out of the file-soup and laid flat, it was suddenly small enough to hold:

- **v1 — it runs errands for me.** Tell Feather a task, an agent navigates and does it. (Mostly already built. I just couldn't see it.)
- **v2 — it survives the scary sites.** It works on the bot-hostile places — Instagram, LinkedIn — *as me*, safely, without getting blocked.
- **v3 — the polished product.** The nice browser window, and opening it up to other tools. Last, because I don't need it to be real yet.

That's it. That's the whole program. Three sentences. I'd been carrying it as thirty.

I wrote it into a single front page — `feather.md` — and split the roadmap into one file per version, so I can give each its own attention instead of drowning in all three at once.

## The other thing that dissolved

Those open-source projects I kept collecting? I'd been treating them like a shopping list of features I owed myself. They're not. They're **recipe books.** You read how someone made their sauce, and you cook your own in your own kitchen. You don't open the book until you're actually making *that* dish.

So the rule for Feather is one line: **build it native, in our own code, by default.** Only buy a ready-made part when it's genuinely hard or dangerous to make yourself — which, it turns out, is almost never. That's the whole "doctrine" the session started out to write. It fit in a sentence once I stopped overthinking it.

And a small, funny proof I was back on track: late in the chat I asked a technical question about how an AI even drives a website it's never seen — and started reinventing, out loud, a feature I'd *already planned* months ago (save the steps that worked, replay them later). I'd re-derived my own roadmap from scratch. That's when I knew the map matched the territory in my head.

---

Nothing shipped this session. No code. And it might be the most important one in a while — because the next thing I do isn't another plan. It's a test: point an agent at a throwaway Instagram account and see if Feather can actually do the job.

The cure for "I don't know what I'm building" wasn't more building. It was one honest sentence and a map drawn for an audience of one: me.

---

🔗 **LinkedIn cut**

Halfway through a planning session for my open-source project, I typed the most useful sentence I'd written in weeks:

*"I don't know anymore what I'm building."*

Not because I'd stopped working. The opposite. I'd planned *so much* — phases, sub-phases, a dozen spec files, each one sensible — that the sum was fog. I'd lost my own project inside its own roadmap.

So I stopped asking my AI partner to plan, and asked it to zoom out: what is this thing, in one breath?

Pulled flat, it was tiny:
→ v1: an agent runs errands for me in a browser.
→ v2: it works on the sites that fight bots — as me, safely.
→ v3: the polished product. Last, because I don't need it yet.

Three sentences. I'd been carrying it as thirty.

Two lessons I'm keeping:
1. Those open-source repos I kept collecting weren't a to-do list. They're recipe books — you don't open one until you're cooking that exact dish.
2. When detailed planning starts to feel like fog, the fix isn't more planning. It's one honest sentence.

Next up isn't another doc. It's a test.

Local. Open-source. Yours to run.

#BuildInPublic #OpenSource #AI #Agents #Product #Focus
