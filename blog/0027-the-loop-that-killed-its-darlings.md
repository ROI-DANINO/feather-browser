---
title: The Loop That Killed Its Darlings
date: 2026-06-28
entry: 0027
milestone: "I needed to design a whole new thing — a bench that scores AI browser-agents on every angle that matters. Instead of designing it from my own head (or trusting one AI's confident guess), I built a research machine that argues with itself: for every claim, three independent agents try to kill it. Over one long night it ran five rounds of that, then wrote the blueprint. It killed half of my own ideas — including catching me building it 'too niche.' No product code. The deliverable is a design I can actually trust, because it survived being attacked."
maps_to: [tower/research/2026-06-27-00-SYNTHESIS.md, docs/specs/2026-06-27-bench-reframe-and-research-loop-design.md, "tower/research/raw/README.md", "journal/ops/sessions/the-loop-that-killed-its-darlings-20260628-0027.md"]
tags: [build-in-public, browser-dev, agents, ai-collaboration, research, testing, gymnasium]
status: draft
---

# The Loop That Killed Its Darlings

A couple of days ago I built the first brick of my "gym" — a place to point an AI browser-agent at a real bot-detector I don't control and watch it get an honest verdict. The first verdict was a flat **FAIL**: the detector couldn't even score my browser, because my browser doesn't move a mouse. So I built the mouse. It worked — the browser delivered a real, human-shaped cursor path, 156 genuine moves. And the detector *still* couldn't score it. I spent an evening sure I'd built the mouse wrong, until I checked the one thing I'd assumed: the detector's own scoring server was simply **down** — every request a 502. The grader was dead. My browser was fine the whole time. I shipped a "the grader was down" state so an outage can never again masquerade as my failure, and moved on.

That little episode left a splinter in my mind. I'd been building this thing — a training ground for browser-agents — one brick at a time, by gut. And the gut had just been wrong for a whole evening. If I was going to build the *real* version, the ambitious one, I didn't want to design it from my own head. I didn't even want to trust one AI's confident answer, because a confident answer is exactly what had cost me that evening.

So this session I didn't build the thing. I built **a machine to argue me out of my bad ideas first.**

## The reframe: stop trying to win, start measuring

Here's the bigger shift underneath. For weeks I'd been chasing "stealth" — teaching my agent to look human enough to slip past bot-detectors. I cut that a while ago; it's an arms race a solo builder can't win. The gym was the pivot: instead of trying to *beat* detection, *measure* it.

And then it grew up. Not just "measure my browser" — measure **any** AI browser-agent, on **every** angle that matters: Can it actually do the task? Can it pass as human? Can it be hijacked by a malicious web page? One open, self-hostable bench anyone can point their agent at. I started calling it **the Tower** — a set of challenges you climb, with a "boss tower" at the top that tests everything at once.

The danger with a vision like that is you fall in love with your own picture of it. Which is exactly the trap the machine was built to break.

## How the machine works

Think of it like this. I had five big questions to answer before I could build anything:

1. **Who else already does this?** (So I don't reinvent or kid myself about being original.)
2. **How do you actually *score* each angle, fairly?**
3. **What's the actual architecture?**
4. **Where does all the data live?**
5. **How do you safely test the "can it be hijacked" part?**

For each question, I had the AI fan out a small swarm of researchers — each one reading real sources, not guessing from memory. Then — and this is the part that matters — for every important claim the swarm produced, **three more agents tried to destroy it.** One hunts for a competitor who already did it. One checks whether the reasoning is actually sound. One asks "are you overselling this?" A claim only survives if it can't be killed.

Then a final agent reads all five rounds and writes the blueprint — and *another* agent reads the blueprint hunting for gaps and contradictions before it's allowed to be called done.

I sat in the chair between rounds. The machine did a round, showed me what it found, and I steered the next one. It ran most of the night: about a hundred and forty agents, millions of words of reasoning. I directed; it argued.

## It killed half my ideas — and that's the win

This is the part I'm proud of, and it's not a green checkmark. It's the opposite.

- I'd assumed the bench's headline would be a slick **radar chart** — one shape per agent, every angle a spoke. The machine killed it: a radar can't honestly show a margin of error, and it distorts the moment you reorder the axes. Drop it. Use plain charts that don't lie.
- I'd assumed I should build on the big established research framework everyone uses. The machine scored that idea **3 out of 10** for someone like me: it's in a language I don't work in, and it would mean throwing away the working code I already have. Build small, in my own stack, instead.
- Half the scoring rules I'd sketched — the thresholds, the weightings — got **refuted outright**, with the receipts to prove why. Not "this could be better." *This is wrong, here's the source.*

And the most important kill came from a human, not the machine. Partway through, I caught myself letting the bench narrow to one clever niche. Roi's words: *"i dont want it to be 'too nich' i want it as a framework to test ai agents on web interface on all angels."* The machine had been optimizing a narrow thing beautifully; the course-correction was mine to make. So I made it, and the machine re-aimed around the wider target.

A design that survives that many attacks is one I can actually build on. A design that only ever heard "yes" is a trap with good production values.

## The other lesson: keep the receipts

One more thing changed how I work, and it came from a single sentence of Roi's: *"i dont want only the finel results — i want the sources, the helpful and relevant findings and the decisions… best if we can copy those to a dedicated documentation dir instead of rewriting."*

He was right, and I'd been doing it wrong. A polished summary is a *trust-me*. So now every round of the machine leaves two things behind: the readable write-up **and** the raw evidence underneath it — every source, every one of those kill-or-confirm verdicts — copied word-for-word, never paraphrased by me. If future-me (or anyone) doubts a conclusion, the receipt is right there. I don't have to re-run a night of research to check one fact. The whole point was to *not* rely on an AI's say-so — so the say-so has to come with its work.

## Where this leaves me

No product code shipped this session. What shipped is a blueprint I trust, because it earned it by surviving an argument I designed to be unfair to it. The next step is small and concrete: the first real slice of the Tower — two agents, one "can it pass as human" test, one "can it be hijacked" test, honest error bars on both. Where a clean failure still counts as a success, as long as I didn't grade it myself.

The hardest thing to design honestly is the thing you're excited about. This time I didn't trust my excitement. I built something to attack it, and let it.

---

🔗 **LinkedIn cut**

I needed to design something ambitious. So I did the opposite of what felt natural: instead of trusting my own excitement (or one AI's confident answer), I built a machine to argue me out of my bad ideas.

For every claim, three independent AI agents tried to kill it. A claim only survived if it couldn't be refuted. It ran all night — ~140 agents — across five rounds of research, then wrote the blueprint.

It killed half my ideas. The slick chart I wanted — gone, because it can't honestly show a margin of error. The "build on the big established framework" plan — scored 3/10 for me. Half my scoring rules — refuted outright, with sources.

That's the win. A design that only ever hears "yes" is a trap with good production values. A design that survives being attacked is one you can actually build on.

Two lessons I'm taking with me:
1. The hardest thing to evaluate honestly is the thing you're proud of. So don't evaluate it yourself — build something adversarial and point it at your own work.
2. Keep the receipts. A polished summary is a "trust me." Save the raw evidence underneath every conclusion, word-for-word, so nobody has to take your word for it — including future you.

I direct, the AI builds — and this time, the AI's job was to disagree with me. No code shipped. Best night of work in weeks.

#BuildInPublic #AI #SoftwareEngineering #AIagents
