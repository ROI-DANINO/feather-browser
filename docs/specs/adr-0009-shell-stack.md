# ADR-0009 — Phase 4 Shell Stack: Tauri/WebKitGTK vs GTK4-Native (CANDIDATE — NOT Accepted)

- **Date:** 2026-06-05
- **Status:** 🚧 **PROPOSED — NOT ACCEPTED.** This ADR records an evidence-based
  **recommendation**, not a decision. The final shell-stack pick is a **joint human call**
  (Roi + agent) held for a working session — see *Recommendation* and *Open questions*.
- **Doc completeness:** ✅ **COMPLETE** for a decision-prep document (evidence gathered, both
  options evaluated on all six axes, recommendation made). What it does **not** include is an
  empirical spike on the target box — that prototype is the proposed next step, not done here.
- **Context phase:** ROADMAP Phase 4 Step 0 (Visual Desktop Shell — research + plan). This is
  the *implementation-stack* question ADR-0007 explicitly left open.
- **Related:** [[adr-0007-phase-4-shell-sequencing]] (sequencing + display model; says the stack
  is "active R&D, NOT decided"), [[adr-0004-runtime-target]] (host-primary, Flatpak eventual),
  [[adr-0003-hybrid-browser-shared-context]] (Cookie Mine — what the shell wraps),
  [[project_lightweight_engine_direction]] (lightness from architecture, not from swapping the engine).

---

## Context

Phase 4 wraps the stable Phase 3 headless core in a Zen-inspired visual desktop shell. ADR-0007
decided the *sequencing* (headed-Chromium stopgap now; painted-in seamless shell deferred to its
own phase) and the *display end-state* (one window, page painted in), but deliberately left the
**implementation stack** open: "Rust, Zig, GTK, Tauri, or something else… active R&D toward a
high-quality, featherweight result."

This ADR narrows that to the two candidates ROADMAP Phase 4 names — **Tauri (Rust + WebKitGTK)**
vs **GTK4-native** — and evaluates them **with evidence**. Two constraints are fixed going in:

1. **Electron stays ELIMINATED.** It bundles a second Chromium runtime; Feather's whole thesis
   is one shared engine + a thin shell ([[project_lightweight_engine_direction]]). Bundling
   Chromium twice is anti-Feather. Not reconsidered here.
2. **The shell does NOT render web content.** A Playwright-managed **system Chromium** is the
   browsing engine in *both* options. The shell is chrome (tabs, sidebar, command palette,
   session state from the SSE stream) plus — eventually — a surface that the page is painted
   into. Whatever WebView the shell toolkit ships (WebKitGTK for Tauri; none for GTK4-native)
   is for *Feather's own UI*, never for the web pages the user browses.

Target platform: **Linux / Fedora on Wayland** (the dev box runs the `niri` tiling compositor;
stock GNOME is the likely ship target). Host-primary runtime; Flatpak is the eventual
distribution sandbox (ADR-0004).

**The genuinely unresolved unknown** (flagged in ROADMAP and ADR-0007): *how does the shell sit
alongside / embed the external Chromium browser surface on Wayland?* This ADR's central job is to
surface that honestly for **both** candidates — and the finding below is that the browser-surface
answer is **largely the same for both**, which reshapes the whole comparison.

---

## The browser-surface-on-Wayland question (the crux)

This is the load-bearing finding, so it comes first. The short version: **on Wayland you cannot
"reparent" or embed a foreign top-level window into your own window the way X11 let you (XEmbed /
`XReparentWindow`). That capability was deliberately removed for security/isolation.** This is
true regardless of whether the shell is Tauri or GTK4 — it is a Wayland property, not a toolkit
property. So the embedding strategy is shared; the toolkit choice rides on top of it.

There are three real architectures, in increasing order of UX seamlessness and effort. They map
cleanly onto ADR-0007's display models.

### Option S1 — Separate Chromium window, compositor-tiled (= ADR-0007 "real-window" stopgap)

Chromium runs **headed** with `--ozone-platform=wayland` (already proven on the box per ADR-0007)
and shows its **own** top-level window. Feather's shell is a *separate* top-level window. The
compositor arranges them. ADR-0007 already verified this works and that under `niri` the app
**cannot self-place/size** its window (the compositor overrode requested geometry).

- The one cross-process positioning hook Wayland *does* offer is **`xdg-foreign`**
  (export/import a top-level handle) — but it only establishes **parent/child stacking
  relationships** (e.g. out-of-process dialogs, "set parent"), **not in-window embedding**. It
  cannot paint Chromium *inside* the shell's content area. So even with `xdg-foreign`, S1 stays a
  two-window UX.
- **Verdict:** lowest effort, zero added latency, but two windows — not the "feels like one
  browser" end-state. This is the stopgap, identical for Tauri and GTK4 (it barely involves the
  shell toolkit at all — the toolkit just draws Feather's own window).

### Option S2 — Nested Wayland compositor widget (the real embedding path; = ADR-0007 "painted-in")

The way you *actually* embed another process's window inside your own on Wayland is to **be a
Wayland compositor yourself** for that one widget: your app embeds a tiny nested compositor, hands
the child process a Wayland socket, and the child's surfaces render *inside* your widget. This is
the same trick ChromeOS's **Sommelier** uses and the same idea behind browser-style
multi-process compositing.

The decisive 2026 finding: this is now an **off-the-shelf GTK4 widget — `Casilda`** (Juan Pablo
Ugarte / GNOME; built on **wlroots**). Casilda 1.0 shipped 2025-09; **1.2.4 shipped 2026-04** with
fractional scaling, keyboard-layout forwarding, popup positioning, cursor-shape protocol, and
viewporter support — the maintainer says it now "feel[s] like a proper compositor." Critically for
the lightweight lens, Casilda **creates `GdkTexture`s directly from client dmabufs** and folds them
into GTK's scene graph at snapshot time — *zero-copy, GPU-path, "cuts all the middle men and extra
copies/uploads."* That is exactly the low-latency capture→paint pipeline ADR-0007 said the
painted-in shell would need to build — and it largely exists already.

- **For GTK4-native:** Casilda is a *native GTK4 widget*. You drop it into the window, point a
  headed Chromium at its socket, and Chromium renders inside the shell. Direct fit.
- **For Tauri:** Tauri's window *is* a GTK window underneath (TAO/GTK on Linux), and its content
  is a WebKitGTK WebView. Embedding Casilda means reaching **under** Tauri's abstraction to the
  raw GTK layer and placing a GTK widget next to / instead of the WebView. Doable (Tauri exposes
  the underlying `gtk::Window`/`ApplicationWindow`), but it is **off Tauri's happy path** — you
  are no longer building a "Tauri app", you are building a GTK app that Tauri launched. Much of
  Tauri's value (its JS↔Rust bridge, its WebView UI model) does not extend over the Casilda
  surface. *(Inference, flagged: this needs a spike to confirm how cleanly Casilda co-exists with
  a live WebKitGTK WebView in the same Tauri window — see Open questions.)*
- **Verdict:** This is the credible seamless path, and it is **substantially more GTK-native than
  Tauri-native.** Whoever builds S2 is writing GTK4 + wlroots glue regardless of the wrapper.

### Option S3 — Screencast + input-forward (headless Chromium, painted via CDP)

Chromium runs **headless**; the shell paints a live screencast (CDP `Page.startScreencast` or a
GPU frame path) and forwards input back. ADR-0007 describes this as a "real
capture→encode→transport→paint→input pipeline" — most effort, highest latency risk, most control.
Toolkit-agnostic (the shell just needs a surface to blit frames into and an input source). Listed
for completeness; S2 dominates it for a *local* single-machine shell because S2 avoids the
encode/transport hop entirely (dmabuf stays on the GPU).

### What this does to the Tauri-vs-GTK4 comparison

The browser surface — the hard, differentiating part — is **`Casilda` + wlroots + GTK4** in the
seamless case **no matter which wrapper wins.** Tauri does not make the browser-surface problem
easier; if anything it adds a layer to reach under. So the toolkit choice is really about the
**rest** of the shell (tabs, sidebar, palette, settings) and about *language/ecosystem fit* — the
browser surface is a wash that tilts slightly GTK-ward.

---

## Evaluation — the six axes

| Axis | Tauri (Rust + WebKitGTK) | GTK4-native (Rust-gtk4 or C/Vala/Python) |
|---|---|---|
| **Shipped weight / footprint** | ~3–10 MB app binary; **relies on system WebKitGTK-4.1** (not bundled host-side). RAM idle ~30–60 MB for the WebView. Tiny vs Electron. | No WebView runtime at all for Feather's own UI (GTK draws natively). Comparable or **smaller** resident footprint; GTK libs are already on a Fedora/GNOME box. |
| **Wayland browser-surface viability** | Same Casilda/wlroots path, reached **under** Tauri's GTK abstraction (off happy-path). | Same Casilda/wlroots path, **native** — Casilda *is* a GTK4 widget. Cleanest fit. |
| **Dev velocity** | High **for the UI chrome** — web tech (HTML/CSS/JS) for tabs/sidebar/palette is fast and themable; huge ecosystem; great for a "Zen-inspired" look. Drops off sharply once you leave the WebView for Casilda. | Slower for rich/animated UI (GTK CSS + widgets, less designer-friendly than web). But **no impedance mismatch** at the browser surface. Vala/Python keep iteration fast; Rust-gtk4 is more verbose. |
| **Language fit** | **Rust** core. Matches the one real fidelity win (precise input timing, see §Language strategy). Aligns with the wider Rust trend in this space. | Rust (gtk4-rs) *or* C/Vala/Python. Rust-gtk4 keeps the same language win; Vala/Python trade timing precision for velocity. Feather's existing core is **TypeScript/Node** — neither option reuses it for the shell. |
| **Security / process isolation** | WebKitGTK is **multi-process + sandboxed** (WebContent isolated, GPU process, IsoHeap) — but that protects *Feather's own UI WebView*, which renders **no untrusted web content** (Chromium does that, separately). So the WebKit sandbox is **largely irrelevant** to Feather's threat model; it's protecting a surface that only shows trusted local UI. WebKitGTK also carries its **own CVE stream** (multiple WSA-2026 advisories) — a dependency to patch for little benefit. | No second web engine ⇒ **one fewer untrusted-content engine and CVE stream** to track. Process isolation that *matters* (Chromium ⟂ Fastify hub ⟂ future vault) is achieved the same way in both: **separate OS processes**, not toolkit features (see §Process boundaries). |
| **Distribution (Flatpak, ADR-0004)** | Well-trodden: Tauri documents Flatpak/Flathub; GNOME runtime ships webkit2gtk-4.1. But Flathub Tauri apps sometimes must **build WebKitGTK in the manifest** (long builds) — friction from the WebView dependency. | GTK + GNOME runtime is the **native Flatpak case** — the runtime *is* GTK. Fewer moving parts. wlroots/Casilda must be vendored into the manifest in both cases (it's not in the GNOME runtime). |

---

## Embedded analysis 1 — Process boundaries vs "microservices"

**Roi's question:** microservices feel anti-Feather (weight + IPC overhead for a local
single-user tool) — but where do process boundaries actually earn their keep?

**Framing.** "Microservices" as a *distributed-systems architecture* (many network services,
service discovery, serialization tax on every call, ops overhead) **is** anti-Feather: it buys
horizontal scale and team independence that a single-user local desktop tool will never need, and
charges latency + complexity for it. Reject that. **But "process boundary" ≠ "microservice."** A
process boundary is an OS-enforced **memory + fault wall**, and a handful of them earn their keep
for **security and crash isolation** — the exact things a credential-handling browser-automation
tool must get right.

Map of where the wall **PAYS** vs where it's just **OVERHEAD** in Feather:

**PAYS (keep the boundary):**
- **Chromium ⟂ everything else.** Already true (Playwright manages a separate Chromium process).
  A renderer crash, a runaway page, or a compromised tab must **not** take down the Fastify hub or
  the shell. This wall is free (Chromium is its own process anyway) and load-bearing.
- **Vault ⟂ agent/page code (Phase 5, ADR-0008).** This is the canonical case. The
  `CredentialsVault` must hold raw secrets in memory that the **agent process never shares**, so a
  compromised agent or a page-injection bug **cannot read the address space** where plaintext
  creds live. ADR-0008's "no browser/page code ever gets raw vault access" is *enforced* by a
  process boundary, not just a code convention. This wall is **worth real IPC cost.**
- **Browsing engine ⟂ shell UI.** A hung/crashed browser surface shouldn't kill the user's tab
  list, command palette, or session state. Both candidate stacks get this for free because
  Chromium is already a separate process (and Casilda's child is a separate process by
  construction).

**OVERHEAD (do NOT add a boundary):**
- **Shell UI ⟂ SSE consumer ⟂ tab-state model.** These are one cooperating UI; splitting them
  into services buys nothing but serialization tax and latency. Keep in-process.
- **Hub internals (route handlers ⟂ SessionManager).** A local Fastify hub calling its own
  managers should be **in-process function calls**, not internal RPC. Today's monolith-hub is correct.
- **"One service per capability" reflex.** No. Add a process **only** when the wall buys a named
  security or fault-isolation property from the PAYS list — never for tidiness.

**Conclusion:** Feather's process map should be **deliberately small** — roughly *{shell+hub}*,
*{Chromium}*, and later *{vault}* / *{agent}* as Phase 5 introduces untrusted automation — with
walls placed **exactly** where a crash or a secret must not cross, and nowhere else. This is
**orthogonal to the Tauri-vs-GTK4 choice**: both achieve these boundaries with OS processes, not
toolkit features. The shell toolkit does not change the process map.

---

## Embedded analysis 2 — Language strategy

**Roi's question:** should Feather's controller be rewritten in a lower-level language for
stealth / weight / fidelity?

Three evidence-first conclusions, each with the counter-temptation it kills:

1. **Language is IRRELEVANT to stealth.** The website on the other end **only ever sees
   Chromium** — the same system Chromium, driven over CDP, regardless of whether the controller
   is Node, Rust, or Zig. Stealth is decided by Chromium's flags, fingerprint, and *behavioral
   signals* (timing, mouse paths), **not** by the controller's language. ADR-0007 already made the
   parallel point for the rendering pipeline ("latency is dominated by architecture, not
   language"). Evidence from the existing stack: the one load-bearing anti-detection measure is a
   **Chromium flag** (`--disable-blink-features=AutomationControlled` flipping
   `navigator.webdriver`), not anything in the Node controller (per `active.md` / `modes.ts`
   notes). ⇒ *Rewriting for stealth is a non-sequitur.*

2. **Language is MARGINAL to weight.** **Chromium dwarfs the controller.** A headed system
   Chromium is hundreds of MB resident; the Node controller and the shell binary are a rounding
   error beside it. Rewriting the controller in Rust might save single-digit MB against a
   multi-hundred-MB engine — the textbook definition of **YAGNI** for footprint. The lightweight
   lens (below) confirms weight is won at the *engine + shell-architecture* level, not the
   controller-language level. ⇒ *Rewriting for weight is premature optimization.*

3. **The ONE narrow real win is precise input-timing for behavioral fidelity.** Convincing
   human-like mouse/keystroke scheduling benefits from **lower-level, more deterministic timing**
   than Node's event loop comfortably gives — sub-millisecond, jitter-controlled input
   dispatch is easier in a systems language. This is real, but it is **narrow** (it touches the
   input-dispatch path, not the whole controller) and it is **Phase 5** (behavioral fidelity is a
   parked North-Star item, not a Phase 4 task).

**The convergence (the actual conclusion):** that one real win **arrives for free on the shell
decision.** If the shell pick brings Rust into the codebase (Tauri *requires* Rust; GTK4-native
*can* be Rust via gtk4-rs), then a precise-timing input module in Rust is a natural, incremental
addition **inside a stack Rust already lives in** — not a gut rewrite. So:

> **No speculative rewrite.** Let the **shell decision** and the **Phase-5 fidelity-timing need**
> drive any language addition, incrementally and where it pays. The TypeScript/Node core stays;
> Rust (if it comes) comes via the shell and is *then* available for the narrow timing module.

This is itself a mild point in **Tauri's / Rust-GTK4's** favor: either way of getting Rust into
the tree means the fidelity-timing win is already paid for.

---

## Lightweight lens (applied explicitly)

Per [[project_lightweight_engine_direction]], lightness comes from **architecture — one shared
engine + a thin shell — not from swapping the rendering engine.** Apply it directly:

- **Weight is actually *won* at this decision.** Footprint is dominated by the **single shared
  Chromium** (kept, not duplicated — that's the whole reason Electron is out) plus the shell.
  Once the engine is shared, the *shell* is the next-largest controllable lever — and both
  candidates here are **thin** (Tauri ~MBs reusing system WebKitGTK; GTK4-native reusing
  already-present GTK libs). Either way Feather stays far below an Electron-class footprint. **The
  big win is choosing a thin shell over a bundled-engine shell, which both candidates honor.**
- **The Tauri-vs-GTK4 footprint delta is second-order.** It's the difference between "tiny" and
  "tiny" — single-digit-to-low-tens of MB — against a hundreds-of-MB engine. Don't let footprint
  alone decide between the two; it's a tie-breaker, not a driver.
- **Watch the *hidden* weight:** Tauri's WebKitGTK is a **second web engine** in the dependency
  tree (its CVE stream, its Flathub build burden) that renders **only trusted local UI** —
  arguably weight with little payoff under the lightweight lens. GTK4-native avoids carrying a
  second web engine at all.

---

## Recommendation (NOT a decision — joint call)

**Lean: GTK4-native (Rust via gtk4-rs), with the browser surface built on `Casilda` + wlroots —
and a headed-Chromium *separate-window* (S1) stopgap shipping first per ADR-0007.**

Reasoning, in priority order:

1. **The hard part is GTK either way.** The seamless browser surface is `Casilda` (a GTK4 widget)
   + wlroots no matter which wrapper wins. Tauri makes you reach *under* its abstraction to get
   there; GTK4-native *is* there. Picking the stack whose happy-path **is** the differentiating
   surface beats picking one you have to fight.
2. **No second web engine.** Tauri's WebKitGTK renders only Feather's own trusted UI yet drags in
   a full web engine's CVE stream and Flathub build friction — weight with little payoff under the
   lightweight lens. GTK4-native carries none of that.
3. **Rust comes along anyway** (gtk4-rs), so the one real language win (Phase-5 input-timing
   fidelity) is still paid for — without Tauri's WebView baggage.
4. **Distribution is the native Flatpak case** (GNOME runtime *is* GTK), avoiding the
   "build WebKitGTK in the manifest" friction Tauri Flathub apps hit.

**The honest cost of this lean:** Tauri wins decisively on **dev velocity for the UI chrome** —
web tech (HTML/CSS/JS) makes a polished, animated, themeable "Zen-inspired" sidebar/palette far
faster to build and restyle than GTK widgets + GTK-CSS. If the team weights *time-to-a-beautiful-
shell* above *cleanest browser-surface path + no second engine*, **Tauri is the rational pick** —
and it remains fully viable. This is a genuine trade, which is why it's a joint call.

**Strength of evidence:** **Medium-high on architecture, low on the box.** The Wayland-embedding
reality (no foreign reparenting; nested-compositor is the path; Casilda exists and is GPU-zero-copy
and actively maintained into 2026), the footprint figures, the WebKitGTK process/CVE model, and
the Flatpak situation are all **documented and corroborated**. What is **not** yet tested is the
decisive integration on *this Fedora/Wayland box*: a Casilda widget with a real headed Chromium
rendering inside it, input forwarded, at acceptable latency — and (for Tauri) whether Casilda
co-exists cleanly with a live WebKitGTK WebView in one window. **That spike should gate
acceptance**, exactly as ADR-0007 said the painted-in pipeline is "a research-and-build effort in
its own right."

---

## Open questions for the joint session

1. **Spike-gated:** Does `Casilda` + headed system Chromium render acceptably (latency, input,
   scaling) on *this* Fedora/`niri`+GNOME box? This is the real gate; everything above is paper
   until this passes. *(Recommend: a small spike before locking either way.)*
2. **UI-velocity weighting:** how much does a fast-to-build, web-tech, beautifully-themeable shell
   chrome (Tauri's strength) matter against cleanest-surface + no-second-engine (GTK4's strength)?
   This is the crux of the trade and is a values call only Roi can make.
3. **Stopgap scope:** ship S1 (two-window, near-zero effort) for the whole of "prove the Cookie
   Mine loop" work, and treat S2/Casilda as the dedicated seamless-shell phase ADR-0007 already
   carved out? (Recommended: yes — don't block the agent-layer work on the surface pipeline.)
4. **Language within GTK4-native (if chosen):** gtk4-rs (keeps the Phase-5 timing win, more
   verbose) vs Vala/Python (faster iteration, gives up the timing precision). Defer until the
   surface spike settles.

---

## Consequences (if this lean is adopted)

- Phase 4 ships the **headed-Chromium two-window stopgap** (S1) immediately — no toolkit/`sudo`
  install needed for it (ADR-0007 already proved headed Chromium on Wayland). The Cookie-Mine
  end-to-end work proceeds on top without waiting on the shell.
- A **dedicated seamless-shell spike/phase** (per ADR-0007) opens with the Casilda + Chromium
  integration test as its gate. *That* is where the Tauri-vs-GTK4 commitment actually bites — and
  where the first `sudo` install (GTK4-dev / wlroots / Casilda, a Roi-run step) lands.
- This ADR stays **🚧 CANDIDATE** until that spike runs; the recommendation may flip if the spike
  shows Casilda-under-Tauri is clean *and* the team prizes UI velocity, or if Casilda fails to hit
  acceptable latency (which would push toward S1-for-longer or the S3 screencast path).
- Footprint stays Electron-eliminated and thin under **either** pick; the lightweight thesis is
  honored by sharing one Chromium, which both candidates do.
