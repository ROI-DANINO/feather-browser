# Current Tasks — The Bot Gymnasium  (2026-06-24 direction pivot)

Checklist only. **Direction capture → `docs/specs/2026-06-24-gymnasium-and-harness-vision.md`.**
Prior plan-of-record (reorientation) → `docs/specs/2026-06-24-reorientation-and-roadmap-restructure.md`.
Front door → `feather.md`; live pointer → `journal/context/active.md`; machine pointer → `journal/ops/phase.md`.
Pre-pivot task history archived → `journal/ops/archive/tasks-20260624-1217.md` (and `-0554.md`, `-reorientation.md`).

**Direction (2026-06-24 /stop):** Reorientation Phases 0–3 are DONE. The next chapter = a **self-hosted
bot gymnasium** — Roi's own arena/detectors/bots, watch them learn to pass. **NOT** evasion on sites
that don't want bots (stays cut). **Goals = learning / portfolio / job / joy, not commercial.**
Integrate the harness **by driving, not merging** (Feather = driven body). The gym IS the integration.

## NEXT — design Step 1 of the gym (the fun part; needs a brainstorm/design pass)
- [ ] **Design the smallest-alive gym:** one agent → Feather → ONE real detector → an honest PASS/FAIL
      Roi can *see* (reframes the 5d.2 "measure reality" work he loved). Decide: which detector first
      (cheap, real, internals-NOT-controlled, **can-fail**); what "pass" means; where it lives in the
      repo; keep it small + watchable. **Guardrail:** test against detectors Roi does NOT control;
      design tests that can fail — else the sandbox becomes rig-your-own-green-checkmarks.
- [ ] **Step 2 (after):** wire fable's eval harness (`project-fable/evals/`) as the scoreboard — the
      first real White Lotus ↔ Feather integration (a thin wire, not a merge).

## Parked behind the pivot (not deleted)
- [ ] **Real-account 2FA take** — prove the on-page Resume banner survives a real 2FA challenge **page**
      (no challenge fired same-machine in the Phase-3 recording). Needs Roi driving; test real / publish
      scratch. Pull forward only if the demo thread is reopened.
- [ ] **(Roi, outside repo)** Rotate/abandon the leaked `roionly9` throwaway account.

## Later — PARKED (do not start)
- [ ] **Stealth on real sites (5d arc) — CUT 2026-06-24.** Distinct from the gym (own sandbox = fine).
      Reopen only if a real site blocks a warmed session — then adopt a maintained engine, don't hand-patch.
- [ ] **Visual desktop shell (4b)** + the big stealth-agent / Hybrid vision — deferred.
- [ ] **fable→iroh merge** — decided on paper, NOT to be done first. Only when the gym makes it worth it.

## Shipped (history — detail in archive)
- [x] **"My Own Gym" direction pivot (2026-06-24, no code)** — refuted the stealth/Firefox remake with a
      verified research pass; chose the bot gymnasium; mapped the one-harness shape. Blog 0025. Handoff
      `journal/ops/sessions/my-own-gym-20260624-1217.md`. Capture
      `docs/specs/2026-06-24-gymnasium-and-harness-vision.md`.
- [x] **Reorientation Phases 0–3 (2026-06-24)** — Phase 0 secret guard · Phase 1 Harden (`06cd2e8`) ·
      Phase 2 OSS envelope (`5c5f0fa..182b4e0`) · Phase 3 Show it off (`4e0ad81..8aedbbe`). Blogs 0022–0024.
- [x] **v1 built & proven** + **v2 safety spine** (Gate A + 5a Identity + 5b MFA + await-human), proven
      live through a real Instagram login wall (2026-06-23).
