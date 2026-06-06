/**
 * THROWAWAY SPIKE — ships nothing (not imported by src/). Workstream ②.3.
 *
 * Anti-detection self-test. Fingerprints Feather's OWN automated session — no Google, no account,
 * a fresh throwaway profile per run, so zero account risk. Compares fingerprint vectors across
 * spawn modes to answer "how detectable is Feather right now?" and "can we ever run headless?".
 *
 * Modes compared here (both runnable on this box):
 *   - headed-CDP on Wayland  (the current default Cookie-Mine path)
 *   - --headless=new         (FEATHER_SPAWN_HEADLESS=1)
 * Xvfb-headed is the third mode of interest but needs a sudo Xvfb install (-> Roi); recorded as a
 * gap, not faked.
 *
 * Run:  npx ts-node scripts/spikes/anti-detection-probe.ts
 */
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { spawnAndConnect } from "../../src/browser/modes";

const SYSTEM_CHROMIUM_CANDIDATES = [
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  "/usr/lib64/chromium-browser/chromium-browser",
];

const PROBE = `(() => {
  const out = {};
  out.webdriver = navigator.webdriver;
  out.userAgent = navigator.userAgent;
  out.uaBrands = (navigator.userAgentData && navigator.userAgentData.brands || []).map(b => b.brand + ' ' + b.version).join(', ');
  out.uaMobile = navigator.userAgentData ? navigator.userAgentData.mobile : null;
  out.languages = (navigator.languages || []).join(',');
  out.pluginsLength = navigator.plugins ? navigator.plugins.length : -1;
  out.mimeTypesLength = navigator.mimeTypes ? navigator.mimeTypes.length : -1;
  out.windowChrome = typeof window.chrome;
  out.chromeRuntime = !!(window.chrome && window.chrome.runtime);
  out.hardwareConcurrency = navigator.hardwareConcurrency;
  out.deviceMemory = navigator.deviceMemory;
  out.maxTouchPoints = navigator.maxTouchPoints;
  out.screen = [screen.width, screen.height, screen.availWidth, screen.availHeight].join('x');
  out.devicePixelRatio = window.devicePixelRatio;
  out.notificationPermission = (typeof Notification !== 'undefined') ? Notification.permission : 'no-Notification';
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    const dbg = gl && gl.getExtension('WEBGL_debug_renderer_info');
    out.webglVendor = dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : 'no-ext';
    out.webglRenderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'no-ext';
  } catch (e) { out.webglVendor = 'err'; out.webglRenderer = String(e); }
  try {
    const c = document.createElement('canvas'); c.width = 220; c.height = 30;
    const ctx = c.getContext('2d');
    ctx.textBaseline = 'top'; ctx.font = "14px 'Arial'";
    ctx.fillStyle = '#f60'; ctx.fillRect(0,0,100,20);
    ctx.fillStyle = '#069'; ctx.fillText('Feather-probe ⚡', 2, 2);
    const data = c.toDataURL();
    let h = 0; for (let i = 0; i < data.length; i++) { h = (h * 31 + data.charCodeAt(i)) >>> 0; }
    out.canvasHash = h.toString(16);
  } catch (e) { out.canvasHash = 'err'; }
  return out;
})()`;

async function probeMode(label: string, headless: boolean, executablePath: string): Promise<Record<string, unknown>> {
  const savedHl = process.env.FEATHER_SPAWN_HEADLESS;
  if (headless) process.env.FEATHER_SPAWN_HEADLESS = "1";
  else delete process.env.FEATHER_SPAWN_HEADLESS;

  const profile = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-probe-"));
  const { context, childProcess } = await spawnAndConnect({ profilePath: profile, executablePath });
  try {
    const page = await context.newPage();
    await page.goto("about:blank", { waitUntil: "domcontentloaded", timeout: 20_000 }).catch(() => {});
    const vec = (await page.evaluate(PROBE)) as Record<string, unknown>;
    vec._mode = label;
    return vec;
  } finally {
    try { await context.browser()?.close(); } catch { /* */ }
    try { childProcess.kill(); } catch { /* */ }
    if (savedHl === undefined) delete process.env.FEATHER_SPAWN_HEADLESS;
    else process.env.FEATHER_SPAWN_HEADLESS = savedHl;
    await fs.promises.rm(profile, { recursive: true, force: true }).catch(() => {});
  }
}

async function main(): Promise<void> {
  const executablePath = process.env.FEATHER_CHROMIUM_PATH
    ?? SYSTEM_CHROMIUM_CANDIDATES.find((p) => fs.existsSync(p))
    ?? "";
  if (!executablePath) { console.error("no system Chromium found"); process.exit(1); }

  console.log(`# Anti-detection self-test — ${new Date().toISOString()}`);
  console.log(`chromium: ${executablePath}`);
  console.log(`WAYLAND_DISPLAY: ${process.env.WAYLAND_DISPLAY ?? "(unset)"}\n`);

  const headed = await probeMode("headed-CDP (wayland)", false, executablePath);
  const headless = await probeMode("--headless=new", true, executablePath);

  const keys = Object.keys(headed).filter((k) => k !== "_mode");
  console.log(`| signal | headed-CDP (wayland) | --headless=new | differs |`);
  console.log(`|---|---|---|---|`);
  for (const k of keys) {
    const a = String(headed[k]); const b = String(headless[k]);
    const diff = a !== b ? "**yes**" : "";
    const trunc = (s: string) => (s.length > 60 ? s.slice(0, 57) + "…" : s);
    console.log(`| ${k} | ${trunc(a)} | ${trunc(b)} | ${diff} |`);
  }
  const outFile = path.join(os.tmpdir(), `feather-antidetect-${Date.now()}.json`);
  await fs.promises.writeFile(outFile, JSON.stringify({ headed, headless }, null, 2));
  console.log(`\nraw: ${outFile}`);
  process.exit(0);
}

main().catch((err) => { console.error(`probe failed: ${(err as Error).stack ?? err}`); process.exit(1); });
