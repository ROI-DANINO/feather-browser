---
title: The Reviews That Caught Me Lying
date: 2026-06-10
entry: 0019
milestone: "A full day of refusing to believe my own optimism. A reviewer ran my brand-new tests against the *broken* code and watched every one of them pass — proving they tested nothing. A 'known limitation' I'd written down with confidence shrank to a single deletable line the moment someone actually read the code. And a shiny new idea that wanted to jump to the front of the roadmap got parked behind the safety gate instead of chasing it. Three scenes, one lesson: the dangerous lies are the ones you tell yourself."
maps_to: [docs/specs/2026-06-10-observe-bug-fixes-design.md, research/2026-06-10-native-capabilities-router.md, "commits 09a6b6c..579b445", "commit 6263bd6", ADR-0010]
tags: [build-in-public, browser-dev, agents, ai-collaboration, testing, testing-honesty, v1]
status: draft
---

# The Reviews That Caught Me Lying

Most days I write about a thing I built. This one was different. Nothing on this day was a new feature, really — it was a day spent catching myself before my own optimism turned into a lie. Three times. Each one taught the same lesson from a different angle, so I'm telling all three.

## Scene one: the test that passed for the wrong reason

I'd found three small bugs in the agent's "eyes" — the part that reads a page and tells the agent what's clickable. Nothing dramatic: a pop-up dismisser that sometimes reported success when it hadn't actually cleared anything, a button whose name the agent couldn't read, a click that opened a new page and then threw a scary internal error instead of just saying "we navigated."

I designed the fixes, wrote them up, and handed the build to a team of AI sub-agents — each one taking a single step, writing its test first. Standard process by now. And the tests were green.

Then the reviewer did something I should have done myself. Instead of trusting that the new tests proved anything, it ran them against the **old, still-broken** version of the code — and watched every single one pass. Green on the broken code. That means the tests weren't testing the fix at all. They were theater.

The reason was sneaky enough that it's worth explaining: the tests pretended to click a link that navigated the page, but they used a fake "data:" web address to do it — and Chromium *silently refuses* to let a page send itself to one of those. So the click never navigated, the test never exercised the thing it claimed to, and it passed for the most useless reason possible: nothing happened. We tore them out and rebuilt them against a real little web server, with an assertion that the page's address *actually changed*. Now they fail when the code is broken — which is the only thing a test is for.

This is the same lesson Roi drilled into the project a few entries back: **test for truth, not for green checkmarks.** A test that can't fail isn't protecting you. It's lying to you with a smile.

## Scene two: the limitation that wasn't

Out of that same work came a follow-up I'd written down as a known limitation: pop-up banners that live *inside an embedded frame* on the page couldn't be dismissed. I'd documented it broadly — "this whole class of thing doesn't work yet" — and filed it as future work.

Then I actually read my own code instead of my own note. The truth was almost embarrassingly small. The agent's page-reader already *found* those in-frame buttons — it just **threw away the one number** that connected each button to the banner it belonged to, on the theory that the number wouldn't make sense across the frame boundary. That was it. One deleted line and a missing "is this button inside that banner?" check. I wrote a failing test first (on a real web server again — same trap as scene one, and I nearly fell into it twice), then fixed it in about an hour, mid-way through wrapping up for the day.

The lesson stuck harder than the fix: **a limitation you wrote down is not the same as a limitation you measured.** I'd described the wall as tall and wide because I'd never walked up and pushed on it. When I did, most of it fell over.

## Scene three: the idea that wanted to eat the roadmap

The third one is about restraint, not bugs. A genuinely exciting idea had been brewing — a "connector" layer that would let Feather plug into all sorts of outside tools and services. The kind of idea that, if you're not careful, quietly rewrites your whole plan to put itself at the center.

I felt that pull and stopped. Connectors mean other people's logins, real-account writes, imported third-party tools — they widen the blast radius enormously. And Feather's entire v2 plan hinges on building the *safety gate* — the deny-by-default permission system — **first**. A council of AI reviewers had already caught me, weeks earlier, sequencing the dangerous, powerful features ahead of the guardrails. I wasn't going to repeat that mistake for a shiny connector.

So the decision was: the connector idea is real, it's good, and it waits — parked explicitly *behind* the safety gate, not chasing it. I even caught a naming collision while filing it: I'd nearly called it the "Capability Registry," which would have clashed head-on with the security system's "capability" permissions. Renamed it before the confusion could take root. No code shipped. Just a plan, honestly placed.

## The thread

Three scenes: a test lying to me, a note lying to me, an idea trying to lie to my roadmap. The day's actual work was learning, each time, to not take the comfortable version on faith — to run the test against the broken code, to read the walker instead of the note, to park the shiny thing behind the guardrail. The build moves fast when AI does the typing. Staying honest with myself is the part that's still mine.

---

🔗 **LinkedIn cut**

A reviewer on my project ran my brand-new tests against the **broken** version of the code — and every one of them passed.

That's the worst possible result. It means the tests proved nothing. (The cause was sneaky: the test faked a page navigation using a web address that Chromium silently refuses to load, so nothing ever happened — and "nothing happened" passed.) We rebuilt them against a real server, asserting the page actually changed. Now they fail when the code is wrong. Which is the only reason tests exist.

Same day, two more versions of the same lesson:

→ A "known limitation" I'd confidently written down shrank to a single deletable line the moment I actually read my own code instead of my own note. The wall I'd described as tall and wide fell over when I walked up and pushed.

→ A shiny new idea tried to jump to the front of my roadmap. I parked it behind the safety gate instead — because I'd already been caught once putting powerful features ahead of the guardrails, and I wasn't doing it twice.

The build moves fast when AI does the typing. Staying honest *with myself* is the part that's still my job.

Building Feather in the open.
