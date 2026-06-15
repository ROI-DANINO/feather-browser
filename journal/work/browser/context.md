# Browser Desk

Use this desk for browser engine research, shell architecture, extension compatibility, performance, security, packaging, and update strategy.

## Current Focus

**Human-handoff hardened: navigation-survivable banner + human-in-control guard (2026-06-15, `dev`
`2c7773a`).** Two durable `await-human` behaviors. (1) **The Resume banner now survives navigation** —
re-injected on each new main-frame document via a `domcontentloaded` listener (detached on resolve;
`showBanner` is idempotent; the DOM-flag poll reads the live page). Chose `domcontentloaded` over raw
`framenavigated` because it guarantees `document.body` is present for injection. (2) **A pause now
blocks the *agent*, not just shapes the page** — while a pause is active, agent page-mutating commands
(navigate/click/type/press/select-option; dismiss via its internal click) are refused with
`HUMAN_IN_CONTROL` (409); read-only commands (observe/snapshot/screenshot/wait/tabs/health) stay
allowed; **page-scoped** (a pause on one tab doesn't freeze another). `pause-registry` records each
pause's `pageId` and exposes `isPagePaused`/`assertPageNotPaused` (`HumanInControlError`). Proven live
on scratch (Hebrew Google login): banner followed the human across the login; an agent navigate during
the pause was refused and the page didn't move. **Design note:** this reuses the pause-registry (the
already-live "human in control" signal) rather than the not-yet-wired `SessionHoldRegistry`; the hold
primitive remains the heavier general mechanism for MFA/CDP-attach when those land.

**Observe-loop bug fixes — perception hardened by field evidence (2026-06-10, `dev` `09a6b6c`..`579b445`).**
The three pass-2 showcase bugs are fixed. **`/dismiss` is now verify-by-re-observe**: click the best
in-popup button, observe again, report from reality — response is `{dismissed (verified-gone only),
overlaysRemaining, observation}` where `observation` = the fresh post-click observe (agent acts from its
refs; old refs are expired; `overlaysRemaining` is the ground truth for "am I clear"). Target picking is
**containment-gated**: actions carry `overlayIndex` (computed in-page via `containsComposed` — composed-tree,
hops shadow boundaries because the collector pierces shadow roots); the old bare-"actionable" escape hatch
(could click the page's own "Continue") is gone; failures degrade conservatively (false negative → retry,
never false success). Overlay detection refined: `absolute`/`sticky` elements need an explicit positive
z-index (kills the Google-Calendar-grid false positive); `role=dialog`/`alertdialog`/`aria-modal` always
count; `fixed` unchanged. The dead `Overlay.ref` field is removed (API contract change, docs updated).
**`accName` peeks at a descendant `[aria-label]`** as last resort after empty innerText — icon-only buttons
(IG Like) now named, diff-visible, targetable (deliberately NOT the W3C algorithm; upgrade on evidence).
**Nav-teardown = success with a flag**: `isNavigationTeardown` (pattern list pinned by unit test —
Playwright upgrades that change wording fail CI) makes click/press/select-option return `navigated: true`
instead of INTERNAL_ERROR 500; hint-not-promise — agent re-observes (select-option echoes requested values,
unverified). **Known gaps (recorded):** `/dismiss` can't reach buttons inside same-origin-iframe overlays
(child-frame actions get no overlayIndex; fix idea = implicit overlayIndex for actions in a detected overlay
iframe; workaround = direct click or await-human, documented); (kind,name) overlay identity is
mutation-sensitive on multi-pane popups (docs: trust `overlaysRemaining`). **Testing lesson (durable):**
Chromium silently blocks content-initiated top-frame navigation to `data:` URLs — nav fixtures must use a
real local HTTP server, and a test isn't proven non-vacuous until it FAILS on the pre-fix commit.
**Stale-fact correction:** `continuity.test.ts` passes (3/3); the old "fails consistently" note is dead.
Spec/plan `docs/{specs,plans}/2026-06-10-observe-bug-fixes*`.

**Perception / observation loop — action-shaped sight (2026-06-09, `dev` `6118e8d`..`837435c`).** Feather Core
now has an **action-shaped** perception primitive alongside `snapshot` (which stays for *reading*). **`POST
/v1/sessions/:id/observe`** returns, as compact text: numbered **observe-scoped refs** (`<observeId>.e<i>`),
first-class **overlays** (occlusion detected via `document.elementFromPoint` — what's physically covering the
page), and a **change-diff** vs the previous observe (added/removed/changed by structural signature). The walk
is a read-only Playwright `evaluateHandle` IIFE: **shadow-DOM-piercing**, **never reads `el.value`** (no
credential/PII leak — names come from aria-label/placeholder/label/name/innerText), same-origin frames walked
(depth-capped), cross-origin walls detected-but-not-entered. Implementation lives in
`src/commands/observe.ts` + `src/commands/perception/{walk,diff}.ts`; per-page cache on `FeatherSession`
(cleared on `framenavigated` + `removePage`). **Act-by-ref**: `{by:"ref",ref}` added to the shared
`resolveActionable` (`locators.ts`) — resolves a ref → live `ElementHandle` and reuses the existing input layer;
`withActionErrors` now takes an existence probe instead of a `Locator`. Refs expire on the next observe →
`REF_EXPIRED`(409). **`POST /dismiss`** = opt-in, overlay-scoped, affirmative-label-only (retires the hardcoded
`dismiss_got_it`). Screenshot handler got retention (newest 20) + an 8s timeout/animations-off (kills the H1
30s web-font stall). **Durable design call:** mechanism is "between B and C" — Playwright handles for input-layer
reuse + shadow safety now; moving the *identical* walk fn into a CDP **isolated world** (evades page DOM-method
traps) is sequenced to **v2 stealth (Phase 5d)**, a clean swap. integration 60/60. Spec/plan
`docs/specs/2026-06-09-observe-perception-loop-{design,plan}.md`.

**Per-tab close + complete tab lifecycle (2026-06-09, `dev` `4920759`..`bb3494e`).** Feather Core now
exposes `DELETE /v1/sessions/:sessionId/tabs/:pageId` — close ONE tab without ending the session (so a
warmed session can be reused across errands without leaking tabs). Returns `{ sessionId, closedPageId,
pages }`; **refuses to close the last tab** → `409 CANNOT_CLOSE_LAST_TAB` (the profile-lock lifecycle stays
tied to session close, not tab close). `session.closeTab` calls `removePage` **before** `page.close()` (in a
try/catch) so the page map stays consistent even if close() throws. Fixed a **latent bug**: per-page
lifecycle listeners (`page.on(close)`→`removePage`+`tab.closed`; `framenavigated`→`tab.updated`) were only
attached to tabs opened *after* launch via `context.on("page")` — the **initial** tab(s) added by
`setContext` never got them, so closing the default tab would have leaked. Extracted `attachPageListeners`
(`manager.ts`), now called for both initial and later pages. Also: `http.ts` got a lenient `application/json`
parser (empty body → `{}`) consistent with the existing urlencoded override; Zod still validates bodies that
require fields. `closeTab` is on both `ISession` and `ISessionManager`. The lingering perception gap (agent
can't see the page cheaply / banners block actions) is the **next** brainstorm, not solved here. 61u + 2i green.

**Core command surface: observe-only → ACT (2026-06-06, `dev` `cae8ef7`..`684396d`).** Feather Core
now exposes page-interaction commands over HTTP: `POST /v1/sessions/:id/{click,type,press,wait}`.
Architecture: one `*Handler` class per command (mirrors `navigate`/`extract`), a shared
`resolveLocator(page, target)` (`src/browser/locators.ts`) turning a `Target` descriptor
(role/text/placeholder/testid/css + positional `at:"first"|"last"|n`) into a single Playwright
`Locator`, and `withActionErrors` (`src/commands/input-errors.ts`) mapping Playwright `TimeoutError`
→ coded errors `ELEMENT_NOT_FOUND`(404)/`ELEMENT_NOT_ACTIONABLE`(409)/`WAIT_TIMEOUT`(408). `type`
supports `fill` (default) + `sequential` (contenteditable/ProseMirror fallback). `wait` has two
flavours: element-state (`visible|hidden|attached|detached`) and a site-agnostic streaming-safe
`until:"stable"` (settles when text is unchanged for `quietMs`, with a non-empty guard so it won't
settle on an attached-but-empty node like ChatGPT's streaming placeholder). All handlers emit no
events; no route logs `request.body` (credential boundary). 207u + 43i (real Chromium) green.

**Cookie Mine proven across TWO sites in one warmed context (2026-06-06).** ChatGPT is now warmed
into the same `primary` persistent profile as Google, so one human-warmed jar carries both logins.
A single headed Feather session drives an authenticated cross-site flow end-to-end — ChatGPT →
read its reply → Gmail compose draft — via the new input commands (`scripts/demo/hero-chatgpt-gmail.ts`,
verified working live). This is the Cookie-Mine model working as designed: warm once (human), agent
piggybacks across sites. Warming a second site = same `warm-session` tool with `FEATHER_WARM_URL`.

**Daily-driver = backgrounded `warm-session` (2026-06-10).** `npm run daily` [primary] / `npm run daily:scratch`
launch the persistent profile **detached** (`nohup`+`disown` → logfile under `$XDG_RUNTIME_DIR/feather/`, PID file,
double-launch guard) so it frees the terminal; closing the Chromium window saves + exits via `warm-session`'s own
child-exit hook. `npm run daily:stop` is the force-stop escape hatch (SIGTERM → clean save, `/proc/<pid>/cmdline`
guard against PID reuse). Scripts: `scripts/start-daily-driver.sh`, `scripts/stop-daily-driver.sh` (commit `61fe677`).
**Important profile-history fact:** the warmed `primary` was deliberately deleted 2026-06-08 ("at Roi's request"
before a demo re-record; no backup), re-warmed 2026-06-10 with Roi's real Google, then **deleted again — as of
2026-06-15 `primary` NO LONGER EXISTS on disk** (the old "438MB, 306 cookies" line is stale). `scratch` remains the
TEST identity (a sacrificial IG + warmed Gmail; handles intentionally not recorded here — see the security-scrub
task, real creds were found leaked to the remote repo + git history 2026-06-15).

**Phase 4 Step 0 DONE (2026-06-04)** — answered by spikes, not specs. Cookie Mine proven
end-to-end on a real site (agent acted in Roi's live ChatGPT).

**Pre-shell infrastructure sequence (locked 2026-06-04) — must precede the Visual Desktop Shell GUI.**
Status as of 2026-06-04: (1) storage-isolation **✅** (XDG split, `.feather` gitignored) → (2)
attach-don't-launch **✅** (`chromium-headed-cdp`, PR #1) → (3) `FEATHER_CHROMIUM_PATH` **✅** (system
Chromium 148) → (4) warmed persistent Google session **✅** (`npm run warm-session`; verified e2e —
real Google login via passkey, survives restart, un-flagged) → (5) observability **✅** (`DebugCapture`
wired) → **(6) prove the end-to-end Cookie Mine loop on the headed-Chromium stopgap (ADR-0007 gate) —
ONLY ITEM LEFT** → *then* the GUI. Vault Spikes A/B **frozen** (sudo → Roi; architecture stands).

**Master merge-readiness** is the immediate next focus (Roi, 2026-06-04): `dev` is 110 commits ahead
of `master`; PR #1 (dev→master) is OPEN — decide if this is a stable milestone to graduate.

## Dependency baseline (post-S3, 2026-06-03)

- **Fastify 5.8.5** (was v4; v4 LTS ended 2025-06-30). Migration needed **zero source changes** —
  Feather validates with Zod (no Fastify `schema:` blocks, so v5's full-schema requirement is
  N/A), `listen()` already object-form, no `request.connection`/`hostname`/`getDefaultRoute` usage.
- **Playwright 1.60.0** (floor `^1.60.0`). Bundled Chromium **148** (148.0.7778.96).
- `fastify-sse-v2@4.2.2`, zod ^3, vitest ^2 unchanged.

## Architecture Decisions

- **Foundation:** Playwright-managed Chromium (ADR-0002)
- **Runtime:** Host-primary; Flatpak distribution Phase 4+; Podman optional for headless/CI (ADR-0004)
- **Platform:** Linux-only (Fedora target). Electron eliminated — bundles a second Chromium (anti-Feather).
- **Phase 4 shell (ADR-0007):** target end-state = "painted-in" one-window shell (headless
  Chromium + screencast + forwarded input). Display *model* is the direction; the
  *implementation stack* is **open R&D, not locked** (not Tauri/GTK/Rust/Zig by decree). The
  seamless shell is **deferred** to a later dedicated R&D phase; **headed Chromium is the
  stopgap** human surface now. WebKit-as-browser-surface is dead (need Chromium for trust).
- **Wayland surface (spiked 2026-06-04):** Chromium runs **headed natively on Wayland**
  (`--ozone-platform=wayland`, no XWayland needed). On `niri` (tiling), windows are tiles —
  the app cannot self-size/place. The "Wayland can't embed" blocker is **dissolved** by the
  separate-window / headless-painted-in model (no foreign window to embed). niri-vs-GNOME
  floating behavior parked for the shell phase.
- **Anti-detection — attach, don't launch (productionized 2026-06-04):** a Playwright-*launched*
  browser is flagged as a bot (`navigator.webdriver=true`). `spawnAndConnect` spawns Chromium via
  `child_process` + `connectOverCDP`. **Correction (probed 2026-06-04):** CDP-attach alone is NOT
  enough — a CDP-driven page reports `webdriver=true` by default. The **one real measure** in
  `src/browser/modes.ts` is `--disable-blink-features=AutomationControlled` (commit `c7bf36d`), which
  is **load-bearing**: removing it flips `webdriver` back to `true` even on system Chromium. With it,
  `webdriver===false` and real Google/ChatGPT logins pass clean (incl. passkey new-device flow, #4).
  It paints a cosmetic "unsupported command-line flag" infobar — **browser chrome, invisible to
  websites**, so harmless to detection. `--test-type` removes the banner and keeps webdriver===false
  (probed; deferred polish). **Bot-detection is the #1 risk** to Cookie Mine.
- **Credentials never in the shared jar (decided 2026-06-04):** the warm/Cookie-Mine browser profile
  must **never use Chromium's built-in password manager.** Raw creds belong in a store separate from
  the jar — Proton Pass now, Feather vault (ADR-0008) later — never in the profile Phase-5 agents
  piggyback on. Surfaced live during #4 (Chrome offered to save the warm login's passwords). Dormant
  in Phase 4; hard deadline = first agent action. Hardening: `warm-session` to disable Chrome's pwd
  manager by policy. Detail: ADR-0008 "Real-world corollary".
- **Cookie Mine model:** Phase 4 establishes the long-running human session that Phase 5+
  agents piggyback on (ADR-0003). **Proven on a real site 2026-06-04**: an agent tab
  (`context.newPage` == `openTab`) inherits the human's live login.
- **Agentic North Star:** token/context efficiency is a standing constraint; MCP tool selection deferred to Phase 5 Step 0 after 2026-07-28 spec final (ADR-0005).
- **Storage layout (decided 2026-06-04, spec+plan; not yet built):** all runtime state moves out of
  the repo-relative `.feather` into the **XDG base dirs** — profiles/cookies/vault → DATA
  (`~/.local/share/feather`), logs/debug/measurements → STATE (`~/.local/state/feather`), disposable
  sessions → CACHE (`~/.cache/feather`), token/endpoint → RUNTIME (`$XDG_RUNTIME_DIR/feather`, falls
  back to STATE, never the workspace). Honors XDG env vars + a `FEATHER_DIR` single-root override.
  `FeatherPaths`/`ensureDirs` accept `FeatherDirs | string` (string = single-root). Enforces the
  Agent-Blind Vault boundary; the vault (ADR-0008) will live under the DATA root.
  Spec/plan: `docs/specs/2026-06-04-storage-isolation-xdg-design.md`, `docs/plans/2026-06-04-storage-isolation-xdg.md`.
- **Credentials vault (ADR-0008, 🚧 non-accepted):** interface-first, local-first `CredentialsVault`; Feather is NOT a password manager; KeePassXC + SQLCipher are **candidates, not selections**; acceptance gated on 3 spikes (C leakage harness, A SQLCipher, B KeePassXC). Spikes A/B need sudo installs (hand to Roi).

## Secret-leakage findings (Spike C probe, 2026-06-04 — evidence, not assumption)

A throwaway probe drove a real `chromium-headless-shell` session with 3 canaries (password POST /
URL query / visible text) and scanned every output surface. Durable facts:

- **`trace.zip` leaks secrets that were never on screen** — the `fill()` action argument verbatim
  + the POST body as a resource (`.dat`). NOT redactable → traces must be **off by default for
  credential sessions** (Phase-5 policy). The leakage gate treats a trace's *presence* as a finding
  (no unzip, no zip dependency).
- **Feather leaks raw URLs into clean-tier surfaces** — `TAB_UPDATED.data.url` (`manager.ts:159`)
  and `network-summary` (`capture.ts:44,55`). `network-summary` records the URL only — **never POST
  bodies/headers** (confirmed by code).
- **`redactUrl` (`src/logs/redact.ts`) was dead code** (only its own test imported it) and stripped
  only `user:pass@`. The plan hardens it to also drop **query string + fragment** and applies it at
  those two emission points. (`DebugCapture` is now wired — `46c946e`; see "Shipped" below.)
- **A `type=password` field protects nothing at the data layer** (masking is pixels only).
  **Screenshots leak visually but are text-invisible** → mitigate by policy (don't screenshot
  sensitive sessions), not OCR.

## S2 Items — implementation status (plan: 2026-06-03-s2-tab-layer-observability.md)

1. ✅ **Duplicate tab registration FIXED** — `addPage` is now idempotent, keyed on the `Page`
   object (reverse map `Page → pageId`); `setContext`/`openTab` route through it; `removePage`
   clears both maps. The two-ids-per-tab bug + the listener-vs-`openTab` race are gone.
   `TAB_OPENED` (intent/audit) and `TAB_CREATED` (lifecycle) kept distinct. (`4fdf9cc`)
2. ✅ **`TAB_UPDATED` SHIPPED — settled-only.** One event per navigation, after
   `domcontentloaded`. Mechanism: main-frame `framenavigated` + `waitForLoadState
   ("domcontentloaded")` + supersede guard; covers SPA `pushState`. In `EVENTS` + SSE
   `LIFECYCLE_EVENTS`; payload `{ pageId, url, title, loadState }`. All reads best-effort.
   (`ef87440`, `6f35876`; real-Chromium e2e test `ea4e30d`)
3. ✅ **`getPageInfoList()` resilience SHIPPED** — per-page try/catch → best-effort
   `loadState:"unknown"`; one crashed page no longer rejects the whole list. (`42c73c3`)

**Shipped (2026-06-04 overnight; were deferred):**
- **Trace e2e + `DebugCapture` wiring — DONE (`46c946e`).** No longer dead code: `manager.launch`
  instantiates + `start()`s `DebugCapture` when `input.debug` is set (was accepted-but-ignored);
  `manager.close` `finalize()`s before `context.close()` (best-effort; `debug.capture.finalize.failed`
  event). Real-Chromium e2e proves a valid `trace.zip` (PK bytes) + `network-summary.jsonl` land in
  the debug dir. Capture is **opt-in via `input.debug`**; trace still off by default (Spike-C policy).
- **`FEATHER_CHROMIUM_PATH` — DONE (`6e4f099`).** `config.resolveChromiumExecutable(fallback)` +
  wired into `manager.launch` for `chromium-headed-cdp`. Guarded probe proves the system build runs
  (CDP `browser.version()` == system `.215`, not bundled `.96`) with `webdriver===false`.

## Identity Model Architecture (2026-06-07)

Agent Browsing Stack Feature 3. Spec+plan: `docs/specs/2026-06-07-identity-model-{design,plan}.md`.

- **Identity = named workspace.** `identity.id` IS the `workspaceId`. `paths.profileDir(identity.id)` resolves the profile — no indirection layer. Creating an identity creates a named workspace with policy.
- **Warm-status via event bus.** `SESSION_CLOSE_COMPLETED` gains `workspaceId` in data. `IdentityManager` subscribes via `onBusEvent`. `SessionManager` knows nothing about identities — coupling runs one way.
- **Password manager disabled at create.** `disablePasswordManager(profileDir)` called on every new identity — raw creds cannot accumulate in the warm jar.
- **vaultRef dormant.** String key stored in `IdentityRecord`; ignored at runtime until ADR-0008 Spikes A/B clear. Stable seam; no Identity API change needed when vault is built.
- **PATCH omitted v1** (YAGNI — atomic JSON overwrite via delete+re-create is sufficient for local single-user).
- **Guardrails:** no cloud sync/remote storage; strict 1:1:1 identity:profile:session mapping; no RBAC.
- **Self-contained plan** (13 TDD tasks). Runs before Stealth Stack or MFA Handler are built; stealthConfig/mfaConfig stored now, applied to sessions when those plans execute.

## Open-Source Integration Research Findings (2026-06-07)

Research doc: `research/2026-06-07-open-source-integration-research.md`. Durable architecture inputs:

- **CDP/WS endpoint exposure:** exposing the browser's WS endpoint in `LaunchSession` response enables
  Browser Use (`BrowserSession(cdp_url=...)`) and Crawl4AI (`BrowserConfig(cdp_url=...)`) to attach
  to Feather sessions with zero further code changes. High-leverage, low-effort. Add to Stealth/Phase 5 tasks.
- **Fingerprint npm packages (Stealth Stack):** `fingerprint-generator`, `fingerprint-injector`,
  `idcac-playwright` are independent npm packages (no AGPL) used by Maxun. Evaluate before building
  fingerprint injection from scratch. Task 1 of Stealth implementation sprint.
- **Snapshot/Markdown upgrade:** Crawl4AI's `DefaultMarkdownGenerator` (HTML→clean Markdown, ~300 lines,
  Apache 2.0) should be ported to TypeScript and added as a `markdown` output on the snapshot command.
  Also: `JsonCssExtractionStrategy` pattern informs Feather's `extract` recipe schema evolution.
- **OpenHands MCP path:** once Feather has an MCP surface (ADR-0006, Phase 5), a ~200-line
  `FeatherBrowserTool` makes Feather the browser runtime for OpenHands agents. OpenHands V1 is
  `fastmcp`-based; install `openhands-ai` (MIT PyPI package); never touch `enterprise/`.
- **Maxun AGPL = permanent code blocker.** `WorkflowFile` `where/what` DSL pattern is worth porting
  by hand. `rrweb` (MIT, separate package) usable independently for a future session recorder.

## Council Design Review — security-first re-sequencing (2026-06-07)

A 5-model council (Gemini 3.1 Pro, Grok 4.3, DeepSeek-R1, Claude Opus 4.8, GPT-5.5) reviewed the
roadmap, OSS strategy, and the MFA + Identity plans. **Decision: go with the findings — reverse the
sequence to "capability/security model first, interop through it."** Full record:
`research/2026-06-07-council-design-review.md`. Next session = **Session 4a.6b** (re-sequencing pass).
This **qualifies/supersedes** several facts above; treat the originals as the prior design, not current:

- **CDP/WS exposure is NOT a "low-effort, high-leverage" win** (corrects the OSS-findings line above).
  CDP is root access to a warmed session (`Network.getCookies`/`Storage.getCookies`/`Runtime.evaluate`
  read raw tokens). Must not ship on warmed profiles before a safety gate. 4a.7 is on hold pending the
  cold-profile-vs-deferred scope decision.
- **`identity.id IS workspaceId` / strict 1:1:1** is premature narrowing — split into separable
  fields (`defaultWorkspaceId`/`defaultProfileId`); enforce 1-session-per-profile in code, not as the
  domain model. (Qualifies "Identity Model Architecture" above.)
- **Warm-status via event bus is unsafe** — that bus is the *logging* bus, and a session close does
  not mean "warm" (failed login / logout / abandoned all get marked warm). Use an explicit, direct
  awaited `markWarm()`. (Corrects "Warm-status via event bus" above.)
- **The warmed profile itself is the credential-at-rest store** — `vaultRef` dormancy is a red
  herring; cookies/refresh-tokens/DBSC keys are live on disk now (extends the "credentials never in
  the shared jar" decision). Needs FS perms / at-rest encryption / OS keyring before broad use.
- **Unauthenticated MFA local routes** (planned) need capability-token + Origin/Host + CSRF-nonce;
  "localhost" is transport, not a security boundary. Agent-supplied MFA prompt/target = phishing risk.
- Unanimous **green:** the OSS license calls (Maxun AGPL reference-only; fingerprint npm deps safe).

## Key Spike Results

- **fastify-sse-v2 v5 compat** — **RESOLVED (S3, 2026-06-03):** proven compatible with Fastify
  **5.8.5**. A throwaway-branch probe ran the full suite + a live SSE stream against v5 — all
  green (`sse.integration.test.ts` + `tab-updated.integration.test.ts` included). The peerDep
  `>=4` claim held. Hand-rolled-SSE contingency was defined but unused. (Was: untested.)
- **System Chromium executablePath — RESOLVED (2026-06-04).** Installed `chromium-148.0.7778.215`
  (Fedora `updates` repo) at `/usr/bin/chromium-browser`. Probe passes: spawned via `spawnAndConnect`
  with the system binary, CDP reports the system build (not bundled `.96`), `webdriver===false`.
  `FEATHER_CHROMIUM_PATH` now selects it (`6e4f099`). Same major as bundled → version-skew risk low,
  as predicted.
