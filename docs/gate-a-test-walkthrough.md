# Gate A — Test It Yourself (cookie-export door)

A hands-on walkthrough to watch the capability gate work end-to-end: an agent asks for a dangerous
permission, **you** approve it in a browser, it works exactly once, and you see every step land in a
permanent audit log. Uses a **disposable** throwaway session — your `primary` and `scratch` profiles
are never touched.

You'll use **three terminals**. Copy-paste blocks as-is.

---

## Terminal A — start the server (with the door switched on)

```bash
cd ~/Desktop/Projects/feather-browser
FEATHER_DANGEROUS_CAPABILITIES=cookie-export npm run dev
```

Leave this running and **keep it visible** — this is where the approval links get printed.
Without that `FEATHER_DANGEROUS_CAPABILITIES=cookie-export` prefix, the door is dead (every attempt
returns `DANGEROUS_DISABLED`). That's the off-by-default switch — prove it later by restarting without it.

## Terminal C — watch the audit log (the best seat in the house)

```bash
mkdir -p ~/.local/state/feather/logs/audit
tail -f ~/.local/state/feather/logs/audit/grants.jsonl
```

Every `requested / granted / denied / used / expired / revoked` line shows up here live. This is the
durable forensic record — watch it as you go.

## Terminal B — drive it (this is "the agent")

```bash
cd ~/Desktop/Projects/feather-browser
RUN=/run/user/1000/feather/run
TOKEN=$(cat "$RUN/control-token")
BASE=$(grep -o '"baseUrl": *"[^"]*"' "$RUN/endpoint.json" | cut -d'"' -f4)
echo "API at $BASE"
```

Create a throwaway session and give it some cookies to export:

```bash
SID=$(curl -s -X POST "$BASE/v1/sessions" -H "X-Feather-Token: $TOKEN" \
  -H 'content-type: application/json' -d '{"profile":{"kind":"disposable"}}' \
  | grep -o '"sessionId":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "session: $SID"

curl -s -X POST "$BASE/v1/sessions/$SID/navigate" -H "X-Feather-Token: $TOKEN" \
  -H 'content-type: application/json' -d '{"url":"https://www.google.com"}' >/dev/null
echo "navigated"
```

---

## Test 1 — the door is shut without a grant

```bash
curl -s -X POST "$BASE/v1/sessions/$SID/cookies/export" -H "X-Feather-Token: $TOKEN" \
  -H 'content-type: application/json' -d '{}'
```

**Expect:** `"code":"GRANT_REQUIRED"`. A valid API token is **not** enough — that's the whole point.

## Test 2 — the happy path (request → you approve → it works)

Request the grant (this is the agent asking):

```bash
curl -s -X POST "$BASE/v1/sessions/$SID/grants" -H "X-Feather-Token: $TOKEN" \
  -H 'content-type: application/json' -d '{"capability":"cookie-export"}'
```

**Expect:** a `grant` object with `"status":"requested"` — and **notice there is NO approval link or
token in this response.** The agent never gets it. Now look at **Terminal A**: Feather printed

```
[Feather] Capability approval needed — cookie-export on ses_...
  Approve: http://127.0.0.1:PORT/v1/approvals/XXXXX
```

**Open that `Approve:` URL in your browser** → you'll see the approval page → click **Approve**.
(Terminal C just logged `grant.granted`.)

Now spend it:

```bash
curl -s -X POST "$BASE/v1/sessions/$SID/cookies/export" -H "X-Feather-Token: $TOKEN" \
  -H 'content-type: application/json' -d '{}'
```

**Expect:** `200` with a `cookies` array (Terminal C logs `grant.used`). The agent now has the cookies
— **once**, because you said so.

## Test 3 — single-use (the ticket is dead now)

```bash
curl -s -X POST "$BASE/v1/sessions/$SID/cookies/export" -H "X-Feather-Token: $TOKEN" \
  -H 'content-type: application/json' -d '{}'
```

**Expect:** `GRANT_REQUIRED` again. One approval = one use.

## Test 4 — Deny

Request a fresh grant, open the new `Approve:` link from Terminal A, but click **Deny** this time:

```bash
curl -s -X POST "$BASE/v1/sessions/$SID/grants" -H "X-Feather-Token: $TOKEN" \
  -H 'content-type: application/json' -d '{"capability":"cookie-export"}'
# → open the Approve URL from Terminal A, click DENY, then:
curl -s -X POST "$BASE/v1/sessions/$SID/cookies/export" -H "X-Feather-Token: $TOKEN" \
  -H 'content-type: application/json' -d '{}'
```

**Expect:** `GRANT_REQUIRED` (Terminal C logged `grant.denied`). Your "no" is final.

## Test 5 — Expiry (it dies on its own)

Request a grant, **approve it in the browser, then wait ~65 seconds doing nothing**, then export:

```bash
curl -s -X POST "$BASE/v1/sessions/$SID/grants" -H "X-Feather-Token: $TOKEN" \
  -H 'content-type: application/json' -d '{"capability":"cookie-export"}'
# → approve in browser, then wait 65s, then:
curl -s -X POST "$BASE/v1/sessions/$SID/cookies/export" -H "X-Feather-Token: $TOKEN" \
  -H 'content-type: application/json' -d '{}'
```

**Expect:** `GRANT_REQUIRED` (Terminal C logged `grant.expired`). An approved-but-unused permission
self-destructs after 60 seconds.

## Test 6 — Revoke on close (the teeth)

Request + approve a grant but **don't export**. Then close the session and watch Terminal C:

```bash
curl -s -X POST "$BASE/v1/sessions/$SID/grants" -H "X-Feather-Token: $TOKEN" \
  -H 'content-type: application/json' -d '{"capability":"cookie-export"}'
# → approve in browser (Terminal C: grant.granted), then close the session:
curl -s -X DELETE "$BASE/v1/sessions/$SID" -H "X-Feather-Token: $TOKEN"
```

**Expect:** Terminal C logs **`grant.revoked`** the instant the session closes. A live permission is
torn down the moment its session ends — it isn't left lying around. (Later this same trigger fires when
an MFA wall appears mid-task.)

---

## Prove the off-switch

Stop the server in Terminal A (`Ctrl-C`), then restart it **without** the env prefix:

```bash
npm run dev
```

Re-run Test 2's grant request. **Expect:** `"code":"DANGEROUS_DISABLED"`. Dangerous capabilities are
off unless you explicitly opt in. (Also note: restarting wiped all grants — they live in memory only;
only the audit log on disk survives.)

## Cleanup

```bash
curl -s -X DELETE "$BASE/v1/sessions/$SID" -H "X-Feather-Token: $TOKEN" >/dev/null 2>&1
# Ctrl-C the server (Terminal A) and the tail (Terminal C) when done.
```

---

## What you just proved

| Test | What it shows |
|------|---------------|
| 1 | The API token alone can't touch a dangerous operation |
| 2 | Only a **human**, out-of-band, can authorize it — the agent never sees the approval link |
| 3 | One approval = exactly one use |
| 4 | Your "deny" is enforced |
| 5 | Permissions self-expire (no long-lived keys lying around) |
| 6 | Closing the session **revokes** an unused permission — revocation has teeth |
| off-switch | Dangerous capabilities are off by default; grants don't survive a restart |

Every one of those moments is in `~/.local/state/feather/logs/audit/grants.jsonl` — the permanent record.

> **Want to run it against the real `scratch` profile instead of a disposable one?** Make sure the
> scratch daily-driver is **not** running (`npm run daily:stop -- scratch`), then in the create-session
> step use `'{"workspaceId":"scratch","profile":{"kind":"persistent"}}'`. Everything else is identical —
> and now the exported cookies are real warmed-session login tokens, which is exactly why the gate
> exists. Never point this at `primary`.
