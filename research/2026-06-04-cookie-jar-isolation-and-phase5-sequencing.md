# Cookie-Jar Isolation Fork + "First Agent Action" Gate + Phase 5 Sequencing

Date: 2026-06-04
Status: Design exploration (not a decision). Pressure-tests what the Phase 4 foundation
must support before Phase 5 agents arrive. Lock the order at **Phase 5 Step 0**.

Emerged from a Phase-4 conversation: *"will the agents collect bad cookies?"* Connects the
Cookie Mine model (ADR-0003), bot-detection (the #1 Cookie Mine risk), and the parked
Phase-5 behavioral items in `journal/context/active.md`.

## The risk: a shared cookie jar means shared fate

- **Current Cookie Mine model:** human + agent share **one** persistent context. An agent tab
  is `context.newPage()` on the human's context, so it inherits the human's live login. Proven
  in Phase 4 Step 0.
- **Consequence:** anything an agent picks up lands in the **same jar** as the human's
  valuable logins. The trust context is only as clean as the agent's worst-behaved session.
- **Two kinds of "bad cookies":**
  1. **Junk / tracking** — harmless clutter; the human's own browsing already collects these.
  2. **Poisoning / "bot" flags** — the real danger. Bot-like agent behavior → the site sets a
     suspicious-session cookie or server-side flag → it attaches to the **human's** logged-in
     session → CAPTCHA wall / forced re-login / session invalidation. The agent's bad
     afternoon can log the human out and degrade the very foundation Phase 5 depends on.

## The fork: shared vs isolated agent context

- **Shared (today):** dead simple; the agent genuinely *is* the same session; no copy, no sync,
  passes device-binding checks. **But** pollution/poisoning risk.
- **Isolated:** the agent gets its own context; copy in the trust cookies it needs
  (`context.cookies()` → `context.addCookies()`). Protects the human login from agent
  poisoning. **But:**
  - Copied-cookie auth works for **most** sites; **uncertain for hardened ones (Google)** due to
    **Device-Bound Session Credentials (DBSC)** — the session is cryptographically bound to the
    originating browser instance; a copy may fail to refresh or get flagged.
  - Two simultaneous live sessions from cloned cookies can *itself* look like session theft → flag.
  - Cookies rotate → a one-time copy goes stale → needs continuous sync.
- **Why it's a FORK, not a setting:** the choice depends on an auth-model question only a spike
  can answer (*does copied Google auth survive binding without flagging?*). **Cheap to
  prototype** (~1 day of Playwright plumbing), **expensive/uncertain to make real on Google.**

## The gate rule (the Phase 4 → 5 seam)

- **Phase 4 has no agents** (roadmap: no agent panels / chat / LLM this phase). The poisoning
  risk is **dormant** — only the real human touches the jar, and a human has perfect behavioral
  fidelity by definition. A person collecting their own cookies cannot poison their own jar.
- The protection Phase 4 *does* need — the browser must not look automated — is **already built**:
  attach-don't-launch (`navigator.webdriver === false`), pre-shell Task #2, done.
- **THE GATE:** the *first time a Phase-5 agent acts in the real warm jar.* That action must NOT
  happen before (a) the behavioral-fidelity protections exist and (b) the shared-vs-isolated
  fork is decided.
- **Therefore:** run the cookie-isolation spike on the 4→5 seam, **before pre-shell Task #4
  (warmed Google session)** puts a real login into the jar.

## Phase 5 sequencing (three pillars)

Roi's framing — *"analyze how I browse → teach the agent to see and use sites"* — maps to the
parked Phase-5 items, refined:

1. **Learn from the human** — splits into two with different prerequisites:
   - a. **Behavioral signature** (mouse curves, typing cadence, dwell/scroll timing) —
     perception-**light**, raw-input capture, **can genuinely go first**. Feeds "act like Roi"
     anti-detection.
   - b. **Workflow learning** (what he was *accomplishing*) — perception-**heavy**, entangled
     with the perception layer; **not strictly before it.**
2. **Perception layer** — the agent *sees* and uses sites, including unfamiliar ones (North Star:
   true perception, **not a DOM stripper**).
3. **Active anti-bot self-detection** — the agent monitors its **own** behavior in real time and
   corrects (North Star). This **is** the poisoning protection — the "don't poison the jar" guard.

Likely order: capture signature (easy, first) → perception → workflow learning + agent action;
self-detection runs alongside as the guard. **Lock the detailed order at Phase 5 Step 0**
(research/plan), per project discipline + ADR-0005 (agent tooling deferred to the post-2026-07-28
spec). This conversation only pressure-tests that Phase 4's foundation supports it.

## Queued action

**Cookie-isolation spike** (before pre-shell Task #4): copy the warmed Google cookies into a
fresh isolated context; verify the agent stays authenticated **and** un-flagged. Outcome decides
shared-vs-isolated:
- *Survives* → isolation becomes a cheap, obvious win (protect the human login).
- *Rejected/flagged* → stay shared-jar + lean on good behavior (attach-don't-launch +
  behavioral fidelity), since the dangerous cookies come from agent *behavior*, not from sharing.
