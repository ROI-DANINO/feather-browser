---
title: The Door I Didn't Build
date: 2026-06-23
entry: 0021
milestone: "I sat down to design the last piece of Feather's security spine — a way to hand an outside tool the keys to one of my logged-in browser sessions. The deeper I went, the more it scared me, so I kept asking why. We worked the danger down to a house analogy, almost built a clever 'welded door' to make the dangerous handout safer — and then I asked the question that dissolved the whole thing: why hand out raw keys at all, when Feather already has a safe way to drive the same session? The best architecture decision of the week was deciding NOT to build the door. The safety spine was already done; I just hadn't noticed."
maps_to: [docs/specs/2026-06-23-5c-native-vs-cdp-attach-decision.md, docs/specs/adr-0010-local-control-plane-capability-model.md, "journal/ops/sessions/the-door-i-didnt-build-20260623-0646.md", "journal/ops/sessions/banner-and-pause-guard-20260615-0446.md"]
tags: [build-in-public, browser-dev, agents, ai-collaboration, security, architecture, yagni, v2]
status: draft
---

# The Door I Didn't Build

There's a kind of progress that doesn't show up in a commit. This week's best decision produced zero new code. I want to write it down anyway, because it's the most *Feather* thing that's happened in a while: I set out to build something dangerous, and the win was realizing I didn't have to.

## What I sat down to build

Feather's whole reason for existing is the "cookie mine": a browser profile that's already logged into my accounts, that an AI agent can borrow to run errands. The plan had one last piece of the security spine left — the thing called *warmed-profile CDP attach*.

In plain words: a way to let an **outside tool** — somebody else's automation script, a different agent framework — connect to one of my already-logged-in browser sessions and drive it directly. Not through Feather's careful little command API, but down at the raw level, the browser's root console.

I'd built the entire safety system months ago specifically to guard this one door. So this was supposed to be the victory lap. Open the door, behind all the locks, done.

## "Why does this sound like a security hazard?"

That was my actual question to my AI pair, mid-design. Because it did. And instead of being talked out of the feeling, I leaned on it.

Here's the thing I made us spell out, no jargon. A warmed profile is **my house, with me already logged into everything inside** — email open on the desk, accounts unlocked, keys on the hook. An agent is a **helper I let in to run a chore.** Useful. But once a helper is inside an unlocked house, there are two very different dangers, and they are not the same size:

- **They misbehave while they're inside.** Bad, but bounded — it ends when they leave, I'm watching, it's logged.
- **They copy my key and walk out with it.** That's the nightmare. A copied key means they come back any night, forever, from anywhere, *as me.* In browser terms: they steal the token that proves I'm logged into Gmail, and now they're me on their own laptop next month.

The second one is the catastrophe. And handing an outside tool raw access to a logged-in browser is *exactly* the "they can copy the key" door.

## The clever fix I almost built

So we designed a workaround I was genuinely proud of for an hour: a **welded door.** Feather would stand up its own little gateway in front of the browser; the outside tool connects to *that*, never the real thing. Every command gets inspected — the ones that drive the page (click, type) pass through; the ones that read out the raw login keys get refused.

It even had a beautiful property I didn't expect. The most important login keys — the real session cookies — are *physically unreadable by page scripts* (a browser flag called HttpOnly). The only way to steal them is a special command we could simply weld shut. So the welded door would let a tool do its job while making the crown-jewel keys impossible to copy, **even if someone tricked me into approving it.** Two walls.

I was ready to build it. It's real, it's sound, and it would have been a few days of careful work.

## The question that deleted the feature

Then my friend asked it back to me, except sharper. *Should we build a native tool instead of leaning on outside ones? Am I overthinking it?*

No. He was *under*-thinking how good the answer already was.

Because here's what I'd lost sight of: **Feather already has a safe way to drive that session.** Its own command API — "click this," "type that," "read the page" — has always worked by doing the action *inside* the browser and handing back a result. The agent never touches a raw key. That's not a feature I needed to build. It's the floor Feather already stands on.

The dangerous door — handing an outside tool the raw keys — was never the *safe* way to drive a warmed session. It was a convenience for letting *foreign* tools plug in. Useful someday, for interop. But it is not safety, and it was never the thing my "secure the spine" goal actually needed.

So I traced it honestly. The goal of this whole phase was: *an agent can operate one of my logged-in identities through a login or two-factor challenge, with me in the loop and the brakes live.* Point by point:

- A logged-in identity to operate? **Shipped** (the identity model, last week).
- A safe way to operate it? **The native API. Already here.**
- Pause cleanly at a two-factor wall and let me solve it? **Shipped** (the MFA handler).
- A brake that stops the agent the moment trust is in question? **Already shipped — and I'd forgotten the story of how.**

## The brake I forgot I had

That last one has a scar on it worth retelling. A while back, while testing a different fix, my agent did something rude: I was mid-login on a Hebrew Google page, solving it by hand, and the agent — trying to be helpful — *navigated the page out from under me.* Yanked me out of my own login.

That bug became the feature. I made a rule: while a human is in control of a page, the agent's hands are tied — it can look, but it cannot click, type, or navigate. A pause now blocks the *agent*, not just the page. At the time it was a small papercut fix. This week I realized it's the **safety brake the whole spine was missing** — and it was already in the code.

So the spine wasn't one door short of finished. It was *already finished*, and I'd been about to bolt a dangerous, clever appendage onto something that was complete.

## The decision

I deferred the door. Wrote down exactly why — that raw attach is interop, not safety; that the welded-door design is preserved, shelved not lost, ready the day a real outside tool actually needs it. The lock I built for it months ago stays installed and unused, which is fine; a lock you never have to open in a panic is a lock that did its job.

The honest catch, because there's always one: "finished" here means *finished on paper.* The two-factor handler has only ever been tested against a fake browser. The next real step isn't more building — it's pointing the whole spine at a real login wall, with me driving the human parts, and finding out what actually breaks. That test is the only thing standing between "I think it's done" and "it's done."

But the building? The building was already over. I just had to stop reaching for the dangerous thing long enough to see it.

The best decision of the week was a door I didn't build.

---

🔗 **LinkedIn cut**

This week the best engineering decision I made produced zero lines of code.

I sat down to build the last piece of my AI browser's security spine: a way to hand an outside tool the keys to one of my already-logged-in sessions. I'd built the entire lock system months ago just to guard this one door. Victory lap, right?

Except it scared me. So I kept asking why — in plain language, no jargon.

A logged-in browser profile is my house, unlocked, with me signed into everything inside. An AI agent is a helper I let in to run a chore. And once a helper is in an unlocked house, the real nightmare isn't that they make a mess — it's that they **copy my key and walk out with it.** Come back any night, as me, forever.

Handing an outside tool raw access to a logged-in browser is exactly that "copy the key" door.

I almost built a clever fix — a filtered gateway that welds the key-copying commands shut while letting the tool still do its job. Genuinely sound. I was ready to spend days on it.

Then a friend asked the question that deleted the whole feature: *why hand out raw keys at all — doesn't your browser already have a safe way to drive that session?*

It did. It always had. The dangerous door was never the safe path — it was a convenience for plugging in *other people's* tools. Not safety. Not what I actually needed.

When I traced what "secure the spine" really required, every piece was already shipped — including a safety brake I'd built weeks earlier to fix a rude little bug, and forgotten was load-bearing.

So I didn't build the door. I wrote down why, shelved the design for the day it's actually needed, and left the unused lock installed.

The best architecture decision isn't always the clever thing you build. Sometimes it's noticing the dangerous thing you were about to build was never necessary.

Building Feather in the open. The door stays shut.
