# Next — Context Bridge

_Last entry: 2026-06-09 ~11:55 UTC+3, session: showcase M+H tier discovery + showcase.sh full build_

## `/next` entry 1 — 2026-06-09 ~08:17

### This session did
- `/start` — read state; Stage 2 PASS confirmed, Stage 3 is the next action
- **Mistake:** Launched the existing warmed scratch profile instead of wiping it first — Roi caught it immediately. Wiped and reverted.
- **Fresh headed scratch launched:** `ses_fc3cb48427`, clean profile, one blank tab
- **Google signup name step:** PASS — typed "Feather" + "Dev", clicked Next, advanced to birthday/gender
- **Google birthday/gender step: FAIL** — Material Design custom dropdowns resist all approaches:
  - `select-option` → requires native `<select>`, these are JS `role=listbox` web components
  - `click` on `[aria-label=Month]` → `ELEMENT_NOT_ACTIONABLE` (covered/disabled/off-screen)
  - `press Enter/Space` on focused Month → fires but no visible state change
- **Subagent dispatch:** `feather.operator` dispatched with full context + strategies — returned `Failed` (no output detail to parent)
- **Session record written:** `journal/ops/sessions/stage3-warming-sacrificial-accounts-20260609-0817.md`

### Current state
- Feather running: PID 88151, `http://127.0.0.1:41245`
- Scratch profile: FRESH (no cookies, no accounts — just wiped)
- Session `ses_fc3cb48427`: RUNNING, headed, on Google birthday/gender step (name filled, birthday not)
- No commits in this session

### Root cause of the dropdown failure
Google signup uses Material Design `<div role=listbox>` web components, not native `<select>`. Playwright's built-in click/select-action timeouts on them. Keyboard (Enter/Space) fires but doesn't produce snapshot-visible state.

### What we think will work next time (unproven)
1. **Read `docs/agent-playbook.md` first** — check for a JS `evaluate` endpoint (there isn't one listed in the quickstart, but the agent-playbook may document one)
2. **Keyboard-driven Material dropdown:** Tab → Space to open → type first letter "A" → arrow to "April" → Enter
3. **If no evaluate endpoint:** use `type sequential` with "Apr" after focusing the component
4. **`await-human` at phone verification** (built in 4a.8, never used live for account creation)
5. **Dispatch `feather.operator` only after a working recipe exists** — don't send it into an unknown form

### Next action
Resume this session: read `docs/agent-playbook.md` for the full API surface → try keyboard dropdown approach → complete Google signup → Instagram signup → warm both accounts on scratch.

### StopRules / constraints
- No commits planned (all Feather state is runtime + profile disk)
- Phone/SMS verification is a HARD STOP — use `await-human`, never fabricate

---
## 2026-06-09 09:11 — Stage 3 root-cause SOLVED + pi model lineup retuned (drop qwen)

### Session pointer
- Roadmap/session pointer: Phase 4a / showcase suite Stage 3 (rebuild scratch + warm sacrificial Google+IG). Same thread as the 08:17 entry above — but the dropdown "wall" is now **disproven as a tool/capability gap**.

### Summary
- **The Stage 3 dropdown "wall" was never a missing tool.** Proven on a throwaway `probe` workspace: Google's Material birthday dropdown is beatable with Feather's EXISTING commands. The previous operator just used the wrong locator + never read its own playbook.
- **It's a model-tier problem.** Retuned the pi team lineup off qwen/glm onto Codex (gpt-5.5/5.4) + Gemini, committed `2c745c6`. Untested in pi yet — Roi will run it.

### Completed
- **PROBE (settles the 08:17 open questions):** launched headed `probe` workspace, walked Google signup to the exact birthday step. Findings, all verified:
  - `select-option` → fails (native `<select>` only; these are `role=combobox`).
  - css `[aria-label="Month"]` click → `ELEMENT_NOT_ACTIONABLE` (matches the covered wrapper).
  - **WINNING RECIPE:** `{by:"role", role:"combobox", name:"Month"}` click → opens; `{by:"role", role:"option", name:"April"}` → selects. Gender same. Year = plain `#year` text input.
  - **No `evaluate` endpoint exists and none is needed.** (Answers the 08:17 "can a session run JS?" question: no public route, and irrelevant.)
- **The recipe was already in the docs:** `docs/agent-playbook.md:114` literally says custom `role=combobox`/`role=listbox` widgets are "not `<select>` — drive those with `click` instead," and role locators are priority #1. The failure was the model not reading/applying it.
- **CORRECTION to prior notes:** the *session record / next.md* used a wrong Target shape (`value`); the REAL schema (`src/transport/routes.ts:62`) is `{by, selector|text|role+name|testId}` + `at` for nth. The `feather-operator` skill + agent-playbook are CORRECT; only the journal prose was wrong.
- **pi lineup retuned + committed `2c745c6`** (see table below). Renamed agent `opus-reviewer` → `reviewer` (file + chain step).
- Probe session closed, throwaway `probe` profile wiped. **`scratch` left clean/fresh for the pi run.**

### User decisions / quotes
- Decision: **Do NOT have Claude pass the test — the pi setup must win it honestly.** No spoon-feeding the Google recipe into the skill (would lower the bar / violate Testing Honesty).
- Decision: **Model lineup = Codex sub + OpenRouter good-enough + Gemini, drop qwen.** "good enough" not top-tier.
- Decision: orchestrator stays `openai-codex/gpt-5.5` with **no fallback** (pi default model takes no fallback list — confirmed from schema).
- Quotes: "i dont want you to pass this test i want the pi setup to win this test" · "i dont want top tier models i want good enugh models.. thats frustrating" · "it also didnt type in humanlike manner, i didnt like qwen at all" · "codex + openrouter good enugh models like glm5.1 minimax3 and gemini models" · "and mix and match throgh all roles"

### Final pi lineup (committed 2c745c6)
| Role | Model | Fallback |
|---|---|---|
| orchestrator (`.pi/settings.json`) | `openai-codex/gpt-5.5` | — (none; unsupported) |
| operator | `openai-codex/gpt-5.4` | `openrouter/z-ai/glm-5.1` |
| planner | `openrouter/minimax/minimax-m3` | — |
| coder | `openrouter/z-ai/glm-5.1` | — |
| validator | `google/gemini-3.1-pro-preview` | `openrouter/z-ai/glm-5.1` |
| reviewer | `google/gemini-3.1-pro-preview` | `openrouter/anthropic/claude-opus-4.8` |

### Agent decisions / assumptions / rationale
- Used `probe` workspace (not `scratch`) for the mechanic test so the real test identity stayed untouched.
- `openai-codex/gpt-5.4` string format inferred from Roi's global config (`provider openai-codex`, `defaultModel gpt-5.5`) + pi's known model list (`gpt-5.4/5.5/codex/codex-max`). First pi run confirms it resolves; else falls back to glm-5.1.
- Did NOT build the "humanlike typing" Feather feature — Roi said current typing is fine; the bad cadence was qwen's behavior, not Feather's keystrokes. (Feather's `type` IS constant-cadence only — `mode: fill|sequential` + constant `delayMs`, no jitter — so that v1 "act-human cadence" gap is still real and parked, just not blocking.)
- Pi facts verified from source/docs: subscriptions = ChatGPT-Codex / Claude-Pro-Max / Copilot only (NO Gemini sub); Gemini = metered API key (`GEMINI_API_KEY`, set); `gemini-3.5-flash` does NOT exist in pi 0.79.0 (only `gemini-3.1-pro-preview`); orchestrator default model has no fallback field.

### Files read or touched
- Read: `src/transport/routes.ts` (Target/Wait schemas), `src/commands/{press,select-option}.ts`, `docs/agent-playbook.md`, `journal/work/automation/context.md`, pi docs (`providers.md`, `settings.md`), `~/.pi/agent/settings.json`+`auth.json`
- Touched (committed `2c745c6`): `.pi/settings.json`, `.pi/agents/operator.md`, `.pi/agents/validator.md`, `.pi/agents/reviewer.md` (renamed from `opus-reviewer.md`), `.pi/chains/showcase-run.chain.md`

### Open threads / unresolved questions
- `openai-codex/gpt-5.4` string unverified until first pi run (falls back to glm-5.1 if pi doesn't expose it).
- Whether gpt-5.4 operator wins Stage 3 honestly off the general playbook (the whole point of the run).
- Lineup committed but **NOT pushed** to origin/dev.

### Next action
- **Roi runs Stage 3 in pi** with the new lineup: rebuild fresh `scratch` → operator (gpt-5.4) creates/warms sacrificial Google + IG. Let it win the dropdown on its own (general playbook only). `await-human` at SMS/phone walls.

### Next session should read
- `journal/ops/sessions/stage3-warming-sacrificial-accounts-20260609-0817.md` (prior attempt) — but note its "root cause" is superseded by THIS entry's proven recipe.
- `docs/agent-playbook.md` (the recipe the operator must apply)
- `.pi/` agent files + `.pi/chains/showcase-run.chain.md`

### Risks / blockers
- Feather server: I started a fresh one this session (`http://127.0.0.1:35853`, `/health` ok) — may or may not still be alive when Roi runs pi; relaunch with `npm run dev` (needs `WAYLAND_DISPLAY`/`DISPLAY` for headed) if dead. **Health route is `/health`, NOT `/v1/health`.**
- `scratch` is currently CLEAN/fresh (intended). Stage 3 starts from there.
- Phone/SMS verification = HARD STOP → `await-human`, never fabricate.

---
## 2026-06-09 ~09:25 — Manual scratch warmup reached Google phone wall; cleaned; next try MiniMax orchestrator

### Session pointer
- Same Phase 4a / showcase Stage 3 thread: rebuild fresh `scratch` and warm sacrificial Google+IG for medium/hard showcase tasks.

### This mini-session did
- User asked to warm the fresh scratch session.
- Read `feather-operator` skill + `docs/agent-playbook.md`, discovered Feather server alive at `http://127.0.0.1:35853` (`/health` ok).
- First launch showed `scratch` was **not fresh** (old Google tabs restored). Closed immediately.
- With user approval, wiped `/home/roking/.local/share/feather/profiles/scratch/profile` and launched fresh headed persistent scratch:
  - session `ses_0cdf20358a`
  - workspace `scratch`
  - mode `chromium-headed-cdp`
  - started at Chrome new tab only.
- Drove Google signup manually through Feather:
  - name step PASS (`Feather Dev`)
  - birthday/gender PASS with role locators (`combobox` Month/Gender + `option` April/Rather not say)
  - username step PASS by selecting Google's suggested `featherdev664@gmail.com`
  - password step typed generated password into both fields.
- Google then advanced to **phone/device verification wall** (`/mophoneverification/initial`): "Google needs to verify some info about your device or phone number... preventing abuse from computer programs or bots." This is a legitimate hard wall, not a Feather failure.

### Cleanup performed (per user request)
- Closed `ses_0cdf20358a` via `DELETE /v1/sessions/:id`.
- Removed the aborted scratch profile directory and recreated it empty.
- Removed transient generated credential file: `/home/roking/.local/state/feather/scratch-warmup-credentials.json`.
- **Scratch is clean/empty again.** No usable Google credentials retained. The attempted suggested email should be treated as burned/unreliable; do not depend on it.

### User decision
- Roi was pleased with the manual run, but wants the actual next Stage 3 attempt to test **MiniMax-M3 as orchestrator**.
- `.pi/settings.json` changed (uncommitted) from Codex orchestrator to:
  - `defaultProvider`: `openrouter`
  - `defaultModel`: `minimax/minimax-m3`
- Operator remains `openai-codex/gpt-5.4` with GLM fallback unless the next session changes it.

### Next action
- Fresh chat/session: run Stage 3 again through pi with MiniMax-M3 orchestrator. Start from the now-empty `scratch` profile. Let the pi team operate honestly from the general playbook; do not spoon-feed site-specific recipe unless Roi explicitly changes the test.
- Expect phone/SMS/device verification as a likely hard wall; use human handoff / await-human and report `PARTIAL` honestly if Google blocks account creation.

### StopRules / constraints
- No commits were made for this mini-session.
- Do not recover deleted generated password; it was intentionally removed.
- Do not use personal/valuable accounts for this Stage 3 test.

---
## 2026-06-09 ~09:35 — Housekeeping: commit orchestrator swap + notebooklm pack; runway verified

### Session pointer
Same Phase 4a / showcase Stage 3 thread. The 09:25 cleanup + MiniMax-M3 switch were
uncommitted when this session started. This session did the housekeeping so the next
pi run starts from a clean, committed runway.

### This session did
- Confirmed via `/start` that the only uncommitted changes were the orchestrator swap
  (`.pi/settings.json` → MiniMax-M3) and the untracked `docs/feather_notebooklm_pack/`
  (7-doc NotebookLM source pack, ~32K, accurate to current state). User picked option A:
  commit both + run Stage 3 in pi.
- **Commit `dcb30a6` — `chore(pi): swap showcase orchestrator to MiniMax-M3 for Stage 3 retest`** —
  committed `.pi/settings.json` only, with a body explaining the rationale (Codex orchestrator
  lost the dropdown at 08:17; proven on probe that the recipe was in the playbook and the gap
  was model-tier, not Feather; now testing whether a smaller model wins honestly off the
  general playbook). Operator/planner/reviewer/validator unchanged from `2c745c6`.
- **Commit `09bb3e5` — `docs(notebooklm): add 7-doc source pack for Feather infographic generation`** —
  the 7-doc pack (overview / architecture / user-flow / capabilities / roadmap / safety /
  infographic-brief) + README. All docs are grounded in current state, no hype language, and
  pack lives under `docs/` so it is discoverable but doesn't pollute the top level.
- **Pruned the 44MB `profile.wiped-20260609-091824/`** leftover in `~/.local/share/feather/profiles/scratch/`
  from the 09:25 manual cleanup. Outside the repo, no commit. scratch is now 4K total.
- **Verified runway:** Feather server alive (PID 133216, 45m uptime, 420MB RSS,
  `http://127.0.0.1:35853`); `/health` ok; `/v1/sessions` → `[]`; token at
  `/run/user/1000/feather/run/control-token` (64 chars); scratch profile clean
  (`profile/` empty + `workspace.json` only).

### Repo state
- `dev` is now **5 ahead** of `origin/dev` (`769c050` `fa38e36` `2c745c6` `dcb30a6` `09bb3e5`).
  All clean, on `dev`, **not pushed** — push whenever Roi is ready.
- Uncommitted: only journal files (`active.md`, `next.md`, `log.md`, `tasks.md`) — the live
  bridge. Consistent with the NEXT-only pattern. Will fold into the next `/stop`.

### `/next` missed, then corrected
User asked "did you run /next?" — honest answer was no, the housekeeping commits landed
without first appending a bridge entry. Doing the `/next` work now (this entry + light
touch to `active.md` and `tasks.md`). No commit, no session file, no archive — this is
exactly what `/next` is for: the short bridge so the next `/start` boots on current state.

### Next action
- **Roi runs Stage 3 in pi** with the committed MiniMax-M3 lineup (`dcb30a6`):
  orchestrator `minimax/minimax-m3`, operator `openai-codex/gpt-5.4` → `glm-5.1` fallback,
  planner `minimax/minimax-m3`, validator + reviewer `google/gemini-3.1-pro-preview`,
  coder `openrouter/z-ai/glm-5.1`.
- Operator uses ONLY the general playbook (`docs/agent-playbook.md` + the 4 skills) — no
  spoon-feeding the birthday-dropdown recipe. That is the whole point of this run.
- Hard stops at phone/SMS/CAPTCHA/device-verification/MFA → `await-human` + on-page Resume
  banner; report `PARTIAL` honestly if Google blocks account creation.
- If MiniMax-M3 loses, revert with `git revert dcb30a6` (or `git reset --hard 2c745c6` after
  committing any new work) and try the Codex orchestrator. The retest is what we learn from.

### Risks / blockers
- `/run/user/1000/feather/run/control-token` is read-protected but Roi's session owns it —
  pi needs the same effective access (env var or file read).
- The 5-ahead commits to `origin/dev` are local; if Roi pushes, remember
  `08a040b5`/`a2a27c0`/`b35b492c`/`bbec46b`/`35b492c` from the prior showcase session are
  also on `dev` ahead of origin if not yet pushed — check `git log origin/dev..dev --oneline`
  before pushing to make sure the intent is clean.
- `featherdev664@gmail.com` from the aborted 09:25 warmup is burned — do not depend on it.

### Files read or touched (this session)
- Read: `docs/feather_notebooklm_pack/{README,01..07}.md`, `journal/{context/{active,next},log,ops/tasks}.md`
- Touched (committed): `.pi/settings.json` (`dcb30a6`), `docs/feather_notebooklm_pack/*` (`09bb3e5`)
- Touched (uncommitted, this `/next`): `journal/context/active.md`, `journal/context/next.md`,
  `journal/log.md`, `journal/ops/tasks.md`
- Touched (outside repo): `~/.local/share/feather/profiles/scratch/profile.wiped-20260609-091824/` (pruned, 44MB)

---
## 2026-06-09 ~09:55 — Audited pi Stage 3 live, parked pi; next = re-warm scratch with REAL accounts in a fresh Claude instance

### Session pointer
- Same Phase 4a / showcase Stage 3 thread. This was a parallel **audit + live-watch** session while Roi ran
  Stage 3 in pi; it ends by **parking pi** and handing the next step to a fresh Claude Code instance:
  re-warm `scratch` with the real Google + IG accounts, then resume the showcase medium/hard tiers.

### Summary
- **Stage 3 pi run = PARTIAL, and it proved the thesis.** Operator (`gpt-5.4` under MiniMax-M3 orchestrator)
  **beat the Material birthday dropdown on its own** off the general playbook (no spoon-feeding):
  `name → birthdaygender → username → password`. Then hit the **legit phone wall** (`/mophoneverification/initial`),
  same as the 09:25 manual run. Confirms the 08:17 "wall" was a model-tier gap, not a Feather gap.
- **Testing Honesty held under pressure.** After Google blocked, the operator pivoted to IG and was about to
  bootstrap IG off the *unverified* Gmail; Roi caught it live in the pi chat; the operator accepted the
  correction, refused to fake it, and reported PARTIAL honestly. IG **not** created.
- **pi is now parked.** Roi resumes in a **new Claude Code instance** with Claude driving Feather directly.

### Completed (this audit session)
- Audited the 4-ahead commits + `.pi/` config against the journal — **lineup matches** (orchestrator
  `minimax/minimax-m3`, operator `gpt-5.4`, coder `glm-5.1`, validator+reviewer `gemini-3.1-pro-preview`).
- Watched the live pi transcript on disk (`~/.pi/agent/sessions/…feather-browser…/2026-06-09T06-31-25…jsonl`)
  — confirmed dropdown win + phone wall + IG pivot + honest PARTIAL closeout, with a 13-shot evidence trail.
- Verified runtime post-run: Feather server PID 133216 alive at `http://127.0.0.1:35853`;
  `/v1/sessions` → `[]` (pi session `ses_a311834952` closed, scratch **unlocked**).

### User decisions / quotes
- Decision: **Park pi for now; resume the suite in a fresh Claude Code instance with Claude driving Feather.**
- Decision: **Re-warm `scratch` with the real Google + Instagram accounts** before resuming the suite.
- Quote: "im closing it up now, we will park pi for now."
- Quote: "i will use the real scratch google and instagram account to resume the test suite with you"
- Quote (Roi steering the pi operator live): "you need a google account to make an instagram account my boy"
- Quote: "i mean with claude code in a new claude instance … you can run next, we need to warm up scratch with real accounts"

### Agent decisions / assumptions / rationale
- Assumed the "real scratch accounts" = `roionly9@gmail.com` (Google) + `feather_test_roi` (IG) from the v1 IG
  test — **UNCONFIRMED by Roi this session** (he redirected to the fresh-instance plan before answering).
  Fresh instance must confirm exact accounts + that passwords are available + who drives login.
- Recommend **wiping the pi half-state first** for a clean base, then logging the real accounts in headed →
  re-warms them → then run medium/hard tiers. (Mixing pi's stuck `featherdev…` signup state with the real
  Google login is messy.)

### Files read or touched
- Read: `journal/context/{active,next}.md`, `journal/ops/{tasks,phase}.md`, `ROADMAP.md`, `journal/log.md`,
  `.pi/settings.json`, `.pi/agents/*.md`, the live pi session transcript, `endpoint.json`.
- Touched (this `/next`): `journal/context/{active,next}.md`, `journal/log.md`, `journal/ops/tasks.md`.
- Throwaway: `/tmp/stage3-watch.sh` (progress watcher; can delete). Evidence: `/tmp/feather-stage3-20260609/00..12*.png`.

### Open threads / unresolved questions
- Exact real accounts + password availability + login driver (hand vs Feather `await-human`) — **ask Roi first.**
- The real Google login may itself hit phone/2FA on a fresh device → `await-human`.
- Small Feather finding surfaced: **no single-tab close route** — `DELETE /v1/sessions/:id/pages/:pageId` → 404;
  only whole-session `DELETE` exists. Log as a minor gap if we want per-tab close.

### Next action
- **Fresh Claude Code instance:** confirm the real accounts with Roi → wipe pi's scratch half-state → launch a
  headed `scratch` session → log in real Google + IG to re-warm → then resume showcase **medium/hard tiers**
  via the clean chain. Phone/SMS/CAPTCHA = hard stop → `await-human`.

### Next session should read
- `journal/context/active.md` (this thread), `docs/agent-playbook.md`, the 4 `skills/feather-*`,
  `docs/specs/2026-06-09-showcase-eval-suite-plan.md` (medium/hard tiers), `examples/showcase.sh`.

### Risks / blockers
- **Do NOT depend on** `featherdev664@gmail.com` or the pi half-state Google account — burned / stuck at phone wall.
- `scratch` on disk right now = **53M of pi junk cookies** (stuck Google signup in `Default/{Cookies,Login Data}`),
  NOT the real accounts. The real warmed identity was wiped 09:25 and its 44M backup pruned — no warmed copy survives.
- Feather server may die before the fresh instance starts → relaunch `npm run dev` (needs `WAYLAND_DISPLAY`/`DISPLAY`).
- **Two journal nits to reconcile at next `/stop`:** (1) `dev` is **4 ahead** of `origin/dev`, not 5 — `fa38e36`
  is already pushed; (2) `active.md` "Key facts" still claims `scratch` holds the warmed accounts — stale since 09:25.

---
## 2026-06-09 10:15 — scratch re-warmed with real accounts (Google + Instagram)

### Session pointer
- Roadmap/session pointer: Phase 4a / showcase suite — scratch re-warm prerequisite for medium/hard tiers

### Summary
- Wiped 53MB junk pi cookies from scratch; launched headed session; re-warmed `roionly9@gmail.com` (Google, user-driven) + `feather_test_roi` (Instagram, agent-driven end-to-end including email verify). Scratch now 88MB, both sessions baked in.

### Completed
- Wiped scratch profile (`~/.local/share/feather/profiles/scratch/`) — junk pi cookies gone
- Session `ses_dd5514f275` launched (`chromium-headed-cdp`, persistent scratch profile)
- Google warmed: user logged in manually; banner disappeared on nav (known deferred issue); resumed via API manually
- Instagram warmed: agent drove full login — dismissed tablet interstitial, filled `feather_test_roi` / `Feather2026!test`, submitted, handled `Check your email` challenge (code `917986` pulled from Gmail tab on scratch), clicked "Save info", session closed cleanly
- Scratch confirmed 88MB — both sessions persisted to disk

### User decisions / quotes
- Quote: "you can absolutely manage this page don't ask me for everything" — don't ask user for things agent can do autonomously
- Quote: "we have to figure out how to make you work faster. you work good but too slow"

### Agent decisions / assumptions / rationale
- CSS `input` (first match) used as fallback when Instagram's dynamic form rejected placeholder/name selectors — worked
- Opened second tab (`page_bb4177a45e`) in the same scratch session to access Gmail for the verification code, reusing the already-warmed Google session — no extra login needed
- `await-human` placed for Google login step (Roi drove manually); Instagram driven fully by agent after that

### Files read or touched
- Read: `journal/context/active.md`, `journal/context/next.md`, `journal/ops/tasks.md`, `journal/ops/phase.md`, `journal/log.md`, `src/transport/routes.ts`, `journal/ops/sessions/v1-instagram-test-complete-20260608-0345.md`
- Runtime touched: `~/.local/share/feather/profiles/scratch/` (wiped + re-warmed, 88MB)
- No commits this session

### Open threads / unresolved questions
- Speed: Roi flagged agent as "too slow" — too many screenshot-verify loops, too much asking before acting. Next session should batch more, shoot first, verify after.
- `dev` is 4-ahead of `origin/dev` (unchanged from prior session — no commits today)
- `active.md` "Key facts" scratch section is now stale (still says `feather_test_roi` IG + `roionly9@gmail.com` — that's correct now, but the "scratch has junk cookies" warning is obsolete)

### Next action
- Run showcase medium/hard tiers — scratch is ready. Launch Feather server if needed (PID 133216 may still be alive at `:35853`), start a new scratch session, kick off the showcase chain via pi.

### Next session should read
- `journal/context/active.md`
- `journal/ops/tasks.md`
- `docs/specs/2026-06-09-showcase-eval-suite-plan.md` (Phases A–D, medium/hard tasks)

### Risks / blockers
- Medium/hard tasks involve warmed sessions — those are now available on scratch
- Phone/SMS walls remain hard stops (`await-human`) — no change
- Speed: agent working too slowly; next session should be more autonomous and batch operations

---
## 2026-06-09 ~11:55 — showcase M+H tier discovery + full showcase.sh build

### Session pointer
- Phase 4a / showcase suite — Phases B (discovery) + C (function build); medium tier verified live

### Summary
- Ran full Pass-1 discovery for M1–M3 (headless) and H1–H4 (headed warmed scratch)
- Built complete `examples/showcase.sh` with all 10 tasks (E1–E3 already existed; M1–M3 + H1–H4 added)
- Ran medium tier live: M1 PARTIAL (DDG CAPTCHA), M2 PASS (httpbin up), M3 PASS

### Completed
- **Pass-1 discovery log written**: `docs/specs/2026-06-09-showcase-pass1-recipes.md` — recipes + lessons for all 10 tasks
- **M1**: PARTIAL confirmed — both DDG endpoints CAPTCHA-block headless; lesson recorded
- **M2**: httpbin 503 during discovery (transient); live run returned PASS; code handles both outcomes
- **M3**: PASS — `.infobox-data` selector returns elevation; snapshot also works
- **H1**: PASS — timeanddate holiday extraction + Google Calendar event created/saved; lesson: dismiss two "Got it" onboarding banners before Create button becomes clickable
- **H2**: PASS — warmed Google search + snapshot.text for article content (CSS `p` extraction empty on Wikipedia; snapshot is reliable)
- **H3**: PASS — IG home feed; `svg[aria-label="Like"]` click; comment via sequential type + Enter; @shaked_golan1 was 404 → pivoted to IG feed (NatGeo post); liked + commented "Cosmic kiss 🌌 incredible shot" as feather_test_roi
- **H4**: PASS — 3 facts across 3 tabs (initial page reused as tab 1; only 2 new tabs created); F1=HN story, F2=Tel Aviv weather, F3=GitHub stars
- **Medium tier live run**: M1 PARTIAL 63s, M2 PASS 10s, M3 PASS 1.7s — results.md written
- **`examples/showcase.sh`** fully built with all 10 tasks + `dismiss_got_it` helper + `open_warmed_scratch` PROFILE_LOCKED handler + tier selection (easy/medium/hard/all)

### User decisions / quotes
- Decision: pause before running hard tier live — analyze this session in the next chat
- Quote: "lets pause now, i want to analyze this session in the /next one"
- Quote (earlier): "there must be a way to make this process more efficient and fast, thats for a later session"
- Quote: "you cant just open new tabs always we need to make efficient tab usage logic"
- Quote: "screenshots take disk storage or are temporary?" → confirmed: stored in `~/.local/state/feather/debug/<sid>/screenshots/`, not ephemeral; cleanup is a future task
- Quote: "do you see these banners in real time?" → confirmed: no, I see only on-demand screenshots; passive observation is a future capability gap

### Agent decisions / assumptions / rationale
- H3: pivoted to IG home feed instead of pinned profile (more resilient; @shaked_golan1 was 404)
- H4: reused initial page from `open_warmed_scratch` as tab 1, created only 2 new tabs (user's tab efficiency note applied)
- H2: snapshot.text instead of CSS extract — confirmed in discovery that `p` selectors return empty on Wikipedia
- Discovery and function build were merged into one pass (no separate Phase B then Phase C handoff) — faster, results are in the code
- H1 `dismiss_got_it` helper: loops up to 3× clicking role=button name="Got it" to handle multiple onboarding banners in sequence

### Files read or touched
- Read: `docs/specs/2026-06-09-showcase-eval-suite-plan.md`, `docs/specs/2026-06-09-showcase-eval-suite-design.md`, `examples/showcase.sh` (prior), `journal/context/active.md`, `journal/ops/tasks.md`
- Touched (uncommitted): `examples/showcase.sh` (full rewrite — all 10 tasks), `journal/context/next.md`, `journal/context/active.md`, `journal/log.md`, `journal/ops/tasks.md`
- Created (uncommitted): `docs/specs/2026-06-09-showcase-pass1-recipes.md`
- Runtime: `~/.local/state/feather/debug/ses_92583a7a47/screenshots/` (H1, H3 artifacts); `examples/showcase-output/` (M1–M3 artifacts + results.md)

### Open threads / unresolved questions
- **Hard tier not yet run end-to-end** — `./examples/showcase.sh hard` not executed this session (user paused before it ran)
- **Screenshot monitoring gap**: no passive browser observation; user flagged this as a future session topic
- **Screenshot disk cleanup**: screenshots accumulate in `~/.local/state/feather/debug/`; no purge logic yet
- **Tab efficiency**: user noted "can't just open new tabs always" — H4 uses initial page now; other H-tier tasks each open+close own session (serial, fine for now); could share a single session across H1–H4 in future for speed
- **Browser observation speed**: user wants a faster interaction loop than screenshot→action→screenshot; flagged for a future session

### Next action
- **New session: analyze this session's findings + run hard tier** (`./examples/showcase.sh hard`) with Feather server alive and scratch warmed. Then commit all: showcase.sh, recipe log, results artifacts.

### Next session should read
- `journal/context/active.md` (this thread)
- `docs/specs/2026-06-09-showcase-pass1-recipes.md` (all recipes + lessons)
- `examples/showcase.sh` (the built script — all 10 tasks)
- `examples/showcase-output/results.md` (medium tier results)

### Risks / blockers
- Scratch profile state: `ses_92583a7a47` was closed cleanly; scratch should still be warmed (88MB, roionly9@gmail.com + feather_test_roi). Verify before running hard tier.
- Feather server PID 133216 still alive at `:35853` (started earlier today) — check before hard run
- H1 onboarding banners (Got it ×2): handled by `dismiss_got_it` helper in the script; should not appear on subsequent runs of the same warmed profile (one-time onboarding)
- H3: IG feed content varies per run — the comment text is generic ("Great shot 🌌") to work on any post
- `dev` is still 4-ahead of `origin/dev` (no pushes this session)
