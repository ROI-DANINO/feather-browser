# Feather v1 Showcase — verbatim Feather-agent prompts (test_1)

These are the **exact prompts** sent to the 10 Feather operator subagents in the `test_1` run —
**with the Feather plumbing intact** (base URL, token path, `using-feather-browser` skill invocation,
session-open spec, cleanup). Saved for meta-analysis / reproducibility.

- **Chrome-adapted versions** (plumbing stripped, for Claude for Chrome): `../claude-for-chrome/prompts.md`.
- **Per-task results:** `tasks/<TASK>.md`.

Shared facts at run time: baseUrl `http://127.0.0.1:37589`; token file `/run/user/1000/feather/run/control-token`.
Parallel wave (E1,E2,E3,M1,M2,M3,H4) opened **disposable headed** sessions; serial wave (H1,H2,H3)
opened the **warmed `scratch`** persistent profile. Today's date as given: 2026-06-10.

---

## E1 — Hacker News top story

```
You are a Feather Browser operator agent. Feather is a local Chromium runtime you drive over an HTTP API. Accomplish ONE real-world errand by driving a real browser through Feather — observe the page, act by reference, re-observe to confirm.

SETUP (do this first):
- Feather base URL: http://127.0.0.1:37589
- Auth: read the token from the file /run/user/1000/feather/run/control-token and send it on EVERY request as the header `X-Feather-Token: <token>`.
- Invoke the `using-feather-browser` skill now — it teaches the golden loop (observe → act by ref → re-observe), session setup, targeting, and error→recovery. Use `feather-data-extraction` as relevant. Deeper reference: docs/agent-playbook.md.
- Open your OWN session: POST /v1/sessions with body {"profile":{"kind":"disposable"},"browserMode":"chromium-headed-cdp","viewport":{"width":1280,"height":800}}

YOUR ERRAND (this is all you get — figure out the rest yourself):
Go to Hacker News (news.ycombinator.com). Find the current #1 (top) story. Report its exact title and how many points it currently has.

RULES:
- This is a capability test. You get the errand in plain English and NOTHING else — no selectors, no recipe, no answer key. Do NOT read examples/showcase.sh or any showcase spec file; that is cheating. Discover the page yourself via observe/snapshot.
- Drive a real browser: navigate, observe, act by ref or role/text, re-observe to confirm. VERIFY your result actually came from the page (don't invent it).
- Optimize for TRUTH, not a green checkmark. If you cannot complete it, a clean PARTIAL/FAIL with the reason and the lesson is a SUCCESS, not a failure. Never fake or assume success.
- When done or stuck, CLOSE your session: DELETE /v1/sessions/<sessionId> with body {"force":false}.

REPORT BACK exactly these lines:
- VERDICT: PASS / PARTIAL / FAIL
- RESULT: the concrete answer (title + point count)
- EVIDENCE: how you verified it from the page
- LESSON: what broke / what you'd do differently / "clean run"
- SESSION CLOSED: yes/no
```

## E2 — Tel Aviv weather

```
[Identical SETUP/RULES/REPORT scaffold as E1, with this ERRAND:]
Find the current weather in Tel Aviv, Israel right now. Report the temperature and the conditions.
[Session: disposable headed. Skills: using-feather-browser + feather-data-extraction.]
```

## E3 — microsoft/playwright stars

```
[Identical scaffold, ERRAND:]
Find out how many stars the GitHub repository microsoft/playwright currently has. Report the star count.
[Session: disposable headed. Skills: using-feather-browser + feather-data-extraction.]
```

## M1 — Web search "Feather Browser"

```
[Identical scaffold, ERRAND + extra note:]
Search the web for "Feather Browser" and tell me the title of the top result and what it is about. Note: this is a COLD, fresh browser profile with no login — search engines may show a consent/bot wall. If that happens, that is real and worth reporting; try a reasonable fallback search engine before giving up.
[RULES added: "If a bot wall blocks you, a clean PARTIAL with the reason and the lesson is a SUCCESS — do NOT pretend you got results."]
[Session: disposable headed. Skills: using-feather-browser + feather-data-extraction.]
```

## M2 — httpbin form submit

```
[Identical scaffold, ERRAND:]
Go to https://httpbin.org/forms/post. Fill in the customer name field with "Feather Tester" and submit the order. Confirm the submission actually went through (the resulting page should echo back your submitted data).
[Session: disposable headed. Skills: using-feather-browser + feather-form-filling.]
```

## M3 — Mount Everest elevation

```
[Identical scaffold, ERRAND + targeting note:]
Find the elevation (height above sea level) of Mount Everest using Wikipedia. Report the figure (in meters and/or feet).
[RULES added: "Be careful to report the ELEVATION specifically, not just any number on the page."]
[Session: disposable headed. Skills: using-feather-browser + feather-data-extraction.]
```

## H4 — Multi-tab research: 3 facts

```
[Identical scaffold + a multi-tab note in SETUP: "This task uses MULTIPLE TABS in one session. You can open tabs via POST /v1/sessions/<id>/tabs and target a specific tab by passing 'pageId' in your navigate/extract/snapshot request bodies." ERRAND:]
Using a SINGLE browser session with multiple tabs, gather these three facts and report all three:
(1) the exact title of the current top story on Hacker News (news.ycombinator.com),
(2) the current temperature in Tel Aviv,
(3) the current star count of the GitHub repo microsoft/playwright.
[VERDICT: PASS only if all 3/3 verified. Session: disposable headed.]
```

---

## H1 — Next Israeli holiday → all-day Google Calendar event  (warmed scratch)

```
[SETUP differs — warmed session + login note + lock handling:]
- Open a WARMED session on the human-logged-in profile: POST /v1/sessions with body {"profile":{"kind":"persistent"},"workspaceId":"scratch","browserMode":"chromium-headed-cdp","viewport":{"width":1280,"height":800}}. This profile is already logged into a Google account — use that existing login; do NOT try to log in or enter credentials.
- If session creation returns error code PROFILE_LOCKED: GET /v1/sessions, find the session whose workspaceId is "scratch", DELETE it ({"force":true}), wait ~2s, then retry the create.
TODAY'S DATE is 2026-06-10.

YOUR ERRAND:
Find the NEXT upcoming Israeli public holiday — the first one whose date is AFTER today (2026-06-10). Then create an all-day event for it in Google Calendar on that holiday's actual date, with the event title containing the holiday's name. Finally, verify the event was actually saved on the correct date by looking at the calendar.

[RULES added: research the holiday yourself; VERIFY at two levels (right holiday from a real source + event actually appears on its date); create exactly ONE event, no duplicates. Cleanup uses {"force":true}.]
```

## H2 — Google → top article → extract  (warmed scratch)

```
[Warmed-scratch SETUP as H1. ERRAND:]
Search Google for "history of the internet". Open the top organic result article (a real article, not an ad and not the AI overview box). Then read and extract the article's main content, and report a short summary of what it actually says.
[RULES: verify the summary is grounded in extracted page text, not memory; bot wall → honest PARTIAL.]
```

## H3 — Instagram: pick a real post, like + comment, verify  (warmed scratch)

```
[Warmed-scratch SETUP as H1, plus: "This profile is ALREADY LOGGED IN to Instagram (account: feather_test_roi). Use that existing login — do NOT try to log in. Dismiss any 'Not Now' / 'Save info' prompts." ERRAND:]
On Instagram (instagram.com), look at the home feed and pick ONE real, NON-SPONSORED post (not an ad/"Sponsored", and don't just blindly act on whatever is literally first). Then:
  1. LIKE that post.
  2. Write and post a thoughtful, genuine COMMENT on it — and base the comment on the post's actual content: what's in the image/photo, what the caption says, and what the top commenters are saying. Make it specific to THIS post, not generic.
Finally, VERIFY both actions: that your like registered (the like control flipped to the liked/"Unlike" state) and that your comment is actually visible on the post.

[RULES added: real account taking real public actions — keep the comment kind/genuine/appropriate; like the POST not a comment; re-observe to confirm both; a video with no readable image or sparse comments → honest fewer-sources comment or PARTIAL; never fake a like/comment landed.]
```

---

> Note on fidelity: E2–H4 above are summarized against the E1 scaffold to avoid 10× repetition of the
> identical SETUP/RULES/REPORT boilerplate — only the per-task deltas (errand, skills, session kind,
> extra rules) are called out. E1, H1, H2, H3 are given in full or near-full because their scaffolds
> differ. The complete literal text of every prompt is also preserved in each agent's raw transcript
> (`raw/<TASK>.agent-transcript.jsonl`, first user message).
