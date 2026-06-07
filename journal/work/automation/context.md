# Automation Desk

Use this desk for Playwright integration, agent control, permission boundaries, replay/debug tooling, and profile isolation.

## Agent Browsing Stack (Phase 5 input — design facts)

Three composable features, build order **Stealth → MFA → Identity**. Specs in `docs/specs/2026-06-07-*`.
Brief: `docs/specs/2026-06-07-agent-browsing-stack-brief.md`.

**Durable design conventions established (apply to all agent-runtime work):**
- **Stealth mode model:** `secure` (default) / `assisted`, keyed on *who generates input* — agent →
  secure (needs human-shaped input synthesis); human driving → assisted (real input, no synthesis).
  Fingerprint layers always-on in both. **Mode is mutable** (human takeover = secure→assisted→secure).
- **Verify, don't spoof:** stealth verifies the real fingerprint and keeps it from leaking; it does NOT
  fake canvas/fonts (tampering is itself a tell). Feather's real anti-detection asset is the
  architecture (real headful system Chromium on the user's real IP), not a stealth module.
- **`needs-confirmation` result-type convention:** model "needs a human decision" as a first-class,
  pollable result/status — NOT a thrown control-flow exception. (Established for MFA; reused by Identity.)
- **Human-in-the-loop (MFA):** agent supplies the target field; **Feather types the code; the agent
  never sees the raw code** (mirrors the CredentialsVault philosophy). Push approval = no typing (user
  taps phone + confirms on a local page). Notification: local page in v1, Telegram is a designed-in seam.
- **Legal line (hard):** the agent acts as the authorized user, never as an attacker — no captcha bypass,
  no paywall bypass, no scrape-at-scale. Walls get handed to the human, never auto-solved.

**Plans carry no phase/milestone numbers** — a roadmap re-sequencing pass (after all 3 plans exist)
assigns them and cuts tasks into work sessions.
