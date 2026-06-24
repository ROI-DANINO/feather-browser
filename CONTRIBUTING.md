# Contributing to Feather Browser

Thanks for taking a look. Feather is an early, developer-focused open-source project — a local
Chromium runtime for AI agents. This guide is the short version of how to set up, make a change, and
get it reviewed.

> Feather is **Linux-first**, developed on Fedora (Wayland). Other platforms may work but aren't
> promised yet.

## Setup

```bash
npm install
npx playwright install chromium   # npm install does NOT fetch the browser binary
npm run dev                       # starts the local control service
```

The server binds `127.0.0.1` on an OS-assigned port and writes its address + token paths to
`endpoint.json` on startup. See the [README](README.md#see-it-work-60-seconds) for the full
quickstart and [`docs/api-reference.md`](docs/api-reference.md) for the HTTP API.

## Verification gate (run before every PR)

CI runs exactly this sequence (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)). Run it
locally first:

```bash
npm run typecheck          # tsc --noEmit
npm run build              # tsc
npm test                   # unit tests (Vitest)
npm run test:integration   # integration tests against real Chromium
```

A change isn't done until typecheck is clean and unit + integration tests pass. New non-trivial logic
ships with a test. Report results honestly — a clean failure with a recorded lesson beats a green
checkmark that hides one.

## Branching

```
master  ← stable, never broken
  └─ dev  ← trunk; target this for all work
```

- **Target `dev` for all PRs.** Never commit directly to `master`.
- Branch off `dev`, named for the workstream (e.g. `harden-perms`, `readme-quickstart`). Keep branches
  short-lived and merge back to `dev` when green.
- Two or more **unrelated** pieces of work in flight → give each its own branch in its own git
  worktree, one session per worktree.
- `dev` → `master` graduation is a stable-milestone-only human call.

## Where things live

- **Code** is TypeScript (Node 20+, Fastify, Playwright, Zod, Vitest) under `src/`.
- **Design history, decisions, and the session log** live under [`journal/`](journal/) and
  `docs/specs/`. Intent lives in markdown; the code graph (`graphify`) maps wiring only.
- Before changing a shared symbol, check the blast radius with `graphify affected "<Symbol>"`.

## Scope & classification

Feather is built phase by phase. Before adding code, dependencies, or a new top-level module, classify
the change (core stability / API readiness / future agent layer / out-of-scope) — when in doubt, open
an issue or write a short doc and ask. The current phase and roadmap live in
[`ROADMAP.md`](ROADMAP.md) and `journal/context/active.md`.

## Security

Found a vulnerability? See [`SECURITY.md`](SECURITY.md) — please don't open a public issue for it.

## Code of conduct

Be decent. Assume good faith, keep discussion technical, and keep all code and docs in English.
