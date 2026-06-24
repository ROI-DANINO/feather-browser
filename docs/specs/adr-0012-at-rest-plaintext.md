<!-- DRAFT — for Roi's review, not committed. -->

# ADR-0012 — At-Rest Credentials & Session State Are Plaintext (Perms-Only) for v1

- **Date:** 2026-06-24
- **Status:** Accepted
- **Context phase:** Phase 4a — Feather Core / v1
- **Front-door framing:** [`feather.md`](../../feather.md)
- **Related:** [`adr-0008`](adr-0008-credentials-vault.md) (a real vault — PROPOSED, NOT ACCEPTED; deferred to Phase 5)

## Context

Warmed profiles and identity records hold real session state on disk. Persistent Chromium profiles
(`launchPersistentContext` into `profileDir`, `src/sessions/manager.ts`) carry live cookies,
localStorage, and IndexedDB — the Cookie Mine's trust context. Identity records are one JSON file
each under `identitiesDir` (`src/identity/store.ts`), and the control-token is a flat file
(`src/transport/http.ts`). None of it is encrypted.

## Decision

Store credentials and session state **as plaintext on the local filesystem, protected by Unix
permissions only** — directories `0700`, files `0600` (identity records, control-token, session/audit
logs). The warmed-profile directory is created `0700` **on its own inode** (`src/sessions/manager.ts`),
so Chromium's cookie/login files within sit under a genuinely owner-only tree, not merely behind an
ancestor's mode. There is **no at-rest encryption for v1**; we deliberately defer the vault in `adr-0008`.

## Consequences

- A host-local attacker (same UID / root) or anyone with a stolen disk image can read cookies,
  identities, and the control-token directly. Perms stop other local users, not these.
- **Acceptable for a single-user, local-first tool**: the threat model is the owner's own machine, and
  full-disk encryption (the host's responsibility) covers the stolen-disk case.
- **Revisit if** Feather ever becomes multi-user, ships a shared/hosted runtime, or adds cloud sync —
  any of those promotes `adr-0008` (real credentials vault) from PROPOSED to required.
