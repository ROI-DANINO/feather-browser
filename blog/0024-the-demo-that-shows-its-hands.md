---
title: The Demo That Shows Its Hands
date: 2026-06-24
entry: 0024
milestone: "The last item on the reorientation roadmap: show it off. Feather already had a hero demo — an agent that asks ChatGPT a question and drafts the reply in my Gmail, riding my logged-in session. But watching it, Feather was invisible: the login step was a silent console poll, so all you saw was Google's own login screen. I wanted the demo to show the actual mechanism — the human handoff. Turned out the real, shipped feature (an on-page Resume banner that pauses the agent while I log in) wasn't even wired into the demo. Swapped it in (~15 lines), recorded it live with the banner surviving Google's real redirect chain, then spent the back half of the session doing something I rarely do on purpose: making it look professional. Reviewed the recording frame by frame, trimmed the mess, compressed it honestly. And refused to let the video claim something it didn't prove — no 2FA challenge fired, so I said so. Shipped to dev; Phases 0–3 of the reorientation now complete."
maps_to: ["docs/specs/2026-06-24-hero-demo-mfa-handoff-design.md", "docs/plans/2026-06-24-hero-demo-mfa-handoff.md", "docs/v1_wrap/hero-demo-v2/gate-report.md", "scripts/demo/continuity.ts", "journal/ops/sessions/the-demo-that-shows-its-hands-20260624-0554.md"]
tags: [build-in-public, browser-dev, agents, ai-collaboration, demo, mfa, verification]
status: draft
---

# The Demo That Shows Its Hands

A week ago I cut a feature I was proud of (stealth — teaching the agent to dodge bot-detectors) because I realized my product doesn't need a disguise: it rides *real* logged-in accounts, which already look human because they are. That left a short, honest roadmap: harden the code, make it adoptable, then show it off. Hardening shipped. Adoptable shipped — though not before Roi-the-editor caught me confusing two different version numbers in my own docs (the product is on "v2," but the HTTP API URL still says `/v1` — I'd quietly conflated them; we made the docs name them apart so no reader trips on it).

So: show it off. The last one.

## The demo where the star never appears

Feather already had a hero demo. You run one command, a browser opens, and an agent asks ChatGPT "hello world," takes the reply, and drafts it into my Gmail — across two sites, riding the session I'd logged into by hand. That's the whole pitch of the product in thirty seconds: *it runs errands for me, on accounts that are already mine.*

I wanted the new demo to show the part I'm proudest of — the moment a human and the agent hand control back and forth. Specifically the 2FA handoff: the agent hits a login it can't do alone, pauses, lets me step in, and picks back up once I'm through.

Then I actually read the demo's code, and found the problem. The login step was a **silent poll**. The script just sat in the terminal asking, over and over, "is the inbox there yet? is it there yet?" — while *I* did the whole login in the browser. Feather did nothing visible. If you watched the screen recording, you saw Google's login page and then, magically, the agent carrying on. Feather, the thing the demo is supposed to be about, was invisible.

And here's the kicker: Feather already *has* the visible version. Weeks ago I'd built an "await-human" handoff — when the agent needs a human, it drops a blue banner onto the page itself ("⏸ Feather paused — finish logging in, then click Resume"), waits, and resumes the instant you're in. That feature was sitting right there, fully built, and the demo wasn't using it. The work wasn't *building* anything. It was making the thing I already had show its hands.

## The fork, and the mouse I didn't build

Before writing code I talked it through with my AI pair (this is how all of it goes now — I decide the shape, the AI builds against it, and I push back when it drifts). Two forks mattered.

First: I had pictured the agent *autonomously* logging into the second site and hitting 2FA there. But that means teaching the agent to drive a login it'll mostly get blocked on (ChatGPT's login is hostile to automation), for a step the demo doesn't even need. The honest, smaller move was to show the handoff on the *Google* leg — the login I do anyway — and make Feather's pause visible there. Same feature, a quarter of the risk.

Second, an idea I liked and killed: a visible mouse cursor for the agent, gliding to each button. It'd look great. But Feather's clicks currently *teleport* — there's no cursor path — so a moving cursor would be a prop I drew on top, a little movie of something the software doesn't do. That's exactly the kind of rigged demo I've sworn off. So: noted for v3, where I'd build it for real, and left out of this one.

The actual change was about fifteen lines: rip out the polling loop, drop in one call to the await-human handoff, and add a guard for the case where I click Resume too early. I had a fresh AI sub-agent implement it test-first, then a second one review it cold.

## The review that caught me contradicting myself

The second task was adding a one-line "done when" definition to each product version in my front-door doc — a binary, you-can't-argue-with-it finish line for v1, v2, v3. The reviewer approved v1 and v3 and rejected v2, and it was right in a way that stung a little. I'd written that v2 is "done" when a warmed session works on a bot-detecting site *"without triggering a human-verify challenge."*

That sentence quietly undoes the decision I'd just made. The whole point of cutting stealth is that I *expect* the occasional "verify it's you" challenge — and I have a mechanism that absorbs it: the human handoff. Writing "no challenge allowed" turns my own safety feature into a failure condition. The reviewer flagged it; I rewrote it so the finish line is *no persistent block* — a one-time challenge resolved through the handoff is a pass, not a fail. The exact contradiction I'd preached about a week earlier, smuggled back in by my own hand. This is why I keep pointing adversarial reviewers at my own work: I am not a reliable judge of the things I just wrote.

## Recording it — and the part where no 2FA showed up

Then the live test, the one real unknown. The banner re-injects itself on every page load so it can follow you across navigations — but I'd never run it against Google's *actual* login, which bounces you across several pages on the most locked-down domain on the web. Would the banner survive?

I wiped the demo's throwaway profile and recorded a clean run. It worked: the banner appeared on the login page, **survived** the jump from the email screen to the password screen, and the agent auto-resumed the moment Gmail loaded — then sailed through the ChatGPT-to-Gmail errand. I confirmed it twice: once by reading Feather's own session log (the timestamps show the handoff spanning the whole login and returning on its own), and once by stepping through the recording frame by frame.

But here's the honest part. **No 2FA challenge fired.** Same machine, same network — Google didn't bother. Which means the recording proves the banner survives a normal login, but it does *not* prove it survives a 2FA *page* specifically — the exact thing I set out to showcase. The tempting move is to let the video imply otherwise. Instead I wrote a gate report that says, in plain words, what was proven and what wasn't, softened the README so it doesn't claim 2FA was demonstrated, and queued the real test: a run on my *actual* account, which will trigger the phone-tap verification, recorded later. Test on the real thing; publish with the throwaway.

## Make it look professional

The last stretch was unglamorous and, honestly, my favorite. I asked the AI to *watch the video and review it* — be my eyes on whether it looked like a product demo or a desktop screenshot. It pulled frames across the whole clip and gave it to me straight: the story lands and the banner is clearly the star — but the recording opens on the *previous* run's leftover console spam, ends on my own video-compression command scrolling past, and the file was a 23-megabyte near-4K monster for a public repo people have to clone.

All fixable without re-shooting. We trimmed the head and tail so it opens on the browser and ends on the finished draft — the payoff — and compressed it the right way: quality-locked, not size-capped, because forcing a tiny file size is what makes text go blurry. It landed at 2.4 MB and stayed crisp. The remaining flaws (a see-through terminal over a busy wallpaper) I wrote down as "re-record only" rather than pretending they weren't there.

Pushed to `dev`. Phases 0 through 3 of the reorientation — stop the bleed, harden, make it adoptable, show it off — are done.

The lesson I keep relearning: the feature was already built. The work was making it visible, and being honest about exactly what the demo does and doesn't prove.

---

🔗 **LinkedIn cut**

My product's best feature was invisible in its own demo.

Feather is a browser an AI agent drives for you — riding the accounts you're already logged into. The demo shows an agent asking ChatGPT a question and drafting the answer in my Gmail, across two sites, as me.

But the moment I'm proudest of — where the agent hits my login, *pauses*, lets me step in, and picks back up — was happening silently. On screen you just saw Google's login page. The actual handoff feature, an on-screen "paused — finish logging in, then Resume" banner, was built weeks ago and never wired into the demo.

So this week wasn't about building. It was about making the thing show its hands. Fifteen lines of code. Then:

→ An AI reviewer caught me writing a "done" definition that secretly contradicted a decision I'd made a week earlier. Rewrote it.
→ I recorded it live — the banner survived Google's real login redirects.
→ No 2FA challenge fired that run. So I refused to let the video imply it did. Wrote down exactly what was proven and what wasn't.
→ Then I asked the AI to *watch the recording and tell me if it looked professional.* It did — and told me it opened on leftover console spam and was a 23MB file for a repo people clone. Trimmed it, compressed it honestly, 2.4MB, crisp.

The hardest discipline in building in public isn't shipping. It's not letting the demo claim more than it earned.

#buildinpublic #AI #softwaredevelopment
