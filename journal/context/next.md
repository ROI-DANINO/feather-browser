# Next — Context Bridge

_Empty active buffer. Prior entries through 2026-06-08 were consumed by the `/stop` on 2026-06-08 (v1 Instagram test complete)
and archived to `journal/archive/next/2026-06-08/0345-stop-bundle-v1-instagram-test-complete.md`._

---
## 2026-06-08 05:31 — Pause-for-Human primitive (built) + on-page Resume banner

### Session pointer
- Roadmap/session pointer: Phase 4a / Feather v1. NEW v1 sub-feature inserted **before** the v1
  Instagram test: a human-in-the-loop "pause for a human" primitive (the thin, ungated precursor to
  the v2 MFA Handler). Not yet reflected in ROADMAP.md/tasks.md (do at next `/stop`).

### Summary
- Decided (brainstorm) and **built + committed** a pause-for-human primitive: agent calls
  `await-human`, which blocks until the human clicks Resume, an optional `resumeOn` signal fires, or
  timeout. Backbone = explicit human resume; auto-detect = optional accelerator.
- Added an **on-page Resume banner** (per Roi's request) so the pause is visible on the working page,
  not a hidden tab. Final resume mechanism is a **client-side DOM flag polled over CDP** (no page→
  localhost network call — avoids Chromium Private Network Access / CORS / new-tab problems).

### Completed
- 6 TDD commits on `dev` (tip `5d7a9b8`): types+events, pause-registry (single-use token),
  AwaitHumanHandler (races human/signal/timeout), resume page templates, routes
  (`POST /await-human` authed; `GET`/`POST /resume` token-in-query, human-facing HTML), api docs.
- Banner commits: on-page banner + urlencoded parser; then final **DOM-flag + CDP-poll** version.
- Tests green: 15 unit + integration (banner appears, removed on resume, `banner:false` clean,
  route urlencoded POST works). Full unit 226 pass (1 PRE-EXISTING flake: `continuity.test.ts`,
  confirmed failing at base `cbd88f3` — NOT ours). Full integration 47 pass.
- Verified the HTTP loop live (curl) earlier incl. 6 edge probes (double-resume, bad/no token,
  timeout, 401 no-token, 400 no-reason). Roi clicked the **earlier form-banner** live and it worked
  (he confirmed) — but disliked the confirmation opening a **new tab**.

### User decisions / quotes
- Decision: build a **thin pause/resume helper** before the IG test (not the full v2 MFA Handler).
- Decision: resume trigger = **explicit "I'm done" backbone + optional auto-detect** ("i think i
  want both, help me settle this").
- Decision: explicit channel = **on-page banner**, **one-click inline** (not open-a-tab).
- Quote: "for that a banner will work better than a new tab as well" (→ killed the new-tab confirm).
- Quote: "it feels like you are looping on me / maybe we sould run next command and resume on a frash
  chat?" (→ this bridge; stop the iteration churn).
- Quote: "stop background test it, if its an interactive feature test it with me in the loop."

### Agent decisions / assumptions / rationale
- Off-page resume route deliberately drops the API token (browser click can't send the header);
  guarded by a single-use, unguessable per-pause token (prefigures v2 `humanToken`). v1 throwaway
  scope; v2 gate (Origin/Host/CSRF) formalizes it.
- Banner default ON for v1 usability; `banner:false` keeps stealth-safe off-page-only. v2 should flip
  default / make conditional on sensitive sites. Banner injected only while paused, removed before
  automation resumes (narrow injected-DOM window).
- Final banner uses a DOM flag + CDP poll because EVERY page→127.0.0.1 path is PNA-blocked
  (`fetch(no-cors)`, hidden-iframe form POST). Only top-level `_blank` nav works but opens a tab.

### Files read or touched
- Touched (new): `src/commands/pause-registry.ts`, `src/commands/await-human.ts`,
  `src/transport/resume-page.ts`, `src/transport/server-info.ts`, `src/browser/pause-banner.ts`,
  `tests/unit/commands/{pause-registry,await-human}.test.ts`,
  `tests/unit/transport/resume-page.test.ts`, `tests/integration/await-human.integration.test.ts`,
  `docs/specs/2026-06-08-pause-for-human-{design,plan}.md`.
- Touched (edit): `src/sessions/types.ts`, `src/logs/events.ts`, `src/transport/sse.ts`,
  `src/transport/http.ts`, `src/transport/routes.ts`, `docs/api-reference.md`.

### Open threads / unresolved questions
- **NOT yet verified live with Roi:** the FINAL banner (DOM-flag/CDP-poll) — Roi only clicked the
  earlier form version. The integration click-test exercises the new path headless, but Roi wants to
  click it himself in a headed window (no new tab this time).
- ROADMAP.md / tasks.md / active.md don't yet list this pause-for-human sub-feature (do at `/stop`).
- `server-info.getBaseUrl()` is now only used by the off-page absolute-URL composition path (banner
  no longer needs it) — fine, leave it.
- Stray untracked `WhatsApp Video 2026-06-08 at 02.15.45.mp4` in repo root (left alone).

### Next action
- **Live interactive test WITH Roi:** start `npm run dev`, launch a **headed** session
  (`chromium-headed-cdp`), navigate to a real page (e.g. example.com), call `await-human` (banner on);
  Roi clicks **Resume ▸** in the window; confirm it resumes with **no new tab**. Then proceed to the
  real v1 Instagram test.

### Next session should read
- `docs/specs/2026-06-08-pause-for-human-design.md` (design + all iteration addenda)
- `docs/specs/2026-06-08-pause-for-human-plan.md` (build plan)
- `src/commands/await-human.ts`, `src/browser/pause-banner.ts`, `src/commands/pause-registry.ts`
- `docs/roadmap/v1.md` (the IG test this precedes)

### Risks / blockers
- Dev-server lifecycle was fiddly this session: do NOT use `pkill -f "ts-node src/index"` (it matches
  its own shell → kills the command, exit 144). Kill by pid from `endpoint.json` instead. Port is
  OS-assigned — read `baseUrl` with a **space-tolerant** grep: `grep -o '"baseUrl": *"[^"]*"'`.
- Headed window visibility depends on the SERVER process having the desktop display env; the server
  must be started from a shell that has `WAYLAND_DISPLAY`/`DISPLAY` (Roi's terminal is safest).
- `continuity.test.ts` is a pre-existing flake — ignore it; not from this work.

---
## 2026-06-08 — Live banner test PASSED + two deferred fixes (Roi's asks)

### Live banner test — DONE, PASS
- Roi clicked **Resume ▸** in a real headed window (disposable session on example.com, server :41357).
  `await-human` returned `resumedBy:"human"` (~45s); **page count stayed 1 (no new tab)**; banner
  removed on resume (confirmed by before/after screenshots). This closes the only open thread on the
  pause-for-human primitive (the FINAL DOM-flag/CDP-poll banner is now verified live with Roi).

### Roi's two asks — DEFERRED to a future focused pass (do NOT let feature work "absorb" them)
1. **Resume CONFIRMATION flashes too fast.** After clicking Resume, the confirmation state should
   **linger ~1 second** before it disappears, so the human sees it registered. UX tweak to the resume
   confirmation (banner removal / confirmation render in `src/browser/pause-banner.ts` +
   `src/transport/resume-page.ts`). Small.
2. **Bug: disposable `chromium-headed-cdp` close throws `ENOTEMPTY`.** The profile `rmdir` races
   Chromium's exit flush (`Preferences` + `.org.chromium.Chromium.*` written after rmdir). Session
   closes correctly; only temp-dir cleanup fails → leaks temp dirs (found 2 older leaked dirs in
   `~/.cache/feather/tmp/sessions/`). **Will NOT be fixed by Identity/MFA/Stealth/shell work** — it's an
   isolated race in the disposable close path. Fix = await spawned child `exit` before profile delete,
   + a test. ~20min TDD. Roi leans "fix it." Only triggers on **disposable** headed-CDP — persistent
   profiles (the IG test) are unaffected, hence safe to defer.
- **Recommendation recorded:** do #1 + #2 together in one short pass; not today (neither blocks the IG test).

### v1 Instagram test — DRY RUN done, STOPPED before Submit (Roi: "do not make the account, i want to remake this")
- Reached the IG signup form **fully filled** via the HTTP API, then stopped at Roi's request **before
  clicking Submit** — NO account created. Throwaway Google `roionly9@gmail.com` IS now logged in
  (warmed) on the scratch profile. Filled values: email roionly9@gmail.com, pw `Feather2026!test`,
  name "Roi Feather", username `feather_test_roi` (showed green = available), birthday Jan 15 1998.
- Roi wants to **remake the test** with a cleaner approach informed by the findings below.

### KEY LEARNINGS this session (the real payoff — feed these into the remake + v2 MFA Handler + 4a.8)
1. **Banner dies on navigation — CRITICAL for the MFA Handler design.** When the human's action causes
   a full page navigation (e.g. submitting the Google password), the CDP-injected DOM banner is wiped,
   so there's nothing left to click and `await-human` dangles until timeout. The banner-resume backbone
   only works for in-place human steps (CAPTCHA on same page), NOT login/redirect steps. **Fix options
   for v2 MFA Handler (and any remake):** (a) re-inject the banner on `framenavigated` while a pause is
   active; (b) `await-human` auto-detect via `resumeOn`/polling for an end-state; (c) an off-page
   persistent resume surface. The login case is *exactly* the MFA use case — design for it.
2. **No `selectOption` command.** Input surface is click/type/press/wait only — native `<select>`
   elements can't be driven. Didn't block us (IG birthday turned out to be custom `role=combobox`
   widgets, clickable), but it's a real gap. Log under v1 "agent can drive end-to-end".
3. **Element discovery is the main friction.** IG markup has no `placeholder`/`name`, aria-labels only
   on some fields → had to probe the DOM (extract attribute) and fall back to index selectors
   (`input >> nth=N`, `[role=combobox] >> nth=N`). Several round-trips just to find fields. **Strong
   input for Session 4a.8 / "agent drives end-to-end":** Feather needs an a11y/DOM snapshot that lists
   interactive elements with stable handles, so the agent isn't guessing selectors. This would have cut
   the whole signup to a few calls.
4. **`extract` crashes on multi-match selectors** (Playwright strict-mode violation → empty 500 body,
   not a coded error). Minor bug: should return first match or a clear `MULTIPLE_MATCHES` error. Log it.
5. **Banner test (earlier) PASSED live** + the two earlier deferred fixes still stand (confirmation
   flashes too fast → linger ~1s; disposable headed-cdp `ENOTEMPTY` cleanup race).
6. **Positive:** the end-to-end agent-driving *works* — Google account-chooser → password handoff →
   full IG signup form filled, all over the local HTTP API in a real warm headed session. The friction
   is element-discovery + the navigation-resume gap, not the core driving.

### State at stop
- Server running :41357. Scratch headed session `ses_4caf433ee4` still OPEN with the filled-but-
  unsubmitted IG form (page `page_3db87eca5a`) + a second tab `page_64a6998396` (instagram.com).
  Throwaway Google logged in. Nothing submitted. Decide at wind-down whether to close the session.

---
## 2026-06-08 06:07 — /next bridge: banner live-test PASSED + IG dry-run (stopped pre-Submit)

### Session pointer
- Phase 4a / Feather v1. Live banner test = DONE/PASS. v1 Instagram test = DRY RUN reached full filled
  signup form, **stopped before Submit (no account)** — Roi wants a smooth filmed remake next session.
  (Detailed learnings + deferred-fix notes are in the two sections directly above this one — read them.)

### Summary
- Verified the pause-for-human banner LIVE with Roi (resumedBy human, no new tab, banner removed).
- Drove a real warm headed scratch session: Google login (human handoff) → IG signup form fully filled
  over the HTTP API; stopped pre-Submit on Roi's call. Surfaced high-value findings for v2/4a.8.

### Completed
- Live banner click test (PASS). Throwaway Google `roionly9@gmail.com` warmed on scratch profile.
- IG signup form filled end-to-end via API (email/pw/name/username-available/birthday). Not submitted.
- Closed scratch session + stopped dev server at wind-down. No account created anywhere.

### User decisions / quotes
- Quote: "stop befoure you actually make the account. i want to remake this... do not make the account"
- Quote: "in the next session ... lets film it again but this time it will run smoothly"
- Quote (autonomy rule): "you are doing everything you can autonomsly ... i step in only if there a
  capcha or somthing you litterly cant handle"
- Decision: remake the IG test next session as a smooth filmed run, using this session's recipe.
- Open question Roi asked: Sonnet vs Opus for the next try (answered in chat: Sonnet fine for a
  recipe-driven filmed RE-RUN; keep Opus if the session also BUILDS the resume/snapshot fixes).

### Agent decisions / assumptions / rationale
- Resolved the dangling Google-login pause by ending the client curl + letting server-side time out
  (banner was gone post-navigation; no token retrievable since SSE doesn't replay).
- Used index/`role` CSS selectors after placeholder + IG `name` targeting both failed (markup opaque).
- Chose disposable profile for the banner test (no warmed jar touched); persistent scratch for IG.

### Files read or touched
- Read: `README.md`, `ROADMAP.md`, `docs/roadmap/v1.md`, `docs/api-reference.md`,
  `src/transport/routes.ts`, `src/browser/modes.ts`, `journal/work/browser/context.md`.
- Touched: `journal/context/next.md` (this), `journal/context/active.md`, `journal/ops/tasks.md`,
  `journal/log.md`. No source/product code changed this session.

### Open threads / unresolved questions
- Decide whether the remake session BUILDS the two enablers first (navigation-survivable resume +
  interactive-element snapshot) or just re-runs with manual workarounds. "Smooth" depends on it.
- Deferred fixes still pending: resume-confirmation linger ~1s; disposable headed-cdp `ENOTEMPTY`;
  `extract` empty-body on multi-match; no `selectOption` command.
- Pause-for-human feature STILL not folded into ROADMAP.md / tasks.md (do at `/stop`).

### Next action
- Fresh chat: plan + execute a SMOOTH filmed v1 Instagram remake. First decide build-fixes-first vs
  run-with-workarounds; reuse the warmed throwaway Google on the scratch profile.

### Next session should read
- This file (esp. the two learnings sections above), `docs/roadmap/v1.md`,
  `docs/specs/2026-06-08-pause-for-human-design.md`, `src/transport/routes.ts` (command/target schema),
  `src/browser/pause-banner.ts` (banner inject — for the navigation-survivable fix).

### Risks / blockers
- Banner dies on navigation → any human step that redirects (login/MFA) breaks one-click resume.
- IG markup has no stable selectors; index-based targeting is brittle across IG redesigns.
- Server lifecycle: kill by pid from `endpoint.json` (never `pkill -f ts-node…`); OS-assigned port,
  read `baseUrl` with space-tolerant grep. Headed window needs the server started from a shell with
  `WAYLAND_DISPLAY`/`DISPLAY` (this session's bg shell had it).

---
## 2026-06-09 00:43 — v1 wrap pass (4a.8 + deferred fixes) + agent operator skills; NEXT = showcase suite

### Session pointer
- Phase 4a / Feather v1. v1 IG test already PASSED (prior session). This session closed the
  remaining small v1 build items and added an operator-skill layer. NEXT = a showcase/eval suite +
  the last v1 feature gaps.

### Summary
- Shipped 4a.8 markdown snapshot + the four deferred IG-test fixes, then built an agent operator
  layer (playbook + 4 skills) so agents drive Feather efficiently. All committed + pushed to origin/dev.
- v1-wrap gap analysis done: only act-human typing cadence + bot self-check remain as real v1
  features; the showcase suite is the natural vehicle to demo breadth.

### Completed
- **4a.8 markdown snapshot** (`43f46bd`/`817f3cb`) — self-contained DOM walker in `page.evaluate()`,
  zero deps, 20k cap, img alt + ordered-list numbering. `snapshot` now returns `markdown`.
- **select-option command** (`23fabd2`) — `POST /v1/sessions/:id/select-option`, native `<select>`.
- **await-human linger ~1s** (`6329ae9`); **disposable ENOTEMPTY cleanup race** fixed (`0e4bd33`,
  await child exit before rmdir); **extract multi-match** behavior test (`54fcc67`, `.first()` already handled it).
- **API docs** (`d500254`); **routes type annotations** (`48079e1`); **ROADMAP 4a.7/4a.8 pointers** (`aed4cdd`).
- **Agent operator layer** (`0c0e7ee`): `docs/agent-playbook.md` (278 lines, whole surface) + skills
  `using-feather-browser` (entry) + `feather-form-filling` + `feather-human-handoff` +
  `feather-data-extraction` + AGENTS.md "Driving Feather (operator skills)" pointer.
- Tests 240/241 (only the pre-existing `continuity.test.ts` flake). Pushed `ba85347..0c0e7ee` to origin/dev.

### User decisions / quotes
- Decision: build the operator playbook + skills THIS session (fresh context), layered structure
  (entry skill + 3 workflow skills + playbook reference).
- Decision: add a focused operator-skills POINTER to AGENTS.md, not the full skill bodies.
- Quote: "i dont want all this masterpice go to waste because agents dont know how to use it properly"
- Quote: "i want to make a tests suit for the user to use the agents on several different tasks to
  mesiure and 'show off' the feather browser abilitys. and check if there are anything else to do to wrap v1"
- Decision: next session = the showcase/eval suite + finish v1 wrap.

### Agent decisions / assumptions / rationale
- Grounded every recipe in the REAL Zod schemas + error codes from `routes.ts` (not memory).
- Skill descriptions written with trigger phrases so the right skill auto-loads (entry skill triggers
  on any Feather-driving task; workflow skills on their own keywords).
- Corrected an earlier mis-read: the IG test was COMPLETED (account `feather_test_roi`, social errand),
  per the 2026-06-08 STOP log entry — NOT just the dry-run. So "agent drives end-to-end" is already ✅.

### Files read or touched
- Touched (new): `docs/agent-playbook.md`, `skills/using-feather-browser/SKILL.md`,
  `skills/feather-form-filling/SKILL.md`, `skills/feather-human-handoff/SKILL.md`,
  `skills/feather-data-extraction/SKILL.md`.
- Touched (edit): `AGENTS.md`, `journal/ops/tasks.md`, `journal/context/active.md`, `journal/log.md`,
  `journal/context/next.md` (this). (Source + tests from this session were committed in the prior 9-commit chain.)
- Read: `src/transport/routes.ts`, `src/browser/modes.ts`, `docs/api-reference.md`, `docs/roadmap/v1.md`,
  `ROADMAP.md`, `journal/ops/tasks.md`, `journal/context/active.md`, existing `skills/*/SKILL.md`.

### Open threads / unresolved questions
- **ROADMAP.md still shows 4a.8 as 🔵 in progress** — flip to ✅ next session.
- Remaining v1 feature gaps: **act-human typing cadence** + **bot self-check (read-only diagnostic)**.
  Decide: ship in v1, or defer to v2 stealth (5d / learn-your-behavior).
- Navigation-survivable resume (re-inject banner on `framenavigated`) is OPEN — v2 MFA Handler core.
- IG confirmation-input quirk (ignores fill/type; needs Shift+Tab + press) not fixed — workaround only.

### Next action
- **Brainstorm + build the showcase/eval suite:** pick several real, varied agent tasks (e.g. a
  read/summarize errand, a form-fill, a multi-step navigation, a data-extraction) that exercise the
  new skills, with a way to MEASURE success (pass/fail + timing/steps) and to "show off" (recording-
  friendly). Then knock out the last v1 gaps (act-human cadence, bot self-check) or consciously defer.

### Next session should read
- `journal/context/active.md`, `journal/ops/tasks.md`, `docs/roadmap/v1.md`
- `docs/agent-playbook.md` + `skills/using-feather-browser/SKILL.md` (the new operator layer to demo)
- `docs/sessions/4a.10-social-research-triage.md` (optional social-research errand ideas)

### Risks / blockers
- Recorder/recording was the blocker on 4a.9 — the "show off" half of the suite may hit the same wall;
  decide capture method early.
- Server lifecycle: kill by pid from `endpoint.json`; read baseUrl with space-tolerant grep; headed
  windows need `WAYLAND_DISPLAY`/`DISPLAY` in the server's shell.
- `continuity.test.ts` pre-existing flake — ignore.
- Scratch profile holds the live `feather_test_roi` IG + warmed Google — handle carefully in demos.

---
## 2026-06-09 — Showcase/eval suite brainstorm + design spec

### Session pointer
- Phase 4a / Feather v1. Brainstorm-only session — no code. Spec written and committed. Pending user review.

### Summary
- Brainstormed and designed the 10-task showcase/eval suite through 5 clarifying questions.
- Spec committed at `docs/specs/2026-06-09-showcase-eval-suite-design.md`. User will review next session.
- Headless warmed sessions filed as v2 feature in `docs/roadmap/v2.md`.

### Completed
- **Showcase/eval suite design spec** (`f76a59a`) — 10 tasks (3 easy + 3 medium + 4 hard), two-pass
  model (interactive discovery pass → filmable shell script), B+C measurement (assertions + screenshots
  + results table). Committed to `docs/specs/2026-06-09-showcase-eval-suite-design.md`.
- **v2 roadmap addition** (`de54f69`) — "headless warmed sessions" feature added to `docs/roadmap/v2.md`.

### User decisions / quotes
- Decision: audience = both internal measurement + external GitHub/LinkedIn artifact (C).
- Decision: scope = B+C mix — medium breadth + stress cases (~10 tasks).
- Decision: sites = C — public headless for easy/medium + warmed scratch profile for 2 hard tasks.
- Decision: measurement = B+C — assertions where clear, screenshots for visual tasks, results table.
- Decision: format = A+C — shell script (`examples/showcase.sh`) for the polished artifact; interactive
  agent session first (like the IG test) for the discovery pass.
- Decision: suite shape = real-world errand stories + stress cases folded in at the end.
- Decision: hard tasks must match/exceed IG test complexity — original H1–H7 public tasks were "not impressive."
- Decision: drop H2 (Gmail search) + H5 (Gmail draft) — warmed Google account is fresh/clean, no emails.
- Decision: H1 → find next Israeli public holiday → create Google Calendar reminder (cross-site errand).
- Quote: "way better" (on revised hard task tier matching IG test complexity)
- Quote: "an actual feature would be running headneeding tasks headless... but i wont throw sticks in your wheels we can try this harder tests and feature i want in v2"
- Quote: "ill review it in the /next session"

### Agent decisions / assumptions / rationale
- Recommended running the interactive discovery pass BEFORE building the script — same pattern as the IG test.
- Renumbered H tasks (dropped H2/H5 gaps) to H1–H4 in the spec for clarity.
- Placed spec in `docs/specs/` (not `docs/superpowers/specs/`) — the latter is gitignored.

### Files read or touched
- Read: `README.md`, `ROADMAP.md`, `journal/context/active.md`, `journal/ops/tasks.md`,
  `journal/ops/phase.md`, `journal/context/next.md`, `journal/log.md`, `docs/roadmap/v2.md`.
- Touched (new): `docs/specs/2026-06-09-showcase-eval-suite-design.md`.
- Touched (edit): `docs/roadmap/v2.md`, `journal/context/next.md` (this), `journal/context/active.md`,
  `journal/ops/tasks.md`, `journal/log.md`.

### Open threads / unresolved questions
- **Spec review pending** — user will review `docs/specs/2026-06-09-showcase-eval-suite-design.md` next session.
- After review approval → invoke writing-plans skill → implementation plan.
- ROADMAP.md still shows 4a.8 as 🔵 — flip to ✅ (carried over from prior session).
- act-human typing cadence + bot self-check: ship in v1 or defer to v2? (answer after showcase Pass 1).

### Next action
- Fresh chat: user reviews `docs/specs/2026-06-09-showcase-eval-suite-design.md` → approves or requests
  changes → invoke writing-plans skill to create the implementation plan.

### Next session should read
- `docs/specs/2026-06-09-showcase-eval-suite-design.md` (the spec to review)
- `journal/context/active.md`, `journal/ops/tasks.md`

### Risks / blockers
- Hard tasks (H1–H4) require headed mode + warmed scratch profile. Server must start from a shell with
  `WAYLAND_DISPLAY`/`DISPLAY`.
- Google Calendar creation (H1) may be brittle (date pickers) — fallback: just extract holiday + screenshot.
- `continuity.test.ts` pre-existing flake — ignore.
