# pi_agency ⇄ Feather Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give feather-browser a thin, project-local `.pi/` so Roi's pi_agency agent team can drive Feather and run the showcase suite — scoped to this repo only, with an explicit skills allowlist, against fresh sacrificial accounts.

**Architecture:** Author four project-scoped Pi agents (`feather.coder`, `feather.validator`, `feather.opus-reviewer`, `feather.operator`), one thin operator skill, one build/review/validate chain, and a minimal project `settings.json` — all under `feather-browser/.pi/`. Force project scope (create `scope:project`, run `agentScope:project`) and `inheritSkills:false` + explicit `skills:` so nothing global/distrusted leaks in. Then rebuild a fresh `scratch` profile and have the operator create+warm new throwaway Google/Instagram accounts (the first autonomous op) behind a VPN/proxy, before handing off to the showcase plan.

**Tech Stack:** Pi CLI + `pi-subagents` v0.28.0 (tool name `subagent`); Markdown agent/chain/skill files with YAML frontmatter; Feather HTTP API; `curl`/`node`/`bash`. No new deps.

**Spec:** `docs/specs/2026-06-09-pi-agency-feather-integration-design.md` (Approved 2026-06-09).

---

## Executor & ownership (read first — this plan has mixed executors)

- **Phase 1–2 (config + structural verify):** Claude Code authors the files and runs the file-level checks.
- **Phase 2 live verify + Phase 3 + Phase 4:** run **inside Pi** (the pi team) and/or by **Roi** — they need the running Pi harness, a display, account access, and destructive/account approvals. Commands for these are written precisely so whoever runs them has zero guesswork.
- **Roi human gates (mandatory):** (a) the destructive `scratch` rebuild, (b) each account-creation attempt (SMS/CAPTCHA), (c) the Pass-1 verdict and any commit/push.

**Testing honesty (repo law — `AGENTS.md`):** Config tasks are verified by Pi's own discovery (`subagent list/get`), not faked. Live tasks (account setup, the loop proof) are verified by *running them* and recording the exact `PASS`/`PARTIAL`/`FAIL` + lesson. A clean failure with its lesson recorded is a success, not a black mark — do not sand a hard task into an easy one for a green row.

---

## Grounding facts (verified against source 2026-06-09 — do not re-derive)

- **Discovery & scope** (`pi-subagents/src/agents/agents.ts`): the nearest ancestor of cwd containing `.pi/` is the project root (`:242`); project agents load from `<root>/.pi/agents/*.md` (`:788`), chains from `<root>/.pi/chains/*.chain.md` (`:803`), skills from `<root>/.pi/skills/<name>/SKILL.md` (`:320`), settings from `<root>/.pi/settings.json` (`:258`). Any `.md` in the dir is parsed by frontmatter (filename need not equal runtime name; runtime name = `package.name`).
- **Scope is forced in two places** (`schemas.ts`): create with `config.scope:"project"` (`:253`); run with `agentScope:"project"` (`:271`). Selecting `project` excludes the user team (`agents.ts:828-829`).
- **Skills allowlist** (`schemas.ts:253`, `agent-management.ts:261-264`): agent frontmatter `skills:` (comma-separated) + `inheritSkills:false` ⇒ the agent resolves **only** the listed skills.
- **Tool/commands** (`extension/index.ts:388`): tool name is `subagent`. Management: `{action:"list", agentScope:"project"}` (`agent-management.ts:456` `handleList`), `{action:"get", agent:"<name>"}`, `{action:"create"/"update"/"delete"}`. Interactive list: `/agents` slash command. Run an agent: `{agent:"feather.operator", task:"...", agentScope:"project"}`; run a chain: `{chain:[...]}` or by chain name.
- **Feather endpoint discovery** (`examples/quickstart.sh:14-57`): `endpoint.json` → `baseUrl` + `tokenFile` (read via `node`); auth header `X-Feather-Token`; envelope `{ ok, data | error }`.
- **Feather per-session proxy** (`src/transport/routes.ts:32`): `POST /v1/sessions` body accepts `proxy: { server, username?, password?, bypass? }`.
- **Warmed headed launch** (`src/sessions/manager.ts:85-87`): `{"profile":{"kind":"persistent"},"workspaceId":"scratch","browserMode":"chromium-headed-cdp"}`; one session per profile (409 `PROFILE_LOCKED` otherwise).
- **Scratch profile dir** (`src/fs-layout.ts:16-17`): `~/.local/share/feather/profiles/scratch/` (holds `profile/`, `workspace.json`, `lock`). It currently holds the old `feather_test_roi` IG + warmed Google — **rebuilding wipes those on purpose.**

---

## File Structure

```
feather-browser/.pi/
  settings.json                       # minimal; NO skills array, NO project packages
  agents/
    coder.md                          # feather.coder  (builds showcase.sh)
    validator.md                      # feather.validator (runs tiers, honest reporting)
    opus-reviewer.md                  # feather.opus-reviewer (go/no-go)
    operator.md                       # feather.operator (drives Feather live)
  chains/
    showcase-run.chain.md             # feather.showcase-run (build → review → validate)
  skills/
    feather-operator/SKILL.md         # the only resolvable skill in this project
```

All four agents: `package: feather`, `inheritProjectContext: true`, `inheritSkills: false`, `systemPromptMode: replace`, `scope: project` (by living in `.pi/agents`). Driver/coder/validator/reviewer carry `skills: feather-operator`.

---

## Phase 1 — Author the `.pi/` config (Claude Code)

### Task 1.1: Project settings (no skills, no packages)

**Files:** Create `.pi/settings.json`

- [ ] **Step 1: Create the file**

```json
{
  "subagents": {
    "agentOverrides": {}
  }
}
```

- [ ] **Step 2: Verify it has no `skills`/`packages` keys**

Run:
```bash
node -e 'const s=require("./.pi/settings.json"); if(s.skills||s.packages){console.error("LEAK: project settings must not enable skills/packages");process.exit(1)} console.log("settings OK — no skills/packages")'
```
Expected: `settings OK — no skills/packages`.

- [ ] **Step 3: Commit**

```bash
git add .pi/settings.json
git commit -m "feat(pi): project-local Pi settings (no skills/packages — trust wall)"
```

### Task 1.2: `feather.operator` skill (the only allowlisted skill)

**Files:** Create `.pi/skills/feather-operator/SKILL.md`

- [ ] **Step 1: Create the skill**

```markdown
---
name: feather-operator
description: How to drive Feather Browser over its local HTTP API — endpoint discovery, the golden loop, element targeting, sessions/profiles, honest result reporting. Use for any task that operates a browser through Feather.
---

# Feather Operator

Drive Feather over its local HTTP API. Full reference lives in this repo:
`docs/agent-playbook.md` and `skills/using-feather-browser/SKILL.md` — read them for the
complete command set, targeting rules, and worked examples. Essentials inline below.

## Endpoint discovery (do this first)
- `endpoint.json` is at `${XDG_RUNTIME_DIR:-$XDG_STATE_HOME/.local/state}/feather/run/endpoint.json`.
- Read `baseUrl` and `tokenFile` from it with node; the token goes in header `X-Feather-Token`.
- Every response is `{ ok, requestId, data | error }`. On `ok:false`, read `error.code`/`error.message`.

```bash
EP="${XDG_RUNTIME_DIR:-$HOME/.local/state}/feather/run/endpoint.json"
BASE=$(node -e 'process.stdout.write(require(process.argv[1]).baseUrl)' "$EP")
TOK=$(cat "$(node -e 'process.stdout.write(require(process.argv[1]).tokenFile)' "$EP")")
curl -s "$BASE/health" -H "X-Feather-Token: $TOK"
```

## Golden loop
1. Launch a session (`POST /v1/sessions`). Disposable+headless for safe/easy work:
   `{"profile":{"kind":"disposable"},"browserMode":"chromium-new-headless","viewport":{"width":1280,"height":800}}`.
   Warmed+headed for logged-in work: `{"profile":{"kind":"persistent"},"workspaceId":"scratch","browserMode":"chromium-headed-cdp"}`.
2. `navigate` → `snapshot` (use `markdown`) to see the page.
3. Act: `click` / `type` / `press` / `select-option` with a Target object.
4. `wait` (`until:"stable"`) for dynamic content; `screenshot` for proof.
5. `close` the session.

## Targeting (Target object)
`{ "by":"role|text|placeholder|testid|css", "role?","name?","text?","selector?","exact?","at?":"first|last|<n>" }`.
Prefer role+name or text; fall back to css. For editors that ignore `fill`, use `type` with
`mode:"sequential"` (or Shift+Tab + per-key `press` for IG-style inputs).

## Privacy / proxy
For sacrificial-account work, route the session through a proxy: add
`"proxy":{"server":"<vpn-or-proxy-url>"}` to the `POST /v1/sessions` body.

## Honest reporting (repo law)
Report `PASS` / `PARTIAL` / `FAIL` exactly, each with a one-line lesson. A failure whose
fallback fires and whose lesson is recorded is a PARTIAL = a successful test. Never fake green.
Stop and ask Roi at: account creation SMS/CAPTCHA walls, and any destructive or risky step.
```

- [ ] **Step 2: Verify frontmatter parses**

Run:
```bash
node -e 'const fs=require("fs");const s=fs.readFileSync(".pi/skills/feather-operator/SKILL.md","utf8");if(!/^---\nname: feather-operator/.test(s)){console.error("bad skill frontmatter");process.exit(1)}console.log("skill OK")'
```
Expected: `skill OK`.

- [ ] **Step 3: Commit**

```bash
git add .pi/skills/feather-operator/SKILL.md
git commit -m "feat(pi): feather-operator skill (thin pointer to playbook; the only allowlisted skill)"
```

### Task 1.3: `feather.coder`

**Files:** Create `.pi/agents/coder.md`

- [ ] **Step 1: Create the file**

```markdown
---
name: coder
package: feather
description: Implementation agent for the Feather showcase suite — writes examples/showcase.sh, scripts, configs. The only agent that edits code; commits only after review + Roi approval.
model: openai-codex/gpt-5.5
fallbackModels: ["openrouter/qwen/qwen3-coder"]
tools: read, write, edit, bash, grep, find, ls
inheritProjectContext: true
inheritSkills: false
skills: feather-operator
defaultContext: fork
systemPromptMode: replace
---

You are the coder for Roi's Feather project Pi team.

Your job:
- Implement examples/showcase.sh and related scripts/configs per the approved plan
  (docs/specs/2026-06-09-showcase-eval-suite-plan.md).
- Make the smallest safe diff. Do not refactor unrelated code.
- Do not commit unless explicitly told, and only after Opus review + Roi approval.

Rules:
- Prefer simple working solutions; avoid over-engineering.
- Never put API keys or tokens in generated files.
- No `jq` — use node (matches examples/quickstart.sh).
- Before editing, list the files you intend to touch; after editing, show a diff summary.
- Flag destructive operations before running.

Output: 1) what changed 2) files/commands 3) how to test 4) risks/assumptions.
```

- [ ] **Step 2: Verify** (frontmatter + `inheritSkills: false`)

Run:
```bash
grep -q "^inheritSkills: false" .pi/agents/coder.md && grep -q "^package: feather" .pi/agents/coder.md && echo "coder OK"
```
Expected: `coder OK`.

- [ ] **Step 3: Commit**

```bash
git add .pi/agents/coder.md
git commit -m "feat(pi): feather.coder agent (project-scoped, skills-walled)"
```

### Task 1.4: `feather.validator`

**Files:** Create `.pi/agents/validator.md`

- [ ] **Step 1: Create the file**

```markdown
---
name: validator
package: feather
description: Validation/test runner for the Feather showcase suite — runs only explicitly approved commands, reports exact PASS/PARTIAL/FAIL with the lesson, never edits or fixes.
model: openrouter/z-ai/glm-5.1
tools: read, bash, grep, find, ls
inheritProjectContext: true
inheritSkills: false
skills: feather-operator
defaultContext: fresh
systemPromptMode: replace
completionGuard: false
---

You are the validator for Roi's Feather project Pi team.

Your job:
- Run only validation commands explicitly provided or clearly approved (e.g.
  `./examples/showcase.sh easy`, `./examples/showcase.sh medium`).
- Report exact commands, exit codes, relevant output, and per-task PASS/PARTIAL/FAIL.
- Honor Testing Honesty: a PARTIAL with a recorded lesson is a successful test. Never sand a
  fragile task into an easy one to get a green row. Never fake a pass.

Rules:
- Do not edit, fix, install, or commit.
- Do not invent validation commands when none were provided/approved.
- Do not run destructive commands. If a command looks risky, stop and ask.

Output: 1) commands run 2) results (exit code + concise output) 3) PASS/PARTIAL/FAIL + lesson
4) what remains unvalidated.
```

- [ ] **Step 2: Verify**

Run:
```bash
grep -q "^inheritSkills: false" .pi/agents/validator.md && grep -q "^package: feather" .pi/agents/validator.md && echo "validator OK"
```
Expected: `validator OK`.

- [ ] **Step 3: Commit**

```bash
git add .pi/agents/validator.md
git commit -m "feat(pi): feather.validator agent (honest PASS/PARTIAL/FAIL reporter)"
```

### Task 1.5: `feather.opus-reviewer`

**Files:** Create `.pi/agents/opus-reviewer.md`

- [ ] **Step 1: Create the file**

```markdown
---
name: opus-reviewer
package: feather
description: Premium decision maker for the Feather showcase work — final authority on risky commits, scope, and go/no-go. Reviews; does not write first drafts or edit files.
model: anthropic/claude-opus-4-8
fallbackModels: ["openrouter/anthropic/claude-sonnet-4.6"]
thinking: high
tools: read, grep, find, ls
inheritProjectContext: true
inheritSkills: false
skills: feather-operator
defaultContext: fresh
systemPromptMode: replace
---

You are the premium decision maker for Roi's Feather project Pi team.

You are called only for: high-stakes decisions (risky config, multi-file change, go/no-go),
final review, assumptions audit, and complex review. You are NOT a first-draft worker.

Pay special attention to Testing Honesty: confirm the suite reports PASS/PARTIAL/FAIL honestly
and that fragile-on-purpose tasks (M1 hard-path-first, H1 calendar-write) were not sanded down.

Rules: diagnose before rewriting; find weak assumptions; recommend smallest high-impact fixes;
be strict but practical; do not edit files.

Output: 1) Decision: proceed/change/stop 2) verdict/reasoning 3) main risks 4) what to change
5) what is already good enough.
```

- [ ] **Step 2: Verify**

Run:
```bash
grep -q "^inheritSkills: false" .pi/agents/opus-reviewer.md && grep -q "^package: feather" .pi/agents/opus-reviewer.md && echo "reviewer OK"
```
Expected: `reviewer OK`.

- [ ] **Step 3: Commit**

```bash
git add .pi/agents/opus-reviewer.md
git commit -m "feat(pi): feather.opus-reviewer agent (go/no-go + Testing-Honesty gate)"
```

### Task 1.6: `feather.operator` (the driver)

**Files:** Create `.pi/agents/operator.md`

- [ ] **Step 1: Create the file**

```markdown
---
name: operator
package: feather
description: The Feather operator — drives real (incl. logged-in) browser sessions over Feather's local HTTP API to run errands, set up sacrificial accounts, and execute the showcase suite. Reports honest PASS/PARTIAL/FAIL with the lesson.
model: openai-codex/gpt-5.5
fallbackModels: ["openrouter/z-ai/glm-5.1"]
tools: read, bash, grep, find, ls
inheritProjectContext: true
inheritSkills: false
skills: feather-operator
defaultContext: fork
systemPromptMode: replace
---

You are the Feather operator for Roi's project Pi team.

You drive a real browser through Feather's local HTTP API (curl). Always follow the
`feather-operator` skill: discover the endpoint from endpoint.json, use the golden loop
(launch → navigate → snapshot → act → wait → screenshot → close), and target elements by
role/name/text first, css as fallback.

You intentionally test failure/blocking boundaries — that is the point. Do not avoid hard
paths. But:
- Report PASS / PARTIAL / FAIL exactly, each with a one-line lesson. A failure whose fallback
  fires and whose lesson is recorded is a PARTIAL = a successful test. Never fake a pass.
- For account-creation work, make accounts look normal/non-bot-like (human-plausible pacing,
  realistic warm-up browsing) and route the session through the configured proxy/VPN.
- STOP and ask Roi at: phone/SMS/CAPTCHA walls, destructive steps, and anything touching his
  personal identity.

Rules: do not edit code or commit (that is the coder, after review + approval). Never write
credentials into files. Use the warmed `scratch` profile only for sacrificial accounts.

Output: 1) what you did (steps + selectors that worked) 2) result PASS/PARTIAL/FAIL + lesson
3) artifacts (screenshot paths) 4) what needs Roi.
```

- [ ] **Step 2: Verify**

Run:
```bash
grep -q "^inheritSkills: false" .pi/agents/operator.md && grep -q "^skills: feather-operator" .pi/agents/operator.md && echo "operator OK"
```
Expected: `operator OK`.

- [ ] **Step 3: Commit**

```bash
git add .pi/agents/operator.md
git commit -m "feat(pi): feather.operator agent (the live driver; honest, proxy-aware, Roi-gated)"
```

### Task 1.7: `feather.showcase-run` chain (build → review → validate)

**Files:** Create `.pi/chains/showcase-run.chain.md`

> The chain covers the **determinate** codegen pipeline only. The **interactive** operator runs
> (account setup, Pass-1 discovery, hard tier) are separate Roi-gated invocations (Phase 3 / the
> showcase plan), deliberately NOT folded into an unattended chain.

- [ ] **Step 1: Create the file**

```markdown
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
```

- [ ] **Step 2: Verify chain frontmatter + step agents exist**

Run:
```bash
grep -q "^name: showcase-run" .pi/chains/showcase-run.chain.md && grep -q "## feather.coder" .pi/chains/showcase-run.chain.md && grep -q "## feather.validator" .pi/chains/showcase-run.chain.md && echo "chain OK"
```
Expected: `chain OK`.

- [ ] **Step 3: Commit**

```bash
git add .pi/chains/showcase-run.chain.md
git commit -m "feat(pi): feather.showcase-run chain (plan -> coder -> reviewer -> validator)"
```

---

## Phase 2 — Verify scope, trust wall, and the loop

### Task 2.1: Structural verification (Claude Code)

**Files:** none (read-only checks)

- [ ] **Step 1: All agent files parse and are walled**

Run:
```bash
fail=0
for f in .pi/agents/*.md; do
  grep -q "^inheritSkills: false" "$f" || { echo "MISSING inheritSkills:false in $f"; fail=1; }
  grep -q "^package: feather" "$f" || { echo "MISSING package:feather in $f"; fail=1; }
done
[ "$fail" = 0 ] && echo "ALL AGENTS WALLED OK"
```
Expected: `ALL AGENTS WALLED OK`.

- [ ] **Step 2: Only one skill exists in the project**

Run:
```bash
test "$(ls .pi/skills)" = "feather-operator" && echo "single skill OK (feather-operator)"
```
Expected: `single skill OK (feather-operator)`.

### Task 2.2: Pi resolution verification (run inside Pi, in feather-browser cwd — Roi/pi)

> These prove the wall behaviorally. Run them in a Pi session started from the feather-browser repo root.

- [ ] **Step 1: List project-scoped agents/chains**

In Pi, ask it to call the `subagent` tool: `{ "action": "list", "agentScope": "project" }`
(or run the `/agents` slash command).
Expected: lists `feather.coder`, `feather.operator`, `feather.opus-reviewer`, `feather.validator` (source: project) and chain `feather.showcase-run`. The global `roi-ops.*` team and Hebrew/content skills must **not** appear.

- [ ] **Step 2: Confirm the operator's resolved skills are exactly the allowlist**

In Pi: `subagent` tool `{ "action": "get", "agent": "feather.operator" }`.
Expected: the detail shows `Skills: feather-operator` and nothing else (no Hebrew/content/pi_agency skills).

- [ ] **Step 3: Record the output** in the journal at handoff (Phase 4). If any global skill or agent leaks in, STOP — the wall is breached; recheck `inheritSkills:false`, the `skills:` line, and that `.pi/settings.json` has no `skills` array.

### Task 2.3: Loop proof — operator reaches Feather end to end (run inside Pi — Roi/pi)

> Prerequisite: Feather is running (`npm run dev` in another terminal).

- [ ] **Step 1: Run the operator on one easy, safe task**

In Pi (feather-browser cwd), call the `subagent` tool:
```json
{ "agent": "feather.operator", "agentScope": "project",
  "task": "Discover the Feather endpoint from endpoint.json and GET /health. Then launch a disposable headless session, navigate to https://wttr.in/tel+aviv?format=3 (waitUntil load), snapshot the text, extract the temperature, and close the session. Report the temperature and PASS/PARTIAL/FAIL with a one-line lesson." }
```
Expected: the operator reports the current Tel Aviv temperature and `PASS` (or an honest `PARTIAL`/`FAIL` with a lesson). This proves: endpoint discovery, auth, session lifecycle, navigate, snapshot/extract — the whole loop — works through a pi agent.

- [ ] **Step 2:** If it fails on discovery/auth, the agent likely lacks `bash` or Feather isn't running — fix and re-run. Record the outcome for the Phase 4 handoff.

---

## Phase 3 — Fresh sacrificial scratch identities (interactive; Roi-gated)

> The hard tier must run against dedicated throwaway accounts, not Roi's existing warmed profile.
> This whole phase is the **first autonomous Feather operation** — and a real boundary test.
>
> **VPN/proxy update (Roi, 2026-06-09): deferred/optional.** The throwaway accounts aren't worth the
> added friction. Run the setup on the normal connection by default; only reconsider a VPN/proxy if a
> signup actually gets blocked at a wall. The `proxy` field below is optional — omit it unless Roi sets one.

### Task 3.1: Rebuild a fresh `scratch` profile (DESTRUCTIVE — Roi runs/approves)

**Files:** none (filesystem + live sessions)

- [ ] **Step 1: Close any open scratch session** (Feather running)

```bash
EP="${XDG_RUNTIME_DIR:-$HOME/.local/state}/feather/run/endpoint.json"
BASE=$(node -e 'process.stdout.write(require(process.argv[1]).baseUrl)' "$EP")
TOK=$(cat "$(node -e 'process.stdout.write(require(process.argv[1]).tokenFile)' "$EP")")
SID=$(curl -s "$BASE/v1/sessions" -H "X-Feather-Token: $TOK" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const o=JSON.parse(s);const m=(o.data||[]).find(x=>x.workspaceId==="scratch");process.stdout.write(m?m.sessionId:"")})')
[ -n "$SID" ] && curl -s -X DELETE "$BASE/v1/sessions/$SID" -H "X-Feather-Token: $TOK" -H "Content-Type: application/json" -d '{"force":true}' >/dev/null && echo "closed $SID" || echo "no scratch session open"
```

- [ ] **Step 2: ROI GATE — confirm wiping the old test identity.** This deletes `feather_test_roi` (IG) and the old warmed Google. Only proceed on Roi's explicit OK. Then:

```bash
rm -rf ~/.local/share/feather/profiles/scratch
echo "scratch profile removed — will be recreated fresh on next persistent launch"
```
Expected: the dir is gone; the next `workspaceId:"scratch"` launch creates a clean profile.

### Task 3.2: Operator creates + warms a new Google account (Roi-gated; VPN/proxy)

> Run inside Pi. Feather server must have a display (`WAYLAND_DISPLAY`/`DISPLAY`) for the headed window.
> Roi watches and clears any SMS/CAPTCHA.

- [ ] **Step 1: Proxy/VPN (optional — default off).** Per the 2026-06-09 decision, run on the normal connection. Only if a signup gets blocked: turn on a consumer VPN (Mullvad/Proton) or use a phone hotspot, then pass `"proxy":{"server":"<url>"}` to the operator. Otherwise skip this step.

- [ ] **Step 2: Run the operator**

In Pi, call the `subagent` tool:
```json
{ "agent": "feather.operator", "agentScope": "project",
  "task": "Using a warmed headed scratch session (persistent profile, workspaceId scratch, chromium-headed-cdp) routed through <PROXY-OR-VPN>, go to accounts.google.com/signup and create a NEW throwaway Google account that looks normal/non-bot-like (realistic name, human pacing). Then do a few minutes of natural warm-up browsing while signed in. STOP and ask Roi if you hit phone/SMS/CAPTCHA verification. When done, report the account handle (NOT the password — keep credentials out of chat/files), what worked, what blocked, and PASS/PARTIAL/FAIL with the lesson." }
```
Expected: a new Google account exists and is signed in on the scratch profile — OR an honest `PARTIAL`/`FAIL` recording exactly which wall (SMS/phone/CAPTCHA) blocked it and what Roi did to help. Both are valid outcomes (this is a real boundary test).

- [ ] **Step 3: Roi marks the profile warm** (or instruct the operator to call Feather's `markWarm` for `scratch`, per the Identity/profile flow). Record the outcome.

### Task 3.3: Operator creates + warms a new Instagram account (Roi-gated; VPN/proxy)

- [ ] **Step 1: Run the operator** (same scratch session/profile, same proxy)

In Pi, call the `subagent` tool:
```json
{ "agent": "feather.operator", "agentScope": "project",
  "task": "In the warmed headed scratch session (routed through the same proxy/VPN), go to instagram.com and create a NEW throwaway Instagram account that looks normal/non-bot-like. The confirmation-code input ignores fill/type — use Shift+Tab + individual key presses. Check spam for the email code. Do a little natural browsing after signup. STOP and ask Roi at any SMS/CAPTCHA wall. Report the handle (NOT the password), what worked/blocked, and PASS/PARTIAL/FAIL with the lesson." }
```
Expected: a new IG account on the scratch profile, or an honest `PARTIAL`/`FAIL` with the exact blocker + lesson.

- [ ] **Step 2: Confirm the fresh scratch holds both new accounts** (signed-in Google + IG). These are now the sacrificial identities for the showcase hard tier.

---

## Phase 4 — Handoff to the showcase suite

### Task 4.1: Journal + handoff (docs-only; push gated)

**Files:** Modify `journal/context/active.md`, `journal/ops/tasks.md`, `journal/log.md`

- [ ] **Step 1:** Record: `.pi/` integration built + committed; the Phase-2 resolution/loop outputs (proof the wall holds + the loop works); the fresh scratch identities (handles only, no credentials) and their PASS/PARTIAL/FAIL setup outcomes.
- [ ] **Step 2:** Update the pointers so the next session = **the pi team runs the showcase plan** (`docs/specs/2026-06-09-showcase-eval-suite-plan.md`, Phases A–D) using `feather.showcase-run` for build/review/validate and gated `feather.operator` runs for the live Pass-1 + hard tier against the fresh scratch.
- [ ] **Step 3: ROI GATE — push.** Per the dev-only policy, `git push origin dev` only on Roi's say-so (not master).

---

## Self-Review (run against the spec)

**Spec coverage:**
- Thin project-local `.pi/` (agents/chain/skill/settings) → Phase 1 (Tasks 1.1–1.7). ✓
- Force project scope (create `scope:project` via living in `.pi/agents`; run `agentScope:project`) → Tasks 1.x + 2.2/2.3 invocations. ✓
- Skills = explicit allowlist; `inheritSkills:false` + `skills:feather-operator`; no settings skills; no project packages → Tasks 1.1–1.6 + 2.1/2.2. ✓
- Keep `scratch` name, rebuild fresh → Task 3.1. ✓
- Pre-suite operator creates/warms new Google + IG (first autonomous op) → Tasks 3.2/3.3. ✓
- VPN/proxy privacy preference (per-session `proxy`) → skill + Tasks 3.2/3.3. ✓
- No pi_agency skills imported; copy agent profiles only → Phase 1 (no skills copied; the one skill is new). ✓
- Don't over-sanitize the hard tier → operator/validator prompts keep failure boundaries + honest reporting. ✓
- Heavy integration deferred (5e/v3) → out of scope; not implemented. ✓

**Placeholder scan:** `<PROXY-OR-VPN>` / `<url>` / `<PROXY>` in Task 3.2/3.3 are runtime values Roi supplies at execution (the proxy endpoint), not unfilled plan content — the surrounding instruction is complete. All file contents are concrete and complete.

**Type/name consistency:** runtime names `feather.coder` / `feather.validator` / `feather.opus-reviewer` / `feather.operator` and chain `feather.showcase-run` are used consistently in the chain steps and every `subagent` invocation. `agentScope:"project"` is passed on every run. `skills: feather-operator` matches the skill dir name `.pi/skills/feather-operator`. Frontmatter fields match the verified schema (`schemas.ts:253`).

---

## Notes / risks
- The operator/coder model pins (`openai-codex/gpt-5.5`, etc.) match Roi's existing team; tune in the agent frontmatter if cost/availability changes. No model id is invented — they mirror `pi_agency/.pi/agents/*`.
- Account creation (Phase 3) is genuinely fragile (anti-bot). PARTIAL/FAIL here is expected and informative, not a plan defect — record the lesson and let Roi decide next steps.
- Credentials for the sacrificial accounts must never be written to the repo or chat — handles only.
- This plan ends at "pi team can run the showcase suite against fresh scratch." Building/running `examples/showcase.sh` itself is the separate showcase plan.
```
