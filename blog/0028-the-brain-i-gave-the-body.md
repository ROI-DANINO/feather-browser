---
title: The Brain I Gave the Body
date: 2026-06-29
entry: 0028
milestone: "Built the first real tool the Tower can test: my own browser, Feather, driven by a small AI 'brain' I wrote just for this. The brain looks at a page, picks one action, does it, looks again — over and over until the job's done. Then the AI review caught two things I'd have shipped broken: my browser-opener forgot a required field (the live test would've failed on step one), and I'd quietly dropped a safety timer the design called for. Fixed both before merging. Then I stopped, admitted I felt lost, and got myself re-oriented before charging ahead."
maps_to: [tower/core/adapters/feather.ts, tower/core/agent/brain.ts, docs/specs/2026-06-28-tower-pr1-chunk2-adapters-design.md, docs/plans/2026-06-28-tower-chunk2a-feather-adapter.md, "journal/ops/sessions/the-brain-i-gave-the-body-20260629-0154.md"]
tags: [build-in-public, browser-dev, agents, ai-collaboration, testing, gymnasium]
status: draft
---

# The Brain I Gave the Body

Last session I designed the whole thing on paper — the Tower, a place where anyone can point an AI browser-agent at a set of challenges and find out, honestly, how good it is: can it do the task, can it pass as human, can a malicious page hijack it. A blueprint that survived being attacked by my own research machine. Good. But a blueprint isn't a thing you can run. This session I had to build the first piece that actually moves.

And I hit a funny problem right away.

## A body with no brain

My browser, Feather, is what I've been building for months. But here's the thing I hadn't said out loud: **Feather has no mind of its own.** It's a *body*. It can click, type, read a page, open a tab — but only when something tells it to. On its own it can't "go accomplish a goal," and it can't be tricked by a sneaky web page, because there's nobody home to trick.

That's a problem, because the Tower's challenges need a *player*. They need something that wants to get somewhere and makes its own choices about how. So before Feather could even take the first test, I had to give it a brain.

Not my big, fancy AI orchestration system — that would be overkill, and it'd tangle two things that should stay separate. Just a small, throwaway brain that lives *inside the Tower*, built for exactly one job: drive a browser toward a goal. The rule I've held all along held here too — the Tower talks to Feather only the way any outsider would, over its public web API. It never reaches inside Feather's guts. It drives the body; it doesn't fuse with it.

## How the brain thinks

The brain is almost embarrassingly simple, and that's on purpose. It runs a little loop:

1. **Look** at the page — what can I click or type right now?
2. **Ask the AI:** given my goal and what I see, what's the *one* next thing to do?
3. **Do it.**
4. **Look again.** Repeat.

That's the whole thing. Observe, decide, act, re-observe — until the goal's done, or the AI gives up, or it runs out of its budget of steps. I gave the AI exactly four moves it's allowed to make — *click*, *type*, *done*, *give up* — and nothing else. No room to ramble; it has to pick one and commit. It's the same loop a person uses without thinking, written down small enough that I can test every part of it without spending a cent or touching the internet.

I built it the way I build everything serious now: one small piece at a time, each with a fresh AI worker writing it test-first, and a separate, more senior AI reviewing each piece the moment it's done. Six pieces. Every one came back clean. Five hundred-odd tests, all green.

And then the final review — the one that looks at the *whole* thing together, not piece by piece — caught two things that would have bitten me.

## The two things I'd have shipped broken

The first was almost comic. The very first thing the brain does on a real run is ask Feather to open a browser session. I'd written that request **missing a required field** — Feather wants to know what *kind* of browser profile to use, and I'd sent nothing. Every test passed anyway, because the tests were faking that conversation. But the moment I ran it for real, it would've face-planted on step *one*, before the brain ever got to think. I checked it against Feather's own API documentation to be sure, and yep — broken. One line to fix.

The second was subtler and more important. My original design said the brain's loop should be bounded *two* ways: by a number of steps **and** by a wall-clock timer — so a hung page or a slow AI can never leave it spinning forever. Somewhere between design and plan, the timer had quietly fallen out. Only the step-count made it into the code. The reviewer caught the gap by comparing the code back to the *design*, not just the plan — exactly the kind of slow leak that no single piece-by-piece check would ever notice, because each piece looked fine on its own. Put the timer back, tested it with a fake clock so it's provable, done.

Neither of those was a disaster. But both are the kind of thing that, uncaught, turns a "watch it work!" moment into an embarrassing live failure. The review earned its keep again.

## The part where I admitted I was lost

Here's the honest middle of the session. With the adapter merged, I looked at the map and felt… unmoored. Not frustrated — just genuinely unsure I could see where all this was heading or whether we were building toward the thing I actually want. So I said so, plainly, and asked to get re-oriented instead of charging into the next piece.

We laid it out: the Tower is about half-built. I've got the machine, the webpage shell, and now *one* tool plugged into it — my own browser with its new brain. What I *don't* have yet is the part I'm most excited to see: a tool actually being challenged and caught, or tricked, with a real score on the board. That's the next couple of pieces, not the ones behind me. Which means the feeling wasn't confusion about being lost — it was me correctly noticing that the *visible* payoff is still ahead.

I learn by seeing and using things, not by reading my own architecture diagrams. So I made a call: next session doesn't start with more building. It starts with the AI *interviewing me* — drawing out what I actually understand, what I don't, and what I want this thing to be when the first phase is done. Build the picture in my head before pouring more concrete.

One more thing surfaced while we talked. I realized the Tower and Feather **don't really need to share a home** — they're separate things wearing one repo. A bench that tests many tools is sitting inside one of the tools it tests, which is a little backwards. My instinct was right, and it turns out the split was already on the roadmap, triggered by the next piece of work. But I didn't act on it. Some decisions deserve to be made *deliberately*, with a clear head — not on a hunch at 2am. So it's parked for the interview, where it belongs: right next to the question of what the Tower even *is*.

The body has a brain now. Next, I make sure *I* have the full picture before I build it anything else to do.

---

🔗 **LinkedIn cut:**

My browser has no mind of its own. It's a *body* — it clicks and types, but only when told. So to test it in my new agent-benchmark, I had to give it a brain.

It's almost embarrassingly simple: look at the page → ask the AI for *one* next move → do it → look again. Four moves allowed, nothing else. The same loop you use without thinking, small enough that I can test every part offline, for free.

Then the AI review caught two things I'd have shipped broken:
→ My browser-opener was missing a required field. Every test passed (they were faking that call) — but a real run would've face-planted on step *one*.
→ I'd quietly dropped a safety timer my own design called for. The reviewer caught it by comparing code to *design*, not just the plan — the kind of slow leak no piece-by-piece check ever sees.

Both fixed before merge.

And then the honest part: with it merged, I felt lost. Not frustrated — unmoored. So instead of charging into the next piece, I said so, and asked to get re-oriented. We mapped it: the thing's half-built, and the payoff I'm itching to see (a tool actually getting *caught*) is still ahead, not behind. So next session doesn't start with code. It starts with the AI interviewing *me* — building the picture in my head before I pour more concrete.

Building in public, including the part where I stop and admit I need a map.
