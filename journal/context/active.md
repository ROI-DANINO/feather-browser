# Active - startup pointer

This file is the short live pointer for `/start`. **Plan of record →
`docs/specs/2026-06-24-reorientation-and-roadmap-restructure.md`.** Phase index → `ROADMAP.md`;
operational checklist → `journal/ops/tasks.md`; machine pointer → `journal/ops/phase.md`.

## Current pointer

- **NOW (2026-06-24 STOP — REORIENTED: target locked, stealth CUT, docs reconciled, blog 0022 shipped).**
  A multi-angle audit + research pass (8-agent workflow) found ~9 days of drift into anti-bot **stealth**
  while v1 was never shipped and the phase pointer stayed stale. Roi settled: **HYBRID target — personal
  errand-runner → narrow local-first/privacy OSS**; **stealth CUT/parked** (independent benchmark:
  rebrowser's CDP patches == vanilla Playwright on 31 real sites; the warmed-session moat already wins);
  big visual-shell vision deferred. This session: wrote the plan of record
  (`docs/specs/2026-06-24-reorientation-and-roadmap-restructure.md`), installed a commit-time secret
  guard (`.githooks/pre-commit`), reconciled all tracking files (old NOW stack →
  `journal/ops/archive/active-now-stack-20260624.md`), and wrote **blog 0022 — The Disguise I Didn't
  Need** (folded 3 owed stealth lines). Handoff:
  `journal/ops/sessions/the-disguise-i-didnt-need-20260624-0126.md`.
- **RECOMMEND NEXT (Roi's reorder, 2026-06-24): HARDEN FIRST → adoptable → a NEW stronger demo LAST.**
  Start with **Phase 1a — security wins**: write `SECURITY.md` + the defense-in-depth fixes (reject
  non-loopback host unless opted in; MFA token URL off console; `0700` dirs; constant-time auth). Then
  **1b — test gaps** (coverage + floor, abuse suite, session-reuse tests, at-rest ADR) → **Phase 2 — OSS
  envelope** → **Phase 3 — a NEW stronger demo** (the current `npm run demo:hero` works but is basic).
  **Do NOT restart stealth.** Full checklist: `journal/ops/tasks.md`.
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

- **2026-06-24 reorientation** (this session): audit + research → hybrid target, stealth cut, tracking
  reconciled, secret guard added. See the plan of record + `journal/ops/archive/active-now-stack-20260624.md`.
- **v2 safety spine PROVEN LIVE (2026-06-23):** Gate A + 5a Identity + 5b MFA + await-human handoff held
  through a real Instagram login wall. Detail in `journal/ops/archive/tasks-20260624-reorientation.md`.
