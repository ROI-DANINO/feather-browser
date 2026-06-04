# Session Insights — 2026-06-04 (real-site Cookie Mine + behavioral-fidelity vision)

Vision intake from the Phase 4 Step 0 spike session. NOT yet roadmap/ADR decisions.
Framing note (per `feather-strategic-implications`): describe all of this as **user-authorized
continuity / human-approved automation** — avoid "stealth / bot bypass" language.

## Context that triggered these
Proved this session: **attach-don't-launch** (launch Chromium normally, connect over CDP →
`navigator.webdriver=false`) beat Google + Cloudflare bot walls; the agent logged into Roi's
real ChatGPT via the saved session and **sent a "hello world" message** as him. Bot-detection
is the #1 risk to the Cookie Mine (see [[adr-0007]] / `project_phase4_sequencing`).

## Insight 1 — Learned behavioral fidelity (act exactly like me)
Agents should act on the web with the **human's own interaction signature**, not generic
robotic input: mouse-movement paths, typing tempo/rhythm, scroll behavior, dwell times, etc.
Learn this by **observing Roi's real usage**, build a per-user profile, and replay it so
agent actions are indistinguishable from his own. Purpose: legitimate continuity (the agent
acts as *me*, on *my* accounts), and it directly hardens against false bot-flagging. Phase 5
(agent layer). Connects to behavioral-biometrics detection vectors.

## Insight 2 — Agent observes the human (on request) to understand & later teach
Roi wants the agent to be able to **see what he's doing on screen when he asks** (the way he
screenshots Claude so it sees what he saw) — to understand events in context, and in future
to **learn specific workflows from demonstration** (human does it once → agent learns the
recipe). Screen perception + demonstration-to-recipe capture.

## Insight 3 — Detection self-emulation (red-team our own continuity)
Feather should be able to **model the bot-identification techniques sites use** (fingerprint
checks, behavioral signals, etc.) and run them against its own sessions to **find weak spots**
and verify that human-authorized sessions stay indistinguishable. Framed as a **defensive
self-test**, security-first.

## Next-session research task (security is HIGHEST priority)
Research **high-quality, highly-secure open-source password managers** and a **secure
database/storage format** for keeping credentials/secrets safe. Feeds the future
**credentials vault** (Phase 5 milestone). Evaluate threat model, encryption-at-rest, key
management, auditability, license.
