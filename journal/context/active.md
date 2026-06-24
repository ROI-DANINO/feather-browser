# Active - startup pointer

This file is the short live pointer for `/start`. **Plan of record →
`docs/specs/2026-06-24-reorientation-and-roadmap-restructure.md`.** Phase index → `ROADMAP.md`;
operational checklist → `journal/ops/tasks.md`; machine pointer → `journal/ops/phase.md`.

## Current pointer

- **NOW (2026-06-24 STOP — NEW DIRECTION CHOSEN: the BOT GYMNASIUM; no code, blog 0025).**
  Reorientation Phases 0–3 are COMPLETE; this session picked what comes *after*. Roi came in (12h
  after the stealth-cut) wanting to remake Feather around stealth + Firefox/Gecko; a grounded,
  adversarially-verified research pass (14 agents) refuted the premises (Firefox-stealth is a myth —
  it's Camoufox's patches not Gecko, DataDome detects Camoufox by name; solo can't win the evasion
  arms race; frontier is up-stack). Roi resolved it himself → a **self-hosted bot gymnasium**: his
  own sandbox, his own deployed detectors, his own bots, watch them learn to pass. NOT evasion on
  sites that don't want bots (that stays cut). **Goals = learning / portfolio / a job / joy, NOT
  commercial.** Also mapped the **"one harness"**: iroh philosophy → White Lotus (cockpit) →
  fable/iroh (brain) → **Feather as a DRIVEN body, not a limb** (integrate by driving, never merge).
  Captured → `docs/specs/2026-06-24-gymnasium-and-harness-vision.md` + 3 memories. Handoff:
  `journal/ops/sessions/my-own-gym-20260624-1217.md`.
- **RECOMMEND NEXT: design Step 1 of the gym.** The smallest-alive version — one agent → Feather →
  ONE real detector → an honest PASS/FAIL Roi can *see* (reframes the 5d.2 "measure reality" work he
  loved). Design pass: pick the first detector (cheap, real, internals-not-controlled, **can-fail**),
  define what "pass" means, decide where it lives in the repo, keep it small + watchable. Step 2 is
  the scoreboard wire to fable's eval harness (`project-fable/evals/`). **Guardrail:** test against
  detectors Roi does NOT control; design tests that can fail (else the sandbox becomes
  rig-your-own-green-checkmarks). **Parked behind the pivot:** the prior "real-account 2FA take".
- **Roi's open item (outside the repo):** rotate/abandon the leaked `roionly9` throwaway account; the
  password stays in public git history (no scrub — Roi's call, low blast radius).

## Key facts for next session

- **Profiles:** `primary` (Roi's real Google) is GONE from disk — only `scratch` (the sacrificial TEST
  identity) exists. If a `primary` is ever re-created, handle with care and NEVER point cookie-export at it.
- **Daily-driver:** `npm run daily` → `primary`; `npm run daily:scratch`; `npm run daily:stop [-- <ws>]`.
- **Server lifecycle:** service `/health` + per-session `GET /v1/sessions/:id/health`; endpoint at
  `/run/user/1000/feather/run/endpoint.json`, token at `/run/user/1000/feather/run/control-token`. Start
  from a shell with `WAYLAND_DISPLAY`/`DISPLAY` for headed; stop by pid from endpoint.json (never `pkill -f`).
- **Operating Feather:** drive via the agent skills (`using-feather-browser` + the focused workflow
  skills); deep reference is `docs/agent-playbook.md`. Detailed operator facts (IG recipes, perception
  API quirks) live there, not here.

## Recent completed context

- **2026-06-24 "My Own Gym" — direction pivot** (this session, no code): refuted a stealth/Firefox
  remake impulse with a verified research pass; chose the **self-hosted bot gymnasium**; clarified
  goals (learn/portfolio/job/joy, not commercial); mapped the **one-harness** shape (Feather = driven
  body, not a limb). Capture `docs/specs/2026-06-24-gymnasium-and-harness-vision.md`; memories
  `feather-gymnasium-direction` + `the-harness-shape`. Blog 0025. Next = design Step 1 of the gym.
- **2026-06-24 Phase 3 SHOW IT OFF**: hero demo v2 — `continuity.ts` console-poll →
  `await-human` banner handoff (visible on camera); `feather.md` per-version "Done when" column; live
  gate PASS (narrowed); `demo-hero-mfa.mp4` recorded/trimmed/compressed; RECORDING.md + gate-report.md.
  `4e0ad81..8aedbbe`. Handoff: `journal/ops/sessions/the-demo-that-shows-its-hands-20260624-0554.md`.
  Blog 0024. **Phases 0–3 complete.**
- **2026-06-24 Phase 2 OSS ENVELOPE**: clone→fail fix + CI badge + showcase number +
  `CONTRIBUTING.md` + HTTP API `/v1` declared + curl examples; product-vs-API version disambiguation.
  `5c5f0fa` + `182b4e0`. Handoff: `journal/ops/sessions/the-two-version-numbers-20260624-0427.md`. Blog 0024 (folded).
- **2026-06-24 Phase 1 HARDEN**: 1a security fixes + 1b test gaps + the verifier-found
  cookie-jar perms fix + local MFA resolve-banner + 2 residuals. `06cd2e8`. Handoff:
  `journal/ops/sessions/every-door-but-the-vault-20260624-0314.md`. Blog 0023.
- **2026-06-24 reorientation:** audit + research → hybrid target, stealth cut, tracking reconciled, secret
  guard added. Plan of record + `journal/ops/archive/active-now-stack-20260624.md`.
- **v2 safety spine PROVEN LIVE (2026-06-23):** Gate A + 5a Identity + 5b MFA + await-human handoff held
  through a real Instagram login wall. Detail in `journal/ops/archive/tasks-20260624-reorientation.md`.
