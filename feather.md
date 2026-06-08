# Feather

**Feather is a real web browser on your machine that your AI agents can drive — using your own
logged-in sessions — to run errands for you.**

Not a fake "robot" browser: real Chromium, your real warm profile. That is the core trick, and it is
also the main reason Feather is hard to detect — it *is* a real person's browser.

> This file is the front door. The three version roadmaps live in [`docs/roadmap/`](docs/roadmap/).
> The detailed phase/session/security-gate execution index is [`ROADMAP.md`](ROADMAP.md).

---

## The foundation (already built ✅)

- Open and control real Chromium sessions an agent drives, locally, over a small HTTP API
- Persistent (warm) **and** throwaway profiles, with locks so they don't collide
- Read pages (snapshot), pull structured data (extract), take screenshots
- Drive pages: click, type, press keys, wait for dynamic content to settle
- Debug bundles (trace/console/network) + a read-only event stream
- Structured logs with automatic password/credential redaction; per-session proxy; resource measurement
- **A warm primary profile, ready for agents** — the Cookie Mine basics already exist

---

## Where it's going: v1 → v2 → v3

| | The goal, one line | Status | Roadmap |
|---|---|---|---|
| **v1 — "It runs errands for me"** | Tell Feather a task → an agent navigates, figures out the steps, does it. Basic Claude-for-Chrome. | mostly there | [v1.md](docs/roadmap/v1.md) |
| **v2 — "It survives the scary sites"** | Agent works on locked-down, bot-detecting sites (LinkedIn, Instagram, portals) *as you*, safely, without getting blocked. | planned, native | [v2.md](docs/roadmap/v2.md) |
| **v3 — "The polished product"** | A nice daily-driver browser window + opening Feather to other tools. Lowest priority. | vision | [v3.md](docs/roadmap/v3.md) |

---

## How we build Feather — the one rule

**Native by default.** Features are built in Feather's own TypeScript. We read other open-source
projects as *recipe books*, not dependencies — learn the technique, cook our own version.

- **The open-source repos are recipe books, consulted per-feature** — not a shopping list. You don't
  decide "what to take from project X" until you're building the feature that needs it.
- **Buy a ready-made package only** when something is genuinely **hard / fast-moving /
  security-critical** and you'd hate to maintain it. Rare.
- **Letting outside tools drive Feather is v3, last** — it's the opposite of native, so it waits.
  That interop seam is already governed by [`adr-0006`](docs/specs/adr-0006-agent-interface-neutrality.md).

### The recipe books (what each is for)

| Project | License | We… | What we'd take |
|---|---|---|---|
| **Crawl4AI** | Apache 2.0 | **Port** (v1) | clean HTML→markdown logic |
| **Browser Use** | MIT | **Reference** | DOM-reading ideas; its CDP-attach belongs to v3 interop |
| **OpenHands** | MIT | **Reference** | architecture; MCP tool shape (v3) |
| **Maxun** | AGPL-3.0 | **Reference only — never copy code** | the workflow "recipe" DSL *idea*, re-built by hand |
| **fingerprint npm** | MIT | **Buy *if* needed** (v2) | `fingerprint-generator` / `-injector` — but the current stealth plan deliberately **verifies rather than spoofs** (a real browser already has a genuine fingerprint), so these may never be needed |

---

## The immediate next move is a *test*, not more planning

v1's whole point is the first real errand: an agent operating Instagram on a **throwaway** scratch
profile, with you in the loop for any CAPTCHA/verification. See [v1.md](docs/roadmap/v1.md).
