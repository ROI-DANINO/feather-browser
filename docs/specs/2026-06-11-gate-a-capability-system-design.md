# Gate A — Local Control-Plane & Capability System — Design

**Date:** 2026-06-11
**Status:** Design approved (brainstorm). Decisions locked. **A0 shipped; A1 slices 1–3 shipped**
(session-hold primitive, grant registry + state machine, approval page + dangerous-mode policy +
dual audit + the cookie-export demo door — proven end-to-end). Slice-3 build doc:
`docs/specs/2026-06-11-a1-slice3-plan.md`. Remaining Dangerous-tier doors (CDP attach, vault release)
get gated as they are built in 5c / ADR-0008.
**Phase:** Phase 5.0 ("Gate A") — the first Phase 5 work, ahead of Identity, MFA, warmed CDP, Stealth.
**Classification:** Core browser stability + security. This is the safety machinery that governs
Feather's highest-privilege surfaces (warmed-profile CDP attach, vault release, raw cookie/storage
export).
**Decides:** ADR-0010 (now ACCEPTED) — this doc pins the *build sequencing and seams*; ADR-0010 owns
the *model*. If the two ever conflict, ADR-0010 wins on the model, this doc wins on sequencing.

> Gate A is the council's "security model first, interop through that model" reversal made concrete.
> It exists because Feather was about to expose root-access surfaces (CDP attach reads raw session
> tokens) *before* the machinery meant to govern them. Nothing downstream — Identity, MFA, warmed
> CDP, Stealth — lands until its gate exists here.

## Why

A warmed Chromium profile is a live bearer-credential vault (cookies, refresh tokens,
`localStorage`/`IndexedDB` tokens, DBSC keys). The control planes over that vault — the local HTTP
routes, the no-auth MFA page, and especially CDP attach — are today guarded only by a single static
all-or-nothing bearer token, with **no `Origin`/`Referer`/`Host` validation at all**. That is:

1. A working **CSRF drive-by / DNS-rebind** target: the warmed browser itself, sitting on a hostile
   page, can `fetch("http://127.0.0.1:<port>/…", {mode:"no-cors"})` and the request lands.
2. **Coarse:** the token grants *every* capability, forever. There is no way to prove "I may attach
   CDP to *this one* session for the next 60s" without also being able to do everything else.

Gate A closes both: transport hardening kills (1); a tiered capability model with short-lived,
human-approved, auto-revocable grants fixes (2).

## Decomposition — A0 + A1

Gate A ships in two pieces. **A0 lands ahead of A1** as its own spec/PR.

### A0 — Transport hardening (ship-ahead)

A single global request hook, applied to **every** route — authenticated `/v1/*` *and* the no-auth
MFA/approval pages.

- **Host:** reject unless the `Host` header ∈ `{ 127.0.0.1:<port>, localhost:<port>, [::1]:<port> }`.
  Closes DNS-rebind (a rebinding attacker controls DNS, not the `Host` header we require).
- **Origin / Referer:** if present and **foreign**, reject. If **absent**, allow (non-browser
  callers — the agent's HTTP client, curl — legitimately send no `Origin`; a browser CSRF attempt
  always sends one).
- Loopback bind stays.

A0 is small, self-contained, and closes the single worst concrete hole. It does **not** depend on
any of A1. Defense-in-depth context: `/v1/*` already requires the custom `X-Feather-Token` header
(which forces a CORS preflight a hostile page can't satisfy); the no-auth pages get their own
`humanToken` + CSRF nonce from the MFA plan. A0 is the belt to those suspenders, and the only thing
that protects the no-auth routes from a same-`Origin`-less drive-by.

### A1 — Capability system

Everything else in ADR-0010: the three tiers, the session-hold primitive, the capability-grant
registry, the dangerous-mode policy, and the audit surfaces. This is the Phase 5.0 build proper.

## A1 — the seams

These are specified as **behaviors and seams**, not locked cross-module TypeScript interfaces
(per ADR-0010 scope). Concrete types are fixed when each consuming module is built.

### 1. Three privilege tiers

Classification is by **leak potential** — what an operation can hand to an untrusted caller — not by
convenience. Concrete current-endpoint → tier mapping (the deliverable table; cold-session ops stay
**Safe** and unchanged):

| Tier | Gate | Operations (current surface) |
|---|---|---|
| **Safe** | Bearer token only | launch cold/disposable session; navigate; snapshot/observe; extract/read value; click/type/press/wait on a **non-warmed** session; read session list / events / health |
| **Sensitive** | Token + human-observable hold/approval | launch on a **warmed** identity; create/resolve an MFA challenge; mark an identity warm |
| **Dangerous** | Token + **capability grant** | warmed-profile **CDP/WS attach**; **vaultRef** credential release; raw cookie / storage export |

The static token alone is **never** sufficient for the Dangerous tier.

### 2. Session-hold primitive

- Lives in **core / the capability layer**, *not* in Stealth. This placement is load-bearing: it
  breaks the MFA → Stealth dependency (MFA creates an `mfa` hold instead of calling
  `setStealthMode`), which is what frees Stealth to be built **last**.
- **Refcounted holds**, each with a `reason`: `mfa | human-approval | cdp-attach | shutdown`.
- A **policy layer observes holds and decides behavior** (suspend agent access, mode shifts).
  Nothing toggles stealth directly.
- **Holds own live resources.** A `cdp-attach` hold owns the CDP/WS socket for the lifetime of the
  attachment; releasing it closes the socket. This is what gives revocation teeth (below).
- Seam surface (shape, not locked types): `createHold(sessionId, reason) → handle`,
  `release(handle)`, `observe(sessionId) → holds[]`. A hold may carry a teardown closure for its
  owned resource.

### 3. Capability-grant lifecycle

- **Shape:** Feather mints an **opaque single-use nonce** → handle into a server-side **registry**
  record `{ sessionId, capability, ttl, status }`. No signed token, no `0600` file.
- **Scoped:** exactly one `sessionId` **and** one capability (`cdp-attach | vault-unlock |
  cookie-export`). No ambient/multi-capability grants.
- **State machine:**

  ```
  requested ──approve──> granted ──use──> used ──┐
      │                     │                     ├──> expired   (TTL elapsed)
      └──deny──> denied     └─────────────────────┴──> revoked   (session close | MFA-open | shutdown)
  ```

- **Approval** flows through the **local approval page** — the same pattern as the MFA local page:
  `humanToken` in the URL (an identifier, not the secret), a per-page **CSRF nonce**, a **strict CSP
  with no external resources**. The grant is surfaced to the **human**, never to the agent.
- **Auto-revoke** triggers: session close, an MFA challenge opening for that session, shutdown. Each
  releases the grant's owning hold → tears down the live op.

### 4. Revocation has teeth

Revoking a grant does **not** merely invalidate an already-spent nonce — it **forcibly tears down
the in-flight dangerous operation**. A granted `cdp-attach` creates a hold that owns the live socket;
the revoke trigger releases that hold and **closes the socket**, dropping the agent's root access to
the warmed profile *the instant* trust is in question (e.g. an MFA wall appearing mid-errand). This
is the only reading under which "auto-revoke on MFA-open" protects anything.

- Grant = permission to **start**.
- Hold = the live operation's **presence and lifetime**.
- Revoke = **tear down** the hold's owned resource.

### 5. Dangerous-mode policy & audit

- Dangerous capabilities are **off by default**. Enabling requires explicit config/opt-in **and** a
  per-grant human approval. Never silently enabled by token presence.
- **Audit (both surfaces):** every lifecycle event — `requested / granted / denied / used / expired /
  revoked`, redacted — is emitted on the **logging bus** *and* appended to a **durable append-only
  audit log under the STATE root**. The bus keeps live observers current; the durable log is the
  forensic record the dangerous tier requires.

## Non-goals (carried from ADR-0010)

- **Not** multi-user auth or RBAC. Feather stays single-user and local; capabilities are scoped
  permissions for *operations*, not principals.
- **Not** remote exposure. Everything stays loopback + local. Gate A narrows access; it never widens
  it.
- **Not** the vault *store* (ADR-0008 owns how secrets are stored). Gate A owns the *trigger* — who
  may release, under what grant.
- **No** pre-committed cross-module TS interfaces. Hold + grant are seams here; concrete types land
  with each consuming module.

## Build order

1. **A0 — transport hook** (its own spec/PR). Global `Origin`/`Referer`/`Host` validation on all
   routes. Ships ahead; unblocks nothing downstream but closes the worst hole immediately.
2. **A1 — session-hold primitive** in core. First A1 piece because MFA and CDP both depend on it, and
   it is what unblocks Stealth-last sequencing.
3. **A1 — capability-grant registry + state machine + local approval page** (the page reuses the MFA
   page's `humanToken`/CSRF/CSP stack).
4. **A1 — dangerous-mode policy + dual audit surface**, then wire the three Dangerous-tier operations
   (CDP attach, vault release, cookie/storage export) behind grants.

Downstream (Identity, MFA, warmed CDP, Stealth) consumes these seams; none of it lands until its gate
exists here.

## Open questions

None blocking. The four ADR-0010 open questions are resolved (token shape, approval surface, ship-A0-
now, audit durability) plus the revoke-teeth decision. Remaining detail (exact registry persistence
format, TTL defaults per capability) is implementation-level and fixed in the A1 plan.
