# Event Log

Format: `YYYY-MM-DD | ACTION | source -> target | note`. One line per entry, hard-capped ≤140
chars — full detail lives in the linked artifact (STOP→`ops/sessions/`; BUILD/DECISION→commit/ADR).
On each phase transition (or >40 lines), pre-current-phase entries collapse into
`journal/ops/archive/log-archive.md`. Hot log holds only the current phase (Phase 4).

Pre–Phase 4 history (Phases 0–3): `journal/ops/archive/log-archive.md`.

---

2026-06-04 | STOP | -> ops/sessions/phase4-step0-cookie-mine-20260604-0139.md | Phase 4 Step 0 done; Cookie Mine + attach-CDP proven
2026-06-04 | STOP | -> ops/sessions/organize-housekeeping-20260604-0535.md | Ops: inbox->archive; rnd->ADR-0006; docs reconciled
2026-06-04 | DOC | raw/_inbox -> docs/specs/adr-0008-credentials-vault.md | CredentialsVault candidate (non-accepted); 3-spike gate C→A/B
2026-06-04 | STOP | -> ops/sessions/credentials-vault-leakage-spike-20260604-0626.md | ADR-0008 landed; Spike C probed+spec'd+planned
2026-06-04 | SHIP | secret-leakage-harness -> src+tests | Spike C shipped: assertNoSecretLeak + Chromium gate; redactUrl strips query/frag
2026-06-04 | STOP | -> ops/sessions/token-diet-prune-20260604-0929.md | Token-diet §8 done: ~15.6k->~7.6k hot tok; next=/init reshape
2026-06-04 | STOP | -> ops/sessions/token-diet-finish-20260604-1034.md | Token diet done: .remember lobotomy + ROADMAP collapse; pre-shell seq locked; ~5037->~3635 tok

2026-06-04 | STOP | -> ops/sessions/storage-isolation-plan-20260604-1101.md | Storage-isolation spec+plan landed (XDG split); .remember lobotomy verified (needs full restart); blog 0007
2026-06-04 | NEXT | -> journal/context/next.md | /next command designed + implemented; all 8 files updated
2026-06-04 | NEXT | -> journal/context/next.md | storage-isolation XDG fix shipped (6 commits, pushed dev); pre-shell Task #2 is next
2026-06-04 | NEXT | -> journal/context/next.md | attach-don't-launch spec+plan written; Task #2 ready to execute
2026-06-04 | NEXT | -> journal/context/next.md | attach-don't-launch (Task #2) fully executed; 167+35 tests green; PR #1 created (dev->master)
2026-06-04 | NEXT | -> journal/context/next.md | cookie-jar isolation fork + Phase-5 sequencing note; /next now updates trackers; Task #3 blocked on sudo chromium
2026-06-04 | SHIP | dev e85ace2..8884e7a | Overnight autonomous: pre-shell #3 (FEATHER_CHROMIUM_PATH) + #5 (DebugCapture wiring) shipped + 2 storage-isolation cleanups; 175u+37i+4m green, tsc clean; next substantive = #4 warmed Google session (needs Roi login + cookie-isolation spike)
2026-06-04 | STOP | -> ops/sessions/overnight-observability-chromiumpath-20260604-1408.md | Pre-shell #3+#5 + cleanups shipped (dev e85ace2..8884e7a); NEXT SESSION = Roi reviews this work first, then #4

2026-06-04 | NEXT | -> journal/context/next.md | Ritual desk-context timing fix + .remember plugin cleaned (dir+tracked file+stop steps); changes uncommitted; review-first still owed
2026-06-04 | STOP | -> ops/sessions/warm-google-session-pre-shell-4-20260604-2307.md | Pre-shell #4 DONE+verified (warm-session tool; real Google passkey login survives restart, un-flagged); overnight commits reviewed (approve); inbox processed; credentials-in-jar boundary recorded; blog 0008. Pushed dev cbdeef9..b9528c4. NEXT = master merge-readiness (dev 110 ahead; PR #1 open)

2026-06-04 | NEXT | -> journal/context/next.md | Full verification pass GREEN (175u+37i+4m, tsc 0, prod-audit 0); dev=stable milestone; 111-commit delta coherent; merge of PR #1 is Roi's call (held)

2026-06-04 | NEXT | -> journal/context/next.md | CI added (GitHub Actions); first run RED surfaced hardcoded-Wayland spawnAndConnect bug; env-gated 2 headed tests -> CI GREEN (175u + 35i +2 skip); docs corrected; ozone-platform fix tracked post-merge; PR #1 MERGEABLE + verify SUCCESS

2026-06-04 | MILESTONE | PR #1 MERGED dev->master (e39d167) | Stable graduation: Phase 3 + S1-S3 + pre-shell #1-5 + CI green; merge commit; next = post-merge tech-debt (ozone-platform, vitest 2->4) then pre-shell #6

2026-06-05 | PLAN | docs/specs/2026-06-05-autonomous-research-run-design.md + docs/plans/2026-06-05-autonomous-research-run.md (60d361a, 4a7ea10) | Brainstormed + wrote unattended autonomous-run spec+plan (Ratchet; scratch-only; research-driven). READY; awaiting Roi: warm scratch w/ passkey then say go in a fresh session.
2026-06-05 | NEXT | -> journal/context/next.md | Kickoff prep: scratch warm-up steps + ready-to-paste prompt for the unattended run saved; next session = warm scratch then paste & execute the plan.
2026-06-05 | NEXT | -> journal/context/next.md | scratch warmed + persistence-verified (password-only; throwaway confirmed); run DEFERRED to fresh session; findings: this box can't make a local passkey + passkey->DBSC was unverified -> spike must MEASURE DBSC first
2026-06-05 | RUN | dev 877d02a..2bbddca (13 commits) -> ops/sessions/autonomous-research-run-20260605.md | Autonomous research run COMPLETE, all 4 workstreams, CI green. ① ozone-platform configurable + un-gated 2 headed tests (CI 36+1; --no-sandbox/headless for display-less; snap-chromium + stale-assertion findings). ② live scratch spikes: cookie-isolation (scratch NOT DBSC-bound; clone survived + no session-theft), pre-shell #6 Cookie Mine loop CLOSED (ADR-0007 gate cleared -> GUI can begin), anti-detection (headless trivially detectable: HeadlessChrome UA + SwiftShader -> headed/Xvfb only). ③ warm-session password-manager-disable shipped + verified on scratch; vitest ^2->^4 (audit 0). ④ ADR-0009 shell-stack (GTK4+Casilda rec; joint call), GUI sketch, behavioral-fidelity design. Primary NEVER touched. 184u+37i+4m green. Joint calls teed up for Roi.
2026-06-05 | NEXT | -> journal/context/next.md | /next bridge after the autonomous run: all 4 workstreams done + pushed (dev==origin eab8246), tree clean; fresh session = /start then the joint-call session (shell stack -> Phase-4 GUI).
2026-06-05 | NEXT | -> journal/context/next.md | Inbox processed (4 notes -> empty): positioning -> docs/public-positioning.md, composio -> memory, security-risks -> absorbed, branching -> git-worktree workflow in AGENTS.md (one chat per worktree for token/context efficiency). Committed 43933fc. Joint-call decisions still open.
2026-06-05 | STOP | -> ops/sessions/inbox-processing-worktree-workflow-20260605-1714.md | Inbox processed -> empty (positioning -> docs/public-positioning.md; composio -> memory; security-risks absorbed; branching -> git-worktree workflow in AGENTS.md). Adopted worktree-per-workstream (one chat per worktree; create as-needed). Product desk + positioning recorded. next.md folded & cleared. NEXT = shell-stack joint call (ADR-0009 + Casilda+Chromium spike) -> Phase-4 GUI.
2026-06-05 | NEXT | -> journal/context/next.md | Core-first reorientation: caught shell-focus contradicts positioning -> pivot to Feather Core adoptability (LinkedIn debut). Brainstormed approach B; spec 09653f6 + plan 82591ed landed. Found doc bugs (no :3000; token=control-token). Phase 4 splits 4a (Core)->4b (shell). Execute plan in fresh chat.
2026-06-05 | SHIP | dev -> README + examples/quickstart.sh + ROADMAP + steering | Phase 4a Core open-source readiness: artifact-forward README (fixed :3000 + .feather/token doc bugs), verified runnable demo (full session loop), Core-vs-Shell roadmap split; shell-stack resequenced to 4b. Spec+plan landed.
2026-06-05 | STOP | -> ops/sessions/core-first-execution-20260605-1853.md | Phase 4a EXECUTED via subagent-driven-development (7 commits 8d42aab..16f5ab7, pushed 387d601..16f5ab7) + double-reviewed (spec then quality) per task; final holistic review READY TO SHIP (5/5 acceptance criteria). Public README + demo LIVE on default branch dev (no master merge needed for debut). 184u + tsc 0 + demo green. Blog 0009 written. next.md folded & deleted. NEXT (Roi) = merge dev->master (dev verified stable) -> then LinkedIn debut polish (separate session) -> then Phase 4b shell.
2026-06-06 | NEXT | -> journal/context/next.md | Anchor Browser product-reference research (autonomous): primary-source pass + ground-truth SDK probe (anchorbrowser@0.16.3 in throwaway worktree, nothing run). 2 reports -> research/2026-06-06-anchor-browser-*.md; merged dev (ff c5d68ba..30cccb3), pushed origin/dev, crash branch deleted. Research-only, no src/. Findings: marketing>>docs; arch = CDP-over-WS + Playwright (== our spawnAndConnect); identity model = Cookie-Mine parallel; 12X/80X/23X unverified. Report §12 = 5 open Qs for Roi. Master-merge trajectory unchanged.
