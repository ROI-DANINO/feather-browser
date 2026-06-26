// Gym Step 1 — behavioral diagnostic runner. An HTTP client of a running Feather server.
// CommonJS module (repo has no "type":"module") — __dirname is available, no top-level await.
import {
  readFileSync, appendFileSync, existsSync, writeFileSync, copyFileSync, mkdirSync,
} from "node:fs";
import { join } from "node:path";

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
const extract = (sid: string, selector: string) =>
  feather<Record<string, string>>("POST", `/v1/sessions/${sid}/extract`, {
    recipe: { fields: { score: { selector, type: "text" } } },
  }).then((d) => d.score ?? null);
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

// --- RECON: discover what incolumitas exposes. Replaced by run() in Task 4. ---
async function recon(): Promise<void> {
  const sid = await launchHeaded();
  console.log(`[gym] session ${sid} — recon vs bot.incolumitas.com (headed; watch the window)`);
  try {
    await navigate(sid, "https://bot.incolumitas.com/");
    await sleep(8000); // let the page settle + attempt to score
    const snap = await snapshot(sid);
    console.log("\n===== SNAPSHOT =====\n");
    console.log((snap.markdown ?? snap.text ?? "").slice(0, 8000));
    console.log(`\n[gym] recon screenshot: ${await shoot(sid, "recon")}`);
  } finally {
    await close(sid);
  }
}

recon().catch((e) => {
  console.error(e);
  process.exit(1);
});

// Re-exported so Task 4's edits keep the helpers reachable and lint-clean.
export { feather, launchHeaded, navigate, snapshot, extract, shoot, close, sleep };
