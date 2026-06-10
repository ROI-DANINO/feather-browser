# Feather (agent-driven) vs Claude for Chrome — head-to-head

Same 10 errands, same plain-English discipline, two harnesses:
- **Feather** (`../test_1/`): a Claude subagent driving **Playwright Chromium** via the Feather HTTP API
  (observe / act-by-ref / re-observe), on isolated profiles (disposable for E/M/H4, warmed `scratch` for
  H1/H2/H3). Run ~16:55–17:12.
- **Claude for Chrome** (`outputs/`): the Claude-for-Chrome extension driving **real system Chromium** on
  the **same `scratch` profile dir**, run manually by Roi ~15:47–18:47.

## Scorecard

| Task | Feather | Claude for Chrome | Same answer? |
|------|---------|-------------------|--------------|
| E1 HN top story | PASS | PASS | Different story (live drift) |
| E2 Tel Aviv weather | PASS (27°C) | PASS (25°C) | ~same, time drift |
| E3 playwright stars | PASS (90,664) | PASS (90,668) | ~same, +4 drift; both exact via title attr |
| M1 search "Feather Browser" | PASS — Google → GitLab "Feather Browser" | PASS — **DDG** → "Feather Client" (Minecraft) | **No — engine choice changed the answer** |
| M2 httpbin form | **PARTIAL** (503 bot-block) | **PASS** (echo confirmed) | **No — real-Chrome fingerprint got through** |
| M3 Everest elevation | PASS | PASS | Identical; both disambiguated Elevation |
| H4 multi-tab 3 facts | PASS 3/3 | PASS 3/3 | Same approach (wttr.in JSON) |
| H1 holiday → Calendar | PASS | PASS | Same holiday/date; C4C detected Feather's event |
| H2 Google → article | PASS | PASS | Same article; different link-handling tactic |
| H3 Instagram like+comment | **INCOMPLETE** (socket death) | **FAIL** (logged out) | **Neither completed — IG session lost** |

**Totals:** Feather **8 PASS / 1 PARTIAL / 1 INCOMPLETE**; Claude for Chrome **9 PASS / 1 FAIL**.

## The five findings that matter

### 1. Browser fingerprint decides bot-walls (M2) — input for the Stealth Stack (5d)
Identical errand, opposite outcome **purely from the browser build**. httpbin's CDN returned **503 to
Feather's Playwright Chromium** (even with `--disable-blink-features=AutomationControlled`) but served
**real system Chromium** normally. This is concrete evidence that Feather's automation fingerprint is
detectable and that the v2 Stealth Stack is load-bearing for "scary sites." (Mirror of M1, where a real/
headed path *helped* — same root cause, opposite sign.)

### 2. "The top result" is engine-relative (M1)
A free agent's **choice of search engine is itself a variable**. Feather went to Google and got the
GitLab "Feather Browser"; C4C chose DuckDuckGo (to dodge bot detection) and got "Feather Client" (a
Minecraft launcher). Both honest PASSes of *their* SERP, completely different answers. Any eval that
asks for "the top result" must pin the engine or accept engine-relative truth.

### 3. Aggressive automation cost us the Instagram session (H3) — the standout
During Feather's run (~17:11) the `scratch` Instagram session was **logged in** (a `Like→Unlike` flip is
in the transcript before the socket death). ~90 min later, the **same profile** opened in real Chromium
shows Instagram **logged out** — while **Google stayed logged in** (H1 worked in both). That asymmetry
points to **Instagram-specific session invalidation**, most plausibly triggered by Feather H3's
partially-failed inline like/comment activity tripping IG's anti-automation checkpoint. Direct evidence
for the v2 thesis: IG needs Stealth (5d) + MFA/human-handoff (5b) before agents act, or bare automation
burns the warmed session it depends on. **Action:** log into IG manually, check for a security notice.

### 4. The harnesses converge on strategy (E3, H4, M3, H2)
Given only the plain errand, both independently: reached past GitHub's rounded "90.7k" to the exact
`title` attribute; chose **wttr.in JSON** + programmatic parse for weather; disambiguated Everest's
*Elevation* from prominence/isolation; grounded the article summary in extracted text, not memory. The
errand + "truth not checkmarks" discipline transfers across harnesses — the *capability* is comparable;
the *plumbing* differs.

### 5. Different tool vocabularies, same loop
- **Feather:** structured `observe` (refs) / `extract` (recipes) / `snapshot` (markdown) — text-first;
  hit the "new-tab link, no `GET /tabs`" gap (H2) and the `ENOTEMPTY` teardown bug (E2/H4).
- **C4C:** `find` / `read_page` / **screenshot + zoom** (vision-first) / a **JavaScript tool** / `batch`;
  hit DOM-token-limit overflow on heavy pages (HN, Wikipedia) and a **per-site permission/approval**
  model (Wikipedia denied until added to the plan).
- Net: C4C leans on vision + JS eval and a planning/approval gate; Feather leans on structured DOM reads
  and token auth. Both run the same observe→act→verify loop.

## Cross-run side effects (real-world)
- **Duplicate calendar events:** Feather H1 and C4C H1 BOTH created "Rosh Hashana (Israeli Public
  Holiday)" all-day on Sep 12 2026 on the `roionly9` calendar → at least 2 copies now. **Cleanup owed.**
- **Instagram logged out** on the `scratch` profile (see finding #3).

## Honesty scorecard (both harnesses passed)
Neither faked a result. Feather produced a clean PARTIAL (M2 503) and an INCOMPLETE (H3 infra death);
C4C produced a clean FAIL (H3 logged out, refused to type credentials). Every non-PASS came with the
reason and the lesson — exactly the bar AGENTS.md sets.
