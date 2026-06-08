# Session — v1→v2→v3 roadmap restructure + open-source doctrine (2026-06-08 03:55)

## What this session was

Started as the planned tight "open-source integration doctrine" reconciliation pass (brainstorm-first).
Mid-session Roi surfaced the real need: he'd lost track of *what he's building* across a pile of
scattered plans. The session pivoted from "write a doctrine memo" to **re-grounding the whole product
as v1 → v2 → v3** and reorganizing the docs around that — then closed the original doctrine deliverable
on top of the new structure.

## Done this session

**1. Re-grounded the product (the actual win).** Pulled every scattered planned feature into one plain
picture and stacked them into three versions Roi approved:
- **v1 "It runs errands for me"** — agent navigates/reasons/acts (basic Claude-for-Chrome) on normal
  sites + a first careful Instagram try on a throwaway profile. Mostly already built.
- **v2 "It survives the scary sites, safely"** — Cookie Mine payoff; carries the security-first spine
  (gate → Identity → MFA → warmed attach → Stealth last) + behavioral learning + action cache.
- **v3 "The polished product"** — visual shell + ecosystem interop (absorbs old 4a.7). Lowest priority.

**2. Wrote the new doc structure (docs-only):**
- `feather.md` — front door: one-sentence definition, foundation-already-built, v1/v2/v3 table, the
  one build rule, and the recipe-book disposition table (with the fingerprint footnote).
- `docs/roadmap/v1.md`, `v2.md`, `v3.md` — one roadmap per version; v1 has the Instagram test as its
  milestone, v2 carries the full security spine, v3 holds the parked "attach" mistake.
- `ROADMAP.md` — banner added: it's now the execution engine-room behind the version files
  (v1=Phase 4a, v2=Phase 5.0+5a/5b/5d, v3=Phase 4b+5e). Nothing deleted.

**3. Closed the original doctrine deliverable:**
- `docs/specs/adr-0011-open-source-consumption-doctrine.md` (Accepted) — build-native-by-default; three
  tracks (Port / Buy-rarely / Expose-deferred-to-v3); per-repo disposition table; re-tags
  4a.7→5e, 4a.8=Port, 5d=verify-not-spoof, 5e=Track-3. Track 3 points to ADR-0006, not re-decided.
- Fixed the long-stale "Build order: Stealth → MFA → Identity" line in
  `journal/work/product/context.md` (now the security-first spine, labelled v2).

**4. Caught a real cross-doc conflict by reading the plans** (Roi insisted I read them): the
council-audited Stealth plan **verifies fingerprints rather than spoofing** — so the canonical "buy the
fingerprint packages" example may never be exercised. Recorded as a footnote in ADR-0011 + feather.md
rather than re-opening the settled "fingerprint = buy" decision.

## Decisions

- **Product is framed as v1 → v2 → v3** (Roi's idea, which I initially pushed back on, then adopted — it
  directly answers "what will I have when we're done?"). v1/v2/v3 own the product narrative; phases stay
  the execution engine.
- **Visual shell = v3, lowest priority.** Until then, plain Chromium Feather-style.
- **First real test = collaborative Instagram account on the throwaway scratch profile** (human-in-the-loop
  for CAPTCHA/verify; no phone needed, only Google). Reframed from my "human-creates-only" objection after
  Roi pointed out the in-the-loop design — it's also a manual dry-run of the v2 MFA Handler.
- **Open-source repos are recipe books, consulted per-feature** — not features, not a shopping list.
- **4a.7 (CDP attach) → moved to v3/5e**, not deleted.

## Left unfinished / next concrete action

- **NEXT = the v1 Instagram test.** Roi hand-starts a throwaway IG on the scratch profile (warm Google);
  then an agent (Claude can be the first) drives Feather's local API: smoke test ("open IG, scroll,
  describe 3 posts") → then a Social Research errand. Pass = stealthy enough; flag = v2 stealth is next.
- After that: **Session 4a.8** — port Crawl4AI markdown to TS (the first v1 "Port" build).

## Ideas

- Roi independently re-derived the **action cache / teach-a-workflow** idea (save the *recipe* sequence,
  not new tools) — confirms the v2 feature matches how he thinks. (Tools are fixed; what's worth
  saving/indexing is the per-task action sequence.)

## Roi quotes

- "i got really confused with all these features i dont know anymore what im building..."
- "i want to not be confused anymore, i know what i want feather to be and we actually planned a fudging lot. so i want to get ready to actually building and testing thee thing."
- "the visual browser window can wait until i really need it. until than i can use actual chromium feather style."
- "you did say we are stealthy enugh. i would want to test it. if we arnt - v2 will create its own linked in account."
- "i think this session was very productive. you made me unconfused."

## Files touched

- New: `feather.md`, `docs/roadmap/{v1,v2,v3}.md`, `docs/specs/adr-0011-open-source-consumption-doctrine.md`,
  `blog/0012-the-map-i-drew-for-myself.md`.
- Modified: `ROADMAP.md` (banner), `journal/work/product/context.md` (stale build-order line + v1/v2/v3 lens),
  plus standard tracking files (`active.md`, `phase.md`, `tasks.md`, `log.md`, `next.md` reset).
