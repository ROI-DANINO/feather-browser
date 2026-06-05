# Cookie Mine Loop Demo — Pre-shell #6 / ADR-0007 Gate Evidence

**Date:** 2026-06-05
**Status:** ✅ COMPLETE — loop demonstrated end-to-end on the headed-Chromium stopgap (scratch)
**Workstream:** Autonomous research run ②.2 (pre-shell infrastructure item #6)
**Demo script (throwaway, ships nothing):** `scripts/spikes/cookie-mine-loop-demo.ts`
**Gates:** ADR-0007 (Phase-4 shell sequencing — "prove the e2e Cookie Mine loop on the headed
stopgap *before* designing the GUI")

> **Iron rule honored:** ran on the burnable `scratch` account (`roionly9@gmail.com`) ONLY.
> `primary` was never opened or driven.

---

## What the gate requires

ADR-0007 holds the Visual Desktop Shell GUI behind one proof: that the **Cookie Mine loop** works
on the current headed-Chromium stopgap — a human warms a persistent session, and then an
**agent-style process piggybacks on that same on-disk context** to complete an authenticated task
**without any human re-login**, while staying un-flagged (`navigator.webdriver === false`). This is
the mechanism every Phase-5 agent depends on.

## Procedure

1. (Earlier, by a human) `scratch` was warmed via `warm-session` — a real Google login persisted to
   the `scratch` persistent workspace on disk.
2. (This demo, the **agent** step) A Feather `SessionManager.launch(...)` opened that **same
   persistent workspace** in `chromium-headed-cdp` mode — **no human, no credential typed.**
3. The session performed two authenticated background tasks that only a logged-in user can do, and
   captured proof.

## Result (loop closed)

```json
{
  "accountUrl": "https://myaccount.google.com/",
  "webdriver": false,
  "accountEmail": "roionly9@gmail.com",
  "gmailUrl": "https://mail.google.com/mail/u/0/#inbox",
  "gmailAuthenticated": true,
  "gmailTitle": "דואר נכנס (132) - roionly9@gmail.com - Gmail"
}
LOOP CLOSED: true
```

- **Inherited auth accepted by the account page:** read the signed-in account's own address
  (`roionly9@gmail.com`) off `myaccount.google.com` — content only a logged-in user sees.
- **Inherited auth accepted by a real product:** `mail.google.com` loaded the **actual inbox**
  (title shows 132 messages), not a sign-in wall — `gmailAuthenticated === true`, URL settled on
  `#inbox`.
- **Un-flagged:** `navigator.webdriver === false` throughout (attach-don't-launch holds for the
  agent path, system Chromium 148).
- **No human in the loop:** the agent step typed no password and ran no login flow — it relied
  entirely on the cookies the human warm-up left in the shared jar.

Evidence screenshots (`loop-01-myaccount.png`, `loop-02-gmail.png`) were written to the session's
Feather debug dir (`…/state/feather/debug/<sessionId>/`). They contain real account content and are
**not committed**.

## Conclusion

**Pre-shell #6 is met.** The end-to-end Cookie Mine loop — human warms → agent piggybacks on the
persistent context → authenticated background task completes, un-flagged — works on the
headed-Chromium stopgap. Per ADR-0007, the gate that stood between here and the Visual Desktop Shell
GUI is cleared: **GUI design can now begin** (the painted-in shell remains the deferred end-state;
the headed stopgap is the proven substrate).

## Caveats / honest scope

- Demonstrates the **mechanism** on a non-device-bound throwaway session (see the cookie-isolation
  findings: `scratch` is not DBSC-bound). The loop here uses the **shared** persistent context (no
  cookie cloning), which is the simplest, binding-safe path and the one Phase 4 actually needs.
- The **shared-vs-isolated** decision for when real Phase-5 agents act in a valuable jar remains a
  Phase-5 Step-0 call (anchored by `research/2026-06-05-cookie-isolation-spike-findings.md`); it is
  **not** required to clear this Phase-4 gate.
- The agent here is a scripted task, not an LLM agent — Phase 4 has no agent runtime by design
  (ROADMAP). This proves the **substrate**, which is exactly what the gate asks.

## Lightweight lens

Ships nothing: the demo lives in `scripts/spikes/`, not imported by `src/`. Evidence stayed in the
local state dir. Knowledge, not weight.
