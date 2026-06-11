# Active - startup pointer

This file is the short live pointer for `/start`. Full phase/session map -> `ROADMAP.md` (now a thin
index) + `docs/sessions/<id>.md`; operational checklist -> `journal/ops/tasks.md`; machine pointer ->
`journal/ops/phase.md`.

## Current pointer

- **NOW (2026-06-11 ~17:05 NEXT): GATE A STARTED — ADR-0010 ACCEPTED + A0 transport hardening
  SHIPPED.** Three PRs merged to `dev`: **#3** ADR-0010 flipped to ACCEPTED (4 open Qs resolved +
  revoke-teeth) + Gate A design (`docs/specs/2026-06-11-gate-a-capability-system-design.md`); **#4**
  A0 plan; **#5** A0 code (CI green). A0 = global `createOriginHostGuard` onRequest hook
  (`src/transport/middleware.ts`): `FORBIDDEN_HOST` (loopback-only Host kills DNS-rebind) +
  `FORBIDDEN_ORIGIN` (cross-origin Origin/Referer on unsafe methods kills CSRF); 14u+6i tests;
  api-reference + port/Referer rationale in comments. **Task 0 verified `/resume` same-origin** (pause
  banner = CDP-polled DOM flag, no network) → R1; stale `http.ts` comment fixed. **Cadence locked:
  plan-first PR → approve → code PR → CI-green → merge.** dev == origin/dev.
- **NOW (2026-06-11, local takeover): A1 SLICE 1 MERGED TO DEV — session-hold primitive in core.**
  `src/capability/holds.ts` `SessionHoldRegistry`: refcounted holds w/ `reason`
  (`mfa|human-approval|cdp-attach|shutdown`) + optional teardown-on-release (the revoke-teeth seam),
  `observe`/`has`/`count` read surface for the future policy layer, `releaseAllForSession` revoke
  hammer. Idempotent release; async teardown awaited; throwing teardown → `onTeardownError`. 11 unit
  tests, tsc clean. **PURE INFRA — no live session paths wired (zero behavior change).** Built by the
  remote session, **reviewed clean + merged to `dev` locally (Roi: drive A1 locally from here)**;
  the remote A1 branch is deleted.
- **Workflow SIMPLIFIED (Roi, 2026-06-11):** no PR-per-step unless asked — work directly on the active
  branch; plan briefly → implement → test → summarize. Pause only for: real warmed profiles/personal
  accounts; a *material change* to security architecture (vs. executing accepted ADR-0010); large
  deletes/rewrites; non-obvious CI failure; an unclear architectural tradeoff.
- **v1 finale BLOGGED + reconciled to dev (2026-06-11): v1 wrap fully closed.** `/blog` shipped
  `blog/0019-the-reviews-that-caught-me-lying.md` (06-10 testing-honesty trio) +
  `blog/0020-feather-on-trial.md` (the Fable-acquittal finale); all 4 owed `_pending.md` lines
  cleared. Blog branch merged to `dev` minus the temporary superpowers-vendor commit (dropped —
  Roi's call, remote-working scaffolding only). Remote-branch cleanup done (only `dev`/`master` remain).
- **A1 SLICE 2 SHIPPED (2026-06-11, local): capability-grant registry + state machine**
  (`src/capability/grants.ts`). Lifecycle `requested → (approved|denied) → granted → used →
  {expired|revoked}`; opaque single-use nonce minted at approval; lazy TTL expiry (injectable
  clock); `revokeAllForSession` = the session-close/MFA-open/shutdown hammer; redacted `onEvent`
  seam for the future audit surfaces. TDD, 13u, suite 339/339, tsc clean. PURE INFRA — nothing wired.
- **Recommend next: A1 slice 3 — local approval page + dangerous-mode policy + dual audit**
  (the MFA `humanToken`/CSRF/CSP page pattern; grants off-by-default config; bus + durable
  append-only audit log under the STATE root), then wire CDP-attach/vault-unlock/cookie-export
  behind grants+holds. Read Gate A design §3–5 + `src/capability/{holds,grants}.ts`.
- **Current phase:** Phase 4a — **Feather v1** ("It runs errands for me"). v1 proven, sighted,
  wrap-analyzed, gap-fixed. Remaining v1 leftovers are small (see tasks.md); v2 spine unchanged —
  nothing from the workflow jumps Gate A.
- **pi_agency is PARKED.** Resume only if Roi pulls it forward.

## Key facts for next session

- **`primary` = Roi's REAL personal Google (re-warmed 2026-06-10).** 438MB, 306 cookies. Handle with care.
- **`scratch` (`workspaceId: scratch`) = the TEST identity** — `roionly9` IG (`Danino1265`, created
  2026-06-11) + warmed `roionly9@gmail.com` Google. Never confuse with `primary`.
- **Daily-driver:** `npm run daily` → `primary`; `npm run daily:scratch`; `npm run daily:stop [-- <ws>]`.
- **Server lifecycle:** health route `/health` (service) + **`GET /v1/sessions/:id/health`**
  (per-session CDP-alive probe, NEW); endpoint at `/run/user/1000/feather/run/endpoint.json`; token
  at `/run/user/1000/feather/run/control-token`. Start from a shell with `WAYLAND_DISPLAY`/`DISPLAY`
  for headed. Stop by pid from endpoint.json (never `pkill -f`).
- **Perception/API news (2026-06-11):** `GET /v1/sessions/:id/tabs` = tab ground truth; click may
  return best-effort `newPageId` (popup event usually lands AFTER the click response); extract takes
  flat `{fields}`, defaults `type`, and `type:"value"` reads input values; headed-CDP now honors
  `viewport` as the OS window size (proxy still unapplied there — warned, not silent); every POST
  action is traced as `action.completed` (name+status only) in the session JSONL.
- **Operator skills + playbook updated 2026-06-11** to all of the above (incl. screenshot =
  artifact descriptor + sanctioned vision fallback).
- **IG durable recipes:** feed caption is CSS-unreachable — parse snapshot TEXT
  `author / stats / author / caption / more`. Confirmation code inputs ignore `fill`/`type` —
  Shift+Tab + individual `press`. **Spam first** for email confirmation codes.
- **`data:`-URL iframes are opaque-origin** — same-origin iframe tests need real local-HTTP fixtures.
- **Claude-for-Chrome captures** (`journal/raw/_inbox/claude_for_chrome_output/`) — analyzed by the
  workflow; keep as raw evidence behind META-ANALYSIS.

## Recent completed context

- **Fable workflow (2026-06-11 ~14:30):** this stop — see Current pointer.
- **Rerun blockers cleared + H3 redesigned read-only & done agent-side (2026-06-11, earlier).**
- **Agent-driven showcase + C4C comparison archived `docs/v1_wrap/` (2026-06-10, `60ef4fd`).**
- **V1 follow-ups closed (2026-06-10 ~12:43):** skills rewrite, semantic asserts, iframe-dismiss fix.
