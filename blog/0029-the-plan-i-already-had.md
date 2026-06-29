---
title: The Plan I Already Had
date: 2026-06-30
entry: 0029
milestone: "Last session I admitted I felt lost, so this one started as an interview — the AI asking me, one plain question at a time, what the Tower is even for. The twist: I didn't learn the plan, I re-derived it. Sitting in front of the running page I reasoned my way back to the exact three-part design I'd locked weeks ago — and then sharpened it past where it was. Four new decisions came out of a conversation with zero code: tasks authored once and reused, difficulty defined by how messy a page is, and real Cloudflare-grade defenses hosted over my own arena so I can test world-class detection without ever touching someone else's site."
maps_to: [tower/decisions.md, "journal/ops/sessions/the-plan-i-already-had-20260630-0153.md"]
tags: [build-in-public, gymnasium, planning, ai-collaboration, vibecoding]
status: draft
---

# The Plan I Already Had

Last session ended on an honest, slightly uncomfortable note: I'd just built a real piece of the Tower, all my tests were green, and I said out loud that I felt *lost*. Not lost in the code — lost in the picture. I couldn't have told you cleanly what the whole thing was *for* anymore. So I made a rule for the next session before I closed the laptop: don't build anything. Start by getting oriented.

This is the story of that orientation. And the surprise is that it didn't go the way I expected.

## Being interviewed by my own assistant

I didn't want a lecture. I learn by *seeing and using* things, not by reading a wall of explanation. So the session opened in a way I've never tried before: I told the AI to **interview me.** One question at a time, plain language, and keep me in front of something I can actually look at.

So it started the Tower's website on my machine, gave me the link, and asked the simplest possible question:

> When you look at this page — what do you think the Tower is *for*?

The page in front of me was bare-bones: one run, an agent that passed the "can it pass as human" checks and then got stopped in the "can a bad page hijack it" stage. I read it back — the agent cleared detection, failed security, got stopped. Then I said the honest thing: *I can only read this because I designed it. I can't see what level the agent was on. I can't see what it passed. The question feels kind of off.*

And the AI did something I appreciated: it didn't pretend I'd aced a quiz. It told me there was no hidden right answer — it wanted *my* picture, to find the edges of what I understood. Then it told me the part I'd half-forgotten: **what I was looking at was a fake.** A stub. Sample data wired in to prove the website can draw a result, with no real agent behind it. A movie-set storefront. The gaps I'd spotted — no level, no pass list — weren't me missing something. They were the parts that genuinely aren't built yet.

That reframed the whole session. I wasn't here to be taught the plan. I was here to find out how much of it I actually held.

## I reasoned my way back to my own design

The next question was the real one: *what is a "level" in the Tower?*

I didn't look anything up. I just talked it through. A level is a task an agent should do — book a flight, scrape a forum, post a comment, read an email — the same kinds of errands people give the AI agents in their browsers. Behind each one, you check different things. Whether it can actually operate the page. Whether bot-detection catches it. Whether a malicious page can attack it or the person using it. And you could organize those into separate *towers*, each one squeezing the agent on its own angle — a detection tower, a security tower, a "can it even do the job" tower — with one **boss tower** at the end that tests everything at once, getting harder as you climb.

Then the AI showed me something that genuinely landed: **I had just re-derived the exact design I locked weeks ago.** The three angles I'd reasoned out from scratch — can it do the task, can it pass as human, can it be hijacked — *are* the three angles already written down as the project's locked scope. The "boss tower" I described is named, word for word, in my own decisions log. I wasn't supposed to remember it. I reasoned my way back to it.

That's the moment the lost feeling lifted. Not because someone re-explained the map to me — because I drew it again, blind, and it matched.

## And then I made it better than it was

Here's the part I'm proudest of. I didn't just reconstruct the plan. In talking it through, I pushed it past where I'd left it — and the AI flagged three things I said as *genuinely new*, good enough to write down as decisions:

**One: write the tasks once, reuse them everywhere.** The "can it do the job" tower authors the errands. The detection tower and the security tower borrow those same errands and each makes them hard in its own way. Structure each tower once; don't reinvent the work three times. (Turns out my plan had deliberately left "how levels are structured" undesigned — this filled exactly that hole.)

**Two: difficulty means how *messy the page is*.** Not how complicated the task sounds — how tangled the actual web page is. Layered code, popups, modals, the junk that trips agents up. And I already have a pile of real examples from months of driving Feather around the live web.

**Three — the one I like most: rent the real bouncers, put them on my own door.** I want the Tower's levels to *imitate* the hard sites — the Facebooks, the government portals, the Cloudflare-walled pages — so an agent acts like it's operating them. But I never touch the real ones. Instead I'll **pay for the actual high-end defenses — Cloudflare, DataDome — and host them in front of my *own* arena pages.** You're allowed to put any guard you want on a door you own, then send your agent at your own guarded door. The detection technology is 100% real; the site behind it is mine. World-class testing, zero terms-of-service violated.

Because that's the spine of this whole project, and I said it plainly during the interview: **the Tower is a peaceful project. It doesn't break anyone's rules.** It builds its own gym, with its own real equipment, and only ever tests inside it.

I'd braced myself that "imitate all these sites" meant cloning Facebook pixel for pixel — a mountain of web-dev. The relief was learning we don't copy the *look*, we copy the one *mechanism* each level tests: the guard, the one injectable spot, the shape of the errand. Far less than I feared. Still real work. I'm in for it.

## The boring decision that was actually the right one

There was one more thing on the table: should the Tower move out of Feather's home into its own repo? My gut's been saying yes for a while — *they don't need to share a house.* I even flip-flopped mid-conversation, said "split it now," then caught myself and changed it back: **keep it where it is for now, and ask me again when we hit the natural breakpoint** (the day we add the second tool). The code's already cleanly separable, so waiting costs nothing, and doing invisible plumbing on the exact day I wanted clarity would've been backwards. Not every instinct needs to be acted on the second you feel it.

No code shipped this session. Four decisions, two saved lessons, and a map I can finally see again — drawn, this time, by me. The reason I did it: so that when I let the AI run on this for a stretch, I trust the direction it's heading is the one I actually want. You can't hand off the wheel until you can see the road.

The thing I keep relearning: the cure for feeling lost isn't more building. Sometimes it's sitting down, in front of the running thing, and finding out you knew where you were all along.

---

🔗 **LinkedIn cut**

Last week I built a real piece of my project, passed every test, and admitted out loud that I felt *lost.*

So this session I tried something I'd never done: I told my AI assistant to **interview me.** One plain question at a time, keep me in front of the running screen, no lecture.

The plan was to learn what I'd built. What actually happened: I *re-derived* it. Sitting there reasoning out loud, I rebuilt the exact three-part design I'd locked weeks earlier — and the AI showed me my answer matched my own locked plan, word for word. I wasn't being taught. I was finding out how much I already held.

Then I pushed it further than I'd left it. Three new ideas came out of a conversation with zero code — including the one I love most: instead of testing my AI agents against real protected sites (and breaking their rules), I'll **rent the real defenses — Cloudflare, DataDome — and put them on my own door.** Real world-class bot-detection, hosted over my own practice arena. World-class testing, nobody's terms violated. A peaceful project that builds its own gym.

The lesson I keep relearning as a non-engineer building something real: the cure for feeling lost isn't more building. It's sitting down in front of the thing and discovering you knew where you were all along.

You can't hand off the wheel until you can see the road.

#buildinpublic #AI #vibecoding #soloproject
