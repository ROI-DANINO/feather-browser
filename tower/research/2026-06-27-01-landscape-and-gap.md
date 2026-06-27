# Strand 1 — Landscape + Gap: Where the Tower Bench Has a Niche

> Tower research loop, strand 1 of 5. Produced 2026-06-27 by an adversarially-verified Workflow
> (23 agents: 4 sweep angles over primary sources → 3-vote refutation of the load-bearing gap claims
> → synthesis). 72 landscape entries; 6 differentiation claims tested, 5 survived. Sweep on sonnet,
> verify + synthesis on opus. Plan of record: `docs/specs/2026-06-27-bench-reframe-and-research-loop-design.md`.

**The Tower reframe.** The Tower is the outward-facing bench that drives and scores *agentic browser tools* (not raw drivers, not cloud infra) over Feather's HTTP-only API, and grades how **detectable** (can it pass as human against real bot detectors?) and **exploitable** (can an attacker hijack it through page content?) each tool is — ideally including the **warmed authenticated session** ("Cookie Mine") condition. This document maps every adjacent benchmark, separates the genuinely-occupied territory from the open ground, and locks the niche from the gap claims that *survived* adversarial verification. The honest headline: the strongest single open cell is **authenticated/warmed-session detectability eval** (3/3 confirmed); the "multi-tool comparative" framing is real but **contested** and must be scoped to the *unified cross-axis* residual to be defensible.

---

## Landscape map

### 1. Academic / industry agentic-browser **task-success** benchmarks

| Name | What it tests | Axis | Self-host | Auth-session | Multi-tool | Gap vs Tower |
|---|---|---|---|---|---|---|
| WebArena ([arxiv.org/abs/2307.13854](https://arxiv.org/abs/2307.13854)) | 812 tasks on 6 self-hosted site clones | task-success | yes | no | no | No detectability/exploitability; synthetic sandboxes, no real detectors |
| VisualWebArena ([arxiv.org/abs/2401.13649](https://arxiv.org/abs/2401.13649)) | 910 visual-grounding tasks | task-success | yes | no | no | Pure task-success; orthogonal to Tower |
| BrowserGym + AgentLab ([arxiv.org/abs/2412.05467](https://arxiv.org/abs/2412.05467)) | Unified gym wrapper integrating many benches + agent frameworks | task-success | yes | no | **yes** | The occupied "multi-tool adapter for task-success" slot; applies the adapter *only* to task-success, never detectability/security |
| WorkArena / ++ ([arxiv.org/abs/2403.07718](https://arxiv.org/abs/2403.07718)) | 682+ enterprise ServiceNow tasks | task-success | yes | partial (fixed synthetic creds) | no | Auth is scaffold, not eval axis; no warmed real sessions |
| Mind2Web ([arxiv.org/abs/2306.06070](https://arxiv.org/abs/2306.06070)) | 2,350 offline tasks, cached snapshots | task-success | partial | no | no | Offline; no live sites/detectors |
| Online-Mind2Web ([arxiv.org/abs/2504.01382](https://arxiv.org/abs/2504.01382)) | 300 tasks on 136 live sites, WebJudge | task-success | no | no | no | Live but task-only; unauthenticated |
| Mind2Web-2 ([arxiv.org/abs/2506.21506](https://arxiv.org/abs/2506.21506)) | 130 long-horizon search/synthesis | task-success | no | no | no | Info-synthesis, not navigation |
| WebVoyager ([arxiv.org/abs/2401.13919](https://arxiv.org/abs/2401.13919)) | Live consumer-site tasks | task-success | no | no | no | Known shortcut weaknesses; no stealth |
| WebLINX ([arxiv.org/abs/2402.05930](https://arxiv.org/abs/2402.05930)) | 2,300 conversational nav tasks | task-success | no | no | no | Dialogue quality, offline replay |
| GAIA ([arxiv.org/abs/2311.12983](https://arxiv.org/abs/2311.12983)) | 466 general-assistant questions | task-success | no | no | no | Browsing is a minor tool |
| AssistantBench ([assistantbench.github.io](https://assistantbench.github.io/)) | 214 web-retrieval tasks | task-success | no | no | no | Answer-quality, not interaction |
| AgentBench ([arxiv.org/abs/2308.03688](https://arxiv.org/abs/2308.03688)) | 1,091 tasks, 8 envs | task-success | partial | no | no | Grades the LLM backbone, not the browser tool |
| WebGames ([arxiv.org/abs/2502.18356](https://arxiv.org/abs/2502.18356)) | 53 hermetic challenges | task-success | yes | no | no | Hermetic → detectability impossible by design |
| TheAgentCompany ([arxiv.org/abs/2412.14161](https://arxiv.org/abs/2412.14161)) | 175 pro tasks, agents log into synthetic internal tools | task-success | yes | **yes (synthetic)** | no | Closest "logged-in" precedent — but synthetic creds, no warmed real cookies, no detectability |

*All entries above: primary sources.*

### 2. Bot-detection benchmarks / detector aggregators / stealth comparisons

| Name | What it tests | Axis | Self-host | Auth-session | Multi-tool | Gap vs Tower |
|---|---|---|---|---|---|---|
| Ian Paterson 2026 ([ianlpaterson.com/blog/anti-detect-browser-benchmark…](https://ianlpaterson.com/blog/anti-detect-browser-benchmark-patchright-nodriver-curl-cffi/)) *(primary)* | 7 stealth **drivers** × 31 targets × 3 runs = 651 verdicts (ok/gated/blocked/error) | detectability | no | no | yes | **Has harness code** (verification corrected the original claim); tests *raw drivers*, not the agentic layer; cloud detectors, not self-hostable; no auth |
| techinz/browsers-benchmark ([github.com/techinz/browsers-benchmark](https://github.com/techinz/browsers-benchmark)) *(primary)* | 10+ **driver** engines vs Cloudflare/DataDome/Kasada/Akamai/Imperva/PerimeterX, CreepJS scores | detectability | yes | no | yes | The only multi-tool driver-detectability bench; **no LLM agent layer**, no auth, no exploitability axis |
| browser-use/benchmark (Stealth Bench V1) ([github.com/browser-use/benchmark](https://github.com/browser-use/benchmark)) *(primary)* | 71 anti-bot sites; tests **cloud providers**; LLM judge | mixed | partial | **no ("No auth")** | yes | Cloud providers not driver/agentic tools; vendor-run; stealth secondary to task-success |
| Dima Kynal (Medium) ([medium.com/@dimakynal/…](https://medium.com/@dimakynal/baseline-performance-comparison-of-nodriver-zendriver-selenium-and-playwright-against-anti-bot-2e593db4b243)) *(secondary)* | 4 drivers × 4 anti-bots | detectability | no | no | no | Thin point-in-time study; raw drivers |
| James Stanley survey 2026 ([incoherency.co.uk/blog/stories/stealth-browser-survey-april-2026.html](https://incoherency.co.uk/blog/stories/stealth-browser-survey-april-2026.html)) *(primary)* | 11 hosted services, signal-level (TLS+JS) | detectability | no | no | no | Hosted services, one-off, no auth — all 11 detectable |
| FP-Agent ([arxiv.org/abs/2605.01247](https://arxiv.org/abs/2605.01247)) *(primary)* | Fingerprints **7 real agentic agents** + humans on a honey site; XGBoost classifier; detects all 7 where Cloudflare caught 1 | detectability | partial | no | yes | Closest detectability peer to Tower; grader is authors' **own classifier**, not live detectors; one-shot study, not reusable harness; no auth/security |
| Roundtable bot-benchmark ([research.roundtable.ai/bot-benchmarking](https://research.roundtable.ai/bot-benchmarking/)) *(secondary)* | 5 detectors vs scripts/automation/**AI agents** | detectability | no | no | no | Grades detectors, not tools (inverted); but *does* score agents → weakens "FP-Agent is sole comparable" |
| rebrowser-bot-detector ([github.com/rebrowser/rebrowser-bot-detector](https://github.com/rebrowser/rebrowser-bot-detector)) *(primary)* | 9 CDP-leak diagnostics | detectability | yes | no | no | Single-tool diagnostic — good Tower *level*, not a harness |
| fpscanner ([github.com/antoinevastel/fpscanner](https://github.com/antoinevastel/fpscanner)) *(primary)* | ~21 fingerprint/bot signals, JA4-style ID | detectability | yes | unknown | no | Good self-hostable level; no multi-tool tables |
| FingerprintJS BotD ([github.com/fingerprintjs/BotD](https://github.com/fingerprintjs/BotD)) *(primary)* | ~40 client-side signals, MIT | detectability | yes | no | no | Embeddable level; maintenance-mode; single-tool |
| CloakBrowser test runner ([github.com/CloakHQ/CloakBrowser](https://github.com/CloakHQ/CloakBrowser)) *(primary)* | Self-test vs 6 public detectors | detectability | partial | no | no | Self-test for one tool; useful target inventory |
| bot.sannysoft.com ([bot.sannysoft.com](https://bot.sannysoft.com/)) *(secondary)* | Classic Selenium/headless tells, frozen ~2019 | detectability | yes | no | no | Trivial baseline level only |
| HUMAN Security 2026 report ([humansecurity.com/…/2026-state-of-ai-traffic…](https://www.humansecurity.com/learn/resources/2026-state-of-ai-traffic-cyberthreat-benchmarks/)) *(secondary)* | Threat-intel: agentic traffic in account pages (8.82%) + auth flows (4.95%) | detectability | no | **yes (evidence)** | no | Not a harness — but the **evidence anchor** that warmed-session agentic traffic is real at scale |

### 3. Agent-security / prompt-injection benchmarks

| Name | What it tests | Axis | Self-host | Auth-session | Multi-tool | Gap vs Tower |
|---|---|---|---|---|---|---|
| AgentDojo ([arxiv.org/abs/2406.13352](https://arxiv.org/abs/2406.13352)) | Indirect injection, 97 tasks/629 cases, **simulated tool calls** | security | yes | no | no | No real browser; tests planner layer Tower abstracts toward the tool |
| InjecAgent ([arxiv.org/abs/2403.02691](https://arxiv.org/abs/2403.02691)) | IPI, 1,054 cases, mocked APIs | security | yes | no | no | Abstract; no browser |
| Agent Security Bench ([github.com/agiresearch/asb](https://github.com/agiresearch/asb)) | Broad attack taxonomy, abstract tools | security | yes | no | no | No live browser, no tool-layer variable |
| WASP ([arxiv.org/abs/2504.18575](https://arxiv.org/abs/2504.18575)) | Real-browser (Playwright) IPI, 84 tasks; attacks succeed ≤86% | security | yes | no | no | Real browser but tool is fixed/invisible; varies the LLM, not the tool; no auth |
| BrowserART ([github.com/scaleapi/browser-art](https://github.com/scaleapi/browser-art)) | 100 harmful browser tasks, 40 synthetic sites | security | yes | no | no | Harmful-behavior axis; varies backbone not tool |
| AdvWeb ([arxiv.org/abs/2410.17401](https://arxiv.org/abs/2410.17401)) | Adversarial HTML injection vs VLM agents | security | partial | unknown | no | Attack technique, not a comparative harness |
| RedTeamCUA ([github.com/OSU-NLP-Group/RedTeamCUA](https://github.com/OSU-NLP-Group/RedTeamCUA)) | CIA-triad IPI, hybrid web-OS, 864 cases; ≤50% ASR | security | yes | no | no | Varies the CUA model, not the browser tool; envs reset |
| MUZZLE + The Zoo ([arxiv.org/abs/2602.09222](https://arxiv.org/abs/2602.09222)) | Adaptive red-team driving **real** browser-use + Agent-E vs self-hostable multi-app sandbox **with auth creds** | security | yes | **yes** | no | **Most Tower-adjacent security work**; 2 tools as scaffolds not an N-tool adapter; no detectability; auth present but not the studied variable |
| DoomArena ([github.com/ServiceNow/DoomArena](https://github.com/ServiceNow/DoomArena)) | Plug-in attacks into BrowserGym/OSWorld | security | yes | no | no | Pluggable dimension is envs+attacks, not the tool |
| SecureWebArena ([arxiv.org/abs/2510.10073](https://arxiv.org/abs/2510.10073)) | 6 attack vectors, 2,970 trajectories, 9 LVLMs | security | unknown | no | no | Varies the LVLM, not the tool |
| ST-WebAgentBench ([arxiv.org/abs/2410.06703](https://arxiv.org/abs/2410.06703)) | Policy-compliance (CuP), **built on BrowserGym** | security | yes | no | no | Compliance ≠ exploitability; refutes "BrowserGym leaves security entirely open" |
| SafeArena ([arxiv.org/abs/2503.04957](https://arxiv.org/abs/2503.04957)) | 250 harmful task pairs | security | yes | no | no | Misuse, not injection |
| Agent-SafetyBench / AgentHarm / OS-Harm / AgentDyn / b3 ([genai.owasp.org](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/) for taxonomy) | Safety/harm/backbone resilience | security | mixed | no | no | All above the browser-tool layer |
| WebTrap Park (Fudan 2026) ([arxiv.org/abs/2601.08406](https://arxiv.org/abs/2601.08406)) | 1,226 tasks, **4 real frameworks** (Browser Use, Skyvern, Agent-E, SeeAct), 3 threat categories, Docker | security | yes | no | **yes** | Closest multi-tool security harness; **zero detectability**, no auth/warmed sessions |

### 4. Commercial eval products + authenticated/warmed-session niche

| Name | What it tests | Axis | Self-host | Auth-session | Multi-tool | Gap vs Tower |
|---|---|---|---|---|---|---|
| BrowserBench (Halluminate) ([github.com/Halluminate/BrowserBench](https://github.com/Halluminate/BrowserBench)) | Stealth-failure of **cloud infra providers**, 292 tasks | detectability | yes | no | yes | Infra providers not driver/agentic tools; no auth; no security |
| Browser-Use Stealth Bench ([browser-use.com/posts/stealth-benchmark](https://browser-use.com/posts/stealth-benchmark)) | 6 cloud providers, 71 sites; **vendor-run** | detectability | partial | **no** | yes | Not neutral; cloud providers only; no auth |
| WebBench (Halluminate) ([halluminate.ai/blog/benchmark](https://www.halluminate.ai/blog/benchmark)) | 2,454 tasks/452 sites, 7 setups; **includes cold login** | task-success | unknown | **yes (cold)** | yes | Authors self-name the **pre-logged-in (warmed) gap**; no detectability/security |
| WebSP-Eval ([arxiv.org/abs/2604.06367](https://arxiv.org/abs/2604.06367)) | 200 security/privacy *tasks*, sockpuppet auth, real live sites | task-success | yes | **yes (cold)** | no | Closer real-auth precedent than TheAgentCompany; varies the model; sessions cold, not human-warmed; no detectability |
| Browserbase Evaluations ([browserbase.com/evaluations](https://www.browserbase.com/evaluations)) | WebVoyager/OnlineMind2Web on own infra | task-success | no | no | no | No detectability/security; not neutral |
| Stagehand Evals ([docs.stagehand.dev/v3/basics/evals](https://docs.stagehand.dev/v3/basics/evals)) | Stagehand primitives, model compare | task-success | yes | no | no | Single-tool, task-only |
| LangSmith / Braintrust / Arize / Galileo ([braintrust.dev/articles](https://www.braintrust.dev/articles)) *(secondary)* | LLM observability/output quality | other | partial | no | no | Different eval surface entirely |
| agentcookie ([github.com/mvanhorn/agentcookie](https://github.com/mvanhorn/agentcookie)) | Syncs human session state → agent ("Cookie Mine" infra) | other | yes | no | no | **Infra implementing the pattern**; nobody measures the detectability/value delta it produces |
| Anchor Browser ([docs.anchorbrowser.io/…/authentication-and-identity](https://docs.anchorbrowser.io/essentials/authentication-and-identity)) | Persistent warmed-session product | other | no | no | no | Provides warmed sessions; publishes no eval of how it changes detectability |
| OpenCaptchaWorld ([github.com/MetaAgentX/OpenCaptchaWorld](https://github.com/MetaAgentX/OpenCaptchaWorld)) | Whether agents *solve* CAPTCHAs | other | yes | no | yes | Inverted direction (defeat vs look-human); complementary, not substitute |
| AgentDojo (sim) / mCaptcha ([github.com/mCaptcha/mCaptcha](https://github.com/mCaptcha/mCaptcha)) | PoW CAPTCHA | other | yes | no | no | Negative example — PoW grades compute, not human-likeness |

---

## What is occupied

- **Task-success on web agents is fully saturated.** WebArena, VisualWebArena, Online-Mind2Web, WorkArena, TheAgentCompany, WebLINX, WebGames, AssistantBench, GAIA, AgentBench, Mind2Web-2 leave no room. **BrowserGym/AgentLab** owns the *multi-tool adapter for task-success* slot. Do not enter here.
- **Single-tool / driver-layer stealth checks are well covered.** techinz/browsers-benchmark, Ian Paterson 2026, James Stanley's survey, plus self-hostable diagnostics (rebrowser-bot-detector, fpscanner, BotD, CreepJS, brotector) cover *raw drivers and cloud providers* against real detectors. Verification confirmed the "live-detector-as-grader reusable harness" pattern **already exists** — just applied to drivers, not the agentic LLM layer.
- **Abstract/simulated prompt-injection sandboxes are dense.** AgentDojo, InjecAgent, ASB, AgentDyn, b3 occupy the planner layer. Real-browser injection is held by WASP, RedTeamCUA, SecureWebArena, and — most tellingly — **WebTrap Park** and **MUZZLE**, which already drive *multiple real frameworks* with objective graders (MUZZLE even with auth creds). The Juice-Shop-for-agents victim sandbox gap is **filled** (The Zoo).
- **Warmed-session infra is a commodity.** Anchor, Browserbase Contexts, Steel Profiles, agentcookie all ship it. WebBench includes cold login and *names the pre-warmed gap itself*.

---

## The differentiated niche

Two candidate bets, rated against what survived adversarial verification.

### Bet A — Authenticated / warmed-session detectability eval (the "Cookie Mine" axis)
**Rating: CONFIRMED-OPEN.**

This is the strongest ground. The claim *"every existing stealth benchmark excludes authenticated/warmed sessions, while HUMAN Security 2026 documents agentic traffic operating inside logged-in sessions at measurable scale"* survived **3/3 confirmed** ([browser-use.com/posts/stealth-benchmark](https://browser-use.com/posts/stealth-benchmark) explicitly says "No auth"; [research.roundtable.ai/bot-benchmarking](https://research.roundtable.ai/bot-benchmarking/) tests anonymous forms only; [humansecurity.com/…/2026-state-of-ai-traffic](https://www.humansecurity.com/learn/resources/2026-state-of-ai-traffic-cyberthreat-benchmarks/) quantifies account-page 8.82% / auth-flow 4.95% agentic traffic). No public stealth benchmark scores an agent's detectability *while it rides a warmed, logged-in session via session-lifecycle behavioral signals* — the exact vector HUMAN says detectors are pivoting to.

**Required honesty tightening** (all three confirming votes demanded it): say *"no **open** stealth benchmark covers the authenticated-session layer; the detection side covers it only via proprietary ATO/behavioral-biometrics products (BioCatch, Sardine, GeeTest)"* — not "zero existing coverage." And drop "explicitly excludes" → the benches are *stateless by construction*. Position explicitly against the crowded anti-detect-browser substrate (Multilogin, GoLogin, AdsPower) which warms profiles but only benchmarks *fingerprint*, never warmed-session detectability. The narrow, defensible core: **agents driving real-world human-warmed persistent-cookie sessions, scored for detectability — has no published eval baseline.**

### Bet B — Comparative multi-tool detectability **+** security in one neutral harness
**Rating: CONTESTED → defensible only as the *unified cross-axis* residual.**

The broad framing **did not survive**. The claim *"BrowserGym leaves detectability and security entirely open; no multi-tool harness compares [these 6 tools]"* was **refuted (2/2 refuted, 1 confirmed-with-caveats)**: FP-Agent already compares 7 agentic tools on detectability ([arxiv.org/abs/2605.01247](https://arxiv.org/abs/2605.01247)); ST-WebAgentBench (security) is *built on BrowserGym* ([arxiv.org/abs/2410.06703](https://arxiv.org/abs/2410.06703)); techinz compares Playwright+nodriver on detectability. "Entirely open" is false. Likewise the "no reusable open-source harness" claim was **contested** — Ian Paterson *does* ship harness code, and browser-use/benchmark is a closer agentic-layer precedent.

What **survives** is narrower but real, and is the only honest version of Bet B:
1. **No single harness unifies the two axes** — detectability (real-detector-graded) **and** exploitability (objective attack success) — across **N arbitrary agentic tools via one common adapter.** The two families live in entirely separate, non-overlapping projects (FP-Agent/techinz on one side; WebTrap Park/MUZZLE on the other). Confirmed across all four sweep angles.
2. **Detectability of the agentic-framework *behavioral* layer** (LLM pacing, DOM-observation-loop timing, tool-call cadence) is under-scored. The claim survived **2/1 confirmed**, with the mandatory caveat that FP-Agent *does* fingerprint browser-use+Skyvern behaviorally — but via the authors' own classifier and using typing/mouse/scroll signals, **not** the LLM-decision-cadence signals, and not as a reusable harness. Reframe from "none evaluate the agentic layer" → "**none evaluate its detectability via a reusable harness that isolates the agentic-loop signal from driver/infra confounds.**"
3. **Neutrality.** Every existing comparative stealth bench is vendor-run (Browser-Use grades itself first) or one-off personal research with no neutral N-tool adapter. A neutral, open harness at the *driver-tool-in-an-agent-workflow* layer is unbuilt.

---

## Refuted / contested claims (honesty pass)

| Original gap claim | Verdict | Who occupies it / why it failed |
|---|---|---|
| "No benchmark uses real production detectors as graders for agentic tools; FP-Agent is the sole comparable work" | **CONTESTED** (1 refuted, 2 uncertain) | The live-detector-as-grader *reusable harness* pattern already exists — techinz/browsers-benchmark ([github.com/techinz/browsers-benchmark](https://github.com/techinz/browsers-benchmark)) uses live Cloudflare/DataDome/Kasada; Roundtable ([research.roundtable.ai](https://research.roundtable.ai/bot-benchmarking/)) scores AI agents against partly-live detectors — so "sole comparable" is false. Defensible residual: live **edge** detectors × **agentic** tools × **reusable** harness. |
| "BrowserGym leaves detectability AND security entirely open; no multi-tool harness compares Playwright/browser-use/Stagehand/Skyvern/Feather/nodriver" | **REFUTED** (2 refuted, 1 confirmed) | FP-Agent (detectability, browser-use+Skyvern), ST-WebAgentBench (security, built *on* BrowserGym — [github.com/segev-shlomov/ST-WebAgentBench](https://github.com/segev-shlomov/ST-WebAgentBench)), techinz (Playwright+nodriver detectability). "Entirely open" overstated; listing Feather (own tool) makes "no harness compares these exact 6" tautological. Survives only as the *unified cross-axis* harness. |
| "Warmed-session eval is unoccupied; TheAgentCompany is the closest precedent" | **CONTESTED** (1 refuted, 1 confirmed) | WebBench ([halluminate.ai/blog/benchmark](https://www.halluminate.ai/blog/benchmark)) and WebSP-Eval ([arxiv.org/abs/2604.06367](https://arxiv.org/abs/2604.06367)) are nearer — real-site auth, real accounts. But both use **cold** login, not human-warmed sessions, and neither scores detectability. Residual (warmed-human-cookie *as a stealth vector*) survives. |
| "No reusable open-source harness drives >1 agentic tool against self-hostable detectors; Ian Paterson has no harness code" | **CONTESTED** (1 refuted, 1 confirmed) | **Factual error corrected: Paterson ships a full harness** (`bench.py`, classifier, ~80 tests — [github.com/ianlpaterson/anti-detect-browser-bench]). browser-use/benchmark is a closer agentic-layer harness. Residual: heterogeneous **agentic frameworks** × **self-hostable** detectors in one neutral run — genuinely unoccupied. |
| "None evaluate the agentic-framework behavioral layer" | **CONFIRMED w/ caveat** (2 confirmed, 1 refuted) | FP-Agent *does* behaviorally fingerprint browser-use+Skyvern. Reword to "none score its **detectability** via a reusable harness isolating the agentic-loop signal." |

---

## Recommendation

**Lock the niche as: a neutral, open, self-hostable harness that scores N agentic browser tools on detectability — with the warmed/authenticated session as a first-class, primary eval axis — and exploitability as a co-equal second axis in the same run.** Lead with **Bet A (warmed-session detectability)** as the headline differentiator (the only 3/3-confirmed cell), and frame **Bet B** as the *unification* contribution (two siloed axes + N-tool neutral adapter), never as "an empty axis."

**Closest competitors to differentiate against — name them explicitly in the bench's own framing:**
- **FP-Agent** ([arxiv.org/abs/2605.01247](https://arxiv.org/abs/2605.01247)) — detectability of real agentic tools. Differentiator: *outsourced real/self-hostable detectors as grader (not a bespoke classifier) + reusable harness + warmed sessions.*
- **techinz/browsers-benchmark** ([github.com/techinz/browsers-benchmark](https://github.com/techinz/browsers-benchmark)) — multi-tool live-detector harness. Differentiator: *agentic LLM layer + auth + exploitability.*
- **MUZZLE / WebTrap Park** ([arxiv.org/abs/2602.09222](https://arxiv.org/abs/2602.09222), [arxiv.org/abs/2601.08406](https://arxiv.org/abs/2601.08406)) — multi-tool real-browser security. Differentiator: *detectability axis + warmed session as the studied variable + pluggable N-tool adapter (not 2–4 fixed scaffolds).*
- **WebBench** ([halluminate.ai/blog/benchmark](https://www.halluminate.ai/blog/benchmark)) — names the pre-warmed gap itself. Differentiator: *we measure that gap; they cold-login.*

**What Strand 2 (scoring methodology) should therefore focus on:** *how to score the warmed-session detectability delta — the measurable difference in real/self-hostable-detector verdicts between a human-warmed authenticated session and a cold session — across N agentic tools through one common adapter, while isolating the agentic-loop behavioral signal from driver- and infra-level fingerprint confounds.*

---

## Sources

**Primary — task-success benchmarks:** [WebArena](https://arxiv.org/abs/2307.13854) · [VisualWebArena](https://arxiv.org/abs/2401.13649) · [BrowserGym+AgentLab](https://arxiv.org/abs/2412.05467) · [WorkArena](https://arxiv.org/abs/2403.07718) · [Mind2Web](https://arxiv.org/abs/2306.06070) · [Online-Mind2Web](https://arxiv.org/abs/2504.01382) · [Mind2Web-2](https://arxiv.org/abs/2506.21506) · [WebVoyager](https://arxiv.org/abs/2401.13919) · [WebLINX](https://arxiv.org/abs/2402.05930) · [GAIA](https://arxiv.org/abs/2311.12983) · [AssistantBench](https://assistantbench.github.io/) · [AgentBench](https://arxiv.org/abs/2308.03688) · [WebGames](https://arxiv.org/abs/2502.18356) · [TheAgentCompany](https://arxiv.org/abs/2412.14161)

**Primary — detectability / stealth:** [Ian Paterson 2026](https://ianlpaterson.com/blog/anti-detect-browser-benchmark-patchright-nodriver-curl-cffi/) + [harness repo](https://github.com/ianlpaterson/anti-detect-browser-bench) · [techinz/browsers-benchmark](https://github.com/techinz/browsers-benchmark) · [browser-use/benchmark](https://github.com/browser-use/benchmark) · [browser-use Stealth Bench post](https://browser-use.com/posts/stealth-benchmark) · [James Stanley survey 2026](https://incoherency.co.uk/blog/stories/stealth-browser-survey-april-2026.html) · [FP-Agent](https://arxiv.org/abs/2605.01247) · [rebrowser-bot-detector](https://github.com/rebrowser/rebrowser-bot-detector) · [fpscanner](https://github.com/antoinevastel/fpscanner) · [FingerprintJS BotD](https://github.com/fingerprintjs/BotD) · [CloakBrowser](https://github.com/CloakHQ/CloakBrowser) · [bot.sannysoft.com](https://bot.sannysoft.com/)

**Primary — agent-security:** [AgentDojo](https://arxiv.org/abs/2406.13352) · [InjecAgent](https://arxiv.org/abs/2403.02691) · [ASB](https://github.com/agiresearch/asb) · [WASP](https://arxiv.org/abs/2504.18575) · [BrowserART](https://github.com/scaleapi/browser-art) · [AdvWeb](https://arxiv.org/abs/2410.17401) · [RedTeamCUA](https://github.com/OSU-NLP-Group/RedTeamCUA) · [MUZZLE / The Zoo](https://arxiv.org/abs/2602.09222) · [DoomArena](https://github.com/ServiceNow/DoomArena) · [SecureWebArena](https://arxiv.org/abs/2510.10073) · [ST-WebAgentBench](https://arxiv.org/abs/2410.06703) · [SafeArena](https://arxiv.org/abs/2503.04957) · [Agent-SafetyBench](https://github.com/thu-coai/Agent-SafetyBench) · [AgentHarm](https://arxiv.org/abs/2410.09024) · [OS-Harm](https://github.com/tml-epfl/os-harm) · [AgentDyn](https://arxiv.org/abs/2602.03117) · [CVE-Bench](https://arxiv.org/abs/2503.17332) · [OWASP Top 10 Agentic 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/) · [WebTrap Park](https://arxiv.org/abs/2601.08406)

**Primary — commercial / warmed-session:** [BrowserBench (Halluminate)](https://github.com/Halluminate/BrowserBench) · [WebBench (Halluminate)](https://www.halluminate.ai/blog/benchmark) · [WebSP-Eval](https://arxiv.org/abs/2604.06367) · [Browserbase Evaluations](https://www.browserbase.com/evaluations) · [Stagehand Evals](https://docs.stagehand.dev/v3/basics/evals) · [agentcookie](https://github.com/mvanhorn/agentcookie) · [Anchor Browser auth docs](https://docs.anchorbrowser.io/essentials/authentication-and-identity) · [OpenCaptchaWorld](https://github.com/MetaAgentX/OpenCaptchaWorld) · [mCaptcha](https://github.com/mCaptcha/mCaptcha) · [ST-WebAgentBench repo](https://github.com/segev-shlomov/ST-WebAgentBench)

**Secondary:** [Roundtable bot-benchmark](https://research.roundtable.ai/bot-benchmarking/) · [Dima Kynal (Medium)](https://medium.com/@dimakynal/baseline-performance-comparison-of-nodriver-zendriver-selenium-and-playwright-against-anti-bot-2e593db4b243) · [HUMAN Security 2026 report](https://www.humansecurity.com/learn/resources/2026-state-of-ai-traffic-cyberthreat-benchmarks/) · [Kameleo (vendor)](https://kameleo.io/blog/the-best-headless-chrome-browser-for-bypassing-anti-bot-systems) · [LangSmith/Braintrust/Arize/Galileo](https://www.braintrust.dev/articles) · [Castle.io anti-detect evolution](https://blog.castle.io/from-puppeteer-stealth-to-nodriver-how-anti-detect-frameworks-evolved-to-evade-bot-detection/) · [Sardine bot detection](https://www.sardine.ai/bot-detection)
