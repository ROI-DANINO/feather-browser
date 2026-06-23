# 5c Reframe — Native Path *is* the Spine; Raw-CDP Attach Deferred to Interop

> **Status:** decision doc (2026-06-23). Output of the 5c design pass. Supersedes the framing in
> `docs/specs/2026-06-23-v2-spine-completion-plan.md` that "5c = warmed-profile CDP attach" is the
> last spine piece. Read alongside that plan, `adr-0010`, and `docs/specs/2026-06-04-attach-dont-launch-design.md`.
> **Decision (Roi, 2026-06-23):** the v2 spine's *safety* is delivered by Feather's **native,
> credential-safe API** — not by handing out raw CDP. Raw-CDP attach is **interop, not a safety
> brick**, and is **deferred to 5e** (build later only on a concrete external-tool need).

## Why this doc exists

The 5c design pass set out to design "warmed-profile CDP attach" — expose a warmed (logged-in)
Chromium session to an **external** tool (Playwright / Puppeteer / browser-use) over raw CDP, behind
Gate A. Working through the hazard with Roi surfaced a cleaner read of the architecture that changes
*what 5c should be*. This doc records that decision and its reasoning so a future session does not
re-litigate it or accidentally build the deferred proxy.

## The reframe

**Feather already has a native, mediated control surface: its own HTTP API** (`observe` / `click` /
`type` / `extract` / `snapshot`). That surface is the **Safe tier** by design (ADR-0010 §1): the agent
drives the page through Feather verbs and **never touches a raw credential**. Feather performs the
action inside the browser and returns a result.

Raw-CDP attach is the *opposite* of that. CDP is root access to the browser: an attached client can
`Network.getCookies` / `Storage.getCookies` / `Runtime.evaluate` and read raw session tokens directly
(ADR-0010 §Context). So raw-CDP attach is **not the safe way to drive a warmed session** — it is the
**interop escape hatch** for letting *foreign tools* borrow a warmed session over the raw protocol
(ADR-0006 interface-neutrality; the 5e north star). A filtering proxy can make that door *less*
dangerous (block `Network`/`Storage` to protect the HttpOnly crown-jewel cookies, allow
`Runtime.evaluate` so tools still work, origin-pin the blast radius), but the most secure answer to
"why hand out raw access at all?" is **don't** — drive through the native, mediated API.

## The exit-criterion trace (why the spine's *safety* is already complete)

The v2 wrap's exit criterion (`docs/specs/2026-06-23-v2-spine-completion-plan.md`):

> *"an agent can attach to a named warmed identity and operate it through a login/MFA challenge, with
> the human in the loop, with the safety brakes live."*

Against shipped reality:

| Requirement | Delivered by | Status |
|---|---|---|
| named **warmed identity** | 5a Identity Model | ✅ shipped |
| **operate it** (credential-safe) | Feather's native API (Safe tier) | ✅ exists |
| through a **login/MFA challenge, human in loop** | 5b MFA Handler (banner-free pause + notifier + local page) | ✅ shipped |
| **brakes live** | 5b `HUMAN_IN_CONTROL` guard — refuses agent page-mutations while a pause is active | ✅ shipped |

The auto-revoke-on-MFA brake that ADR-0010 specifies was designed to **tear down raw-CDP root access**
when a challenge opens. On the **native** path there is no raw CDP to tear down — the agent is already
braked by the 5b pause guard. So the native path satisfies the exit criterion **without 5c**. The
spine's *safety* is **feature-complete on paper**; the only thing between "built" and "proven" is the
**live test** (the deliberately-deferred testing brainstorm).

> Honest caveat: 5b was proven with a **mock browser** only. "Feature-complete on paper" is not
> "proven live." The live test may surface a real gap — and per the testing-honesty rule, a clean
> failure-with-lesson there is a *successful* test, not an embarrassment.

## What this means concretely

- **The welded-proxy design is shelved, not lost.** Its full shape (retain `wsEndpoint` on the session;
  `src/browser/cdp-proxy.ts` filtering `ws` proxy that blocks `Network`/`Storage`, allows
  `Runtime.evaluate`, origin-pins, single-connection, one-time door token; `cdp-attach` hold owning the
  proxy teardown; `POST /v1/sessions/:id/cdp-attach` door; auto-kill-on-MFA via a hook into 5b's
  `createChallenge`; `ws` dependency) is captured here and in the design-pass discussion. Rebuild from
  this doc when a real external-tool need appears.
- **Gate A's `cdp-attach` capability stays built-but-dormant.** Present in the `CapabilityName` union,
  the policy `KNOWN` set, the `HoldReason` union, and the approval page. Nothing forces it open now;
  it is ready the day interop is wanted.
- **No raw credentials ever leave Feather** in the wrapped spine. That is the security win of this call.
- **The deferred raw-CDP work moves to 5e** (Agent Runtime / ecosystem interop), where interop belongs,
  alongside the MCP / tool-surface reconciliation (5.0.1) and the connector-registry decision.

## Costs accepted

- **Less ecosystem interop today.** Foreign Playwright/browser-use agents cannot borrow a warmed
  session yet. Acceptable: no concrete external-tool demand exists for Roi right now (YAGNI).
- **The marquee dangerous door Gate A was built for goes unused for now.** Acceptable: the gate was
  cheap insurance; building it first was correct precisely so the door *can* open later without a
  scramble.

## Next action

The v2 spine has **no remaining build work**. The next real step is the **testing brainstorm** — prove
the native spine live (a warmed identity driven through a real login/MFA challenge, human-in-loop,
brakes observed), Roi driving the human-in-loop steps. That brainstorm was always separate and
deferred (`docs/specs/2026-06-23-v2-spine-completion-plan.md` "Testing is a separate brainstorm"); it
is now the front of the queue. Its outcome — not more building — tells us whether the spine is truly
done.
