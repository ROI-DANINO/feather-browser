---
title: The Keys Were Under the Doormat
date: 2026-06-04
entry: 0007
milestone: "Pre-shell security groundwork — decided how Feather stores its secrets. Found that profiles/cookies/token were living inside the project folder (not even hidden from Git), and chose the Linux-native fix: move them into the standard private home-directory folders. Spec + implementation plan landed; build next."
maps_to: [docs/specs/2026-06-04-storage-isolation-xdg-design.md, docs/plans/2026-06-04-storage-isolation-xdg.md]
tags: [build-in-public, browser-dev, security, linux, agents, ai-collaboration]
status: published
---

# The Keys Were Under the Doormat

Last time my browser said hello to the world and signed it with my name — an agent acting in my real, logged-in session, without ever touching my password. I ended that entry with a promise: *next stop, security. If agents are going to act as me, the keys to my life have to be kept properly.*

This session I went to make good on it. And before I could build the safe, I found out where I'd been keeping the keys.

## The boring question that wasn't boring

The plan was unglamorous: decide how Feather stores its secrets — the logged-in browser profiles, the cookies, the access token, and eventually a proper password vault. Storage. Folders. Not exactly fireworks.

Except when I actually looked, the answer was alarming. All of that — every cookie, every saved session, the lot — was being written into a hidden folder **inside the project itself.** The same folder that holds the code. The same folder that syncs to GitHub.

It gets worse: that folder wasn't even on the project's ignore-list, the thing that tells Git "never track this." So the most sensitive material Feather touches was sitting one careless commit away from being published to the internet, right next to the source code.

The keys weren't in a safe. They were under the doormat, next to a sign pointing at the door.

## Why this breaks the whole promise

The entire point of Feather is that an agent can act as me *without ever seeing my actual passwords.* Feather holds the secrets; the agent just gets to use a session that's already logged in. That only works if "Feather holds the secrets" means something — if there's a real wall between the private stuff and everything else.

Secrets living inside the shared, syncable project folder isn't a wall. It's the absence of one. Fixing where they live isn't housekeeping that comes *after* the security work — it *is* the first brick of it.

## The fix: do it the Linux way

Here's where it got nice. My collaborator laid out two options. The quick one: shove everything into a single private folder in my home directory and move on. The tidier one: sort each kind of file into the specific home-directory folders that well-behaved Linux apps are *supposed* to use — one place for data worth keeping, one for logs, one for throwaway scratch files, one for things that should vanish when I log out.

I didn't fully follow the jargon, so I asked for plain English — and got it. Once it was plain, the choice was obvious. Feather is a Linux-native browser. It should behave like a good Linux citizen, not dump everything in one heap. **I like the Linux way.**

So that's the decision: the profiles, cookies, and future vault move to where Linux keeps data worth protecting; logs and debug files go to the logs area; the temporary session leftovers go to the scratch area; the access token goes to a spot the system wipes when I log out. Your secrets end up in your private home, never inside the project, never anywhere a stray Git command can sweep them up.

We wrote it down as a spec, then as a step-by-step build plan — small, test-first, reversible steps — and I confirmed one thing that pleased me: the change won't force us to rewrite the 170 tests already guarding the core. Good plumbing shouldn't make you re-pour the foundation.

## A smaller lesson, same shape

There was a second, quieter version of the same lesson this session. A memory feature I'd switched off for this project kept switching itself back on at every restart. It looked like the setting had failed. It hadn't — the setting was correct; the tool just only reads it fresh when the whole app is fully restarted, not when you clear the screen. Once I quit and relaunched properly, it stayed off.

Same shape as the doormat: the thing that *looked* broken was actually a misunderstanding about *when* a change takes effect and *where* state really lives. Two reminders in one sitting that with this kind of work, the question is almost always "where does this actually live, and who can reach it?"

## What's next

Now the folders are decided, next session is the satisfying part: actually building the move, step by step, and watching the app come up clean — nothing sensitive left inside the project, everything tucked into its proper private home. Then, on that honest foundation, the real vault.

The safe comes next. This time, I just got the keys out from under the doormat.

---

## 🔗 LinkedIn cut

My browser project's whole promise is that an AI agent can act as *me* — in my logged-in sessions — without ever seeing my passwords.

This week I sat down to do the security properly. And before I could build the safe, I found where I'd been keeping the keys: in a hidden folder **inside the project itself** — right next to the code, syncing to GitHub, not even on the ignore-list. The most sensitive data the app touches was one careless commit from going public.

The keys weren't in a safe. They were under the doormat.

That's not housekeeping you do *after* the security work. It *is* the first brick. If "the app holds the secrets, not the agent" is going to mean anything, there has to be a real wall — and secrets sitting in the shared, syncable project folder is the absence of one.

The fix: do it the Linux way. Instead of one heap, sort everything into the private home-directory folders well-behaved Linux apps are supposed to use — data worth keeping in one place, logs in another, throwaway scratch in another, the access token somewhere the system wipes at logout. Out of the project. Out of Git's reach.

The lesson I keep relearning on this build: the real question is almost never "does it work?" It's *"where does this actually live, and who can reach it?"*

Next: build the move, then build the vault.

#BuildInPublic #Security #Linux #BrowserDev #AI #SoftwareEngineering
