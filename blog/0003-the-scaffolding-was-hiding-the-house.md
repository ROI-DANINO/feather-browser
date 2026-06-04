---
title: The Scaffolding Was Hiding the House
date: 2026-06-03
entry: 0003
milestone: "Repo professionalized — Apache-2.0 license, journal/ consolidation, real public open-source project"
maps_to: [docs/specs/2026-06-03-repo-structure-cleanup-design.md]
tags: [build-in-public, open-source, license, repo-structure, ai-collaboration]
status: published
---

# The Scaffolding Was Hiding the House

My code has been on GitHub for weeks. Public, in the open, anyone could read it. But if a stranger had landed on it, I'm not sure they'd have known what they were looking at.

The reason is a little embarrassing and a little interesting.

To build Feather with an AI that forgets everything between sessions, I'd built a whole apparatus around the project — a way of tracking where we are, what's decided, what's next. Logs, session handoffs, desk notes, a tasks file, research intake. Scaffolding. And somewhere along the way the scaffolding had grown taller than the house. The first thing you saw when you opened the repo wasn't the browser I'm building. It was the machinery I use to build it.

## The two-line version of the problem

Fifteen folders at the front door. Maybe four of them were the actual project. The rest was process.

There was no license file either — which sounds minor, but without one, legally nobody can use or contribute to your code. To anyone who knows repos, a missing license quietly says "not finished." Add a leftover empty folder, a half-filled template nobody ever updated, and a 19MB browser profile left over from an experiment, and you get the picture. Honest clutter. But clutter.

## Hide it, or show it?

The interesting decision wasn't "clean it up." It was: what do you actually *do* with all that process scaffolding?

One option was to hide it — tuck it into invisible folders so the product stands alone, the way a polished open-source project usually looks.

I went the other way. I gathered all of it into one clearly-named place — `journal/` — and left it visible. Because the process *is* part of this story. The whole project is an experiment in directing an AI to build something real, and how I keep that coherent is half the point. So I'm not hiding the workbench. I'm putting it in one corner instead of leaving it all over the floor.

Then I gave Feather an actual license — Apache-2.0 — and a clean front door. As of this week it's a real open-source project. Not "code that happens to be on GitHub." Something you could clone, read, understand, and use.

## The part where I asked "are you sure?"

One small moment I keep thinking about.

Before any of this got executed, I asked my AI collaborator a simple question: are you sure? Did you miss anything?

Instead of reassuring me, it went back and found two real bugs in its own plan — gaps that would have silently broken the workflow or, in one case, accidentally committed that 19MB browser profile, cookies and all, into a public commit. The plan had looked finished. It wasn't.

Asking "are you sure" was worth more than a dozen confident answers. Write it down, then check it twice.

## Where this leaves things

Feather now looks like what it is: a Linux-native browser project, built in the open, with the process of building it on display rather than swept under the rug.

This was a detour. The real work — S2: system Chromium, the `TAB_UPDATED` event, the unglamorous Linux-weight stuff — is still waiting. But it was the right detour. You only get to make a first impression once, and now the repo makes the one I actually meant.

Back to the browser.

---

## 🔗 LinkedIn cut

My code had been public on GitHub for weeks. It just didn't look like it.

To build with an AI that forgets everything between sessions, I'd built a whole apparatus around the project — logs, handoffs, decision records, task lists. Useful scaffolding. But it had grown taller than the house. Open the repo and you saw my process, not the product.

This week I fixed that:
→ Gathered all the process into one visible folder instead of hiding it — because how I direct the AI is part of the story
→ Added an Apache-2.0 license — without one, nobody can legally use your code
→ Cleaned the front door so a stranger can actually tell what this is

The decision I'm happiest with: I didn't hide the workbench. I organized it and left it on display. Build-in-public means the building, too.

And the best moment? I asked my AI "are you sure you didn't miss anything?" — and it found two real bugs in its own plan, including one that would've committed a browser profile full of cookies into a public repo. "Are you sure" beats a confident answer every time.

#BuildInPublic #OpenSource #Linux #AI #BrowserDev
