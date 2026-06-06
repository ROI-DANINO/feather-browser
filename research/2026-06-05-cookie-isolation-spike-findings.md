# Cookie-Isolation Spike — Findings (scratch account)

**Date:** 2026-06-05
**Status:** ✅ COMPLETE — live spike executed on the burnable `scratch` Google account
**Workstream:** Autonomous research run ②.1 (`docs/plans/2026-06-05-autonomous-research-run.md`)
**Spike script (throwaway, ships nothing):** `scripts/spikes/cookie-isolation-spike.ts`
**Anchors:** `research/2026-06-04-cookie-jar-isolation-and-phase5-sequencing.md` (the fork it answers),
ADR-0003 (Cookie Mine), `journal/context/next.md` (the measure-first correction)

> **Iron rule honored:** all live browser work hit `scratch` (`roionly9@gmail.com`, throwaway) ONLY.
> The real `primary` session was never opened, cloned, or driven. Roi explicitly approved the full
> clone test (2026-06-05) with the shared-iPhone risk understood and accepted.

---

## Question

Does cloning a Google session's cookies into a **fresh isolated browser context** keep the user
authenticated — **and** does the clone trip a "session theft" flag that invalidates the *original*
session? This is the shared-vs-isolated fork from the 2026-06-04 design note. Per the `next.md`
correction, the spike's **first job was to MEASURE** whether the session is device-bound (DBSC),
because `scratch` was warmed **password-only** (this Fedora box cannot create a local passkey, so it
cannot hold a platform-authenticator-bound credential).

## Procedure (measure-first, then the approved clone)

1. Launch `scratch` persistent workspace headed via `chromium-headed-cdp` (system Chromium 148,
   `navigator.webdriver === false`); confirm logged in at `myaccount.google.com`.
2. **Read-only:** export `storageState()`; classify the Google auth cookies; check the on-disk
   profile for a DBSC bound-session store.
3. **Clone:** spawn a *separate* fresh-profile Chromium, inject the exported cookies, open
   `myaccount.google.com`; reload after a wait (let any rotation/rebind fire).
4. **Re-check** the original `scratch` session for invalidation.

## Results

### DBSC measurement (the priority finding)
- **Auth cookie set is complete:** `__Secure-1PSID`, `__Secure-3PSID`, `SID`, `HSID`, `SSID`,
  `SAPISID`, `APISID`, `LSID` (63 cookies total; 42 on `google.com`).
- **Rotation/continuation cookies present:** `__Secure-1PSIDTS`, `__Secure-3PSIDTS`,
  `__Secure-1PSIDCC`, `__Secure-3PSIDCC`. The `…SIDTS` pair is Google's short-lived,
  server-refreshed session-timestamp mechanism.
- **No on-disk DBSC bound-session store** was found anywhere in the `scratch` profile (searched for
  `DeviceBound* / BoundSession* / DBSC*`; none exist). **Interpretation:** `scratch`'s session is
  **NOT registered as a Device-Bound Session.** The `…SIDTS` cookies rotate, but rotation here is
  not gated on a device-held private key — consistent with the password-only warm-up and with "this
  box can't hold a device-bound session."

### Clone survival
- The cloned isolated context loaded `myaccount.google.com` **fully authenticated**
  (`roionly9@gmail.com`), `navigator.webdriver === false`.
- It **stayed logged in across a reload + wait** — no re-challenge, no forced re-auth.

### Original-session impact (session-theft check)
- After the clone ran, the **original `scratch` session was still logged in** — same account, no
  invalidation, no CAPTCHA wall, no forced sign-out.

## Conclusion

For a **non-device-bound** Google session, **copy-to-isolated-context works and is
non-destructive**: copied auth survives in a fresh context, and the clone does not flag or
invalidate the origin session. This is the "isolation is a cheap, obvious win" branch of the
2026-06-04 fork — *for sessions in this binding state*.

## The load-bearing caveat (for the joint call — do NOT act on `primary`)

This result **does not transfer to `primary` unchanged.** `primary` was warmed via **passkey /
Face-ID (a device-bound new-device flow)**, so it *may* carry DBSC binding that `scratch` lacks —
and DBSC is exactly the mechanism that would (a) make a cookie copy fail to refresh once the bound
`…SIDTS` rotation requires the origin device key, and (b) make two live sessions look like theft.
**We measured the wrong-for-`primary` condition on purpose** (burnable account), so:

- ✅ Proven: isolation is viable + safe when the session is **not** device-bound.
- ❓ Open (Roi's call, unacted): whether `primary`'s passkey-warmed session is actually DBSC-bound,
  and if so whether copy-to-isolated survives it. The honest next step is to **measure `primary`'s
  binding state read-only** (does its profile contain a DBSC bound-session store?) *before* ever
  deciding to clone it — never a blind clone on the real jar.

## Lightweight lens

The spike ships **nothing**: the script lives in `scripts/spikes/` and is not imported by `src/`.
The exported `storageState.json` and screenshots contain live session material and were kept in a
`/tmp` spike dir — **never committed**. Knowledge, not weight.

## Follow-ups

- Phase-5 shared-vs-isolated decision now has its first empirical anchor; lock the final policy at
  Phase 5 Step 0 (per the 2026-06-04 note), informed by a read-only `primary` binding measurement.
- If/when `primary` isolation is considered: measure binding first; if bound, design a snapshot /
  throwaway-first procedure; treat any clone of the real jar as a you-in-the-loop action.
