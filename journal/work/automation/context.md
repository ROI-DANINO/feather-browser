# Automation Desk

Use this desk for Playwright integration, agent control, permission boundaries, replay/debug tooling, and profile isolation.

## Bot gymnasium — Step 1 (durable, 2026-06-26 — shipped to `dev`)

Top-level **`gym/`** is the gym: an HTTP **client** of a running Feather server — drives Feather only
over the local API, **never imports `src/`** (so the harness stays a driven body; Step 2's fable wire
reuses the same client). `gym/classify.ts` = pure verdict logic (tested); `gym/behavioral.ts` = the
runner; `gym/results.md` = the scoreboard. Run: `npm run gym:behavioral` (needs `npm run dev` up in a
headed-capable shell). Design `docs/specs/2026-06-26-gym-step1-behavioral-diagnostic-design.md`.

**Durable conventions:**
- **Diagnostic, not trophy:** target detectors that can *teach* (a weakness), not ones Feather already
  passes. **Test against detectors Roi does NOT control; design tests that can fail** (honest-test
  guardrail — else the sandbox becomes rig-your-own-green-checkmarks).
- **"No score = FAIL" — but only when the detector is UP** (corrected 2026-06-27). An unscoreable
  session is a tell *when the grader works*; a grader whose backend is DOWN can't score anyone, so
  that's **`BLOCKED`**, not FAIL. `gym/classify.ts` carries a `BLOCKED` outcome + `detectorDown` signal
  (pure); `gym/behavioral.ts` `absDetectorDown()` probes the backend (timeout-guarded, gated to unscored).

**`bot.incolumitas.com` behavioral detector facts (verified live 2026-06-26, CORRECTED 2026-06-27):**
- Score `behavioralClassificationScore` runs **0 (bot) … 1 (human); below 0.5 = bot** → calibration
  `{ humanThreshold: 0.5, direction: "higherIsHuman" }`. Auto-updates at 1.5/4/7/10/15s of browsing.
- Read it from the **page snapshot text** after `Your Behavioral Score:` (no fragile DOM-id needed) —
  unscored reads the literal `...` (no digit).
- **The score is computed SERVER-SIDE** by `abs.incolumitas.com`: `lib.js` builds `window.bd_client`
  (collects frames) → `getBehavioralClassification()` POSTs them to
  `https://abs.incolumitas.com/classify?key=public123`. **If `abs.incolumitas.com` is down, the score
  reads `...` for EVERYONE — human or bot.** (Verified down 2026-06-27: 502 on /lib.js,/get,/classify,/store2.)
- **MISDIAGNOSIS CORRECTED:** the 2026-06-26 claim "UNSCORED because clicks teleport / no cursor path,
  upgrade = mouse-motion" was **wrong**. An independent Playwright probe proved a Feather-style path
  delivers **156 trusted `mousemove` events** (isTrusted, with movement deltas) and the score *still*
  read `...` — because the grader was offline. Feather's `/move` capability (below) IS built and
  verified; it just can't be graded by this detector until `abs.incolumitas` recovers.

**Feather `/move` cursor capability (durable, 2026-06-27 — on `dev`, NOT pushed):**
- `POST /v1/sessions/:id/move` (`{target}` XOR `{x,y}`, optional `opts`) drives `page.mouse.move`
  waypoint-by-waypoint along a curved, variable-velocity path (`src/browser/mouse-path.ts`, pure +
  seedable + tunable; `MoveHandler` tracks last cursor pos in a `WeakMap<Page>`, pause-aware). Native
  `page.mouse` only (no CDP). Verified to deliver real trusted mousemove events. `opts` knobs
  (steps/curviness/jitter/overshoot) are the trial dials for the gym.

## Graphify code-wiring map (durable, 2026-06-10 — graduated to `dev`)

Standalone read-only **MCP query layer** over a deterministic code graph (`graphify-out/graph.json`,
gitignored; 719n/1592e at graduation). Agents answer "what breaks if I touch X?" via `graphify affected`
(CLI) or `mcp__graphify__*` tools — file:line answers, never raw source. **Installer-free by decision**
(its skill + PreToolUse hook would hijack the custom skill pipeline): `.graphifyignore` fences ALL
markdown/docs/journal/skills out of the graph (intent layer stays ours); `.githooks/post-commit`
(path-agnostic, enabled via `core.hooksPath .githooks`) auto-refreshes per commit (~2s, no LLM, detached).
**Rebuild verb = `graphify update .`** — `graphify extract .` fails (LLM semantic pass on docs, no backend).
MCP registration = local scope in `~/.claude.json`, NOT committed.

## Agent Browsing Stack (Phase 5 input — design facts)

Three composable features, build order **Stealth → MFA → Identity**. Specs in `docs/specs/2026-06-07-*`.
Brief: `docs/specs/2026-06-07-agent-browsing-stack-brief.md`.

**Durable design conventions established (apply to all agent-runtime work):**
- **Stealth mode model:** `secure` (default) / `assisted`, keyed on *who generates input* — agent →
  secure (needs human-shaped input synthesis); human driving → assisted (real input, no synthesis).
  Fingerprint layers always-on in both. **Mode is mutable** (human takeover = secure→assisted→secure).
- **Verify, don't spoof:** stealth verifies the real fingerprint and keeps it from leaking; it does NOT
  fake canvas/fonts (tampering is itself a tell). Feather's real anti-detection asset is the
  architecture (real headful system Chromium on the user's real IP), not a stealth module.
- **`needs-confirmation` result-type convention:** model "needs a human decision" as a first-class,
  pollable result/status — NOT a thrown control-flow exception. (Established for MFA; reused by Identity.)
- **Human-in-the-loop (MFA):** agent supplies the target field; **Feather types the code; the agent
  never sees the raw code** (mirrors the CredentialsVault philosophy). Push approval = no typing (user
  taps phone + confirms on a local page). Notification: local page in v1, Telegram is a designed-in seam.
- **Legal line (hard):** the agent acts as the authorized user, never as an attacker — no captcha bypass,
  no paywall bypass, no scrape-at-scale. Walls get handed to the human, never auto-solved.

**Plans carry no phase/milestone numbers** — a roadmap re-sequencing pass (after all 3 plans exist)
assigns them and cuts tasks into work sessions.

## v1 Instagram test findings (2026-06-08) — feed into v2 MFA Handler design

- **Banner dies on navigation.** CDP-injected DOM banner is wiped on any full page navigation (e.g.
  Google password submit). For the v2 MFA Handler: must re-inject on `framenavigated` while a pause is
  active, OR use `resumeOn` end-state polling, OR an off-page persistent resume surface.
  - **RESOLVED + PROVEN LIVE (2026-06-24).** `await-human` (`src/commands/await-human.ts`) re-injects
    the Resume banner on every `domcontentloaded` (not `framenavigated` — fires once per new document
    with `document.body` present) AND races a `resumeOn` end-state signal. Hero demo v2 ran it against
    **Google's real login** (throwaway acct): banner appeared on `accounts.google.com`, **survived the
    email→password navigation**, auto-resumed on inbox-visible. Log- + frame-verified
    (`docs/v1_wrap/hero-demo-v2/gate-report.md`). **Still unproven:** survival across a 2FA challenge
    *page* (none fired same-machine) — real-account run is the next test.
- **Confirmation code inputs on IG ignore `fill` + `type` modes.** Workaround: Shift+Tab to move
  keyboard focus to the input, then individual `press` per digit. Root cause: custom React input
  handling. Pattern to remember for any code-entry step.
- **Check spam first** for confirmation/verification emails. IG sends to spam. Inbox-first search wastes
  time. Rule: inbox → spam → wait+retry.
- **Tab API creates blank page** — `POST /tabs` does not auto-navigate; must follow with explicit
  `POST /navigate` on the new pageId.
- **Element discovery friction.** IG markup has no `placeholder`/`name`, aria-labels only on some
  fields → must probe DOM and fall back to index selectors (`input >> nth=N`, `[role=combobox] >> nth=N`).
  This is the primary input for Session 4a.8 (a11y/DOM snapshot so the agent gets stable handles).
- **Core driving works end-to-end.** Form fill → email verify → social interaction (like, comment) all
  passed on a real site. Friction is tooling, not the core architecture.

## v1-wrap forensics + API surface (durable, 2026-06-11 — META-ANALYSIS supersedes the 2026-06-10 v1_wrap docs where they disagree)

- **"API Error: The socket connection was closed unexpectedly" in a subagent transcript = the
  HARNESS's Anthropic connection died**, not the platform under test. Check `isApiErrorMessage`/
  `model:"<synthetic>"` on the final transcript line before blaming Feather. Corollary: grep counts
  over transcripts match the errand PROMPT text too — verify endpoint-level `tool_use` calls, not
  string hits (the "H3 liked a post" claim was exactly this artifact).
- **Headed-CDP mode now honors `viewport` as the OS window size** (`--window-size` at spawn;
  deliberately NOT Playwright emulation — keeps the headed fingerprint faithful; content viewport ≈
  window minus chrome). `proxy` remains unapplied in this mode — logged `session.option.ignored`.
- **Tab discovery:** `GET /v1/sessions/:id/tabs` is ground truth; click's `newPageId` is strictly
  best-effort (the context `page` event usually fires AFTER the click response — measured; also
  unreliable under concurrent clicks). Same signal-vs-ground-truth pattern as `/dismiss`.
- **Extract:** flat `{fields}` accepted; `type` optional (defaults text, infers attribute);
  `type:"value"` reads input/textarea/select current values (text reads can't see them). A general
  `/evaluate` endpoint is deferred to v2 Gate A by design (ADR-0010 high-privilege surface).
- **Observability:** every POST action writes `action.completed` (action + statusCode ONLY, never
  bodies — credential discipline) to the session JSONL; `GET /v1/sessions/:id/health` = CDP-alive
  probe (agent-died vs browser-died in one call). Security rule learned in review: global Fastify
  `onResponse` hooks fire for unauthenticated 401s/404s too — anything that writes to disk from a
  hook must re-check auth/session registration itself.
- **M2/httpbin is NOT stealth evidence** in either direction (rerun 200s vs original
  curl-200/browser-503×4; cause undetermined). M1 cold-profile search walls remain 5d's evidence.
- **`/screenshot` returns an artifact descriptor** `{artifactId, path, mimeType}` — read the PNG
  from `path`; screenshot-then-read is the sanctioned vision fallback for overflowing reads.

## Perception/operator durable facts (2026-06-10)

- **Operator skills teach the observe loop** (`observe → act by ref → re-observe`), rewritten
  2026-06-10; `docs/agent-playbook.md` stays the deeper reference and wins on conflict.
- **Dismiss reaches same-origin iframe overlays** (child-frame actions inherit the containing
  top-frame overlay's `overlayIndex`, walk.ts). **Cross-origin iframe overlays = `await-human` by
  design** — their documents are never walked (third-party CAPTCHA frames are exactly this).
- **IG feed caption is CSS-unreachable** (first `span[dir=auto]` = username, first `img` = avatar,
  no `h1`, videos have no content img — probed live). Durable recipe: parse snapshot TEXT structure
  `author / stats / author-repeated / caption / more`. Works for photo and video posts; survives
  IG class churn.
- **`data:`-URL iframes are opaque-origin** (cross-origin to their parent) — same-origin iframe
  tests must ride real local-HTTP fixtures. Same family as Chromium's silent data:-URL nav block;
  both traps now pinned in integration tests.
- **Showcase suite asserts semantically** (2026-06-10): PASS = errand done right (H1 date+name on
  day view; H3 "Unlike" state flip + content-aware comment visible; M3 target fact; H4 per-fact
  patterns). PARTIAL stays the honest first-class outcome.

## Session-launch recipes (durable; verified against source 2026-06-09)

- **Disposable headless:** `POST /v1/sessions` `{"profile":{"kind":"disposable"},"browserMode":"chromium-new-headless","viewport":{...}}`.
- **Warmed headed:** `{"profile":{"kind":"persistent"},"workspaceId":"scratch","browserMode":"chromium-headed-cdp","viewport":{...}}`.
  The **persistent profile dir is keyed by `workspaceId`** (`src/sessions/manager.ts:85-87` → `paths.profileDir(workspaceId)`),
  so `workspaceId:"scratch"` reuses the warmed jar. **One session per profile** → a 2nd launch on a locked profile
  returns `409 PROFILE_LOCKED` (close the stale session, then relaunch). Headed needs the server started with
  `WAYLAND_DISPLAY`/`DISPLAY`.
- **Stale doc:** `docs/api-reference.md`'s `browserMode` enum omits `chromium-headed-cdp` — the real enum
  (`src/transport/routes.ts:30`) has all three. (Fix queued as showcase plan Task D4.)

## Showcase/eval suite — run by Roi's pi_agency team (durable direction, 2026-06-09)

- The Feather v1 **showcase/eval suite** (spec `docs/specs/2026-06-09-showcase-eval-suite-design.md`, plan
  `...-plan.md`) is **run by Roi's pi_agency agent team** (Pi harness), not by Claude Code. The grounding
  (project-local `.pi/`) was done by **Claude** (the Codex-setup framing is superseded). pi agents have
  `bash` → drive Feather over the localhost API directly (no bridge). The suite is a **stress-and-learn
  instrument**: `PARTIAL`+lesson is first-class. Governing principle: root `AGENTS.md` § "Testing Honesty".

## Pi harness mechanics (durable; verified from source + bundled docs, 2026-06-09)

- **Project context file = `AGENTS.md`** (then `CLAUDE.md`). There is **no `PI.md`.** Pi walks up from cwd
  loading it (`pi dist/core/resource-loader.js:30`). Feather's root `AGENTS.md` already serves this.
- **`.pi/settings.json` (project) overrides global `~/.pi/agent/settings.json`** — so the parent/orchestrator
  model can be pinned **project-locally**, no blast radius to other projects (`pi docs/settings.md:3,272`).
- **Subagent skills wall holds by design:** an agent with `inheritSkills:false` + `skills:<list>` resolves
  **only** the listed skills (`pi-subagents skills.ts resolveSkills`). The "all global skills appear" Roi saw
  is the **parent session's catalog** — global by design, **no per-project subtract** — cosmetic, never
  reaches the walled subagents. (This retired the "wall not holding" worry.)
- **Subagent dispatch is a parent CHOICE** (a tool call it can shortcut). **Solo "drive Feather" → use the
  `feather-operator` SKILL** (parent drives inline; PROVEN). **The suite → use the `showcase-run` CHAIN**
  (`/run-chain feather.showcase-run -- <task>`) which forces per-model planner→coder→reviewer→validator
  dispatch. Both PROVEN 2026-06-09 (operator loop + 4-step chain).
- **OpenRouter model lineup (per role):** parent qwen3.7-max · planner minimax-m3 · coder glm-5.1 ·
  operator glm-5-turbo→glm-5.1 · validator kimi-k2.6 · reviewer opus-4.8. Each has an OpenRouter fallback.
- **Gotchas (fix before the real suite):** (1) **model self-ID is unreliable** — verify which model ran via
  the pi **UI badge**, not the agent's prose; (2) run the chain with **TEMPLATE VARS** (`{task}`/`{outputs.X}`),
  not fully-custom inline step tasks, or intermediate outputs aren't persisted; (3) ~6m/task is heavy;
  (4) OpenRouter **connection errors recur** and fallbacks don't always rescue in time.
- **Thin operator-skill corrections (verified vs source):** `wait` always needs a `target` (even
  `until:"stable"`); close = `DELETE /v1/sessions/:id` with **no** `Content-Type` header (empty body → 400).
- **All subagents run `fresh` (2026-06-09, `12b96a9`).** Forking was the chain's only fragile bit — a
  forking step has no parent history to copy when fired into a cold/fresh session (`fork-context.ts:58`),
  giving exit-143 / "forked session file does not exist". A `fresh` step still gets the prior output via
  `{outputs.X}` injection, so nothing is lost. coder+operator pinned in agent files; planner via
  `.pi/settings.json` override (builtin override honors `defaultContext`, `agents.ts:459`). Clean chain
  proven: `af0cfcdc` + E1–E3 rerun, no recovery.
- **Verify which model ran from `meta.json`, not prose/badge.** Each step writes
  `subagent-artifacts/<run>_<agent>_<step>_meta.json` with the recorded `model` (+ `modelAttempts`). The
  agent's prose self-ID **lies** (coder reported "Claude Sonnet 4" while running `glm-5.1`). This retires
  the old "verify via UI badge" note above — `meta.json` is the authoritative source.

## Tower adapters — the brain/body pattern (durable, 2026-06-29 — Chunk 2a shipped to `dev`)

`gym/` → **`tower/`** (renamed 2026-06-27). The Tower drives agentic tools through **adapters** that
conform to the Chunk-1 `Adapter` interface (`{ id; run(task): Promise<void> }`). An adapter **drives,
never grades** — returns void on a finished drive (done/give_up/budget/timeout), throws only on a real
drive error; all verdicts come from *outside* the adapter (the level page self-reports / the victim app
observes state).

**`adapter.feather` (`tower/core/adapters/feather.ts`)** — Feather is a browser *body* with no LLM, so the
adapter wires a **small Tower-owned Claude "brain"** in front of it: `tower/core/agent/brain.ts`
`driveToGoal` runs observe→decide→act over **Feather's HTTP API only** (`tower/core/adapters/feather-client.ts`,
**never imports `src/`** — the no-attach honesty rule). The brain is **throwaway-small and Tower-owned, NOT
fable/iroh** ("integrate by driving, never merge"). Action vocabulary is exactly **four verbs**
(click/type/done/give_up) via Claude **forced tool-use**, Zod-validated before acting. Loop is bounded by a
**step budget + a wall-clock timeout** (injectable clock → deterministic tests). DI seams
(`BrowserSessionClient` + `Decide`) keep brain+adapter unit-testable with mocked LLM + mocked browser (no
key/net); real composition runs only in the opt-in `npm run tower:smoke:feather` (real Feather + real Claude,
NOT in CI). Provider = Claude/Anthropic (`@anthropic-ai/sdk` in root pkg), default `claude-opus-4-8`.

**Durable conventions (carry forward to 2b browser-use + future adapters):**
- **Drive over the tool's external boundary, never weld in** — HTTP for Feather, subprocess+stdin/stdout JSON
  for browser-use. The Tower stays off the browser↔site data path (no Playwright/CDP attach to the measured browser).
- **Verdicts external, never adapter-reported.** Capability is stubbed in PR-1; the adapter never reports task success/fail.
- **Live runs are real/costed/nondeterministic** — honest wander/give_up is a first-class outcome, not a hidden defect.

## Tower level model + arena ethics (durable, 2026-06-30 — Roi's orientation interview, decisions D7–D10)

Roi re-derived the locked 3-angle design (capability/detectability/security + boss tower) unprompted and
sharpened it. These are durable architecture decisions for the level-design session that follows PR-1 (they
do **not** resequence PR-1; capability stays gate-stubbed there). Full text → `tower/decisions.md` D7–D10.

- **One shared task pool, three lenses (D7).** The capability ("real-life tasks") tower **authors** the
  errands once (book a flight, scrape a forum, post/comment, read email); the detectability + security
  towers **reuse the same tasks**, each making it hard on its own angle. The task is the shared unit; the
  angle is the lens. Fills the "levels not designed yet" gap the synthesis deferred.
- **Difficulty = page structural messiness (D8).** A capability level's difficulty is how hard the *page* is
  to operate (DOM depth, popups/modals, layered/obfuscated markup), NOT task semantics. Source data exists —
  mine past Feather driving sessions for easy→nightmare examples.
- **Own-arena ethics extends to detectability (D9).** The Tower hosts **real commercial guards**
  (Cloudflare Bot Management / DataDome / Turnstile — paid) **in front of its OWN arena pages**: own the
  page, put the real guard on it, point the agent at your own guarded page → real detection tech, zero ToS
  violation (makes the synthesis's "L4 = live/non-reproducible" guards partly reproducible). Levels
  **IMITATE** hard real sites (Facebook/gov/insurance) for realism; the Tower **never drives the real ones**.
  Real sites that *explicitly welcome* agents may be a separate live track. **The Tower is a peaceful,
  ToS-respecting project** — the same anti-bot-testing line as the rest of the repo. Memory:
  `tower-arena-imitates-sites-real-guards`. Relief on build cost: copy each level's *mechanism* (the guard /
  the injectable spot / the task shape), not a pixel-clone of the site.
- **Repo split deferred (D10).** Tower stays in feather-browser for now; re-ask Roi at the Chunk-2b boundary
  (first non-Feather tool = browser-use). Coupling is already zero (HTTP-only, never imports `src/`).
