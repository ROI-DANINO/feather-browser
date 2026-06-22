# v2-wrap meta-analysis — security foundations, what's shipped vs. what's claimed

> What this is: the decision-and-code retrospective for Feather v2's security foundations. It
> shows what was actually shipped to code, what was *proven* vs merely *shipped*, and what remains
> unbuilt — grounded in `file:line` / commit evidence, no live test runs fabricated. Tone follows
> `AGENTS.md` "Testing Honesty": optimize for truth, not green checkmarks; report exactly what
> happened, "I don't know" included.
>
> Branch `v2-wrap` @ `77abccb` (off `dev`). Produced 2026-06-16.

## 1. What "v2 done" means (the bar this wrap measures against)

- **v2 = "It survives the scary sites, safely."** (`docs/roadmap/v2.md:1`) An agent works on
  locked-down, bot-detecting sites (LinkedIn, Instagram, insurance portals) **as the human**, with
  human approval, without getting blocked.
- **The exit test:** create Feather's **own LinkedIn account** (collaborative, human-in-the-loop)
  and operate it un-flagged — "the harder cousin of v1's Instagram test, and the proof that the
  stealth hardening works." (`docs/roadmap/v2.md:59-60`)
- **This test does not exist yet.** Therefore v2 is **not** wrappable as a finished release. This
  document wraps the *foundations* under it.

## 2. Status ledger — every v2 item, classified

Legend: ✅ proven (shipped + demonstrated working) · 🟡 shipped-untested (code in, gates green, not
exercised in real end-use) · ⏳ planned (spec/plan exists, no code) · ❌ unstarted (no code) ·
🧭 decision (an accepted call, not a feature).

| v2 item | Status | Evidence |
|---------|--------|----------|
| **Gate A — capability/safety model (5.0.0)** | ✅ proven | A0 `854b4a8`, A1 `f7afbb8`/`d0e35e4`/`a7db198`; live "mined AND used" on warmed Gmail 2026-06-15 (journal-reported, see §3) |
| **Identity Model (5a)** | 🟡 shipped-untested | `3674d82`+`6a72bc0`; `src/identity/{types,store,manager}.ts`; 399 unit **(re-run live this session ✓)**; not yet run in a real multi-identity agent flow |
| **Human-in-control safety primitives** | ✅ proven | `2c7773a`; banner re-inject + `HUMAN_IN_CONTROL` 409 guard; await-human integration 9/9 (journal); proven live on Hebrew Gmail login |
| **MFA Handler (5b)** | ⏳ planned | spec `docs/specs/2026-06-07-mfa-handler-design.md` + 14-task plan; **no `src/mfa`** |
| **Stealth Stack (5d)** | ⏳ planned | spec `docs/specs/2026-06-07-stealth-stack-plan.md` (12 tasks); **no `src/browser/stealth.ts`**; deliberately last |
| **MCP & tool-surface reconciliation (5.0.1)** | ❌ unstarted | `ROADMAP.md:147-149` "future"; deferred pending MCP spec stability |
| **First-agent safety gate / Gate B (5.0.2)** | ❌ unstarted | `ROADMAP.md:149` "future"; credential-at-rest posture before any warmed-profile agent act |
| **Warmed-profile CDP attach (5c)** | ❌ unstarted | `ROADMAP.md:170-177`; needs Gate A grant + auto-revoke on MFA per ADR-0010 |
| **Learn-your-behavior (kinematic input)** | ❌ unstarted | `docs/roadmap/v2.md:43-44`; spike-first, research-only so far |
| **Active anti-bot self-detection** | ❌ unstarted | `docs/roadmap/v2.md:45-46` |
| **Teach-a-workflow / action cache** | ❌ unstarted | `docs/roadmap/v2.md:47-48`; Maxun DSL reference-only (AGPL) |
| **Headless warmed sessions** | ❌ unstarted | `docs/roadmap/v2.md:50-53`; floats between 5a/5c |

**Underlying decisions that shape the above:**

| Decision | Evidence |
|----------|----------|
| 🧭 **ADR-0010** capability-grant model is the v2 spine (3 privilege tiers; human-approved, single-use, TTL'd, audited, auto-revoked grants; off by default) — ACCEPTED 2026-06-11 | `docs/specs/adr-0010-local-control-plane-capability-model.md:1-10` |
| 🧭 **Security-first re-sequencing** (2026-06-07 council): Stealth moved from 5a to **LAST**. Two dependency breaks make it possible — the **session-hold primitive** removes MFA's dependency on Stealth, and **opaque/versioned policy refs** let Identity be self-contained and go first | `ROADMAP.md:63-79` |
| 🧭 **Credential-leak triage** (Roi ACCEPT): real test creds in pushed history; **no** history rewrite / force-push; IG password is a unique throwaway, redacted to `[REDACTED-PW]` in-tree; rotation deferred to 5d as a stealth probe | `journal/context/active.md:20-27`; `c830bcb` |
| 🧭 **niri viewport finding**: `--window-size` ignored under the tiling WM; durable fix (CDP `setDeviceMetricsOverride`) deferred to 5d; niri float-rule is the user-side workaround | `journal/context/active.md:31-35` |

## 3. The honest nuances behind "proven"

Gate A is real and works — *and* the word "proven" carries caveats that the testing-honesty bar
requires stating:

1. **Only one dangerous door is actually live.** `CapabilityName` defines three —
   `cdp-attach | vault-unlock | cookie-export` (`src/capability/grants.ts:15`) — but only
   **cookie-export** has an implementation and route. The other two are enum names with empty
   doors. The *gate* is general; the *doors* are mostly not built yet.
2. **The "77 cookies mined AND used" proof is journal-reported, not CI.** It was a manual
   3-terminal test on a warmed Gmail session 2026-06-15 (`journal/context/active.md:87-88`); the
   proof screenshot is local and **not git-tracked** (its path appears only in session notes, not
   named in the journal), so it can't be re-inspected from the repo. The narrative is consistent across journal entries, but it is an
   attestation, not a committed artifact.
3. **Grants are in-memory.** A server restart wipes all holds/grants (`src/capability/service.ts`
   constructor — no persistence); only the append-only audit JSONL survives. The control plane is
   not durable across restarts by design.
4. **Detection ≠ blocking.** Google sent a security-alert email for the new login but did **not**
   invalidate the warmed session (`journal/context/active.md:87-88`). That is a data point *for*
   5d stealth — **not** evidence that Feather is stealthy. It means the cookie reuse worked *this
   once*, on a warm session, under observation.
5. **Most integration counts are journal/commit-reported, not re-run here.** Gate A's 7 integration
   + 21 unit cases, identity's 4/4, the full 96/96 (with one pre-existing niri red), and
   await-human's 9/9 all come from the journal and commit messages. They were **not** re-executed
   this session (they need a headed browser; the niri red is known and unrelated).
6. **What I *did* re-run live this session (2026-06-16):** `tsc --noEmit` → clean; `vitest` unit →
   **399 passed / 399** across 62 files. This matches the journal's "399 unit" exactly — verified,
   not inflated. (Note: commit `2c7773a` reported "366 unit" — that was the count *before* 5a;
   5a's tests took it to 399. Don't conflate the two.)

## 4. Distance to the exit test (what is NOT yet true)

v2 "done" = an un-flagged LinkedIn account. Between today and that:

- **5b MFA** (planned, no code) — needed to clear login challenges as the human.
- **5c warmed-profile CDP attach** (unstarted) — needed for agents to drive the warmed profile.
- **5d Stealth** (planned, no code) — the actual anti-detection layer; the LinkedIn test *is* its
  proof. Also carries the deferred credential rotation and the niri viewport durable fix.
- **Behavioral research** — the kinematic-input spike (research-only) gates learn-your-behavior.
- **The test itself** — never attempted.

That is roughly **4–5 roadmap phases plus a research cycle**. No velocity estimate is offered:
prior phases ran at widely varying paces and MFA/Stealth/behavioral build times are genuinely
unknown. Calling this "almost done" would be dishonest; the foundation is in, the superstructure
is not.

## 5. Forward items, ranked (what the next sessions pick up)

Mirrors the v1-wrap §4 convention: ★ = do next (unblocked) · ◇ = deferred, with the reason.

- ★ **5b — MFA Handler.** The one unblocked build. Spec + 14-task TDD plan ready; it **consumes
  the session-hold primitive already shipped in Gate A** (creates an `mfa` hold rather than
  toggling stealth — `docs/specs/2026-06-07-mfa-handler-plan.md`). Start here.
- ◇ **Identity hardening.** Exercise 5a under a real multi-identity agent flow and profile-lock
  contention — both currently untested (§2, 🟡). Cheap, high-value de-risking before 5c.
- ◇ **5.0.1 — MCP & tool-surface reconciliation.** Deferred pending MCP spec stability; this is
  what gates exposing an agent-facing tool surface at all.
- ◇ **5.0.2 — Gate B (first-agent safety gate).** Credential-at-rest posture + leakage harness
  before any agent acts inside a warmed profile.
- ◇ **5c — Warmed-profile CDP attach.** Needs Gate A grant + auto-revoke-on-MFA wired.
- ◇ **5d — Stealth Stack.** Last by design (most complex/breakable). Bundles the credential
  rotation stealth-probe and the niri viewport durable fix.

## 6. Corrected verdict

v2's security **spine is real and partially proven**: the capability gate works end-to-end on a
hard target (Google warmed Gmail), Identity is shipped with green gates, and the human-in-control
primitives are live. But **v2 as a release is roughly half-built** — the foundation (gate +
identity + pause/resume safety) stands; the stealth / MFA / CDP-attach superstructure and the
LinkedIn exit test do **not** exist. This wrap **closes the foundations chapter and hands off to
5b**. It does not declare v2 done, because it isn't.

---

### Provenance

- **Branch / commit:** `v2-wrap` @ `77abccb` (branched off `dev`, in sync with `origin/dev`).
- **Evidence:** 5-agent read-only sweep of `docs/roadmap/`, `journal/`, `docs/specs/`, `src/`;
  every cited commit + source file independently confirmed to exist on this branch.
- **Re-run live 2026-06-16:** `tsc --noEmit` clean; `vitest` unit 399/399 (62 files). All other
  test counts are journal/commit-reported and labelled as such.
- **Standard:** `AGENTS.md` → "Testing Honesty — Objective, Not Flattering". Failures, partials,
  and "journal-reported, not re-verified" are first-class, not hidden.
- **Not done here:** no integration suite re-run, no live v2 task attempt, no fabricated artifacts.
