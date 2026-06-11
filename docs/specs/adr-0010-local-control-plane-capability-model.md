# ADR-0010 — Local Control-Plane and Capability Model

- **Date:** 2026-06-07 (proposed) · **Accepted:** 2026-06-11
- **Status:** ✅ **ACCEPTED.** This ADR records the security model the 2026-06-07 council
  review (5/5 models) said must exist *before* Feather exposes its highest-privilege
  surfaces. It is the **capability/security model** that the council's "security model
  first, interop through that model" reversal points to. Accepted as a joint call
  (Roi + agent) on 2026-06-11; the four open questions are resolved below. **Phase 5.0
  ("Gate A") implements it**, split into **A0 — transport hardening** (ships ahead) and
  **A1 — capability system**. Build sequencing and seams: `docs/specs/2026-06-11-gate-a-capability-system-design.md`.
- **Driver:** `research/2026-06-07-council-design-review.md` (root-cause finding + action list).
- **Related:** [[adr-0008-credentials-vault]] (what the dangerous tier ultimately protects),
  [[adr-0003-hybrid-browser-shared-context]] (the Cookie Mine — the warmed profile this governs),
  [[adr-0005-agentic-north-star]] and [[adr-0006-agent-interface-neutrality]] (the agent surface
  this model gates), [[project_security_and_agent_fidelity]].

---

## Context

Feather's control plane **today** is a single static bearer token:

- `startHttpServer` mints one 32-byte hex token at boot, writes it to `tokenFile` with mode `0600`,
  and every `/v1/*` route is guarded by `createTokenAuth(token)` checking the `X-Feather-Token`
  header (`src/transport/middleware.ts`, `src/transport/routes.ts`).
- The only global request hook is `injectRequestId` (`src/transport/http.ts`). **There is no
  `Origin` / `Referer` / `Host` / CORS validation** — confirmed by the council's live-code reviewer.
- The server binds to loopback.

This was correct for Phase 0–3 (a single trusted local caller driving cold sessions). It is **not
sufficient** for what Phases 4a.7 / 5 are about to introduce. The council's unanimous root cause:

> **Feather is sequencing the highest-privilege surfaces (CDP attach, unauthenticated MFA routes,
> warmed credentials on disk) *before* the safety machinery meant to govern them.**

Three facts make the current model inadequate:

1. **A warmed Chromium profile is a bearer-credential vault.** Its profile directory holds live
   cookies, refresh tokens, `localStorage`/`IndexedDB` tokens, and DBSC keys **right now**. CDP
   attach, the local HTTP routes, and the MFA helper page are all **control planes over that vault**.
   CDP specifically is *root access*: an attached client can `Network.getCookies` /
   `Storage.getCookies` / `Runtime.evaluate` and read raw session tokens directly — bypassing the
   "agents never see raw credentials" thesis.

2. **"Localhost" is a transport location, not a security boundary.** Any process on the machine can
   reach `127.0.0.1`, and — critically — so can **the warmed browser itself** while it sits on an
   untrusted site. A hostile page can `fetch("http://127.0.0.1:<port>/…", {mode:"no-cors"})` with no
   CORS preflight; the request lands. Without an `Origin`/`Host` check this is a working CSRF
   drive-by and a DNS-rebinding target.

3. **The single static token is coarse.** It is all-or-nothing, long-lived, and grants *every*
   capability. There is no way for a caller to prove "I may attach CDP to *this one* warmed session
   for the next 60 seconds" without also being able to do everything else, forever.

This ADR decides **how a local caller proves it may touch a warmed session, and how dangerous
operations are governed** — distinct from *how the vault stores secrets* (ADR-0008).

---

## Decision (the model)

Layer a **capability model** over the existing bearer token. Sort every operation into one of three
privilege tiers; govern the dangerous tier with **short-lived, single-purpose, auditable capability
grants** plus a **human approval gate**. Add transport hardening that applies to every route.

### 1. Three privilege tiers

| Tier | Examples | Gate |
|---|---|---|
| **Safe** | launch cold/disposable session, navigate, snapshot, extract, click/type/press/wait on a non-warmed session, read session list/events | **Bearer token only** (today's model — unchanged) |
| **Sensitive** | launch on a warmed identity, create/resolve an MFA challenge, mark an identity warm | **Bearer token + a human-observable hold/approval**; no raw secret ever leaves Feather |
| **Dangerous** | warmed-profile **CDP/WS attach**, **vaultRef credential release**, raw-cookie/storage export | **Bearer token + an explicit capability grant** (below). The static token alone is never enough. |

The classification is by **what the operation can leak or hand to an untrusted caller**, not by how
convenient it is. The current cold-session operations stay Safe and unchanged.

### 2. Capability grant primitive (governs the Dangerous tier)

A dangerous operation requires a **capability grant** with all of:

- **Shape (resolved Q1):** an **opaque single-use nonce** Feather mints, handing back a handle into
  a server-side **grant registry** record `{ sessionId, capability, ttl, status }`. No signed/JWT
  token, no `0600` capability file. The nonce is single-use; the registry record carries the TTL and
  the live state.
- **Scoped** — bound to exactly one `sessionId` **and** one capability name
  (`cdp-attach` | `vault-unlock` | `cookie-export`). No ambient, multi-capability grants.
- **Human-approved at grant time (resolved Q2)** — minting a grant requires an explicit human action
  via the **local approval page** (same pattern as the MFA local page: `humanToken` + per-page CSRF
  nonce + strict CSP), not the mere presence of the bearer token.
- **Lifecycle:** `requested → (approved | denied) → granted → used → {expired | revoked}`.
- **Audited (resolved Q4):** `grant.requested` / `granted` / `denied` / `used` / `expired` /
  `revoked` events (redacted) on the logging bus **and** persisted to a **durable append-only audit
  log under the STATE root**. Both surfaces, not one.
- **Auto-revoked** on session close, on an MFA challenge opening for that session, and on shutdown.
  **Revocation has teeth:** a granted dangerous op creates a hold that *owns* the live resource
  (§4), so revoking forcibly **tears the live operation down** — closes the CDP/WS socket, drops the
  vault handle — rather than merely invalidating an already-spent nonce. An MFA challenge opening
  mid-attach ends the agent's root access to the warmed profile immediately.

The agent never holds a capability grant secret; like the MFA code, the grant is surfaced to the
**human** to approve.

### 3. Transport hardening (applies to ALL routes, especially the no-auth local pages)

- Add a **global `Origin` / `Referer` / `Host` validation hook** that rejects cross-origin,
  browser-initiated requests and mismatched `Host` headers. This kills the CSRF drive-by and
  DNS-rebinding classes outright and is **cheap enough to ship ahead of the full capability system.**
- Keep the loopback bind.
- The MFA local page (the one route family that is intentionally no-auth so a human can open it):
  `challengeId` is an **identifier, not the secret**; access requires a separate single-use
  **`humanToken`** in the URL; each page carries a **per-page CSRF nonce**; the page ships a **strict
  CSP with no external resources**. (Folded into the MFA plan — see that plan's security tasks.)

### 4. Session-hold primitive (replaces direct stealth toggling)

A session carries **refcounted holds**, each with a `reason`
(`"mfa" | "human-approval" | "cdp-attach" | "shutdown"`). Operations *create* holds; a **policy
layer observes holds and decides behavior** (whether to suspend agent access, whether the behavioral
mode changes, etc.). Nothing toggles stealth mode directly.

A hold may **own a live resource**: a `cdp-attach` hold owns the CDP/WS socket for the duration of
the attachment, so **releasing the hold tears that resource down**. This is what gives grant
revocation (§2) its teeth — revoke releases the owning hold, which closes the socket. Grant =
permission to *start*; hold = the live operation's *presence and lifetime*; revoke = *tear down*.

This primitive lives in **core / the capability layer, not in the Stealth module.** That placement
is load-bearing for the sequencing below: it **breaks the MFA → Stealth dependency** (MFA no longer
needs `setStealthMode`; it creates an `mfa` hold), which is exactly what lets Stealth move to *last*.

### 5. Dangerous-mode policy

Dangerous capabilities are **off by default**. Enabling them requires explicit configuration/opt-in
**and** a per-grant human approval. They are never silently enabled by the presence of a token.

---

## Scope / non-goals

- **Not multi-user auth or RBAC.** Feather stays single-user and local. Capabilities are not
  principals in an authorization system; they are scoped permissions for *operations*.
- **Not remote exposure.** Everything remains loopback + local. This ADR narrows access; it never
  widens it.
- **Not the vault implementation.** ADR-0008 decides how secrets are stored. This ADR decides *who
  may trigger* a release and under what grant — the trigger, not the store.
- **No pre-committed cross-module type contracts.** Per the council, the hold primitive and capability
  grant are specified here as **behaviors and seams**, not as locked TypeScript interfaces shared
  across modules that don't exist yet. Concrete types are fixed when each consuming module is built.

---

## Consequences (if adopted)

- **Phase 5.0 builds this first** — the capability/control-plane gate is the first Phase 5 work,
  ahead of Identity, MFA, warmed CDP, and Stealth.
- **Session 4a.7 ships only the cold/throwaway-profile interop proof now.** Cold profiles hold no
  credentials, so no dangerous capability is needed yet; warmed-profile CDP attach is deferred to a
  Phase 5 session **behind this gate** (grant + one-time token + TTL + audit + revoke-on-MFA/close).
- **The MFA plan** gains security tasks: `Origin`/`Host` hook, `humanToken` + CSRF nonce + CSP on the
  local page, origin-verify-before-typing, and **replace `setStealthMode` with a hold**.
- **The Identity plan** gates `vaultRef` activation on this gate (not just on ADR-0008), stores
  stealth/MFA policy as **opaque/versioned references** rather than importing unbuilt module types,
  and treats the warmed profile itself as credential-at-rest (FS perms / at-rest encryption / OS
  keyring).
- **The global `Origin`/`Host` hook is a high-value near-term hardening** that can land even before
  the full capability system — it closes the single worst concrete hole (the MFA CSRF drive-by).

---

## Open questions — RESOLVED (joint call, 2026-06-11)

1. **Capability-token shape → opaque single-use nonce + grant registry.** Feather mints an opaque
   single-use nonce backed by a server-side registry record `{ sessionId, capability, ttl, status }`.
   Not a signed/JWT token, not a `0600` capability file. Surfaced to the **human** to approve, never
   to the agent. (See §2.)
2. **Human-approval surface → local approval page.** Reuse the MFA local-page pattern (`humanToken` +
   per-page CSRF nonce + strict CSP) so there is **one coordination surface** for both MFA and
   capability approval. Not a console prompt or Telegram. (See §2.)
3. **Ship the global `Origin`/`Host` hook immediately → YES.** The transport hook is split out as
   **A0** and lands as its own hardening spec/PR **ahead of** the A1 capability system, because it is
   cheap and closes the worst concrete hole (MFA CSRF drive-by + DNS-rebind). (See §3 and the Gate A
   design doc.)
4. **Audit durability → both.** Every grant-lifecycle event is emitted on the **logging bus** *and*
   persisted to a **durable append-only audit log under the STATE root**. The dangerous tier requires
   the durable surface; the bus keeps live observers informed. (See §2.)

**Additional decision (revoke teeth).** Revocation forcibly **tears down in-flight dangerous
operations** rather than only blocking new nonce uses. A granted dangerous op creates a hold that
owns its live resource (§4); revoke triggers (session close, MFA-open, shutdown) release that hold
and close the underlying socket / drop the handle. This is the reading under which "auto-revoke on
MFA-open" protects anything — without it the agent would retain root access to the warmed profile
across exactly the moment trust is in question.
