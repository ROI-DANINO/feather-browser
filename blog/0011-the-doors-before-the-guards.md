---
title: The Doors Before the Guards
date: 2026-06-07
entry: 0011
milestone: "Council design review — asked five AI models to tear apart the roadmap and the agent-stack plans. Unanimous verdict: I was sequencing the powerful doors (CDP attach, MFA pages, warmed credentials) before building the guards. Decision: reverse it — security model first."
maps_to: [research/2026-06-07-council-design-review.md, docs/specs/2026-06-07-mfa-handler-design.md, docs/specs/2026-06-07-identity-model-design.md]
tags: [build-in-public, browser-dev, open-source, agents, ai-collaboration, security, phase5]
status: draft
---

# The Doors Before the Guards

Last entry I drew the map: three locks between an agent and every website — the fingerprint, the login wall, the identity. I'd written the plans. I had a roadmap that said "do this next."

So before building, I did something I don't do often enough: I asked five different AI models to tear the whole thing apart.

## Why I asked for a fight

It's easy to fall in love with your own plan. I'd written it with one AI partner, in one long conversation, and it *felt* finished. That feeling is exactly when you're most blind.

So I handed the roadmap and the two newest design plans — the login-wall handler and the identity model — to a council: Gemini, Grok, DeepSeek, GPT, and a fresh Claude that had never seen the conversation. Five cold readers. One instruction: be skeptical, find what's wrong, don't be polite.

I expected nitpicks. I got a unanimous verdict, and it stung.

## "You built the doors before the guards"

All five, independently, landed on the same sentence: **a warmed, logged-in browser is basically a vault full of keys — and I was building the doors into it before building anything to guard them.**

Three places it showed up, all in plain sight once they pointed:

**The master key.** My very next planned task was to expose a "connect here" port so other tools could drive a Feather browser. Convenient. The problem: that port is a master key. Anything that plugs into it can read every cookie and token in a logged-in session directly — the exact thing my whole project promises agents *never* get to touch. And I'd scheduled it to ship *before* any of the safety machinery existed. I'd written it on the roadmap as a "quick win."

**The unlocked side door.** The login-wall handler had a little local web page — the thing that buzzes me to approve a sign-in. I'd left that page with no lock on it, reasoning "it's only on my own machine." Five reviewers said the same thing: *your own machine is not a wall.* A malicious website you're logged into could quietly poke that page from the background. The convenience feature was an unlocked side door.

**The comfort that wasn't security.** I'd been proud that "the agent never sees the actual login code — Feather types it." The council was blunt: that's nice, but it's comfort, not a wall. The agent is still driving the logged-in browser afterward. Hiding the six digits doesn't change who's in the room. Worse — one reviewer spotted that a misbehaving agent could *fake* a code prompt and trick me into typing a real code into the wrong box. The feature I was proudest of had a hole in it.

None of this was a flaw in the foundation. The foundation — from the last entry — is right. The flaw was the **order.** I was doing it backwards: open the doors first, install the locks later.

## The turn

The honest move would have been to argue. I'd written these plans; I liked them. For about a minute I looked for reasons the council was wrong.

It wasn't wrong. Five strangers, no shared context, same conclusion — that's not noise, that's signal.

So I reversed the plan. The new rule is one sentence: **nothing that can touch a logged-in session ships before the thing that guards it.** The flashy "connect here" port drops down the list. A boring, unglamorous "who's allowed to do what" layer moves to the front. The identity model — the safe, self-contained piece — comes early; the riskiest stuff comes last, behind real gates.

I didn't rewrite the whole roadmap tonight. That's its own session, with a fresh head — rushing the fix would repeat the mistake that caused it. What I did was lock the *decision* in, write down every finding so none of it evaporates, and point the next session straight at it.

---

There's a version of building in public that's all wins — ship, demo, applause. This isn't that entry. This is the one where I asked to be told I was wrong, got told clearly, and changed course before a single line of the wrong thing got built.

That's the cheapest a mistake ever gets: caught on paper, by critics you invited.

---

🔗 **LinkedIn cut**

I asked five different AI models to tear apart my own project plan. Cold readers, one instruction: be skeptical, find what's wrong, don't be polite.

They came back unanimous — and it stung.

I was building a browser that lets AI agents act inside your logged-in sessions *without ever touching your credentials.* Good promise. But the council caught me sequencing it backwards:

→ I'd scheduled the "plug your agent in here" port — basically a master key to a logged-in browser — to ship *before* any of the safety layer existed.
→ The little "approve this login" page had no lock, because "it's only on my machine." My machine isn't a wall.
→ My proudest feature — "the agent never sees your login code" — was comfort, not security. The agent's still in the room.

None of it was a flaw in the foundation. It was the order. Doors before guards.

So I reversed the plan: nothing that can touch a logged-in session ships before the thing that guards it.

The cheapest a mistake ever gets is caught on paper — by critics you invited.

Local. Open-source. Yours to run.

#BuildInPublic #OpenSource #AI #Agents #Security #BrowserAutomation
