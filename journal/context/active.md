# Active - startup pointer

This file is the short live pointer for `/start`. **Plan of record →
`docs/specs/2026-06-24-reorientation-and-roadmap-restructure.md`.** Phase index → `ROADMAP.md`;
operational checklist → `journal/ops/tasks.md`; machine pointer → `journal/ops/phase.md`.

## Current pointer

- **NOW (2026-06-24 STOP — PHASE 2 "OSS ENVELOPE" SHIPPED & PUSHED; commits `5c5f0fa` + `182b4e0`,
  pushed `06cd2e8..182b4e0`, no blog — owed line filed).** Worked straight down the Phase 2 checklist,
  everything verified live not asserted: README + `examples/README.md` clone→fail fix
  (`npx playwright install chromium`); CI badge; README showcase section surfacing **8 PASS / 2 PARTIAL**
  (`showcase.sh easy` re-run → 3/3 PASS); new `CONTRIBUTING.md`; HTTP API **`/v1`** declared + stability
  promise in `docs/api-reference.md` + runnable curl for action/grants/MFA (all 3 shapes hit the live
  server). **Roi caught a version collision** ("we wrapping v2 not v1"): there are TWO counters —
  **product v1→v2→v3** (at v2) vs the **HTTP API URL `/v1`** prefix (unchanged since the start). My work
  was the API one (the checklist item literally says "declare the HTTP API v1"); `182b4e0` makes the docs
  name them apart so no reader confuses them. Handoff:
  `journal/ops/sessions/the-two-version-numbers-20260624-0427.md`.
- **RECOMMEND NEXT: Phase 3 — a NEW, stronger hero demo (LAST, needs Roi driving).** Record a real
  logged-in errand (e.g. the H1 calendar errand) as the new hero demo with `wf-recorder` (installed).
  NOT a solo-agent task — Roi drives the human steps. The current `npm run demo:hero` works but is basic.
  Also add a one-line binary "done" per version row in `feather.md`. Full checklist: `journal/ops/tasks.md`.
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

- **2026-06-24 Phase 2 OSS ENVELOPE** (this session): clone→fail fix + CI badge + showcase number +
  `CONTRIBUTING.md` + HTTP API `/v1` declared + curl examples; product-vs-API version disambiguation.
  `5c5f0fa` + `182b4e0`. Handoff: `journal/ops/sessions/the-two-version-numbers-20260624-0427.md`. No blog.
- **2026-06-24 Phase 1 HARDEN**: 1a security fixes + 1b test gaps + the verifier-found
  cookie-jar perms fix + local MFA resolve-banner + 2 residuals. `06cd2e8`. Handoff:
  `journal/ops/sessions/every-door-but-the-vault-20260624-0314.md`. Blog 0023.
- **2026-06-24 reorientation:** audit + research → hybrid target, stealth cut, tracking reconciled, secret
  guard added. Plan of record + `journal/ops/archive/active-now-stack-20260624.md`.
- **v2 safety spine PROVEN LIVE (2026-06-23):** Gate A + 5a Identity + 5b MFA + await-human handoff held
  through a real Instagram login wall. Detail in `journal/ops/archive/tasks-20260624-reorientation.md`.
