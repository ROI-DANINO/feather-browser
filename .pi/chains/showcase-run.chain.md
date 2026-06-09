---
name: showcase-run
package: feather
description: Build, review, and validate the Feather showcase suite (examples/showcase.sh). Determinate codegen pipeline; live operator runs are separate Roi-gated invocations.
---

## planner
phase: Planning
label: Confirm scope from the showcase plan
as: plan

Read docs/specs/2026-06-09-showcase-eval-suite-plan.md and confirm the implementation scope for: {task}

Return the exact files to touch (examples/showcase.sh, examples/showcase-output/, docs/*), ordered steps, and the validation commands. Do not edit files.

## feather.coder
phase: Implementation
label: Build examples/showcase.sh
as: implementation

Implement the showcase suite per the plan and the scope below. Make the smallest safe diff. Do not commit. Report files changed and how to test.

Task: {task}

Plan: {outputs.plan}

## feather.opus-reviewer
phase: Review
label: Review the suite implementation
as: review

Review the implementation against the plan for correctness, scope, safety, and Testing Honesty (PASS/PARTIAL/FAIL kept honest; fragile-on-purpose tasks not sanded). Return Decision: proceed/change/stop. Do not edit files.

Task: {task}

Plan: {outputs.plan}

Implementation: {outputs.implementation}

## feather.validator
phase: Validation
label: Run the headless tiers

Run only the approved showcase commands (./examples/showcase.sh easy && ./examples/showcase.sh medium). Report exact PASS/PARTIAL/FAIL per task with the lesson. Do not fix.

Task: {task}

Plan: {outputs.plan}

Implementation: {outputs.implementation}

Review: {outputs.review}
