# Session — The Two Version Numbers (2026-06-24, 0427)

**Phase:** v1-ship-and-adopt → **Phase 2 (OSS envelope) SHIPPED & PUSHED.**
**Commits:** `5c5f0fa` (Phase 2 docs) + `182b4e0` (API /v1 disambiguation); pushed `06cd2e8..182b4e0`.

## Done this session
Worked straight down the Phase 2 "make it adoptable" checklist; everything verified live, not asserted.

- **Clone→fail blocker (xs):** added `npx playwright install chromium` to the `README.md` and
  `examples/README.md` quickstarts — `npm install` doesn't fetch the Chromium binary, so a stranger's
  first `npm run dev` → first session launch failed. Root-caused once (no `postinstall`), fixed at both
  newcomer entry points.
- **Quickstart + success number:** new README "Showcase suite" section surfacing **8 PASS / 2 PARTIAL**
  (both partials reclassified environmental per `docs/v1_wrap/META-ANALYSIS.md`). Re-ran
  `./examples/showcase.sh easy` against a live server → **3/3 PASS** (E1 HN, E2 weather, E3 GitHub stars).
- **CI badge:** added the `ci.yml` Actions badge to the README top.
- **`CONTRIBUTING.md`:** setup (incl. the Chromium install), the exact CI verification gate
  (typecheck/build/test/test:integration), branch rules (target `dev`, worktrees), scope classification,
  security pointer.
- **HTTP API `/v1` declared + stability promise** in `docs/api-reference.md` Overview; added runnable
  curl for the action endpoints (click/type/press — one worked block, shared `target` shape), the grants
  request, and the MFA challenge. **All three curl shapes verified against the live server**
  (`type`→`ok:true,typed:true`; `grants`→`403 DANGEROUS_DISABLED` as expected with nothing opted-in;
  `mfa/challenge` push→`ok:true` with `challengeId`/`localUrl`).

## The version-number catch (why this session is named what it is)
Roi caught a real ambiguity: *"what do you mean v1? … we wrapping v2 not v1."* There are **two separate
version counters** in the project and the docs were letting them blur:
- **Product version** — Feather **v1→v2→v3** (`feather.md`); product is at **v2** (safety spine wrapped).
- **HTTP API URL version** — the **`/v1`** prefix on every endpoint; unchanged since the start.
My "declare the HTTP API v1" work was #2 (the Phase 2 checklist item literally says so). No mistake in
the work, but the wording risked reader confusion. Fixed in `182b4e0`: the api-reference stability note
now states outright that `/v1` is the API URL version, a *separate counter* from the product version,
and a `/v2` there means an API-prefix bump, not product-v2.

## Decisions
- **API `/v1` stability promise** = conventional SemVer-style: no breaking change to existing
  endpoints/fields/envelope without bumping the URL to `/v2`; additive (new endpoints, new *optional*
  fields) is non-breaking → clients must ignore unknown response fields. (Roi flagged the public nature;
  accepted the conventional wording.)
- Keep the two version counters explicitly named-apart in docs.

## Left unfinished / NEXT
- **Phase 3 — a NEW, stronger hero demo (LAST).** Needs Roi driving (real logged-in errand +
  `wf-recorder`, which is installed). Not a solo-agent task. The current `npm run demo:hero` works but is
  basic.
- **Roi, outside the repo (open since Phase 0):** rotate/abandon the leaked `roionly9` throwaway account;
  password stays in public git history (no scrub — Roi's call, low blast radius).

## Notes
- `/using-superpowers` not needed for this session — it was an already-decided docs checklist, no
  process skill gates it; the active disciplines were ponytail (keep docs minimal) + testing-honesty
  (verified curl/showcase live).
- Server started/stopped cleanly by pid from `endpoint.json` (never `pkill -f`).

## Verbatim Roi quotes
- "what do you mean v1? you actually refer v1? or mistaking this work? cause we wrapping v2 not v1"
- "orgenize this so it will be less confusinf"
- "keep going down the list"
- "needs /using-superpowers ?"
