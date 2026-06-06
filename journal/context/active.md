# Active — state owner (where we are, what's next)

This is the single owner of current state + next action. Task checklist → `journal/ops/tasks.md`;
destination → `ROADMAP.md`; history → `journal/log.md` + `ops/sessions/`.

## Now

**✅ AGENT BROWSING STACK — VISION + MASTER BRIEF (2026-06-07, `d3f4cc5`).**
Three-feature plan for Phase 5 locked. Master brief written: `docs/specs/2026-06-07-agent-browsing-stack-brief.md`.
- **Feature 1: Stealth Stack** — browser fingerprint indistinguishable from real human (Tier C sites)
- **Feature 2: MFA Handler** — phone notification → human approves → agent resumes
- **Feature 3: Identity Model** — named identities agents attach to (formalizes Cookie Mine)
- Build order: Stealth → MFA → Identity. One spec per session. Brief is the memory bridge.

**✅ BURNER DEMO FULLY WORKING (2026-06-06, `a2e9ec9`).**
- `npm run demo:hero` — single command; RAM-backed server, hero script, tears down on exit.
- Gating: needs a screen recorder for Niri/Wayland (Kooha or wf-recorder).

## Recommend next (two parallel tracks — pick one)

**▶ Track A — Record the Hero Demo.** Install Kooha or wf-recorder → `npm run demo:hero` while
screen-capturing → post to LinkedIn. Hero demo is complete and verified.

**▶ Track B — Start Stealth Stack spec.** Open `docs/specs/2026-06-07-agent-browsing-stack-brief.md`
(Feature 1 section), read the research pointers listed there, then brainstorm + design +
write `docs/specs/2026-06-07-stealth-stack-design.md`.

---

**(History — superseded.)**
**✅ CLAUDE-COUNCIL PLUGIN INSTALLED (2026-06-06).** `/claude-council:ask` + `/claude-council:status` live; `council-advisor` agent. Pending: run it on a real project question (needs API key).
**✅ HERO DEMO HARDENED + SUPERPOWERS INSTALLED (2026-06-06).** Login Continuity, burner profile isolation, `@obra/superpowers` extension.
