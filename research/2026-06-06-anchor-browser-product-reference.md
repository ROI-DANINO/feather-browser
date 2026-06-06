# Anchor Browser — Product Reference Research

**Date:** 2026-06-06
**Status:** ✅ Research complete (public-sources only; no Anchor account, no paid features exercised)
**Branch:** `crash/anchor-research-2026-06-06` (intentionally off `dev`, per Roi)
**Trigger:** `journal/raw/_inbox/anchor-browser-research-brief-2026-06-06.md`
**Method:** Primary-source web research (landing, `docs.anchorbrowser.io`, pricing, security) +
**ground-truth SDK inspection** of the shipped npm package `anchorbrowser@0.16.3` in a throwaway
git worktree (`crash/anchor-sdk-probe`). No code was run against Anchor's API (no key); the SDK was
unpacked and its TypeScript surface read directly.

> **Discipline note.** This is research, not a roadmap and not a feature-by-feature comparison with
> Feather. "Possible local-first adaptation" columns are deliberately high-level. Vendor performance
> numbers are marked **[vendor claim, unverified]**. Where the marketing site and the docs disagree,
> I say so — that gap is itself a finding.

---

## 1. Executive summary

Anchor Browser (anchorbrowser.io) is **cloud-hosted browser infrastructure for computer-use AI
agents**. Tagline: *"Secure Infrastructure for Computer Use Agents."* You call an API / SDK, Anchor
spins up a real (headful) Chromium in an ephemeral cloud VM, and your agent — or Anchor's own AI —
drives it. It targets the automation of **web apps that have no API or weak API coverage**, turning
"complex web interactions into simple API endpoints."

The product is best understood as **five layers stacked on a cloud browser**:

1. **A managed browser session** you connect to with Playwright over CDP (`connectOverCDP`).
2. **An identity/auth layer** (persistent logged-in state, end-user self-service login UI).
3. **A determinism layer** ("Tasks"/"Tools") that turns an AI plan or a human demonstration into a
   reusable workflow that runs *without* an LLM in the loop on replay.
4. **A network/stealth layer** (proxies, ~150-country geolocation, anti-detection, captcha solving)
   — and, notably, its *opposite*: cryptographically **declaring** itself as a verified good bot.
5. **An enterprise trust layer** (SOC2 Type II, ISO 27001, HIPAA, GDPR, ZDR, BYOC).

**Three things stand out as genuinely interesting for a local-first browser-agent project:**

- **The determinism layer** ("plan once with AI, then replay deterministically; only re-invoke AI when
  the page actually diverges"). This is the single most product-differentiating idea, and it directly
  addresses the cost/reliability problem of LLM-every-step agents.
- **The identity model** (a human logs in once → a stored *Identity* → agents attach it and start
  pre-authenticated). This is conceptually the same shape as Feather's "Cookie Mine": **human
  browsing builds a trust context that agents piggyback on.**
- **The headful + connect-over-CDP architecture**, which is *the same control pattern Feather already
  uses locally* (`spawnAndConnect`). Anchor's whole stack is "a Chromium you attach to over CDP" — the
  only fundamental difference is *where the browser runs* (their ephemeral cloud VM vs. Feather's
  local host). Their explicit *"Official Headful Browser Environments"* positioning is independent
  market validation of this repo's own "do not run the real path headless" finding
  (`research/2026-06-05-anti-detection-self-test.md`).

**Biggest caveat:** the marketing site is far more confident than the docs. Two flagship brand names —
**"Anchor Chromium"** and **"OmniConnect"** — **do not appear in the technical docs at all**; the docs
describe a generic *"specialized Chrome browser environment"* and an *"Embedded End-User Authentication
UI."* The stealth docs contain **no technical mechanism** — only configuration flags and claims. Treat
the stealth/realism story as **mostly unverified marketing** with a few concrete, verifiable knobs.

---

## 2. Feature inventory table

| Anchor feature | What it appears to do | Evidence / source | Why it is interesting | Possible local-first adaptation idea (high-level) | Risk / uncertainty |
|---|---|---|---|---|---|
| **Cloud browser session** | Ephemeral headful Chromium in a per-session VM; connect via Playwright `connectOverCDP` | SDK `resources/browser.d.ts` (`connect()/create()` → `playwright-core Browser`); `lib/browser.js` `chromium.connectOverCDP(wss://…/ws?sessionId=…)` | Same attach-over-CDP pattern Feather uses; clean session lifecycle API | N/A (Feather already does this locally) | Low — verified in shipped code |
| **`agent.task(prompt)`** | One-call NL task: "go to X and get Y" | SDK `resources/agent.d.ts`; `quickstart/use-via-sdk` | Extremely low-friction DX; the entire MVP is ~6 lines | A single high-level "do this" entry point over the local runtime | Low (API shape verified); result quality unknown |
| **`agent.browserTask(prompt)`** | Runs an AI task **but hands back a live Playwright `Browser`** | SDK `resources/agent.d.ts` returns `{sessionId, taskResultPromise, playwrightBrowser}` | Lets you interleave AI steps and deterministic Playwright in one session — the hybrid model at the SDK layer | Expose the local CDP handle alongside any agent action so deterministic + AI control coexist | Low — verified |
| **Tasks (versioned)** | Reusable automation units with draft/deploy versions, `ANCHOR_`-prefixed params | `advanced/tasks`; `api-reference/tasks/*` | Deterministic, parameterized, replayable workflows = cheap reliable reruns | A local "saved workflow" object: record once, parameterize, replay without an LLM | Med — docs thin on the exact replay/runtime-AI-fallback logic |
| **AI Task Generation** | NL description → generated task definition (async generate-then-poll) | `api-reference/tasks/generate-task` (`POST /v2/tasks/generate` → `{id,status:"generating"}`) | "AI plans once" half of the determinism story | Local: LLM proposes a selector/action script from a goal; human approves; script becomes the workflow | Med — output format (code vs JSON) not documented |
| **Demonstrations API** | Human records a live session via a share link → Anchor generates a deterministic workflow/tool | `advanced/demonstrations-api`; `api-reference/tools/*-demonstration` | "By demonstration" is the *most human-friendly* path to a reusable workload | **Record-to-replay**: capture a real local browsing session → generalize → replay tool | Med — "generalization" quality is the hard part; unverified |
| **Tools** | Tasks wrapped as callable tools with input/output schemas + AI param extraction | `api-reference/tools/*` | Turns a workflow into a typed, LLM-callable function | Local MCP tool generated from a saved workflow | Med |
| **Identities + Applications** | Store login state (creds/cookies/localStorage) once; attach to future sessions to start pre-authenticated | `essentials/authenticated-applications`; `api-reference/identities/*`, `…/applications/*`; SDK `resources/identities`, `applications` | **Direct analog of the Cookie Mine**: human trust context reused by agents | Local persistent profile/identity that agents attach to (Feather already has profile isolation) | Med — credential storage = high-sensitivity domain |
| **OmniConnect / Embedded end-user auth UI** | Hosted login UI: your user logs into a 3rd-party site themselves via a one-time token; you get back an `identity_id` | `essentials/omniconnect` (one-time token, `app.anchorbrowser.io/identity/create?token=…`, callback `identity_id`) | Solves "agent must never hold raw creds" — the **human logs in, the agent inherits the session** | A local "you log in, Feather keeps the session, the agent never sees the password" flow | Med — cloud-hosted; local equivalent is different but the *pattern* transfers |
| **Profiles** | Persisted cookies/local storage/cache reusable across sessions | `api-reference/profiles/*`; SDK `resources/profiles` | Same isolation primitive Feather already has | N/A (Feather has profile isolation) | Low |
| **Extra Stealth** | Anti-detection mode; **requires proxy active**; disables `console.on` by default to avoid CDP detection | `essentials/stealth` (`extra_stealth:{active:true}` + `proxy:{active:true}`) | The one *concrete* stealth tell-avoidance: don't enable CDP runtime events that leak | Keep CDP runtime events off by default on the real path (Feather's self-test already flags CDP-leak as a follow-up) | **High** — docs give claims, *no mechanism*; Growth-tier gated; ethics/ToS |
| **Web-Bot-Auth (Cloudflare verified bot)** | Cryptographically **signs every request as "Anchor Browser"** (RFC 9421 HTTP Message Signatures); Cloudflare partner | `advanced/cloudflare-web-bot-auth` (`web_bot_auth:{active:true}`) | **The opposite of stealth** — declare identity instead of hiding. Legitimate, standards-based, future-proof | Watch the Web-Bot-Auth standard; a *declared* good-bot path is the sustainable long-term posture | Low risk, high strategic interest |
| **Anchor VPN / Proxy** | Built-in egress: `anchor_proxy` with ~150-country `country_code`, or `custom` proxy; "avoid 3rd-party proxy reliance" | `advanced/anchor-vpn`, `advanced/proxy`; SDK `sessions.d.ts` `country_code` enum (~150) | Network identity bundled with browser identity | N/A locally (Feather is local-first); note the *coupling* idea | Med — ToS/geo-evasion concerns |
| **Captcha solving** | `captcha_solver:{active:true}`; emits `detected/solved/failed` events w/ `timeToSolve` | `essentials/stealth`; pricing (Starter+) | Lifecycle events are a nice observability touch | Surface captcha-encountered as an event/human-handoff signal | **High** — captcha bypass = ToS/abuse risk |
| **Web Unlocker** | Stateless `POST /v1/tools/fetch/webpage` → rendered HTML/markdown from bot-protected pages | `api-reference/tools/web-unlocker` | One-shot "give me the rendered page" without session mgmt | A local "render and extract" helper over the existing engine | **High** — explicitly markets bypassing bot protection |
| **MCP (hosted)** | `https://api.anchorbrowser.io/mcp`, header `anchor-api-key`, "24 tools enabled" | `advanced/mcp` | Drop-in for Cursor/Claude Desktop/VS Code | Feather's planned Fastify MCP hub is the local analog | Low |
| **MCP (open-source/self-host)** | Self-hostable MCP server for customization | `advanced/mcp-open-source` | Confirms MCP is the integration lingua franca | Validates Feather's MCP-hub direction | Low |
| **Human-in-the-loop / MFA / events** | Pause agent, request human intervention, `signal-event`/`wait-for-event`, email-OTP, detached mailboxes | `agentic-browser-control/human-in-the-loop`, `advanced/mfa`, `advanced/email-otp`, `api-reference/event-coordination/*`, `identities/*-mailbox` | Real production-grade handling of MFA/OTP and human handoff | A local "agent blocks, asks human, resumes" event primitive | Med |
| **Observability** | MP4 session recordings (default on), agent logs, browser-action logs, network-response logs, execution logs/metadata/artifacts, page-state snapshots, screenshots | `essentials/recording`; `api-reference/session-logs/*`, `…/executions/*`, `…/session-recordings/*` | Rich post-hoc debugging surface for flaky web tasks | Local: structured per-run artifacts (already partially via SSE event stream) | Low |
| **Batch sessions** | Create/manage many sessions at once; retry failed | `api-reference/batch-sessions/*` | Scale primitive (cloud-only value) | Lower relevance to local-first | Low |
| **OS-level control** | Mouse/keyboard/clipboard/drag at the OS layer (not just DOM) | `api-reference/os-level-control/*` | Computer-use-agent fidelity beyond the DOM; real cursor movement | Relevant to "human behavioral signature" (`project_security_and_agent_fidelity`) | Med |
| **ZDR mode** | Zero Data Retention: disables all recordings + logs; manual Anchor-side enablement | `security/zdr-mode` | Privacy posture; trades observability for retention guarantees | Local-first is *inherently* ZDR (nothing leaves the host) — a positioning point | Low |
| **Enterprise trust** | SOC2 Type II, ISO 27001, HIPAA, GDPR, BYOC/on-prem, SSO, RBAC, BAA, DPA | `security`, pricing | Shows what enterprises pay for | Not now; informs eventual positioning | Low |

---

## 3. Deep dive on the most interesting features

### 3a. The determinism layer ("Web Action Cache" → really Tasks + Generation + Demonstrations)

**Finding:** *"Web Action Cache"* is a **landing-page marketing term**; it does not appear as a docs
page. The real implementation is three connected pieces:

- **Generate** — `POST /v2/tasks/generate` takes a `user_task` ("Natural-language description of what
  the task should do"), runs async, and you poll `…/generation-status` until `ready`. *(The exact
  output representation — code vs. JSON workflow — is **not documented**; flagged.)*
- **Demonstrate** — a human opens a `share_url`, performs the task in a live browser, clicks "Finish
  Demonstration," and *"Anchor automatically generates a reusable deterministic workflow from the
  recording,"* using a `task_description` as semantic intent so it *"generalize[s] beyond the exact
  recorded sequence."* Returns `task_id` + `tool_id`.
- **Run** — Tasks are versioned (draft/deploy), parameterized (`ANCHOR_`-prefixed inputs), and run
  sync or async.

The product thesis (landing page): *"Anchor uses AI Agents to plan and deploy deterministic browser
tasks, only reverting to AI in runtime when it is actually required."* That single sentence is the
whole value proposition — **pay for the LLM once at authoring time, run cheaply and deterministically
forever after, and only re-engage the model when the page actually changes.**

**Why it matters most:** every "LLM-drives-the-browser-every-step" agent is slow, expensive, and
non-deterministic. The plan-once/replay-deterministically pattern is the credible answer, and it's the
thing Anchor leans on for its **[vendor claim, unverified]** "12X faster / 80X fewer tokens / 23X
fewer errors" numbers. I found **no independent validation** of those figures and **no Anchor entry on
the public WebArena leaderboard**; treat them as self-reported marketing.

### 3b. The identity model (the Cookie-Mine parallel)

Two doors into one **Identity** object that stores creds/cookies/localStorage:

- **Backend/programmatic** (`authenticated-applications`): define an **Application** (target site) →
  create an **Identity** with stored credentials → attach at session create
  (`sessions.create({ identities: [{ id }] })`) → *"your agent starts already logged in."*
- **End-user self-service** (`omniconnect` / "Embedded End-User Auth UI"): your server mints a
  **single-use, 15-min token** → your user is sent to `app.anchorbrowser.io/identity/create?token=…`
  → **the end-user types their own credentials** on Anchor's hosted UI ("guided browser experience
  while Anchor detects the site's login steps") → callback returns `identity_id` → you map it to your
  user. Guidance: *"Generate tokens server-side and never expose your API key to the frontend."*

This is **the same architecture as Feather's Cookie Mine and CredentialsVault intent**
(`project_security_and_agent_fidelity`): the **human authenticates; the agent inherits a live session
and never holds raw credentials.** Anchor has productized exactly the separation Feather wants.

### 3c. Architecture (verified in shipped SDK code — not marketing)

From unpacking `anchorbrowser@0.16.3`:

```
deps: { playwright: "^1.57.0", ws: "^8.18.3" }       // bundles Playwright + websockets
browser.connect(sessionId)  → playwright-core Browser // resources/browser.d.ts
lib/browser.js:  chromium.connectOverCDP(`${apiBaseURL→wss}/ws?sessionId=${id}&apiKey=…`)
agent.task(prompt, {sessionOptions, taskOptions, sessionId}) → AgentTaskResult
agent.browserTask(prompt, …) → { sessionId, taskResultPromise, playwrightBrowser }
                                              // ↑ AI task + live Playwright handle together
// + a WebSocket for "agent step notifications" (live step streaming)
```

**Translation:** Anchor's cloud browser exposes **CDP over a WebSocket**; the SDK attaches Playwright
to it. That is *mechanically the same thing Feather does locally with `spawnAndConnect`* — attach to a
real Chromium over CDP rather than launch-and-script a headless one. **The cloud-vs-local difference is
deployment, not control model.** Session config is a flat object of `{active:boolean}` feature flags:
`adblock`, `extra_stealth`, `headless` (a *toggle* — default headful), `captcha`, `popup_blocker`,
`recording`, `viewport`, `profile`, `web_bot_auth`, and `proxy` (`anchor_proxy` w/ ~150-country
`country_code`, or `custom`).

---

## 4. Stealth / humanized browser / anti-detection (categorized, per the brief)

The brief asked for stealth to be split into categories and risky claims flagged. Doing that:

| # | Category | What Anchor actually says | Verifiability |
|---|---|---|---|
| 1 | **Browser realism / compatibility** | Runs **real headful Chromium** in cloud VMs; *"Official Headful Browser Environments"* (sole-provider claim). `headless` is an opt-in toggle. | ✅ Plausible + consistent with their own positioning and Feather's self-test. Headful = the realism baseline. |
| 2 | **Reduced automation fingerprints** | *One concrete mechanism:* `page.on('console')` events **disabled by default** "to prevent detection" (avoids a CDP `Runtime.enable` tell). "browser fingerprinting protection" listed as a benefit. | ⚠️ The console-events detail is real and meaningful; "fingerprinting protection" is otherwise unspecified. |
| 3 | **Human-like interaction patterns** | OS-level mouse-move/click/type-with-delay endpoints (real cursor movement vs. DOM events). | ⚠️ Primitives exist; no claim of generated human-like *trajectories*. |
| 4 | **Verified good-bot access** | **Web-Bot-Auth**: signs requests as Anchor via RFC 9421; Cloudflare partner. **This is the responsible opposite of stealth.** | ✅ Standards-based, legitimate, low-risk. The most strategically sound feature here. |
| 5 | **Proxy / geo** | `anchor_proxy` (~150 countries) or custom; "Anchor VPN" for first-party egress. Stealth **requires** proxy active. | ⚠️ Capability clear; sourcing (residential vs datacenter), rotation undocumented. |
| 6 | **Captcha** | `captcha_solver:{active:true}` with `detected/solved/failed` events. | 🚩 **Risk** — captcha solving is a ToS/abuse-sensitive feature. |
| 7 | **Fingerprint / bot-detection avoidance** | "Bypass sophisticated bot detection systems and CAPTCHAs," "Advanced Anti-Detection," "Unique fingerprinting" (Enterprise). | 🚩 **Marketing, no mechanism.** The stealth docs contain *zero* implementation detail. Do **not** treat as technical proof. |
| 8 | **Legal / ToS / abuse** | No acceptable-use text in the stealth/web-unlocker docs reviewed. Web Unlocker explicitly markets bypassing bot protection. | 🚩 See §11. |

**Bottom line on stealth:** the *one* reusable, responsible idea is **#2 (don't light up CDP runtime
events you don't need)** — which Feather's own self-test already flagged as a follow-up — and **#4
(declare-as-verified-bot)** as the sustainable long-term posture. The aggressive anti-detection claims
are unverifiable marketing; Roi cares about stealth, so the honest read is: *Anchor's public material
gives you almost no technical stealth substance to learn from — only the strategic framing that headful
+ minimal-CDP-surface + a declared-bot escape hatch is the defensible stack.*

---

## 5. Authentication & session management (consolidated)

- **Session lifecycle:** create (sync `start-browser-session` / async variant) → connect via CDP →
  drive → end (single / `end-all-sessions`). Status pollable; pages, downloads, auth-status, history
  all queryable. Sessions are **disposable by default** (ephemeral VM destroyed on end), but state can
  be **persisted out-of-band** into Profiles/Identities.
- **Identity = persistence:** creds/cookies/localStorage live on an Identity, attached at create-time
  → pre-authenticated session. (See §3b.)
- **Human-without-creds path:** OmniConnect hosted UI; user logs in; you only ever get an `identity_id`.
- **MFA/OTP:** first-class — `email-otp`, detached **mailboxes** per identity, `wait-for-event` /
  `signal-event` coordination, and human-in-the-loop pause/resume.
- **Secrets:** `secret-values` for secure credential passing at runtime; 1Password integration for
  secret injection. *"Secure authentication without stored credentials"* is a stated security claim.

This is the most **directly Feather-relevant** part of the whole product. The shapes (Application →
Identity → attach; human-logs-in → agent-inherits; MFA as events) are a ready-made mental model for the
Cookie-Mine + Vault work.

---

## 6. Web Action Cache / workflow reuse — verdict

See §3a for the mechanism. **Verdict for the brief's specific questions:**

- *AI plans once then runs deterministically?* — **Yes, that's the explicit product thesis.**
- *When does it re-use AI at runtime?* — *"only reverting to AI in runtime when it is actually
  required"* (landing). **The trigger logic is not documented.** [gap]
- *Editable / inspectable / versioned / replayable?* — **Versioned** (draft/deploy), **replayable**
  (run by id/name), **parameterized** (`ANCHOR_` inputs), and there is a `manually-editing-workflows`
  ("Workflow JSON editing") page → so workflows are **JSON and human-editable**. Exportability is
  unconfirmed.
- *Reliability claims tied to it?* — the **[vendor claim, unverified]** 12X/80X/23X numbers.

**This is the idea most worth stealing conceptually** (not implementing now): *a saved, versioned,
JSON-inspectable, parameterized workflow authored once by AI-or-demonstration and replayed without an
LLM.*

---

## 7. SDK / MCP / API developer experience

- **SDKs:** official **TypeScript** (`npm i anchorbrowser`, repo
  `anchorbrowser/AnchorBrowser-SDK-Typescript`, **Stainless-generated** — note the `openapi-stainless.yaml`)
  and **Python** (`pip install anchorbrowser`). Both expose `agent.task(...)`.
- **Minimal MVP (verbatim):**
  ```js
  import AnchorClient from "anchorbrowser";
  const anchorClient = new AnchorClient({ apiKey: process.env.ANCHOR_API_KEY });
  const result = await anchorClient.agent.task(
    "go to news.ycombinator.com and get the title of the first story"
  );
  ```
  **~6 lines to a working agent task.** Power users drop to `browser.connect()` →
  `playwright-core Browser` for deterministic control.
- **MCP:** hosted at `https://api.anchorbrowser.io/mcp` (header `anchor-api-key`, ~24 tools), plus a
  self-hostable open-source MCP server. Drop-in for Cursor / Claude Desktop / VS Code.
- **Framework integrations:** LangChain, CrewAI, Stagehand, browser-use, n8n, Make, Groq, plus a large
  catalogue of Playwright "recipes" for business apps (Salesforce, HubSpot, NetSuite, Jira…) and even
  ~21 US federal government forms. The recipe catalogue is a **content/SEO + onboarding strategy** as
  much as a feature.

**DX takeaway:** the "one NL line → result," with an escape hatch to raw Playwright, is the DX bar.
Feather's planned MCP hub is the right local analog; the lesson is **two altitudes in one SDK** —
a high-level `task(prompt)` and a low-level CDP/Playwright handle, *interleavable in the same session*.

---

## 8. Debugging & observability

Strong surface, mostly post-hoc:

- **MP4 session recordings** (on by default; pause/resume/list/delete; shareable URL).
- **Logs:** agent logs, browser-action logs, network-response logs (per session).
- **Executions:** logs, metadata, **artifacts** (downloadable, pre-signed URLs), **page-state
  snapshots**.
- **Live:** embedded **browser live-view** (interactive), **agent-step WebSocket** stream, screenshots.
- **Retries:** batch sessions have explicit `retry-failed`; per-task retry logic is otherwise not
  documented. Flaky-selector/page-drift handling is implied by the "revert to AI when required" thesis
  but **not specified** [gap].

**Lesson:** recordings + structured per-execution artifacts are table stakes for agent debugging.
Feather already has an SSE event stream; the gap is durable per-run artifacts (recording, page-state
snapshot, action log) you can replay after a failure.

---

## 9. Pricing & packaging analysis

> Numbers from `docs.anchorbrowser.io/pricing.md` (the marketing `/pricing` route 404'd). Treat exact
> figures as **as-observed 2026-06-06**, may drift.

**Subscription tiers:** Free ($5 credits, ≤5 concurrent) · Starter ($50/mo, ≤25) · Growth
($2,000/mo, ≤200) · Enterprise (custom, 500+). *(A "Team ~$500" tier appears on the landing page but
the docs pricing table shows Free/Starter/Growth/Enterprise — minor inconsistency.)*

**Usage metering (the real cost model):** browser **creation $0.01/instance**, browser **usage
$0.05/hour** (billed per-minute), **proxy bandwidth $8/GB**, **AI steps $0.01/step**. So Anchor charges
on **four axes: spin-ups, wall-clock browser time, proxy GB, and AI steps** — and AI steps being a
distinct line item is exactly *why* the "plan once, replay deterministically" pitch sells (deterministic
replay = $0 AI steps).

**What the gates reveal about perceived value:**

| Gated at | Feature | Signal |
|---|---|---|
| Starter+ | Authenticated browsers, captcha bypass, geolocation/proxy | Auth + basic evasion = paid-entry value |
| **Growth+** | **Full stealth solution, Cloudflare verified agents, custom proxy, multi-region, custom retention, SOC2/ISO/HIPAA/GDPR** | **Stealth + compliance are the premium tier** — i.e. aggressive anti-detection is sold as a high-end, gated capability, not a default |
| **Enterprise** | Unique fingerprinting, BYOC/on-prem, BAA/DPA/SSO/RBAC, customizable ZDR | Data-control & identity = top-end enterprise |

**Inference:** Anchor monetizes **reliability + auth at the low end, stealth + compliance at the high
end, and data sovereignty at the top.** The placement of "full stealth" behind the $2,000 tier tells
you they treat it as a liability-laden premium, not a commodity.

---

## 10. Feature ideas that could inspire a local-first implementation later

High-level only (per the brief — not designs, not roadmap):

1. **Plan-once / replay-deterministically workflows.** A saved, versioned, JSON-inspectable,
   parameterized "workflow" object authored by AI or by demonstration, replayed with **no LLM in the
   loop**; re-invoke the model only on detected page drift. *(Most valuable idea in the whole study.)*
2. **Record-by-demonstration → reusable tool.** Human does the task once in the real local browser;
   capture → generalize → replay. The most human-friendly authoring path, and it fits the Cookie-Mine
   "human teaches, agent reuses" ethos.
3. **Identity object + human-logs-in / agent-inherits separation.** Productize the
   CredentialsVault/Cookie-Mine intent: a stored local identity an agent attaches to, where the human
   authenticates and the agent never sees raw creds.
4. **Two-altitude SDK in one session.** A high-level `task(prompt)` *and* a low-level CDP/Playwright
   handle, interleavable — so deterministic and AI control coexist.
5. **Declared-bot posture (Web-Bot-Auth / RFC 9421).** Track the standard; a *declared* good-bot path
   is the sustainable long-term alternative to an arms-race on stealth.
6. **Minimal-CDP-surface as anti-detection hygiene.** Don't enable CDP runtime events (e.g. console)
   you don't need on the real path — cheap, responsible, and already a flagged Feather follow-up.
7. **Durable per-run artifacts.** Recording + page-state snapshot + action log per execution, for
   replay-after-failure debugging (extends Feather's SSE stream).
8. **MFA/OTP + human-in-the-loop as first-class event primitives.** "Agent blocks, asks human,
   resumes," and OTP/mailbox handling, as core flow control rather than an afterthought.
9. **"Local-first is inherently ZDR" as positioning.** Anchor sells Zero Data Retention as a premium
   add-on; a local-first browser never sends session data anywhere by construction.

---

## 11. Risk notes (legal, ethical, technical, ToS, abuse)

- **Stealth / anti-detection (high).** Anchor's strongest evasion claims are *marketing without
  mechanism*, gated to the $2,000 tier, and sit adjacent to **captcha solving** and a **Web Unlocker
  that explicitly markets bypassing bot protection.** These are the ToS/abuse-sensitive parts of the
  product. For Feather, the repo's existing framing holds the line: **anti-detection = user-authorized
  continuity / defensive, never stealth-for-malice** (`research/2026-06-05-anti-detection-self-test.md`,
  `project_security_and_agent_fidelity`). Do **not** import captcha-bypass / paywall-bypass framing.
- **Credential handling (high-sensitivity domain).** The Identity/OmniConnect model is attractive
  *because* it separates humans-hold-creds from agents-use-sessions — but anything touching stored auth
  is the highest-risk code per AGENTS.md and the prior security audit. Any local analog must be
  short-lived, heavily reviewed, and Vault-mediated.
- **Marketing-vs-docs gap (research integrity).** "Anchor Chromium" and "OmniConnect" are brand names
  absent from the docs; the 12X/80X/23X metrics are unverified self-reported numbers with no public
  benchmark entry. Don't quote Anchor's claims as technical fact anywhere in Feather docs.
- **Technical feasibility caveat.** Much of Anchor's value (unlimited parallel scale, ephemeral VMs,
  managed proxy pools, ~150-country egress) is **inherently cloud** and does **not** transfer to a
  local-first model. The transferable parts are *patterns* (determinism, identity, two-altitude
  control), not infrastructure.
- **Legal.** Proxy/geolocation + stealth + captcha-solving as a bundle invites jurisdiction- and
  site-ToS-specific legal exposure. Out of scope to resolve here; flagged.

---

## 12. Open questions for Roi

1. **Determinism layer — pursue the concept?** The "author once (AI or demo) → replay deterministically,
   re-invoke AI only on drift" pattern is the single most interesting idea. Worth a future spike to
   prototype locally (record → JSON workflow → replay)?
2. **Stealth depth.** Anchor gives almost no technical stealth substance. Are you satisfied that
   Feather's headful + minimal-CDP-surface + (optionally) declared-bot stack is the right posture, or do
   you want a deeper *empirical* anti-detection spike (the Xvfb/WebGL question from the self-test is
   still open and sudo-gated)?
3. **Web-Bot-Auth / RFC 9421.** Interested in the *declared good-bot* direction as a deliberate
   long-term stance (vs. pure stealth)? It's standards-based and defensible.
4. **Identity model vs. current Vault plan.** Should the Anchor Application→Identity→attach shape (and
   the OmniConnect human-logs-in flow) inform the CredentialsVault/Cookie-Mine design, or is that
   premature given Phase-4 sequencing?
5. **Scope.** This stayed research-only per the brief. Want any of §10 promoted into a `docs/specs` ADR
   or a Phase-5 input note — or keep it all as reference for now?

---

## 13. Source list (direct URLs)

**Primary — Anchor:**
- Landing: https://anchorbrowser.io/
- Docs index (machine-readable): https://docs.anchorbrowser.io/llms.txt
- Introduction: https://docs.anchorbrowser.io/introduction
- Pricing: https://docs.anchorbrowser.io/pricing
- Security / trust: https://docs.anchorbrowser.io/security · ZDR: https://docs.anchorbrowser.io/security/zdr-mode
- Stealth: https://docs.anchorbrowser.io/essentials/stealth
- Web-Bot-Auth: https://docs.anchorbrowser.io/advanced/cloudflare-web-bot-auth
- OmniConnect / embedded auth: https://docs.anchorbrowser.io/essentials/omniconnect
- Authenticated applications: https://docs.anchorbrowser.io/essentials/authenticated-applications
- Tasks: https://docs.anchorbrowser.io/advanced/tasks · Generate: https://docs.anchorbrowser.io/api-reference/tasks/generate-task
- Demonstrations: https://docs.anchorbrowser.io/advanced/demonstrations-api
- Web Unlocker: https://docs.anchorbrowser.io/api-reference/tools/web-unlocker
- MCP (hosted): https://docs.anchorbrowser.io/advanced/mcp · OSS: https://docs.anchorbrowser.io/advanced/mcp-open-source
- Recording / observability: https://docs.anchorbrowser.io/essentials/recording
- SDK quickstart: https://docs.anchorbrowser.io/quickstart/use-via-sdk
- OpenAPI: https://docs.anchorbrowser.io/openapi.yaml · Stainless: https://docs.anchorbrowser.io/openapi-stainless.yaml

**Primary — shipped SDK (inspected directly):**
- npm: `anchorbrowser@0.16.3` · repo: https://github.com/anchorbrowser/AnchorBrowser-SDK-Typescript
- Python: `anchorbrowser` (PyPI)
- LangChain tools: https://github.com/anchorbrowser/langchain-anchorbrowser

**Secondary / context:**
- WebArena (no Anchor entry found): https://webarena.dev/ · https://github.com/web-arena-x/webarena
- Third-party overviews (treat as non-authoritative): aiagentstore.ai/ai-agent/anchor-browser;
  o-mega.ai stealth/alternatives articles; deck.co Browserbase-alternatives.

---

## Appendix — methodology & provenance

- **Worktree probe:** `git worktree add -b crash/anchor-sdk-probe ../feather-anchor-probe`, then
  `npm pack anchorbrowser` (no install/run), `tar xzf`, and read `package/resources/*.d.ts` +
  `package/lib/browser.js`. All SDK claims in §3c/§7 are from that shipped artifact, not marketing.
- **Not done (honest gaps):** no Anchor API key → nothing executed against their service; stealth
  *mechanism* unverifiable from public docs; "Team" tier and exact metering may drift; AI-task output
  format, runtime-AI-fallback trigger, and per-task retry logic are undocumented.
- **Lightweight lens:** ships nothing into Feather. The probe artifacts (tarball, extracted package)
  are throwaway and were not committed; only this report and its companion probe-notes live on the
  crash branch. Knowledge, not weight.
</content>
</invoke>
