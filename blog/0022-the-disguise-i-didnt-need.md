---
title: The Disguise I Didn't Need
date: 2026-06-24
entry: 0022
milestone: "I'd spent about nine days heads-down, building hard and feeling productive — proving the security spine on a real login wall, then going deep into 'stealth,' teaching the agent to look human enough to slip past bot-detectors. Then I stopped and asked the question I'd been avoiding: are we even doing the right thing? Instead of guessing, I pointed the same AI machine I use to keep my code honest at my own roadmap — eight agents, adversarial, no flattery. It told me three hard things: I'd drifted off the map, a real password was sitting in my public repo, and the stealth I was proud of was a treadmill that doesn't even work. So I cut a week of my own work. The win wasn't building a better disguise — it was realizing the account is already really me, so I never needed one."
maps_to: [docs/specs/2026-06-24-reorientation-and-roadmap-restructure.md, "journal/ops/sessions/the-disguise-i-didnt-need-20260624-0126.md", "journal/ops/sessions/spine-live-test-design-20260623-0910.md", "journal/ops/sessions/stealth-arc-behavior-mine-20260623-2023.md", "journal/ops/sessions/5d-stealth-build-measure-detectors-20260623-2142.md"]
tags: [build-in-public, browser-dev, agents, ai-collaboration, security, strategy, yagni, v1, v2]
status: draft
---

# The Disguise I Didn't Need

There's a kind of busy that feels exactly like progress and isn't. I'd been in it for about nine days, and the only reason I caught it is that I stopped long enough to ask an uncomfortable question — and then I made an AI team answer it honestly instead of letting myself off the hook.

This is the story of auditing my own week and cutting most of it.

## What the week looked like from the inside

From the inside, it looked great.

It opened with a real win. I finally put Feather's safety system on trial against a live login wall — drove a throwaway Instagram account through a genuinely nasty gate (password, two CAPTCHAs, an email "verify it's you" link across two tabs) while a human handled the hard parts and the brakes held the agent still the whole time. The thing I'd designed on paper actually worked under fire. (Run-prep even caught a real bug *before* the browser opened — the app couldn't launch a session by identity, a door my own public surface couldn't open. Fixed it.)

Then I went chasing a bigger dream: **stealth.** Teaching the agent to *look* human — to move and type like a person — so it could survive the suspicious sites that sniff out robots. I wrote a plan, watched it delete a third of itself when I reconciled it against what I'd actually shipped, and then got excited and set a whole *arc* in motion: record a human browsing once, and let that one recording feed two things — the motion makes the agent look human, the steps teach it to repeat the chore. The Cookie Mine pattern, new payload. I loved it.

So I built the first piece and started *measuring* — pointing Feather at real bot-detectors to see how human it looked. And the measurements kept correcting me. A commercial detector quietly proved that **not faking it** was the right instinct (its "are you tampering?" score came back zero — honesty measured as a win). Then two different detectors looked at the *exact same thing* and gave me **opposite verdicts** — one said clean, one screamed "robot, 100%." I was now deep in the weeds trying to figure out which detector was right.

That's the moment I should describe honestly: I was optimizing a score on a free test page, for a browser that **no other human being has ever run.**

## The question I'd been avoiding

> *"i worked on this project kind of on autopilot and im not realy sure anymore we are doing the right and relevant things."*

That's what I finally said out loud. Not "is this code correct" — I'm good at that question. The scarier one: *is this the right thing to be doing at all?*

Here's what I've learned to do with a question I can't trust myself to answer: I don't answer it myself. I built Feather alongside AI agents, and over time I've turned them into a kind of honesty machine — point a team of them at a problem, tell them to be adversarial, tell them green checkmarks don't count, only the truth does. I'd used it on my code for months. I'd never once pointed it at *me.*

So I did. Eight agents, in parallel: one tore through the security code, one judged the build, one audited the tests, one mapped what I'd *said* I was doing against what I *actually* did, and two went out and researched the real world. The one finding that scared me most, I had a separate agent try to *disprove*, so I wouldn't act on a false alarm.

## Three things I didn't want to hear

It came back with three.

**One: I'd walked off my own map.** The little "you are here" sign in my project still said *v1 — the simple version that runs errands.* My actual work was three floors up, deep in advanced stealth. Nothing forces that sign to move when you wander, so it quietly went stale and I stopped noticing. Worse — the simple version I'd "finished" was never actually *shown to anyone.* I'd been polishing a disguise on a product I'd never even published a demo of.

**Two — the gut-punch: a real password was sitting in my public code, readable by anyone.** A throwaway test account, but a working username-and-password pair, recoverable from my repo's history with one command — and it had quietly crept *back* into the current files even after I'd scrubbed it once. The exact thing I always say I care about most. (I'm dealing with the account; I added a little gatekeeper that now refuses to let an obvious password slip into a save again.)

**Three — the one that cost me the week: the stealth was a treadmill.** The research was blunt. Someone had benchmarked the *exact* fix I'd been chasing against 31 real protected websites — and the "fixed" browser got blocked on the *same sites* as the un-fixed one. Identical. I'd been sanding a spot that changes nothing. And the deeper truth underneath it: the big detection systems stopped caring about that disguise years ago. What they actually trust is a **real account with real history.** Which I already have.

## The disguise was for a club I'm already in

That's the line that reframed everything.

Feather's whole trick — the "Cookie Mine" — is that the agent rides *my own* real, already-logged-in accounts, on my own internet connection. And a real, aged account that's actually mine **already looks completely human, because it basically is me.**

The stealth work was a fake mustache to sneak into a club where I'm already a paying member. All that effort to look human, for sessions that were *genuinely human the whole time.* The thing I was proud of was solving a problem I'd already solved a different, better way — and didn't notice, because building the clever disguise felt so much like progress.

## The cut

So I killed it. Stopped the stealth work, wrote down *why* in plain language so a future me can't quietly restart it, and re-pointed the whole project at the one thing nobody bigger or better-funded can copy: **driving your real, logged-in sessions privately, on your own machine, with your passwords never leaving it.** Every competitor in this space solves logins by shipping your credentials to their cloud. I solve the same hard problem and keep it on your laptop. That's the moat. The disguise was a distraction from it.

Then I cleaned the map — trimmed my bloated status notes from 247 lines back to a handful, flattened the tangled roadmap into five plain steps, and made every sign tell the truth again — so the *next* time I drift, I'll see it.

## The honest catch

There's always one. Cutting stealth is the right call *for who I am today* — one person, my own accounts, my own home wifi. The research was clear that the moment that changes — renting anonymous server connections, hammering sites at scale on fresh accounts — the disguise matters again. But even then, the answer is to *rent* a maintained one, not hand-build it solo. So it's not "stealth is dumb." It's "stealth is not my fight right now, and pretending it was kept me from the work that is."

The best thing I built this week was a clear-eyed look at the week itself. The honesty machine I made to keep my code from lying to me works just as well on my own plans — and it turns out the hardest thing to audit honestly is the thing you're most proud of.

I didn't need a better disguise. I needed to remember the face underneath was already mine.

---

🔗 **LinkedIn cut**

I just deleted nine days of my own work. On purpose. It was the best decision I've made on this project in weeks.

I'm building an AI browser, solo, in the open. For the last week and a half I'd been heads-down on "stealth" — teaching my agent to *look* human enough to slip past the systems that detect bots. It felt like real progress. Plans, builds, measurements, screenshots.

Then I asked the question I'd been avoiding: *am I even doing the right thing?*

I'm bad at answering that about my own work — we all are. So I did something different. I pointed the same AI team I use to keep my code honest at my own roadmap. Eight agents, adversarial, told to find the truth, not flatter me. The one scariest finding, I had a separate agent try to *disprove* before I'd believe it.

It told me three things I didn't want to hear:

→ I'd drifted off my own plan — and the simpler version I'd "finished" was never even shown to anyone.
→ A real password was sitting in my public repo, readable by anyone.
→ The stealth I was proud of was a treadmill. Someone had benchmarked the exact fix I was chasing on 31 real sites — same result as doing nothing.

Here's the part that reframed everything: my whole product runs on *real, already-logged-in accounts.* A real account that's actually you already looks human — because it is. The disguise I was perfecting was a fake mustache to sneak into a club I'm already a member of.

So I cut it. Refocused on the one thing the big funded players can't copy: driving your real logins privately, on your own machine, credentials never leaving it.

The hardest thing to audit honestly is the thing you're most proud of.

Building in the open — including the weeks I get wrong.
