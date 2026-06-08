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

## Showcase/eval suite — execution delegated to pi_agency (durable direction, 2026-06-09)

- The Feather v1 **showcase/eval suite** (spec `docs/specs/2026-06-09-showcase-eval-suite-design.md`, plan
  `docs/specs/2026-06-09-showcase-eval-suite-plan.md`) is to be **run by Roi's pi_agency agent team** (Pi harness),
  not by Claude Code. Setup ("set the ground") is done via **Codex**. Brief:
  `docs/specs/2026-06-09-codex-handoff-pi-agency-runs-feather.md`.
- pi agents have `bash` → drive Feather over the localhost API directly (no bridge). The suite is a
  **stress-and-learn instrument**: `PARTIAL`+lesson is a first-class pass. Governing principle: root `AGENTS.md`
  § "Testing Honesty — Objective, Not Flattering".
