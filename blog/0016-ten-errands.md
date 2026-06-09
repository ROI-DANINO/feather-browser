---
title: Ten Errands
date: 2026-06-09
entry: 0016
milestone: "The showcase suite ran end to end — all ten errands, across three difficulty tiers, green. The easy tier my agent team shipped after I fixed their broken hand-off. The hard tier proved the whole point of Feather: an agent piggybacking on sessions I'd warmed by hand — writing to my real calendar, searching as me, acting on Instagram as my test account. And running it surfaced the next honest problem: the agent works, but it's slow and half-blind."
maps_to: [examples/showcase.sh, docs/specs/2026-06-09-showcase-pass1-recipes.md, docs/specs/2026-06-09-close-tab-primitive-design.md, "commit bb3494e"]
tags: [build-in-public, browser-dev, agents, ai-collaboration, testing, cookie-mine, v1]
status: draft
---

# Ten Errands

Last time, I handed Feather to a team of agents and watched them run a relay — and wrote down the four cracks instead of celebrating the green. This is what happened after I fixed the cracks.

The first one was real: the team's hand-off was breaking because each agent woke up in a cold, empty session and tried to "fork" a context that wasn't there. The fix was almost dumb — start every agent fresh instead of forking. I made the change, reran it clean, and the team shipped its first genuinely working code: the **easy tier** of the showcase — top story off Hacker News, the weather in Tel Aviv, a repo's star count. Three small errands, all green, written by the agents and checked by the agents. The sequel to "The Relay" was quiet and undramatic, which is exactly what you want from a fix.

Then I took the suite the rest of the way myself, with the assistant at my shoulder. Ten errands total, in three tiers of difficulty. The **medium tier** behaved like the real internet does — a search engine threw a CAPTCHA at the headless browser, and I let that count as a *partial* with a lesson written next to it instead of pretending it passed. That's the rule now: a test that's allowed to fail honestly.

The **hard tier** is the one I'd been building toward without quite saying it out loud. These errands don't run in a throwaway browser — they run inside the sessions I'd logged into *by hand*. And they all passed. The agent wrote a real event onto my actual Google Calendar. It searched Google *as me* and pulled an article down to text. It opened Instagram already logged in as my test account, liked the top post in the feed, and left a comment. Nobody typed a password. Nobody re-logged-in. The agent just walked into rooms I'd already unlocked and ran the errand.

That's the "cookie mine" — the idea this whole project is built on. Your browsing builds a warm, trusted context; the agent borrows it instead of fighting its way past every login wall. For months that was a sentence in a roadmap. This session it was a calendar entry I could open on my phone.

But the part I keep coming back to isn't the green tiers. It's what running them *showed* me. The agent works — and it's slow and half-blind. It can't see the page in real time; it acts, takes a screenshot, looks, acts again. Banners I can't see in the moment — "Got it," "Not Now," cookie walls — sit on top of the page and silently block its clicks until something fails. And tabs piled up: there was no way to close *one* tab, only to nuke the whole session, so warm sessions slowly filled with junk.

So I fixed the first piece of that. Now Feather can close a single tab without tearing down the session — and, chasing that down, I found a quiet bug: the very first tab a session opens never got wired up properly, so closing it would've leaked. Fixed both, with the agent team building it under a strict test-first loop and reviewing each other's work. Clean, small, shipped.

The bigger problem I named instead of solving: let the agent *see* the page cheaply — a fast, structured glance instead of a slow screenshot — and have it brush those blocking banners aside on its own. That's next. Naming it precisely is half the work.

Ten errands ran. The promise of v1 — "it runs errands for me" — isn't a claim anymore; it's a calendar event, a search, a comment, on my own accounts. And the most useful thing in the whole session was the list of what makes it feel slow, because that's the next thing I get to fix.

---

🔗 **LinkedIn cut**

I built a browser so an AI agent could run errands for me. Today it actually did — on my own logged-in accounts.

Ten errands, three difficulty tiers, all green. The hard ones are the point: the agent wrote a real event to my Google Calendar, searched Google as me, and liked and commented on Instagram as my test account — without ever typing a password. It borrowed the sessions I'd already warmed by hand. That's the whole thesis of the project, and it stopped being a roadmap sentence and became a calendar entry I can open on my phone.

The part I'm proudest of isn't the green checkmarks. It's that running the suite showed me exactly why the agent still feels slow — it's half-blind between screenshots, and banners silently block its clicks. So I shipped the first fix and wrote down the next one.

The best test doesn't just pass. It hands you the list of what to fix.

Build in public — especially the part that still isn't fast enough.
