# Agent Browsing Stack — Master Brief
**Date:** 2026-06-07
**Status:** 🗺️ Planning brief — three spec sessions to follow
**Trigger:** Brainstorming session (2026-06-07); Anchor Browser research (research/2026-06-06-anchor-browser-product-reference.md)

---

## What we are building and why

Feather agents should be able to work on **any site a human can use** — without getting blocked.
That means: LinkedIn, Instagram, insurance agent portals, and any site with active bot detection.

This is a three-part system, designed to be built in layers. Each part is independent enough for
its own spec session but they serve a single goal: **an agent that looks and behaves like the
person who owns the session**.

### The guiding constraints

- **Local-first, always.** Feather runs on the user's machine. No cloud relay, no shared sessions.
  Each user owns their own browser, their own sessions, their own phone.
- **Lightweight.** The name is Feather. Don't add heaviness unless it pulls real weight.
- **Legal.** Automating your own accounts on sites you have authorized access to = fine.
  Bypassing paywalls, faking captchas to access restricted content, or scraping at scale = not
  in scope. The line is: *agent acts as you, not as an attacker.*
- **Gradual.** Each layer adds value on its own. Don't gate everything on the hardest thing.

---

## The three features

### Feature 1: Stealth Stack
**Spec session:** Session 2 (next after this brief)
**Goal:** Make the Feather browser fingerprint indistinguishable from a real human browser.
**Target:** Tier C — sites with active bot detection (Cloudflare, LinkedIn, Instagram, DataDome).

#### What "fingerprint" means (plain English)
When your browser visits a site, it broadcasts dozens of signals about itself: screen size, GPU
renderer, fonts installed, how it draws pixels on a canvas, how it handles audio, what headers
it sends, and whether a robot flag is set. Bot detection systems collect all of these and build
a score. A single flag (`webdriver=true`) or an inconsistency (headless GPU, no fonts) can
trigger a block before you even log in.

#### What Feather already has (foundation — don't re-do)
- Real headful system Chromium (not headless, not bundled) — biggest single win
- `navigator.webdriver = false` via `spawnAndConnect` (CDP attach, not launch-with-flags)
- Human-warmed sessions (Cookie Mine) — real cookies = looks like a real user
- System Chromium binary = real GPU, real fonts, real canvas/WebGL fingerprint

#### What is missing (the spec session designs these)

| Layer | What it is | Rough cost |
|-------|-----------|------------|
| **1 — CDP surface minimization** | Don't enable CDP runtime events (e.g. `console.on`) that leak automation. Anchor confirmed this is a real detection tell. | Tiny — config change |
| **2 — Consistent environment** | Consistent viewport, timezone, locale, screen resolution. No inconsistencies that trigger "this isn't a real desktop." | Small |
| **3 — Behavioral timing** | Add small natural delays and jitter to actions (click, type, scroll). Synthetic events at machine speed are detectable. | Medium |
| **4 — Active fingerprint hardening** | Canvas noise injection, WebGL vendor/renderer consistency, font enumeration guard. Needed for the hardest sites. | Larger — verify impact |

#### Key design questions for the spec session
1. Should stealth levels be user-configurable (off / hygiene / full) or always-on?
2. Where does this live in Feather's architecture? (session launch config? a `StealthProfile`?)
3. How does Feather verify its own stealth? (self-test against a fingerprinting site)
4. What's the minimum viable configuration that passes LinkedIn / Instagram?
5. Does any layer conflict with Feather's performance or lightweight goals?

#### Research the spec session must do first
- Read `research/2026-06-05-anti-detection-self-test.md` (existing Feather self-test findings)
- Check `src/browser/modes.ts` — where Chromium is launched and spawn args are set
- Look up current fingerprinting test sites (coveryourtracks.eff.org, bot.sannysoft.com,
  arh.antoinevastel.com) to understand what the spec is testing against
- Verify: what CDP events does Feather currently enable? Which are necessary?

---

### Feature 2: Human-in-the-Loop MFA Handler
**Spec session:** Session 3
**Goal:** When an agent hits a login wall or MFA challenge, Feather pauses, notifies the user's
phone, the user approves, and the agent resumes — without ever seeing the raw credential.

#### What this solves
Insurance portals and banking apps often require 2FA (a code texted to your phone, a push
approval, or Face ID). The agent can't do this alone. Today, this kills the workflow. With this
feature: agent pauses → your phone buzzes → you tap approve → agent continues.

#### Types of MFA (the spec must decide which to handle)
- **TOTP** — Google Authenticator / Authy style (6-digit rotating code). Agent needs the code.
- **SMS OTP** — code texted to your phone. Agent needs the code.
- **Email OTP** — code sent to email. Feather may be able to read this automatically (Gmail MCP?).
- **Push notification approval** — app sends a yes/no prompt to your phone (Duo, Okta Verify).
  User taps yes. Agent just needs to wait.
- **Passkey / Face ID / WebAuthn** — browser triggers a biometric challenge. On desktop this
  delegates to the OS or a nearby device. May work naturally with a warmed session.
- **Hardware key** — YubiKey etc. Out of scope for now.

#### The phone notification question (the spec must pick one)
How does Feather reach the user's phone?
- **Telegram bot** — Feather already has Telegram in its plugin stack. User receives a message,
  replies with the code or taps a button. Low new infrastructure.
- **ntfy.sh** — self-hostable push notification service. Clean, no account needed. But requires
  the user to install the ntfy app.
- **Desktop notification only** — no phone, just a browser/OS notification on the same machine.
  Simpler, less useful if you're away from your desk.
- **Local web UI** — Feather opens a local page the user can check. Simple but not push.

#### Key design questions for the spec session
1. Which MFA types are in scope for v1?
2. What is the notification channel? (Telegram is already wired in — likely the right default)
3. How does the agent pause cleanly? (Feather already has events/SSE — does pause/resume exist?)
4. How does the user send back an OTP code? (Telegram reply? Local API call?)
5. What's the timeout? What happens if the user doesn't respond in time?
6. How does the agent know it *needs* MFA? (Page detection heuristics vs. explicit agent signal)

#### Research the spec session must do first
- Check `src/` for any existing pause/resume or human-handoff event primitives
- Check whether Telegram plugin is set up enough to send+receive messages (or just send)
- Look at Anchor's human-in-the-loop docs (§5 of the Anchor research) for the event coordination
  pattern — it's a good mental model even if the implementation differs
- Read `docs/specs/adr-0007*` for the event system design

---

### Feature 3: Identity Model
**Spec session:** Session 4
**Goal:** Formalize Feather's session/profile system into named "Identities" — a named object
that an agent attaches to, which carries the warmed session, the site associations, and a
reference to auth credentials (in the Vault) — without the agent ever holding raw passwords.

#### What this solves
Right now, Feather has profiles and workspaces, but there's no formal concept of "Roi's LinkedIn
identity" that an agent can request by name and start working in, pre-authenticated.

#### What Feather already has (don't re-do)
- Persistent profiles (XDG storage-isolated, per-workspace)
- Cookie Mine concept (human warms → agent reuses)
- Cookie isolation spike done (`research/2026-06-05-cookie-isolation-spike-findings.md`)
- CredentialsVault ADR (ADR-0008 — non-accepted, frozen but architecture stands)

#### Key design questions for the spec session
1. What is an Identity? (name + profile path + site list + optional Vault reference?)
2. How does an agent "attach" to an identity? (API call? config in the task?)
3. How does the user create and manage identities? (CLI? API endpoint? future GUI?)
4. How does this relate to existing workspaces and profiles? (is Identity a wrapper over Profile?)
5. Does this unfreeze Vault work (ADR-0008), or stay decoupled?
6. How does the MFA handler (Feature 2) connect to an Identity?

#### Research the spec session must do first
- Read `src/browser/` profile and workspace handling
- Read `docs/specs/adr-0008*` (CredentialsVault, frozen)
- Read `research/2026-06-05-cookie-isolation-spike-findings.md`
- Read Anchor §3b + §5 (Identity model + OmniConnect) from
  `research/2026-06-06-anchor-browser-product-reference.md`

---

## Build order and dependencies

```
Feature 1 (Stealth)        ← no dependencies; start here
    ↓
Feature 2 (MFA Handler)    ← benefits from Feature 1 being done (stealth gets you to the login
                              page; MFA handler gets you past it)
    ↓
Feature 3 (Identity Model) ← wraps Features 1+2 into a clean developer-facing abstraction
```

You can use each feature independently before the next is built. An agent with stealth but no
MFA handler still works on sites that don't require MFA. Gradual delivery is the intent.

---

## How spec sessions should be structured

Each spec session:
1. Read this brief + the relevant feature section above
2. Read the listed research files for that feature
3. Explore the relevant `src/` code (listed under "research the spec session must do first")
4. Brainstorm → design → write spec doc → commit
5. The spec becomes the implementation plan input

Spec file locations (to be written in the spec session):
- `docs/specs/2026-06-07-stealth-stack-design.md`
- `docs/specs/2026-06-07-mfa-handler-design.md`
- `docs/specs/2026-06-07-identity-model-design.md`

---

## What this is NOT

- Not a Phase 4b task. Phase 4b is the visual desktop shell. These features are Phase 5 input.
- Not a comparison with Anchor Browser. Anchor is reference only.
- Not implementing captcha bypass, paywall bypass, or mass scraping infrastructure.
- Not cloud infrastructure. Local only.
