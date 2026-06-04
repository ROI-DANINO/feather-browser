# ADR-0008 — Credentials Vault: Interface-First, Local-First (CANDIDATE — NOT Accepted)

- **Date:** 2026-06-04
- **Status:** 🚧 **PROPOSED — NOT ACCEPTED.** Decision candidates below are recorded
  direction, not commitments. This ADR stays non-accepted until the three spikes in
  *Validation Gate* resolve. **No candidate selection (KeePassXC, SQLCipher, or any other)
  is final.**
- **Context phase:** Phase 5 foundation (recorded during Phase 4). Not a Phase 4 build task.
- **Source intake:** [`journal/raw/_inbox/2026-06-04-security-research-credentials-vault.md`](../../journal/raw/_inbox/2026-06-04-security-research-credentials-vault.md)
- **Related:** [[adr-0003-hybrid-browser-shared-context]] (Cookie Mine — the trust context
  credentials would unlock), [[adr-0005-agentic-north-star]] and
  [[adr-0006-agent-interface-neutrality]] (constraint-with-deferral ADRs at the same Phase 5
  Step 0 gate).

## Context

The Cookie Mine (ADR-0003) lets agents piggyback on a human's live, authenticated session.
Phase 5 will eventually need to go further — to **hold and release credentials** for
user-authorized automation (logging into a site the human hasn't already opened, re-auth after
expiry, etc.). That is a credential-storage problem, and it is dangerous to get wrong.

This must be framed as **secure continuity and human-approved automation, not stealth or
bypass.** A vault that leaks secrets, or that quietly autofills passwords into untrusted pages,
would be worse than no vault at all.

The immediate question is **not** "which password manager should Feather copy?" It is:

> What is the safest *minimal* credential-storage architecture Feather can adopt **without
> becoming a full password-manager project**?

### Threat model the vault must assume

1. Disk theft / backup leakage.
2. Accidental plaintext leakage in **logs, debug bundles, crash dumps, screenshots, traces, or
   exports** — the most Feather-specific risk, given Feather already produces all of these.
3. A malicious local process reading files under the user profile.
4. A compromised page or extension trying to read autofilled secrets.
5. Cloud/server compromise *if* any future sync exists.
6. Supply-chain / dependency risk.
7. User recovery failure (lost master key or device).

**Explicit non-goal:** the vault cannot protect secrets after the host OS/session is fully
compromised. Every password manager shares this limit; Feather will not pretend otherwise.

## Decision candidates (proposed, NOT accepted)

These are the directions the research points to. They become real decisions only after the
Validation Gate clears.

1. **Interface-first, local-first.** A narrow `CredentialsVault` interface is the only way the
   rest of Feather touches secrets. Operations: `getSecret`, `putSecret`, `deleteSecret`,
   `listMetadata`, `unlock`, `lock`, `rotateKey`, `exportEncryptedBackup`. **No browser/page
   code ever gets raw vault access.**
2. **Feather will not become a full password manager.** It owns *automation policy and approval
   UX*; dedicated password managers own password-manager complexity wherever possible.
3. **First candidates for the storage backend and external integration — not selections:**
   - **SQLCipher** as the first *local encrypted storage* candidate (queryable relational store:
     origin, username label, encrypted payload, usage policy, timestamps, audit metadata; raw
     binary key mode rather than handing user passwords to SQL).
   - **KeePassXC** as the first *external-manager integration* candidate (Linux-first,
     local-first, OSS, Secret Service + CLI ecosystem — request credentials without Feather
     necessarily storing them). Aligns with the host-primary posture (ADR-0004).
   - Bitwarden / Proton Pass / 1Password remain **security-model references only**, not
     implementation dependencies.
4. **Leakage-first sequencing (hard rule).** **No credential automation ships before a
   secret-redaction test suite and a debug-bundle/log/trace leakage harness exist and pass.**
   The leakage harness is the gate, not an afterthought.
5. **Late, mediated release.** No naive autofill that inserts raw passwords into DOM fields long
   before submit. Secrets are released as late as possible, only after explicit user approval for
   sensitive origins.

### Key-management direction (for Phase 5 planning)

- Master secret is **never** logged, traced, serialized into debug bundles, or exposed to page JS.
- Unlocked vault state is **explicit and time-limited**.
- Prefer OS keyring / Secret Service for the local unlock helper — but never as the *only*
  storage protection.
- Leave room for hardware/second-factor unlock later (YubiKey / age-plugin-yubikey /
  KeePassXC challenge-response).

## Why this is NOT accepted yet

Two open architectural risks make premature acceptance wrong:

- **AEAD vs. CBC+HMAC.** SQLCipher uses AES-256-CBC + HMAC-SHA512. Correct, but modern designs
  often prefer AEAD modes. Acceptable-vs-preferred is a real decision the SQLCipher spike must inform.
- **Node/TypeScript driver & packaging maturity** for both SQLCipher and KDBX on Fedora is
  unproven. Temp files, WAL, and journaling modes can leak plaintext if misconfigured.

Until the harness exists and the candidates are exercised on the target platform, locking the
backend would be a guess.

## Validation Gate — three spikes (must clear before acceptance)

- **Spike A — SQLCipher feasibility (Fedora + Node/TS).** Install/build a candidate driver;
  create an encrypted DB in raw-key mode; **verify the DB, WAL, journals, and temp storage do
  not leak plaintext**; record packaging implications.
- **Spike B — KeePassXC integration.** Evaluate CLI, Secret Service, and direct KDBX library
  paths; test whether Feather can *request* credentials without storing them itself; define the
  approval boundary.
- **Spike C — secret-leakage harness.** Seed a synthetic secret into the vault; run a browser
  action, debug bundle, logs, screenshots, and traces; grep all outputs for the secret;
  **fail hard on any leak.** This harness is reusable as the standing pre-merge gate of rule 4.

Recommended order: **C → A/B.** The leakage harness is the safety net that makes the storage
spikes safe to run with real (synthetic) secrets, and it is the gate every later credential
change must pass.

## Consequences

- Phase 5 Step 0 inherits a pre-recorded vault posture (interface-first, local-first, "not a
  password manager") plus a named **candidate** set and an explicit spike backlog — without any
  premature lock-in.
- The leakage harness (Spike C) is valuable independent of the vault outcome: it hardens
  Feather's existing logs/debug-bundle/trace surfaces against accidental secret exposure now.
- This ADR will be revised to **Accepted** (or superseded) only after the gate clears; the
  current candidate set may change based on spike results.
- Once this candidate lands, the source intake
  (`journal/raw/_inbox/2026-06-04-security-research-credentials-vault.md`) becomes
  archive-eligible (`git mv` → `journal/raw/archive/`).
