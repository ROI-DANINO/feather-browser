# Next — Context Bridge

_Empty active buffer. Prior entries through 2026-06-08 were consumed by the `/stop` on 2026-06-08 03:55
and archived to `journal/archive/next/2026-06-08/0355-stop-bundle-v1-v2-v3-roadmap.md`._

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
