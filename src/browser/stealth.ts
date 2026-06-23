import type { Page } from "playwright";

export type SiteClass = "standard" | "tier-c";

export interface StealthCheckResult {
  ok: boolean;
  warnings: string[];
}

/**
 * Layer 1 — CDP surface minimization is a "don't enable it" guarantee, not positive code.
 * The detection tell is Playwright auto-sending Runtime.enable when console/pageerror listeners
 * attach. Feather's real session path attaches none (audited; see plan Task 1 — the only
 * console/pageerror listeners live in src/debug/capture.ts, which is opt-in and gated on
 * input.debug, never wired onto a non-debug session). Do not add page.on("console") /
 * page.on("pageerror") on the session path. Enforcement lives in the self-test (anti-detection
 * probe) asserting Runtime.enable is absent on a clean session open.
 */

/** OBSERVABILITY ONLY — labels a URL's known bot-detection risk for logging. Never a control-flow gate. */
const TIER_C_DOMAINS = ["linkedin.com", "instagram.com", "facebook.com"];
export function classifySite(url: string): SiteClass {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return "standard";
  }
  return TIER_C_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`)) ? "tier-c" : "standard";
}

const MIN_JITTER_MS = 50;
const MAX_JITTER_MS = 150;

/**
 * A human-like per-keystroke delay in [50,150] ms. Called once per `type` call (uniform delay
 * across that call's keystrokes; varies call-to-call). Per-keystroke statistical variation is the
 * deferred kinematic spike — this is the honest v1 cadence.
 */
export function jitterDelayMs(): number {
  return MIN_JITTER_MS + Math.floor(Math.random() * (MAX_JITTER_MS - MIN_JITTER_MS + 1));
}

/**
 * Layer 4 — fingerprint consistency CHECK. No spoofing, no canvas noise, NO font guard.
 * Real Chromium on a real GPU already has a genuine, stable fingerprint; detectors look for
 * *tampering* first. This verifies the real WebGL renderer is intact and flags SwiftShader,
 * which means the headless GPU leaked through and the session is already detectable.
 */
export async function applyFingerprintCheck(page: Page): Promise<StealthCheckResult> {
  const gpu = (await page.evaluate(() => {
    try {
      const c = document.createElement("canvas");
      const gl = (c.getContext("webgl") || c.getContext("experimental-webgl")) as WebGLRenderingContext | null;
      const dbg = gl && gl.getExtension("WEBGL_debug_renderer_info");
      return {
        webglVendor: dbg ? String(gl!.getParameter(dbg.UNMASKED_VENDOR_WEBGL)) : "no-ext",
        webglRenderer: dbg ? String(gl!.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : "no-ext",
      };
    } catch (e) {
      return { webglVendor: "err", webglRenderer: String(e) };
    }
  })) as { webglVendor: string; webglRenderer: string };

  const warnings: string[] = [];
  if (/swiftshader/i.test(gpu.webglRenderer)) {
    warnings.push(`SwiftShader renderer detected (${gpu.webglRenderer}) — headless GPU leaked through; session is detectable`);
  }
  if (gpu.webglRenderer === "no-ext" || gpu.webglVendor === "err") {
    warnings.push("WebGL renderer info unavailable — possible hardened/atypical GPU context");
  }
  return { ok: warnings.length === 0, warnings };
}

/**
 * Layer 2 — environment consistency CHECK (never spoof). Spoofing locale/timezone without a
 * matching geo-proxy introduces an Accept-Language / timezone-vs-IP mismatch that is itself a
 * detection tell. On a real desktop the values already match the real IP. We verify and warn.
 */
export async function applyStealthEnvironment(page: Page): Promise<StealthCheckResult> {
  const env = (await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    screenWidth: screen.width,
    screenHeight: screen.height,
    devicePixelRatio: window.devicePixelRatio,
    languages: navigator.languages ? Array.from(navigator.languages) : [],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }))) as {
    innerWidth: number; innerHeight: number; screenWidth: number; screenHeight: number;
    devicePixelRatio: number; languages: string[]; timezone: string;
  };

  const warnings: string[] = [];
  if (env.innerWidth > env.screenWidth || env.innerHeight > env.screenHeight) {
    warnings.push(`viewport (${env.innerWidth}x${env.innerHeight}) exceeds screen (${env.screenWidth}x${env.screenHeight})`);
  }
  if (env.languages.length === 0) warnings.push("navigator.languages is empty (real browsers report at least one)");
  if (!env.timezone) warnings.push("timezone is empty");
  if (env.devicePixelRatio <= 0) warnings.push(`implausible devicePixelRatio: ${env.devicePixelRatio}`);

  return { ok: warnings.length === 0, warnings };
}
