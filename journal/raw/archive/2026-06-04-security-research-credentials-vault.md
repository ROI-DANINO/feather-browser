# Security Research — Credentials Vault Options

Date: 2026-06-04
Status: research intake, not an ADR
Scope: Future Phase 5 credentials vault for Feather Browser.

## Framing

This research supports a user-authorized credentials vault for Feather. It must be framed as secure continuity and human-approved automation, not stealth or bypass.

The immediate question is not “which password manager should Feather copy?” The question is:

> What is the safest minimal credential-storage architecture Feather can adopt without becoming a full password-manager project?

## Threat model

Feather should assume the following threats:

1. Disk theft or backup leakage.
2. Accidental plaintext secret leakage in logs, debug bundles, crash dumps, screenshots, traces, or exports.
3. Malicious local process reading files under the user profile.
4. Compromised browser page or extension trying to read autofilled secrets.
5. Cloud/server compromise if any future sync exists.
6. Supply-chain and dependency risk.
7. User recovery failure: losing the master key or device.

Non-goal for the vault layer: it cannot protect secrets after the host OS/session is fully compromised. At that point every password manager has severe limits.

## Candidate password-manager references

### Bitwarden

Strengths:
- Mature open-source / source-available ecosystem with apps, CLI, organizations, sharing, audits, and bug bounty.
- End-to-end, zero-knowledge model.
- Uses AES-CBC-256 with HMAC authentication, PBKDF2-SHA256 by default, and optional Argon2id.
- Strong reference for cloud-sync architecture and secrets-manager workflows.

Weaknesses / cautions:
- Cloud account model is heavier than Feather needs right now.
- Server + organization architecture is too broad for a local-first browser vault.
- Browser-extension attack surface is relevant: Feather should avoid exposing raw secrets to page JS when possible.

Useful for Feather:
- Reference architecture for zero-knowledge cloud sync, access sharing, audit posture, and CLI/Secrets Manager ideas.
- Not the best first implementation substrate for a small local vault.

Sources:
- https://bitwarden.com/help/bitwarden-security-white-paper/
- https://bitwarden.com/help/what-encryption-is-used/

### KeePassXC / KDBX

Strengths:
- Mature open-source local-first password manager.
- Native Linux support.
- Stores vault data offline in encrypted KDBX files.
- Supports key files and YubiKey challenge-response.
- Supports browser integration, CLI, SSH agent integration, and FreeDesktop.org Secret Service.
- Very aligned with Feather's host-primary / Linux-first posture.

Weaknesses / cautions:
- KDBX integration from a Node/TypeScript stack may require a reliable library choice and careful compatibility testing.
- Browser integration creates its own bridge/permission surface.
- Offline vaults shift recovery burden to the user.

Useful for Feather:
- Best reference for local-first vault UX and Linux fit.
- Strong candidate for external-manager integration rather than internal reimplementation.

Sources:
- https://github.com/keepassxreboot/keepassxc
- https://keepassxc.org/

### Proton Pass

Strengths:
- Open-source apps, audited, end-to-end encryption.
- Strong privacy posture; encrypts metadata, not just password fields.
- Uses 256-bit AES-GCM vault encryption.
- Good reference for privacy-first metadata minimization.

Weaknesses / cautions:
- Proton ecosystem/account dependency.
- Less ideal as a local implementation substrate for Feather.

Useful for Feather:
- Reference for metadata encryption and privacy posture.
- Not the first implementation path for the local Feather vault.

Sources:
- https://proton.me/pass/security
- https://proton.me/blog/proton-pass-security-model

### 1Password

Strengths:
- Mature security model with account password + 128-bit Secret Key.
- Strong product design around recovery, device onboarding, teams, and user safety.

Weaknesses / cautions:
- Not open source.
- Cloud-subscription model does not match the current Feather local-first goal.

Useful for Feather:
- Reference for two-secret onboarding and user recovery UX.
- Not an implementation dependency.

Sources:
- https://support.1password.com/1password-security/

## Candidate storage formats / cryptographic substrates

### SQLCipher

Strengths:
- Encrypted SQLite: keeps queryable relational storage while encrypting database pages.
- Uses AES-256-CBC, per-page random IVs, HMAC-SHA512 page authentication, PBKDF2-HMAC-SHA512, random database salt, and memory wiping/locking where possible.
- Supports raw binary key input, which fits a design where Feather derives or obtains the vault key externally.
- Good fit if Feather needs structured secret metadata, audit records, access policy, and future migrations.

Weaknesses / cautions:
- CBC + HMAC is acceptable when implemented correctly, but modern new designs often prefer AEAD modes.
- SQLCipher integration from Node/TypeScript stack needs dependency review and packaging tests on Fedora.
- Temporary files and journaling modes require careful configuration; misconfiguration can leak data.

Useful for Feather:
- Best candidate if Feather wants a queryable local vault database.
- Requires a dedicated hardening checklist before implementation.

Sources:
- https://www.zetetic.net/sqlcipher/design/
- https://www.zetetic.net/sqlcipher/sqlcipher-api/

### KDBX

Strengths:
- Mature password-vault file format used by KeePass/KeePassXC.
- Supports master password + key file model.
- Supports modern options such as Argon2, AES, and ChaCha20 through KeePass/KeePassXC ecosystem.
- Familiar export/import path for users.

Weaknesses / cautions:
- Less convenient for app-specific query patterns than SQL.
- Node/TypeScript library maturity must be checked before relying on it.
- Feather would need to avoid partial or incompatible KDBX behavior.

Useful for Feather:
- Best candidate if the priority is external interoperability with KeePassXC.
- Possibly better as import/export or external integration than as the primary internal store.

Sources:
- https://github.com/keepassxreboot/keepassxc
- https://keepass.info/help/base/security.html

### libsodium secretstream / custom encrypted file

Strengths:
- Modern cryptographic building blocks.
- Good for append-only encrypted blobs, encrypted exports, backups, or small sealed files.
- Avoids database complexity.

Weaknesses / cautions:
- Feather would own the file format, migrations, corruption handling, indexes, backups, audit trail, and recovery story.
- Easy to create a “secure primitive, weak product” if UX and lifecycle are under-specified.

Useful for Feather:
- Good for encrypted export/import bundles or sealed backups.
- Not ideal as the primary vault store unless the vault remains tiny.

Source:
- https://doc.libsodium.org/secret-key_cryptography/secretstream

### age

Strengths:
- Simple modern file encryption tool/format/library.
- Small explicit keys, no config options, UNIX-style composability, Fedora package availability, and YubiKey plugin ecosystem.
- Good fit for encrypted backups, handoff files, and offline export.

Weaknesses / cautions:
- Not a database.
- Not a password-manager vault by itself.
- Metadata can still matter depending on packaging and recipient choices.

Useful for Feather:
- Strong candidate for encrypted export/backups of the Feather vault.
- Not the primary runtime database.

Source:
- https://github.com/FiloSottile/age

## Recommendation

### Recommended architecture for Feather

Do not build a full password manager.

Use a three-layer design:

1. **Vault interface**
   - `CredentialsVault` interface in Feather.
   - Operations: get secret, put secret, delete secret, list metadata, unlock, lock, rotate key, export encrypted backup.
   - No browser/page code gets raw vault access.

2. **Local encrypted storage backend**
   - First serious candidate: SQLCipher.
   - Store structured records: origin, username label, encrypted secret payload, usage policy, created/updated timestamps, audit metadata.
   - Use raw binary key mode rather than passing user passwords directly to SQL when possible.

3. **External manager integrations**
   - KeePassXC first: Linux-first, local-first, open-source, Secret Service support, CLI/browser integration ecosystem.
   - Bitwarden second: CLI/Secrets Manager reference for future cloud/team mode.
   - Proton Pass/1Password as security-model references, not primary dependencies.

### Key management recommendation

For Phase 5 planning:

- Master secret should never be logged, traced, serialized into debug bundles, or exposed to page JS.
- Keep unlocked vault state explicit and time-limited.
- Prefer OS keyring / Secret Service integration for local unlock helper, but do not rely on it as the only storage protection.
- Support hardware-backed or second-factor unlock later: YubiKey / age-plugin-yubikey / KeePassXC challenge-response style.
- Implement a “no secret in logs” test suite before any real credential automation ships.

### Secure autofill / browser-action policy

Feather should avoid naive autofill where raw passwords are inserted into DOM fields long before submit. A safer future path is a mediated fill/submit flow where secrets are released as late as possible and only after explicit user approval for sensitive origins.

## Decision candidates

Potential ADR direction:

- **ADR: Credentials Vault will be interface-first and local-first.**
- **ADR: Feather will not become a full password manager.**
- **ADR: First storage spike compares SQLCipher vs KeePassXC/KDBX integration.**
- **ADR: No credential automation ships before secret-redaction tests and debug-bundle leakage tests exist.**

## Next implementation spikes

1. **Spike A — SQLCipher feasibility on Fedora + Node/TypeScript**
   - Install/build candidate driver.
   - Create encrypted DB.
   - Use raw key mode.
   - Verify database, WAL, journals, and temp storage do not leak plaintext.
   - Verify packaging implications.

2. **Spike B — KeePassXC integration**
   - Evaluate CLI, Secret Service, and direct KDBX library options.
   - Check whether Feather can request credentials without storing them itself.
   - Define approval boundary.

3. **Spike C — secret leakage harness**
   - Synthetic secret seeded into vault.
   - Run browser action, debug bundle, logs, screenshots, traces.
   - Grep outputs for the synthetic secret.
   - Fail hard on leakage.

## Current bottom line

Best near-term path:

> SQLCipher-backed local Feather vault behind a strict `CredentialsVault` interface, plus KeePassXC external-manager integration spike, plus mandatory secret-leakage tests before any credential automation.

Best long-term posture:

> Feather owns automation policy and approval UX. Dedicated password managers own password-manager complexity wherever possible.
