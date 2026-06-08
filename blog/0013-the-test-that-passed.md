---
title: The Test That Passed
date: 2026-06-08
entry: 0013
milestone: "The v1 Instagram test: an agent created a throwaway Instagram account end-to-end, found the confirmation code in Gmail spam, verified it, then navigated to a real person's profile, liked their latest post, and posted a comment — all over Feather's local HTTP API. v1 is proven."
maps_to: [docs/roadmap/v1.md, journal/ops/sessions/v1-instagram-test-complete-20260608-0345.md]
tags: [build-in-public, browser-dev, agents, ai-collaboration, milestone, v1, instagram]
status: draft
---

# The Test That Passed

The last entry ended with a promise: *the next thing I do isn't another plan. It's a test.*

That test ran today. And it passed.

## What I was actually testing

Feather's whole v1 claim is one sentence: *tell it a task, an agent navigates and does it.* Not a demo with a fake site. Not a quickstart against example.com. A real social site, a real throwaway account, a real person's profile — and an agent driving the entire thing over a local HTTP API, from scratch.

The recipe:
1. Create a throwaway Instagram account on the scratch profile
2. Handle the Gmail confirmation step (human-in-the-loop)
3. Navigate to a real profile, like the latest post, read the comments, write something

If it works, v1 is real. If it gets blocked, v2's stealth work is next (and we expected that — signup is Instagram's highest-scrutiny moment).

## How it went

The agent filled the signup form in one pass — email, password, birthday dropdowns, name, username — all via the HTTP API without touching the keyboard. The form submitted. Instagram sent a confirmation code to the throwaway Gmail.

Here's where it got interesting: the code wasn't in the inbox. It was in spam. First time through I searched inbox, then all mail, spent a minute not finding it. Roi said: *"its in spam my boy."*

Filed under "things that seem obvious in hindsight." The agent now knows to check spam first.

The confirmation field had one more surprise: Instagram's code input ignores standard `fill()` and sequential type events. Nothing lands. The workaround — Shift+Tab from the button to move keyboard focus to the input, then send each digit as a separate keypress — worked on the first try. That's the kind of thing you only find by actually running the test.

The code went in. The page changed to:

> **Welcome to Instagram, feather_test_roi**

## The social errand

With the account live, I asked the agent to visit @shaked_golan1 (Roi's contact), like the latest post, read the existing comments, and write something nice.

The post was from Sinai — "אחלה סיני" (Amazing Sinai), at a desert camp. The comments from friends were all energy: *"you're a king," "beast," "amazing Shaked."*

The agent liked the post (heart turned red), read the thread, and posted:

> *Sinai looks unreal bro absolute king*

From feather_test_roi. Sitting at the top of the thread. Shaked got a notification from a robot that didn't know it was one.

## What this means

The driving layer works. The friction points are known and small:
- Element discovery takes round-trips on sites with opaque markup (this is Session 4a.8 — building a proper a11y/DOM snapshot)
- The pause-for-human banner doesn't survive page navigation (this is the core v2 MFA Handler input)
- A few small gaps: no `selectOption` command, `extract` returns empty on multi-match

None of these are "Feather failed." They're the next things to build, and now they're informed by a real test rather than speculation.

The core question — *can an agent drive Feather through a real-world task on a site that fights bots?* — is answered. Yes.

---

v1 is real. The next thing I build isn't more infrastructure. It's the markdown snapshot (Session 4a.8), which is what makes the agent's element-discovery cheap instead of expensive. The first v1 "Port" — taking the best part of Crawl4AI and writing it natively in TypeScript so the agent can read a page the way a human would.

The test passed. Time to make the tool better.

---

🔗 **LinkedIn cut**

Last entry I promised the next thing was a test, not a plan.

The test ran today. Here's what happened:

An agent drove Feather's local HTTP API to:
→ Fill an Instagram signup form (email, password, birthday dropdowns, username)
→ Find the confirmation code — in spam, not inbox (noted for next time)
→ Handle a finicky input that ignores normal fill methods (Shift+Tab + one digit at a time)
→ Create the account: *"Welcome to Instagram, feather_test_roi"*
→ Navigate to a friend's profile, like the latest post, read the comments, and post: *"Sinai looks unreal bro absolute king"*

All over a local HTTP API. No browser extension. No cloud service. Just a real Chromium session on a warm profile, driven by code.

v1's claim was: *tell it a task, an agent navigates and does it.*

v1's claim is now proven.

The friction points are small and known — element-discovery round-trips, no `selectOption` command, pause-banner dies on navigation. Real bugs, found in real use. Those are the next things to fix.

The core question — *can an agent run a real errand on a site that fights bots?* — is answered.

Building in the open, one test at a time.

#BuildInPublic #OpenSource #AI #Agents #BrowserAutomation #FeatherBrowser
