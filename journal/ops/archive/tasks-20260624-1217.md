# Current Tasks — v1 Ship & Adopt  (2026-06-24 reorientation)

Checklist only. **Plan of record → `docs/specs/2026-06-24-reorientation-and-roadmap-restructure.md`.**
Front door → `feather.md`; phase index → `ROADMAP.md`; live pointer → `journal/context/active.md`.
Pre-2026-06-24 history (v1 build, Gate A, 5a/5b, the full v2/5d stealth detail) is archived →
`journal/ops/archive/tasks-20260624-reorientation.md`. Phase 0–2 checklists archived →
`journal/ops/archive/tasks-20260624-0554.md`.

**Sequencing (Roi, 2026-06-24 /stop):** harden first → then OSS envelope → a NEW stronger demo LAST.

**Reorientation Phases 0–3 are COMPLETE (2026-06-24).** Phase 0 (secret guard; Roi's account rotation
still outside-repo) · Phase 1 Harden (`06cd2e8`) · Phase 2 OSS envelope (`5c5f0fa..182b4e0`) · Phase 3
Show it off (`4e0ad81..8aedbbe`). **Stealth is CUT.**

## NEXT — real-account 2FA take (needs Roi driving)
- [ ] Run `npm run demo:hero` on Roi's **actual** Google account (expected to trigger phone-tap
      verification) to prove the on-page Resume banner survives a real **2FA challenge page** — the one
      thing the Phase-3 recording did NOT exercise (no challenge fired same-machine). Verify via session
      log + frames; update `docs/v1_wrap/hero-demo-v2/gate-report.md`. **Test real / publish scratch**
      (public repo — don't commit a take showing the real inbox).
- [ ] (Optional) Launch-grade re-record: opaque terminal, calm/solid background, full terminal on
      screen, start recorder after any prior run finishes. Gaps listed in `scripts/demo/RECORDING.md`.

## Phase 0 — Stop the bleed (security) — residual
- [ ] **(Roi, outside repo)** Rotate/abandon the leaked `roionly9` throwaway account; discard warmed
      cookies tied to it. History NOT scrubbed (Roi's call — throwaway, low blast radius).

## Later — PARKED (do not start)
- [ ] **Stealth + Behavior-Mine arc (5d) — CUT 2026-06-24.** Reopen ONLY if a real site blocks a warmed
      session — and then adopt a maintained engine, don't hand-patch. Detail archived →
      `journal/ops/archive/tasks-20260624-reorientation.md`.
- [ ] **Visual desktop shell (4b)** + the big stealth-agent / Hybrid vision — deferred (funded-specialist
      territory; not a near-term solo build).

## Shipped (history — detail in archive)
- [x] **Phase 3 Show it off (2026-06-24, `4e0ad81..8aedbbe`)** — hero demo v2: `continuity.ts` console-poll
      → `await-human` banner handoff (visible on camera); `feather.md` per-version "Done when" column; live
      gate PASS (narrowed); `demo-hero-mfa.mp4` (~49s/2.4M); `RECORDING.md` + `gate-report.md`. Blog 0024.
      Handoff `journal/ops/sessions/the-demo-that-shows-its-hands-20260624-0554.md`.
- [x] **Phase 2 OSS envelope (2026-06-24, `5c5f0fa..182b4e0`)** — clone→fail fix + CI badge + showcase
      number + CONTRIBUTING + HTTP API `/v1` declared + curl examples. Blog 0024 (folded).
- [x] **Phase 1 Harden (2026-06-24, `06cd2e8`)** — 1a security fixes + 1b test gaps + cookie-jar perms +
      local MFA resolve-banner. Blog 0023.
- [x] **Reorientation (2026-06-24)** — hybrid target, stealth cut, plan of record, secret guard. Blog 0022.
- [x] **v1 built & proven** + **v2 safety spine** (Gate A + 5a Identity + 5b MFA + await-human), proven
      live through a real Instagram login wall (2026-06-23).
