# Roadmap

## Destination

Build a Hybrid Browser: a hyper-lightweight Chromium-compatible daily driver with a Zen-inspired
visual shell, and a "Cookie Mine" where human browsing builds a shared persistent trust context
(cookies, session state) that local AI agents can piggyback on through a local Fastify
MCP-compatible hub. Agents operate only inside explicit user-authorized session state with human
approval checkpoints.

The human browser and the agent runtime are architecturally coupled: the human session is the trust
foundation agents depend on. Phase 4 is therefore the prerequisite foundation for Phase 5+.

Feather should not depend on Chrome extensions as its product strategy. Critical capabilities should
be native or integrated project features, using mature open-source tools only where they reduce risk
and cost.

## Public Surface: Feather Core vs. Feather Shell

**Feather Core** is the near-term open-source surface: the local browser runtime, sessions and
profiles, snapshots, extraction, screenshots, debug bundles, and the local API (future MCP tool
interface). This is what another developer can pick up and use today. Lead with Core.

**Feather Shell** is the larger, platform-specific vision: the Zen-inspired visual browser shell,
the long-running human browsing context, and later agent-facing workflows. It matters, but it comes
after Core is adoptable.

## Roadmap Model

- Phases are destination points; sessions are the executable work units.
- Each active or near-term phase is cut into recommended work sessions.
- A future agent should be able to start a session by reading only the listed files, then following
  that session's tasks.
- Only the current phase gets operational checkboxes in `journal/ops/tasks.md`; future phases stay
  here until promoted.
- Every phase starts with a planning/reconciliation pass before implementation.
- Every phase ends by reconciling `ROADMAP.md`, `journal/context/active.md`,
  `journal/ops/tasks.md`, `journal/ops/phase.md`, and `journal/log.md`.

## Standard Session Closing Rule

Every session below uses this closing rule unless it says otherwise:

- Run `/next` when moving to another work session or chat before a real stopping point.
- Run `/stop` when closing a workday, major work block, or phase.
- Update `journal/context/active.md` to point to the next recommended Roadmap session.
- Update `journal/ops/tasks.md` if task state changed.
- Update `PROGRESS.md` only for milestone-level progress.
- Update `journal/log.md` according to the existing short-line convention.
- Do not archive or delete planning history except through the documented `/stop` lifecycle.

## Phases 0-3 - Complete

Full milestone and exit-criteria detail is archived at
`journal/ops/archive/roadmap-phases-0-3.md`.

- **Phase 0 - Workspace Setup**: project operating system (`/start`, `/next`, `/stop`, tracking
  files, git).
- **Phase 1 - Headless Core Architecture Decision**: pivoted to headless-first; ADR-0002
  superseded the visible-shell ADR-0001.
- **Phase 2 - Headless Core Prototype** (2026-05-31): smallest functional headless core; all exit
  criteria met.
- **Phase 3 - Browser Core Stabilization & UI Readiness** (merged to `master` 2026-06-03): clean
  API contract, lifecycle events, dynamic tab tracking, stale-lock recovery, and `GET /v1/events`.
  The Stabilization & Linux-Readiness bridge is closed.

Phase closing rule: do not reopen these phases unless there is a critical correctness issue. Use
archive docs for history; do not load them during normal `/start`.

---

## Phase 4a - Feather Core Open-Source Readiness And Public Proof

Status: In progress, late stage.

Goal:
Make Feather Core understandable, runnable, and useful before over-investing in the visual shell.
Preserve the LinkedIn/demo path, fold in the 2026-06-07 integration research, and leave a practical
session map for the Agent Browsing Stack work.

Why this matters:
Core is the adoptable product surface today. The shell and future agent runtime only make sense if
the local browser runtime is stable, documented, demonstrable, and easy for other tools to attach to.

Current recommended session:
`Session 4a.7 - CDP/WS Endpoint Exposure` is the next unblocked implementation session. The
LinkedIn debut recording remains valid but is blocked on installing a Niri/Wayland screen recorder.

### Session 4a.1 - Core-First Reorientation And Quickstart Demo

Status: Done.

Goal:
Make Feather Core legible and runnable for a stranger.

Read before starting:
- Core context: `docs/public-positioning.md`, `README.md`, `docs/architecture.md`,
  `docs/api-reference.md`
- Specs: `docs/specs/2026-06-05-core-first-reorientation-design.md`
- Plans: `docs/plans/2026-06-05-core-first-reorientation.md`
- Source files: `examples/quickstart.sh`, `examples/README.md`

Tasks:
- Rewrite the public-facing README around Feather Core.
- Add and verify `examples/quickstart.sh`.
- Correct endpoint/token discovery docs.
- Keep shell work out of scope.

Expected output:
- README leads with Feather Core.
- `examples/quickstart.sh` runs the full session loop.

Definition of done:
- Public quickstart works against a live server.
- Core-vs-Shell split is visible in docs.
- No shell implementation work.

Risks / blockers:
- Demo/docs drift can reappear when API fields change.

Do not do yet:
- Do not add a GUI shell or agent runtime.

Closing:
- Use the standard session closing rule.

### Session 4a.2 - Core Input Commands For The Hero Demo

Status: Done.

Goal:
Teach Feather Core to act on pages with click, type, press, and wait commands.

Read before starting:
- Specs: `docs/specs/2026-06-06-core-input-commands-design.md`
- Plans: `docs/plans/2026-06-06-core-input-commands.md`
- Source files: `src/commands/click.ts`, `src/commands/type.ts`, `src/commands/press.ts`,
  `src/commands/wait.ts`, `src/browser/locators.ts`, `src/transport/routes.ts`
- API docs: `docs/api-reference.md`

Tasks:
- Implement the four input commands.
- Add locator resolution and action error mapping.
- Document the new API surface.

Expected output:
- Feather can drive the visible ChatGPT -> Gmail demo path over HTTP.

Definition of done:
- Unit, integration, and typecheck gates from the plan pass.

Risks / blockers:
- Selector drift is expected for live sites; the core API should remain generic.

Do not do yet:
- Do not build generic agent orchestration.

Closing:
- Use the standard session closing rule.

### Session 4a.3 - Hero Demo Workflow And Recording Prep

Status: Done, recording blocked on screen recorder install.

Goal:
Provide a safe, recordable ChatGPT -> Gmail demo using the warmed `primary` profile.

Read before starting:
- Specs: `docs/specs/2026-06-06-hero-demo-workflow-design.md`
- Plans: `docs/plans/2026-06-06-hero-demo-workflow.md`
- Source files: `scripts/demo/hero-chatgpt-gmail.ts`, `scripts/demo/hero-helpers.ts`
- Public docs: `README.md`, `examples/README.md`

Tasks:
- Drive ChatGPT, extract the reply, open Gmail, and compose a draft without sending.
- Keep cookies and profile material out of the repository.
- Harden login-continuity and burner-profile behavior.

Expected output:
- `npm run demo:hero` works live.

Definition of done:
- Live run verified.
- No repository cookie/profile leakage.
- Demo stops before sending mail.

Risks / blockers:
- Recording still needs a Wayland-compatible screen recorder such as Kooha or `wf-recorder`.

Do not do yet:
- Do not make this site-specific demo the public generic quickstart.

Closing:
- Use the standard session closing rule.

### Session 4a.4 - Agent Browsing Stack Specs

Status: Done.

Goal:
Write the three Agent Browsing Stack specs and implementation plans before implementation.

Read before starting:
- Core brief: `docs/specs/2026-06-07-agent-browsing-stack-brief.md`
- Specs: `docs/specs/2026-06-07-stealth-stack-design.md`,
  `docs/specs/2026-06-07-mfa-handler-design.md`,
  `docs/specs/2026-06-07-identity-model-design.md`
- Plans: `docs/specs/2026-06-07-stealth-stack-plan.md`,
  `docs/specs/2026-06-07-mfa-handler-plan.md`,
  `docs/specs/2026-06-07-identity-model-plan.md`
- Research: `research/2026-06-07-council-audit-stealth-stack.md`

Tasks:
- Spec Stealth Stack.
- Spec MFA Handler.
- Spec Identity Model.
- Record dependencies and guardrails.

Expected output:
- Three ready-to-implement plans with no assigned phase numbers yet.

Definition of done:
- Stealth, MFA, and Identity plans exist and compose cleanly.
- Stealth is the root dependency, MFA consumes the mutable stealth seam, Identity wraps both.

Risks / blockers:
- These are future-agent-layer plans; do not start implementation until the roadmap promotes them.

Do not do yet:
- Do not implement Stealth, MFA, Identity, vault, or MCP in this session.

Closing:
- Use the standard session closing rule.

### Session 4a.5 - Open-Source Integration Research

Status: Done.

Goal:
Evaluate Browser Use, Crawl4AI, OpenHands, and Maxun for practical Feather integration paths.

Read before starting:
- Research: `research/2026-06-07-open-source-integration-research.md`
- Specs: `docs/specs/adr-0005-agentic-north-star.md`,
  `docs/specs/adr-0006-agent-interface-neutrality.md`
- API docs: `docs/api-reference.md`

Tasks:
- Identify compatible integration paths.
- Record license blockers and useful patterns.
- Produce roadmap constraints.

Expected output:
- Integration recommendations are ready to fold into roadmap sequencing.

Definition of done:
- Browser Use CDP attach, Crawl4AI markdown extraction, OpenHands MCP future path, and Maxun AGPL
  blocker are recorded.

Risks / blockers:
- Maxun code must not be imported because AGPL is a permanent blocker for Feather reuse.

Do not do yet:
- Do not add runtime dependencies from these projects.

Closing:
- Use the standard session closing rule.

### Session 4a.6 - Roadmap And Task Reconciliation

Status: Current rebase session.

Goal:
Rebase `ROADMAP.md` into this practical session-based execution map and align the startup pointers.

Read before starting:
- Core context: `AGENTS.md`, `README.md`, `PROGRESS.md`, `ROADMAP.md`,
  `journal/context/active.md`, `journal/context/next.md`, `journal/ops/tasks.md`,
  `journal/ops/phase.md`, `journal/log.md`, `journal/docs-map.md`
- Specs: all relevant current specs under `docs/specs/`
- Plans: all relevant current plans under `docs/plans/`
- Research: `research/2026-06-07-open-source-integration-research.md`,
  `research/2026-06-07-council-audit-stealth-stack.md`,
  `research/2026-06-05-cookie-isolation-spike-findings.md`,
  `research/2026-06-05-anti-detection-self-test.md`,
  `research/2026-06-05-phase4-gui-architecture-sketch.md`
- Commands / workflow docs: `docs/commands/start.md`, `docs/commands/next.md`,
  `docs/commands/stop.md` only if workflow alignment is in question

Tasks:
- Audit current planning files, specs, plans, and research.
- Preserve existing product vision and completed work.
- Rewrite this roadmap into session form.
- Align `active.md`, `tasks.md`, and `phase.md`.
- Keep command workflow docs unchanged unless a direct contradiction blocks this pass.

Expected output:
- `ROADMAP.md` is the main structured map of future work sessions.
- `active.md` is a short pointer, not a second roadmap.
- `tasks.md` is a practical checklist aligned to this roadmap.

Definition of done:
- A future session can answer "what next, what to read, what to do, what proves done" from this
  file without loading the whole repo.
- No product source files changed.

Risks / blockers:
- Existing command-workflow edits are already in the dirty tree; this session must not redo or
  overwrite them.

Do not do yet:
- Do not implement product features.

Closing:
- Use the standard session closing rule.

### Session 4a.6b - Security & Capability Re-Sequencing (from council review)

Status: Pending, recommended next session. Supersedes "start 4a.7 as-is".

Classification:
Planning / reconciliation pass. No product code.

Goal:
Act on the 2026-06-07 council design review (5/5 models): reverse the sequence from
"interop first" to "capability/security model first, interop through that model", and re-thread the
roadmap accordingly.

Why this matters:
The council unanimously found Feather is exposing the highest-privilege surfaces (CDP attach,
unauthenticated MFA routes, warmed credentials on disk) before the safety machinery that should govern
them. A warmed Chromium profile is effectively a bearer-credential vault; CDP/WS attach is root access
to it. Shipping 4a.7 as a "simple interop quick win" contradicts the core security thesis.

Read before starting:
- Review: `research/2026-06-07-council-design-review.md` (the findings + action list)
- Core context: `ROADMAP.md`, `journal/context/active.md`, `journal/ops/tasks.md`,
  `journal/ops/phase.md`
- Specs w/ council addenda: `docs/specs/2026-06-07-mfa-handler-design.md`,
  `docs/specs/2026-06-07-identity-model-design.md`
- Security context: `docs/specs/adr-0008-credentials-vault.md`,
  `docs/specs/adr-0005-agentic-north-star.md`, `docs/specs/adr-0006-agent-interface-neutrality.md`
- Research: `research/2026-06-07-open-source-integration-research.md`

Tasks:
- Decide the 4a.7 split: cold/throwaway-profile interop demo now vs. defer warmed attach behind the
  safety gate. Rewrite the 4a.7 session to match.
- Write an ADR for the local control-plane / capability model (how a local caller proves it may touch
  a warmed session): token/capability tokens, `Host`/`Origin` rules, audit events, dangerous-mode
  policy.
- Re-order the Phase 5 spine from the council finding: safety gate -> Identity (self-contained) ->
  MFA -> warmed CDP attach -> Stealth last. Record the decision; do not pre-commit cross-module
  placeholder type contracts.
- Fold the MFA + Identity security addenda into their plan files' task lists (route hardening,
  session-hold primitive, explicit warm-status, profile-at-rest).
- Reconcile `active.md`, `tasks.md`, `phase.md` to the new sequence.

Expected output:
- A re-sequenced roadmap, a new control-plane/capability ADR, and a clear next implementation session.

Definition of done:
- The roadmap reflects "security model first"; 4a.7 is re-scoped; the Phase 5 order is updated.
- A future session can start the first security task by reading only the listed files.
- No product source files changed.

Risks / blockers:
- Scope creep into implementation — this is a planning pass only.
- The monolithic `ROADMAP.md` may warrant a split into per-session files (council Q1); decide that
  here or explicitly defer it.

Do not do yet:
- Do not implement the capability model, MFA hardening, or CDP exposure.
- Do not start 4a.7 until its scope decision is made here.

Closing:
- Use the standard session closing rule.

### Session 4a.7 - CDP/WS Endpoint Exposure

Status: Pending, recommended next unblocked implementation session.

> ⚠ **Council review 2026-06-07 (5/5 models) flags this as a security-sensitive capability release,
> not a simple interop quick win.** CDP is effectively root access to the warmed session
> (`Network.getCookies` / `Storage.getCookies` / `Runtime.evaluate` read raw tokens), and it would
> ship *before* the Phase 5.0 safety gate. **Decision needed before starting:** scope 4a.7 to
> cold/throwaway profiles only (interop proof), or defer warmed-profile attach behind Phase 5.0
> (capability grant + one-time token + TTL + audit + revoke-on-MFA/close). See
> `research/2026-06-07-council-design-review.md`.

Classification:
UI readiness / Core interop quick win.

Goal:
Expose the browser CDP or Playwright WebSocket endpoint in the launch/session response so Browser Use
and Crawl4AI-style tools can attach to Feather-managed sessions.

Read before starting:
- Core context: `ROADMAP.md`, `journal/context/active.md`, `journal/ops/tasks.md`
- Research: `research/2026-06-07-open-source-integration-research.md`,
  `research/2026-06-07-council-design-review.md`
- Specs: `docs/specs/2026-06-04-attach-dont-launch-design.md`,
  `docs/specs/adr-0005-agentic-north-star.md`,
  `docs/specs/adr-0006-agent-interface-neutrality.md`
- API docs: `docs/api-reference.md`
- Source files: `src/browser/modes.ts`, `src/sessions/types.ts`, `src/sessions/session.ts`,
  `src/sessions/manager.ts`, `src/commands/launch.ts`, `src/transport/routes.ts`
- Tech-stack guide: `docs/tech-stack-guidelines.md`

Tasks:
- Verify the current Playwright 1.60 CDP endpoint shape from official docs before coding.
- Identify whether Feather already holds the endpoint and where it should be stored.
- Add a stable, sanitized response field to `SessionRecord` or launch output.
- Add focused unit/integration coverage.
- Document "attach Browser Use to Feather" with a minimal example.

Expected output:
- Launch/session responses expose an attachable endpoint when available.
- Browser Use interop is documented without importing Browser Use.

Definition of done:
- Tests and typecheck pass.
- API docs explain the field and its availability.
- No auth token leakage and no extra remote exposure.

Risks / blockers:
- Dual CDP clients can conflict; document this honestly.
- Endpoint exposure must not accidentally widen access beyond localhost/token-authenticated callers.

Do not do yet:
- Do not build MCP or an agent framework.
- Do not import Browser Use or Crawl4AI.

Closing:
- Use the standard session closing rule.

### Session 4a.8 - Markdown Snapshot Extraction

Status: Pending.

Classification:
Core browser stability / agent-friendly output improvement.

Goal:
Upgrade snapshot output with clean Markdown inspired by Crawl4AI's `DefaultMarkdownGenerator`, while
keeping Feather native TypeScript and dependency-light.

Read before starting:
- Research: `research/2026-06-07-open-source-integration-research.md`
- API docs: `docs/api-reference.md`
- Source files: `src/commands/snapshot.ts`, `src/transport/routes.ts`,
  `tests/unit/commands/snapshot.test.ts`, `tests/integration/snapshot.integration.test.ts`
- Tech-stack guide: `docs/tech-stack-guidelines.md`

Tasks:
- Study Crawl4AI's extraction approach as reference only.
- Design a small TypeScript markdown generator or snapshot field extension.
- Preserve existing snapshot fields.
- Add tests for headings, links, boilerplate trimming, and token-efficient output.
- Update API docs.

Expected output:
- Snapshot responses can include `markdown` output suitable for LLM context.

Definition of done:
- Existing snapshot behavior remains compatible.
- New markdown output is tested and documented.

Risks / blockers:
- Avoid pulling heavy Python or ML dependencies.
- Keep source attribution clean; port patterns, do not copy incompatible code.

Do not do yet:
- Do not add a full Crawl4AI sidecar or dual-CDP crawler.

Closing:
- Use the standard session closing rule.

### Session 4a.9 - LinkedIn Debut Recording And Post

Status: Pending, blocked on screen recorder install.

Goal:
Record the working hero demo and publish the LinkedIn debut without changing the product scope.

Read before starting:
- Core context: `README.md`, `journal/context/active.md`, `journal/ops/tasks.md`
- Demo docs: `docs/specs/2026-06-06-hero-demo-workflow-design.md`,
  `docs/plans/2026-06-06-hero-demo-workflow.md`
- Source files: `scripts/demo/hero-chatgpt-gmail.ts`, `examples/quickstart.sh`
- Writing reference: `blog/0010-the-three-locks.md`

Tasks:
- Install a Niri/Wayland-compatible recorder (Kooha via Flatpak or `wf-recorder` via DNF).
- Run `npm run demo:hero` with the burner/primary safety constraints in mind.
- Record the demo.
- Draft the LinkedIn post from the existing blog cut or a debut-specific cut.
- If docs drift is discovered, make only small factual corrections.

Expected output:
- A recorded hero demo and a LinkedIn-ready post.

Definition of done:
- Demo is recorded without sending the Gmail draft.
- No credentials, cookies, or profile material enter the repository.

Risks / blockers:
- Requires local screen-recorder installation.
- Live site selector drift can require minor demo-script fixes.

Do not do yet:
- Do not turn the hero demo into a general agent platform.

Closing:
- Use `/stop` if this closes the public-debut work block.
- Otherwise use the standard session closing rule.

### Session 4a.10 - Social Research Use-Case Triage

Status: Pending, optional after quick wins.

Goal:
Route the two raw social-research inbox stubs into the right future home without promoting them into
committed product scope prematurely.

Read before starting:
- Inbox: `journal/raw/_inbox/2026-06-07-social-research-agent-usecase.md`,
  `journal/raw/_inbox/2026-06-07-social-research-mode-usecase.md`
- Research: `research/2026-06-07-open-source-integration-research.md`
- Specs: `docs/specs/2026-06-07-agent-browsing-stack-brief.md`,
  `docs/specs/2026-06-07-identity-model-design.md`
- Product context: `journal/work/product/context.md` if this desk is active and the user approves
  loading it

Tasks:
- Decide whether the notes become a product-desk seed, future spec seed, or archived duplicate.
- Preserve the "personal research assistant, not bot/scraping farm" framing.
- Update tasks or product context if promoted.
- Archive only content that has been promoted or superseded.

Expected output:
- Inbox count reflects only genuinely open intake.

Definition of done:
- The use-case seed is discoverable in one authoritative place.
- Uncertain items are marked `Proposed / needs confirmation`.

Risks / blockers:
- Easy to over-promote a raw idea into roadmap commitment.

Do not do yet:
- Do not implement social research mode.

Closing:
- Use the standard session closing rule.

Phase-level definition of done:
- Core quickstart remains runnable and documented.
- Hero demo is either recorded/published or explicitly parked with blocker recorded.
- CDP/WS attach endpoint and documentation are complete.
- Markdown snapshot output is complete or deliberately deferred with rationale.
- Raw inbox items are triaged or explicitly left open.
- `active.md`, `tasks.md`, `phase.md`, and `journal/log.md` agree on the next session.

Phase closing / reconciliation rule:
Close Phase 4a with `/stop`, archive any consumed `/next` bridge material, update `PROGRESS.md` only
if a milestone graduated, and move the active pointer to Session 4b.0 or Phase 5.0 based on
Roi's call.

---

## Phase 4b - Visual Desktop Shell And Human Primary Context

Status: Deferred until Phase 4a closes or Roi explicitly pulls it forward.

Goal:
Wrap the stable Core in a minimalist, Zen-inspired graphical browser shell that consumes the Phase 3
event stream and owns the long-running primary persistent context. Keep agent panels absent.

Why this matters:
The shell is the human trust foundation for the Cookie Mine. It also establishes the visible daily
driver surface, but the seamless browser-surface architecture is still spike-gated.

### Session 4b.0 - Phase 4b Planning Reconciliation

Status: Pending.

Goal:
Refresh shell scope after Phase 4a and decide whether the next shell session is stopgap UI,
Casilda spike, or more research.

Read before starting:
- Core context: `ROADMAP.md`, `journal/context/active.md`, `journal/ops/tasks.md`,
  `journal/ops/phase.md`
- Specs / ADRs: `docs/specs/adr-0003-hybrid-browser-shared-context.md`,
  `docs/specs/adr-0004-runtime-target.md`,
  `docs/specs/adr-0007-phase-4-shell-sequencing.md`,
  `docs/specs/adr-0009-shell-stack.md`
- Research: `research/2026-06-05-phase4-gui-architecture-sketch.md`
- API docs: `docs/api-reference.md`

Tasks:
- Reconfirm Phase 4b scope and what remains deferred.
- Decide whether to start with headed two-window stopgap or Casilda spike.
- Update tasks with only the current shell session.

Expected output:
- A current Phase 4b implementation/session plan.

Definition of done:
- Shell work starts with a reconciled plan, not stale assumptions.

Risks / blockers:
- ADR-0009 is a candidate, not accepted.
- Casilda/GTK work may require user-run package installs.

Do not do yet:
- Do not add agent panels, chat, LLM controls, or credential vault work.

Closing:
- Use the standard session closing rule.

### Session 4b.1 - Shell Stack Joint Call And Casilda Spike Plan

Status: Pending.

Goal:
Turn ADR-0009's recommendation into either an accepted decision or a bounded spike plan.

Read before starting:
- Specs / ADRs: `docs/specs/adr-0007-phase-4-shell-sequencing.md`,
  `docs/specs/adr-0009-shell-stack.md`, `docs/specs/adr-0004-runtime-target.md`
- Research: `research/2026-06-05-phase4-gui-architecture-sketch.md`

Tasks:
- Review GTK4-native vs Tauri/WebKitGTK tradeoffs with Roi.
- Decide whether to run the Casilda + Chromium latency/input spike.
- Record the decision as ADR-0009 accepted, revised, or still candidate with a spike plan.

Expected output:
- A human-approved stack direction or a spike plan.

Definition of done:
- The next shell implementation session has a clear stack gate.

Risks / blockers:
- The decisive evidence is still on-machine latency/input behavior.

Do not do yet:
- Do not implement the full shell before the stack gate is settled.

Closing:
- Use the standard session closing rule.

### Session 4b.2 - Thin Shell Event Projection Prototype

Status: Pending.

Goal:
Build a minimal shell chrome projection over `GET /v1/events` and `GET /v1/sessions`.

Read before starting:
- Research: `research/2026-06-05-phase4-gui-architecture-sketch.md`
- API docs: `docs/api-reference.md`
- Source files: `src/transport/sse.ts`, `src/logs/events.ts`, `src/sessions/types.ts`

Tasks:
- Hydrate shell state from `GET /v1/sessions`.
- Subscribe to SSE and apply idempotent tab/session deltas.
- Render vertical tab/sidebar state and workspace labels.
- Keep active-tab selection shell-local.

Expected output:
- Minimal shell state model and UI projection over existing Core events.

Definition of done:
- The prototype can show sessions and tabs without a parallel API.

Risks / blockers:
- `tab.created` / `tab.opened` lack initial url/title.
- No active-tab/focus event exists yet.

Do not do yet:
- Do not solve the browser-surface embedding problem in this session.

Closing:
- Use the standard session closing rule.

### Session 4b.3 - Browser Surface Spike

Status: Pending, gated by Session 4b.1.

Goal:
Empirically test the browser-surface path on Fedora/Wayland before committing to the seamless shell.

Read before starting:
- Specs / ADRs: `docs/specs/adr-0007-phase-4-shell-sequencing.md`,
  `docs/specs/adr-0009-shell-stack.md`

Tasks:
- Test Casilda + headed system Chromium rendering.
- Measure latency, input forwarding, scaling, cursor behavior, and stability.
- If Tauri remains a candidate, test Casilda coexisting with WebKitGTK in one window.
- Record findings in `research/`.

Expected output:
- Evidence that accepts, revises, or rejects the proposed shell surface path.

Definition of done:
- ADR-0009 can be accepted or revised with empirical support.

Risks / blockers:
- Requires local dependencies and possibly user-run `sudo`/Flatpak steps.

Do not do yet:
- Do not build product shell features before the surface spike answers the gate.

Closing:
- Use the standard session closing rule.

### Session 4b.4 - Visual Shell Prototype

Status: Future.

Goal:
Build the first usable Zen-inspired shell once the stack/surface gate clears.

Read before starting:
- Specs / ADRs: `docs/specs/adr-0007-phase-4-shell-sequencing.md`,
  `docs/specs/adr-0009-shell-stack.md`
- Research: `research/2026-06-05-phase4-gui-architecture-sketch.md`
- API docs: `docs/api-reference.md`

Tasks:
- Build vertical tab sidebar, collapsible panel, browser surface, command palette, workspace/profile
  controls, theme/layout settings, RTL handling, and import/export settings.
- Consume Core API and SSE only through stable interfaces.

Expected output:
- A Phase 4 shell prototype that owns the long-running primary context.

Definition of done:
- Shell can launch/hold a persistent primary session and show/drive tabs.
- No agent panels, chat sidebar, or LLM controls.

Risks / blockers:
- The seamless surface may remain too expensive; the headed two-window stopgap may need to last
  longer.

Do not do yet:
- Do not start Phase 5 agent automation inside the shell.

Closing:
- Use `/stop` if this closes Phase 4b, otherwise use the standard session closing rule.

Phase-level definition of done:
- Human shell scope is implemented or deliberately parked with evidence.
- Primary persistent context is ready to serve as the Cookie Mine foundation.
- Shell docs and active pointers are true.

Phase closing / reconciliation rule:
Before moving to Phase 5, reconcile the Cookie Mine gate: primary context behavior, profile
isolation policy, password-manager policy, and shell/session ownership must be documented.

---

## Phase 5.0 - Agent Interface And Safety Gate

Status: Deferred. Do not start until Phase 4 has an approved handoff or Roi explicitly pulls this
forward.

Goal:
Choose the agent-facing surface and safety gates before the first real agent-driven work against a
human-warmed session.

Why this matters:
ADR-0005 and ADR-0006 deliberately defer MCP/tool selection until the MCP spec finalizes on
2026-07-28. Safety work must precede the first agent action.

### Session 5.0.1 - MCP And Tool Surface Reconciliation

Status: Future.

Goal:
Decide Feather's first agent-facing interface after the MCP spec is stable.

Read before starting:
- Specs / ADRs: `docs/specs/adr-0005-agentic-north-star.md`,
  `docs/specs/adr-0006-agent-interface-neutrality.md`,
  `docs/specs/adr-0003-hybrid-browser-shared-context.md`
- Research: `research/2026-06-07-open-source-integration-research.md`,
  `research/2026-06-03-phase-5-agent-perception-layer-notes.md`
- API docs: `docs/api-reference.md`

Tasks:
- Recheck the final MCP spec and official docs.
- Choose the first Feather agent-facing interface shape.
- Keep Claude Code and Codex drivability explicit.
- Preserve token/context efficiency as a hard constraint.

Expected output:
- A Phase 5 interface design or ADR.

Definition of done:
- Tool selection is no longer deferred by unknown spec state.

Risks / blockers:
- The MCP spec date is in the future relative to this roadmap rebase.

Do not do yet:
- Do not build the MCP surface before the decision gate.

Closing:
- Use the standard session closing rule.

### Session 5.0.2 - First-Agent Safety Gate

Status: Future.

Goal:
Close the safety blockers before any agent acts inside a human-warmed profile.

Read before starting:
- Specs / ADRs: `docs/specs/adr-0008-credentials-vault.md`,
  `docs/specs/adr-0003-hybrid-browser-shared-context.md`
- Research: `research/2026-06-05-cookie-isolation-spike-findings.md`,
  `research/2026-06-04-cookie-jar-isolation-and-phase5-sequencing.md`,
  `research/2026-06-04-credentials-vault-spike-c-leakage-probe-findings.md`
- Source files: `src/browser/profile-policy.ts`, `src/fs-layout.ts`, `src/sessions/manager.ts`,
  `tests/helpers/leak-scan.ts`

Tasks:
- Measure `primary` DBSC binding read-only before any clone/copy decision.
- Ensure warm profiles disable Chromium's built-in password manager.
- Re-run secret leakage harnesses before credential-related work.
- Decide whether vault Spikes A/B are required before this phase continues.

Expected output:
- A documented "first agent action" gate.

Definition of done:
- No agent can accidentally receive raw credentials or corrupt the primary trust jar.

Risks / blockers:
- `primary` may be device-bound; never clone it blindly.
- Vault ADR-0008 remains candidate until SQLCipher/KeePassXC spikes clear.

Do not do yet:
- Do not implement vault credential release.
- Do not copy real primary cookies.

Closing:
- Use the standard session closing rule.

Phase-level definition of done:
- Agent-facing interface direction is decided.
- Safety gate for first agent action is explicit and green.
- Phase 5 implementation phases can start without re-litigating the foundations.

Phase closing / reconciliation rule:
Open Phase 5a only after this phase names the accepted tool/interface path and records the first-agent
safety status in `active.md` and `tasks.md`.

---

## Phase 5a - Agent Browsing Stack: Stealth Stack

Status: Future, plan ready.

Goal:
Implement secure-by-default stealth hygiene and verification for agent-driven browser sessions.

Why this matters:
Stealth is the root dependency for MFA and Identity. It keeps the real headed Chromium architecture
from leaking automation tells and adds the first behavioral seam.

### Session 5a.1 - Stealth Core And Always-On Checks

Status: Future.

Goal:
Implement Stealth plan tasks 1-4: types, secure-by-default resolution, site classification for
observability, fingerprint check, environment check, and typing jitter helper.

Read before starting:
- Brief: `docs/specs/2026-06-07-agent-browsing-stack-brief.md`
- Spec: `docs/specs/2026-06-07-stealth-stack-design.md`
- Plan: `docs/specs/2026-06-07-stealth-stack-plan.md`
- Research: `research/2026-06-07-council-audit-stealth-stack.md`,
  `research/2026-06-05-anti-detection-self-test.md`,
  `research/2026-06-07-open-source-integration-research.md`
- Source files: `src/browser/modes.ts`, `src/sessions/types.ts`,
  `tests/unit/browser/`
- Tech-stack guide: `docs/tech-stack-guidelines.md`

Tasks:
- Evaluate `fingerprint-generator`, `fingerprint-injector`, and `idcac-playwright` before custom
  fingerprint-injection work.
- Add the Stealth types and default mode resolution.
- Add observability-only site classification.
- Add environment and fingerprint checks without spoofing.
- Add jitter helper tests.

Expected output:
- New `src/browser/stealth.ts` foundation and focused unit tests.

Definition of done:
- Tasks 1-4 in the Stealth plan pass.
- No font guard, no canvas noise, and no control-flow classification gate.

Risks / blockers:
- Fingerprint package evaluation must stay license-clean and avoid AGPL Maxun code.

Do not do yet:
- Do not wire session launch or API routes in this session.

Closing:
- Use the standard session closing rule.

### Session 5a.2 - Stealth Session And Manager Wiring

Status: Future.

Goal:
Implement Stealth plan tasks 5-6: mutable session mode, warnings on records, and launch-time checks.

Read before starting:
- Spec: `docs/specs/2026-06-07-stealth-stack-design.md`
- Plan: `docs/specs/2026-06-07-stealth-stack-plan.md`
- Source files: `src/sessions/types.ts`, `src/sessions/session.ts`,
  `src/sessions/manager.ts`, `src/browser/stealth.ts`

Tasks:
- Add `stealthApplied` and `stealthWarnings` to `SessionRecord`.
- Add `stealthMode` getter and `setStealthMode(mode)` to the session object.
- Resolve default mode during launch.
- Run environment/fingerprint checks best-effort on headed-CDP sessions.

Expected output:
- Session records expose current stealth mode and warnings.

Definition of done:
- Tasks 5-6 in the Stealth plan pass.
- MFA can later switch a session between `secure` and `assisted`.

Risks / blockers:
- Launch must not fail just because a warning check fails.

Do not do yet:
- Do not add MFA behavior.

Closing:
- Use the standard session closing rule.

### Session 5a.3 - Stealth API And Typing Behavior

Status: Future.

Goal:
Implement Stealth plan tasks 7-8: launch input, mode-switch endpoint, and secure-mode typing cadence.

Read before starting:
- Spec: `docs/specs/2026-06-07-stealth-stack-design.md`
- Plan: `docs/specs/2026-06-07-stealth-stack-plan.md`
- Source files: `src/commands/launch.ts`, `src/commands/type.ts`,
  `src/transport/routes.ts`, `src/sessions/types.ts`
- API docs: `docs/api-reference.md`

Tasks:
- Add `stealth?: { mode }` to launch input.
- Add `POST /v1/sessions/:sessionId/stealth`.
- Make type command use secure-mode typing cadence.
- Document the new API fields and route.

Expected output:
- Public API supports creating and switching stealth modes.

Definition of done:
- Tasks 7-8 pass with API docs updated.
- Secure mode types sequentially; assisted mode remains native-speed.

Risks / blockers:
- Avoid route behavior that makes "human watching" count as assisted; assisted means human driving.

Do not do yet:
- Do not add pre-click sleep or fake mouse behavior.

Closing:
- Use the standard session closing rule.

### Session 5a.4 - CDP Surface Audit And Self-Test

Status: Future.

Goal:
Implement Stealth plan tasks 9-10: audit Layer 1 and extend the anti-detection probe.

Read before starting:
- Spec: `docs/specs/2026-06-07-stealth-stack-design.md`
- Plan: `docs/specs/2026-06-07-stealth-stack-plan.md`
- Research: `research/2026-06-05-anti-detection-self-test.md`,
  `research/2026-06-07-council-audit-stealth-stack.md`
- Source files: `scripts/spikes/anti-detection-probe.ts`, `src/debug/capture.ts`,
  `src/logs/logger.ts`, `src/sessions/manager.ts`

Tasks:
- Audit real-session paths for automation-revealing CDP listeners.
- Add hard assertions for `navigator.webdriver === false`.
- Add `Runtime.enable` absence assertion where feasible.
- Add opt-in external detector report.

Expected output:
- Stealth self-test can catch the fundamental automation tells.

Definition of done:
- Tasks 9-10 pass and findings are recorded.

Risks / blockers:
- Public fingerprint sites can change; record dates and exact target pages.

Do not do yet:
- Do not claim broad detector bypass from one probe.

Closing:
- Use the standard session closing rule.

### Session 5a.5 - Kinematic Input Spike And Stealth Verification

Status: Future.

Goal:
Run Stealth plan task 11 and final task 12: prove or reject kinematic mouse/typing synthesis before
building it.

Read before starting:
- Spec: `docs/specs/2026-06-07-stealth-stack-design.md`
- Plan: `docs/specs/2026-06-07-stealth-stack-plan.md`
- Research: `research/2026-06-07-council-audit-stealth-stack.md`
- Source files: `src/commands/click.ts`, `src/commands/type.ts`, `src/browser/locators.ts`

Tasks:
- Design a spike for curved mouse trajectories, overshoot, variable speed, and non-center targets.
- Measure against real detectors where safe.
- Record findings in `research/`.
- Run the full Stealth verification gate.

Expected output:
- `research/2026-06-07-kinematic-input-spike.md` or a later dated equivalent.

Definition of done:
- The project knows whether to build kinematic input and what shape it should take.
- Full Stealth plan verification passes.

Risks / blockers:
- Behavioral realism is the hardest part; do not ship security theater.

Do not do yet:
- Do not implement the production kinematic layer until the spike supports it.

Closing:
- Use `/stop` if this closes Phase 5a, otherwise use the standard session closing rule.

Phase-level definition of done:
- Stealth plan's full verification gate passes.
- MFA has a stable mutable-mode seam to consume.
- No spoofing-heavy or AGPL-derived fingerprint code entered Feather.

Phase closing / reconciliation rule:
Close Phase 5a with `/stop`; update the Phase 5b dependency status in `active.md` and
`tasks.md`.

---

## Phase 5b - Agent Browsing Stack: MFA Handler

Status: Future, plan ready, depends on the Stealth mutable-mode seam.

Goal:
Pause agent workflows at TOTP, SMS OTP, and push-approval challenges; let the user resolve them
locally; resume without exposing raw codes to the agent.

Why this matters:
MFA is the human checkpoint that keeps automation authorized and practical when warmed cookies are
not enough.

### Session 5b.1 - MFA Pure Units

Status: Future.

Goal:
Implement MFA plan tasks 1-5: types, validators, local HTML page, notifiers, and config loading.

Read before starting:
- Brief: `docs/specs/2026-06-07-agent-browsing-stack-brief.md`
- Spec: `docs/specs/2026-06-07-mfa-handler-design.md`
- Plan: `docs/specs/2026-06-07-mfa-handler-plan.md`
- Source files: `src/config.ts`, `src/transport/routes.ts`

Tasks:
- Add MFA types, errors, and validators.
- Render local challenge pages for code-entry and push flows.
- Add console notifier, composite notifier, and Telegram seam.
- Add MFA config loading.

Expected output:
- `src/mfa/` pure units can be tested without server/session wiring.

Definition of done:
- Tasks 1-5 in the MFA plan pass.

Risks / blockers:
- Telegram is optional; do not make it mandatory infrastructure.

Do not do yet:
- Do not touch session state or routes yet.

Closing:
- Use the standard session closing rule.

### Session 5b.2 - MFA Session, Events, And Manager

Status: Future, depends on Phase 5a.

Goal:
Implement MFA plan tasks 6-10: `mfaPending`, SSE events, challenge manager, resolve, and expiry.

Read before starting:
- Spec: `docs/specs/2026-06-07-mfa-handler-design.md`
- Plan: `docs/specs/2026-06-07-mfa-handler-plan.md`
- Dependency spec: `docs/specs/2026-06-07-stealth-stack-design.md`
- Source files: `src/sessions/types.ts`, `src/sessions/session.ts`,
  `src/sessions/manager.ts`, `src/commands/type.ts`, `src/logs/events.ts`,
  `src/transport/sse.ts`

Tasks:
- Add `mfaPending` to session records.
- Add `mfa.challenge.created`, `mfa.challenge.resolved`, and `mfa.challenge.expired`.
- Build challenge create/get/resolve/expiry manager behavior.
- Flip stealth to assisted on create and secure on resolve/expiry.

Expected output:
- MFA state is managed in memory and visible through lifecycle events.

Definition of done:
- Tasks 6-10 pass.
- Push challenges skip code typing; TOTP/SMS type code through the stored target.

Risks / blockers:
- Challenge timeouts must always return the session to secure mode.

Do not do yet:
- Do not add HTTP routes until manager behavior is green.

Closing:
- Use the standard session closing rule.

### Session 5b.3 - MFA HTTP Surface And Verification

Status: Future.

Goal:
Implement MFA plan tasks 11-14: command handlers, routes, server wiring, form-body parsing, and final
verification.

Read before starting:
- Spec: `docs/specs/2026-06-07-mfa-handler-design.md`
- Plan: `docs/specs/2026-06-07-mfa-handler-plan.md`
- Source files: `src/commands/`, `src/transport/routes.ts`, `src/index.ts`,
  `src/mfa/`
- API docs: `docs/api-reference.md`

Tasks:
- Add token-authenticated challenge create/get routes.
- Add localhost-only local page and submit routes.
- Map errors to stable API status codes.
- Run the full verification gate and update API docs.

Expected output:
- Agents can create/poll MFA challenges; users can resolve them locally.

Definition of done:
- TOTP, SMS, and push flows work as pollable result states.
- Agent never sees raw OTP.
- Full MFA plan verification passes.

Risks / blockers:
- Local no-auth routes must remain bound to local-only assumptions.

Do not do yet:
- Do not auto-source email OTP.
- Do not implement passkey, Face ID, WebAuthn, or hardware-key flows.

Closing:
- Use `/stop` if this closes Phase 5b, otherwise use the standard session closing rule.

Phase-level definition of done:
- TOTP/SMS/push v1 works.
- MFA events are visible on SSE.
- Identity can consume `MfaConfig` and `mfaPending`.

Phase closing / reconciliation rule:
Close Phase 5b with `/stop`; update Phase 5c dependency status in `active.md` and `tasks.md`.

---

## Phase 5c - Agent Browsing Stack: Identity Model

Status: Future, plan ready, depends on Stealth and MFA.

Goal:
Give agents a stable named handle for a warmed profile plus default stealth/MFA configs and a dormant
vault reference.

Why this matters:
Identity turns "Roi's LinkedIn profile" from an implicit workspace string into a safe, named,
agent-attachable abstraction.

### Session 5c.1 - Identity Storage And Events

Status: Future, depends on Phase 5b.

Goal:
Implement Identity plan tasks 1-6: paths, events, close-event workspace data, types, store, and
manager.

Read before starting:
- Brief: `docs/specs/2026-06-07-agent-browsing-stack-brief.md`
- Spec: `docs/specs/2026-06-07-identity-model-design.md`
- Plan: `docs/specs/2026-06-07-identity-model-plan.md`
- Research: `research/2026-06-05-cookie-isolation-spike-findings.md`
- Source files: `src/fs-layout.ts`, `src/logs/events.ts`, `src/sessions/manager.ts`,
  `src/browser/profile-policy.ts`

Tasks:
- Add identity path helpers and directory creation.
- Add identity events and workspaceId on session-close event data.
- Add `src/identity/types.ts`, JSON store, and manager.
- Disable Chromium password manager when creating identity profiles.

Expected output:
- Identity records can be created, saved, listed, loaded, and marked warm by manager logic.

Definition of done:
- Tasks 1-6 in the Identity plan pass.

Risks / blockers:
- Identity storage must stay local JSON, no DB.

Do not do yet:
- Do not add API routes or launch integration in this session.

Closing:
- Use the standard session closing rule.

### Session 5c.2 - Identity Launch Integration And Session Records

Status: Future.

Goal:
Implement Identity plan tasks 7-9: add `identityId`, resolve launch configs from identity, and
surface identity on session responses.

Read before starting:
- Spec: `docs/specs/2026-06-07-identity-model-design.md`
- Plan: `docs/specs/2026-06-07-identity-model-plan.md`
- Dependency specs: `docs/specs/2026-06-07-stealth-stack-design.md`,
  `docs/specs/2026-06-07-mfa-handler-design.md`
- Source files: `src/sessions/types.ts`, `src/sessions/session.ts`,
  `src/sessions/manager.ts`, `src/commands/launch.ts`

Tasks:
- Add `identityId` to launch input and session records.
- Resolve `workspaceId` from identity ID.
- Merge identity defaults for stealth and MFA configs.
- Preserve anonymous `workspaceId` launches.

Expected output:
- Sessions can launch by identity while preserving existing launch behavior.

Definition of done:
- Tasks 7-9 pass.
- `GET /v1/sessions/:id` includes `identityId` when applicable.

Risks / blockers:
- Do not let identity resolution bypass profile locks.

Do not do yet:
- Do not implement vault runtime behavior.

Closing:
- Use the standard session closing rule.

### Session 5c.3 - Identity HTTP Routes And Lifecycle Verification

Status: Future.

Goal:
Implement Identity plan tasks 10-13: identity routes, integration test, server wiring, and final
quality gate.

Read before starting:
- Spec: `docs/specs/2026-06-07-identity-model-design.md`
- Plan: `docs/specs/2026-06-07-identity-model-plan.md`
- Source files: `src/transport/routes.ts`, `src/index.ts`, `src/identity/`
- API docs: `docs/api-reference.md`

Tasks:
- Add create/list/get/delete/warm identity routes.
- Add lifecycle integration coverage.
- Wire identity manager at server startup.
- Update API docs and run final verification.

Expected output:
- Identity CRUD and warm flow are exposed over the token-authenticated API.

Definition of done:
- Full Identity plan verification passes.
- Identity ID = workspaceId.
- One identity maps to one profile and one running session at a time.
- `vaultRef` is stored and returned but dormant.
- No cloud sync, no RBAC, no cross-identity session sharing.

Risks / blockers:
- Vault ADR-0008 remains candidate; do not silently implement credentials.

Do not do yet:
- Do not build a password manager or vault backend.
- Do not add PATCH unless a new approved spec changes scope.

Closing:
- Use `/stop` if this closes Phase 5c, otherwise use the standard session closing rule.

Phase-level definition of done:
- Identity API is live and tested.
- Warm profiles are named and attachable.
- Stealth and MFA defaults can travel with an identity.
- Vault seam remains dormant and safe.

Phase closing / reconciliation rule:
Close Phase 5c with `/stop`; update the roadmap before starting broader agent runtime work.

---

## Phase 5d - Agent Runtime Surface And Ecosystem Interop

Status: Future, cold storage until Phase 5.0 completes.

Goal:
Expose Feather as a standard local browser tool for external agents and frameworks.

Why this matters:
This is where the Cookie Mine becomes broadly usable by agent clients while preserving local-first
control, token efficiency, and interface neutrality.

### Session 5d.0 - Agent Runtime Reconciliation

Status: Future.

Goal:
Reconfirm the agent runtime surface after Phase 5.0 and the Agent Browsing Stack foundations.

Read before starting:
- Core context: `ROADMAP.md`, `journal/context/active.md`, `journal/ops/tasks.md`
- Specs / ADRs: `docs/specs/adr-0005-agentic-north-star.md`,
  `docs/specs/adr-0006-agent-interface-neutrality.md`
- Research: `research/2026-06-07-open-source-integration-research.md`
- API docs: `docs/api-reference.md`

Tasks:
- Decide whether the next session is MCP implementation, `FeatherBrowserTool`, Browser Use/Crawl4AI
  docs, or workflow DSL research.
- Keep Maxun as schema-pattern reference only.
- Write a fresh design/plan before implementation.

Expected output:
- A scoped implementation plan for the first agent runtime surface.

Definition of done:
- The next build session has a single, approved scope.

Risks / blockers:
- Easy to turn Feather into a full agent framework; keep it a browser runtime/tool surface.

Do not do yet:
- Do not implement without a fresh Phase 5d plan.

Closing:
- Use the standard session closing rule.

Phase-level definition of done:
- A standard local agent-facing interface exists.
- Claude Code, Codex, and external MCP-compatible clients can drive Feather without special casing.
- Agent responses remain compact enough for LLM context use.

Phase closing / reconciliation rule:
Reconcile `ROADMAP.md` and `tasks.md` before any future "daily hardening" or larger runtime phase.
