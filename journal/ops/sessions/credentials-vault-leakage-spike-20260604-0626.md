# Session — Credentials-Vault ADR + Leakage Spike (planned, not yet built)

- **When:** 2026-06-04, ~06:26
- **Branch:** `dev` (pushed to `origin/dev` @ `4ec2e24`)
- **Type:** ADR authoring + research-driven brainstorm + design/plan. **No implementation code shipped.**

## Done

1. **ADR-0008 — CredentialsVault candidate (🚧 non-accepted)** — `docs/specs/adr-0008-credentials-vault.md`.
   Interface-first, local-first; Feather explicitly NOT a password manager; KeePassXC + SQLCipher
   are **candidates, not selections**; leakage-first hard rule; 3-spike validation gate (C→A/B).
   Indexed in specs README with a CANDIDATE marker (+ reconciled the "Approved-only" header).
   Archived the source intake to `journal/raw/archive/` (inbox 7→6). Commit `b0f869e`.
2. **Spike C brainstormed research-driven**, then **ran a throwaway evidence probe** on a real
   `chromium-headless-shell` session (3 canaries: password POST / URL query / visible text).
   Findings → `research/2026-06-04-credentials-vault-spike-c-leakage-probe-findings.md`. Probe
   deleted after; no secrets retained (synthetic canaries only).
3. **Design spec** `docs/specs/2026-06-04-secret-leakage-harness-design.md` + **implementation
   plan** `docs/plans/2026-06-04-secret-leakage-harness.md` (4 tasks, full TDD, complete code).
   Commits `b14ee8f`, `4ec2e24`.
4. New memory saved: **research-driven, not arrogance-driven**.

## Probe findings (evidence, not priors)

- **`trace.zip` is the worst surface** — leaks secrets never on screen: the `fill()` action
  argument verbatim + the POST body as a resource. Not redactable → off-by-default for credential
  sessions (Phase-5 policy). Handle in the gate by **presence**, not unzip (no new dep).
- **Feather's JSONL session log + `network-summary` leak raw URLs today** (`manager.ts:159`
  `TAB_UPDATED.data.url`; `capture.ts:44,55` `request.url()`). `redactUrl` was **dead code**
  (only its own test imported it) and stripped only `user:pass@`, never query strings.
- **A `type=password` field protects nothing at the data layer** (masking is pixels only).
- **Screenshots leak visually but are text-invisible** → policy (don't screenshot sensitive
  sessions), not OCR.
- Corrected my own prior live: I'd claimed a POST body would leak into `network-summary`; reading
  `capture.ts` proved it records only the URL. Evidence > assertion.

## Decisions

- ADR-0008 stays **non-accepted** until all three spikes clear.
- **Two-tier verdict:** clean-tier (logs/summaries/manifest) hard-fail; capture-tier
  (trace/screenshots) report-only. **Fail-safe tiering** (unknown artifact defaults to clean-tier).
- Trace by **presence**, no unzip, no new dependency. Images = blind spot, policy not OCR.
- **Decision A:** fix the URL leak *inside* Spike C — `redactUrl` now strips **query + fragment**
  (fragment because OAuth implicit tokens ride there) and is applied at the two emission points.
- Spec/plan saved under repo convention (`docs/specs/`, `docs/plans/`), not the skill default.

## Unfinished / Next

- **Execute the plan** `docs/plans/2026-06-04-secret-leakage-harness.md` (Tasks 1→4). Roi was
  about to choose execution mode (**subagent-driven recommended**) at pause. No code written yet.
- **Spikes A (SQLCipher feasibility) + B (KeePassXC integration)** — both have sudo-gated installs
  (hand to Roi: `dnf install` of SQLCipher libs / `keepassxc`).
- Out of scope but noted: `manager.ts:203` openTab return + `getPageInfoList` also surface raw
  URLs into API responses (not file surfaces; not covered by the gate). Follow-up if desired.

## Parked (Phase 5; user-authorized continuity, NOT stealth/bypass)

- Sensitive-session flag + no-trace policy; mediated late credential release.
- Earlier-parked: behavioral fidelity, observe-to-learn, detection self-emulation.

## Roi quotes

- "lets go"
- "i actually like to anderstand what decisions we make i dont like a black box. sometimes you *can* make mistakes."
- "do you think those are the right moves?"
- "remeber we are doing research driven development not arrogant driven"
- "A"
