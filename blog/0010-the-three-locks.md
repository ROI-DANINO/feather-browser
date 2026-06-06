---
title: The Three Locks
date: 2026-06-07
entry: 0010
milestone: "Agent Browsing Stack vision — studied Anchor Browser as a product reference; crystallized the three-feature plan (Stealth Stack, MFA Handler, Identity Model) for Phase 5. The foundation is already right; what's missing are three layers."
maps_to: [research/2026-06-06-anchor-browser-product-reference.md, docs/specs/2026-06-07-agent-browsing-stack-brief.md]
tags: [build-in-public, browser-dev, open-source, agents, ai-collaboration, stealth, phase5]
status: draft
---

# The Three Locks

I spent a session studying the product that does what I want to build — but in the cloud, and at $2,000 a month for the full version.

I expected to feel behind. Instead I felt like I was reading a map of a place I already live.

## What Anchor Browser is

Anchor Browser is cloud-hosted browser infrastructure for AI agents. The pitch is clean: you call their API, they spin up a real Chrome in the cloud, your agent drives it. Authenticated sessions, stealth, human-like behavior, workflow reuse — all as a service.

I dug into it properly. Not just the marketing page — I unpacked the actual shipped TypeScript SDK, read the docs where the docs existed, and compared the claims against the evidence.

Two things stood out.

**First:** Their control architecture — how they actually talk to the browser — is the same as Feather's. They spawn a real Chromium and attach to it over CDP (Chrome's debugging protocol). It's the exact pattern I shipped in Phase 4 (`spawnAndConnect`). Their whole cloud stack is, at the mechanical level, "a Chromium you connect to over CDP." The only difference is *where* the browser runs. That's not a gap in my design — it's validation that the design is right.

**Second:** Their identity model is the same shape as Feather's Cookie Mine. Human logs in once → session is stored → agents attach to it and start already authenticated → the agent never holds your password. I've been calling this the "Cookie Mine." They've built the same thing and sell it as a premium feature.

So: I'm not behind on architecture. The foundation is correct.

## But there are three locks

The thing I *don't* have yet — and the thing that makes Anchor worth $2,000 a month to some people — is the answer to what I'm calling the three locks.

**Lock 1: The fingerprint.**

Before you even reach a login page, sophisticated sites are already scoring your browser. Screen size. GPU. What fonts are installed. How the browser draws to a canvas. Whether a bot flag is set. Whether you enabled Chrome's debugging hooks.

Feather already beats most of this by using a real headful system Chromium with a human-warmed session. A browser carrying your real cookies, your real browsing history, your real screen resolution — that's hard to tell from you. But for the hardest sites (LinkedIn, Instagram, certain banking and insurance portals), there are more signals to minimize.

**Lock 2: The login wall.**

Some sites don't just check your fingerprint. They ask you to prove you're human at the door: a code texted to your phone, a push notification that needs your Face ID, an authenticator app code. An agent alone can't do any of these things.

But here's the insight I had while thinking through this: the agent doesn't need to do them. *I* do. The agent just needs to know how to pause, tell me what it needs, wait for me to handle it, and pick up where it left off.

So the feature isn't "agent solves MFA." It's "agent pauses → my phone buzzes → I tap approve → agent continues." That's a very different, and much more honest, design.

**Lock 3: The identity.**

Right now, Feather knows about profiles and sessions. But there's no formal concept of "Roi's LinkedIn identity" — a named thing an agent can attach to, knowing it's pre-authenticated, knowing which sites it's valid for, knowing what to do when it needs auth.

The Cookie Mine is the raw material. But it needs to be formalized into something an agent can use by name.

## The plan

Three features, in order. Each one builds on the last.

1. **Stealth Stack** — make the Feather browser fingerprint indistinguishable from a real human browser. Graduated layers, from cheap hygiene (don't light up CDP events you don't need) to active fingerprint hardening (canvas, WebGL, timing). As deep as legal — automating your own accounts is always fine.

2. **MFA Handler** — the human-in-the-loop auth system. Agent hits a wall → phone notification → I approve → agent resumes. Probably via Telegram, which is already in Feather's tooling. First-class support for the common cases (TOTP, SMS, push approval).

3. **Identity Model** — formalize the Cookie Mine into named identities. An identity is a name, a profile, a list of sites it's valid for, and a link to credentials in the vault (which the agent never holds directly).

Each of these is its own design session. I've written the master brief. The map exists.

---

There's a version of this project that stops at "works on sites that don't check too hard." That version is already done.

The version I'm building works on *every* site. The three locks are what stand between here and there. Now I know what they are.

---

🔗 **LinkedIn cut**

I spent a session studying the $2,000/month cloud product that does what I'm building locally for free.

I expected to feel behind. Instead I felt like I was reading a map of a place I already live.

Same architecture. Same identity model. Same core insight about how to handle auth.

The difference isn't the foundation — it's three layers I haven't built yet:

1. **The fingerprint** — before you reach the login page, the site is already scoring you
2. **The login wall** — MFA, Face ID, OTP — things an agent can't do alone (but I can, if the agent knows how to pause and ask)
3. **The identity** — a named thing an agent can pick up and know it's already authenticated

Each one is a design session. The map is written. Building next.

Local. Open-source. Yours to run.

#BuildInPublic #OpenSource #AI #BrowserAutomation #Agents #DeveloperExperience
