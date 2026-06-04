---
title: The Shared Room
date: 2026-06-04
entry: 0008
milestone: "Pre-shell #4 done — Feather now keeps a real, warm, logged-in browser session of mine on disk. I logged into Google once (with my face), closed everything, reopened it, and I was still in — no password, no bot wall. Then a tiny 'Save password?' box nearly broke the whole security idea, and catching it turned into the rule that matters most."
maps_to: [src/tools/warm-session.ts, docs/specs/adr-0008-credentials-vault.md]
tags: [build-in-public, browser-dev, security, linux, agents, ai-collaboration]
status: published
---

# The Shared Room

Last time I figured out *where* Feather should keep its secrets — out of the project folder, into the private corners of my home directory where they belong. The safe had a location. This time I actually moved in.

The goal sounds small: let me log into a website once, and have my browser quietly remember me — forever, across restarts. That's it. But that one boring capability is the whole foundation of what Feather is trying to be. If a future AI assistant is going to do things on my accounts *as me*, it can't be asking me to log in every five minutes, and it absolutely can't be handling my passwords. It has to ride on a session I already opened, with my own hands. A warm, living, logged-in browser that's simply *there*.

## Logging in with my face

We built a one-command tool — `warm-session`. You run it, a normal-looking browser window opens, you log in like a human, you close it. Done. Behind the scenes it uses the stealthy setup we'd proven earlier (the browser doesn't *look* automated to the websites it visits) and points at my real system Chromium.

Then came a small surprise. When I went to log into Google, it didn't ask for a password. It showed me a QR code, I scanned it with my phone, and used Face ID to confirm. I'd genuinely never seen that flow before.

My first instinct was worry — *is this thing being flagged?* The AI I work with talked me down with a point I hadn't considered: this is actually the **good** outcome. Google saw a brand-new browser it had never met, and instead of slamming the door, it offered me its *strongest* welcome — "prove it's really you, with your phone." If it had thought I was a bot, I'd have gotten an endless wall, not a polite Face ID prompt. The strong welcome *is* the pass.

So I logged in. Closed everything. Held my breath. Ran the command again.

I was still in. My name, my account, no password, no challenge. The session had survived. The foundation is real now — not a clever one-off demo, but a thing I can reopen any time.

## The box that almost undid it

And then, while I was poking around logged in, a little box slid up from the bottom of the browser: **"Save password?"**

I clicked Save. Honestly, reflex — I've clicked that box a thousand times. I even saved a couple more before I stopped to ask the question out loud: *wait, where does that actually go — my real password manager, or somewhere inside this Feather browser?*

The answer turned out to be the most important thing I learned all session. It goes into the browser's *own* password store — which lives inside the exact profile folder that my future AI agents are going to share. I'd just dropped a few raw passwords into the shared room.

Here's the thing the whole project is built around: the agent should **never** see a raw password. Feather's job is to keep credentials in a separate, locked place and quietly unlock the door — the agent only ever walks through it, never holds the key. And I'd just left keys lying on the table in the room everyone's going to share.

It wasn't a disaster. There are no agents yet — nobody's in that room but me. I cleared the saved passwords, and they were safe in my real manager (Proton) the whole time. But the lesson stuck, and it became a rule, written down where it can't be forgotten: **the shared browser must never keep passwords.** Credentials live somewhere separate — my password manager today, Feather's own vault tomorrow — never in the room the robots will live in. And the fix won't be "remember to untick a box" — Feather itself will switch that off, by force, before any agent is ever let in.

## What this session really was

On paper I shipped a small tool and checked a box on a list. What actually happened is that the imaginary version of Feather — "one day it'll keep me logged in" — quietly became a real version sitting on my disk. And the most valuable five minutes weren't the success. They were the dumb little dialog box that made me name the one rule I can't afford to get wrong.

Next, I want to make sure everything I've built lately is solid enough to call a real, stable checkpoint — to move it from my working branch onto the line I trust. Time to step back and see if the house is actually standing.

---

🔗 **LinkedIn cut**

I'm building a browser that stays logged into my accounts so an AI can act *as me* — without ever touching my passwords.

This week it became real: I logged into Google once (Face ID, no password), closed everything, reopened it — still logged in. The foundation works.

Then a tiny "Save password?" box almost ruined it. I clicked Save on reflex — and realized I'd just dropped raw passwords into the exact shared space my future AI agents will live in. The one thing the whole project is designed to prevent.

No harm done (no agents exist yet, and the passwords were safe in my real manager). But that dumb little box taught me the rule that matters most: **the shared browser must never hold passwords.** And the fix isn't "remember to turn it off" — the software will enforce it, before any agent is ever let in.

The wins are nice. The near-misses are where the real rules come from.

#BuildInPublic #AI #Security #SoftwareEngineering
