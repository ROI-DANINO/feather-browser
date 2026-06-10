# Feather Glossary

Feather is a local Chromium browser runtime that lets AI agents operate real browser sessions through a controlled HTTP API. This source defines Feather-specific terms so NotebookLM can map project vocabulary to precise meanings.

### Feather Core
The current open-source surface of Feather, consisting of the local browser runtime and API.

### Feather Shell
The larger future daily-driver browser shell that owns the long-running primary context.

### Cookie Mine
The Cookie Mine is Feather's model where human browsing builds persistent trusted session context that local AI agents can later use under explicit control and safety gates.

### primary
Roi's real personal identity and daily-driver profile. Not to be used for sacrificial testing.

### scratch
The sacrificial test identity and workspace used for testing and demos.

### persistent profile
A browser profile that saves state and cookies to disk across sessions, requiring a lock to prevent concurrent access.

### disposable profile
A temporary, RAM-backed browser profile that is wiped when the session closes.

### observe
An action-shaped read of the page state, returning numbered refs, overlays, and change-diffs without modifying the page.

### act-by-ref
An input command style where agents target elements using `ref` strings obtained from a prior `observe` call.

### snapshot
A static capture of page content, primarily used for reading tasks rather than interaction.

### await-human
A primitive that pauses agent workflows, injecting an on-page banner to let a human resolve a challenge before resuming.

### Gate A
The planned first local control-plane capability and safety gate (ADR-0010).

### Gate B
The planned first-agent safety gate before an agent interacts with a warmed profile.

### Identity
A planned named, agent-attachable handle for a warmed profile and its associated stealth/MFA policy.

### MFA Handler
A planned feature to pause agent workflows at TOTP/SMS/push challenges for human resolution locally.

### warmed attach
Exposing CDP/WS attachment for persistent/warmed profiles, behind capability grants.

### stealth stack
The set of secure-by-default stealth hygiene and anti-detection mechanisms for agent-driven sessions.

### Graphify
A tool used in a side experiment for codebase topology extraction and read-only MCP integration.
