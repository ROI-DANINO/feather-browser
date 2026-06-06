# Hero Demo Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a site-specific headed demo script that drives ChatGPT to Gmail through Feather's HTTP API without exposing cookies to git.

**Architecture:** Add a TypeScript script under `scripts/demo/` plus focused unit tests for endpoint discovery, API envelope handling, and safe demo text construction. The live site behavior is verified manually against the warmed `primary` profile.

**Tech Stack:** TypeScript, Node.js 20, Feather HTTP API, Vitest.

---

### Task 1: Add Tested Demo Helpers

**Files:**
- Create: `scripts/demo/hero-chatgpt-gmail.ts`
- Create: `tests/unit/scripts/hero-chatgpt-gmail.test.ts`

- [ ] Write failing unit tests for endpoint discovery, API envelope error handling, and draft body construction.
- [ ] Run the focused tests and confirm they fail because the helper module does not exist.
- [ ] Add helper exports to `scripts/demo/hero-chatgpt-gmail.ts`.
- [ ] Re-run the focused tests and confirm they pass.

### Task 2: Add the Live Workflow

**Files:**
- Modify: `scripts/demo/hero-chatgpt-gmail.ts`

- [ ] Implement an API client that reads `endpoint.json` and sends `X-Feather-Token`.
- [ ] Implement candidate-target helpers that try several Feather `Target` descriptors for ChatGPT and Gmail selectors.
- [ ] Launch `workspaceId:"primary"` with `profile.kind:"persistent"` and `browserMode:"chromium-headed-cdp"`.
- [ ] Drive ChatGPT: navigate, preflight prompt availability, type `hello world`, submit, wait for the final assistant response to stabilize, and extract it.
- [ ] Drive Gmail: navigate, preflight compose availability, open compose, fill recipient, fill subject, fill body, and stop without sending.

### Task 3: Verify and Record Safety

**Files:**
- Modify: `journal/context/active.md`
- Modify: `journal/ops/tasks.md`
- Modify: `journal/log.md`

- [ ] Run focused unit tests.
- [ ] Run `npm run typecheck`.
- [ ] Run the live script against the warmed profile and inspect the visible draft.
- [ ] Confirm `git status --short --ignored` does not show cookie/profile files in the repo.
- [ ] Update state files with the result and next recording step.

