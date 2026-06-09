# Feather Browser — Capabilities and Limits

## What works today

Feather Core already supports the main browser-control foundation.

### Sessions and profiles

- Launch isolated Chromium sessions.
- Use persistent profiles for warm state.
- Use disposable profiles for temporary runs.
- Lock persistent profiles to prevent collisions.
- List, inspect, and close sessions.

### Page reading

- Capture page snapshots.
- Read text, links, and metadata.
- Extract structured data through CSS recipes.
- Capture screenshots.

### Page interaction

- Navigate to URLs.
- Click elements.
- Type text.
- Press keys.
- Wait for dynamic content to settle.
- Use robust targeting based on role, text, or CSS where available.

### Debugging

- Create debug bundles.
- Capture traces.
- Capture console output.
- Capture network summaries.
- Capture page errors.
- Record command history.
- Write structured JSONL logs.

### Safety and reliability foundations

- Localhost API.
- Token authentication.
- Request IDs.
- Response envelopes.
- Credential redaction in logs.
- Profile locks.
- Per-session proxy configuration.
- Resource measurement.

### Architecture

- Fastify HTTP transport.
- Transport-separated command handlers.
- Playwright-managed Chromium runtime.
- TypeScript/Node.js codebase.
- Test paths for unit, integration, and measurement scenarios.

## What Feather does not do yet

Feather is not yet:

- A polished browser app.
- A consumer Chrome replacement.
- A full AI agent platform.
- A complete connector framework.
- A cross-platform GUI product.
- A finished MCP product surface.
- A fully hardened anti-bot system.
- A system where agents should freely operate real personal accounts without safety gates.

## Current product surface

The product surface today is Feather Core.

Feather Core means:

- Local browser runtime.
- Session/profile control.
- Snapshot and extraction.
- Screenshots.
- Debug bundles.
- Local HTTP API.
- Developer-first usage.

## Future product surface

Feather Shell is the later vision.

Feather Shell means:

- A visual desktop browser window.
- Human daily-driver context.
- A long-running primary browser profile.
- A polished interface.
- Agent work layered on top of human-authorized browser state.

## Honest positioning

Feather should be presented as:

```text
A serious local browser runtime for AI agents,
currently developer-focused,
with a strong path toward a human-in-the-loop browser-agent product.
```

It should not be presented as:

```text
A finished AI browser.
A magic autonomous agent.
A stealth bot.
A replacement for Chrome today.
```

## Visual summary table

| Area | Today | Later |
|---|---|---|
| Local Chromium control | Yes | Stronger |
| Persistent profiles | Yes | Identity model |
| Disposable profiles | Yes | Safer test workflows |
| Page snapshots | Yes | Better markdown reading |
| Structured extraction | Yes | Richer workflow recipes |
| Click/type/press/wait | Yes | More human-like behavior |
| Debug bundles | Yes | Better diagnostics |
| Human browser shell | No | v3 |
| Real-account safety gate | Partial foundations | v2 |
| External ecosystem interop | Deferred | v3 |

## Infographic warning

Do not overstate the project.

The strongest infographic framing is:

"Built foundations today. Clear roadmap toward safer browser agents tomorrow."
