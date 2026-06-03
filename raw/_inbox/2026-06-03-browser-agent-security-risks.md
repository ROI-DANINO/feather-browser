# Browser Agent Security Risks

## Purpose

Capture ecosystem-level security concerns that repeatedly appear around AI browsers and browser agents.

This is research context, not a security audit of Feather.

---

## Repeating themes observed in the ecosystem

### Prompt injection

Untrusted page content can influence agent behavior.

Common concern:

- user instruction
- system instruction
- page content

become insufficiently separated.

Research communities increasingly treat this as a primary browser-agent threat model.

---

### Ambient authority

Agents often inherit broad permissions.

Examples:

- active session cookies
- authenticated tabs
- saved credentials
- user data

The challenge is limiting what an agent can do with that authority.

---

### Data exfiltration

Browser agents can potentially read:

- page contents
- account data
- emails
- internal dashboards

Research frequently recommends:

- approval checkpoints
- policy layers
- auditability
- scoped permissions

---

### Agent hijacking

Malicious content may attempt to redirect an agent's goals.

Important distinction:

- user intent
- page instructions

should remain separable.

---

### Browser-agent fingerprinting

Recent research suggests behavioral signals may identify AI agents even when browser fingerprints look normal.

Potential implication:

Session reuse alone may not make agent activity appear human.

---

## Potential future research questions for Feather

1. Permission model.
2. Human approval model.
3. Sensitive-action workflow.
4. Trusted vs untrusted content boundaries.
5. Audit log requirements.
6. Site-policy considerations.
7. Prompt-injection mitigation patterns.

---

## Product-language note

Language around:

- stealth
- avoiding detection
- bypassing systems

may create unnecessary ambiguity.

Prefer language centered on:

- transparency
- user authorization
- continuity
- inspection
- control

---

## Claude follow-up questions

- Is any of this already captured in ADR drafts?
- Should a security-model document exist before Phase 5?
- Are there existing design notes around approval checkpoints?
- Which risks are relevant now versus much later?
