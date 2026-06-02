---
title: The Story So Far
date: 2026-06-03
entry: 0001
milestone: "Phase 3 complete; stabilization program planned"
maps_to: [adr-0002-headless-core-foundation, adr-0003-hybrid-browser-shared-context, ROADMAP.md]
tags: [origin, linux, pivot, cookie-mine, building-with-ai]
status: published
---

# The Story So Far

I'm going to start this blog with a confession: I can't write the code for the thing I'm building.

I'm a vibecoder. I have the vision, the taste, the stubbornness — but not the engineering background. So I'm building Feather the only way I can: I direct an AI architect, and the AI writes the code. I make the calls; it does the work I can't. This blog is the honest record of what that's actually like, and of the browser we're building together.

Let me tell you where it came from, and how far it's come.

## The spark

I wanted a browser that doesn't exist yet. Something **Linux-native, feather-light, and built for the age of AI agents** — not a desktop hog with a thousand tabs eating your RAM, but a quiet, fast thing that a human drives *and* that local AI agents can quietly work inside. Smart, light, agentic, operative. On Linux, where you actually have the freedom to make a browser behave.

That's the dream. The hard part was that I couldn't type it into being. So the first real decision wasn't technical — it was figuring out how to build at all when you can't build alone.

## Phase 1 — Choosing the ground to stand on

The first phases were about *foundations*. Not features — foundations. What does Feather actually run on?

We looked at the heavy options and the exotic ones. The first answer I picked optimized for a flashy visible shell, and I had to throw it out — it pointed the wrong way. We restarted around something humbler and stronger: **headless-first**. Build a real browser *core* first, controllable and reliable, and put the pretty face on later. That became ADR-0002 — Playwright-managed Chromium as the foundation. Decision written down, reasons recorded, move on. (Writing decisions down turns out to matter a lot when your "team" is an AI that starts each session with a clean memory.)

## Phase 2 — Proof it's real

Then we actually built it. A headless Chromium core you can launch, drive, and control over a small local API. Sessions. Profiles. Proxy support. Structured logs that scrub out secrets automatically. A debug bundle for when things break. A way to *measure* how heavy it is, because "feather-light" has to be a number, not a vibe.

And here's the moment it stopped being talk: **129 tests, all green.** A non-technical guy had, by directing an AI, produced a working, tested browser core. That was the day I believed.

## Phase 3 — Making it solid, and a bigger idea

Phase 3 was the unglamorous, important work: fix the bugs, clean up the contracts, make the whole thing *observable*. We squashed five genuinely nasty bugs, completed the lifecycle so the system reports what it's doing, and built a live event stream so a future interface can watch the browser in real time without constant polling.

But the best part of Phase 3 was an idea that reframed the whole project. I call it the **Cookie Mine** (ADR-0003).

Here's the insight: a human browsing normally builds up something precious — trust. Logged-in sessions, cookies, the quiet signals that say "this is a real person, not a bot." What if AI agents didn't spin up their own suspicious, empty browser sessions, but instead worked *inside the human's real one* — opening tabs in the session you're already using, riding on the trust you've already built? The human browser becomes the foundation the agents stand on. That's not a feature bolted on later; it's the architecture. It's why the human side has to come before the agent side.

## The pivot — Linux, and only Linux

Then came a clarifying moment that cut a lot of fat. I confirmed it out loud: **Feather is Linux-only.** Fedora, specifically.

That one decision killed a tempting option — Electron, the usual way to wrap a browser in a desktop app. Why kill it? Because Electron ships its *own* Chromium for the interface, and Feather already runs Chromium for the browsing. Two Chromiums in one app. That is the exact opposite of "feather." Gone.

It also opened doors: use the system's own Chromium instead of bundling a 300MB copy. Lean on real Linux tooling for the hard stuff later — credentials, media, packaging. The constraint made the thing lighter and more honest. There's a real puzzle left (how the browser surface shows up on modern Linux display tech), but that's a problem for the next chapter, and we've already mapped the candidates.

## Where I am right now

I just merged everything stable, and instead of charging at the shiny visual-shell phase, I did something that felt grown-up: I stopped to **harden the foundation first.** There's a small, deliberate program before the next big phase — patch an out-of-date piece that stopped getting security fixes, shed weight with system Chromium, finish the event model the agents will rely on, and write down the decisions I'd only made in my head.

I'm not rushing this. I said it to my AI architect and I'll say it here: *this isn't a one-day job. It's a project I want to take my time on, to make it truly good.*

That's the story so far. A browser that shouldn't be buildable by someone like me — getting built, one honest decision at a time.

More soon.

---

## 🔗 LinkedIn cut

I can't write code. I'm building a web browser anyway.

Not a toy — a real, Linux-native, feather-light browser designed for the age of AI agents. The way I'm building it: I bring the vision and make the calls, and an AI architect writes the code I can't.

Where we are after a few weeks:
→ A working, tested browser core (129 passing tests)
→ A live event stream so the thing is fully observable
→ An architecture idea I'm proud of — the "Cookie Mine": AI agents work *inside* your real browsing session, riding on the trust you've already built, instead of spinning up empty bot-looking sessions
→ One hard constraint that made everything better: Linux-only. (It let me delete a heavy dependency most browsers carry, and forced the whole thing to stay light.)

The most grown-up decision I made this week wasn't a feature. It was stopping to harden the foundation — and security — before chasing the pretty part.

This isn't a one-day job. It's a project I want to take my time on, to make it truly good.

Building in public from here. Follow along. 🪶

#BuildInPublic #Linux #AI #BrowserDev #VibeCoding
