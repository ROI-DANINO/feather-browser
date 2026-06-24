---
title: Every Door But the Vault
date: 2026-06-24
entry: 0023
milestone: "After cutting a week of stealth work, I went to do the unglamorous thing: harden the security surface of my browser before showing it to strangers. Constant-time auth, refuse to bind to the network by accident, keep the 2FA token off the console, lock the credential files owner-only. TDD, all green, felt thorough. Then I did the thing I've learned to always do — I refused to trust my own 'done' and pointed an adversarial AI reviewer at my own diff. It found the one lock I'd missed: I'd secured the log directory, the audit directory, the run directory — and left the actual cookie jar, the warmed-login folder the entire product is built around, readable by anyone on the machine. I'd locked every door in the house except the vault. Fixed it, then built a small thing to close a gap the hardening itself opened: a 2FA banner that hands the human the resolve page without ever letting the page see the secret. Shipped and pushed."
maps_to: [docs/specs/2026-06-24-mfa-resolve-banner-design.md, docs/specs/adr-0012-at-rest-plaintext.md, SECURITY.md, "journal/ops/sessions/every-door-but-the-vault-20260624-0314.md"]
tags: [build-in-public, browser-dev, agents, ai-collaboration, security, verification, mfa]
status: draft
---

# Every Door But the Vault

The most dangerous gap in any system is the one sitting on the thing you're proudest of, because you never check it — you *assume* it's covered. This is the story of finding exactly that, in my own work, an hour before I'd have shipped it.

## The unglamorous part

Last week I cut nine days of work — a whole "stealth" detour that turned out to be a treadmill. The cut left me staring at the real job: my browser, Feather, is built so AI agents can drive your *real, already-logged-in* accounts, privately, on your own machine. That's the whole pitch. But before I show it to a single stranger, the code has to be solid. Trustworthy. Boring, in the good way.

So I did the boring, important things. I made the login check constant-time, so an attacker can't tease the token out a microsecond at a time. I made Feather *refuse to start* if you accidentally tell it to listen to the whole network instead of just your own machine. I stopped a 2FA link from printing the secret part to the console where logs can catch it. And I locked down file permissions — the run folder, the log folder, the audit trail — to owner-only, so another user on the same machine can't read them.

Every change came with a test written first, watched to fail, then made to pass. All green. It felt thorough. It *looked* thorough.

That feeling is exactly when I've learned to get suspicious.

## The reviewer I point at myself

Here's a habit that's saved me more than once: I don't trust my own "done." Tests prove the code does what I *told* it to do. They can't tell me I told it the wrong thing.

So I did what I now do after any serious change — I pointed an adversarial AI reviewer at my own work and told it to break it. Not one reviewer; three, each with a different job. One checking whether each fix actually holds. One hunting for *sibling* problems — the places the same bug lives that I didn't touch. One checking that my tests actually test what they claim, instead of quietly passing on nothing.

The third one came back clean. The first one found a wording slip. The second one found the thing that made my stomach drop.

## The door I left open

I had locked the run directory. The log directory. The audit directory. The session-log files. Owner-only, every one.

I had not locked the **cookie jar**.

In Feather, your warmed, logged-in sessions — the actual cookies, the saved logins, the thing that *is* you to every website — live in a profile folder on disk. That folder is the entire product. It's the asset. And I'd left it at the system default: readable by any other account on the machine.

I'd built a vault, hardened every hallway leading to it, and left the vault door open.

Why? Because I'd fixed the directories the checklist *named* — and the checklist named the plumbing. The cookie jar gets created somewhere else in the code, by a different part of the system, so it was never on the list. It's the oldest trap there is: you fix the exact thing the ticket points at, and the sibling right next to it — the one that matters *more* — sails through untouched because nobody wrote its name down.

The reviewer wrote its name down. I fixed it in about ten minutes, wrote a test that would scream if it ever regressed, and re-ran everything green. But the ten-minute fix isn't the point. The point is that without the adversarial pass, I'd have published a security document *bragging* about owner-only permissions while the one folder that holds the actual logins sat wide open. I'd have been honestly, confidently wrong — in writing — about the thing I care about most.

## The gap my own fix opened

There's a quieter lesson hiding in the same session. Good fixes create new problems, and you have to look for them.

When I took the 2FA secret off the console, I closed a leak — but I also closed the *only way* a solo user without a fancy notification channel could finish a two-factor login. I'd made it safer and, for one kind of user, unusable.

The fix Roi and I landed on is one I'm a little proud of. When a site asks for a 2FA code, Feather drops a banner onto the page you're watching: *"needs a code — open the tab."* You click it. But here's the careful part: the button itself carries no secret, and it doesn't open the tab. It just raises a little flag. **Feather** sees the flag and opens the secure resolve page itself — so the token rides in through the back, and the page you're sitting on (which might be a hostile site demanding the code) never gets to see it. The human gets a one-click path; the secret never touches the dangerous room. Safe by construction, not by hoping.

## What I'm taking from it

Two things.

The big one: **the asset you're proudest of is the one you forget to check.** I locked every door I thought of, precisely *because* I was thinking about doors — and walked right past the vault, because some part of me assumed the vault was obviously, already handled. It wasn't. The only thing that caught it was making a fresh, skeptical reader go looking for what I couldn't see, *because* I was the one who wrote it.

The small one: a fix isn't finished when the test goes green. It's finished when you've gone looking for the new gap it just opened.

I shipped the hardening, the vault lock, and the banner together, and pushed it. Feather is one step closer to something a stranger can trust — and one more reminder that the work isn't writing the code, it's refusing to believe yourself about it.

---

🔗 **LinkedIn cut**

I almost shipped a security writeup bragging about a lock I forgot to install.

I'm building an AI browser, solo, in the open. Its whole job is to drive your *real* logged-in accounts — privately, on your own machine. So before showing it to anyone, I spent a session hardening it: constant-time login checks, refusing to expose itself to the network by accident, locking the sensitive files so no one else on the machine can read them. Test-first, all green. Felt thorough.

Then I did the thing that keeps saving me: I don't trust my own "done." I pointed an adversarial AI reviewer at my own work and told it to break it.

It found the one lock I'd missed.

I'd secured the log folder, the audit folder, the run folder — and left the **cookie jar** wide open. The folder holding the actual logged-in sessions. The thing that *is* the product. I'd hardened every hallway to the vault and left the vault door open.

Why? Because I fixed exactly what my checklist named — the plumbing — and the asset that mattered most got created somewhere else in the code, so its name was never on the list. Oldest trap there is: patch the thing the ticket points at, miss the sibling next to it that matters more.

Ten-minute fix. But without that adversarial pass, I'd have published a document *bragging* about my permissions while the real vault sat open. Honestly, confidently wrong — in writing — about the one thing I care about most.

The lesson I keep relearning: the part you're proudest of is the part you forget to check, *because* you assume it's handled. Tests prove the code does what you told it. They can't tell you that you told it the wrong thing. A fresh skeptic — human or AI — can.

The work isn't writing the code. It's refusing to believe yourself about it.

Building in the open — including the locks I almost forgot.
