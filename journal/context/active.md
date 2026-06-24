# Active - startup pointer

This file is the short live pointer for `/start`. **Plan of record →
`docs/specs/2026-06-24-reorientation-and-roadmap-restructure.md`.** Phase index → `ROADMAP.md`;
operational checklist → `journal/ops/tasks.md`; machine pointer → `journal/ops/phase.md`.

## Current pointer

- **NOW (2026-06-24 STOP — PHASE 3 "SHOW IT OFF" SHIPPED & PUSHED; commits `4e0ad81..8aedbbe`,
  pushed `182b4e0..8aedbbe`, blog 0024).** Reorientation roadmap **Phases 0–3 now COMPLETE.**
  Hero demo v2: rewired `scripts/demo/continuity.ts` from a silent console login-poll to Feather's
  shipped `await-human` handoff (on-page Resume banner + `resumeOn` auto-resume), so the agent↔human
  handoff is **visible on camera** (~15 lines, TDD, no `src/` change). Added a binary "Done when" column
  per version in `feather.md` (a cold review caught the v2 line smuggling a "no-verify-challenge" promise
  that contradicts the cut-stealth decision; rewrote → only a *persistent block* fails v2). Recorded with
  Roi driving → **live gate PASS (narrowed):** banner appeared on `accounts.google.com`, survived
  email→password, auto-resumed; log- + frame-verified (`docs/v1_wrap/hero-demo-v2/gate-report.md`).
  Recorded `demo-hero-mfa.mp4` (~49s/2.4M, trimmed + CRF-compressed from 23M; replaces `demo-final.mp4`);
  README repointed; `scripts/demo/RECORDING.md` written. Final review fixed 2 honesty gaps (committed the
  gate report; softened README 2FA wording — it wasn't demonstrated). **Post-/stop (`0ed7a1e`→`3bfa1c2`):**
  README hero section now embeds an autoplay **GIF** (`demo-hero-mfa.gif`, 15s/1080px/3.4M — stitched
  highlight: banner→login→auto-resume, hard-cut to the agent composing the Gmail draft, ending on the
  finished draft) + mp4 kept as full-quality link. Handoff:
  `journal/ops/sessions/the-demo-that-shows-its-hands-20260624-0554.md`.
- **RECOMMEND NEXT: real-account 2FA take.** Run `npm run demo:hero` on Roi's *actual* Google account
  (expected to trigger phone-tap verification) to prove the banner survives a real 2FA challenge **page**
  — the one thing this session's recording did NOT exercise (no challenge fired same-machine). Test real /
  publish scratch. Optional after: launch-grade re-record (opaque terminal, calm background, full terminal
  on screen — gaps in `RECORDING.md`). With Phases 0–3 done, the other open thread is picking the next
  real workstream (v2.5/4b are deferred; nothing forced).
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

- **2026-06-24 Phase 3 SHOW IT OFF** (this session): hero demo v2 — `continuity.ts` console-poll →
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
