# Automation Desk

Use this desk for Playwright integration, agent control, permission boundaries, replay/debug tooling, and profile isolation.

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
