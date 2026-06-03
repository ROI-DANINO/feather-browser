# GPT Repo Audit Follow-up — Check Against Local Planning Files

- **Date:** 2026-06-03
- **Source:** GPT review of the public GitHub `dev` branch
- **Scope:** Read-only repository review performed from GitHub-visible files only
- **Purpose:** Give Claude a concise checklist to verify against local planning files that may exist outside GitHub or were not visible during the review.

## Important instruction for Claude

This file is **not** a change request by itself.

Before creating tasks or modifying production code, check whether each item below is already planned, resolved, superseded, or intentionally deferred in local planning files such as:

- `context/active.md`
- `ops/tasks.md`
- `/start` and `/stop` handoff notes
- local-only planning docs
- local research notes not committed to GitHub
- any current Claude Code session plan

For each item, classify it as one of:

1. **Already planned** — point to the local file/section.
2. **Already resolved** — point to the commit/file/test proving it.
3. **Valid but deferred** — state the target phase/program section.
4. **Valid and unplanned** — recommend where to place it.
5. **Invalid / false positive** — explain why.

Do **not** assume GPT saw the full project context. GPT only saw files available through the GitHub connector.

---

## 1. Possible duplicate tab registration in `openTab()`

### Observation

`SessionManager.launch()` registers a `context.on("page")` listener. That listener calls `session.addPage(page)` and logs `TAB_CREATED`.

`FeatherSession.openTab()` also calls `this._context!.newPage()`, creates a fresh `pageId`, and directly inserts the page into `_pages`.

`SessionManager.openTab()` then logs `TAB_OPENED`.

### Why this may matter

If Playwright emits the `context.on("page")` event for pages created through `context.newPage()`, a single opened tab may be registered twice under two different Feather page IDs.

Possible symptoms:

- Duplicate `PageInfo` entries for one Playwright page.
- Both `TAB_OPENED` and `TAB_CREATED` for one explicit API tab-open operation.
- Close handling may remove only one page ID.
- Future UI tab state may become inconsistent.

### Claude check

Please verify locally:

- Is this already tested?
- Does Playwright emit the `page` event for `context.newPage()` in this code path?
- Is the intended semantic difference between `TAB_OPENED` and `TAB_CREATED` documented?
- Is there already a planned S2 task for this?

### Possible resolution direction, only if unplanned

Define one owner for page registration:

- either the `context.on("page")` listener is the only registration source,
- or `openTab()` registers directly and the listener deduplicates existing Playwright `Page` objects.

---

## 2. `getPageInfoList()` may be brittle when a page closes or navigates mid-read

### Observation

`FeatherSession.getPageInfoList()` calls:

- `page.evaluate(() => document.readyState)`
- `page.title()`

inside a loop over `_pages`.

### Why this may matter

A status/list endpoint for a future UI should be resilient. If one page is closed, crashed, cross-process, or mid-navigation, the whole session status call may fail.

Possible symptoms:

- `GET /v1/sessions` or `GET /v1/sessions/:id` fails because one tab is unstable.
- Future shell tab list becomes fragile.
- Agent callers get hard failures for what should be partial status data.

### Claude check

Please verify locally:

- Are there tests for closed-page or mid-navigation status reads?
- Is this already part of the planned `TAB_UPDATED` / observability work?
- Is there already an intended `PageInfo` error/unknown state model?

### Possible resolution direction, only if unplanned

Make `PageInfo` collection best-effort:

- catch per-page failures,
- remove closed pages where appropriate,
- or return `loadState: "unknown"` plus a compact per-page error field.

---

## 3. DebugCapture tracing exists, but end-to-end reachability should be verified

### Observation

`DebugCapture` has tracing support through `context.tracing.start()` and `context.tracing.stop({ path })`.

The stabilization spec already says tracing is implemented but needs verification that it is reachable end-to-end via the debug-bundle command.

### Claude check

Please verify locally:

- Is `DebugCapture.start()` invoked during launch when `debug.trace` is passed?
- Does `POST /v1/sessions/:id/debug-bundle` actually produce `trace.zip` after a traced run?
- Is this already covered by an integration test or planned in S2?

### Possible resolution direction, only if unplanned

Add/confirm one integration test that launches with `debug.trace: true`, performs a minimal navigation, creates a debug bundle, and asserts that `trace.zip` exists.

---

## 4. Fastify v4 security/currency risk remains important

### Observation

`package.json` uses `fastify: ^4.28.0` and `fastify-sse-v2`.

The stabilization spec already identifies Fastify v4 as end-of-life and says migration is gated by a `fastify-sse-v2` compatibility spike.

### Claude check

Please verify locally:

- Is the Fastify v5 spike already recorded in local research notes?
- Has `fastify-sse-v2` v5 compatibility already been checked?
- If not compatible, is manual SSE streaming already considered?

### Possible resolution direction, only if unplanned

If `fastify-sse-v2` blocks v5, consider replacing the plugin with a tiny local SSE implementation rather than keeping Fastify v4 longer.

---

## 5. `FEATHER_CHROMIUM_PATH` / `executablePath` support is correctly identified but should stay scoped

### Observation

`src/browser/modes.ts` currently builds Playwright launch options from browser mode, proxy, and viewport only. There is no `executablePath` or env-configurable system Chromium path.

The stabilization spec already identifies this as a real S2 item.

### Claude check

Please verify locally:

- Is this already represented in `ops/tasks.md` or current S2 planning?
- Is the system Chromium spike already done locally?
- Are Fedora package names / binary paths already recorded?

### Scope warning

This should remain a Linux-readiness / weight-reduction task, not a broader browser-mode redesign.

---

## 6. Docs may be ahead of product reality; preserve explicit status boundaries

### Observation

GitHub-visible docs describe the long-term Hybrid Browser / Cookie Mine / MCP-compatible hub direction. The actual codebase is still a headless local browser-control core.

This is not a problem by itself. The roadmap is allowed to be aspirational. The risk is that future docs or marketing copy may blur current capability with future destination.

### Claude check

Please verify locally:

- Is there already a docs-map/source-of-truth task covering this?
- Do local planning files clearly distinguish current capability from future phases?
- Is `README.md` intentionally concise, or should it include a sharper "Current vs Future" note?

### Suggested wording principle

Keep the distinction clear:

- **Current:** local headless Chromium control core with HTTP API, sessions, logs, debug bundles, SSE lifecycle stream.
- **Future:** Linux desktop shell, daily-driver browser, Cookie Mine, MCP/agent runtime.

---

## 7. Safety/product-language note around bot detection wording

### Observation

`ROADMAP.md` says the Cookie Mine lets local AI agents piggyback on human browsing session state "without triggering bot detection."

### Why this may matter

That phrase could be interpreted as evasion-oriented rather than user-authorized local automation. The technical idea may be legitimate, but the wording could create product, ethical, or platform-risk ambiguity.

### Claude check

Please verify locally:

- Is this wording intentional?
- Is there already an ADR or policy note framing allowed / disallowed automation use?
- Should the roadmap wording be softened to focus on user-authorized continuity, session reuse, and reduced false-positive automation friction?

### Possible safer framing

Instead of centering "without triggering bot detection," consider wording around:

- preserving user-authorized session continuity,
- minimizing unnecessary re-authentication,
- making local automation operate inside explicit user-controlled browser state,
- respecting site policies and human approval checkpoints.

---

## 8. Recommended Claude output format

After checking local files, please produce a compact table:

| Item | Status | Evidence | Action |
|---|---|---|---|
| Duplicate tab registration | Already planned / valid unplanned / false positive | file/section/test | next step |
| PageInfo resilience | ... | ... | ... |
| Debug trace e2e | ... | ... | ... |
| Fastify v5/SSE | ... | ... | ... |
| System Chromium path | ... | ... | ... |
| Current-vs-future docs boundary | ... | ... | ... |
| Bot-detection wording | ... | ... | ... |

Only after that classification should any task file or implementation be changed.
