# Current Tasks — Phase 4 → Phase 5 transition

Checklist only. Current state, recommendation, evidence → `journal/context/active.md` (owner).
Phase map + exit criteria → `ROADMAP.md`.

Active track: Hero demo ready to record. Agent Browsing Stack brief written — three spec sessions
planned (Stealth → MFA Handler → Identity Model). LinkedIn debut still pending.

---

## Track A — LinkedIn Debut (carry-over, unblocked by screen recorder)

- [ ] **Install screen recorder** (Kooha via Flatpak, or wf-recorder via DNF — Niri/Wayland)
- [ ] **Record hero demo** — `npm run demo:hero` while screen-capturing
- [ ] **Post to LinkedIn** — use `blog/0010-the-three-locks.md` LinkedIn cut (or write a
      debut-specific cut for the actual recording post)

## Track B — Agent Browsing Stack Spec Sessions

Master brief: `docs/specs/2026-06-07-agent-browsing-stack-brief.md`
Each session reads the brief section for its feature, does the listed research, then designs + writes.

- [ ] **Spec Session 1 — Stealth Stack**
  Read: brief Feature 1 section + `research/2026-06-05-anti-detection-self-test.md` + `src/browser/modes.ts`
  Output: `docs/specs/2026-06-07-stealth-stack-design.md`

- [ ] **Spec Session 2 — MFA Handler**
  Read: brief Feature 2 section + existing Feather event system + Telegram plugin capability
  Output: `docs/specs/2026-06-07-mfa-handler-design.md`

- [ ] **Spec Session 3 — Identity Model**
  Read: brief Feature 3 section + `docs/specs/adr-0008*` + cookie-isolation spike findings
  Output: `docs/specs/2026-06-07-identity-model-design.md`

## Parked — claude-council
- [ ] Set a provider API key (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `XAI_API_KEY`, or `PERPLEXITY_API_KEY`)
- [ ] `/claude-council:ask` — consult on a real project decision

## Parked — Phase 4b: Visual Desktop Shell (after debut)
- [ ] **Shell-stack joint call** — review ADR-0009 (GTK4-native + Casilda + headed-Chromium
      stopgap); gate on Casilda+Chromium latency/input spike; then start the GUI from
      `research/2026-06-05-phase4-gui-architecture-sketch.md`.
- [ ] (Open) **Cookie-isolation for real `primary`** — measure DBSC binding read-only first.
- [ ] (Open) **Vault/behavioral storage backend** — unfreeze ADR-0008 when ready.
- [ ] (Minor, Roi) **sudo Xvfb install** → finish 3-way anti-detection WebGL table.

## Parked — vault track (frozen; architecture stands)
- [ ] Spike A — SQLCipher feasibility (sudo-gated)
- [ ] Spike B — KeePassXC integration (sudo-gated)
