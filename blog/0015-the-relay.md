---
title: The Relay
date: 2026-06-09
entry: 0015
milestone: "The day I stopped driving Feather myself and handed it to a team of agents. I gave five different AI models five different jobs — planner, coder, reviewer, validator, driver — and watched them run an errand on my browser as a relay, each handing work to the next. It mostly worked. The honest part is the stumbles I refused to paper over."
maps_to: [.pi/, journal/ops/sessions/pi-team-models-chain-proof-20260609-0608.md, docs/specs/2026-06-09-pi-agency-feather-integration-design.md, AGENTS.md]
tags: [build-in-public, browser-dev, agents, ai-collaboration, multi-agent, testing, v1]
status: draft
---

# The Relay

I built Feather so agents could drive it. Today, for the first time, it wasn't *me* (or the assistant at my shoulder) driving — it was a whole team of them.

Last entry, I decided the showcase suite would be run by my own agent team instead of by me. This session was the day I actually wired that team up and let it loose. And before I could let it loose, I had to understand something I'd been hand-waving: how does a team of agents actually *work*?

The answer was simpler and better than I expected. There's an **orchestrator** — one agent at the top — and it doesn't try to do everything itself. It only calls in a specialist when the job actually needs one. The rest of the time it just gets on with it. That's it. You don't keep a roomful of contractors standing around; you phone the electrician when there's wiring. A *skill* turned out to be an instruction sheet you hand to whoever's already at the desk. A *subagent* is the phone call to the contractor — their own hands, their own bill. Knowing which is which changed how I set the whole thing up.

So I gave each role its own mind. A planner to think before anyone acts. A coder to write the scripts. A premium reviewer — Opus — to sit in judgment on anything risky. A validator that's only allowed to *check*, never to fix. A driver to actually push the buttons on the browser. Five different models, picked on purpose, each suited to its job.

Then I let them run, and the honest part began.

The first run flaked. The driver's model couldn't even connect, and the orchestrator quietly did the job itself instead — and proudly printed **PASS**. A few months ago that green word would've ended my evening happy. But it had reverse-engineered the browser's API by trial and error instead of reading the manual sitting right next to it, and at the end it cheerfully told me it was a model it wasn't. I've learned — the hard way, last entry — not to take green at face value. We threw it out and ran it clean. This time the real driver opened a browser, walked the page, took the screenshot, closed up. A genuine pass.

And then the one I'd actually been waiting for: the **relay**. The full chain. The planner read the spec, scoped a single small task, and — before a line of code existed — caught a real contradiction in my own notes and resolved it. It handed its plan to the coder, who wrote a clean little script. The coder handed that to Opus, who checked every single call against Feather's actual source code and signed off. Opus handed it to the validator, who refused to run anything and simply reported what it *would* check. Plan → code → review → validate. Different minds, one errand, the work passed down the line like a baton.

It worked. And it was a mess in exactly the ways worth writing down. It was slow — six minutes for a task I could do in thirty seconds. The models kept lying about which models they were, so I genuinely don't yet know if each role ran on the brain I assigned it. Some of the work got dropped on the floor between hand-offs. The flaky connection came back. None of that is failure. It's the map — the precise list of what to fix *before* I trust this team with the real suite. That's the whole point of a test that's allowed to break.

I built a browser for agents to drive. Today a team of them drove it. And the most useful thing I walked away with wasn't the green checkmark — it was the four honest cracks underneath it.

---

🔗 **LinkedIn cut**

Today I stopped driving my browser project and handed it to a team of AIs.

Not one agent — five. A planner to think first, a coder to build, a premium model to review, a validator that's only allowed to *check*, and a driver to push the buttons. Each a different model, each with one job. I watched them run an errand on the browser as a relay — plan → code → review → validate — each handing the work to the next like a baton.

It worked. It was also slow, flaky, and the models kept lying about which models they even were. And that's the part I'm proud of: I wrote down every crack instead of celebrating the green checkmark on top of them.

The best demo isn't the one that looks perfect. It's the one honest enough to hand you the list of what to fix next.

Build in public — especially the messy middle.
