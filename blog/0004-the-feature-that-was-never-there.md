---
title: The Feature That Was Never There
date: 2026-06-03
entry: 0004
milestone: "S2 core shipped — duplicate-tab fix, the TAB_UPDATED event, and crash-resilient status reads. Plus a dead feature found and deliberately left alone."
maps_to: [docs/plans/2026-06-03-s2-tab-layer-observability.md, docs/specs/2026-06-03-s2-tab-layer-observability-design.md]
tags: [build-in-public, stabilization, discipline, ai-collaboration, browser-dev]
status: published
---

# The Feature That Was Never There

The plan had three jobs and a fourth that looked like a formality. "Add a test to confirm the trace file gets written." Ten minutes of work. Check a box, move on.

So before writing the test, I had my AI collaborator go read the code that was supposed to write that file.

It didn't exist. Well — it existed. There was a whole tidy class sitting in the codebase whose entire job was to record a trace of a browser session and zip it up for debugging. It just had never been switched on. Nothing in the running program ever called it. The flag you'd flip to turn it on — `trace: true` — flowed into the system and then quietly hit a dead end. A light switch wired to nothing.

I'd have written a test for a feature that had never once run. The test would have failed, and the failure would have looked like *my* bug, not the original gap.

## The smaller, realer bug underneath

That wasn't even the main work this session. The main work was less glamorous and more important.

When Feather opens a browser tab, two different parts of the system both noticed the new tab and both gave it an ID. So a single tab was being filed under two names. Harmless until it isn't — and it was about to block the next feature, which needs to point at *one* tab and say "tell me when this one changes." You can't do that cleanly when the tab has a split identity.

The fix is the kind of thing that sounds obvious once you say it: identify a tab by the tab itself, not by who happened to notice it first. Whoever sees it — the system gets the same answer, every time. One tab, one name.

On top of that I added the "this tab just changed" signal a future visual browser will need, and made the status check survive a tab crashing mid-read instead of taking the whole report down with it. Unspectacular. Load-bearing.

## The decision I'm proud of is a *no*

Here's the part I keep turning over.

I found a dead feature. The obvious instinct — the satisfying instinct — is to fix it right then. Wire up the trace recorder, make the light switch do something, ship it all in one go. It's *right there.*

I didn't.

This stretch of the project has one job: make the foundation boringly reliable. Stabilization. And wiring a brand-new subsystem into the delicate moment when a browser session starts and stops is exactly the kind of "while I'm in here..." move that turns a clean week into a debugging week. It's new risk, dressed up as tidiness.

So I called it: ship the three fixes that make things *more* solid, write the dead feature down as a known gap with a clear note for later, and walk away from it. Discipline isn't doing more. Sometimes it's refusing the bonus task that's quietly trying to widen the blast radius.

The trace recorder will get its day — in a session that's actually about observability, where wiring it is the point and not a detour.

## Where this leaves things

Three real fixes shipped and tested against a real browser. One dead feature found, documented, and deliberately left for the right moment. The foundation got a little more honest and a little more solid, and I didn't trade that for the dopamine of fixing one more thing.

Back to the browser.

---

## 🔗 LinkedIn cut

The task looked trivial: "add a test confirming the trace file gets written." Ten minutes.

Before writing it, I had my AI go read the code that writes that file.

It had never run. The whole feature was sitting there, fully built, wired to nothing — a light switch connected to no light. I'd have written a test for something that had never once worked, and the failure would've looked like my mistake instead of the real gap.

Finding it was satisfying. Here's the part I'm actually proud of: I didn't fix it.

This phase of my browser project has exactly one job — make the foundation boringly reliable. Wiring a new subsystem into the fragile moment a session starts and stops is precisely the "while I'm in here..." move that turns a clean week into a debugging week. So I shipped the three fixes that make things *more* solid, wrote the dead feature down as a known gap, and walked away from it.

Discipline isn't doing more. Sometimes it's refusing the bonus task that's quietly trying to widen the blast radius.

The shiny detour will always be right there. The skill is leaving it there until it's actually the job.

#BuildInPublic #SoftwareEngineering #AI #Discipline #BrowserDev
