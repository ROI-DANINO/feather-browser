# v2 Spine Completion — scope decision (2026-06-23)

> Forward plan for "truly wrapping v2." Decided with Roi in a brainstorm, 2026-06-23.
> This doc records the **scope + order decision** only; the detailed build steps live in the
> per-feature plans it points to. Assessment of where v2 stood going in: `docs/v2_wrap/META-ANALYSIS.md`.

## The decision

**"Wrapping v2" = complete the security spine only.** Build the two missing spine links, then stop.
Stealth (5d) and the LinkedIn exit test are **deferred to a later v2.5**, not part of this wrap.

- **In scope (build):** 5b MFA Handler, then 5c Warmed-profile attach.
- **Already done (lean on, don't rebuild):** Gate A capability gate (✅ proven), Identity Model 5a
  (🟡 shipped), human-in-control pause/resume primitives (✅ proven).
- **Out of scope (deferred → v2.5):** 5d Stealth Stack, the un-flagged-LinkedIn exit test, behavioral
  / anti-bot research, teach-a-workflow. Plus the parked items (credential rotation, niri viewport
  durable fix) that already ride inside 5d.

**Wrap exit criterion:** an agent can attach to a named warmed identity and operate it through a
login/MFA challenge **with the human in the loop**, with the safety brakes (gate approval +
auto-revoke-on-challenge) live. "The safety foundation is complete and safe" — not "v2 is stealthy."

## Build order: 5b MFA Handler → 5c Warmed-attach

Recommended and approved. Three reasons, all pointing the same way:

1. **Dependency.** 5c's safety design (auto-revoke the agent's attach the moment an MFA challenge
   opens — ADR-0010) is built *on top of* the MFA hold. Building attach first means building it
   without its safety brake, then retrofitting. MFA first lets 5c lean on an existing seam.
2. **Functional value.** v2's promise is surviving locked-down sites; their main weapon is the login
   wall. MFA handling is the direct answer. Warmed-attach without it stalls dead at the first
   challenge.
3. **Readiness.** 5b has a full 14-task TDD plan already written. 5c is still a sketch and needs its
   own design pass first.

## Human-in-the-loop

Standing constraint for this wrap: **Roi is in the loop for testing and for decisions.** The agent
builds + runs unit/integration gates; Roi is pulled in for anything touching real warmed
profiles/personal accounts, live challenge handling, and any material safety-architecture call
(per the simplified-workflow rule in `journal/context/active.md`).

## Testing is a separate brainstorm — later

How we *test* the finished spine (live, with Roi driving the human-in-loop steps) is **deliberately
deferred to its own brainstorm**, run once 5b + 5c exist and there's something real to exercise.
This doc does not design the test. Roi's call: "brainstorm the testing after we finish building."

## Pointers (the actual build steps live here)

- **5b MFA Handler** — design: `docs/specs/2026-06-07-mfa-handler-design.md`; plan (14 TDD tasks):
  `docs/specs/2026-06-07-mfa-handler-plan.md`.
  - ⚠️ **Reconcile first.** The 5b plan predates Gate A shipping. Like 5a got, it needs a pass to
    wire it onto what now exists: the session-hold primitive (`src/capability/holds.ts`), the
    Origin/Host guard (`src/transport/middleware.ts`), and the single-use humanToken approval channel
    (`src/transport/routes.ts`). The MFA handler creates an `mfa` hold — it does **not** touch stealth.
- **5c Warmed-attach** — no design yet; needs a design pass before code. Gated on Gate A grant +
  auto-revoke-on-MFA (ADR-0010). Related prior thinking: `docs/specs/2026-06-04-attach-dont-launch-design.md`.
- **Capability spine it all consumes** — `docs/specs/adr-0010-local-control-plane-capability-model.md`.

## Immediate next step

Reconcile the 5b MFA plan against shipped Gate A reality, then execute it TDD. That reconcile pass is
the first thing the next build session picks up.
