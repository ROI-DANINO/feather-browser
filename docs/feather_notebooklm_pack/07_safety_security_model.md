# Feather Safety and Security Model

Feather is a local Chromium browser runtime that lets AI agents operate real browser sessions through a controlled HTTP API. This source explains why browser control is privileged and how Feather sequences safety before high-risk agent capabilities.

## Why Browser Control Is Privileged
Controlling a browser gives full access to authenticated sessions, local storage, and execution context.

## Security-First Spine
Safety features are prioritized before exposing high-risk agent workflows.

```text
capability/safety gate -> Identity -> MFA -> warmed-profile attach -> Stealth hardening
```

## Gate A: Capability Gate
The first local control-plane safety model.

## Gate B: First-Agent Safety Gate
Protections enforced before an agent interacts with a warmed profile.

## Identity Model
Handles distinct user identities and separation between primary and scratch contexts.

## MFA and Human Handoff
Allows an agent to pause for a human to complete multi-factor authentication.

## Warmed-Profile Attach
Agents attaching to a warmed profile require prior safety gates (Gate A/B).

## Stealth Last
Stealth hygiene is deferred until security fundamentals are built to ensure reliability over deception.

## What NotebookLM Must Not Overstate
Risk: primary is a real personal identity. NotebookLM must not describe current Feather as safe for unrestricted agent operation on real personal accounts before v2 safety gates are built.
