# Active - startup pointer

This file is the short live pointer for `/start`. **Plan of record →
`docs/specs/2026-06-24-reorientation-and-roadmap-restructure.md`.** Phase index → `ROADMAP.md`;
operational checklist → `journal/ops/tasks.md`; machine pointer → `journal/ops/phase.md`.

## Current pointer

- **NOW (2026-06-26 STOP — GYM STEP 1 BUILT & SHIPPED; blog 0026).** The bot gymnasium has its first
  working station. Built end-to-end (brainstorm → spec → plan → subagent-driven exec → final review →
  push `origin/dev` `305b8b1..5e2f037`): a new top-level **`gym/`** that drives Feather **over HTTP
  only** (never imports `src/`). `gym/classify.ts` (pure verdict logic, 5 tests, **"no score = FAIL"**)
  + `gym/behavioral.ts` (headed run → `bot.incolumitas.com` → parse `Your Behavioral Score:` from the
  snapshot → classify → verdict-labelled screenshot → row in `gym/results.md`) + `npm run
  gym:behavioral`. **First honest run, live: `UNSCORED → FAIL`** vs a detector Roi doesn't control —
  the behavioral classifier can't score Feather at all (clicks teleport, no cursor path). Final review
  traced the field names to `src/` to confirm the FAIL is **genuine**, not a misread-empty. Suite
  476/476, typecheck clean. Design `docs/specs/2026-06-26-gym-step1-behavioral-diagnostic-design.md`;
  plan `docs/plans/2026-06-26-...`; recon `docs/testing/gym-step1/recon-findings.md`. Handoff:
  `journal/ops/sessions/the-detector-that-couldnt-see-me-20260626-1935.md`.
- **RECOMMEND NEXT: Step 2 — wire fable's eval harness (`project-fable/evals/`) as the scoreboard.**
  The first thin White Lotus ↔ Feather integration (a wire, not a merge); the gym's HTTP client
  (`gym/behavioral.ts` exports `feather`/`launchHeaded`/…) is built to be reused. **Surfaced upgrade
  target = mouse-motion** (what flips Feather from UNSCORED to a real score — do it before or after
  Step 2, Roi's call). **Guardrail holds:** detectors Roi does NOT control, tests that can fail.
  **Parked behind the pivot:** the prior "real-account 2FA take".
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

- **2026-06-26 Gym Step 1 — BUILT & SHIPPED**: the bot gymnasium's first station. Top-level `gym/`
  drives Feather over HTTP only (classify.ts pure+tested, behavioral.ts headed drive of
  bot.incolumitas → parse score → verdict → screenshot + results.md row). First live run `UNSCORED →
  FAIL` (genuine, field-verified vs src/). "No score = FAIL." 476/476, pushed `305b8b1..5e2f037`. Blog
  0026. Handoff `journal/ops/sessions/the-detector-that-couldnt-see-me-20260626-1935.md`. NEXT = Step 2
  scoreboard wire to `project-fable/evals/`; upgrade target = mouse-motion.
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
