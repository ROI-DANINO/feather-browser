import type { Page } from "playwright";

export const BANNER_ID = "__feather_pause_banner__";
export const RESOLVE_BANNER_ID = "__feather_resolve_banner__";

interface BannerSpec {
  id: string;
  /** Full banner text (set via textContent — no HTML injection). */
  message: string;
  buttonLabel: string;
  /** DOM attribute the button sets to "1" on click; Feather polls it over CDP. */
  flagAttr: string;
  /** Optional on-click feedback (used by the Resume banner; the resolve banner updates later instead). */
  successMessage?: string;
  successColor?: string;
}

/**
 * Inject a fixed banner at the top of the working page. The button makes NO network request and opens
 * no tab — it only sets `flagAttr` on the bar, which Feather polls over CDP. That keeps it immune to
 * Chromium's Private Network Access / CORS / mixed-content rules and, crucially, keeps any bearer
 * secret out of the (possibly hostile) page: the page never holds a token, Feather acts on the flag.
 */
async function injectBanner(page: Page, spec: BannerSpec): Promise<void> {
  await page.evaluate((s: BannerSpec) => {
    if (!document.body || document.getElementById(s.id)) return;
    const bar = document.createElement("div");
    bar.id = s.id;
    bar.style.cssText =
      "position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#1a73e8;color:#fff;" +
      "font-family:system-ui,sans-serif;font-size:14px;padding:10px 16px;display:flex;" +
      "align-items:center;justify-content:center;gap:16px;box-shadow:0 2px 8px rgba(0,0,0,.35)";
    const span = document.createElement("span");
    span.textContent = s.message;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = s.buttonLabel;
    btn.style.cssText =
      "font-size:14px;font-weight:600;padding:6px 16px;border:0;border-radius:6px;" +
      "background:#fff;color:#1a73e8;cursor:pointer";
    btn.addEventListener("click", () => {
      bar.setAttribute(s.flagAttr, "1"); // Feather polls for this over CDP
      btn.disabled = true;
      if (s.successMessage) span.textContent = s.successMessage;
      if (s.successColor) bar.style.background = s.successColor;
    });
    bar.appendChild(span);
    bar.appendChild(btn);
    document.body.appendChild(bar);
  }, spec);
}

async function flagSet(page: Page, id: string, attr: string): Promise<boolean> {
  return page
    .evaluate(({ id, attr }: { id: string; attr: string }) => document.getElementById(id)?.getAttribute(attr) === "1", { id, attr })
    .catch(() => false);
}

async function removeById(page: Page, id: string): Promise<void> {
  await page.evaluate((id: string) => { document.getElementById(id)?.remove(); }, id);
}

// ── Resume banner (await-human) ──────────────────────────────────────────────
/** Inject the Resume banner. Clicking Resume sets `data-resumed="1"` (no network, opens no tab). */
export async function showBanner(page: Page, reason: string): Promise<void> {
  await injectBanner(page, {
    id: BANNER_ID,
    message: "⏸ Feather paused: " + reason,
    buttonLabel: "Resume ▸",
    flagAttr: "data-resumed",
    successMessage: "✓ Resumed — returning to the agent",
    successColor: "#137333",
  });
}

/** True if the Resume button has been clicked (the DOM flag is set). */
export async function bannerResumed(page: Page): Promise<boolean> {
  return flagSet(page, BANNER_ID, "data-resumed");
}

/** Remove the Resume banner if present (no-op if the page navigated away). */
export async function removeBanner(page: Page): Promise<void> {
  await removeById(page, BANNER_ID);
}

// ── Resolve banner (local MFA channel) ───────────────────────────────────────
/** Inject the MFA resolve banner. Clicking it sets `data-open-resolve="1"`; Feather then opens the
 *  token-bearing resolve tab over CDP (the token never touches this page). */
export async function showResolveBanner(page: Page, prompt: string): Promise<void> {
  await injectBanner(page, {
    id: RESOLVE_BANNER_ID,
    message: "🔒 Feather needs a 2FA code: " + prompt,
    buttonLabel: "Open 2FA tab ▸",
    flagAttr: "data-open-resolve",
  });
}

/** True if the human asked to open the resolve tab (the DOM flag is set). */
export async function resolveTabRequested(page: Page): Promise<boolean> {
  return flagSet(page, RESOLVE_BANNER_ID, "data-open-resolve");
}

/** Update the resolve banner after Feather has opened the tab. */
export async function markBannerOpened(page: Page): Promise<void> {
  await page.evaluate((id: string) => {
    const span = document.getElementById(id)?.querySelector("span");
    if (span) span.textContent = "🔒 2FA tab opened — complete it there";
  }, RESOLVE_BANNER_ID);
}

/** Remove the resolve banner if present. */
export async function removeResolveBanner(page: Page): Promise<void> {
  await removeById(page, RESOLVE_BANNER_ID);
}
