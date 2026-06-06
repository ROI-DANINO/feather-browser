# Session — Agent Browsing Stack Brainstorm
**Date:** 2026-06-07
**Branch:** dev
**Focus:** Inbox processing + Anchor Browser research review + Agent Browsing Stack brainstorming

## Done

### Inbox cleared
- `journal/raw/_inbox/anchor-browser-research-brief-2026-06-06.md` — research was already
  complete in a prior session (`research/2026-06-06-anchor-browser-product-reference.md`).
  Archived the inbox file to `journal/raw/archive/` and committed (`6c87f46`).

### Anchor Browser research reviewed with Roi
Summarized the 13-section research report in plain English:
- Architecture validation: Anchor uses the same CDP-attach-to-real-headful-Chromium pattern
  Feather already uses. Cloud vs. local is deployment, not architecture.
- Cookie Mine parallel: Anchor's Identity/OmniConnect model = same separation Feather wants
  (human logs in, agent inherits, agent never holds raw creds).
- Stealth reality: most claims are marketing. Two concrete ideas: don't enable CDP runtime events
  you don't need; Web-Bot-Auth (declare as verified bot) as the sustainable long-term posture.
- Determinism layer ("Web Action Cache"): plan once with AI, replay without AI forever. Most
  interesting product idea for Phase 5+.
- 5 open questions answered by Roi (summarized below).

### Roi's answers to Anchor research open questions
1. Determinism layer → "sounds good" (worth a future spike)
2. Stealth depth → "as deep as legal"
3. Web-Bot-Auth → "we can discuss it"
4. Identity model → "don't understand but if it's a good idea we can consider"
5. Scope → "this may help shape our roadmap for the better"

### Agent Browsing Stack brainstorming — full session
Vision locked: agents that work on **every site** without getting blocked.
Target: Tier C (LinkedIn, Instagram, insurance portals — active bot detection).
Constraints: local-first, lightweight, legal (automating own accounts).

Three features agreed, in order:
1. **Stealth Stack** — browser fingerprint indistinguishable from real human
2. **MFA Handler** — phone notification (Telegram likely) → human approves → agent resumes
3. **Identity Model** — named identities agents attach to (formalizes Cookie Mine)

Session structure decided: one spec per session, master brief as the memory bridge.

### Master brief written and committed
`docs/specs/2026-06-07-agent-browsing-stack-brief.md` (`d3f4cc5`)
Contains: vision, constraints, per-feature research pointers, design questions, build order.

### Blog 0010 written
`blog/0010-the-three-locks.md` — hero's journey of studying Anchor → finding the foundation
already right → identifying the three locks (fingerprint, login wall, identity).

## Unfinished / carry-over
- **Hero demo recording** — still needs a screen recorder (Kooha / wf-recorder for Niri/Wayland).
  `npm run demo:hero` is ready to run.
- **LinkedIn debut** — depends on recording.
- **claude-council** — `/claude-council:ask` not yet run on a real project question (needs an API key).
- **Three spec sessions** — planned in the brief; not started.

## Next concrete action
Two parallel tracks:
- **Track A (recording):** Install screen recorder → `npm run demo:hero` while recording → LinkedIn.
- **Track B (spec):** Start Stealth Stack spec session — reads the brief, researches existing
  code + anti-detection self-test findings, designs, writes `docs/specs/2026-06-07-stealth-stack-design.md`.

## Key decisions
- Stealth goal: "as deep as legal" — agent looks like the person who owns the session, not an attacker.
- MFA handler: agent pauses → phone notification → human approves → agent resumes.
  Telegram as likely notification channel (already in plugin stack).
- Build order: Stealth → MFA Handler → Identity Model.
- One spec per session; master brief is the shared memory.
- Local-first for all three (no cloud relay; each user owns their own sessions and phone).

## Roi quotes
- "i mainly want to be able to let my agents work in every kind of site without getting blocked"
- "i also want to design it as lightweight as we can, hence the name 'feather-browser'"
- "i want to go as deep as legal" (on stealth)
- "can be built gradually"
- "this may help shape our roadmap for the better"
