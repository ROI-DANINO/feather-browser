# Storage Isolation — XDG Relocation (Design)

**Date:** 2026-06-04
**Status:** Approved (brainstorm) — pending implementation plan
**Phase:** Phase 4, pre-shell infrastructure sequence, Task #1 (CRITICAL)
**Relates to:** Agent-Blind Vault boundary; ADR-0008 (CredentialsVault, 🚧 non-accepted)

## Problem

`src/config.ts` defaults `featherDir` to the repo-relative path `.feather`. All runtime state —
browser **profiles (cookies, the warmed Google session, and the future credentials vault)**, logs,
debug bundles, the control token, and the endpoint descriptor — is written *inside the workspace*.

Two consequences, both violations of project constraints:

1. **Secrets live next to the code.** `.feather` is not even listed in `.gitignore` today, so a
   profile or token folder created in-repo is trackable by Git. This breaks the Agent-Blind Vault
   boundary (the agent must never be able to read raw credentials, and secrets must never be
   shareable by accident).
2. **Not the Linux-native layout.** Feather targets Linux (Fedora). Well-behaved Linux apps keep
   their data in the user's home directory under the XDG base directories, not in the working
   directory.

## Goal

Relocate all of Feather's working files out of the workspace and into the standard XDG base
directories in the user's home area. Secrets land in the private home area; nothing Feather writes
is ever inside the repo by default.

## Layout

Each category of file maps to the XDG base directory Linux apps conventionally use, with `/feather`
appended:

| Category | Current subdir | XDG base (env var → fallback) | Resolved default |
|---|---|---|---|
| Profiles (cookies, warmed Google session, vault) | `profiles/` | `XDG_DATA_HOME` → `~/.local/share` | `~/.local/share/feather/profiles/` |
| Disposable sessions | `tmp/sessions/` | `XDG_CACHE_HOME` → `~/.cache` | `~/.cache/feather/tmp/sessions/` |
| Logs | `logs/sessions/` | `XDG_STATE_HOME` → `~/.local/state` | `~/.local/state/feather/logs/sessions/` |
| Debug bundles | `debug/` | `XDG_STATE_HOME` → `~/.local/state` | `~/.local/state/feather/debug/` |
| Measurements | `measurements/` | `XDG_STATE_HOME` → `~/.local/state` | `~/.local/state/feather/measurements/` |
| Run files (token, endpoint) | `run/` | `XDG_RUNTIME_DIR` → *(state dir)* | `$XDG_RUNTIME_DIR/feather/run/` |

**Rationale per category:**
- **Profiles** are durable, user-valuable data → DATA. The credentials vault, when it lands
  (ADR-0008), lives under this DATA root.
- **Disposable sessions** are deleted on close → CACHE (disposable by definition).
- **Logs, debug, measurements** are diagnostic state that persists but isn't precious → STATE.
- **Run files** (control token + endpoint descriptor) are regenerated every launch and should not
  outlive the login session → RUNTIME (tmpfs, wiped on logout). `XDG_RUNTIME_DIR` is not guaranteed
  to be set; when absent, fall back to the STATE root (not the workspace).

## Overrides

- **Standard XDG env vars** (`XDG_DATA_HOME`, `XDG_STATE_HOME`, `XDG_CACHE_HOME`,
  `XDG_RUNTIME_DIR`) are honored so packaging and power users can redirect any root.
- **`FEATHER_DIR` single-root override (legacy mode):** when set, all four roots collapse to that
  one directory, reproducing today's single-tree behavior under `<FEATHER_DIR>/{profiles,tmp,
  logs,debug,measurements,run}`. This preserves a simple "everything in one place" option and keeps
  tests able to point at a single temp dir.

## Safety Net

Add `.feather/` to `.gitignore`. The default no longer writes there, but this guarantees that if a
folder ever appears in the workspace (e.g. someone sets `FEATHER_DIR=.feather`), Git refuses to
track it.

## Component Changes

### `src/config.ts`
- `FeatherConfig` changes from `{ port, host, featherDir: string }` to
  `{ port, host, dirs: FeatherDirs }` where
  `FeatherDirs = { data: string; state: string; cache: string; runtime: string }`.
- `loadConfig()` resolves each root: read the XDG env var, else the home fallback, then append
  `feather`. Runtime falls back to the state root when `XDG_RUNTIME_DIR` is unset. If `FEATHER_DIR`
  is set, all four roots are that single path.

### `src/fs-layout.ts`
- `FeatherPaths` constructor takes `FeatherDirs` instead of a single `base`. Each accessor routes
  to the correct root:
  - `profileDir`, `workspaceJson`, `lockFile` → `data`
  - `disposableSessionDir`, `disposableProfileDir` → `cache`
  - `debugDir`, `quarantinedProfileDir` → `state`
  - `sessionLog` → `state`
  - `measurementDir` → `state`
  - `endpointFile`, `tokenFile` → `runtime`
- `ensureDirs(dirs: FeatherDirs)` creates every required subdir across the four roots.

### `src/index.ts`
- Build `FeatherPaths` and call `ensureDirs` from `config.dirs` instead of `config.featherDir`.

### `src/measurement/runner.ts`
- Currently strips a leading `.feather/` from debug paths and re-joins with `featherDir`
  (`runner.ts:125-127`). Under multiple roots this single-base assumption breaks. Revisit during
  implementation: re-root debug-bundle paths via the same `debug → state` logic (likely by routing
  through `FeatherPaths` rather than string-stripping). Flagged as an implementation sub-task.

## Testing (TDD)

Write/adjust tests before implementation:
- `tests/unit/config.test.ts` — replace the "defaults featherDir to `.feather`" assertion with:
  XDG defaults resolve correctly; XDG env vars are honored; `FEATHER_DIR` collapses all roots to one.
- `tests/unit/fs-layout.test.ts` — rewrite hardcoded `.feather/...` expectations against explicit
  roots (and verify each accessor routes to the intended root).
- `/tmp/.feather/...` command tests (`launch`, `screenshot`, `extract`, `debug-bundle`, transport)
  pass literal paths/mocks and should be unaffected; confirm during implementation.
- Integration tests (`api-flow`, `disposable-cleanup`) that build a real `featherDir` in a temp dir
  switch to `FEATHER_DIR` single-root mode pointing at the temp dir, preserving their current
  assertions with minimal churn.

## Out of Scope

- No migration of existing `.feather` data (none exists in the repo; fresh dirs created on launch).
- No change to vault backend selection (ADR-0008 stays 🚧 non-accepted; this only fixes *where* the
  vault will live, under the DATA root).
- No anti-detection / attach-don't-launch work (Task #2 of the sequence).

## Success Criteria

1. With no env vars set, a fresh `npm run dev` writes nothing inside the workspace; profiles land in
   `~/.local/share/feather`, logs/debug/measurements in `~/.local/state/feather`, disposable
   sessions in `~/.cache/feather`, token/endpoint in `$XDG_RUNTIME_DIR/feather` (or state fallback).
2. XDG env vars and `FEATHER_DIR` overrides behave as specified.
3. `.feather/` is gitignored.
4. Full unit + integration suites pass.
</content>
</invoke>
