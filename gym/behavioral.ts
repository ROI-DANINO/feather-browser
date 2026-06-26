// Gym Step 1 — behavioral diagnostic runner. An HTTP client of a running Feather server.
// CommonJS module (repo has no "type":"module") — __dirname is available, no top-level await.
import {
  readFileSync, appendFileSync, existsSync, writeFileSync, copyFileSync, mkdirSync,
} from "node:fs";
import { join, relative } from "node:path";
import { classify, type ClassifyConfig, type Verdict } from "./classify";

// --- locate the running Feather server (same precedence as examples/showcase.sh) ---
function endpointFile(): string {
  if (process.env.FEATHER_ENDPOINT_FILE) return process.env.FEATHER_ENDPOINT_FILE;
  if (process.env.XDG_RUNTIME_DIR) return join(process.env.XDG_RUNTIME_DIR, "feather/run/endpoint.json");
  const state = process.env.XDG_STATE_HOME ?? join(process.env.HOME ?? "", ".local/state");
  return join(state, "feather/run/endpoint.json");
}

const ep = endpointFile();
if (!existsSync(ep)) {
  console.error(`ERROR: endpoint.json not found at ${ep}. Is Feather running? Start it with 'npm run dev'.`);
  process.exit(1);
}
const { baseUrl, tokenFile } = JSON.parse(readFileSync(ep, "utf8")) as { baseUrl: string; tokenFile: string };
const token = readFileSync(tokenFile, "utf8").trim();

// CALIBRATION — confirmed live in docs/testing/gym-step1/recon-findings.md (Task 3).
// incolumitas behavioralClassificationScore: 0 = bot .. 1 = human, below 0.5 = bot.
const SCORE_CONFIG: ClassifyConfig = { humanThreshold: 0.5, direction: "higherIsHuman" };

// --- envelope-unwrapping HTTP helper (Node 20 global fetch) ---
async function feather<T = any>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "X-Feather-Token": token, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const env = (await res.json()) as { ok: boolean; data?: T; error?: unknown };
  if (!env.ok) throw new Error(`Feather API error on ${method} ${path}: ${JSON.stringify(env.error)}`);
  return env.data as T;
}

// --- session helpers ---
async function launchHeaded(): Promise<string> {
  const data = await feather<{ sessionId: string }>("POST", "/v1/sessions", {
    profile: { kind: "disposable" },
    browserMode: "chromium-headed-cdp", // headed so Roi watches it; same posture as 5d.2
    viewport: { width: 1280, height: 800 },
  });
  return data.sessionId;
}
const navigate = (sid: string, url: string) =>
  feather("POST", `/v1/sessions/${sid}/navigate`, { url, waitUntil: "domcontentloaded", timeoutMs: 30000 });
const snapshot = (sid: string) =>
  feather<{ markdown?: string; text?: string }>("POST", `/v1/sessions/${sid}/snapshot`, {});
const move = (sid: string, body: Record<string, unknown>) =>
  feather<{ x: number; y: number; steps: number }>("POST", `/v1/sessions/${sid}/move`, body);
const close = (sid: string) =>
  feather("DELETE", `/v1/sessions/${sid}`, { force: false }).catch(() => {});

async function shoot(sid: string, label: string): Promise<string> {
  const { path } = await feather<{ path: string }>("POST", `/v1/sessions/${sid}/screenshot`, { fullPage: true });
  const runs = join(__dirname, "runs");
  mkdirSync(runs, { recursive: true });
  const dest = join(runs, `${label}-${new Date().toISOString().replace(/[:.]/g, "-")}.png`);
  copyFileSync(path, dest);
  return dest;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * The behavioral score is computed SERVER-SIDE by abs.incolumitas.com (lib.js collects frames,
 * /classify grades them). When that backend is down it returns no score for ANYONE — that's
 * BLOCKED (can't grade us), not a Feather FAIL. Verified live 2026-06-26: a full 502 outage made
 * every run read "..." even though Feather delivered 156 trusted mousemove events. Probe lib.js:
 * 5xx/unreachable ⇒ down. Only called when we're otherwise UNSCORED, so it adds nothing to a real score.
 * Probing lib.js is a proxy for the whole abs service (the verified outage 502'd every endpoint); a
 * partial outage where lib.js is up but /classify is down could still mislabel — acceptable residual.
 * Timeout is load-bearing: a dead backend often HANGS rather than 502s fast — that hang is the exact
 * case this exists to catch, so a timeout counts as down.
 */
async function absDetectorDown(): Promise<boolean> {
  try {
    const res = await fetch("https://abs.incolumitas.com/lib.js", { method: "GET", signal: AbortSignal.timeout(5000) });
    return res.status >= 500; // 5xx = backend down; reachable (2xx/4xx) = up
  } catch {
    return true; // network error, DNS failure, or timeout (hung dead backend) ⇒ treat as down
  }
}

// MOTION — the trial knobs. Change these, re-run, read results.md to see motion -> score.
const MOTION = {
  label: "v1-bezier-varspeed",
  opts: { steps: 30, curviness: 0.2, jitter: 0.35, overshoot: 0.05 },
  // wander points across the 1280x800 viewport; ~6 moves over ~15s straddle the
  // detector's 1.5/4/7/10/15s scoring windows (recon-findings.md §4).
  waypoints: [
    { x: 200, y: 180 }, { x: 950, y: 240 }, { x: 600, y: 600 },
    { x: 300, y: 500 }, { x: 1050, y: 650 }, { x: 500, y: 300 },
  ] as { x: number; y: number }[],
};

/** Pull the value after "Your Behavioral Score:" from the page snapshot (e.g. "..." or "0.83"). */
function readBehavioralScore(markdown: string): string | null {
  const m = markdown.match(/Your Behavioral Score:\s*([^\n]*)/i);
  return m ? m[1].trim() : null;
}

function appendResult(v: Verdict, shot: string, motion: string): void {
  const file = join(__dirname, "results.md");
  if (!existsSync(file)) {
    writeFileSync(
      file,
      "# Gym — Behavioral Diagnostic Results\n\n" +
        "Honest record. UNSCORED is a FAIL when the detector is UP (unscoreable is a tell), " +
        "but BLOCKED when the detector's backend is DOWN (it can't grade anyone).\n\n" +
        "| When (UTC) | State | Score | Verdict | Motion | Evidence | Notes |\n" +
        "|---|---|---|---|---|---|---|\n",
    );
  }
  const rel = relative(__dirname, shot);
  appendFileSync(
    file,
    `| ${new Date().toISOString()} | ${v.state} | ${v.score ?? "—"} | ${v.outcome} | ${motion} | ${rel} | ${v.reason} |\n`,
  );
}

async function run(): Promise<void> {
  const sid = await launchHeaded();
  console.log(`[gym] session ${sid} — behavioral diagnostic vs bot.incolumitas.com (headed; watch it)`);
  try {
    await navigate(sid, "https://bot.incolumitas.com/");
    // Generate a real cursor trajectory — the signal the behavioral classifier needs to score us.
    // Wander across the viewport, pausing to straddle the 1.5/4/7/10/15s scoring windows.
    for (const wp of MOTION.waypoints) {
      await move(sid, { x: wp.x, y: wp.y, opts: MOTION.opts });
      await sleep(2500);
    }
    await sleep(2000); // settle past the final (15s) scoring window before reading
    const snap = await snapshot(sid);
    const raw = readBehavioralScore(snap.markdown ?? snap.text ?? "");
    // If we're unscored, find out WHY: detector backend down (BLOCKED) vs genuinely unscoreable (FAIL).
    const hasNumber = raw != null && /-?\d/.test(raw);
    const detectorDown = hasNumber ? false : await absDetectorDown();
    const verdict = classify(raw, SCORE_CONFIG, detectorDown);
    const shot = await shoot(sid, verdict.outcome);

    console.log(`\n[gym] raw score field: ${raw === null ? "(absent)" : JSON.stringify(raw)}`);
    console.log(`[gym] ${verdict.state} ${verdict.score ?? ""} -> ${verdict.outcome}`);
    console.log(`[gym] ${verdict.reason}`);
    console.log(`[gym] evidence: ${shot}`);
    appendResult(verdict, shot, MOTION.label);
  } finally {
    await close(sid);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

// The gym's reusable Feather HTTP-client surface (for Step 2's scoreboard wire to reuse).
export { feather, launchHeaded, navigate, snapshot, shoot, close, sleep, move };
