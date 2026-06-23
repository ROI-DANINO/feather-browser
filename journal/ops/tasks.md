# Current Tasks — Phase 4a  (= Feather v1)

Checklist only. Front door → `feather.md`; version roadmaps → `docs/roadmap/{v1,v2,v3}.md`;
execution index → `ROADMAP.md`; live pointer → `journal/context/active.md`.

**Next action (2026-06-23 20:23) = BUILD 5d.1 (stealth base).** 5d reconciled to **secure-only** + the
full **stealth/Behavior-Mine arc** set into the roadmap (5d.1→5d.5; arc design
`docs/specs/2026-06-23-stealth-behavior-arc-design.md`). 5d.1 plan ready (9 TDD tasks):
`docs/plans/2026-06-23-5d-stealth-reconciled.md`. Roi's call: **build first, don't spec ahead** — 5d.2
(measure) is a real gate that drives 5d.3+. Commits LOCAL on `dev`, **not pushed**. _(Older v2-wrap
next-action below is superseded.)_

**(superseded) Next action (2026-06-23 ~15:40) = v2 WRAPPED — pick the next thread fresh.** The v2 **safety spine
is PROVEN LIVE → PASS** (report: `docs/v2_wrap/spine-live-test/run-report.md`). Run B (Instagram,
sacrificial `roionly9`) drove a real hard wall — password + 2 CAPTCHAs + email-link verify across 2
tabs — and the **`HUMAN_IN_CONTROL` brake + `await-human` handoff held the whole time** (agent
navigate→409, zero agent mutations during the human window); resumed logged in as `roionly9`. Roi
confirmed: it passes. Owed nicety (NOT a blocker): **5b typed-code path** (Feather auto-typing a
relayed 6-digit code) is **built + mock-proven but not live-proven** — no real site issued a typed code
(GitHub & IG both used no-code or link/CAPTCHA walls). Live proof needs a TOTP/SMS-2FA-enabled account.
**RECOMMEND NEXT:** v2.5/5d (Stealth + typed-code live proof + LinkedIn exit test) stays deferred;
choose the next thread (5d stealth · Phase 2 warmed step-up · 4b shell).

- [x] **Spine SAFETY live test — DONE → PASS (2026-06-23).** Run A GitHub = PARTIAL (no wall); Run B
      Instagram = **PASS** (brake + handoff held through password + 2 CAPTCHAs + email-link, multi-tab).
      Finding #1 fixed+proven (`4c75a1e`, identityId in LaunchSchema). Asterisks: 5b typed-code not
      live-exercised (no real typed-code wall); password recovered from history (accepted throwaway).
- [x] **5b typed-code LIVE proof — DONE (2026-06-23, Run C).** Drove the inject flow directly (no real
      MFA wall needed — pointed `mfa/challenge` at a Wikipedia search box). **Found + fixed a real bug:**
      `resolveChallenge` typed the code through the normal `TypeHandler` while the MFA pause was active →
      it braked its OWN injection (`HUMAN_IN_CONTROL`); mock tests missed it (stubbed pause + type). Fix:
      `TypeInput.allowDuringHumanControl` (internal-only, absent from HTTP schema) + `type.ts` honors it +
      `resolveChallenge` sets it; regression test with the REAL pause registry (red→green). Re-ran live →
      code `123456` injected into the field, challenge resolved, brake released. No Telegram needed.
- [x] **FINDING #1 — wired `identityId` into `LaunchSchema`** (TDD, `4c75a1e`): added
      `identityId: z.string().optional()` to `LaunchSchema` + `LaunchInput`; launch-by-identity now
      reachable from the API. **Proven live this run** (launch envelope carried identityId→workspaceId).
      NOT caused by the ponytail audit (never in git history; original 5a gap).
- [x] **Phase-1 live test RAN → PARTIAL.** PROVEN LIVE: native drive + agent never typed the password;
      `await-human` handoff; **brake #1 = `409 HUMAN_IN_CONTROL`**; real login (`roionly9-byte`); identity
      `gh-spine-test` marked warm. NOT EXERCISED: no emailed-code wall appeared. Finding #2 (plan doc
      `prompt`→`reason`, fixed) + #3 (GitHub didn't challenge). Pushed `origin/dev` `0736824`.
- [ ] **NEXT — 5b MFA LIVE-WALL test (the still-owed proof; 5b is mock-only).** Pick a target that
      *reliably* 2FA-walls a new-device login, OR pre-enable **TOTP** on an account so the wall is
      guaranteed (lesson from Finding #3: a fresh GitHub login from the same machine/IP did not
      challenge). Drive: observe → find the code field → `POST …/mfa/challenge` (type `totp`/`sms`,
      `target`=code ref) → **brake #2** assertion (mutation→409, read→200) → human opens the tokened
      resolve URL from server stdout → enters the code → origin-unchanged check → code typed in → resume
      → verify past the wall. Server: `FEATHER_MFA_TIMEOUT_MS=600000 npm run dev`. await-human body uses
      **`reason`**; MFA challenge body uses **`prompt`** (both confirmed live).
Gate A ✅, 5a Identity ✅ (but see Finding #1), **5b MFA ✅**; the **native API is the credential-safe
driving surface.**
**5c REFRAMED 2026-06-23 (Roi):** the spine's *safety* is delivered by the **native path** (5a warmed
identity + native API + 5b MFA pause/`HUMAN_IN_CONTROL` brake) — **not** by handing out raw CDP.
Raw-CDP attach is **interop, not safety**, and is **deferred to 5e** (build only on real external-tool
demand). Spine safety = **build-complete on paper, pending the live test.** Decision doc:
`docs/specs/2026-06-23-5c-native-vs-cdp-attach-decision.md` (supersedes the "5c = last spine piece"
framing in `2026-06-23-v2-spine-completion-plan.md`). Stealth 5d + the LinkedIn exit test still
deferred to a later v2.5. (Security leak triaged + accepted as low-risk — unique throwaway, no history
rewrite, rotation deferred to 5d. See Security section.)

Latest (2026-06-15 04:46 STOP): **RESUME-BANNER FIX + HUMAN-IN-CONTROL GUARD SHIPPED** (`2c7773a`,
TDD, proven live on scratch). Banner re-injects on `domcontentloaded` (survives navigation); a pause
now refuses agent page-mutations with `HUMAN_IN_CONTROL` (409), reads allowed, page-scoped. Gates:
tsc clean, 366u, await-human integration 9/9. **⚠️ Roi flagged real TEST creds leaked to the remote
repo + git history → top next task (see Security below).** Prior history →
`journal/ops/archive/tasks-20260615-0446.md`.

## ✅ SECURITY — credentials in the remote repo — TRIAGED + ACCEPTED (Roi, 2026-06-15)

**Roi's decision: NO git-history rewrite / force-push; NO urgent rotation.** The IG password is a
**unique throwaway** (not reused on any real account), so the public leak can only ever burn one
rebuildable sacrificial asset. Leak accepted as low-risk. Working-tree password already redacted
(`[REDACTED-PW]`); usernames/email (`roionly9`, `feather_test_roi`) stay — just identifiers for a
throwaway. The agent-driven IG password-change is **re-filed under 5d** below (it's a meaningful
stealth probe only once Stealth 5d + MFA 5b exist; running it now would give muddy data).

<details><summary>Original scope (for the record — no longer an action item)</summary>

      - **The scratch IG password** — was in 3 files; redacted from the working tree 2026-06-15.
      - **`roionly9` / `roionly9@gmail.com`** — 47 hits across 24 files.
      - **`feather_test_roi`** (old IG) — 69 hits across 38 files.

</details>

- [ ] **(deferred → 5d) Rotate the IG password via the AGENT itself as a stealth probe.** Use the
            warmed `scratch` profile (its strongest stealth asset) to let Feather drive IG's
            password-change flow autonomously — doubling as remediation AND a real bot-footprint probe.
            Honest framing: Feather is NOT fully stealthy yet (Stealth Stack 5d + MFA Handler 5b
            unbuilt; no human-like input timing); expect IG to **challenge** (re-auth / email-SMS code),
            not necessarily block (detection ≠ blocking — cf. the Google security-alert-but-not-blocked
            data point 2026-06-15). **Design so rotation succeeds even if the stealth test "fails":**
            headed, Roi watching, agent drives observe→act → on any challenge it **hands off via
            await-human** (the navigation-survivable banner + human-in-control guard shipped this
            session are purpose-built for exactly this) → Roi clears it → agent continues. Record
            honestly: did IG challenge? at which step? did the handoff work? A clean failure-with-
            fallback = a passing test. NB: changing the password invalidates the mined cookies / logs
            out other sessions (fine — rotation is the goal). Evidence feeds 5d (stealth) + 5b (MFA).

---

## Feather v1 — "It runs errands for me" (Phase 4a)

- [x] **v1 BUILT AND PROVEN** — 4a.1–4a.10 + perception loop + showcase suites + daily-driver +
      Graphify + command layer. Detail: `journal/ops/archive/tasks-20260610-{1203,1243}.md`.
- [x] **v1-wrap evidence + comparison** — agent-driven run (`docs/v1_wrap/test_1/`) vs
      Claude-for-Chrome; meta-analysis + corrections register (`docs/v1_wrap/META-ANALYSIS.md`).
- [x] **v1-wrap gap fixes SHIPPED (2026-06-11)** — headed-CDP viewport honored; GET /tabs +
      best-effort newPageId; extract flat-shape/type-default/`value`; teardown ENOTEMPTY retry;
      per-action session log + GET /health; docs/skills truth pass (stale browserMode enum fixed).
      Plan: `docs/specs/2026-06-11-v1-wrap-gap-fixes-plan.md`.
- [x] **`/blog` v1 finale (2026-06-11)** — 4 owed lines folded into 2 entries: `0019` the 06-10
      testing-honesty trio + `0020` "Feather on Trial" finale. `_pending.md` Owed cleared.
      (Committed `af83a65` on task branch, reconciled to `dev` 2026-06-11; the branch's temporary
      superpowers-vendor commit was dropped — Roi's call.)

### Open v1 leftovers (small / optional)

- [ ] Prune duplicate "Rosh Hashana" Sep-12 events on scratch Google (Feather H1 + C4C H1).
- [x] **H3 viewport acceptance check — RUN 2026-06-15; counterfactual FALSE on niri.** Drove IG
      logged-out in a headed `chromium-headed-cdp` session and measured the CSS layout width from
      observe box coords. Requesting `1280×800` → max content right-edge **604 CSS px** (IG mobile
      layout); requesting `2560×1600` → **identical 604 px**. Since doubling the requested size
      changed nothing, `--window-size` is being **ignored** — Roi's **niri** (scrolling tiling
      Wayland WM) tiles the Chromium window to its column width, so the effective viewport is ~700px
      regardless of request → sites serve mobile. **Not HiDPI, not a Feather bug — a tiling-WM
      constraint.** So the earlier "viewport silently ignored" fix (`--window-size`) only helps on a
      floating/stacking WM; it cannot force a desktop viewport under niri. → see the 5d note below
      for the durable fix.
- [x] **Remove the retired scripted `run_h3` from `examples/showcase.sh` — DONE 2026-06-15.** Deleted
      the function + `HARD` array entry + stale `H1-H4` header comment; `bash -n` clean. Agent-driven
      is the H3 benchmark now (Roi 2026-06-11).
- [ ] **(kind,name) overlay-identity mutation watch-item** — code change only on real-world failure.
- [x] **Navigation-survivable resume banner — SHIPPED (2026-06-15, `2c7773a`).** Re-injects on
      `domcontentloaded` (not raw `framenavigated` — needs `document.body` present) so the banner
      follows the human across navigations. TDD; proven live on scratch (Hebrew Google login).
- [x] **Human-in-control guard — SHIPPED (2026-06-15, `2c7773a`).** Found live (an automated navigate
      yanked Roi out mid-login). While a pause is active, agent page-mutations (navigate/click/type/
      press/select-option; dismiss via click) are refused with `HUMAN_IN_CONTROL` (409); reads allowed;
      page-scoped. `pause-registry` tracks `pageId` + `isPagePaused`/`assertPageNotPaused`.
- [ ] **"Agent feels the resume instantly" — NO CODE NEEDED (note).** Feather already emits it: the
      blocking `await-human` call returns on resume + a `human.pause.resolved` SSE event. The /next
      "felt slow" was the test harness writing to a file without polling; an integrated agent feels it.
- [~] **pi_agency ⇄ Feather thin integration — PARKED.** Resume only if Roi pulls it forward.

## Feather v2 — "It survives the scary sites, safely"  (`docs/roadmap/v2.md`)

Security-first spine: `gate → Identity → MFA → warmed attach → Stealth last`. Do not start before Gate A.

> **Wrap scope (2026-06-23, updated):** the spine's **safety is delivered by the native path** (5a +
> native API + 5b MFA brake) — **no build work remains.** Raw-CDP attach (the old "5c") is **interop,
> not safety → deferred to 5e** (`docs/specs/2026-06-23-5c-native-vs-cdp-attach-decision.md`).
> Remaining wrap step = the **live testing brainstorm** (prove the native spine, Roi-in-loop). Stealth
> (5d) + the un-flagged-LinkedIn exit test stay **deferred to v2.5**. Spine-done = *safe but not yet
> stealthy* (don't test against LinkedIn at the end). Prior scope doc:
> `docs/specs/2026-06-23-v2-spine-completion-plan.md`. v2-wrap retrospective: `docs/v2_wrap/`.

- [ ] **5.0.0 — Capability/safety gate** (implements ADR-0010) — Gate A — **IN PROGRESS.**
      Phase boundary done (planning-first). ADR-0010 **ACCEPTED** (#3) + Gate A design
      (`docs/specs/2026-06-11-gate-a-capability-system-design.md`); split into A0 + A1.
      - [x] **A0 — transport hardening** — global `Origin`/`Referer`/`Host` guard SHIPPED
            (plan #4, code #5, CI green, merged to `dev`). `FORBIDDEN_HOST`/`FORBIDDEN_ORIGIN`;
            `/resume` verified same-origin → R1. `src/transport/middleware.ts` `createOriginHostGuard`.
      - [~] **A1 — capability system** ← **IN PROGRESS** (simplified workflow: no PR-per-slice).
            Tiers + session-hold primitive + capability-grant registry + dangerous-mode policy + dual audit.
            - [x] **Slice 1 — session-hold primitive** (`src/capability/holds.ts`): `SessionHoldRegistry`,
                  refcounted holds w/ reason + teardown-on-release (revoke-teeth seam), observe/has/count,
                  `releaseAllForSession` revoke hammer. 11u, tsc clean. PURE INFRA, no live paths wired.
                  Reviewed clean + merged to dev 2026-06-11 (local takeover; remote branch deleted).
            - [x] **Slice 2 — capability-grant registry + state machine** (`src/capability/grants.ts`,
                  2026-06-11 local): opaque single-use nonce minted at approval → record
                  `{sessionId, capability, ttlMs, status}`; lazy TTL expiry (injectable clock);
                  `revokeAllForSession` hammer; redacted `onEvent` seam for the audit surfaces.
                  13u TDD red→green, suite 339/339, tsc clean. PURE INFRA, no live paths wired.
            - [x] **Slice 3 — approval page + policy + dual audit + cookie-export door** (2026-06-11
                  local; plan `docs/specs/2026-06-11-a1-slice3-plan.md`): `DangerousModePolicy`
                  (off-by-default, `FEATHER_DANGEROUS_CAPABILITIES`), append-only audit JSONL +
                  SSE bus, single-use humanToken/CSRF approval page (strict CSP), `consumeGranted`,
                  `CapabilityService` facade. Routes: `POST …/grants` (returns `{grant}` only),
                  `GET/POST /v1/approvals/:humanToken`, `POST …/cookies/export` (the gated demo door),
                  session-close→revoke. TDD +21u + 7i. **Gate A live + proven end-to-end.** Remaining
                  dangerous doors (CDP attach, vault) gated when built in 5c / ADR-0008.
            - [x] **Live-test Gate A — REAL use-case PROVEN (2026-06-15).** Re-warmed `scratch` Gmail via
                  human-in-the-loop login, mined 77 cookies THROUGH the gate (refuse→approve→export→
                  single-use; audit `requested→granted→used`), then a fresh empty browser opened
                  roionly9's inbox using ONLY those cookies = **mined AND used**, on Google (hard target).
                  Honest nuance: Google emailed a security alert but didn't invalidate the session
                  (detection≠blocking → 5d stealth input). Detail: `journal/context/next.md` 2026-06-15
                  03:30 entry. (Earlier disposable-github demo proved only the lock; this fills the box.)
      Body: `docs/sessions/5.0.0-capability-gate.md`. NB: the deferred `/evaluate` endpoint and
      batch endpoint land behind/after this gate (META-ANALYSIS ◇ items).
- [ ] **5.0.1 — MCP & tool-surface reconciliation** — owns the **Connector Registry** decision +
      the batch-endpoint call (input `research/2026-06-10-native-capabilities-router.md`)
- [ ] **5.0.2 — First-agent safety gate** — Gate B (input: C4C's per-origin allowlist + hard
      credential line, recorded in META-ANALYSIS §4.11)
- [x] **5a — Identity Model — SHIPPED 2026-06-15 (TDD).** Named, agent-attachable handle over a
      warmed profile + opaque stealth/MFA policy slots + dormant `vaultRef`. New `src/identity/`
      (types/store/manager) + `src/transport/identity-routes.ts` + `http-helpers.ts` (extracted to
      break a route import cycle). Six routes: `POST/GET/GET:id/DELETE:id /v1/identities`,
      `POST :id/warm`, `POST :id/mark-warm`. `LaunchSessionInput.identityId` resolves via an injected
      resolver seam (no import cycle); `SessionRecord.identityId` flows through. **Council S1–S5 baked
      in:** separable `defaultWorkspaceId`/`defaultProfileId` (S1); explicit `markWarm()` — NO
      close-bus inference (S2); opaque `stealthPolicy`/`mfaPolicy` versioned blobs, no cross-module
      imports (S3); per-identity write mutex + `version` field (S4); `disablePasswordManager` at
      create, 0600/0700 store perms, `vaultRef` redacted from all API responses + dormant (S5).
      Gates: tsc clean, **399 unit** (+33), identity integration 4/4, full integration 96/96 (the lone
      red is the pre-existing niri `attach-cdp` viewport test — env-specific, untouched by 5a), manual
      curl CRUD round-trip green. Plan: `docs/specs/2026-06-07-identity-model-plan.md`.
- [x] **5b — MFA Handler — SHIPPED 2026-06-23 (TDD).** Reconciled onto Gate A (decision: reuse
      primitives, keep MFA distinct — `docs/specs/2026-06-23-mfa-5b-reconciliation.md`). New `src/mfa/`
      (types/local-page/notifier/config/manager) + `src/commands/mfa-challenge.ts` + 4 routes
      (`POST/GET …/mfa[/challenge|/:id]` auth, `GET/POST /v1/mfa/:id[/submit]` local) + 3
      `mfa.challenge.*` SSE events. Create takes an `mfa` hold + **banner-free pause** (free
      HUMAN_IN_CONTROL agent-suspension) instead of the dead `setStealthMode`; resolve types the code +
      releases hold/pause; **256-bit single-use humanToken kept OFF the agent-facing localUrl**, per-render
      CSRF nonce, strict CSP, **origin-unchanged anti-phishing** check; session-close cancels pending.
      Shares `CapabilityService.holds`. Gates: tsc clean, **435u** (+36), mfa integration 5/5, full
      integration 101p/1skip/1 pre-existing niri attach-cdp red. Docs: api-reference MFA section + 3 error
      codes + human-handoff skill. **⚠️ Proven with a MOCK browser only — live-MFA-wall test is the
      deferred testing brainstorm.** Pushed `origin/dev` (`12ffa91`).
- [ ] **5d — Stealth + Behavior-Mine arc** (ordered; **one foundation / two payoffs** — record the
      human's browser use once, then motion/rhythm → stealth realism, steps → workflow replay; the
      Cookie Mine pattern, new payload). **Arc design owns the ordering:**
      `docs/specs/2026-06-23-stealth-behavior-arc-design.md`. Each step = its own design + plan.
      - [ ] **5d.1 — Stealth base** (verify-not-spoof; **secure-only, reconciled rev 3** — design
            `docs/specs/2026-06-23-5d-stealth-reconciled-design.md`, plan
            `docs/plans/2026-06-23-5d-stealth-reconciled.md`). **Planned, ready to build.** NB: rev-2
            two-mode model + mode-switch endpoint DROPPED (5b MFA uses a pause/hold + HUMAN_IN_CONTROL
            brake; fast path = per-call `type` override); 2026-06-07 docs SUPERSEDED.
            - [ ] **Headed-CDP viewport pinning (niri finding, 2026-06-15)** — `--window-size` ignored
                  on a tiling WM → render viewport = tile width (~700px) → MOBILE layout. Durable fix =
                  pin via CDP `Emulation.setDeviceMetricsOverride`, decoupled from OS window geometry,
                  flag-gated (window-vs-viewport mismatch is a mild fingerprint signal; default honest
                  "match the window"). Workaround: niri float-rule for the Feather Chromium window.
      - [x] **5d.2 — Measure reality — DONE 2026-06-23.** Operate-by-hand live run (disposable
            headed-CDP, no login, public detectors). **Static axis PASS** across sannysoft, browserscan
            (incl. **CDP: Normal**), and **commercial Fingerprint Pro** (`bot: not_detected`,
            **`tampering_ml_score: 0`** → verify-don't-spoof validated); CreepJS PARTIAL (0% headless/0%
            stealth, 44% "like headless", headline not capturable). 5d.1 launch self-check clean
            (`stealthWarnings: []`). **The one real gap = mouse-motion:** incolumitas's behavioral
            classifier never scored Feather (`Your Behavioral Score: ...`) because clicks/types teleport
            (no cursor path). **Gate → PROCEED, narrowed:** 5d.4 = mouse-motion synthesis only (NOT
            keystroke math — done; NOT spoofing — off); 5d.3 prioritizes the motion stream. Design
            `docs/specs/2026-06-23-5d2-measure-reality-design.md`; report + screenshots
            `docs/testing/5d2-baseline/`.
      - [ ] **5d.3 — Behavior Mine (capture)** — record human motion/rhythm + step sequence during
            warm/daily sessions; the shared ground. **5d.2 says: prioritize the mouse-MOTION stream**
            (the axis that moves the needle). Credential-adjacent → same boundaries as the
            Cookie Mine (opt-in, redaction, no secrets into shared artifacts).
      - [ ] **5d.4 — Learned human-like input → STEALTH** — synthesize *curved/overshoot/human-timed*
            mouse trajectories via CDP `Input.dispatchMouseEvent` (keeps `isTrusted: true` — Feather
            already passes that check; the gap is trajectory SHAPE, not provenance). Re-measure vs 5d.2
            (incolumitas 0–1 score @15s). **NOT keystroke math (done), NOT spoofing (off), NOT isTrusted
            faking.** Width caveat (research 2026-06-23): high-leverage for DataDome/HUMAN/PerimeterX,
            ~zero for Cloudflare → scope to Feather's real target mix.
            - [ ] **GATE before building 5d.4 (either could re-order it):** (a) verify CDP attach under
                  Chrome 136+ (spawn path OK — non-default `--user-data-dir`, modes.ts:80; risk is only
                  the future attach-to-stock-Chrome ambition); (b) run Feather vs `bot-detector.rebrowser.net`
                  for the **`Runtime.enable` leak** — if it leaks, that static tell outranks motion (only
                  fix = rebrowser-patches, a narrow verify-don't-spoof exception). Neighbor: active
                  anti-bot self-detection. Research: `research/2026-06-23-bot-detection-landscape-research.md`.
      - [ ] **(harden 5d.2 suite, next pass)** add `bot-detector.rebrowser.net` (CDP leak),
            **Brotector** (`isTrusted` behavioral + canvas cursor-path **visualizer** = free 5d.4
            debugger), deviceandbrowserinfo, pixelscan, iphey, browserleaks, FCaptcha (self-host). The
            real-blocking-site test (DataDome/Cloudflare-fronted, footprint/risk) stays Roi's call.
      - [ ] **(Feather capability gap, NOT stealth)** no JS-dialog handling — `confirm`/`alert`/`prompt`
            are auto-dismissed (no `page.on("dialog")` in `src/`); blocks flows gated behind a confirm
            pop-up (surfaced by the incolumitas challenge 2026-06-23).
      - [ ] **5d.5 — Teach-a-workflow / action cache → EFFICIENCY** — agent replays captured *steps*
            as recipes (Anchor-inspired; Maxun `where/what` reference-only). Last — doesn't serve
            "look human". Inputs: `research/2026-06-23-agent-speed-perception-toolbox-intake.md`,
            `research/2026-06-06-anchor-browser-product-reference.md`.
      NB: M2 is NOT usable as 5d evidence or regression test (cause undetermined — META-ANALYSIS §1);
      M1 cold-profile search walls remain the evidence.
- [ ] **Perception-output efficiency** (idea logged 2026-06-15 — NOT felt yet, do not build) —
      spend agent context efficiently (ADR-0005) by shrinking big perception payloads
      (snapshot / observe / extract). **Native kernel = return-less + expand-on-demand (progressive
      disclosure), NOT an ML compressor** — Feather's loop lets the agent re-query, so beat token
      bloat by *selection*, not squeezing. Trigger: a real errand choking on a giant snapshot.
      Neighbors: action cache / learn-your-behavior. Full intake (source: Headroom):
      `research/2026-06-15-headroom-integration-intake.md`.

## Feather v3 — "The polished product"  (`docs/roadmap/v3.md`)

- [ ] Visual Zen-style browser shell (Phase 4b; adr-0007/0009; gated on Casilda spike)
- [ ] **5e — Agent Runtime / ecosystem interop** — absorbs old **4a.7** (CDP attach), correctly last
- [ ] True perception / generalized workflows (north star)

## Parked / External Blockers

- [ ] Optional Gemini/OpenAI provider keys for future `claude-council` runs.
- [ ] Vault Spikes A/B remain frozen until explicitly pulled forward.
