# Active - startup pointer

This file is the short live pointer for `/start`. Full phase/session map -> `ROADMAP.md` (now a thin
index) + `docs/sessions/<id>.md`; operational checklist -> `journal/ops/tasks.md`; machine pointer ->
`journal/ops/phase.md`.

## Current pointer

- **NOW (2026-06-15 03:30 NEXT): GATE A REAL USE-CASE PROVEN END-TO-END — "mined AND used."**
  Re-warmed `scratch` Gmail via the **human-in-the-loop** login (Roi logged in; `resumeOn:"Compose"`
  missed because the Gmail UI is **Hebrew** — felt the banner-dies-on-nav pain firsthand). Mined
  **77 cookies through the gate** (refuse `GRANT_REQUIRED` → Roi approved in-browser → export incl.
  ALL Google session cookies → single-use refusal; audit `requested→granted→used`), then a **fresh
  empty browser opened roionly9's inbox using only those cookies** (proof script + screenshot
  `/tmp/fresh-browser-gmail.png`). On **Google, the hard target.** Honest nuance: Google emailed a
  security alert but did NOT invalidate the session (**detection ≠ blocking** → 5d stealth input).
  Env fixes: reinstalled Playwright Chromium (cache was gone), cleared a stale scratch lock; **`primary`
  no longer exists on disk** (the key-fact below is STALE); Roi wiped `scratch` clean first. **No repo
  code changes.** Session+server stopped clean at /next. **Recommend next: the navigation-survivable
  resume banner** (re-inject on `framenavigated`) — Roi's explicit ask, deferred to next session;
  plan-first. Full bridge: `journal/context/next.md` 2026-06-15 03:30 entry.
- **NOW (2026-06-15 02:31 NEXT): HOUSEKEEPING — inbox cleaned, NEXT ACTION UNCHANGED.** Moved the
  2 raw Claude-for-Chrome transcripts out of `journal/raw/_inbox/` to
  `docs/v1_wrap/claude-for-chrome/raw/` (gitignored — real personal data, local-only) + README;
  inbox back to README-only. Bookkeeping (active.md/log.md/new raw README) is UNCOMMITTED. **Recommend
  next: still the REAL Gate A use-case test on warmed `scratch`** (see the 2026-06-11 19:15 NEXT entry
  + `docs/gate-a-test-walkthrough.md`); optionally commit the housekeeping first.
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
- **A1 SLICE 3 SHIPPED (2026-06-11, local) — GATE A IS NOW LIVE, PROVEN END-TO-END.** The full
  `request → human-approve → consume → audit → revoke` loop runs over HTTP, gated on a real
  Dangerous-tier door: **cookie export**. New `src/capability/`: `consumeGranted` (door-facing,
  agent never transports the nonce), `policy.ts` (`DangerousModePolicy` — OFF by default, opt-in via
  `FEATHER_DANGEROUS_CAPABILITIES`), `audit.ts` (append-only JSONL `<state>/logs/audit/grants.jsonl`),
  `approval.ts` (single-use humanToken + per-page CSRF), `service.ts` (facade → BOTH audit surfaces).
  Transport: hardened approval page (strict CSP; action+csrf in query like resume), `POST
  /v1/sessions/:id/grants` (returns `{grant}` ONLY — no token), `GET/POST /v1/approvals/:humanToken`,
  `POST /v1/sessions/:id/cookies/export` (the gated door), session-close → `revokeSession`. TDD: +21u
  + 7-case integration loop. Gates: tsc clean, **360 unit / 92 integration**. Plan:
  `docs/specs/2026-06-11-a1-slice3-plan.md`.
- **Joint calls (2026-06-11 brainstorm, recorded):** approval ping = terminal + SSE (no
  desktop/Telegram); grants die on restart (in-memory; only the audit log persists); 60s flat TTL;
  scope = gate + the one cookie-export demo door (CDP attach / vault gated when built in 5c / ADR-0008).
- **LIVE-DEMOED the door headed (2026-06-11 ~19:10)** on a disposable github session: export refused
  w/o grant → Roi approved in-browser → export → single-use refusal; audit clean, no secret leaked.
  **Roi's honest verdict: proved the LOCK but behind it was an empty box** — logged-OUT github =
  anonymous cookies, and export only DUMPED them, never USED them. Underwhelming on purpose
  (cookie-export is the minimal demo door).
- **Recommend next: a REAL use-case test on the warmed `scratch` profile** (`journal/context/next.md`
  has the full plan). Stop the scratch daily-driver → launch a HEADED session on
  `{"workspaceId":"scratch","profile":{"kind":"persistent"}}` (real logged-in Gmail/IG — Roi sees the
  inbox, no password) → agent export refused → Roi approves → export REAL login cookies → **prove
  they're live by loading them into a fresh separate browser that opens Gmail already logged in**
  (cookie mined AND used = the Cookie Mine value, with Gate A in front). NEVER `primary`. Then **5a —
  Identity Model** (first real consumer). NB: cookie-export is the ONLY live dangerous op; CDP-attach
  is 5c, vault frozen.
- **Current phase:** Phase 4a — **Feather v1** ("It runs errands for me"). v1 proven, sighted,
  wrap-analyzed, gap-fixed. Remaining v1 leftovers are small (see tasks.md); v2 spine unchanged —
  nothing from the workflow jumps Gate A.
- **pi_agency is PARKED.** Resume only if Roi pulls it forward.

## Key facts for next session

- **`primary` = Roi's REAL personal Google — ⚠️ NO LONGER ON DISK (verified gone 2026-06-15).** The old
  "438MB, 306 cookies, re-warmed 2026-06-10" is STALE; the only profile that exists is `scratch`. If a
  `primary` is ever re-created, handle with care and NEVER point cookie-export at it.
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
- **Claude-for-Chrome captures** (`docs/v1_wrap/claude-for-chrome/raw/`, gitignored — local-only,
  personal data) — analyzed by the workflow; kept as raw evidence behind META-ANALYSIS. Moved out
  of the inbox 2026-06-15.

## Recent completed context

- **Fable workflow (2026-06-11 ~14:30):** this stop — see Current pointer.
- **Rerun blockers cleared + H3 redesigned read-only & done agent-side (2026-06-11, earlier).**
- **Agent-driven showcase + C4C comparison archived `docs/v1_wrap/` (2026-06-10, `60ef4fd`).**
- **V1 follow-ups closed (2026-06-10 ~12:43):** skills rewrite, semantic asserts, iframe-dismiss fix.
