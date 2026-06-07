# Next — Context Bridge

---
## 2026-06-07 23:03 — Session 4a.6b: security & capability re-sequencing (council reversal)

### Session pointer
- Roadmap/session pointer: Phase 4a; **4a.6b done**, next = **4a.7 cold-profile CDP interop**
  (`docs/sessions/4a.7-cdp-cold-profile-interop.md`).

### Summary
- Acted on the 2026-06-07 5-model council review: reversed to "security model first, interop through it."
- Wrote ADR-0010 (capability model), re-scoped 4a.7, re-ordered the Phase 5 spine, split the roadmap,
  folded security tasks into the MFA + Identity plans. **Docs-only; no product code.**

### Completed
- New ADR `docs/specs/adr-0010-local-control-plane-capability-model.md` (CANDIDATE): three privilege
  tiers, capability-grant primitive, global `Origin`/`Host` hook, session-hold primitive.
- 4a.7 re-scoped → cold/throwaway profiles only; warmed attach deferred to new Phase 5c behind gate.
- Phase 5 spine re-ordered: `gate (5.0.0) → Identity (5a) → MFA (5b) → warmed CDP (5c) → Stealth (5d,
  last) → Agent Runtime (5e)`; renumbering map + dependency graph + security gates in `ROADMAP.md`.
- `ROADMAP.md` split into thin index + `docs/sessions/<id>.md` (8 files incl. README).
- MFA plan + Identity plan: folded council Security Tasks; fixed stale build-order/architecture lines.
- Reconciled `active.md`, `tasks.md`, `phase.md`.
- Verified all ADR backlinks + session-file references resolve.

### User decisions / quotes
- Decision: split `ROADMAP.md` now into index + per-session files. Quote: "Split now into index and
  session files".
- Decision: 4a.7 scope — Roi deferred to recommendation. Quote: "i dont know this things and i dont
  know how to choose." → went with **cold-profile proof now, warmed deferred** (recommended option).

### Agent decisions / assumptions / rationale
- Two dependency-breaking decisions recorded as load-bearing: (1) session-hold primitive replaces
  MFA's `setStealthMode` → frees Stealth to be last; (2) Identity stores stealth/MFA policy as
  opaque/versioned refs (not concrete imports) → frees Identity to be first. Both per council guidance.
- ADR-0010 written as CANDIDATE (joint-call style like ADR-0009); acceptance + open questions deferred
  to Session 5.0.0.
- Did NOT formally run the brainstorming skill: the design space was already explored by the 5-model
  council; this was synthesis + Roi's two forks, not open-ended ideation.
- Phases with existing plan files (5a/5b/5d) point to those plans rather than duplicating into session
  files; completed-session history left to git + `journal/ops/sessions/`.

### Files read or touched
- Read: `research/2026-06-07-council-design-review.md`, `journal/work/browser/context.md`,
  `docs/specs/2026-06-07-mfa-handler-{design,plan}.md`,
  `docs/specs/2026-06-07-identity-model-{design,plan}.md`, `docs/specs/adr-0009-shell-stack.md`,
  `src/transport/{http,middleware,routes}.ts`.
- Touched (new): `docs/specs/adr-0010-local-control-plane-capability-model.md`, `docs/sessions/` (8).
- Touched (modified): `ROADMAP.md`, `docs/specs/2026-06-07-mfa-handler-plan.md`,
  `docs/specs/2026-06-07-identity-model-plan.md`, `journal/context/active.md`,
  `journal/ops/tasks.md`, `journal/ops/phase.md`.

### Open threads / unresolved questions
- ADR-0010 open questions (defer to 5.0.0): capability-token shape; human-approval surface in Phase 4a
  (no shell yet); whether to ship the global `Origin`/`Host` hook as a standalone early hardening;
  audit durability.
- Nothing committed/pushed yet — `dev` has these docs-only changes uncommitted.

### Next action
- Start **Session 4a.7** (implementation): expose CDP/WS endpoint for cold/disposable sessions only,
  token-gated + loopback-bound, with a test asserting absence on warmed profiles. Verify Playwright
  1.60 endpoint shape from docs first.

### Next session should read
- `docs/sessions/4a.7-cdp-cold-profile-interop.md`
- `docs/specs/adr-0010-local-control-plane-capability-model.md`
- `research/2026-06-07-open-source-integration-research.md`
- `src/browser/modes.ts`, `src/sessions/session.ts`, `src/sessions/manager.ts`, `src/transport/routes.ts`

### Risks / blockers
- 4a.9 LinkedIn recording still blocked on a Niri/Wayland screen recorder (Kooha / `wf-recorder`).
- Two social-research inbox stubs still un-triaged (Session 4a.10).
- Uncommitted docs-only changes on `dev`; commit/push deferred to `/stop`.

---
## 2026-06-07 23:10 — Inbox triage (4a.10) + commit/push of accumulated docs

### Session pointer
- Roadmap/session pointer: Phase 4a; **4a.6b + 4a.10 done**, next = **4a.7 cold-profile CDP interop**
  (`docs/sessions/4a.7-cdp-cold-profile-interop.md`). Supersedes the prior entry's "uncommitted" note.

### Summary
- Short housekeeping/commit session after `/start`. Triaged the two social-research inbox stubs
  (Session 4a.10) and committed + pushed all accumulated 4a.6b + 4a.10 docs work to `origin/dev`.

### Completed
- **4a.10 inbox triage:** the two stubs were near-duplicates of each other AND the "social research
  assistant" *use case* was not captured anywhere (specs only mention Instagram as a detection
  target site). Consolidated into one `Proposed / needs confirmation` **Social Research Mode**
  use-case seed in `journal/work/product/context.md` (under Agent Browsing Stack); preserved the
  "personal research assistant, NOT a bot/scraping/anti-detection tool" guardrail. `git mv` both
  stubs to `journal/raw/archive/`. Inbox now clear (README only).
- **Committed + pushed:** `56bd985` `docs(4a.6b+4a.10): security-first re-sequencing + social-research
  inbox triage` — 20 files, +1035/−1478. Pushed `6a05d43..56bd985 dev -> dev`. `dev == origin/dev`.
- Verified ADR-0010 file is real/complete (163 lines); the prior `??` was just "new uncommitted
  file" — now committed.
- Ticked 4a.10 in `tasks.md`; refreshed inbox note in `active.md`.

### User decisions / quotes
- Decision: triage the inbox stubs now (chose option 2 over deferring to 4a.10-proper). Quote: "2".
- Decision: commit docs first, then push + `/next`. Quotes: "commit this docs work first",
  "push dev and /next".

### Agent decisions / assumptions / rationale
- Triage destination = product desk seed (not a new spec, not pure-archive): it's a *motivating
  application* of already-specced Identity/MFA/Stealth, and pure-archive would lose a real,
  uncaptured use case. Marked `Proposed / needs confirmation` per 4a.10 DoD.
- One bundled commit (not two) — both are Phase 4a docs/journal, and the user said "this docs work".

### Files read or touched
- Read: `journal/raw/_inbox/2026-06-07-social-research-*.md`, `docs/sessions/4a.10-...md`,
  `journal/work/product/context.md`, `docs/specs/adr-0010-...md`.
- Touched: `journal/work/product/context.md` (new use-case seed), `journal/ops/tasks.md`,
  `journal/context/active.md`; `git mv` 2 stubs → `journal/raw/archive/`.

### Open threads / unresolved questions
- **Stale line flagged, not fixed:** product desk context line ~45 still says "Build order:
  Stealth → MFA → Identity" — superseded by the council spine `gate → Identity → MFA → warmed CDP
  → Stealth last`. Left for a later reconciliation pass (out of triage scope).

### Next action
- Start **Session 4a.7** (implementation): expose CDP/WS endpoint for cold/disposable sessions only,
  token-gated + loopback-bound, with a test asserting absence on warmed profiles. Verify Playwright
  1.60 endpoint shape from docs first.

### Next session should read
- `docs/sessions/4a.7-cdp-cold-profile-interop.md`
- `docs/specs/adr-0010-local-control-plane-capability-model.md`
- `research/2026-06-07-open-source-integration-research.md`
- `src/browser/modes.ts`, `src/sessions/session.ts`, `src/sessions/manager.ts`, `src/transport/routes.ts`

### Risks / blockers
- 4a.9 LinkedIn recording still blocked on a Niri/Wayland screen recorder (Kooha / `wf-recorder`).
- Stale build-order line in product desk context (see Open threads).

---
## 2026-06-08 00:21 — Build-vs-buy doctrine decision; 4a.7 reframed as wrong-direction; demo recording still the real goal

### Session pointer
- Phase 4a. **4a.7 (CDP cold-profile attach) PARKED / reframed** — it builds the "let outside tools
  drive Feather" door, which is the *opposite* of Roi's native-integration philosophy. Next ≠ 4a.7.
- **Next = a tight docs-only reconciliation pass** (open-source integration *doctrine*), THEN **4a.8
  Crawl4AI markdown port**. Demo recording (4a.9) remains the real near-term deliverable, still blocked.

### Summary
- Heading into 4a.7, Roi clarified intent: he wants to **port open-source features natively** (read
  their source, rebuild in Feather's TS), **NOT** let external software attach to Feather over CDP.
- We made the **build-vs-buy call**: *default = port the recipe natively*; *buy a native npm package
  only for hard / fast-moving / security-critical stuff* (e.g. Stealth fingerprint deps); *expose
  Feather to external tools = a separate, deferred Phase 5e track.*
- Agreed to do a **focused reconciliation pass next session** (doctrine ADR + per-repo disposition
  table + re-tag affected sessions), then 4a.8. Roi: *"We will do it in the next session…"*

### Completed
- Committed leftover journal bridge from prior session: `229e9dd journal(bridge): fold 4a.10 closeout`.
- Read 4a.7 body + source (`modes.ts`, `session.ts`, `manager.ts`, `types.ts`, `launch.ts`,
  `routes.ts`); verified Playwright 1.60. Finding: a real CDP ws endpoint only exists in the
  `chromium-headed-cdp` spawn path; the default `launchPersistentContext` headless paths open no CDP
  port. The non-negotiable line: **persistent/warmed profiles never expose CDP** (protects the hero
  demo's warmed Google profile).
- Mapped repos to tracks: Crawl4AI (Apache) = **port**; Browser Use (MIT) = **port** the DOM bits;
  OpenHands (MIT) = undecided; Maxun (AGPL) = **reference-only, never copy**; fingerprint npm = **buy**.

### User decisions / quotes
- Decision: defer the reconciliation pass to next session. Quote: "We will do it in the next session…"
- Philosophy: "My own philosophy is to learn from recipe, in the kitchen as well." Leans recipe but
  open to buy-if-free; asked for help deciding; "sometimes I can be a bit to perfectionist."
- Wants a paste-able prompt for the fresh chat, **brainstorm-first**, explained in plain words with
  **kitchen + construction analogies** (his words: relatable, down-to-earth — "שכונה של ישראלים מבת ים").
- **Frustration / signal:** "the actual original task I had to do today was capturing a video gif of my
  demo for GitHub and linked in" — instead got pulled into "a spiral of documentation plans and
  amature feature chasing." Likes the new planning/sessions structure, but flags the spiral.
- Idea to explore: "Maybe we need a v1->v2->v3 kind of roadmap (or roadmaps)."
- "We will get all of these straight in next session's brainstorm."

### Agent decisions / assumptions / rationale
- For 4a.7 I first recommended Option 1 (reuse the endpoint Feather already holds, zero new surface),
  then **fully reframed** after Roi's clarification: native-port ≠ CDP-attach, so 4a.7 is the wrong
  door for his strategy.
- Build-vs-buy heuristic (write this into the doctrine ADR): **buy** when it's a native package doing
  something hard/fast-moving/security-critical you'd hate to maintain; **build/port** when it's a
  self-contained algorithm in the wrong language (Python→TS) small enough to own. The perfectionist
  trap to call out: hand-rolling fingerprint logic in Phase 5d instead of buying the npm packages.
- Recommended the reconciliation pass be **tight + time-boxed** with explicit anti-scope-creep guards,
  precisely because Roi flagged planning-spiral fatigue.

### Files read or touched
- Read: `docs/sessions/4a.7-cdp-cold-profile-interop.md`, `src/browser/modes.ts`,
  `src/sessions/{session,manager,types}.ts`, `src/commands/launch.ts`, `src/transport/routes.ts`.
- Touched (docs only): `journal/context/{active,next}.md`, `journal/ops/tasks.md`, `journal/log.md`.
  **No product code written.**

### Open threads / unresolved questions
- **v1→v2→v3 roadmap idea** — unresolved; bring to next brainstorm (could reframe how all this sequences).
- **4a.7 fate** — park entirely vs. relabel and move to Phase 5e (ecosystem interop). Decide in the pass.
- **OpenHands** track undecided (port vs interop).
- **The real deliverable is still undone:** demo GIF/video for GitHub + LinkedIn. Blocked on installing
  a Wayland screen recorder (Kooha / `wf-recorder`) — a **Roi-side install step** (don't let planning
  keep eclipsing it).
- Stale "Build order: Stealth → MFA → Identity" line in `journal/work/product/context.md` still unfixed.

### Next action
- In a FRESH chat, paste the prompt below and run the **open-source integration doctrine** pass
  (brainstorm-first), then proceed to 4a.8. Also weigh the v1→v2→v3 roadmap idea and re-anchor on the
  demo-recording goal.

### Paste-into-fresh-chat prompt
> Run `/start` first. Then: **brainstorm-first** (use the brainstorming skill), with everything
> explained in plain words and kitchen/construction analogies — I'm not deeply technical and I like
> down-to-earth framings.
>
> Today's job is a **tight, time-boxed documentation reconciliation pass** so we stop improvising how
> we consume open-source projects. Last session we decided: **default = port the recipe natively**
> (read their source, rebuild in Feather's TypeScript); **buy a native npm package only when it's
> hard / fast-moving / security-critical** (e.g. the Stealth fingerprint packages); **letting outside
> tools drive Feather is a separate, deferred track (Phase 5e).** Session 4a.7 (CDP attach) was the
> wrong direction for me and is parked.
>
> Produce exactly three things, no more: (1) a short **doctrine ADR** capturing the build-vs-buy rule
> + recipe-first default + the three tracks — but FIRST check whether `adr-0006 agent-interface-
> neutrality` already half-covers it and extend rather than duplicate; (2) a **per-repo disposition
> table** (Crawl4AI, Browser Use, OpenHands, Maxun, fingerprint npm → track + license + what to take);
> (3) **re-tag only the affected roadmap sessions** (4a.7, 4a.8, 5d, 5e).
>
> Anti-perfectionism guardrails — STOP if you drift past these: no rewriting unrelated phases, no new
> specs, no re-opening settled sessions, no touching the 4b shell. If it sprawls, that's the alarm.
>
> Also discuss two things with me before finalizing: (a) my **v1→v2→v3 roadmap** idea — would splitting
> the destination into versioned milestones make this cleaner? (b) **re-anchor on the real goal**: the
> thing I actually wanted was a demo GIF/video for GitHub + LinkedIn (4a.9), which is blocked on me
> installing a Wayland screen recorder (Kooha / wf-recorder) — remind me, and don't let planning eclipse it.

### Next session should read
- `research/2026-06-07-open-source-integration-research.md`
- `ROADMAP.md`, `docs/sessions/4a.7-cdp-cold-profile-interop.md`, `docs/sessions/4a.8-markdown-snapshot.md`
- `docs/specs/adr-0006-agent-interface-neutrality.md` (check overlap before writing a new ADR)
- `journal/work/product/context.md`

### Risks / blockers
- **Planning-spiral risk is now explicit** — Roi is fatigued by documentation/feature chasing; keep the
  next pass tight, and keep the demo recording (the real deliverable) in view.
- Demo recording blocked on a Wayland screen recorder install (Roi-side, likely `sudo`).
- Stale build-order line in product desk context (see Open threads).
