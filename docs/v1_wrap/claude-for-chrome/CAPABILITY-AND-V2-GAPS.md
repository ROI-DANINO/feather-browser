# Capability head-to-head + what Feather needs for v2

Sharpened analysis of **our Feather agents (`../test_1/`)** vs **Claude for Chrome (`outputs/`)** on
two axes only: (1) **capability** — did the errand actually get *done and verified*; (2) **what Feather
needs for v2** to close the gap. Same 10 errands, same plain-English discipline, same model class.

## The reframe that makes everything else precise

The two harnesses use the **same kind of reasoner**. So when outcomes differ, ask: *was it the agent's
thinking, or the platform under it?* Run the tape and the answer is consistent:

> **The agents are equally capable. Every completion gap traces to Feather's *browser platform*, not to
> the agent's reasoning.** Feather doesn't need smarter agents — it needs a browser platform stealthy,
> durable, and observable enough to let its already-capable agents finish.

Evidence for "equally capable reasoners": given only the errand, **both** independently reached past
GitHub's rounded "90.7k" to the exact `title` attribute (E3, H4), **both** chose wttr.in JSON and parsed
it programmatically (H4), **both** disambiguated Everest's *Elevation* from prominence/isolation (M3),
**both** grounded the article summary in extracted text not memory (H2), and **both** stayed honest on
every non-PASS. On raw perception + reasoning they are a wash.

## Capability scorecard — did the errand get DONE (outcome achieved AND verified)?

| Task | Our agent (Feather) | Claude for Chrome | Gap attribution |
|------|--------------------|-------------------|-----------------|
| E1 HN top story | ✅ done+verified | ✅ done+verified | — (tie) |
| E2 Tel Aviv weather | ✅ | ✅ | — (tie) |
| E3 playwright stars | ✅ (exact) | ✅ (exact) | — (tie) |
| M1 search "Feather Browser" | ✅ | ✅ | — (tie; different engine = env, not capability) |
| M2 httpbin form | ❌ **blocked** (503, never submitted) | ✅ submitted+echo verified | **Feather platform** (fingerprint) |
| M3 Everest elevation | ✅ | ✅ | — (tie) |
| H4 multi-tab 3 facts | ✅ 3/3 | ✅ 3/3 | — (tie) |
| H1 holiday → Calendar | ✅ created+verified | ✅ created+verified | — (tie) |
| H2 Google → article | ✅ (worked around new-tab) | ✅ (udm=14) | — (tie; both completed) |
| H3 Instagram like+comment | ❌ **died mid-action** (socket; like maybe landed, unverified) | ❌ **couldn't start** (logged out) | **Feather platform** (CDP death) **+ Feather burned the session** |

**Completed & verified: 8/10 ours, 9/10 C4C.** Of the 8 errands both could even attempt under their
environment, **both completed all 8**. The two places our agents didn't finish (M2, H3) were **both
platform failures, not reasoning failures** — and on both, the agent did the *right* thing (M2 reported
the 503 honestly instead of faking; H3 attempted the feed and the like before the socket dropped).

### The H3 chain is the sharpest single lesson
Our agent's H3 likely **liked a real post** (a `Like→Unlike` flip is in its transcript) before the CDP
socket died ~7.5 min in. ~90 min later C4C found the **same Instagram session logged out** — while Google
stayed logged in. So Feather's run didn't just fail to finish; **its automation plausibly tripped
Instagram's anti-automation defenses and invalidated the warmed session** — the exact asset the whole
Cookie-Mine thesis depends on. One run, two platform failures stacked: **(a) the engine couldn't stay
connected, and (b) the way it acted cost us the login.**

## What Feather needs for v2 — prioritized, each tied to evidence

Ordered by how directly the comparison proves the gap. Roadmap anchors in brackets.

### P0 — Long-session CDP/connection durability  [CORE reliability, pre-v2]
**Evidence:** H3 died on ~19 stacked socket-closed errors at ~7.5 min in a headed warmed session. This
is not a v2-security feature — it's a **core reliability hole**: the agent was mid-errand and the
platform dropped. v2's hardest sites mean *longer* sessions, so this blocks everything above it.
**Need:** heartbeat/keepalive on the CDP websocket, auto-reconnect with session/ref recovery, and a
surfaced "connection unstable" signal instead of a silent death. *This is the first thing to fix.*

### P1 — Stealth / fingerprint parity  [Phase 5d — Stealth Stack]
**Evidence:** M2 is a clean controlled experiment — identical errand, **503 to Feather's Playwright
Chromium, 200 to real system Chromium**, with `curl` (UA-spoofed) also 200. So it's the **automation
fingerprint** (TLS/JS surface), not the UA, and `--disable-blink-features=AutomationControlled` alone was
insufficient. **Need:** the verify-not-spoof stealth stack so Feather isn't walled on sites real Chrome
clears. M2 is now a concrete regression test for 5d.

### P2 — Don't burn the warmed session  [Phase 5d behavior + 5b MFA/handoff]
**Evidence:** H3 — bare automation on Instagram likely caused session invalidation; Google (less
automation-hostile) survived in the same profile. **Need:** human-signature pacing/behavior (the
"learn-your-behavior" + kinematic-input items) so agent activity doesn't read as a bot, **plus** MFA/
checkpoint handoff (5b) so when a site *does* challenge, a human clears it and the session survives
instead of dying. The Cookie Mine is only an asset if agents don't destroy it by using it.

### P3 — Tab discovery & new-tab handling  [CORE API gap]
**Evidence:** H2 — our agent clicked a SERP result that opened in a **new tab**; the click returned
`clicked:true` without navigating, and **there is no `GET /tabs`** to find the spawned tab, so it had to
fall back to navigating the active page to the discovered URL. C4C handled multi-tab natively. **Need:**
tab enumeration (`GET /v1/sessions/:id/tabs`) and a new-`pageId` signal on link-opened-in-new-tab.

### P4 — Agent perception robustness: vision + JS-eval escape hatch  [CORE / 5e agent runtime]
**Evidence:** Heavy-DOM pages (HN E1, Wikipedia M3/H2, wttr.in H4) overflowed text extraction in **both**
harnesses — but **C4C's robust fallback was screenshot+zoom (vision) and a first-class JavaScript tool**,
which is why it never stalled. Our agents fell back to `snapshot`/`observe`. Feather *has* `/screenshot`
but it isn't wired into the agent's perception loop as a *read* input, and there's no sanctioned JS-eval
escape hatch. **Need:** (a) a vision-read step the agent can use when structured reads overflow, and (b) a
controlled `evaluate` tool for exact-value reads (both C4C used JS to read the star `title` attr cleanly).
This is the clearest *capability-parity* (not just reliability) investment.

### P5 — Polish: extract ergonomics + teardown bug  [CORE]
**Evidence:** `/extract` rejected first attempts until per-field `type` was supplied (E3, H4) — friction
that cost retries; and `DELETE {force:false}` tripped `ENOTEMPTY` on disposable cleanup (E2, H4).
**Need:** more forgiving extract input (or a much clearer validation error) and a teardown that doesn't
race on the profile dir.

### P6 — Per-site authorization as the Gate-B reference  [Phase 5.0.2 — first-agent safety gate]
**Observation (not a gap — a model to borrow):** C4C runs behind a **plan + per-site allow-list** ("Allow
actions on these sites"), and it even **refused to type credentials** on the logged-out IG (H3). That
human-approval-per-origin pattern is a ready reference for Feather's Gate B. Feather today is token-auth
only; v2's first-agent gate should adopt an allow-list-per-origin + no-credential-entry posture.

## One-paragraph verdict

On capability our agents and Claude for Chrome are even — same reasoning, same honesty, same convergent
tactics. C4C's 9-vs-8 edge is **entirely platform**: a genuine browser fingerprint that clears bot-walls
(M2) and a real persistent session (H3) — neither of which is a smarter agent. So the v2 work that
actually moves Feather's *capability* is platform work, in this order: **(P0) keep the CDP connection
alive through long sessions, (P1) stop looking like a bot, (P2) stop burning warmed logins, (P3) expose
tabs, (P4) give the agent vision + JS-eval fallbacks.** Do those and our already-capable agents finish
the two errands they couldn't here — and stop costing us the sessions they run on.
