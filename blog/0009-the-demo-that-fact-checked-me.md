---
title: The Demo That Fact-Checked Me
date: 2026-06-05
entry: 0009
milestone: "Phase 4a — Feather Core made publicly runnable. I caught myself about to build the wrong thing (the shell, when my own rule said 'Core first'), pivoted, and wrote a 60-second demo a stranger can run. The demo did something I didn't expect: by actually running against the real software, it caught two lies in my own README."
maps_to: [examples/quickstart.sh, README.md, docs/specs/2026-06-05-core-first-reorientation-design.md, ROADMAP.md]
tags: [build-in-public, browser-dev, open-source, developer-experience, agents, ai-collaboration]
status: published
---

# The Demo That Fact-Checked Me

I sat down this session ready to start building the visual browser — the pretty part, the window with tabs you'd actually look at. I'd been excited about it for days.

And then I re-read my own positioning note from the week before. Three words stopped me: **"Core first, Shell later."**

I was about to do the exact thing I'd told myself not to do.

## The part people can actually use

Here's the split I'd written down and then nearly ignored. Feather has two halves. There's the **Shell** — the visual browser, the big ambitious daily-driver vision. And there's the **Core** — the quiet engine underneath: the thing that opens a real browser, drives it to a site, reads the page, grabs data, takes a screenshot, and shuts down — all controllable by a program (or an AI). The Shell is the dream. The Core is the part another developer could pick up and *use today*.

I'm about to share this project publicly for the first time. And a stranger who lands on it doesn't need my dream — they need to understand what it is in thirty seconds and see it do something real. Leading with the half-built Shell would be leading with the part nobody can use yet.

So I pivoted. The whole session became: make the Core legible. Not new features — I didn't touch the engine at all. Just a front door anyone can walk through.

## The 60-second test drive

The centerpiece is a tiny script called `quickstart.sh`. You start Feather, run the script in another terminal, and watch it narrate a full session out loud: *health check… open a browser… go to a page… read the title… pull out the heading… take a screenshot… grab a debug trace… close.* Eight steps, about a minute, and at the end the whole thing has demonstrated itself. The product in miniature.

I rewrote the README around it too — leading with *what Feather is*, *who it's for*, *see it work*, and (the part I'm oddly proud of) an honest list of what it **doesn't** do yet. Not a Chrome replacement. Not a polished app. Not a do-everything AI framework. Saying that out loud up front feels better than letting someone discover it and feel misled.

## Then the demo caught me lying

Here's the part I didn't see coming.

A demo that actually *runs* against the real software is brutally honest in a way a document never is. The moment we built it and pointed it at Feather, it started failing on things my own README had been confidently claiming for weeks.

My README said the server runs at a fixed address — `localhost:3000`. It doesn't. It never did. Feather grabs whatever free port the computer hands it and writes the real address into a little file at startup. I'd written `3000` once, early, and it had been a quiet lie in my front-page docs ever since.

It also said the security token lived in one place. Wrong path. Also stale. Also sitting right there on the page I'd hand a stranger.

Neither was a bug in the *software* — the software was right the whole time. They were bugs in the *story I told about it*. And the only thing that caught them was making the demo real enough to run. You can re-read a document a hundred times and never notice it's lying. Run it once and it can't hide.

We even caught one more on the way out: my "what works" list claimed the debug bundle captured screenshots. It doesn't — that option was never wired up. Cut it. A launch page is a promise, and I'd rather promise less and mean all of it.

## What this session really was

On paper: I wrote a shell script and rewrote a README. No new features, not a single line of the engine changed.

What actually happened is that Feather's Core stopped being a thing only I could run and became a thing a stranger can. And the most useful hour was the demo turning around and fact-checking its own instructions — three confident claims on my front page, quietly false, caught only because something finally *ran* them.

The work is live now, on the branch the world sees. The door's open.

Next I want to make sure everything I've shipped lately is solid enough to call a real checkpoint — and then, in its own session, the fun part: a little recorded clip so people don't even have to run it to see it move.

---

🔗 **LinkedIn cut**

I almost built the wrong half of my project this week.

I'm building Feather — an open-source browser engine an AI can drive. It has two halves: the flashy visual browser, and the quiet engine underneath. I sat down excited to build the flashy part… then re-read my own note: *"Core first, Shell later."* I was about to ignore my own rule.

So I pivoted and did the unglamorous thing instead: made the engine something a stranger can actually run. A 60-second demo — start it, run one script, watch it open a browser, read a page, screenshot it, and shut down.

Then the demo did something I didn't expect. By actually *running* against the real software, it caught two lies in my own README — a wrong address and a wrong file path I'd been confidently publishing for weeks. Not bugs in the code. Bugs in the *story I told about the code*. You can re-read a doc a hundred times and never see it lying. Run it once and it can't hide.

Lesson I keep relearning: documentation describes; a demo *proves*. Build the thing that runs.

#BuildInPublic #OpenSource #AI #SoftwareEngineering #DeveloperExperience
