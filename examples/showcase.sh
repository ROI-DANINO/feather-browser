#!/usr/bin/env bash
#
# Feather Browser — v1 showcase & eval suite
# Drives 10 agent-style errands over the Feather HTTP API end to end, asserts each
# result, saves an artifact, and prints a results table.
#
# Prereqs:
#   - Feather running: `npm run dev` in another terminal.
#   - node + curl. (No jq required.)
#   - For the HARD tier (H1-H4): the server must be started from a shell with
#     WAYLAND_DISPLAY/DISPLAY (headed windows), and the `scratch` workspace must
#     hold warmed Google + feather_test_roi Instagram sessions.
#
# Usage:
#   ./examples/showcase.sh            # all tiers
#   ./examples/showcase.sh easy       # only easy
#   ./examples/showcase.sh medium     # only medium
#   ./examples/showcase.sh hard       # only hard (needs headed + warmed scratch)
#   ./examples/showcase.sh __run run_m1  # run a single task (debug hook)
#
# Filming the hard tier (separate terminal):
#   wf-recorder -f examples/showcase-output/hard-tier.mp4
#
set -euo pipefail

SHOWCASE_TIER="${1:-all}"
OUT_DIR="$(cd "$(dirname "$0")" && pwd)/showcase-output"
mkdir -p "$OUT_DIR"

# --- locate endpoint.json (verbatim from quickstart.sh) ---
if [ -n "${FEATHER_ENDPOINT_FILE:-}" ]; then
  ENDPOINT_FILE="$FEATHER_ENDPOINT_FILE"
elif [ -n "${XDG_RUNTIME_DIR:-}" ]; then
  ENDPOINT_FILE="$XDG_RUNTIME_DIR/feather/run/endpoint.json"
else
  ENDPOINT_FILE="${XDG_STATE_HOME:-$HOME/.local/state}/feather/run/endpoint.json"
fi

if [ ! -f "$ENDPOINT_FILE" ]; then
  echo "ERROR: endpoint.json not found at: $ENDPOINT_FILE" >&2
  echo "Is Feather running? Start it with 'npm run dev'." >&2
  exit 1
fi

BASE_URL="$(node -e 'process.stdout.write(require(process.argv[1]).baseUrl)' "$ENDPOINT_FILE")"
TOKEN_FILE="$(node -e 'process.stdout.write(require(process.argv[1]).tokenFile)' "$ENDPOINT_FILE")"
TOKEN="$(cat "$TOKEN_FILE")"
echo "Feather at $BASE_URL"

# --- POST/DELETE helper ---
api() {
  local method="$1" path="$2" body="${3:-}"
  local args=(-s -X "$method" "$BASE_URL$path" -H "X-Feather-Token: $TOKEN")
  if [ -n "$body" ]; then args+=(-H "Content-Type: application/json" -d "$body"); fi
  curl "${args[@]}"
}

# --- Envelope reader ---
field() {
  node -e '
    let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
      let o; try{ o=JSON.parse(s); }catch(e){ console.error("  non-JSON response"); process.exit(1); }
      if(!o.ok){ console.error("  API error:", JSON.stringify(o.error)); process.exit(1); }
      let v=o.data; for(const k of process.argv[1].split(".").filter(Boolean)) v=v==null?v:v[k];
      process.stdout.write(v==null?"":String(v));
    });' "$1"
}

# --- results accumulation ---
RESULTS_FILE="$(mktemp)"; trap 'rm -f "$RESULTS_FILE"' EXIT

now_ms() { node -e 'process.stdout.write(String(Date.now()))'; }

fmt_elapsed() {
  local s="$1" e; e="$(now_ms)"
  node -e 'process.stdout.write(((process.argv[2]-process.argv[1])/1000).toFixed(1)+"s")' "$s" "$e"
}

record() {
  local task="$1" status="$2" time="$3"; shift 3
  local lesson="$*"
  printf '%s|%s|%s|%s\n' "$task" "$status" "$time" "$lesson" >> "$RESULTS_FILE"
  printf '[%s] %s %s — %s\n' "$task" "$status" "$time" "$lesson"
}

render_table() {
  local md="$OUT_DIR/results.md"
  {
    echo "# Feather v1 Showcase — Results"
    echo
    echo "_Generated $(date -u +%Y-%m-%dT%H:%M:%SZ) — tier: ${SHOWCASE_TIER}_"
    echo
    echo "| Task | Status  | Time  | Lesson |"
    echo "|------|---------|-------|--------|"
    while IFS='|' read -r task status time lesson; do
      printf '| %s | %s | %s | %s |\n' "$task" "$status" "$time" "$lesson"
    done < "$RESULTS_FILE"
  } | tee "$md"
  echo
  echo "Results written to $md"
}

# --- artifact savers ---
save_shot() {
  local sid="$1" task="$2" pageId="${3:-}" full="${4:-true}"
  local body resp src dest
  body="$(node -e 'const p=process.argv[1],f=process.argv[2];const o={fullPage:f==="true"};if(p)o.pageId=p;process.stdout.write(JSON.stringify(o))' "$pageId" "$full")"
  resp="$(api POST "/v1/sessions/$sid/screenshot" "$body")"
  src="$(printf '%s' "$resp" | field path)"
  dest="$OUT_DIR/${task}-$(date -u +%Y%m%dT%H%M%SZ).png"
  cp "$src" "$dest"
  printf '%s' "$dest"
}

save_text() {
  local task="$1"; shift
  local dest="$OUT_DIR/${task}-$(date -u +%Y%m%dT%H%M%SZ).txt"
  printf '%s\n' "$*" > "$dest"
  printf '%s' "$dest"
}

# --- session lifecycle ---
open_headless() {
  local resp; resp="$(api POST /v1/sessions '{"profile":{"kind":"disposable"},"browserMode":"chromium-new-headless","viewport":{"width":1280,"height":800}}')"
  local sid pid
  sid="$(printf '%s' "$resp" | field sessionId)"
  pid="$(printf '%s' "$resp" | field pages.0.pageId)"
  printf '%s %s' "$sid" "$pid"
}

close_session() {
  api DELETE "/v1/sessions/$1" '{"force":false}' >/dev/null || true
}

# open_warmed_scratch -> echoes "SESSION_ID PAGE_ID"
# Handles PROFILE_LOCKED by closing stale scratch session and relaunching.
open_warmed_scratch() {
  local body='{"profile":{"kind":"persistent"},"workspaceId":"scratch","browserMode":"chromium-headed-cdp","viewport":{"width":1280,"height":800}}'
  local resp code
  resp="$(api POST /v1/sessions "$body")"
  code="$(printf '%s' "$resp" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const o=JSON.parse(s);process.stdout.write(o.ok?"OK":(o.error&&o.error.code||"ERR"))})')"
  if [ "$code" = "PROFILE_LOCKED" ]; then
    echo "  scratch locked — closing stale session" >&2
    local stale; stale="$(api GET /v1/sessions | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const o=JSON.parse(s);const m=(o.data||[]).find(x=>x.workspaceId==="scratch");process.stdout.write(m?m.sessionId:"")})')"
    [ -n "$stale" ] && close_session "$stale" && sleep 2
    resp="$(api POST /v1/sessions "$body")"
  fi
  local sid pid
  sid="$(printf '%s' "$resp" | field sessionId)"
  pid="$(printf '%s' "$resp" | field pages.0.pageId)"
  printf '%s %s' "$sid" "$pid"
}

# dismiss_got_it: dismisses Google "Got it" onboarding banners (welcome + dark mode)
dismiss_got_it() {
  local sid="$1" max="${2:-3}" i=0
  while [ $i -lt "$max" ]; do
    local ok; ok="$(api POST "/v1/sessions/$sid/click" \
      '{"target":{"by":"role","role":"button","name":"Got it"}}' \
      | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const o=JSON.parse(s);process.stdout.write(o.ok?"1":"0")})')"
    [ "$ok" = "1" ] && sleep 0.5 || break
    i=$((i+1))
  done
}

# ============================ TASKS ============================

run_e1() { # HN top posts (headless) — semantic assert: title AND point count (spec criterion)
  local sid pid t0; read -r sid pid < <(open_headless); t0="$(now_ms)"
  api POST "/v1/sessions/$sid/navigate" '{"url":"https://news.ycombinator.com","waitUntil":"domcontentloaded","timeoutMs":20000}' >/dev/null
  local title; title="$(api POST "/v1/sessions/$sid/extract" '{"recipe":{"fields":{"top1":{"selector":".athing .titleline a","type":"text"}}}}' | field top1)"
  local score; score="$(api POST "/v1/sessions/$sid/extract" '{"recipe":{"fields":{"pts":{"selector":".subtext .score","type":"text"}}}}' | field pts 2>/dev/null || true)"
  local md; md="$(api POST "/v1/sessions/$sid/snapshot" '{}' | field markdown)"
  local art; art="$(save_text E1 "$md")"
  if [ -n "$title" ] && printf '%s' "$score" | grep -qE '[0-9]+ point'; then
    record E1 PASS "$(fmt_elapsed "$t0")" "top story: ${title:0:50} ($score) → $art"
  elif [ -n "$title" ]; then
    record E1 PARTIAL "$(fmt_elapsed "$t0")" "title ok but no point count (.subtext .score drift; got '$score') → $art"
  else record E1 PARTIAL "$(fmt_elapsed "$t0")" "no title via .athing .titleline a — selector drift; md saved → $art"; fi
  close_session "$sid"
}

run_e2() { # weather Tel Aviv (headless)
  local sid pid t0; read -r sid pid < <(open_headless); t0="$(now_ms)"
  api POST "/v1/sessions/$sid/navigate" '{"url":"https://wttr.in/tel+aviv?format=3","waitUntil":"load","timeoutMs":20000}' >/dev/null
  local line; line="$(api POST "/v1/sessions/$sid/snapshot" '{}' | field text)"
  local art; art="$(save_text E2 "$line")"
  if printf '%s' "$line" | grep -qE '[+-][0-9]+°?C'; then
    record E2 PASS "$(fmt_elapsed "$t0")" "temp: $(printf '%s' "$line" | grep -oE '[+-][0-9]+°?C' | head -1) → $art"
  else record E2 PARTIAL "$(fmt_elapsed "$t0")" "no temp pattern: ${line:0:60} → $art"; fi
  close_session "$sid"
}

run_e3() { # GitHub stars (headless)
  local sid pid t0; read -r sid pid < <(open_headless); t0="$(now_ms)"
  api POST "/v1/sessions/$sid/navigate" '{"url":"https://github.com/microsoft/playwright","waitUntil":"domcontentloaded","timeoutMs":25000}' >/dev/null
  local raw; raw="$(api POST "/v1/sessions/$sid/extract" '{"recipe":{"fields":{"stars":{"selector":"#repo-stars-counter-star","type":"text"}}}}' | field stars)"
  local n; n="$(node -e 'const t=(process.argv[1]||"").trim().toLowerCase();const m=t.match(/([0-9.]+)\s*([km]?)/);if(!m){process.stdout.write("0");process.exit()}let v=parseFloat(m[1]);if(m[2]==="k")v*=1e3;if(m[2]==="m")v*=1e6;process.stdout.write(String(Math.round(v)))' "$raw")"
  local art; art="$(save_text E3 "raw=$raw normalized=$n")"
  if [ "$n" -gt 0 ] 2>/dev/null; then record E3 PASS "$(fmt_elapsed "$t0")" "stars=$raw (~$n) → $art"
  else record E3 PARTIAL "$(fmt_elapsed "$t0")" "no star count (raw='$raw') → $art"; fi
  close_session "$sid"
}

run_m1() { # search "Feather Browser" — GOOGLE-FIRST (doctrine), DDG-html fallback (headless)
  # Google-first doctrine (agent-playbook "Research doctrine", suite re-pointed 2026-06-10 per Roi):
  # Google is the default engine everywhere; DDG demotes to fallback. On a COLD headless disposable
  # profile a Google consent/bot wall is a live possibility — that IS the stress test now: try
  # Google, record reality, fall back, keep the lesson.
  local sid pid t0; read -r sid pid < <(open_headless); t0="$(now_ms)"
  api POST "/v1/sessions/$sid/navigate" '{"url":"https://www.google.com/search?q=Feather+Browser","waitUntil":"domcontentloaded","timeoutMs":20000}' >/dev/null
  local first; first="$(api POST "/v1/sessions/$sid/extract" '{"recipe":{"fields":{"r1":{"selector":"#search h3","type":"text"}}}}' | field r1 2>/dev/null || true)"
  if [ -n "$first" ]; then
    local art; art="$(save_text M1 "google: $first")"
    record M1 PASS "$(fmt_elapsed "$t0")" "Google (cold headless!): ${first:0:50} → $art"
  else
    api POST "/v1/sessions/$sid/navigate" '{"url":"https://html.duckduckgo.com/html/?q=Feather+Browser","waitUntil":"domcontentloaded","timeoutMs":20000}' >/dev/null
    first="$(api POST "/v1/sessions/$sid/extract" '{"recipe":{"fields":{"r1":{"selector":".result__a","type":"text"}}}}' | field r1 2>/dev/null || true)"
    local art; art="$(save_text M1 "ddg-html-fallback: $first")"
    if [ -n "$first" ]; then
      record M1 PARTIAL "$(fmt_elapsed "$t0")" "Google walled headless → DDG-html worked: ${first:0:40} → $art"
    else
      record M1 PARTIAL "$(fmt_elapsed "$t0")" "Google AND DDG-html walled headless (cold-profile search = warmed capability; v2) → $art"
    fi
  fi
  close_session "$sid"
}

run_m2() { # httpbin form submit (headless)
  local sid pid t0; read -r sid pid < <(open_headless); t0="$(now_ms)"
  local nav_resp; nav_resp="$(api POST "/v1/sessions/$sid/navigate" '{"url":"https://httpbin.org/forms/post","waitUntil":"domcontentloaded","timeoutMs":20000}')"
  local status; status="$(printf '%s' "$nav_resp" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const o=JSON.parse(s);process.stdout.write(String(o.data?.status||0))})')"
  if [ "$status" != "200" ]; then
    local shot; shot="$(save_shot "$sid" M2)"
    record M2 PARTIAL "$(fmt_elapsed "$t0")" "httpbin returned HTTP $status (public endpoint flaky) → $shot"
    close_session "$sid"; return
  fi
  api POST "/v1/sessions/$sid/type" '{"target":{"by":"css","selector":"input[name=custname]"},"text":"Feather Tester","mode":"fill"}' >/dev/null
  api POST "/v1/sessions/$sid/click" '{"target":{"by":"role","role":"button","name":"Submit order"}}' >/dev/null
  api POST "/v1/sessions/$sid/wait" '{"target":{"by":"css","selector":"body"},"until":"stable","quietMs":1000,"timeoutMs":15000}' >/dev/null
  local body; body="$(api POST "/v1/sessions/$sid/snapshot" '{}' | field text)"
  local shot; shot="$(save_shot "$sid" M2)"
  if printf '%s' "$body" | grep -q "Feather Tester"; then record M2 PASS "$(fmt_elapsed "$t0")" "form echoed back custname → $shot"
  else record M2 PARTIAL "$(fmt_elapsed "$t0")" "submitted but echo not confirmed → $shot"; fi
  close_session "$sid"
}

run_m3() { # Wikipedia fact extraction (headless) — semantic assert: the TARGET fact, not "some cell"
  # The errand is Everest's elevation; spec criterion = "target fact string present". A non-empty
  # .infobox-data cell could be any row — assert the elevation figure itself (8,848 m and change).
  local sid pid t0; read -r sid pid < <(open_headless); t0="$(now_ms)"
  api POST "/v1/sessions/$sid/navigate" '{"url":"https://en.wikipedia.org/wiki/Mount_Everest","waitUntil":"domcontentloaded","timeoutMs":20000}' >/dev/null
  local fact; fact="$(api POST "/v1/sessions/$sid/extract" '{"recipe":{"fields":{"elev":{"selector":".infobox-data","type":"text"}}}}' | field elev)"
  local md; md="$(api POST "/v1/sessions/$sid/snapshot" '{}' | field markdown 2>/dev/null || true)"
  local elev; elev="$(printf '%s\n%s' "$fact" "$md" | grep -oE '8,?848(\.[0-9]+)?' | head -1 || true)"
  local art; art="$(save_text M3 "infobox: $fact | elevation-match: ${elev:-none}")"
  if [ -n "$elev" ]; then record M3 PASS "$(fmt_elapsed "$t0")" "elevation: $elev m (infobox: ${fact:0:30}) → $art"
  elif [ -n "$fact" ]; then record M3 PARTIAL "$(fmt_elapsed "$t0")" "infobox cell extracted but no elevation figure — wrong row / content drift → $art"
  else record M3 PARTIAL "$(fmt_elapsed "$t0")" ".infobox-data empty — selector drift → $art"; fi
  close_session "$sid"
}

run_h1() { # NEXT upcoming Israeli holiday via Google-first research → all-day Calendar event (semantic assert)
  # Doctrine (agent-playbook "Research doctrine"): search Google on the warmed profile, use the
  # SERP to find a source, extract the fact from the SOURCE page (AI Overview = hint only).
  # Semantic bar: the event must carry the holiday's NAME on the holiday's actual DATE (all-day),
  # not just "an event got saved".
  local sid pid t0; read -r sid pid < <(open_warmed_scratch); t0="$(now_ms)"
  # Step 1: Google-first research (warmed profile; natural locale — do not force hl=en)
  api POST "/v1/sessions/$sid/navigate" '{"url":"https://www.google.com/search?q=israel+public+holidays+2026","waitUntil":"domcontentloaded","timeoutMs":25000}' >/dev/null
  sleep 1
  local href; href="$(api POST "/v1/sessions/$sid/extract" '{"recipe":{"fields":{"link":{"selector":"a[jsname=\"UWckNb\"]","type":"attribute","attribute":"href"}}}}' | field link 2>/dev/null || true)"
  local via="google→${href:0:60}"
  if [ -z "$href" ]; then
    href="https://www.timeanddate.com/holidays/israel/2026"; via="google-link-extract-empty→direct-fallback"
  fi
  # Step 2: extract NEXT upcoming holiday (date > today) from the source page's markdown
  api POST "/v1/sessions/$sid/navigate" "$(node -e 'process.stdout.write(JSON.stringify({url:process.argv[1],waitUntil:"domcontentloaded",timeoutMs:25000}))' "$href")" >/dev/null
  local md; md="$(api POST "/v1/sessions/$sid/snapshot" '{}' | field markdown)"
  # Parse timeanddate holiday-table entries. The whole table arrives as ONE markdown line of
  # "<Mon> <D><Weekday>[<Name>](/holidays/israel/...)<Type>" — so anchor on the
  # /holidays/israel/ href (news blurbs with dates, e.g. DST articles, can never match).
  # Prefer "National Holiday" entries (= public holidays); fall back to any table entry.
  # Emits "YYYYMMDD|YYYYMMDD(+1)|name|human-date" for the first date after today.
  local pick; pick="$(printf '%s\n' "$md" | node -e '
    const M={jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
    const Y=2026, today=new Date(); today.setHours(0,0,0,0);
    let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
      const re=/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(\d{1,2})\s*(?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day\[([^\]]+)\]\(\/holidays\/israel\/[^)]*\)([A-Za-z ,\u0027\u2019-]*?)(?=(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d|\n|$)/g;
      const all=[]; let m;
      while((m=re.exec(s))!==null){
        const d=new Date(Y, M[m[1].toLowerCase().slice(0,3)], parseInt(m[2],10));
        if(d>today) all.push({d, name:m[3].trim(), type:m[4].trim()});
      }
      const nat=all.filter(x=>/National Holiday/i.test(x.type));
      const pool=nat.length?nat:all;
      if(!pool.length){process.exit(0)}
      pool.sort((a,b)=>a.d-b.d);
      const p=pool[0], pad=n=>String(n).padStart(2,"0");
      const ymd=x=>`${x.getFullYear()}${pad(x.getMonth()+1)}${pad(x.getDate())}`;
      const end=new Date(p.d); end.setDate(end.getDate()+1);
      process.stdout.write([ymd(p.d), ymd(end), p.name, p.d.toDateString()].join("|"));
    });')"
  if [ -z "$pick" ]; then
    local shot_p; shot_p="$(save_shot "$sid" H1)"
    record H1 PARTIAL "$(fmt_elapsed "$t0")" "no upcoming-holiday parse from source ($via) — markup/markdown drift → $shot_p"
    close_session "$sid"; return
  fi
  local d_start d_end holiday human_date
  IFS='|' read -r d_start d_end holiday human_date <<< "$pick"
  # Step 3: create an ALL-DAY event on the holiday's real date (eventedit deep link is the
  # deterministic scripted route; the UI quick-create path is exercised by agent-driven runs)
  local create_url; create_url="$(node -e 'const [n,s,e]=process.argv.slice(1);process.stdout.write("https://calendar.google.com/calendar/r/eventedit?text="+encodeURIComponent(n+" (Israeli Holiday)")+"&dates="+s+"/"+e)' "$holiday" "$d_start" "$d_end")"
  api POST "/v1/sessions/$sid/navigate" "$(node -e 'process.stdout.write(JSON.stringify({url:process.argv[1],waitUntil:"domcontentloaded",timeoutMs:25000}))' "$create_url")" >/dev/null
  sleep 1.5
  api POST "/v1/sessions/$sid/click" '{"target":{"by":"role","role":"button","name":"Save"}}' >/dev/null \
    || api POST "/v1/sessions/$sid/click" '{"target":{"by":"role","role":"button","name":"שמירה"}}' >/dev/null || true
  sleep 2
  # Step 4: SEMANTIC verify — open the day view of the holiday's date; the event name must be there
  local day_url="https://calendar.google.com/calendar/r/day/${d_start:0:4}/${d_start:4:2}/${d_start:6:2}"
  api POST "/v1/sessions/$sid/navigate" "$(node -e 'process.stdout.write(JSON.stringify({url:process.argv[1],waitUntil:"domcontentloaded",timeoutMs:25000}))' "$day_url")" >/dev/null
  api POST "/v1/sessions/$sid/wait" '{"target":{"by":"css","selector":"body"},"until":"stable","quietMs":1000,"timeoutMs":15000}' >/dev/null || true
  local snap; snap="$(api POST "/v1/sessions/$sid/snapshot" '{}' | field text 2>/dev/null || true)"
  local shot; shot="$(save_shot "$sid" H1)"
  if printf '%s' "$snap" | grep -qiF "$holiday"; then
    record H1 PASS "$(fmt_elapsed "$t0")" "NEXT holiday=$holiday on $human_date via $via; all-day event verified on its date → $shot"
  else
    record H1 PARTIAL "$(fmt_elapsed "$t0")" "holiday=$holiday ($human_date) researched via $via; event not seen on $day_url day view → $shot"
  fi
  close_session "$sid"
}

run_h2() { # Google search → article → extract content (warmed Google)
  local sid pid t0; read -r sid pid < <(open_warmed_scratch); t0="$(now_ms)"
  # Navigate warmed Google search
  api POST "/v1/sessions/$sid/navigate" \
    '{"url":"https://www.google.com/search?q=history+of+the+internet","waitUntil":"domcontentloaded","timeoutMs":25000}' >/dev/null
  sleep 1
  # Extract first organic result href
  local href; href="$(api POST "/v1/sessions/$sid/extract" \
    '{"recipe":{"fields":{"link":{"selector":"a[jsname=\"UWckNb\"]","type":"attribute","attribute":"href"}}}}' \
    | field link 2>/dev/null || true)"
  # Navigate to the article (fallback to known Wikipedia URL)
  local target_url="${href:-https://en.wikipedia.org/wiki/History_of_the_Internet}"
  api POST "/v1/sessions/$sid/navigate" \
    "{\"url\":\"$target_url\",\"waitUntil\":\"domcontentloaded\",\"timeoutMs\":25000}" >/dev/null
  sleep 1
  # Use snapshot (CSS p-selector extraction returns empty on Wikipedia — snapshot is reliable)
  local text; text="$(api POST "/v1/sessions/$sid/snapshot" '{}' | field text)"
  local art; art="$(save_text H2 "${text:0:2000}")"
  local shot; shot="$(save_shot "$sid" H2)"
  local via; [ -n "$href" ] && via="Google→${target_url:0:40}" || via="direct-fallback→wikipedia"
  if [ ${#text} -gt 200 ] && printf '%s' "$text" | grep -qi "internet"; then
    record H2 PASS "$(fmt_elapsed "$t0")" "article extracted (${#text} chars) via $via → $art"
  else
    record H2 PARTIAL "$(fmt_elapsed "$t0")" "short/empty content (${#text} chars) via $via → $art"
  fi
  close_session "$sid"
}

run_h3() { # IG: pick a REAL post (non-sponsored permalink) → comment from image+caption+top-comments + verified like
  # Semantic bar v3 (Roi 2026-06-10): don't act on whatever tops the feed. Collect /p/ permalinks
  # from the feed, open the first NON-SPONSORED one, and build the comment from the post's own
  # context: the image (via IG's auto-alt — the script's "eyes"; photo posts only), the caption,
  # and the top comments. PASS = post-level like VERIFIED (24px Unlike flip — comment likes are
  # 16px, plain first-match would hit those) + a comment woven from >=2 context sources, verified
  # visible. One-source comment or any unverified leg -> PARTIAL with the reason.
  local sid pid t0; read -r sid pid < <(open_warmed_scratch); t0="$(now_ms)"
  api POST "/v1/sessions/$sid/navigate" \
    '{"url":"https://www.instagram.com/","waitUntil":"domcontentloaded","timeoutMs":25000}' >/dev/null
  sleep 2
  api POST "/v1/sessions/$sid/click" '{"target":{"by":"text","text":"Not Now"}}' >/dev/null 2>&1 || true
  sleep 0.5
  # Step 1: collect post permalinks (/p/...) from the feed — these are real posts, chosen, not "whatever is first"
  local links; links="$(api POST "/v1/sessions/$sid/snapshot" '{}' | node -e '
    let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
      const o=JSON.parse(s); const L=(o.data&&o.data.links)||[];
      const seen=new Set(); const out=[];
      for(const l of L){ const m=(l.href||"").match(/^https:\/\/www\.instagram\.com\/p\/[A-Za-z0-9_-]+\/?$/);
        if(m && !seen.has(l.href)){ seen.add(l.href); out.push(l.href); } }
      process.stdout.write(out.slice(0,4).join(" "));
    });' || true)"
  if [ -z "$links" ]; then
    local shot0; shot0="$(save_shot "$sid" H3)"
    record H3 PARTIAL "$(fmt_elapsed "$t0")" "no /p/ permalinks in feed (reels-only feed?) — nothing deliberate to pick → $shot0"
    close_session "$sid"; return
  fi
  # Step 2: open the first NON-SPONSORED permalink and read its context from the snapshot text
  # (permalink text shape, probed live: author / [audio] / Follow / author / age / CAPTION... /
  #  then comment blocks of "author / age / text / N likes / Reply")
  local post_url="" ctx=""
  local u; for u in $links; do
    api POST "/v1/sessions/$sid/navigate" "$(node -e 'process.stdout.write(JSON.stringify({url:process.argv[1],waitUntil:"domcontentloaded",timeoutMs:25000}))' "$u")" >/dev/null
    sleep 2
    ctx="$(api POST "/v1/sessions/$sid/snapshot" '{}' | field text 2>/dev/null || true)"
    if printf '%s' "$ctx" | head -40 | grep -qx "Sponsored"; then ctx=""; continue; fi
    post_url="$u"; break
  done
  if [ -z "$post_url" ]; then
    local shot1; shot1="$(save_shot "$sid" H3)"
    record H3 PARTIAL "$(fmt_elapsed "$t0")" "all candidate permalinks sponsored — no organic post found → $shot1"
    close_session "$sid"; return
  fi
  # Step 3: parse caption + top-3 comments from the permalink text
  local parsed; parsed="$(printf '%s\n' "$ctx" | node -e '
    let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
      const clean=(t)=>t.replace(/[^\p{L}\p{N} ,.!?-]/gu," ").replace(/\s+/g," ").trim();
      const AGE=/^\d+\s?[smhdwy]$/;
      const NOISE=/^(\d[\d,.]*\s?(likes?|like))$|^Reply$|^View all\b|^more$|^See translation$|^Edited$|^Follow$|^Verified$/i;
      const lines=s.split("\n").map(l=>l.trim()).filter(Boolean);
      const author=lines[0]||"";
      let i=1; while(i<lines.length && lines[i]!==author) i++;     // 2nd author occurrence
      i++; if(AGE.test(lines[i]||"")) i++;                          // skip the post age
      const capLines=[];
      while(i<lines.length){
        if(AGE.test(lines[i+1]||"") && !NOISE.test(lines[i])) break;  // next block = first comment (author then age)
        if(!NOISE.test(lines[i])) capLines.push(lines[i]);
        i++;
      }
      const comments=[];
      while(i<lines.length && comments.length<3){
        if(AGE.test(lines[i+1]||"")){                                // comment block: author / age / text
          const text=lines[i+2]||"";
          if(text && !NOISE.test(text) && !AGE.test(text)) comments.push(clean(text));
          i+=3;
        } else i++;
      }
      const capSnip=clean(capLines.join(" ")).split(" ").slice(0,5).join(" ");
      const echo=(comments[0]||"").split(" ").slice(0,4).join(" ");
      process.stdout.write([capSnip, echo, String(comments.length)].join("|"));
    });' || true)"
  local cap_snip echo_snip n_comments
  IFS='|' read -r cap_snip echo_snip n_comments <<< "$parsed"
  # Step 4: the image signal — IG auto-alt of the content image (videos have none; that is honest)
  local alt subject; alt="$(api POST "/v1/sessions/$sid/extract" \
    '{"recipe":{"fields":{"x":{"selector":"article img[alt]:not([alt*=\"profile picture\"])","type":"attribute","attribute":"alt"}}}}' \
    | field x 2>/dev/null || true)"
  subject="$(node -e '
    const t=(process.argv[1]||"");
    const m=t.match(/May be (?:an image|a graphic|art|a cartoon|a meme) of ([^.]+)/i);
    let out=m?m[1]:"";
    out=out.replace(/[^\p{L}\p{N} ,-]/gu," ").replace(/\s+/g," ").trim();
    process.stdout.write(out.split(" ").slice(0,6).join(" "));' "$alt")"
  # Step 5: weave the comment from the available sources; count them
  local sources=0 comment=""
  [ -n "$cap_snip" ] && sources=$((sources+1))
  [ -n "$subject" ] && sources=$((sources+1))
  [ -n "$echo_snip" ] && sources=$((sources+1))
  comment="$(node -e '
    const [cap,subj,echo]=process.argv.slice(1);
    const parts=[];
    if(cap) parts.push("Love this — \u201C"+cap+"\u201D");
    if(subj) parts.push("beautiful "+subj);
    if(echo) parts.push("and the comments are right about \u201C"+echo+"\u2026\u201D");
    process.stdout.write((parts.length?parts.join(", "):"Great post")+" \uD83D\uDE4C");' \
    "$cap_snip" "$subject" "$echo_snip")"
  # Step 6: like the POST (24px action-bar icon; not a 16px comment like), then VERIFY the flip
  api POST "/v1/sessions/$sid/click" \
    '{"target":{"by":"css","selector":"svg[aria-label=\"Like\"][height=\"24\"]"}}' >/dev/null 2>&1 || true
  sleep 1
  local like_state; like_state="$(api POST "/v1/sessions/$sid/extract" \
    '{"recipe":{"fields":{"u":{"selector":"svg[aria-label=\"Unlike\"][height=\"24\"]","type":"attribute","attribute":"aria-label"}}}}' \
    | field u 2>/dev/null || true)"
  # Step 7: post the comment, then VERIFY it is visible (probe = the distinctive leading segment)
  api POST "/v1/sessions/$sid/type" \
    "$(node -e 'process.stdout.write(JSON.stringify({target:{by:"css",selector:"[placeholder=\"Add a comment…\"]"},text:process.argv[1],mode:"sequential"}))' "$comment")" \
    >/dev/null 2>&1 || true
  sleep 0.5
  api POST "/v1/sessions/$sid/press" '{"key":"Enter"}' >/dev/null 2>&1 || true
  sleep 2
  local page_text probe comment_visible=0
  page_text="$(api POST "/v1/sessions/$sid/snapshot" '{}' | field text 2>/dev/null || true)"
  probe="$(node -e 'process.stdout.write((process.argv[1]||"").split(",")[0])' "$comment")"
  if [ -n "$probe" ] && printf '%s' "$page_text" | grep -qF "$probe"; then comment_visible=1; fi
  local shot; shot="$(save_shot "$sid" H3)"
  if [ "$like_state" = "Unlike" ] && [ "$comment_visible" = "1" ] && [ "$sources" -ge 2 ]; then
    record H3 PASS "$(fmt_elapsed "$t0")" "picked $post_url; like verified (24px Unlike); comment from $sources/3 sources (cap+img+comments) visible: '${comment:0:60}' → $shot"
  else
    local why=""
    [ "$like_state" != "Unlike" ] && why="post-like not verified; "
    [ "$comment_visible" != "1" ] && why="${why}comment not seen on page; "
    [ "$sources" -lt 2 ] && why="${why}only $sources/3 context sources available (video post has no alt; $n_comments comments parsed); "
    record H3 PARTIAL "$(fmt_elapsed "$t0")" "${why}post=$post_url comment='${comment:0:40}' → $shot"
  fi
  close_session "$sid"
}

run_h4() { # multi-tab research: 3 tabs, 3 facts (warmed headed)
  local sid pid t0; read -r sid pid < <(open_warmed_scratch); t0="$(now_ms)"
  # Reuse initial page for tab 1 (HN), create 2 new tabs
  local p1="$pid"
  local p2; p2="$(api POST "/v1/sessions/$sid/tabs" '' | field pageId)"
  local p3; p3="$(api POST "/v1/sessions/$sid/tabs" '' | field pageId)"
  # Navigate all 3 tabs in parallel
  api POST "/v1/sessions/$sid/navigate" \
    "$(node -e 'process.stdout.write(JSON.stringify({pageId:process.argv[1],url:"https://news.ycombinator.com",waitUntil:"domcontentloaded",timeoutMs:20000}))' "$p1")" >/dev/null &
  api POST "/v1/sessions/$sid/navigate" \
    "$(node -e 'process.stdout.write(JSON.stringify({pageId:process.argv[1],url:"https://wttr.in/tel+aviv?format=3",waitUntil:"load",timeoutMs:20000}))' "$p2")" >/dev/null &
  api POST "/v1/sessions/$sid/navigate" \
    "$(node -e 'process.stdout.write(JSON.stringify({pageId:process.argv[1],url:"https://github.com/microsoft/playwright",waitUntil:"domcontentloaded",timeoutMs:25000}))' "$p3")" >/dev/null &
  wait
  # Extract facts from each tab
  local f1; f1="$(api POST "/v1/sessions/$sid/extract" \
    "$(node -e 'process.stdout.write(JSON.stringify({pageId:process.argv[1],recipe:{fields:{x:{selector:".athing .titleline a",type:"text"}}}}))' "$p1")" \
    | field x 2>/dev/null || true)"
  local f2; f2="$(api POST "/v1/sessions/$sid/snapshot" \
    "$(node -e 'process.stdout.write(JSON.stringify({pageId:process.argv[1]}))' "$p2")" \
    | field text 2>/dev/null || true)"
  local f3; f3="$(api POST "/v1/sessions/$sid/extract" \
    "$(node -e 'process.stdout.write(JSON.stringify({pageId:process.argv[1],recipe:{fields:{x:{selector:"#repo-stars-counter-star",type:"text"}}}}))' "$p3")" \
    | field x 2>/dev/null || true)"
  local shot; shot="$(save_shot "$sid" H4 "$p3")"
  # Semantic asserts per fact (not just non-empty): title text, a real temperature, a real count
  local temp; temp="$(printf '%s' "$f2" | grep -oE '[+-][0-9]+°?C' | head -1 || true)"
  local n3; n3="$(node -e 'const t=(process.argv[1]||"").trim().toLowerCase();const m=t.match(/([0-9.]+)\s*([km]?)/);if(!m){process.stdout.write("0");process.exit()}let v=parseFloat(m[1]);if(m[2]==="k")v*=1e3;if(m[2]==="m")v*=1e6;process.stdout.write(String(Math.round(v)))' "$f3")"
  local art; art="$(save_text H4 "HN=${f1:0:60} | weather=${temp:-none (raw: ${f2:0:30})} | stars=$f3 (~$n3)")"
  local got=0
  [ -n "$f1" ] && got=$((got+1))
  [ -n "$temp" ] && got=$((got+1))
  [ "$n3" -gt 0 ] 2>/dev/null && got=$((got+1))
  if [ "$got" -eq 3 ]; then record H4 PASS "$(fmt_elapsed "$t0")" "3/3 facts verified: HN=${f1:0:30}… | $temp | stars=$f3 → $art"
  else record H4 PARTIAL "$(fmt_elapsed "$t0")" "$got/3 facts passed semantic check across 3 live tabs (title='${f1:0:20}' temp='$temp' stars='$f3') → $art"; fi
  close_session "$sid"
}

# ============================ RUNNER ============================

# Debug hook: ./examples/showcase.sh __run run_m1
# NB: the `||` guard matches run_group — without it, errexit kills the script on the
# benign nonzero status of `read < <(printf ...)` (no trailing newline) inside tasks.
if [ "${1:-}" = "__run" ] && [ -n "${2:-}" ]; then
  "$2" || record "${2#run_}" FAIL "0.0s" "function errored (see stderr)"
  render_table; exit $?
fi

EASY=(run_e1 run_e2 run_e3)
MEDIUM=(run_m1 run_m2 run_m3)
HARD=(run_h1 run_h2 run_h3 run_h4)

run_group() {
  local -n g="$1"
  for fn in "${g[@]}"; do
    "$fn" || record "${fn#run_}" FAIL "0.0s" "function errored (see stderr)"
  done
}

case "$SHOWCASE_TIER" in
  easy)   run_group EASY ;;
  medium) run_group MEDIUM ;;
  hard)   run_group HARD ;;
  all|"") run_group EASY; run_group MEDIUM; run_group HARD ;;
  *) echo "unknown tier: $SHOWCASE_TIER (use easy|medium|hard|all)" >&2; exit 2 ;;
esac

render_table
