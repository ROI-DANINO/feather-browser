---
phase: v1-ship-and-adopt
sub_phase: reoriented-2026-06-24-target-hybrid-personal-to-narrow-OSS-stealth-CUT
adr: docs/specs/adr-0010-local-control-plane-capability-model.md
plan_of_record: docs/specs/2026-06-24-reorientation-and-roadmap-restructure.md
prior_phase: stealth-5d-PARKED-2026-06-24-reorientation
order: HARDEN-first-then-OSS-envelope-then-NEW-stronger-demo-LAST  # Roi 2026-06-24 /stop
done: PHASE-3-SHOW-IT-OFF-SHIPPED-2026-06-24-commits-4e0ad81..8aedbbe-pushed  # hero demo v2 await-human banner handoff (visible on camera) + feather.md per-version done-lines; live gate PASS-narrowed; demo-hero-mfa.mp4. Phases 0-3 COMPLETE. (Phase 2 was 5c5f0fa..182b4e0; Phase 1 was 06cd2e8)
next_direction: BOT-GYMNASIUM-self-hosted-sandbox-2026-06-24  # Roi's own arena/detectors/bots; NOT evasion on real sites. Goals = learning/portfolio/job/joy, not commercial. One-harness: iroh-philosophy->White-Lotus->fable/iroh-brain->Feather-as-DRIVEN-body (integrate by driving, never merge). Capture: docs/specs/2026-06-24-gymnasium-and-harness-vision.md. Memories: feather-gymnasium-direction + the-harness-shape.
gym_step1: BUILT-AND-SHIPPED-2026-06-26-commits-...-5e2f037  # top-level gym/ drives Feather over HTTP only (never imports src/): classify.ts pure+tested ("no score=FAIL") + behavioral.ts (headed drive of bot.incolumitas -> parse snapshot score -> verdict -> screenshot + results.md row) + npm run gym:behavioral. First live run UNSCORED->FAIL (genuine, field-verified vs src/). Design docs/specs/2026-06-26-gym-step1-behavioral-diagnostic-design.md. 476/476, pushed origin/dev.
mouse_motion: BUILT-VERIFIED-PREMISE-DEBUNKED-2026-06-27-commits-fbea1d7..0576723-on-dev-NOT-pushed  # mouse-path.ts pure tunable curved+var-velocity generator + boundingBox on Actionable + MoveHandler + POST /v1/sessions/:id/move (target XOR x,y) + gym wander/trial-log. TDD subagent-driven, final review READY-TO-MERGE, live /move smoke PASS. BUT live gym still UNSCORED -> systematic-debugging: bot.incolumitas behavioral score is SERVER-SIDE on abs.incolumitas.com which is FULLY DOWN (502 on /lib.js,/get,/classify,/store2); independent probe proved Feather DELIVERS 156 trusted mousemove events -> "no cursor path" (5d.2) was a MISDIAGNOSIS. Shipped gym BLOCKED state (detector-down != bot-FAIL, timeout-guarded health probe) + corrected results.md. rd-verify PASS, 491 green. Design docs/specs/2026-06-26-gym-mouse-motion-design.md, plan docs/plans/2026-06-26-gym-mouse-motion.md.
blocking: none-NEXT=(1)validate-BLOCKED-live-abs-down-NOW-needs-headed (2)retry-real-score-when-abs.incolumitas-recovers (3)STEP-2-fable-evals-scoreboard-thin-HTTP-not-merge  # PARKED behind pivot: real-account-2FA-take. Note: fbea1d7..0576723 NOT pushed.
# Machine pointer only. Current state + next action live in journal/context/active.md.
# Current-phase task checklist lives in journal/ops/tasks.md. Plan of record + roadmap restructure
# live in docs/specs/2026-06-24-reorientation-and-roadmap-restructure.md. Stealth (5d) is CUT/parked.
# Rule: no session ships code for a phase ahead of this pointer without first updating this pointer.
---
