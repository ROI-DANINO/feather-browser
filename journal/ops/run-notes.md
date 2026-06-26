# Run Notes — compact phase-boundary decision/state log

Append-only. One short block per phase-boundary or durable decision. Newest at the bottom.

---

## 2026-06-23 — 5c reframed: native path IS the v2 spine's safety; raw-CDP attach → 5e

**Phase:** 4a / v2 security spine. **sub_phase:** `v2-spine-safety-build-complete-5c-reframed-native-not-cdp-attach`.

**Decision (Roi):** the v2 spine's *safety* is delivered by Feather's **native, credential-safe API**
(Safe tier) + the 5b MFA pause/`HUMAN_IN_CONTROL` brake — **not** by handing out raw CDP. Raw-CDP attach
is **interop, not a safety brick → deferred to 5e** (build only on real external-tool demand). The
welded filtering-proxy design (block Network/Storage → HttpOnly cookies safe; allow Runtime.evaluate;
origin-pin; single-connection; `cdp-attach` hold owns the socket; auto-kill-on-MFA) is **preserved for
rebuild, shelved not lost.** Gate A's `cdp-attach` door stays **built-but-dormant.**

**State:** v2 safety spine = **build-complete on paper** (5a Identity ✅ + native API ✅ + 5b MFA ✅).
**Only the live test remains** (5b proven with a MOCK browser only). **Next = the deferred testing
brainstorm** (warmed identity through a real login/MFA challenge, human-in-loop, brakes observed).

**Artifacts:** decision doc `docs/specs/2026-06-23-5c-native-vs-cdp-attach-decision.md`; ROADMAP +
tasks + browser-desk reconciled; blog `0021-the-door-i-didnt-build.md`; memory
`feather-security-first-framing`. This /stop consumed 3 pending /next entries (5a, v2-wrap, 5b).

---
## 2026-06-23 09:10 — Spine live test designed + planned; Finding #1 (identityId launch gap)

**Decision:** the deferred live-testing brainstorm is DONE → produced a design + 11-task
operate-by-hand run plan (`docs/specs/2026-06-23-spine-live-test-{design,plan}.md`, `b8e9745`/`f3c1ceb`).
Shape: agent drives a **throwaway-GitHub** login through a real **emailed device-code** wall; human
supplies password + code (2 touchpoints = the machinery under test); `HUMAN_IN_CONTROL` brake asserted;
inbox = scratch Gmail (`roionly9`); operate-by-hand, zero source changes. Anti-bot/fingerprint track is
SEPARATE (v2.5/5d) — its policy only governs target choice here.

**Finding #1 (caught before the browser opened):** the HTTP launch route can't bind a session to an
identity — `LaunchSchema` (`src/transport/routes.ts:49-61`) omits `identityId`, Zod strips it, so
`launchHandler` never sees it, though `SessionManager.launch` resolves `identityId → defaultWorkspaceId`.
Launch-by-identity is **unreachable from the API**; 5a tests hit the manager directly and missed it.

**State:** spine still build-complete-on-paper; live test NOT yet run (blocked on Roi creating the
GitHub throwaway). Server up→down this session; identity `gh-spine-test` persists cold.

**Next (Roi's call):** FIX FINDING #1 FIRST — add `identityId: z.string().optional()` to `LaunchSchema`
+ transport test (TDD) — THEN run plan Tasks 4–11. Run facts grounded: no `email` MfaType (use `sms`);
`ConsoleNotifier` prints the tokened MFA URL to server stdout; default MFA timeout 5min (bump via
`FEATHER_MFA_TIMEOUT_MS=600000`).

---

## 2026-06-23 ~15:20 — Spine SAFETY live test RAN → PARTIAL (Finding #1 fixed+proven)

**Finding #1 — FIXED (TDD, `4c75a1e`):** added `identityId: z.string().optional()` to `LaunchSchema`
(`src/transport/routes.ts`) + `LaunchInput`; launch-by-identity now reachable from the API. NOT caused
by the ponytail audit — `identityId` was never in routes.ts in git history (`git log -S` empty); an
original 5a gap (5a tested the manager directly). **Proven live this run:** launch envelope carried
`identityId`→resolved `workspaceId: gh-spine-test`.

**Live run (operate-by-hand, plan Tasks 2–11) → PARTIAL.** Throwaway GitHub `roionly9-byte` / scratch
Gmail, headed `chromium-headed-cdp`, session `ses_b8ccf08dfb`.
- **PROVEN LIVE:** native drive + agent never typed the password; `await-human` password handoff
  (`resumedBy:human`, ~80s); **brake #1 = `409 HUMAN_IN_CONTROL`** (agent navigate refused mid-pause);
  real login → `meta[name=user-login]=roionly9-byte`; identity `gh-spine-test` marked **warm** (v2).
- **NOT EXERCISED:** GitHub showed **no emailed device-code wall** to a new account from a fresh
  Chromium (same machine/IP) → 5b MFA half had no real challenge to bind to. Roi: bank PARTIAL.

**Findings:** **#2** plan-doc bug — `await-human` body is `reason` not `prompt` (`AwaitHumanSchema`);
the 400'd call registered no pause and briefly defeated the first brake check (navigate hit example.com,
recovered). Fixed in the plan. MFA-challenge body correctly uses `prompt`. **#3** GitHub didn't
challenge — env/target data point, not a Feather bug.

**State:** report+screenshot `docs/v2_wrap/spine-live-test/run-report.md`; both commits pushed
`origin/dev` (`0736824`). Scratch-profile `warm-session.ts` orphan killed; no Feather procs left.
Warmed `gh-spine-test` persists for deferred Phase 2.

**Next (Roi: resume testing):** run the **5b MFA LIVE-WALL test** against a target that *reliably*
2FA-walls a new-device login, or **pre-enable TOTP** so the wall is guaranteed (the missing piece —
5b is still mock-only). await-human=`reason`, mfa/challenge=`prompt` (both confirmed live).

---

## 2026-06-23 ~15:40 — v2 SAFETY SPINE PROVEN LIVE → PASS (Instagram run); v2 WRAPPED

**Run B — Instagram (PASS).** Sacrificial `scratch` IG (`roionly9`), headed session `ses_cedae15ddf`.
Agent drove login natively + typed username; **`await-human` handoff absorbed a genuinely hard real
wall** — password **+ 2 CAPTCHAs + an email "verify it's you" *link*** (human opened a 2nd Gmail tab to
click it) — while the **`HUMAN_IN_CONTROL` brake held**: agent `navigate`→`409` (`req_ca3cc56b`), and
**zero agent mutations** across ~12 `tab.created/updated/closed` events during the 4-min human window.
Resumed **logged in as `roionly9`** (`img[alt]="roionly9's profile picture"`). The spine's safety =
brake + human-in-loop; **both held live under a messy multi-tab wall** → PASS. (Run A GitHub stayed
PARTIAL — no wall appeared.)

**Roi's framing (confirmed):** the wait-for-human + brake working cleanly IS the pass — a real test
(it *could* have failed: IG could block, brake could leak, banner could die on tab-switch; none did).
The warmed account is a byproduct (Cookie-Mine fuel), not the goal.

**Two honest asterisks (recorded, not rounded up):** (1) **5b typed-code** path (Feather auto-typing a
relayed 6-digit code via the tokened page) is **built + mock-proven (`12ffa91`) but NOT live-exercised**
— no real site issued a *typed code* (GitHub gave no wall; IG gave CAPTCHA + a *link*). Owed nicety,
needs a TOTP/SMS-2FA-enabled account; NOT a blocker. (2) **Password recovered from git history** to
unblock (accepted throwaway; the "agent never holds the secret" property is the deferred vault gap).

**State:** report (both runs) `docs/v2_wrap/spine-live-test/run-report.md` + 2 screenshots. **v2 =
spine safe + PROVEN LIVE → WRAPPED.** Next thread is open: 5d Stealth · Phase 2 warmed step-up · 4b
shell. v2.5/5d (stealth, typed-code live proof, LinkedIn exit test) stays deferred.

---
## 2026-06-23 20:23 — 5d reconciled (secure-only) + stealth/Behavior-Mine arc set (phase.md boundary)

**State:** Phase 4a → opening v2.5 Phase 5d. v2 spine proven live (prior). This session = docs/planning
only, NO source code.

**Decisions (durable):**
- **5d is SECURE-ONLY.** The 2026-06-07 rev-2 mode model is dead: no secure/assisted enum, no
  `setStealthMode`, no `POST …/stealth` mode-switch endpoint — 5b MFA shipped using a pause/hold +
  `HUMAN_IN_CONTROL` brake, so the mutable-mode seam is obsolete. Fast path = the per-call `type`
  `mode`/`delayMs` already in `TypeSchema`. Verify-don't-spoof + no-font-guard preserved. Stealth built last.
- **Cadence routes through a new `Actionable.typeSequentially` seam** (Locator.pressSequentially /
  ElementHandle.type) so it reaches **ref targets**, not just CSS selectors.
- **Identity `stealthPolicy` slot stays dormant** under one mode (nothing to resolve).
- **The stealth + "teach-the-agent-human-behavior" work = one ordered arc, 5d.1→5d.5**, with a single
  capture foundation ("the Behavior Mine"): record human browser use once → motion/rhythm feeds stealth
  realism, steps feed workflow replay. *The Cookie Mine pattern, new payload.* **5d.2 (measure) is a real
  gate** that can shrink/defer 5d.4. Spec each step just-in-time, not ahead.

**Docs:** design `docs/specs/2026-06-23-5d-stealth-reconciled-design.md`; plan
`docs/plans/2026-06-23-5d-stealth-reconciled.md`; arc `docs/specs/2026-06-23-stealth-behavior-arc-design.md`.
**Commits (LOCAL on `dev`, NOT pushed):** 1c19a40, 03c0fc4, 2bb86e2, a8c2290.
**Next:** BUILD 5d.1 (subagent-driven). Do not spec ahead; let 5d.2 drive 5d.3+.

---

## 2026-06-23 (21:42 STOP) — 5d.1 shipped, 5d.2 measured, the detectors disagreed

**5d.1 stealth base SHIPPED** (TDD, 9 tasks, secure-only): `src/browser/stealth.ts` (classifySite /
jitter / fingerprint-check L4 / env-check L2 / L1 doc-seam), `Actionable.typeSequentially` seam,
secure-by-default cadence, `SessionRecord.stealthWarnings`, headed-CDP launch checks. 454u, rd-verify
PASS, pushed `e26ef63..07bb4c1`.

**5d.2 measure reality** (live, operate-by-hand, disposable headed-CDP, no login) — the gate that
refined itself v1→v4 across rounds:
- **Static axis PASS** across sannysoft, browserscan (incl. CDP: Normal), **Fingerprint Pro commercial**:
  `bot: not_detected`, **`tampering_ml_score: 0`** ⇒ verify-don't-spoof validated by a commercial ML
  detector (not spoofing = measurably right). CreepJS trust = high.
- **Behavioral gap = mouse-motion**: incolumitas behavioral score never computes (`...`) even with full
  cadenced form interaction — clicks teleport, no cursor trajectory. Confound closed.
- **Research** (`research/2026-06-23-bot-detection-landscape-research.md`) adversarially corrected: gap is
  trajectory *shape* not provenance (Feather already passes `isTrusted`); mouse-motion is
  DataDome/HUMAN-decisive, **~zero for Cloudflare** → 5d.4 value is vendor-dependent.
- **CDP-leak — TWO DETECTORS DISAGREE (the key finding):** rebrowser `runtimeEnableLeak` 🟢 clean BUT
  **Brotector `runtime.enabled` 🔴 score 1.00 DETECTED** via `nameLookupCount:3`. Same surface, different
  technique, opposite verdict ⇒ **gate (b) NOT cleanly closed; CDP-runtime hardening RE-OPENED**, possibly
  outranking 5d.4 (a CDP tell scoring 1.00 makes mouse-motion moot on that detector). `Input.untrusted`
  PASS. Lesson: never trust a single detector.
- Side findings: 🔴 `useragent` (bundled Chromium not Google Chrome — static win, run real Chrome,
  install-gated); **no JS-dialog handling** (`confirm`/`alert`/`prompt` auto-dismissed) — non-stealth gap.

**Docs:** `docs/testing/5d2-baseline/baseline-report.md` (Addenda A/B/C, gate v1→v4) + 8 screenshots;
research in `research/`. **Commits on `dev` (pushed):** d276170, 96818c3, d92b598, b8e19bc, + Brotector
commit. **Next:** isolate Brotector's CDP-runtime detection (fire with zero evaluates? does
rebrowser-patches defeat `nameLookupCount`?) → decide CDP-hardening vs 5d.4 sequencing.

---

## 2026-06-24 — REORIENTATION: target locked, stealth CUT, v1 to ship

**Trigger:** Roi flagged he'd been on autopilot ~a week and asked for a multi-angle audit + online
research + a restructured roadmap (no code). Ran an **8-agent dynamic workflow** (security audit,
code-health, test-suite, roadmap-drift + 2 web-research passes); the one critical security finding was
adversarially re-verified.

**Findings (verdict-backed):**
- **Drift confirmed.** `phase.md` said `phase-4a/v1` while ~9 days of work were v2.5/5d **stealth** +
  anti-bot-detector cat-and-mouse. The stale phase pointer + doc-churn (35/52 recent commits docs, 9
  specs in one day, `active.md` at 247 lines / 11 NOW entries) was how it hid.
- **CRITICAL (confirmed):** the throwaway `roionly9` password is recoverable from **public** git history
  AND was back in the working tree. Roi's call: he handles the account; **no history scrub** (throwaway,
  low blast radius); add a commit-time guard only.
- **Stealth is a treadmill.** Independent benchmark: rebrowser's CDP/`Runtime.enable` patches ==
  vanilla Playwright on 31 real Cloudflare sites. Detector scores are a lower bound, not success;
  warmed real account + real consumer IP already wins → 5d is orthogonal to the moat.
- **The work itself is good:** clean `tsc`, 454u + 101i, security paths genuinely covered, new
  credential code well-architected. Direction was wrong, not craft.

**Decisions (Roi):** target = **HYBRID** (personal errand-runner → narrow local-first/privacy OSS);
**stealth CUT/parked**; big visual-shell vision deferred. Warmed sessions ride consumer WiFi/hotspot
IPs (not datacenter) → cut is final; roaming just means more "verify it's you" challenges, already
handled by the MFA await-human handoff.

**Done this session (docs/safety only, no product code):**
- Plan of record → `docs/specs/2026-06-24-reorientation-and-roadmap-restructure.md` (5-phase roadmap:
  0 security → 1 ship v1 → 2 adoptable → 3 harden moat → Later stealth parked; "done" definition;
  test strategy; cut list).
- Commit-time secret guard → `.githooks/pre-commit` (prefers gitleaks, else conservative key-shape
  scan; tested — blocks keys/tokens, quiet on journal prose).
- Tracking files reconciled: `phase.md` (truthful pointer + "no code ahead of the pointer" rule),
  `active.md` (trimmed; old NOW stack → `journal/ops/archive/active-now-stack-20260624.md`),
  `tasks.md` (Phase 0→3 checklist; old detail → `journal/ops/archive/tasks-20260624-reorientation.md`),
  `ROADMAP.md` (top banner + 5-phase table; 5d heading marked PARKED; body kept as history).
- Memory: `feather-target-and-stealth-cut` added (don't re-litigate / don't restart stealth).

**Next:** Phase 1 — record & publish ONE hero demo (`npm run demo:hero`, `wf-recorder` installed).
Not yet committed (left for `/stop`).

**`/stop` addendum (2026-06-24):** Roi REORDERED the post-Phase-0 plan → **harden first** (security
wins → close test gaps) → **then OSS envelope** → **a NEW stronger demo LAST** (the current
`npm run demo:hero` works but is basic; the finale should show real capabilities). Plan of record,
ROADMAP table, `tasks.md`, `active.md`, `phase.md` all reconciled to this order; `phase.md` blocking →
Phase 1a security wins. Wrote **blog 0022 — "The Disguise I Didn't Need"** (folded the 3 owed stealth
lines; `_pending.md` cleared). Handoff:
`journal/ops/sessions/the-disguise-i-didnt-need-20260624-0126.md`. Committed at this `/stop`.

---

## 2026-06-24 — Phase 1 (Harden) SHIPPED + local MFA resolve-banner (commit 06cd2e8, pushed)

**Decision/state:** Phase 1 of the reorientation roadmap is built and pushed to `origin/dev`. Order held
(Roi): harden first → OSS envelope → demo last. v1-vs-v2 settled: it's a **v1 wrap**; the historically-
"v2" safety spine (Gate A + Identity + MFA) is already built/proven and IS v1's foundation.

**Shipped (all TDD):**
- 1a: constant-time auth (`timingSafeEqual`), non-loopback host opt-in (`FEATHER_ALLOW_NONLOOPBACK`),
  MFA token off console (notifier split agentUrl/humanUrl), owner-only `0700/0600` perms.
- 1b: `@vitest/coverage-v8` + per-area floor, `tests/integration/security/` abuse-fuzz surface,
  warmed-session reuse/persistence/isolation tests, `adr-0012` (at-rest plaintext intentional for v1).
- **Verifier-found MAJOR fixed:** the warmed-profile cookie jar (`sessions/manager.ts`) + quarantine dir
  were still `0755` — the perms fix had hit only the index dirs. Now `0700`, with a leaf-perms test.
- **Local MFA resolve-banner** (`docs/specs/2026-06-24-mfa-resolve-banner-design.md`): banner button
  carries NO token; Feather opens the resolve tab over CDP → token never on the watched page. Closes the
  MFA-without-Telegram gap the console fix opened.
- 2 residuals: all bearer-secret/CSRF compares → one `constantTimeEqual` (`src/util/constant-time.ts`);
  debug-bundle writes → `0600/0700`.
- `SECURITY.md` reconciled to the shipped posture (outsider-first threat model; §3 down to plaintext-at-
  rest + the accepted git-history leak).

**Method note:** two dynamic workflows drove the session — a 12-agent wrap-gap assessment (verified the
distance-to-wrap, resolved v1/v2, drafted SECURITY.md + adr-0012) and a 3-lens adversarial diff-verify
(caught the cookie-jar miss). Coverage gotcha: `resolve-banner.ts` (integration-tested Playwright) is
excluded from the unit floor, not lowered.

**Gate:** tsc clean · 471 unit (floor enforced) · 164 integration / 1 skip / 1 pre-existing attach-cdp
viewport red (niri tiling-WM; unrelated).

**Next:** Phase 2 — OSS envelope. Start with the README clone→fail blocker (missing
`npx playwright install chromium`), then CONTRIBUTING.md, CI badge, declare API v1 + stability line,
surface the success number. Blog 0023 — "Every Door But the Vault". Handoff:
`journal/ops/sessions/every-door-but-the-vault-20260624-0314.md`.

---

## 2026-06-24 — Phase 2 OSS envelope (commits `5c5f0fa` + `182b4e0`, pushed)

Worked straight down the Phase 2 checklist; every claim verified live, not asserted.

- **Clone→fail blocker:** `npx playwright install chromium` added to `README.md` + `examples/README.md`
  (npm install doesn't fetch the binary → stranger's first launch failed). Root-caused: no `postinstall`;
  chose the documented line over a silent ~150MB CI auto-download.
- **README:** CI badge (`ci.yml`); "Showcase suite" section surfacing **8 PASS / 2 PARTIAL** (both
  reclassified environmental). Re-ran `showcase.sh easy` live → **3/3 PASS**.
- **`CONTRIBUTING.md`:** setup, exact CI verification gate, branch rules, scope/security.
- **HTTP API `/v1` declared** + SemVer-style stability promise in `docs/api-reference.md` Overview;
  runnable curl for action (click/type/press, shared `target`), grants, MFA-challenge. All 3 shapes hit
  the live server: type→`ok:true`, grants→`403 DANGEROUS_DISABLED` (nothing opted-in), mfa→`ok:true`.

**Version-collision catch (Roi):** "we wrapping v2 not v1." TWO counters — **product v1→v2→v3** (at v2)
vs the **HTTP API URL `/v1`** prefix (unchanged since the start). The work was the API one; `182b4e0`
makes api-reference name them apart so a `/v2` there reads as an API-prefix bump, not product-v2.
Durable fact now lives in the docs (not promoted to file-memory — repo already records it).

**Decision:** API `/v1` stability = no breaking change to existing endpoints/fields/envelope without a
`/v2` URL bump; additive (new endpoints / optional fields) is non-breaking → clients ignore unknown fields.

**Next:** Phase 3 — a NEW, stronger hero demo (LAST), needs Roi driving + `wf-recorder`. No blog (owed
line filed). Handoff: `journal/ops/sessions/the-two-version-numbers-20260624-0427.md`.

---

## 2026-06-24 — Phase 3 "Show it off": hero demo v2 (visible human handoff)  [STOP, commits 4e0ad81..8aedbbe, pushed]

**Phases 0–3 of the reorientation roadmap are now COMPLETE.**

- **Core change (`57b0b37`):** `scripts/demo/continuity.ts::ensureHumanAuth` — replaced the silent
  console login-poll with the shipped `await-human` handoff: `POST /v1/sessions/:id/await-human`
  `{reason, resumeOn:{target:checkTargets[0],until:"visible"}, banner:true, timeoutMs}` + a post-check
  guard for premature Resume. Dropped `pollIntervalMs`. ~15 lines; TDD; no `src/` change (reused the
  existing feature). The handoff is now *visible on camera* (on-page Resume banner).
- **`feather.md` (`fb58457`+`5b3a09f`):** binary "Done when" column per product version. Cold review
  caught the v2 line smuggling a "no verify-challenge" promise → contradicts the cut-stealth decision;
  rewrote so a one-time challenge resolved via the handoff is a PASS, only a *persistent block* fails v2.
- **Live gate PASS (narrowed):** banner appeared on `accounts.google.com`, **survived email→password**,
  auto-resumed on inbox-visible. Log- + frame-verified. Report `docs/v1_wrap/hero-demo-v2/gate-report.md`.
  **Unproven:** 2FA-challenge-*page* survival — none fired same-machine.
- **Video (`62dab64`):** `demo-hero-mfa.mp4` ~49s/2.4M (trimmed head/tail, downscaled 2880→1280,
  CRF-compressed from 23M — quality-locked NOT size-capped). Replaces `demo-final.mp4`. README repointed;
  `scripts/demo/RECORDING.md` runbook written.
- **Final review (`8aedbbe`):** fixed 2 honesty gaps — committed the gate report; softened README 2FA
  wording (it wasn't demonstrated).

**Durable fact promoted to automation desk** (NOT global file-memory — repo records it): the
"banner dies on navigation" worry is RESOLVED + proven live (re-inject on `domcontentloaded` + `resumeOn`
survives Google's real login redirects). See `journal/work/automation/context.md`.

**Decisions:** show handoff on the human Google leg (not an agent-driven 2nd login); agent mouse/cursor
→ v3 (no faked cursor); CRF compression not size-cap; honesty — recording proves normal-login survival,
NOT 2FA-page survival (said so, didn't let the video imply it).

**Next:** real-account 2FA take (Roi's actual Google → phone-tap verify) to prove banner survival across
a real 2FA challenge page. Test real / publish scratch. Blog 0024 written. Handoff:
`journal/ops/sessions/the-demo-that-shows-its-hands-20260624-0554.md`.

### Post-/stop addendum (2026-06-24) — README demo GIF [0ed7a1e→3bfa1c2, pushed]
GitHub markdown can't inline mp4 → embed an autoplay GIF in the README hero section (mp4 kept as a
full-quality link). Final = stitched highlight loop, **15s/1080px/3.4M**: banner→login→auto-resume,
one hard cut, then the agent composing the ChatGPT reply in Gmail, **ending on the finished draft**.
Recipe (durable): two-pass palette (`palettegen=stats_mode=diff` → `paletteuse=dither=bayer:bayer_scale=3`,
`fps=12,scale=1080:-1:lanczos`); stitch beats via `filter_complex` trim+concat. `*.gif` not gitignored
(`*.mp4` is, force-added). Media total `demo-hero-mfa.gif`(3.4M)+`.mp4`(2.4M)=6.0M.

### 2026-06-24 /stop — "My Own Gym": direction pivot (no code) [blog 0025]
**Context:** 12h after the reorientation CUT stealth, Roi came in wanting to remake Feather around
stealth + Firefox/Gecko. Held the mirror (reversing his own fresh evidence on excitement), then ran a
14-agent adversarially-verified research pass. Refuted the premises: **Firefox-stealth is a myth**
(it's Camoufox's C++ patches, not Gecko; DataDome detects Camoufox by name; "~90% of bots are Chromium"
is inflated → ~40%); **solo can't win the evasion arms race**; frontier is **up-stack** (orchestration/
HITL/eval, immature-not-empty); broad "bot gymnasium/benchmark" niche occupied BUT **authenticated/
warmed-session eval under-served**; scraping case law (hiQ/Bright Data) protects logged-OFF and
**inverts** against logged-in automation.

**Decisions:** (1) Don't remake around stealth — **extend** the cut. (2) **Bot gymnasium = the
direction** — Roi's OWN sandbox/detectors/bots; NOT evasion on sites that don't want bots. (3) Goals =
**learning/portfolio/job/joy, not commercial**. (4) **Don't stop White Lotus — change its job** (use as
cockpit; extend only when the gym needs it). (5) **Integrate by driving, not merging** — the gym IS the
integration. (6) **Don't do fable→iroh merge first**. (7) Honest-testing guardrail: test against
detectors Roi does NOT control; design tests that can fail.

**One-harness shape (durable):** iroh philosophy (constitution) → White Lotus (framework/cockpit) →
fable/iroh (orchestration brain) → **Feather = DRIVEN body, not a limb**. Promoted to global file-memory:
`feather-gymnasium-direction`, `the-harness-shape`; nuance added to `feather-target-and-stealth-cut`
(gym ≠ restarting stealth). Capture doc: `docs/specs/2026-06-24-gymnasium-and-harness-vision.md`.

**Next:** design **Step 1** of the gym — one agent → Feather → ONE real detector → honest, can-fail
PASS/FAIL Roi can *see* (reframes the 5d.2 work). Then Step 2 = scoreboard wire to `project-fable/evals/`.
**Parked behind pivot:** real-account 2FA take. Handoff: `journal/ops/sessions/my-own-gym-20260624-1217.md`.

## 2026-06-26 — Gym Step 1 shipped (phase-boundary note)
- Bot gymnasium's first brick BUILT & SHIPPED (origin/dev ..5e2f037). Top-level `gym/` = HTTP client of
  Feather, never imports `src/` (keeps Feather a driven body; Step 2 fable wire reuses the client).
- `gym/classify.ts` (pure, 5 tests, "no score = FAIL") + `gym/behavioral.ts` (headed drive of
  bot.incolumitas → parse snapshot `Your Behavioral Score:` → classify → screenshot + `gym/results.md`).
- First live run: **UNSCORED → FAIL** (genuine, field-verified vs `src/`). Gap = mouse-motion (clicks teleport).
- NEXT = Step 2 scoreboard wire to `project-fable/evals/` (thin, not merge) and/or the mouse-motion upgrade.
