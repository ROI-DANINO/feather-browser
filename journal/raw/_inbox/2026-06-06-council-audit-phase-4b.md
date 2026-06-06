# Claude Council Audit: Phase 4b Architecture

**Date:** 2026-06-06
**Event:** Project Audit via Multi-Agent Council
**Providers Used:** Claude Code CLI (`claude-3-7-sonnet-20250219`), Gemini CLI (`gemini-3.1-pro-preview`)

## The Request
"Audit the current Phase 4b architectural plans and recent commits (focusing on the GUI shell stack, cookie isolation, and vault design) for security, maintainability, and Linux desktop constraints limit to 50 words"

## Provider Responses

### 🔳 Claude CLI (`claude-3-7-sonnet-20250219`)
> **Three risks, 50 words:**
> 1. **Cookie isolation** — agent tabs share the human's `PersistentContext` by design. No per-agent cookie boundary exists yet; a compromised agent can exfiltrate the full session.
> 2. **Token file on disk** (`.feather/run/control-token`) — file-permission hardening not documented; any local process can call the REST API.
> 3. **SSE has no replay + IDs reset on core restart** — shell re-hydrates blindly; a fast restart during a sensitive operation leaves the UI in a split-brain state with no reconciliation error surfaced to the user.

### 🟦 Gemini CLI (`gemini-3.1-pro-preview`)
> **Phase 4b Architecture Audit**
> * **GUI Stack:** The headed-Chromium stopgap wisely defers GTK4/Wayland integration, minimizing Linux compositor complexity.
> * **Cookie Isolation:** Device-Bound Sessions (DBSC) break cookie cloning. We must weigh shared-jar pollution risks against auth failures.
> * **Vault:** Targeting D-Bus Secret Service aligns perfectly with Linux standards, though recent spikes mandate strict leakage safeguards.

## Synthesis & Takeaways

### Consensus & Focus
Both AI models correctly identified that the immediate security and robustness tasks around profile contexts and Linux-level infrastructure must be hardened before the visual desktop shell expands.

### Security Vulnerabilities Flagged (Priority)
1. **Local Privilege Escalation Risk:** The `.feather/run/control-token` needs strict file permissions. Since any local process could theoretically read this token, the underlying REST API is exposed to local attack vectors.
2. **State Splintering (SSE weakness):** The event stream lacks replay-ability. If the Feather backend restarts while the visual shell is active, the component state will fracture.
3. **Cookie Bound Isolation:** Acknowledged that blind cloning of DBSC cookies is a failure state. The Cookie Mine agent-flow boundary needs stricter guardrails based on shared-jar boundaries, rather than isolation.

### Architectural Affirmations
The council affirmed that dodging GTK4/Tauri in favor of the Headed-Chromium stopgap was the correct call for maintainability under current Linux Desktop constraints. D-Bus Secret Service mapping (KeePassXC/Vault spike) remains the Linux standard for headless credential storage.

## Recommended Next Actions
- Verify and lock down `control-token` file permissions (0600).
- Bolster the SSE implementation against restart drift before wiring it deeply into the shell.
- Proceed with Headed-Chromium for the GUI (validated).
