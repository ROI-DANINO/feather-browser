---
name: feather-operator
description: How to drive Feather Browser over its local HTTP API — endpoint discovery, the golden loop, element targeting, sessions/profiles, honest result reporting. Use for any task that operates a browser through Feather.
---

# Feather Operator

Drive Feather over its local HTTP API. Full reference lives in this repo:
`docs/agent-playbook.md` and `skills/using-feather-browser/SKILL.md` — read them for the
complete command set, targeting rules, and worked examples. Essentials inline below.

## Endpoint discovery (do this first)
- `endpoint.json` is at `${XDG_RUNTIME_DIR:-$XDG_STATE_HOME/.local/state}/feather/run/endpoint.json`.
- Read `baseUrl` and `tokenFile` from it with node; the token goes in header `X-Feather-Token`.
- Every response is `{ ok, requestId, data | error }`. On `ok:false`, read `error.code`/`error.message`.

```bash
EP="${XDG_RUNTIME_DIR:-$HOME/.local/state}/feather/run/endpoint.json"
BASE=$(node -e 'process.stdout.write(require(process.argv[1]).baseUrl)' "$EP")
TOK=$(cat "$(node -e 'process.stdout.write(require(process.argv[1]).tokenFile)' "$EP")")
curl -s "$BASE/health" -H "X-Feather-Token: $TOK"
```

## Golden loop
1. Launch a session (`POST /v1/sessions`). Disposable+headless for safe/easy work:
   `{"profile":{"kind":"disposable"},"browserMode":"chromium-new-headless","viewport":{"width":1280,"height":800}}`.
   Warmed+headed for logged-in work: `{"profile":{"kind":"persistent"},"workspaceId":"scratch","browserMode":"chromium-headed-cdp"}`.
2. `navigate` → `snapshot` (use `markdown`) to see the page.
3. Act: `click` / `type` / `press` / `select-option` with a Target object.
4. `wait` (`until:"stable"`) for dynamic content; `screenshot` for proof.
5. `close` the session.

## Targeting (Target object)
`{ "by":"role|text|placeholder|testid|css", "role?","name?","text?","selector?","exact?","at?":"first|last|<n>" }`.
Prefer role+name or text; fall back to css. For editors that ignore `fill`, use `type` with
`mode:"sequential"` (or Shift+Tab + per-key `press` for IG-style inputs).

## Privacy / proxy
For sacrificial-account work, route the session through a proxy: add
`"proxy":{"server":"<vpn-or-proxy-url>"}` to the `POST /v1/sessions` body.

## Honest reporting (repo law)
Report `PASS` / `PARTIAL` / `FAIL` exactly, each with a one-line lesson. A failure whose
fallback fires and whose lesson is recorded is a PARTIAL = a successful test. Never fake green.
Stop and ask Roi at: account creation SMS/CAPTCHA walls, and any destructive or risky step.
