# Session — Agent Browsing Stack spec sessions: Stealth (Feature 1) + MFA Handler (Feature 2)

**Date:** 2026-06-07 (covers two chats; Feature 1 folded in from `next.md`)
**Phase:** Phase 4 → Phase 5 input (Agent Browsing Stack)
**Desks:** product (feature scoping) + automation (agent-runtime design)

---

## Done

### Feature 1 — Stealth Stack (folded in from `next.md`, chat 1, ~03:12)
- Processed inbox: archived `2026-06-06-council-audit-phase-4b.md` → `journal/raw/archive/`.
- **Stealth Stack fully spec'd + planned + Opus-council reviewed (rev 2).** Docs:
  - `docs/specs/2026-06-07-stealth-stack-design.md` (rev 2)
  - `docs/specs/2026-06-07-stealth-stack-plan.md` (rev 2, 12 TDD tasks)
- Ran the **Opus council** (`/claude-council:ask`) on the rev-1 design+plan. Opus 4.8 + Gemini CLI
  converged hard (Gemini API quota-exceeded, Codex/GPT-4o errored → 2-of-4). Audit:
  `research/2026-06-07-council-audit-stealth-stack.md`.
- Rewrote both docs to rev 2 folding in all council findings (792 ins / 1151 del — smaller + stronger).
- Fixed the council plugin's Claude provider to honor `CLAUDE_MODEL` (`--model` flag) → runs Opus.
- Commits: `bb3c065` (rev-1 plan), `8a46065` (rev-2 spec+plan+audit+council fix). Earlier: `1bcb039`,
  `172ea29` (rev-1 spec + review fixes).

### Feature 2 — MFA Handler (this chat, ~03:12–03:52)
- Explored `src/` for human-handoff primitives. **Findings:** no pause/resume exists; **Telegram is NOT
  in the codebase** (the brief's "already wired in" was aspirational); the SSE bus
  (`logs/bus.ts` → `logs/logger.ts` → `transport/sse.ts`) and the stealth `setStealthMode` seam are
  the real integration points.
- Brainstormed → designed → planned the MFA Handler. Two docs (uncommitted as of this stop —
  committed in step 13):
  - `docs/specs/2026-06-07-mfa-handler-design.md`
  - `docs/specs/2026-06-07-mfa-handler-plan.md` (14 TDD tasks, composable, no phase numbers)
- **Folded push approval into scope** mid-session after Roi's Google-usage insight (it was initially
  deferred). v1 now covers all three common challenge types.

---

## Decisions

### Stealth (rev 2, carried)
- Mode model = **secure (default) / assisted**, keyed on *who generates input* (agent → secure;
  human driving → assisted). Fingerprint layers always-on in both. Mode is **mutable** (pre-wires MFA).
- Secure-by-default deletes the rev-1 classification gate / soft-block / autonomous flag / auto-upgrade.
- Cut the **font guard** (monkeypatch = bot tell) and the **pre-click sleep**. v1 behavioral = typing
  cadence only. Kinematic mouse/typing = **spike first, then build**.
- "Needs human decision" = first-class result type, not a thrown exception (convention for MFA).

### MFA Handler (this session)
- **Notification:** local web page first; **Telegram is a designed-in seam** (env vars
  `FEATHER_TELEGRAM_BOT_TOKEN`/`_CHAT_ID`), not built in v1. v1 logs the local URL to the console.
- **Scope:** TOTP + SMS (code-entry) + **push** (Google tap-Yes / Duo / Okta). Email OTP, passkeys,
  hardware keys = out.
- **Approach B (Feather types the code):** the agent passes the target field in the challenge; Feather
  types the code into it. **Agent never sees the raw code.** (Roi pushed "why not b?" — B won: simpler
  agent loop + code never leaves Feather, mirroring the Vault philosophy.)
- **Push does no typing** — user taps phone, the page advances, user clicks one "Done" button on the
  local page. Keeps Feather free of DOM-change heuristics (consistent with "agent supplies the target").
- **Stealth tie-in:** challenge created → `setStealthMode("assisted")`; resolved/expired →
  `setStealthMode("secure")`. Reuses Feature 1's mutable mode + the `needs-confirmation` result-type
  convention.
- Two spec→plan reconciliations: `localUrl` canonicalized to `${baseUrl}/v1/mfa/<id>`; added a fifth
  small file `src/mfa/config.ts` (env loader) beyond the spec's "four files."

### Structural (both)
- Plans carry **no phase/milestone numbers** — deferred to the roadmap re-sequencing pass (Roi's
  structure: plan all 3 → re-sequence → assign tasks to sessions; repeat the assign step each phase end).
- The MFA plan's work-session grouping isolates pure units (Tasks 1–5, no stealth dependency) from
  stealth-dependent units (Tasks 6–10) — so the front half can be built before Stealth lands.

---

## Unfinished / open threads
- **Feature 3 — Identity Model** spec session still to do (last of the three).
- **Roadmap re-sequencing pass** pending (after all 3 plans exist) — assign phases/milestones, cut
  tasks into work sessions.
- **Nothing built yet** — all three plans get written before the roadmap pass (deliberate).
- **Kinematic input spike** (Stealth plan Task 11, highest-value gap, independent) still pending.
- **`dev` has unpushed commits** — `bb3c065`, `8a46065` (Stealth), plus this session's MFA docs commit.
- (Parked) Hero-demo LinkedIn debut — blocked on a Niri/Wayland screen recorder (Kooha / wf-recorder).

## Next concrete action
Start **Feature 3 — Identity Model** spec session (brainstorm → design → plan, same composable
structure). Read brief Feature 3 section + `docs/specs/adr-0008*` (CredentialsVault, frozen) +
`research/2026-06-05-cookie-isolation-spike-findings.md` + the seams this plugs into
(`StealthConfig`/`StealthMode`, `MfaConfig`/`MfaChallengeManager`, the `needs-confirmation` pattern).
Output `docs/specs/2026-06-07-identity-model-design.md`.
Alternatives: run the kinematic spike, or push `dev`.

## Ideas
- After Identity is spec'd, the roadmap re-sequencing pass is the natural next milestone — it turns the
  three composable plans into an ordered, session-sized build backlog.
- Push approval being the *simplest* type (just a wait + confirm) makes it the cheapest integration-test
  path — the MFA plan exploits this (push happy-path test needs no real Chromium).

## Verbatim Roi quotes
- "telegram when configured, local page as fallback ... well start with local page"
- "why not b?"
- "a lot of the sites i connect with google, accounts that doesnt have google are a lot of time with
  authenticator or an sms. so this automaticly isnt in scope now? where will this feature comes handy?"
- "yes, fold push approval into the spec"
- "well /stop for tonight bro thanx"
