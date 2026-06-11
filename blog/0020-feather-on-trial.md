---
title: Feather on Trial
date: 2026-06-11
entry: 0020
milestone: "I ran my browser head-to-head against Claude for Chrome — same ten errands, back to back — and the first story I told myself about the results was dramatic and wrong. A 'fatal connection crash.' My agent 'liking a stranger's Instagram post' and burning my warmed login. I put the whole thing on trial: a team of forensic AI agents tore my own conclusions apart. The crash was my agent's own brain losing its connection, not the browser. The 'like' never happened — a text search had matched the *instructions* instead of the page. One real, humble bug remained. An adversarial reviewer even caught me flattering my own browser. Then we fixed everything — and the code reviewer caught a real security hole in my fix before it shipped. The verdict: acquitted on the evidence, not on optimism. v1 stands."
maps_to: [docs/v1_wrap/META-ANALYSIS.md, docs/v1_wrap/claude-for-chrome/COMPARISON.md, docs/specs/2026-06-11-v1-wrap-gap-fixes-plan.md, "commits 60ef4fd..235ebbb"]
tags: [build-in-public, browser-dev, agents, ai-collaboration, testing, testing-honesty, evaluation, v1]
status: draft
---

# Feather on Trial

A few days ago I did the scary thing: I put Feather up against a real competitor.

Claude for Chrome is the same company's official browser agent, running in real Chrome. I gave it the exact same ten errands I give my own agent — find the top story, check the weather, count GitHub stars, fill a form, write to my calendar, act on Instagram — same plain-English instructions, same difficulty tiers, back to back. No rigged inputs. The whole point of the "test for truth" rule is that the test has to be allowed to make me look bad.

And on the surface, it did. The competitor finished nine of ten. Feather finished eight. Two of my errands didn't complete, and the story I wrote down to explain them was dramatic.

## The story I told myself

It went like this. On the hardest errand — act on a real Instagram post — Feather *died mid-action*. The logs showed what looked like a wall of connection crashes, a fatal flaw deep in how the browser holds its link to the page. Worse: before it crashed, the transcript seemed to show my agent had **liked a stranger's post and then un-liked it** — meaning it acted like a bot, tripped Instagram's defenses, and *burned the logged-in session I'd warmed by hand.* That warmed session is the entire foundation of Feather's design. So the story was: my browser is fragile, and when it does work, it's reckless enough to destroy the one thing it's built to protect.

That's a gut-punch of a conclusion. It would have reordered my entire roadmap — I'd have dropped everything to fix "connection durability" as the number-one emergency.

I almost did. Instead, I put the conclusion on trial.

## The trial

I ran a workflow built for exactly this: a team of AI analyst agents, working in parallel, each one assigned to attack a different part of my own story using the raw evidence — the actual transcripts, the actual server logs, the actual source code. Not "confirm what Roi thinks." *Prove him wrong if you can.* And one more agent whose only job was to be adversarial: to catch me flattering my own browser anywhere in the write-up.

Here is what they found, and every single piece of it overturned what I'd believed.

**The "wall of connection crashes" was one crash — and it wasn't the browser's.** What I'd read as nineteen stacked failures was a counting mistake. There was exactly one error, and it was the *agent's own brain* — the AI's connection to its model provider — dropping out. The browser was demonstrably alive and healthy the whole time; it answered a status check 83 seconds before the agent went dark, and it closed cleanly afterward. The "fatal browser flaw" I was about to drop everything for? It doesn't exist. The evidence for it was withdrawn.

**The "Instagram like" never happened.** This is the one that still makes me wince. My agent made *zero* clicks that liked or commented on anything. The "liked it, then un-liked it" I'd seen in the transcript was a text search matching the **errand instructions** — the prompt text telling the agent what to *try* — not a record of anything it did. There was no like. There was no comment. There was no real-world side effect at all. My browser never touched that post, never tripped any defense, never burned anything. (The test account did later turn out to be gone — but for reasons we genuinely can't pin on Feather, because Feather never acted.)

**The one real bug was mine, and it was humble.** So what *actually* went wrong on that errand? A boring, honest bug: I let you specify the browser window's size, accepted the setting politely — and then silently ignored it in one specific mode. The window came up too narrow, Instagram showed its cramped "get the app" wall, and the agent got stuck on it. And the best detail in the whole investigation: the agent, mid-errand, **diagnosed the bug itself by reading Feather's own source code**, correctly identified the exact function that dropped the setting, and was reaching for a manual workaround when its connection died. My browser's failure was so well-documented because my browser's user wrote the documentation in real time.

**The reviewer caught me flattering myself.** On a different errand, a form submission, Feather got blocked while the competitor got through — and I'd written that up as clean proof that Feather's automation is detectable and the competitor's real Chrome isn't. The adversarial reviewer pushed back: a re-run showed the block was simply *gone*, on both browsers. The cause was undetermined. I didn't have a clean experiment — I had a flaky data point I'd dressed up as a verdict because it fit a story I wanted to tell. The write-up now hedges, honestly, in both directions.

## The verdict, and the fix

When the dust settled, the honest scoreboard read completely differently from my first draft. On the eight errands both browsers could even attempt, **both finished all eight**, with the same tactics and the same honesty. The two "failures" that had me reaching for the panic button were one environmental fluke and one humble, fixable bug — neither of them the catastrophe I'd written down.

So I fixed the real things. The window-size bug. A way to list open tabs. A signal when a click opens a new one. A way to read what's typed into a form field. A cleaner error when temporary files won't delete. And — because the investigation itself had been so painful — better flight-recorder logging and a simple "is the browser still alive?" check, so the next time something dies I can tell *which* thing died in one glance instead of an afternoon of forensics.

And the trial had one last turn. When I built the new logging, the code reviewer caught a **real security hole in my own fix** — my new log-writer would create files for unauthenticated strangers, a way to flood the disk. Found it, proved it, and I closed it with a regression test before any of it shipped. The reviewer that put Feather on trial put my repair work on trial too. Good.

Three hundred and one unit tests green, seventy-nine integration tests green, all pushed.

I went into this expecting a competitor to expose Feather. What actually got exposed was *me* — the dramatic, tidy, slightly self-serving story I'd reached for before the evidence was in. The competitor was a wash on capability. The real win was the machinery that wouldn't let me lie to myself about it. v1 stands — acquitted on the evidence, not on optimism. Now I get to go plan v2 with a clear conscience.

---

🔗 **LinkedIn cut**

I put my AI browser up against the official competitor — same ten errands, back to back — and then I told myself a dramatic story about why mine "lost."

The story: a fatal connection crash, and my agent recklessly *liking a stranger's Instagram post* and burning the logged-in session my whole product depends on. It would have reordered my entire roadmap around an emergency fix.

So I put my own conclusion on trial. A team of AI forensic agents, working in parallel, each assigned to prove me wrong using the raw evidence. Every finding overturned what I believed:

→ The "wall of crashes" was ONE crash — the agent's own AI connection dropping, not the browser. The browser was healthy the whole time.

→ The "Instagram like" never happened. A text search had matched the *instructions* I gave the agent, not anything it did. Zero real-world effect.

→ The one real bug was humble: a window-size setting I accepted and then silently ignored. The agent diagnosed it mid-task by reading my own source code.

→ An adversarial reviewer even caught me dressing up a flaky data point as a clean win in my own favor. Made me walk it back.

Then we fixed the real bugs — and the code reviewer caught a genuine security hole in my *fix* before it shipped.

The competitor didn't expose my browser. It exposed the tidy, self-serving story I reached for before the evidence was in. The verdict: acquitted on the evidence, not on optimism.

That's the whole discipline. Build fast. Refuse to believe your own best story until something tries to break it.

Building Feather in the open. v1 stands.
