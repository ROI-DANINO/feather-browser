---
title: The Hello World That Logged In As Me
date: 2026-06-04
entry: 0006
milestone: "Phase 4 Step 0 — proved the Cookie Mine end-to-end on a real site. 'Attach, don't launch' beat live bot-detection; the agent opened a tab into my real ChatGPT session and sent a message as me. No shell, no install, no second engine."
maps_to: [docs/specs/adr-0007-phase-4-shell-sequencing.md]
tags: [build-in-public, browser-dev, agents, bot-detection, cookie-mine, ai-collaboration]
status: published
---

# The Hello World That Logged In As Me

For months Feather has been an idea I could describe but not point at. A "Cookie Mine": I browse like a human, build up real logged-in sessions, and later my own agents quietly reuse those sessions to do work for me — in the same browser, on my behalf, with my permission. Easy to say. I'd never actually seen it happen.

This session I decided to stop describing it and make it breathe.

## Starting where it was cheap to fail

The temptation was to start building the pretty window — the visual browser shell I've been imagining. I didn't. The honest unknowns weren't about how it looks; they were about whether the core trick works at all. So instead of writing more design docs, we ran small throwaway experiments, using the browser the project already had on disk. No installs, no new tools.

The first ones went beautifully. A real browser window opened on my Linux desktop. An "agent" opened a second tab into the same session and inherited the first tab's login without re-entering anything. On a practice site built for this, the whole loop worked on the first real try. The thesis, in miniature, on my screen.

Then I asked for the version that actually matters: let me log into a site I really use.

## The wall

I typed in ChatGPT. I tried to log in. And the internet looked at my browser and said: *you're a robot.*

Google threw up "unusual traffic, prove you're not a robot." ChatGPT's gatekeeper put up a "verify you are human" check and refused me three times. The practice site hadn't cared who I was. The real ones cared a lot.

This is the part where a demo either teaches you something or flatters you. This one taught me. Because here's the thing — **this is the whole game.** If a real human can't even log in because the browser is wearing a "robot" badge, there is no trusted session for an agent to inherit later. The scary wall wasn't a setback to the vision; it *was* the vision's central problem, showing itself early and cheaply, before I'd built anything expensive on top of a false assumption.

So the right response wasn't to feel blocked. It was to figure out *why* the badge was there.

## The insight: stop launching, start attaching

The badge was there because of *how* the browser was being started. When automation software launches a browser, the browser carries little tell-tale flags that announce "I'm being controlled." Detection systems look for exactly those.

So we stopped launching it that way. Instead: start the browser the plain, ordinary way a person's browser starts — no automation flags — and then *attach* to it afterward, quietly, from the side. Same browser. No badge.

We checked the one signal the sites look at hardest. Before: it said "automated." After: it said "normal." Then I went back to ChatGPT and tried again.

No CAPTCHA. I was in.

## The moment

There was one piece left, and my collaborator framed it better than I had: the perfect hello-world isn't *seeing* that it works — it's the agent *doing* something. So, with my okay, it happened: an agent opened a fresh tab into my live, logged-in ChatGPT, typed **"hello world,"** and sent it. As me. Without my password. While I watched.

I'd asked, beforehand, the responsible question — *could this get my account banned?* The honest answer: a single, benign message on my own account, with me authorizing it, is very low risk; the danger lives in volume and abuse, not in one hello. So we did exactly one, and stopped.

It worked. The message went out under my name, in a browser the web couldn't tell apart from me sitting there myself.

That's not a toy on a sandbox site. That's the actual thing Feather is for, alive for the first time, on a service I use every day.

## What it cost — and what it didn't

Here's what I keep coming back to: it took **no fancy window, no new programming language, no big install, no second browser engine bolted on.** Just the right insight — attach, don't launch — and the discipline to test the scary part first.

I also wrote down what I'm *not* deciding yet. The eventual seamless window — where the page lives inside Feather's own frame instead of a separate browser window — is real, but it's a later, dedicated piece of research. How we build it (which low-level tools, which language) is wide open on purpose. Today wasn't about the frame. It was about proving the magic the frame will eventually wrap.

Next, the part I now care about most: security. If agents are going to act as me, the keys to my life have to be kept properly. So the next stretch starts with the boring, serious question of how to store secrets safely.

But that's next time. This time, my browser said hello to the world, and signed it with my name.

---

## 🔗 LinkedIn cut

For months my browser project has been an idea I could describe but not point at: I log into sites like a human, and later my own agents quietly reuse those sessions to work on my behalf.

This week I stopped describing it and made it breathe.

It worked instantly on a practice site. Then I tried a site I actually use — and the internet looked at my browser and said *you're a robot.* Google blocked me. ChatGPT refused me three times.

That wall could've felt like failure. It was the opposite. That wall **is** the whole problem — if a human can't even log in, there's no trusted session for an agent to inherit. Better to meet it now, with a throwaway script, than after building something expensive on a false assumption.

The fix was an insight, not a slog: when automation *launches* a browser, the browser wears tell-tale "I'm controlled" flags. So we stopped launching it that way — start it like a normal browser, attach quietly from the side. The robot badge vanished. I logged into ChatGPT with no CAPTCHA.

Then the real hello-world: an agent opened a tab into my live session and sent "hello world" — as me, without my password, while I watched.

No fancy UI. No new language. No second engine. Just: test the scary part first, and the right idea.

Next stop: security — because if agents act as me, the keys to my life have to be kept properly.

#BuildInPublic #Agents #BrowserDev #AI #SoftwareEngineering
