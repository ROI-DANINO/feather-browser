---
title: The Migration That Needed No Code
date: 2026-06-03
entry: 0005
milestone: "S3 shipped — Fastify v4→v5 (zero source changes), Playwright bumped to keep Chromium current, security checkpoint. Stabilization & Linux-Readiness program functionally closed."
maps_to: [docs/specs/2026-06-03-s3-currency-security-design.md, docs/plans/2026-06-03-s3-currency-security.md, docs/specs/2026-06-03-s3-security-checkpoint-findings.md]
tags: [build-in-public, stabilization, dependencies, security, ai-collaboration, browser-dev]
status: published
---

# The Migration That Needed No Code

The web framework underneath Feather had quietly gone out of support. Version 4 of Fastify stopped getting security fixes last summer; I'd been running it ever since, which is exactly the kind of thing that's invisible right up until it's a headline. So this session had a job that sounded heavy: move the whole HTTP layer up to version 5.

Major-version upgrades have a reputation, and it's earned. They break things in small, scattered ways — a function signature here, a removed option there — and you find them one failing test at a time. I budgeted for a slog.

## Don't trust the slog — and don't trust the easy "yes" either

There was one real unknown: the little plugin Feather uses to stream live events to a future UI. Its compatibility notes *claimed* it supported the new version, but "claimed" was doing a lot of work — it had only ever been tested against the old one. A claim is not a test.

So before changing a single line of the real project, I had my AI collaborator spin up a throwaway copy, install the new version there, and just *run everything.* If the event stream broke, we'd know in the disposable branch, not in the codebase I care about. We'd also have a fallback ready — I'd already decided that if the plugin failed, we'd hand-roll the event streaming ourselves rather than fork someone else's library.

It passed. All of it. Every test, plus a live check of the actual event stream with a real browser attached. The plugin's claim turned out to be true — but the point is I didn't *assume* it; I made it prove it, somewhere safe.

## The bill past-me had already paid

Then the part I didn't see coming. I moved the new version into the real project, braced for the scattered breakage — and there was none. Zero. Not one line of Feather's own code had to change.

For a moment that felt like luck. It wasn't.

The upgrade's biggest landmine was a new strictness about how you describe what an API request should look like. Feather sidesteps it entirely — months ago I'd chosen a separate tool for that job instead of leaning on the framework's built-in version. Another landmine was a change to how the server is told which address to listen on. Past-me had already written it the new, stricter way, back when it was merely optional.

None of those were migration decisions. They were just *tidy* decisions, made for their own sake at the time. The reward for them showed up today, as a migration that turned out to be a non-event. That's the quiet compounding interest of doing the boring thing right the first time: a scary upgrade collapses into a version-number change and a green test run.

## While I was in there: a note on staying invisible

I also nudged the browser engine up to its latest version. That one isn't about features — it's about staying unremarkable. A browser that's running a Chromium several versions behind the real world is *noticeable*; it stands out to the systems whose whole job is spotting automation. Keeping the engine current isn't a nice-to-have for what Feather wants to become — it's camouflage. The heavy lifting on that front is still ahead, but the cheapest move is simply to not fall behind, so I didn't.

Last, a security pass. A scan flagged some warnings — all of them in the testing tools, none in anything Feather actually ships or runs. So I wrote down exactly why they're safe to leave and declined to force a fix that would've broken the test runner for no real-world gain. Then a read-through of the doors into Feather: still locked, still listening only to the local machine, still scrubbing passwords out of its logs. Nothing had regressed.

## Where this leaves things

The stabilization stretch — the deliberate, unglamorous work of making the foundation boring and current before building the visible browser on top of it — is essentially done. Off the unsupported framework. Engine current. Doors checked.

The reward for a careful migration is that nothing happened. I'll take it.

Next, the part I've been waiting for: designing the actual window you'll look at.

---

## 🔗 LinkedIn cut

The framework under my browser project had gone out of support. This session's job: a major-version upgrade. Those have a reputation for breaking things in a dozen small, scattered ways, and I braced for the slog.

Two things happened.

First: the one real risk was a plugin that *claimed* to support the new version but had only ever been tested on the old one. A claim is not a test. So before touching the real code, I spun up a throwaway copy and made it prove the claim in a place where failure was free. It passed — but I didn't assume it.

Second, and the one I keep thinking about: when I did the real upgrade, **not a single line of my own code had to change.** Not luck. The upgrade's biggest landmines were things I'd quietly sidestepped months ago — not as migration prep, just as tidy choices at the time. Today they paid out as a migration that was a complete non-event.

That's the compounding interest of doing the boring thing right the first time. The scary upgrade collapses into a version bump and a green test run.

The reward for a careful migration is that nothing happens. I'll take it.

#BuildInPublic #SoftwareEngineering #TechnicalDebt #AI #BrowserDev
