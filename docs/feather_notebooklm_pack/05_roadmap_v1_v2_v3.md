# Feather Browser — Roadmap Narrative

## Roadmap overview

Feather is framed as v1, v2, and v3.

The roadmap is not just a feature list. It is a maturity path:

```text
v1 -> It runs errands for me
v2 -> It survives scary sites safely
v3 -> The polished product
```

## v1 — It runs errands for me

### Goal

The user gives Feather a task. An agent navigates, figures out the steps, and performs the task on normal websites.

This is the basic "Claude for Chrome" level:

- Real navigation.
- Real page reading.
- Real interactions.
- Basic task execution.
- Human in the loop when needed.

### Why v1 is close

The core engine already exists:

- Sessions.
- Profiles.
- Reading/extraction.
- Screenshots.
- Click/type/press/wait.
- Warm profile foundations.

v1 is mostly about proving and polishing what is already there.

### v1 proof test

The first serious test is a throwaway Instagram flow.

The agent operates a scratch profile while the human handles risky checkpoints such as CAPTCHA or verification.

This is intentionally not done on a real personal account. It tests the browser-agent loop without risking valuable credentials.

### v1 principle

Real warm profiles stay hands-off until the stronger safety machinery is built.

## v2 — It survives scary sites safely

### Goal

An agent works on locked-down, bot-detecting sites such as LinkedIn, Instagram, or portals, as the user, with approval, without getting blocked.

This is where the Cookie Mine becomes valuable.

### Security-first build order

```text
Capability / safety gate
    -> Identity
    -> MFA handler
    -> Warmed-profile attach
    -> Stealth hardening last
```

### Why this order matters

Feather's highest-privilege surfaces must not come before the safety machinery that governs them.

The system must first define:

- Who can control what.
- Which session is allowed.
- Which profile is allowed.
- What human approval is required.
- What happens during MFA or CAPTCHA.
- How access is revoked.

### v2 features

- Capability gate.
- Identity model for warm profiles.
- MFA/human handoff.
- First-agent safety gate.
- Warmed-profile attach.
- Stealth hardening.
- Human behavior learning.
- Anti-bot self-diagnostics.
- Teach-a-workflow/action cache.

### v2 proof test

Create and operate Feather's own LinkedIn account, collaboratively and human-in-the-loop, without being flagged.

## v3 — The polished product

### Goal

Turn Feather from a developer core into a polished browser product and ecosystem participant.

### v3 features

- Visual browser window.
- Minimalist Zen-inspired shell.
- Long-running human primary browser context.
- Opening Feather to other agent frameworks.
- Broader ecosystem interop.
- True perception and generalized workflows.

### Why v3 is last

Feather's near-term advantage is not a pretty shell. The important foundation is the browser-agent runtime and safety model.

A polished GUI and external framework interop only make sense after Core and safety are solid.

## Strategic roadmap diagram

```text
Feather Core today
    |
    v
v1: Basic errands on normal sites
    |
    v
v2: Safe agent work on scary/authenticated sites
    |
    v
v3: Polished human browser + ecosystem interop
```

## Infographic emphasis

The roadmap infographic should make one idea clear:

Feather is not trying to jump straight into "autonomous AI browser."

It is building in layers:

1. Runtime.
2. Proof.
3. Safety.
4. Identity.
5. Human handoff.
6. Hardened operation.
7. Polished product.
