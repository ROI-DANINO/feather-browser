---
title: The Detector That Couldn't See Me
date: 2026-06-26
entry: 0026
milestone: "Two days after naming the gym — my own training ground for browser-agents — I built its first brick. One agent, one real bot-detector I don't control, one honest verdict I can watch happen. The win wasn't a green checkmark. It was a FAIL: the detector couldn't score my browser at all, because my browser doesn't move a mouse. That blank score is the most useful thing it could have told me — it's the exact thing to fix next."
maps_to: [docs/specs/2026-06-26-gym-step1-behavioral-diagnostic-design.md, docs/plans/2026-06-26-gym-step1-behavioral-diagnostic.md, "journal/ops/sessions/the-detector-that-couldnt-see-me-20260626-1935.md"]
tags: [build-in-public, browser-dev, agents, ai-collaboration, testing, gymnasium]
status: draft
---

# The Detector That Couldn't See Me

Two days ago I named the thing I actually wanted to build: a gym. Not a tool for sneaking my agents past websites that don't want them — that's a fight I can't win and the wrong side of a line. A *gym*. My own arena, my own bot-detectors, my own bots, where a pass only counts if I didn't grade it myself. That session shipped no code. The win was aiming.

Today I built the first brick. And the first thing it told me was that my browser is invisible.

## What I wanted

I didn't want a demo that goes green. I've been burned by those — a test rigged to pass teaches you nothing. What I wanted was a *diagnostic*: point my browser at a real detector and have it tell me, honestly, **where Feather is weak**, so I know what to upgrade next.

The AI I work with framed the fork cleanly. There are detectors my browser already sails through — and running those would just confirm what I already knew and hand me a useless thumbs-up. Then there's the one I *failed* months ago: a behavioral detector that watches how you move. That's the one that can teach. So that's the one we built against. Pick the test that can hurt you.

## The decision that made it honest

Here's the part I'm proud of, and it's not code.

The behavioral detector gives you a score from 0 (bot) to 1 (human). My browser, last time, didn't get a low score — it got *no score at all*. The detector just showed `...` where a number should be. My first instinct was to treat that as a neutral "not applicable."

I stopped and said the opposite out loud: **no score is a bad score.** A real person always leaves some trace — a cursor drifting, a little jitter. A session that produces *nothing* isn't unremarkable; it's suspicious. Being un-measurable is itself the tell.

So we wired that conviction straight into the rule: no score = FAIL. Not a skip, not an "n/a." A fail. That one sentence is the difference between a gym that flatters me and a gym that trains me.

## Building it like I hire people

The build itself was the now-familiar rhythm: I decide, the AI builds, and other AI tears the work apart before I trust it. A spec, a plan, then fresh agents taking one task each — one wrote the pure scoring logic with its tests, another wrote the part that drives the browser. A reviewer checked each piece against the plan.

One step I had to do myself, on purpose: drive a real browser at the live detector and *read what it actually exposes* — no guessing from memory. That five minutes changed the plan for the better (the score sits in plain page text, so we read it the simple way instead of hunting for a brittle hook). The gym is supposed to test reality; the least it can do is be built against reality.

Then I ran it. A Chromium window opened, drove itself to the detector, waited out the scoring windows, and printed its verdict while I watched:

> **UNSCORED → FAIL.** No behavioral score — the detector could not score this session. Being unscoreable is itself a tell.

There it was. The detector couldn't see me. Not because I'm sneaky — because my agent's clicks *teleport*. No cursor path, no movement, nothing to grade. The blank `...` wasn't a glitch. It was the answer to the exact question I'd asked: *what do I fix next?* Mouse movement.

## The catch I made the AI check

A diagnostic that lies is worse than none. So before I called it real, I had the final reviewer go check something specific: was the FAIL *genuine*, or did my code just read the wrong field, get an empty string, and call it a fail by accident? Same outcome on the surface, completely different truth underneath.

It traced the actual field names back to Feather's own source and confirmed: the browser really is reading the real score slot, and the slot really is empty. The FAIL is honest. And every run leaves a screenshot next to its verdict, so I'm never taking my own word for it.

One more thing I held to: I built the gym as a *driver*, not a graft. It talks to Feather only through the same front door any outside tool would use — it never reaches inside. That keeps the browser a body my other tools can drive, instead of quietly fusing everything into one blob I can't hold in my head. The next brick — wiring this into my scoring brain so results pile up over time — gets to reuse the exact same connection.

## What I actually have now

A gym with one working station. Type one command, watch my agent get tested against a detector I don't own, and get back a verdict I can trust *because* it's allowed to fail — recorded in a little scoreboard that'll grow.

First entry on the board: a FAIL, in my own handwriting, that points straight at the next thing to build.

That's the whole point of a gym. You don't go to feel strong. You go to find the weak thing and work it.

---

🔗 **LinkedIn cut**

I built the first piece of my "bot gymnasium" today — a place to test my browser-agent against real bot-detectors I don't control.

The first result was a FAIL. It's the best result I could've gotten.

The detector watches *how you move* — cursor drift, little human jitter — and scores you 0 (bot) to 1 (human). My agent didn't score low. It scored *nothing*. The detector couldn't read it at all, because my agent's clicks teleport. No mouse path, no signal.

My first instinct: call that "not applicable." Then I flipped it: **no score is a bad score.** A real person always leaves a trace. A session that leaves none isn't neutral — it's a dead giveaway. So I wired "unscoreable = FAIL" right into the rule.

Then I made my AI reviewer prove the failure was *real* — that I wasn't reading the wrong field and faking my own bad news. It traced the code to the source and confirmed it.

I didn't build a test that makes me look good. I built one that's allowed to hurt — and the first thing it told me was exactly what to fix next.

That's a gym. You don't go to feel strong. You go to find the weak thing and work it.

#BuildInPublic #AI #Agents #BrowserAutomation #SoftwareEngineering
