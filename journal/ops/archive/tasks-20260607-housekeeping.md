# Current Tasks — Phase 4 → Phase 5 transition

Checklist only. Current state, recommendation, evidence → `journal/context/active.md` (owner).
Phase map + exit criteria → `ROADMAP.md`.

Active track: Agent Browsing Stack — ALL 3 spec sessions done (Stealth ✅, MFA ✅, Identity ✅).
Next: roadmap re-sequencing pass (assign phases/milestones to the 3 plans, incorporate integration
research findings). Hero demo ready to record; LinkedIn debut still pending.

---

## Track A — LinkedIn Debut (carry-over, unblocked by screen recorder)

- [ ] **Install screen recorder** (Kooha via Flatpak, or wf-recorder via DNF — Niri/Wayland)
- [ ] **Record hero demo** — `npm run demo:hero` while screen-capturing
- [ ] **Post to LinkedIn** — use `blog/0010-the-three-locks.md` LinkedIn cut (or write a
      debut-specific cut for the actual recording post)

## Track B — Agent Browsing Stack

Master brief: `docs/specs/2026-06-07-agent-browsing-stack-brief.md`

- [x] **Spec Session 1 — Stealth Stack** — design + plan rev 2, Opus-council reviewed.
  Output: `docs/specs/2026-06-07-stealth-stack-{design,plan}.md`; audit: `research/2026-06-07-council-audit-stealth-stack.md`.

- [x] **Spec Session 2 — MFA Handler** — design + plan (14 TDD tasks, composable).
  Output: `docs/specs/2026-06-07-mfa-handler-{design,plan}.md`.

- [x] **Spec Session 3 — Identity Model** — design rev 2 + plan (13 TDD tasks, self-contained).
  Output: `docs/specs/2026-06-07-identity-model-{design,plan}.md`.
  Decisions: event bus for warm-status; PATCH omitted v1; Identity ID = workspaceId; vaultRef dormant.

- [ ] **Roadmap re-sequencing pass** ← NEXT
  Assign phases/milestones to all 3 plans; cut into work sessions.
  **Incorporate integration research findings** (constraint block in active.md):
  - Stealth Sprint Task 1: evaluate `fingerprint-generator` + `fingerprint-injector` + `idcac-playwright`
  - Add: expose CDP/WS endpoint in `LaunchSession` response
  - Add: port Crawl4AI's `DefaultMarkdownGenerator` → `markdown` output in snapshot command
  - Add (Phase 5 gate): `FeatherBrowserTool` (~200 lines Python) once MCP surface is built
  - Research file: `research/2026-06-07-open-source-integration-research.md`

- [ ] **Push dev** — Stealth+MFA spec commits (`bb3c065`, `8a46065`) are local-only on dev. Push before or during re-sequencing pass.

## Track C — Social Research Use Cases (inbox seeds, unprocessed)

- [ ] **Process inbox files** — `journal/raw/_inbox/2026-06-07-social-research-{agent,mode}-usecase.md`
  Route to product desk or Identity Model spec as relevant. Read and archive.

## Parked — claude-council
- [x] `/claude-council:ask` — consulted on Stealth Stack (Opus 4.8 + Gemini CLI; 2026-06-07).
- [ ] (Optional) Set `GEMINI_API_KEY` quota / `OPENAI_API_KEY` etc. — Gemini quota-exceeded last run.

## Parked — Phase 4b: Visual Desktop Shell (after debut)
- [ ] **Shell-stack joint call** — review ADR-0009; gate on Casilda+Chromium latency/input spike.
- [ ] (Open) **Cookie-isolation for real `primary`** — measure DBSC binding read-only first.
- [ ] (Open) **Vault/behavioral storage backend** — unfreeze ADR-0008 when Spikes A/B clear.
- [ ] (Minor, Roi) **sudo Xvfb install** → finish 3-way anti-detection WebGL table.

## Parked — vault track (frozen; architecture stands)
- [ ] Spike A — SQLCipher feasibility (sudo-gated)
- [ ] Spike B — KeePassXC integration (sudo-gated)
