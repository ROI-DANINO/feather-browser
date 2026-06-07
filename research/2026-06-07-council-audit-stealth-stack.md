# Council Audit: Stealth Stack Design + Plan

**Date:** 2026-06-07
**Event:** Multi-agent council review of `docs/specs/2026-06-07-stealth-stack-{design,plan}.md`
**Providers queried:** Claude CLI (**Opus 4.8**), Gemini CLI (gemini-3.1-pro-preview),
Gemini API (quota-exceeded — no response), Codex/GPT-4o (CLI error — no response)
**Method:** `claude-council:ask`, detailed verbosity, both spec + plan attached as context.

> Two of four providers returned. Both that did (Opus, Gemini CLI) are strong and **highly
> convergent** — the consensus below is robust despite the two failures.

---

## Consensus (both providers, independently)

1. **Feather's stealth IS its architecture, not `stealth.ts`.** The real anti-detection power is the
   pre-existing decision to attach to *real headful system Chromium on the user's real IP* — genuine
   TLS/JA3/JA4, HTTP/2 fingerprint, real GPU/fonts, residential IP, IP-matched locale. The four
   "layers" are mostly *assertions that this is intact*, not new defenses. Honest framing matters:
   it's "one big structural win + consistency checks + one weak behavioral tweak."

2. **Layer 3 (behavioral timing) is the weak point — borderline security theater.** A uniform
   `[50,150]ms` sleep *before* a Playwright `click()` that teleports the cursor and fires instantly
   is *not* human behavior — possibly a worse signal than a fast click. "Secure Mode is just Fast
   Mode that takes 100ms longer to trigger a ban" (Gemini CLI).

3. **HIGHEST-VALUE MISSING THING: human-kinematic input synthesis.** Abandon native `click()`/`type()`
   in secure mode; synthesize bezier mouse trajectories (overshoot, gravity, variable speed, not
   dead-center targets) + statistically-modeled keystroke cadence (bursts, typo micro-pauses). This
   requires a **cursor-position model**, which `loc.click()` hides — so `withStealthTiming` wrapping
   `loc.click()` is structurally the wrong shape; Layer 3 must own input synthesis, not just delay.

4. **CUT the font guard (`FONT_GUARD_INIT`, Task 6) — unanimous, emphatic.** It (a) contradicts
   decision #3 (it IS spoofing), (b) monkeypatches a native function so `document.fonts.check.toString()`
   no longer returns `[native code]` — a loud, detectable bot tell that CF Turnstile / DataDome
   actively probe, and (c) defends a non-existent problem (a real Linux desktop already enumerates a
   realistic non-empty font set). Keep the SwiftShader/WebGL verification; delete the font guard.

5. **Mid-session navigation gap + immutability flaw — both flagged.** Launch on `google.com` → fast
   mode → agent navigates/clicks to `linkedin.com` → session is now on Tier C but permanently locked
   to fast → triggers detection, burns the session's cookies/identity. The launch-time `url` gate
   (Task 9) is trivially bypassed by normal navigation, and immutability (#5) means the only recovery
   is teardown+relaunch, which destroys the state the future MFA handler exists to preserve.

6. **Decisions #2, #3, #4 are correct** (not rationalizing away work). #4 (env = check, not spoof) is
   the best-reasoned decision in the doc — spoofing locale/timezone without a geo-proxy *introduces*
   the IP-mismatch tell it's avoiding. #3's principle is right (Task 6 font guard violates it — see #4
   above). #2's chicken-and-egg argument is sound.

---

## Divergence / unique insights

**Opus — invert the default (boldest recommendation):** Make **secure the default**, `fast` an
explicit opt-out. Secure costs only a launch-time check + ~100ms/action — negligible for most agent
tasks. This **deletes the entire classification-as-gate apparatus**: `StealthUpgradeRecommendedError`,
the route special-case, the `url` launch param, the soft-block, auto-upgrade branching — *and* removes
the mid-nav bypass hole entirely (if always secure, there's no gap to fall through). Keep `classifySite`
only as an *observability* label, not a control-flow gate.

**Gemini CLI — keep two modes, gate at the navigation layer:** Add Tier-C gating to `NavigateHandler`
(and cross-origin clicks): if the session is fast and navigates to a Tier C domain, throw the same
`STEALTH_UPGRADE_RECOMMENDED` soft-block. Solves the mid-nav gap within the two-mode model.

> These are two philosophies for the same flaw. Opus dissolves it (always secure); Gemini contains it
> (gate every boundary). Opus's deletes the most code.

**Opus-only, also valuable:**
- **Mutable-but-monotonic mode** (escalate fast→secure, never downgrade) as the #5 fix if two modes
  are kept — keeps "no surprise oscillation" while unblocking the MFA handler (a captcha in fast mode
  IS the signal to escalate; immutability forbids the natural recovery). Cheap now, expensive to
  retrofit after `session.stealthMode` is consumed `readonly` by two downstream features.
- **`webdriver === false` + `Runtime.enable` absent as HARD self-test assertions** (Task 11). Cheapest,
  most fundamental tells; currently unverified. One line, load-bearing.
- **Model "needs human decision" as a first-class result type** (`{ status: "needs-confirmation", … }`),
  not a thrown exception — the MFA handler has the same "expected pause" shape and will copy whatever
  Stealth does. Don't bake control-flow-by-exception into two features.
- **`applyStealthCDP` empty-fn + its unit test is ceremony** — testing that an empty function is empty
  can't fail for a reason you care about. Keep the grep audit + the `Runtime.enable` self-test; demote
  the function to a documented seam.
- **Keep passive header observation in v1** (record CF/DataDome presence, don't gate on it): the domain
  list is structurally blind to the long tail behind CF/DataDome (they're *vendors*, behind millions of
  domains), so observation is the only thing that makes the classifier improve over time.

**Gemini-CLI-only:** add an explicit backlog **spike task for kinematic mouse/typing synthesis** before
tackling the Identity model.

---

## Failures (recorded honestly)

- **Gemini API**: free-tier quota exhausted (`limit: 0`). No response.
- **Codex / GPT-4o**: CLI errored reading stdin; also note it ran `gpt-4o` (not a reasoning model), so
  even on success its weight would be lower than the two reasoning models that did respond.

---

## Net takeaway

The plan does jobs (1) "keep the architecture's tells from leaking" and (2) "verify they haven't"
well, but **mislabels them as stealth layers, largely skips (3) "add human-shaped input" — the one
thing the architecture can't give for free — and wraps everything in a classification/soft-block
apparatus that a secure-by-default posture would let us delete.** Two open product decisions for Roi:
**(A)** behavioral-realism scope (build kinematic input now / spike-first / defer + downgrade claim),
and **(B)** mode model (secure-by-default per Opus vs two-mode + nav-layer gating per Gemini).
