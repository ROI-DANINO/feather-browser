# Current Tasks — Phase 4 → Phase 5 transition

Checklist only. Current state, recommendation, evidence → `journal/context/active.md` (owner).
Phase map + exit criteria → `ROADMAP.md`.

Active track: Agent Browsing Stack — 2 of 3 spec sessions done (Stealth ✅, MFA ✅). Next: Identity
Model spec, then the roadmap re-sequencing pass (incorporating integration research findings).
Hero demo ready to record; LinkedIn debut still pending.

---

## Track A — LinkedIn Debut (carry-over, unblocked by screen recorder)

- [ ] **Install screen recorder** (Kooha via Flatpak, or wf-recorder via DNF — Niri/Wayland)
- [ ] **Record hero demo** — `npm run demo:hero` while screen-capturing
- [ ] **Post to LinkedIn** — use `blog/0010-the-three-locks.md` LinkedIn cut (or write a
      debut-specific cut for the actual recording post)

## Track B — Agent Browsing Stack Spec Sessions

Master brief: `docs/specs/2026-06-07-agent-browsing-stack-brief.md`
Each session reads the brief section for its feature, does the listed research, then designs + writes.

- [x] **Spec Session 1 — Stealth Stack** — design + plan written AND Opus-council reviewed (rev 2).
  Output: `docs/specs/2026-06-07-stealth-stack-{design,plan}.md`; audit: `research/2026-06-07-council-audit-stealth-stack.md`.
  Decided secure/assisted mode model; cut font guard + classification gate; kinematic input = spike-first.

- [x] **Spec Session 2 — MFA Handler** — design + plan written (14 TDD tasks, composable).
  Output: `docs/specs/2026-06-07-mfa-handler-{design,plan}.md`.
  Scope TOTP+SMS+push; Approach B (Feather types code, agent never sees it); local page v1 + Telegram seam;
  found Telegram NOT in codebase + no pause/resume primitives (uses SSE bus + setStealthMode seam).

- [ ] **Spec Session 3 — Identity Model** ← NEXT
  Read: brief Feature 3 section + `docs/specs/adr-0008*` + cookie-isolation spike findings +
  the Stealth/MFA seams (`StealthConfig`, `MfaConfig`/`MfaChallengeManager`, needs-confirmation pattern)
  Output: `docs/specs/2026-06-07-identity-model-design.md`

- [ ] **Roadmap re-sequencing pass** (after Feature 3) — assign phases/milestones to the 3 plans,
  cut tasks into work sessions. **Incorporate integration research findings** when assigning tasks:
  - Stealth Sprint Task 1: evaluate `fingerprint-generator` + `fingerprint-injector` + `idcac-playwright` (npm, no AGPL)
  - Add: expose CDP/WS endpoint in `LaunchSession` response (unlocks Browser Use + Crawl4AI interop, near-zero effort)
  - Add: port Crawl4AI's `DefaultMarkdownGenerator` to TypeScript → `markdown` output in snapshot command
  - Add (Phase 5 gate): `FeatherBrowserTool` (~200 lines Python) once MCP surface is built
  - Research file: `research/2026-06-07-open-source-integration-research.md`

## Track C — Social Research Use Cases (inbox seeds, unprocessed)

- [ ] **Process inbox files** — `journal/raw/_inbox/2026-06-07-social-research-{agent,mode}-usecase.md`
  Route to product desk or Identity Model spec as relevant. Read and archive.

## Parked — claude-council
- [x] `/claude-council:ask` — consulted on the Stealth Stack design+plan (Opus 4.8 + Gemini CLI; 2026-06-07). Claude provider patched to honor `CLAUDE_MODEL` (runs Opus, not stale Sonnet).
- [ ] (Optional) Set `GEMINI_API_KEY` quota / `OPENAI_API_KEY` etc. — Gemini API quota-exceeded, Codex/GPT-4o CLI errored this run.

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
