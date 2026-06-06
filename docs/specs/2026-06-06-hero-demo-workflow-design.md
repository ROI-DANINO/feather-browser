# Hero Demo Workflow Design

## Classification

UI readiness / demo artifact. This is a site-specific recorded workflow that proves Feather Core can act through its HTTP API. It is not a generic agent runtime and does not add future-agent orchestration.

## Goal

Drive a headed, warmed `primary` browser profile through a recorded ChatGPT to Gmail flow:

1. Open ChatGPT.
2. Send `hello world`.
3. Wait for the assistant reply to finish streaming.
4. Open Gmail in the same persistent profile.
5. Compose, but do not send, an email to Anthropic with the ChatGPT reply in the body.

`examples/quickstart.sh` remains the public no-login demo. This workflow is for recording the debut.

## Cookie Safety

The demo must not place cookie or profile material in the repository. Feather's default profile path is outside the repo through XDG data storage:

`~/.local/share/feather/profiles/primary/profile`

The script must use the existing server endpoint and token files, launch `workspaceId:"primary"` with `profile.kind:"persistent"` and `browserMode:"chromium-headed-cdp"`, and avoid debug bundles or screenshots. The repository `.gitignore` already excludes `.feather/` as a defense for the legacy repo-local path, but the demo should not use repo-local profile storage unless the user explicitly overrides Feather's environment.

## Login Detection

This first script should include practical preflight checks, not a full account-connection wizard:

- ChatGPT is considered ready when the prompt editor can be targeted.
- Gmail is considered ready when the compose button can be targeted.
- If either is missing, the script exits with a clear message telling the user to run `FEATHER_WARM_URL=<site> npm run warm-session` and log in manually.

A future product flow can make this smoother: launch the warm-session window, wait until a site-specific logged-in signal appears, then continue automatically.

## Data Flow

The script talks only to Feather's HTTP API:

- Read `endpoint.json`.
- Read the token from `tokenFile`.
- `POST /v1/sessions` to launch the warmed headed profile.
- Use `navigate`, `type`, `click`, `press`, `wait`, and `extract`.
- Stop with the Gmail draft visible.

The script should not log credentials, cookies, request bodies, or profile paths beyond the profile safety note.

## Failure Behavior

The workflow is allowed to be site-specific and selector-driven. It should fail loudly and safely if selectors drift:

- Keep the browser open when a late demo step fails, so the current visual state can be inspected.
- Close the browser only on explicit cleanup or normal completion if future operators choose to do so.
- Never send the Gmail draft.

