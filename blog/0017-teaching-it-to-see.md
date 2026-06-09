---
title: Teaching It to See
date: 2026-06-09
entry: 0017
milestone: "The agent could already drive the browser — but it drove half-blind: guessing at buttons one by one, never noticing the cookie banner sitting on top of everything. This session I gave it eyes. A new `observe` that hands back a numbered list of exactly what's clickable, flags whatever's covering the page, and tells the agent what changed since last time — so it can plan its next move cheaply instead of flailing. Researched how the big players do it, proved the approach with a throwaway spike, then shipped it end to end with a team of AI sub-agents working in parallel."
maps_to: [docs/specs/2026-06-09-observe-perception-loop-design.md, docs/specs/2026-06-09-observe-perception-loop-plan.md, spikes/observe-perception-spike.mjs, "commit 837435c"]
tags: [build-in-public, browser-dev, agents, ai-collaboration, perception, testing, v1]
status: draft
---

# Teaching It to See

Last session ended on an honest complaint about my own creation: *the agent works, but it's slow and half-blind.* It could log into Instagram as my test account and write to my real calendar — but it got there by guessing. "Is there a button called 'Log in'? No? How about a link? A textbox?" One round-trip per guess. And when a cookie banner slid over the page, the agent didn't *see* a banner — it just kept trying to click things that were silently blocked, and failed, and tried again.

I'd been papering over it with a hard-coded little helper that clicked away Google's "Got it" pop-ups. A crutch. This session I wanted to fix the actual thing: give the agent eyes.

## Don't guess — go look at how the grown-ups do it

I made myself a rule a while back: don't argue from what I think I know, argue from evidence. So before designing anything, I had Claude research how the serious browser-agents actually perceive a page — Claude for Chrome, ChatGPT's agent, Perplexity's Comet, Manus, the open-source crowd.

They all converged on the same answer, and it wasn't the obvious one. The naive instinct is "take a screenshot, let the AI look at the picture." Everyone who's serious has moved *away* from that. Screenshots are huge, they pile up and clog the AI's memory, they're slow — one of them literally describes screenshot-driven browsing as "slow, ineffective, and expensive." Instead they read the page's *structure* — the same invisible scaffolding that screen-readers use for blind people — and hand the model a clean, numbered list: *here are the things you can click, and here's a number for each one.* The model says "click 14." No guessing. One of them cut its work in half just by switching to this.

That reframed the whole problem. The agent wasn't slow because it was dumb. It was slow because I'd been making it *guess* instead of *look*.

## Between two doors — and let the spike decide

There were a few ways to build the "eyes." A clean accessibility-tree read (elegant, but goes blurry on messy real-world sites like Instagram). A from-scratch walk of the page (powerful, but the risky, detectable kind). Claude recommended the clean option. I had a hunch the answer was somewhere in between — and I said so.

Instead of debating it, we settled it the honest way: a throwaway spike. Forty minutes of disposable code pointed at a fake cookie-wall, the real Instagram login, and a real news site's consent banner. The spike proved my hunch: the in-between approach caught Instagram's weird unlabeled login button (which the "elegant" path would've fumbled) *and* correctly spotted the banner physically covering the page — by literally asking, for each button, "if I dropped a pin in your center, what's actually on top here?" If the answer isn't the button, something's in the way.

Two questions I asked along the way mattered more than the code. "Do I risk making the agent more detectable?" — because a browser that screams "I'm a robot" is useless for the human-warmed sessions Feather is built on. The answer shaped the whole design: the eyes only *read* the page, never touch it, so a website can't tell it was looked at. And "can it plan its next move on the go?" — which turned out to be the same feature, not a new one: every time the agent looks, it also gets told *what changed since last time.* That's the cheap signal it needs to decide its next step without re-reading the whole page.

## Shipping it with a team that isn't human

Here's the part that still feels like science fiction to say out loud. Once the plan was written — eleven small, testable steps — I didn't build it myself. I dispatched a team of AI sub-agents, several working *in parallel*, each one taking a single step, writing its test first, and reporting back. I sat in the coordinator's seat: reviewing each one's work, catching where two of them would collide, integrating the pieces.

It was not magic, and that's the honest part. One sub-agent's connection died mid-task and I had to verify and finish its work by hand. Another fixed a type error in a file it wasn't supposed to touch. And the best moment of the whole session: the final end-to-end test caught a real, subtle *safety bug* I'd written into the design — the agent's "click number 14" tokens weren't tied tightly enough to a specific look at the page, so a stale number could quietly click the *wrong* thing instead of throwing an error. The test refused to lie about it. I fixed it, and then made the test prove the fix.

By the end: the eyes work, the agent acts on what it sees instead of guessing, banners are visible instead of invisible, and the whole thing is read-only and quiet. Sixty integration tests green. Pushed.

The agent used to feel its way around the room in the dark. Now it turns the light on first.

---

🔗 **LinkedIn cut**

My AI browser-agent could run real errands — log into accounts, write to my calendar — but it did it half-blind. It *guessed* where the buttons were, one slow click at a time, and never noticed the cookie banner sitting on top of everything.

So this week I gave it eyes.

First I made it do homework: how do Claude-for-Chrome, ChatGPT's agent, Perplexity, Manus actually "see" a webpage? Turns out they've all quietly abandoned the obvious answer (screenshots — too slow, too expensive) for reading the page's hidden structure and handing the AI a numbered list of what's clickable. "Click 14." No guessing.

I had a hunch about the exact approach, so instead of arguing I wrote a 40-minute throwaway experiment to settle it against real sites. It proved the hunch — and proved it could spot a banner *physically covering* the page by asking, button by button, "what's actually on top of you?"

Then the sci-fi part: I didn't write the final code. I dispatched a team of AI sub-agents working in parallel, each writing its test first, while I sat in the coordinator's chair — reviewing, integrating, catching collisions. The best moment? The final test caught a real safety bug in *my own design* and refused to pretend it passed.

The agent used to feel around the dark room. Now it turns the light on first.

Building Feather in the open. The eyes are in.
