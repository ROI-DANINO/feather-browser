# Current Tasks — The Bot Gymnasium  (mouse-motion built; premise debunked 2026-06-27)

Checklist only. **Direction capture → `docs/specs/2026-06-24-gymnasium-and-harness-vision.md`.**
Mouse-motion design → `docs/specs/2026-06-26-gym-mouse-motion-design.md`; plan →
`docs/plans/2026-06-26-gym-mouse-motion.md`.
Front door → `feather.md`; live pointer → `journal/context/active.md`; machine pointer → `journal/ops/phase.md`.
Pre-mouse-motion task history archived → `journal/ops/archive/tasks-20260627-0009.md`.

**Direction (2026-06-24):** a **self-hosted bot gymnasium** — Roi's own arena/detectors/bots, watch them
learn to pass. **NOT** evasion on sites that don't want bots (stays cut). **Goals = learning / portfolio /
job / joy, not commercial.** Integrate the harness **by driving, not merging** (Feather = driven body).

## NEXT (Roi's call)
- [ ] **Validate the gym `BLOCKED` path live.** `abs.incolumitas.com` is DOWN now (502) — a headed
      `npm run dev` + `npm run gym:behavioral` should print **`BLOCKED`** (not FAIL) and cite the 502.
      Quick win; needs Roi's headed terminal.
- [ ] **Retry for a REAL motion score when `abs.incolumitas` recovers.** Only then can the verified
      `/move` cursor capability actually be graded by this detector. (Re-run the gym; read results.md.)
- [ ] **Step 2 — scoreboard wire:** connect fable's eval harness (`project-fable/evals/`) to score gym
      runs. Thin HTTP wire, not a merge — `gym/behavioral.ts` exports `feather`/`launchHeaded`/`move`/… to reuse.

## Shipped this session (2026-06-27) — on `dev`, NOT pushed (`fbea1d7..0576723`)
- [x] **Mouse-motion upgrade BUILT & VERIFIED** (final review READY TO MERGE): `src/browser/mouse-path.ts`
      (pure tunable curved+var-velocity generator) + `boundingBox` on `Actionable` + `MoveHandler` +
      `POST /v1/sessions/:id/move` (target XOR x,y) + gym wander/trial-log. TDD, subagent-driven
      (sonnet impl / opus review). Live `/move` smoke PASS. Delivers 156 trusted mousemove events (probe-verified).
- [x] **Premise debunked (systematic-debugging):** bot.incolumitas behavioral score is server-side on
      `abs.incolumitas.com`, **fully DOWN (502)** → UNSCORED is an outage, NOT "no cursor path" (5d.2 was wrong).
- [x] **Gym `BLOCKED` state shipped** (`0576723`): classify BLOCKED + detectorDown (pure); behavioral.ts
      `absDetectorDown()` (timeout-guarded, gated); results.md rows corrected. rd-verify PASS, 491 green.

## Shipped earlier — Gym Step 1 (2026-06-26, pushed `…5e2f037`)
- [x] **Gym Step 1 — behavioral diagnostic.** Top-level `gym/` (HTTP-only): `classify.ts` + `behavioral.ts`
      + `npm run gym:behavioral`. Blog 0026. Handoff `journal/ops/sessions/the-detector-that-couldnt-see-me-20260626-1935.md`.

## Parked behind the pivot (not deleted)
- [ ] **Real-account 2FA take** — prove the on-page Resume banner survives a real 2FA challenge **page**. Needs Roi driving.
- [ ] **(Roi, outside repo)** Rotate/abandon the leaked `roionly9` throwaway account.

## Later — PARKED (do not start)
- [ ] **Stealth on real sites (5d arc) — CUT 2026-06-24.** Distinct from the gym. Reopen only if a real
      site blocks a warmed session — then adopt a maintained engine, don't hand-patch.
- [ ] **Visual desktop shell (4b)** + the big stealth-agent / Hybrid vision — deferred.
- [ ] **fable→iroh merge** — decided on paper, NOT first. Only when the gym makes it worth it.
