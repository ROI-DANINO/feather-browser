# Next — Context Bridge

_Empty buffer. The last bundle (5 entries, 2026-06-10 12:48 → 2026-06-11: suite run → M1/H3
redesigns → agent-driven showcase + C4C comparison → rerun blockers cleared → Fable workflow
queued) was consumed at the 2026-06-11 ~14:30 `/stop` (fable-workflow-v1-acquittal) and archived
to `journal/archive/next/2026-06-11/1430-stop-bundle-fable-workflow.md`. Current state lives in
`journal/context/active.md`._

<!-- Append `/next` bridge entries below this line when moving between work sessions mid-thread. -->

---
## 2026-06-11 14:24 — v1 finale blogged; next session = brainstorm v2 Gate A

### Session pointer
- Roadmap/session pointer: Phase 4a / Feather v1 wrap COMPLETE. Next = **v2 Gate A planning/brainstorm** (Session 5.0.0, ADR-0010). v1 wrap is acquitted (see `docs/v1_wrap/META-ANALYSIS.md`), gap-fixes shipped (`60ef4fd..235ebbb`), and now the blog finale is written.

### Summary
- This session bridges the v1-wrap close and the Gate A brainstorm. The only *work* was the `/blog` v1 finale (last owed item before Gate A) plus a deep read of the C4C-vs-Feather comparison + meta-analysis to answer Roi's "can I feel good about v1 / should I start Gate A?" question.
- Verdict delivered: **yes feel good; yes start Gate A — nothing holds it up.** The v2 security spine is unchanged by the v1-wrap analysis; the ★ v1-core fixes that *preceded* Gate A are all landed + green; remaining v1 leftovers are small (◇ defer-with-reason). Caveat per AGENTS.md: Gate A = **planning/reconciliation pass first, not implementation**.

### Completed
- Answered (grounded in docs, not commit msgs) what the C4C-vs-Feather back-to-back experiment gave us: equal-capability wash on the 8/8 shared errands; the two non-PASSes were environmental (M2 transient/cause-undetermined; H3 harness-side death) + one humble real bug (headed-CDP viewport). The experiment's real deliverable = it corrected its own dramatic first read (META-ANALYSIS wins over the 06-10 COMPARISON/CAPABILITY docs where they disagree).
- `/blog` finale shipped as **two** entries (Roi picked "Finale + separate 06-10 entry"):
  - `blog/0019-the-reviews-that-caught-me-lying.md` (2026-06-10) — folds the 06-10 trio (observe-bug-fixes vacuous-tests catch + iframe-dismiss one-line shrink + native-capabilities parked-behind-gate) into one testing/measurement/roadmap-honesty arc.
  - `blog/0020-feather-on-trial.md` (2026-06-11) — the Fable forensics finale (socket-death + IG-like reversals, the viewport bug, the M2 overclaim caught by the adversarial reviewer, the security hole caught in the fix pre-push).
- Updated `blog/README.md` index (rows 0019, 0020); cleared all 4 owed lines from `blog/_pending.md` (Owed now empty).
- **Committed + pushed** as `af83a65` on branch `claude/last-15-commits-8aizhv` (NOTE: task-harness branch, NOT `dev` — see Risks).

### User decisions / quotes
- Decision: blog scope = **"Finale + separate 06-10 entry"** (2 entries, not 1 folded, not 4 separate).
- Decision (via /next args): the **next session is the v2 Gate A brainstorm**.
- Quote: "session we'll brainstorm gate a"

### Agent decisions / assumptions / rationale
- Numbered the 06-10 trio `0019` and the 06-11 finale `0020` (the AskUserQuestion option text had labeled the finale 0019) so the index stays **date-ordered** (0018 is also 06-10). Flagged to Roi as trivially swappable.
- Both entries `status: draft` in frontmatter, matching every prior entry.
- Committed to the designated task branch `claude/last-15-commits-8aizhv` per this session's git directive, NOT `dev` — the harness branch rule overrides AGENTS.md's `dev`-trunk default for this session.

### Files read or touched
- Read: `docs/v1_wrap/claude-for-chrome/COMPARISON.md`, `docs/v1_wrap/META-ANALYSIS.md`, `docs/v1_wrap/claude-for-chrome/CAPABILITY-AND-V2-GAPS.md`, `journal/context/active.md`, the 4 owed session files (`fable-workflow-v1-acquittal-20260611-1430`, `native-capabilities-placed-20260610-0950`, `observe-bug-fixes-shipped-20260610-1203`, `skills-asserts-iframe-dismiss-20260610-1243`), `blog/README.md`, `blog/_pending.md`, `blog/0017-teaching-it-to-see.md`.
- Touched (committed `af83a65`): `blog/0019-the-reviews-that-caught-me-lying.md` (new), `blog/0020-feather-on-trial.md` (new), `blog/README.md`, `blog/_pending.md`.

### Open threads / unresolved questions
- **v2 Gate A brainstorm not started** — that's the whole next session. Inputs to pull forward: ADR-0010 (capability grants / deny-by-default), the §4 ◇ deferred items in META-ANALYSIS (general `/evaluate` deferred to Gate A; batch endpoint at 5.0.1; Stealth 5d), and the Gate B posture borrowings from C4C (declared-origin allowlist per session; credentials-never-typed / CredentialsVault injection).
- Entry-number swap (0019↔0020) offered to Roi, not yet confirmed.
- Small v1 leftovers still open (from the 14:30 stop, not this session): prune duplicate Sep-12 "Rosh Hashana" events on scratch Google; H3 viewport acceptance check (does 1280×800 headed render IG desktop — counterfactual never tested); remove dead `run_h3` from `showcase.sh` when next touched.

### Next action
- Start the **v2 Gate A planning/brainstorm session (5.0.0)**: fresh session, planning-first (no implementation per AGENTS.md phase-boundary rule). Orient via `/start`, then open ADR-0010 and the Gate A design surface.

### Next session should read
- `journal/context/active.md` (state owner), `ROADMAP.md`
- `docs/specs/adr-0010-*` (capability grants / Gate A sequencing — confirm exact filename)
- `docs/v1_wrap/META-ANALYSIS.md` §4 (deferred items) + §5 (corrected verdict)
- `docs/sessions/5.0.0-*` if it exists (Gate A session stub)

### Risks / blockers
- **Branch divergence:** the blog finale is committed to `claude/last-15-commits-8aizhv`, NOT `dev`. Per AGENTS.md the blog lives on `dev`; the next human step is to reconcile/cherry-pick `af83a65` onto `dev` (or merge the task branch) so the finale isn't stranded. Don't double-write the entries on `dev`.
- AGENTS.md phase-boundary rule: do the Gate A planning/reconciliation pass **before** any implementation — don't jump straight into building the gate.

---
## 2026-06-11 17:05 — Gate A: ADR-0010 accepted + A0 transport hardening shipped; A1 next

### Session pointer
- Roadmap/session pointer: Phase 5.0.0 (Gate A), `journal/ops/tasks.md` §5.0.0; ADR-0010 (ACCEPTED).

### Summary
- Took Gate A from proposal → accepted model → shipped first slice. ADR-0010 ACCEPTED; Gate A split
  into **A0 (transport hardening — DONE)** + **A1 (capability system — NEXT)**.

### Completed
- **#3 merged** — ADR-0010 flipped to ACCEPTED (4 open Qs resolved + revoke-teeth decision) + new
  `docs/specs/2026-06-11-gate-a-capability-system-design.md`.
- **#4 merged** — `docs/specs/2026-06-11-a0-transport-hardening-plan.md` (plan-only).
- **#5 merged (CI green)** — A0 code: global `createOriginHostGuard` onRequest hook in
  `src/transport/middleware.ts`, wired in `http.ts`. `FORBIDDEN_HOST` (loopback-only Host, kills
  rebind) + `FORBIDDEN_ORIGIN` (cross-origin Origin/Referer on unsafe methods, kills CSRF). 14 unit
  + 6 integration tests; `docs/api-reference.md` updated; port/Referer rationale in code comments.
- **Task 0 verified**: `/resume` is same-origin (pause banner is CDP-polled DOM flag, no network) →
  **R1** chosen; stale `http.ts:31-33` comment corrected.

### User decisions / quotes
- Decision: ADR-0010 resolutions — Q1 opaque single-use nonce + grant registry; Q2 local approval
  page (MFA pattern); Q3 ship A0 ahead; Q4 audit on bus **and** durable append-only log; revoke
  **tears down in-flight ops** via a hold that owns the live resource ("Lock Option A").
- Decision: A0 port handling stays lenient-when-absent; Referer stays Origin-fallback (both confirmed
  safe; rationale captured in comments per request).
- Quote: "we will work on a1"
- Quote: "please delete the merged remote branches to keep the repo clean."

### Agent decisions / assumptions / rationale
- A0 enforces Origin only on unsafe methods (POST/PUT/PATCH/DELETE), not GET — so cross-origin GET
  navigation to the resume link isn't broken. Standard CSRF pattern.
- Merged #5 on strength of run-1 green + comments-only delta + local unit re-run; the re-run also
  confirmed green (17:02:59).

### Files read or touched
- Touched (merged to dev): `docs/specs/adr-0010-...md`, `docs/specs/2026-06-11-gate-a-...md`,
  `docs/specs/2026-06-11-a0-transport-hardening-plan.md`, `src/transport/middleware.ts`,
  `src/transport/http.ts`, `docs/api-reference.md`, `tests/unit/transport/origin-host-guard.test.ts`,
  `tests/integration/origin-host-hardening.integration.test.ts`.
- Read (for A0): `src/transport/{routes,sse,resume-page,server-info}.ts`,
  `src/commands/await-human.ts`, `src/browser/pause-banner.ts`.

### Open threads / unresolved questions
- **Merged remote branches NOT deleted** — git proxy blocks ref deletion (HTTP 403) and no GitHub MCP
  delete-branch tool exists. Branches still on origin: `claude/session-branch-work-leu1oj`,
  `claude/a0-transport-hardening-plan`, `claude/a0-transport-hardening-code`,
  `claude/last-15-commits-8aizhv`. Needs GitHub UI or a relaxed network policy.

### Next action
- Start **A1** with a plan-first pass (same cadence as A0): write the A1 implementation plan
  (tiers + session-hold primitive + capability-grant registry + dangerous-mode policy + dual audit)
  per ADR-0010 §1,2,4,5 and the Gate A design doc. Plan-only first; get approval before code.

### Next session should read
- `docs/specs/adr-0010-local-control-plane-capability-model.md` (the accepted model)
- `docs/specs/2026-06-11-gate-a-capability-system-design.md` (A0/A1 seams)
- `src/transport/middleware.ts` (the A0 guard, the pattern A1 extends)

### Risks / blockers
- A1 touches core session/profile/security — heavily-reviewed, short-lived per AGENTS.md domain-risk
  note. No pre-committed cross-module TS interfaces (ADR-0010 scope): hold + grant are seams.

---
## 2026-06-11 17:28 — A1 slice 1: session-hold primitive shipped (simplified workflow)

### Session pointer
- Phase 5.0.0 (Gate A) → A1; `journal/ops/tasks.md` §5.0.0 A1; ADR-0010 §4 + Gate A design §2.

### Summary
- Shipped the FIRST A1 slice — the session-hold primitive in core. Workflow simplified: working
  directly on the session branch, no PR-per-slice; plan→implement→test→summarize.

### Completed
- **`src/capability/holds.ts`** — `SessionHoldRegistry`: refcounted holds with `reason`
  (`mfa | human-approval | cdp-attach | shutdown`), optional teardown closure run once on release
  (the revoke-teeth seam), `observe`/`has`/`count` read surface for the future policy layer,
  `releaseAllForSession(id, reason?)` revoke hammer. Idempotent release; async teardown awaited;
  throwing teardown → `onTeardownError`, never propagated. Instance-scoped (not a module singleton).
- **`tests/unit/capability/holds.test.ts`** — 11 unit tests.
- Committed on `claude/session-branch-work-leu1oj` (rebased onto dev so the branch carries A0 + the
  current tracking state — it was cut from a pre-A0 base; rebase made it `dev + holds`).
- **Pure infrastructure — NO live session paths wired** (no behavior change to running sessions).

### User decisions / quotes
- Decision: SIMPLIFIED WORKFLOW (new default) — no PR-per-step unless explicitly asked; work on the
  active branch; plan briefly, implement, test, summarize; don't stop for approval on every step.
  Pause only if: touches real warmed profiles/personal accounts; materially CHANGES security
  architecture (vs. executing accepted ADR-0010); deletes/rewrites large parts; CI fails non-obviously;
  unclear architectural tradeoff.
- Quote: "Stop using a PR-per-step process unless I explicitly ask for it."
- Quote: "For A1, continue with a compact plan and then start the first safe implementation slice."
- Quote: "I want to review it" — Roi reviews slice 1 before the grant-registry slice proceeds.

### Agent decisions / assumptions / rationale
- Implementing the ACCEPTED ADR-0010 design = in scope (no pause); only a genuine under-specified fork
  would trigger a pause. Confirmed reading with Roi up front.
- Chose the hold primitive as slice 1 because the Gate A build-order names it first (MFA + CDP both
  depend on it; it unblocks Stealth-last) and it is pure infra — safest first slice.
- Did NOT wire holds into the live session-close path this slice — that wiring belongs with the grant
  work (build-order step 4), keeping slice 1 zero-behavior-change.
- Instance-scoped registry (not module singleton like pause-registry) — clean per-test, and the grant
  registry will need the same treatment.

### Files read or touched
- Touched: `src/capability/holds.ts`, `tests/unit/capability/holds.test.ts`.
- Read: `docs/specs/adr-0010-local-control-plane-capability-model.md`,
  `docs/specs/2026-06-11-gate-a-capability-system-design.md`, `src/transport/middleware.ts`,
  `src/sessions/{session,types}.ts`, `src/commands/pause-registry.ts`.

### Open threads / unresolved questions
- Roi wants to review slice 1 before continuing. Hold the grant-registry slice until reviewed.
- Merged-branch deletion still BLOCKED (git proxy 403, no MCP delete-branch tool) — unchanged.

### Next action
- After Roi's review: build A1 slice 2 — capability-grant registry + state machine
  (`requested → granted → used → {expired|revoked}`, opaque single-use nonce → server-side registry
  record `{sessionId, capability, ttl, status}`). Infra only; local approval page + Dangerous-tier
  wiring come after.

### Next session should read
- `src/capability/holds.ts` (the seam slice 2 builds on)
- `docs/specs/2026-06-11-gate-a-capability-system-design.md` §3 (grant lifecycle)
- `docs/specs/adr-0010-local-control-plane-capability-model.md` §2 (grant primitive)

### Risks / blockers
- A1 is core security infra — short-lived branch, heavy review per AGENTS.md domain-risk note.
- Slice 1 has no call sites yet (by design) — slice 2+ must actually wire it or it's dead code.

---
## 2026-06-11 19:15 — Gate A SHIPPED (A1 slices 1-3) + reconciled remote; next = REAL use-case test on scratch

### Session pointer
- Roadmap/session pointer: Phase 5.0 (Gate A) — A0 + A1 slices 1-3 DONE. dev == origin/dev @ 91ed034.

### Summary
- Reviewed + reconciled the remote zenboy work (A0 + ADR-0010 accept + blog finale + A1 slice 1),
  then took A1 local and shipped slices 2 + 3. **Gate A is now live, proven end-to-end.**
- Live-demoed the cookie-export door headed; Roi's honest verdict: proved the LOCK but behind it
  was an empty box (logged-out github = anonymous cookies; export only dumped them, never used them).
  Next session = a REAL use-case test on the warmed scratch profile.

### Completed
- Fast-forwarded dev onto remote A0/ADR-0010; merged blog finale (0019+0020) MINUS the temporary
  superpowers-vendor commit 6df2d41 (Roi: drop it). Cleaned up all 4 merged remote branches.
- A1 slice 1 (session-hold primitive) reviewed clean + merged to dev (local takeover).
- **A1 slice 2** — capability-grant registry + state machine (`src/capability/grants.ts`): single-use
  nonce at approval, lazy TTL (injectable clock), revokeAllForSession, redacted onEvent. 13u. (d0e35e4)
- **A1 slice 3** — `policy.ts` (off-by-default `FEATHER_DANGEROUS_CAPABILITIES`), `audit.ts`
  (append-only JSONL <state>/logs/audit/grants.jsonl), `approval.ts` (single-use humanToken+CSRF),
  `service.ts` facade (→ BOTH audit surfaces: durable log + SSE bus); transport: hardened approval
  page (strict CSP; action+csrf in query like resume), `POST …/grants` (returns {grant} ONLY, no
  token), `GET/POST /v1/approvals/:humanToken`, `POST …/cookies/export` (the gated demo door),
  session-close→revokeSession. +21u + 7i. tsc clean; 360u/92i green. (a7db198) Plan:
  `docs/specs/2026-06-11-a1-slice3-plan.md`.
- Brainstorm joint calls (recorded): approval ping = terminal+SSE; grants die on restart (in-memory,
  only audit log persists); 60s flat TTL; scope = gate + the one cookie-export demo door.
- Wrote + LIVE-VERIFIED `docs/gate-a-test-walkthrough.md` (3-terminal hands-on). (91ed034)
- Live headed demo: agent drove a disposable session to github, export refused w/o grant, Roi
  approved in-browser (audit: requested 19:10:21 → granted 19:11:37 → used 19:11:54; request waited
  76s un-expired, used 17s after approval), single-use second export refused, zero secret leaked.

### User decisions / quotes
- Decision: drop the superpowers-vendor commit (temporary remote-working scaffolding).
- Decision: drive A1 locally (take over from the remote session).
- Quote: "what did i actually see? what does the test even mean? i didnt see real action with
  cookies that got mined. /next session i want to really test it with actual usecase"
- Quote (slice-3 scope brainstorm): "i think 2, i want to test stuff with scratch profile"

### Agent decisions / assumptions / rationale
- Cookie-export was deliberately the MINIMAL demo door (the smallest real op to prove the machinery);
  it returns cookies as data, does not consume/use them. Honest limit surfaced to Roi.
- Disposable+github for the first live demo = zero-risk but logged-OUT → anonymous cookies, which is
  exactly why it underwhelmed. The fix is the scratch warmed profile.

### Files read or touched
- Touched (shipped): `src/capability/{grants,policy,audit,approval,service}.ts`,
  `src/commands/export-cookies.ts`, `src/transport/{routes,approval-page,sse}.ts`,
  `src/logs/events.ts`, `src/fs-layout.ts`, `docs/api-reference.md`,
  `docs/specs/2026-06-11-{a1-slice3-plan,gate-a-capability-system-design}.md`,
  `docs/gate-a-test-walkthrough.md`, tests/unit/capability/*, tests/integration/capability-gate*.
- Read: `src/transport/{http,routes,sse,resume-page,server-info}.ts`, `src/sessions/{session,manager}.ts`,
  `src/logs/bus.ts`, `src/config.ts`, `scripts/start-daily-driver.sh`.

### Open threads / unresolved questions
- The 3 other gate refusals (deny / 60s-expire / revoke-on-close) NOT shown live yet (offered, Roi
  redirected to the real-usecase ask). Covered by tests; can demo next session.
- Cookie-export is the ONLY live dangerous door. Warmed CDP attach (5c) + vault release (ADR-0008)
  don't exist — there is no bigger "real" dangerous op to gate yet.

### Next action
- REAL use-case test on scratch: (1) `npm run daily:stop -- scratch` to free the profile lock;
  (2) start API server w/ `FEATHER_DANGEROUS_CAPABILITIES=cookie-export` + display env; (3) launch a
  HEADED session on `{"workspaceId":"scratch","profile":{"kind":"persistent"}}`, navigate to Gmail —
  Roi sees the real logged-in inbox; (4) agent export → refused → Roi approves on local page →
  export REAL login cookies; (5) PROVE they're live by loading them into a fresh separate browser
  context and showing it opens Gmail already logged in (cookie mined AND used). Then optionally show
  deny/expire/revoke-on-close.

### Next session should read
- `journal/context/active.md`, `docs/gate-a-test-walkthrough.md` (scratch note at the bottom)
- `docs/specs/2026-06-11-a1-slice3-plan.md`, `src/capability/service.ts`, `src/transport/routes.ts`
  (the grants/approvals/cookies-export routes)

### Risks / blockers
- NEVER point the export at `primary` (Roi's real Google). Scratch only.
- The scratch daily-driver MUST be stopped first or the persistent launch hits PROFILE_LOCKED.
- Headed launch needs WAYLAND_DISPLAY/DISPLAY in the server's env (zenboy: wayland-1 / :0).

---
## 2026-06-15 02:31 — Inbox cleanup: C4C raw transcripts filed next to META-ANALYSIS (kept private)

### Session pointer
- Roadmap/session pointer: Phase 5.0 (Gate A) DONE end-to-end; NEXT (unchanged) = REAL use-case test on warmed `scratch`. This session was housekeeping only — no roadmap movement.

### Summary
- Cleaned the last item out of `journal/raw/_inbox/`: the 2 raw Claude-for-Chrome capture transcripts. Filed them next to their analysis and kept them GITIGNORED because they hold real personal data.

### Completed
- Moved `journal/raw/_inbox/claude_for_chrome_output/{Go through my recent emails, תעבור לי על פרופיל הלינקדאין...}` → `docs/v1_wrap/claude-for-chrome/raw/{E-unsubscribe-emails.txt, H-linkedin-profile-summary.txt}` (plain `mv` — they were never git-tracked; whole inbox is gitignored via `.gitignore:43 journal/raw/_inbox/*`).
- Added `docs/v1_wrap/claude-for-chrome/raw/.gitignore` (`*.txt`) so the raw transcripts stay local-only; verified `git check-ignore` ignores the `.txt`, tracks README + .gitignore.
- Wrote `docs/v1_wrap/claude-for-chrome/raw/README.md` (what they are, why gitignored, the 2-row table).
- Removed the now-empty inbox subfolder; inbox back to README-only.
- Updated `journal/context/active.md` key-facts pointer (old inbox path → new gitignored path); appended a `NOTE` line to `journal/log.md`.

### User decisions / quotes
- Decision: file them next to the related analysis (option 1), kept PRIVATE (not published).
- Quote: "1" / "do it" / (earlier) "should we clean the inbox and transpher those to a more relevant place?"
- Note: user said "i dont understand" mid-thread → I re-explained in plain language before acting.

### Agent decisions / assumptions / rationale
- Caught that `docs/v1_wrap/` is git-tracked + this is an open-source repo → moving raw personal-data transcripts there would PUBLISH them. Surfaced the privacy tradeoff before acting (the inbox being gitignored had been protecting them). Resolution: keep them next to the analysis but gitignored.
- Existing committed `outputs/*.md` are curated/redacted writeups; these raw `.txt` are unredacted → must stay local-only.

### Files read or touched
- Touched: `docs/v1_wrap/claude-for-chrome/raw/{E-unsubscribe-emails.txt (moved, ignored), H-linkedin-profile-summary.txt (moved, ignored), README.md (new), .gitignore (new)}`, `journal/context/active.md`, `journal/log.md`.
- Read: `journal/raw/_inbox/README.md`, `docs/v1_wrap/claude-for-chrome/{prompts.md, outputs/E1.md}`, `.gitignore`.

### Open threads / unresolved questions
- The bookkeeping changes (active.md + log.md + new raw/README.md + raw/.gitignore) are UNCOMMITTED — I asked whether to commit; user ran /next instead. Decide on commit next session (or fold into the next /stop).
- Working tree also still carries the pre-existing M on journal/context/{active,next}.md, log.md, ops/tasks.md from prior sessions.

### Next action
- Resume the planned work: REAL use-case test of Gate A on the warmed `scratch` profile (full steps in this file's 2026-06-11 19:15 entry + `docs/gate-a-test-walkthrough.md`). Optionally first: commit the housekeeping.

### Next session should read
- `journal/context/active.md` (state owner), `docs/gate-a-test-walkthrough.md`
- `docs/specs/2026-06-11-a1-slice3-plan.md`, `src/capability/service.ts`, `src/transport/routes.ts`

### Risks / blockers
- NEVER point cookie-export at `primary` (Roi's real Google) — scratch only.
- Stop the scratch daily-driver first (`npm run daily:stop -- scratch`) or persistent launch hits PROFILE_LOCKED; headed launch needs WAYLAND_DISPLAY/DISPLAY in server env.
- The raw `.txt` transcripts must stay gitignored — do not `git add -f` them.

---
## 2026-06-15 03:30 — Gate A REAL cookie-mine PROVEN end-to-end on warmed Gmail; banner re-inject deferred to next

### Session pointer
- Roadmap/session pointer: Phase 5.0 (Gate A) — was "live, lock proven but empty box"; now **PROVEN with a real warmed session** (mined AND used). Next thread = **navigation-survivable resume banner** (re-inject on `framenavigated`) — the OPEN v2-MFA-core item in tasks.md.

### Summary
- Ran the real use-case Gate A test Roi wanted: warmed `scratch` Gmail via the human-in-the-loop mechanism, mined its cookies **through the gate**, and proved they log a **fresh empty browser** straight into the inbox. On Google (the hard target). The "empty box" critique from last session is now resolved.

### Completed
- **Env fixes:** Playwright browser cache was GONE (`ENOENT chromium-1223`) → reinstalled (`npx playwright install chromium`). Cleared a stale `profiles/scratch/lock` (orphan from a failed spawn before the reinstall).
- **Discovery:** old scratch warm sessions had **EXPIRED** (Gmail + Instagram both logged out). **`primary` profile no longer exists on disk** — active.md's "438MB primary / 306 cookies" line is STALE.
- **Roi wiped `scratch` fully** (deleted the whole profile dir, 42M) for a clean slate.
- **Re-warmed `scratch` via human-in-the-loop:** headed session → Google sign-in → Roi logged in → Gmail. `resumeOn:"Compose"` MISSED because the Gmail UI is **Hebrew** ("אימייל חדש") — felt the banner-dies-on-nav pain firsthand (this motivates the banner feature). Confirmed login via snapshot/tabs instead.
- **Gate A on the warmed session:** export refused w/o grant (`GRANT_REQUIRED`) → requested (agent response carried NO link) → Roi approved in-browser → exported **77 cookies** incl. all Google auth cookies (SID/HSID/SSID/SAPISID/APISID/__Secure-1PSID/3PSID/1PSIDTS/3PSIDTS/LSID/OSID) → second export refused (single-use) → audit `requested→granted→used`.
- **Step F proof:** throwaway Playwright script, brand-new empty context, `addCookies(77)`, goto Gmail → landed `mail.google.com/mail/u/0/` logged in as roionly9. Screenshot `/tmp/fresh-browser-gmail.png` (kept). **Honest nuance:** Google DID detect the new login (security-alert email in the inbox) but did NOT invalidate the session — detection ≠ blocking (data point for 5d stealth).
- Deleted the live-token files (`/tmp/scratch-cookies.json`, `/tmp/prove-cookies.js`) for hygiene. Saved memory `roi-working-style` (feedback).
- Cleaned up at /next: closed the scratch session, stopped the server, verified no lock.

### User decisions / quotes
- Decision: wipe `scratch` fully (whole profile) for a clean start; warm via Google/Gmail not Instagram; Option 1 = finish the cookie test first, banner feature next session.
- Quote: "clean all cookies from all profiles. i want to start frash"
- Quote: "why should we log into instagram then?"
- Quote: "for the missing banner - make it so when the page nevigation distroys it the agent need to 'feel' the page switch and reshoot the banner so the user can confirm"
- Quote: "we will fix the banner in the /next session"

### Agent decisions / assumptions / rationale
- Used `resumeOn` (auto-detect) for the navigating Google login because the banner dies on nav; it missed on Hebrew UI → confirmed login manually. This is the exact pain the banner feature fixes (re-inject lets the human confirm, no language-specific signal needed).
- Chose Gmail as warm+mine target (forces a real login; inbox is the most visceral Cookie-Mine proof).
- Deleted /tmp token files post-proof; stopped session+server at /next to avoid stale locks.

### Files read or touched
- Read: `src/commands/export-cookies.ts`, `src/transport/routes.ts` (resume routes), `docs/gate-a-test-walkthrough.md`.
- Touched (NON-repo): `/tmp/fresh-browser-gmail.png` (kept evidence); memory `roi-working-style.md` + `MEMORY.md`. **No repo source changes this session.**

### Open threads / unresolved questions
- **Banner re-inject feature NOT started** — next session. Approach: read `await-human.ts` / `pause-registry.ts` / `pause-banner.ts` + how the session exposes the Playwright page; attach a `framenavigated`/`load` listener while a pause is active; re-inject the banner on the new page; remove the listener on resume/timeout; avoid double-inject / listener leaks.
- `scratch` now holds a fresh Gmail login saved to disk — may or may not still be valid next session (Google sessions expire). `primary` does NOT exist on disk.
- Pre-existing UNCOMMITTED tracking edits (active/next/log/tasks) + the 2026-06-15 housekeeping remain uncommitted; fold into the next `/stop`.

### Next action
- Next session: implement the **navigation-survivable resume banner** (re-inject on `framenavigated`). Start read-only (pause/banner code) → short plan → get Roi's approval → implement + test.

### Next session should read
- `journal/context/active.md`, this `next.md` entry
- `src/commands/await-human.ts`, `src/commands/pause-registry.ts`, `src/browser/pause-banner.ts`, `src/transport/routes.ts` (await-human + resume routes)
- `journal/ops/tasks.md` → "Navigation-survivable resume banner — re-inject on framenavigated"

### Risks / blockers
- Banner feature touches the core pause/await-human mechanism (core-stability / UI-readiness class) — test carefully; no double-inject, no leaked page listeners.
- Headed server start needs `WAYLAND_DISPLAY`/`DISPLAY`; stop the server by pid from `endpoint.json` (graceful SIGINT leaves a harmless stale `endpoint.json`, rewritten on next start).
- NEVER point cookie-export at a real personal profile — `scratch` only (and `primary` doesn't exist on disk anyway).
