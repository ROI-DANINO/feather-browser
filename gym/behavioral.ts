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

/** Pull the value after "Your Behavioral Score:" from the page snapshot (e.g. "..." or "0.83"). */
function readBehavioralScore(markdown: string): string | null {
  const m = markdown.match(/Your Behavioral Score:\s*([^\n]*)/i);
  return m ? m[1].trim() : null;
}

function appendResult(v: Verdict, shot: string): void {
  const file = join(__dirname, "results.md");
  if (!existsSync(file)) {
    writeFileSync(
      file,
      "# Gym — Behavioral Diagnostic Results\n\n" +
        "Honest record. UNSCORED counts as FAIL (an unscoreable session is itself a tell).\n\n" +
        "| When (UTC) | State | Score | Verdict | Evidence | Notes |\n" +
        "|---|---|---|---|---|---|\n",
    );
  }
  const rel = relative(__dirname, shot);
  appendFileSync(
    file,
    `| ${new Date().toISOString()} | ${v.state} | ${v.score ?? "—"} | ${v.outcome} | ${rel} | ${v.reason} |\n`,
  );
}

async function run(): Promise<void> {
  const sid = await launchHeaded();
  console.log(`[gym] session ${sid} — behavioral diagnostic vs bot.incolumitas.com (headed; watch it)`);
  try {
    await navigate(sid, "https://bot.incolumitas.com/");
    // No synthetic interaction: the missing signal IS cursor motion (the upgrade under test).
    // The score auto-updates at 1.5/4/7/10/15s — wait past the last window, then read.
    await sleep(17000);
    const snap = await snapshot(sid);
    const raw = readBehavioralScore(snap.markdown ?? snap.text ?? "");
    const verdict = classify(raw, SCORE_CONFIG);
    const shot = await shoot(sid, verdict.outcome);

    console.log(`\n[gym] raw score field: ${raw === null ? "(absent)" : JSON.stringify(raw)}`);
    console.log(`[gym] ${verdict.state} ${verdict.score ?? ""} -> ${verdict.outcome}`);
    console.log(`[gym] ${verdict.reason}`);
    console.log(`[gym] evidence: ${shot}`);
    appendResult(verdict, shot);
  } finally {
    await close(sid);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

// The gym's reusable Feather HTTP-client surface (for Step 2's scoreboard wire to reuse).
export { feather, launchHeaded, navigate, snapshot, shoot, close, sleep };
