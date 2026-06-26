# Current Tasks — The Bot Gymnasium  (Step 1 SHIPPED 2026-06-26)

Checklist only. **Direction capture → `docs/specs/2026-06-24-gymnasium-and-harness-vision.md`.**
Step 1 design → `docs/specs/2026-06-26-gym-step1-behavioral-diagnostic-design.md`; plan →
`docs/plans/2026-06-26-gym-step1-behavioral-diagnostic.md`.
Front door → `feather.md`; live pointer → `journal/context/active.md`; machine pointer → `journal/ops/phase.md`.
Pre-Step-1 task history archived → `journal/ops/archive/tasks-20260626-1935.md`.

**Direction (2026-06-24):** a **self-hosted bot gymnasium** — Roi's own arena/detectors/bots, watch them
learn to pass. **NOT** evasion on sites that don't want bots (stays cut). **Goals = learning / portfolio /
job / joy, not commercial.** Integrate the harness **by driving, not merging** (Feather = driven body).

## NEXT — Step 2 + the upgrade Step 1 surfaced
- [ ] **Step 2 — scoreboard wire:** connect fable's eval harness (`project-fable/evals/`) to score gym
      runs. The first real White Lotus ↔ Feather integration — a **thin HTTP wire, not a merge**. The
      gym's client (`gym/behavioral.ts` exports `feather`/`launchHeaded`/`navigate`/`snapshot`/…) is
      built to be reused. **Guardrail holds:** detectors Roi does NOT control; tests that can fail.
- [ ] **Mouse-motion upgrade (the thing Step 1 surfaced):** clicks/types teleport → no cursor path →
      `bot.incolumitas` can't score Feather (UNSCORED→FAIL). Add real cursor trajectory so the score
      computes (flips UNSCORED → a real number = the gym's first live dial to watch climb). Before or
      after Step 2 — Roi's call. (Ties to roadmap 5d.3/5d.4 mouse-motion synthesis via CDP `Input.dispatchMouseEvent`.)

## Shipped Step 1 (2026-06-26)
- [x] **Gym Step 1 — behavioral diagnostic BUILT & SHIPPED.** Top-level `gym/` (HTTP client, never
      imports `src/`): `classify.ts` pure+tested ("no score = FAIL"), `behavioral.ts` headed drive of
      `bot.incolumitas.com` → parse `Your Behavioral Score:` from snapshot → classify → verdict-labelled
      screenshot → row in `gym/results.md`; `npm run gym:behavioral`. First live run **`UNSCORED → FAIL`**
      (genuine, field-verified vs `src/`). 476/476, typecheck clean. Pushed `origin/dev` `…5e2f037`.
      Blog 0026. Handoff `journal/ops/sessions/the-detector-that-couldnt-see-me-20260626-1935.md`.

## Parked behind the pivot (not deleted)
- [ ] **Real-account 2FA take** — prove the on-page Resume banner survives a real 2FA challenge **page**
      (no challenge fired same-machine in the Phase-3 recording). Needs Roi driving.
- [ ] **(Roi, outside repo)** Rotate/abandon the leaked `roionly9` throwaway account.

## Later — PARKED (do not start)
- [ ] **Stealth on real sites (5d arc) — CUT 2026-06-24.** Distinct from the gym (own sandbox = fine).
      Reopen only if a real site blocks a warmed session — then adopt a maintained engine, don't hand-patch.
- [ ] **Visual desktop shell (4b)** + the big stealth-agent / Hybrid vision — deferred.
- [ ] **fable→iroh merge** — decided on paper, NOT to be done first. Only when the gym makes it worth it.
