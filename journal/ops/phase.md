---
phase: phase-4-visual-desktop-shell
sub_phase: step-0-done-cookie-mine-proven
adr: docs/specs/adr-0007-phase-4-shell-sequencing.md
step: "Phase 4 Step 0 complete (proven by spikes); ADR-0008 CredentialsVault landed (non-accepted); Spike C leakage harness shipped; next is Spike A/B validation"
prior_phase: stabilization-linux-readiness-closed
sessions: ["...phase4-step0-cookie-mine✅", "organize-housekeeping✅(ops)", "credentials-vault-adr-candidate✅", "credentials-vault-leakage-spike✅(docs+plan)", "credentials-vault-spike-c-implementation✅"]
blocking: null
next: "Spike C is done: assertNoSecretLeak + real-Chromium gate shipped; redactUrl now strips query+fragment at TAB_UPDATED and network-summary. ADR-0008 remains non-accepted. NEXT: Spike A (SQLCipher feasibility on Fedora + Node/TS) and Spike B (KeePassXC integration) — both sudo-gated installs → hand to Roi. EVIDENCE to keep honoring: research/2026-06-04-credentials-vault-spike-c-leakage-probe-findings.md (trace leaks off-screen secrets; password fields protect nothing; screenshots = policy not OCR)."
note: "Phase 4 Step 0 done by SPIKING not speccing (ADR-0007: defer seamless low-latency shell to a later dedicated R&D phase; headed-Chromium STOPGAP now; prove Cookie Mine loop first DONE; implementation stack OPEN R&D, not locked). Bot-detection = #1 risk; src/browser/modes.ts has NO anti-detection (attach-don't-launch proven in spikes only). LAST SESSION (organize-housekeeping, ops-only, no feature code): synced dev (was 2 behind origin); built inbox→archive lifecycle (journal/raw/archive/, NOT rnd's competing _processed/) + swept 12 processed files; GRADUATED rnd by cherry-pick not merge → ADR-0006 agent-interface-neutrality now on dev (+ ROADMAP Phase-5 reframe, ADR-0005 cross-ref); deleted stale branches rnd/tmp-check/copilot-dev (ui-playground KEPT as stealth reference); reconciled canonical docs (specs README index 0001-0007 + design specs; README + PROGRESS now say Step 0 done). 6 commits pushed origin/dev. Phase-5 ideas parked: behavioral fidelity, observe-to-learn, detection self-emulation — user-authorized continuity, never stealth/bypass."
---
