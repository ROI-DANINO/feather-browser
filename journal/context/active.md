# Active — state owner (where we are, what's next)

This is the single owner of current state + next action. Task checklist → `journal/ops/tasks.md`;
destination → `ROADMAP.md`; history → `journal/log.md` + `ops/sessions/`.

## Now

**✅ AGENT BROWSING STACK — 2 of 3 SPEC SESSIONS DONE (2026-06-07).** Build order: **Stealth ✅ → MFA ✅ → Identity (next).** Brief: `docs/specs/2026-06-07-agent-browsing-stack-brief.md`. Plans carry no phase numbers (roadmap pass assigns them later).

**✅ FEATURE 1 — STEALTH STACK — spec+plan+Opus council, rev 2 (commits `bb3c065`/`8a46065`, unpushed).**
- Docs: `docs/specs/2026-06-07-stealth-stack-{design,plan}.md`. Audit: `research/2026-06-07-council-audit-stealth-stack.md`.
- **Mode model: secure (default) / assisted**, keyed on who generates input; fingerprint layers always-on; mode mutable (pre-wires MFA). Cut font guard + pre-click sleep + classification gate. Kinematic input = spike-first.

**✅ FEATURE 2 — MFA HANDLER — spec+plan (this session, committed; see log).**
- Docs: `docs/specs/2026-06-07-mfa-handler-{design,plan}.md` (14 TDD tasks, composable).
- Scope: TOTP + SMS + **push** (Google tap-Yes/Duo/Okta). **Approach B:** agent passes the target, Feather types the code, agent never sees it. Push = no typing (tap phone + Done button). Notification: local page in v1; Telegram = designed-in seam (env vars). Stealth tie-in: create→assisted, resolve/expire→secure.

**Nothing built yet** — deliberate; all 3 plans get written before the roadmap re-sequencing pass.

**✅ BURNER DEMO FULLY WORKING (2026-06-06, `a2e9ec9`).** `npm run demo:hero` — gating: needs a Niri/Wayland screen recorder (Kooha / wf-recorder).

## Recommend next

**▶ Feature 3 — Identity Model spec session.** Brainstorm → design → plan (same composable structure).
Read brief Feature 3 section + `docs/specs/adr-0008*` (CredentialsVault, frozen) +
`research/2026-06-05-cookie-isolation-spike-findings.md` + the seams it plugs into (`StealthConfig`/`StealthMode`,
`MfaConfig`/`MfaChallengeManager`, the `needs-confirmation` pattern). Output `docs/specs/2026-06-07-identity-model-design.md`.

After Feature 3: the **roadmap re-sequencing pass** (assign phases/milestones, cut all 3 plans into
work sessions). Alternatives: run the **kinematic input spike** (stealth plan Task 11), or **push `dev`**
(commits local-only). Hero-demo LinkedIn debut still parked on a screen recorder install.

---

**(History — superseded.)**
**✅ CLAUDE-COUNCIL PLUGIN INSTALLED (2026-06-06).** `/claude-council:ask` + `/claude-council:status` live; `council-advisor` agent. Pending: run it on a real project question (needs API key).
**✅ HERO DEMO HARDENED + SUPERPOWERS INSTALLED (2026-06-06).** Login Continuity, burner profile isolation, `@obra/superpowers` extension.
