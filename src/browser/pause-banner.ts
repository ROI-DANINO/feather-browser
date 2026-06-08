import type { Page } from "playwright";

export const BANNER_ID = "__feather_pause_banner__";

/**
 * Inject a fixed Resume banner at the top of the working page. Clicking Resume sets a DOM flag
 * (`data-resumed="1"`) — it makes NO network request, so it can't be blocked by Chromium's Private
 * Network Access / CORS / mixed-content rules and opens no new tab. Feather already drives this page
 * over CDP and polls for the flag (see AwaitHumanHandler). `reason` is set via textContent (no HTML
 * injection).
 */
export async function showBanner(page: Page, reason: string): Promise<void> {
  await page.evaluate(
    ({ id, reason }: { id: string; reason: string }) => {
      if (!document.body || document.getElementById(id)) return;
      const bar = document.createElement("div");
      bar.id = id;
      bar.style.cssText =
        "position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#1a73e8;color:#fff;" +
        "font-family:system-ui,sans-serif;font-size:14px;padding:10px 16px;display:flex;" +
        "align-items:center;justify-content:center;gap:16px;box-shadow:0 2px 8px rgba(0,0,0,.35)";
      const span = document.createElement("span");
      span.textContent = "⏸ Feather paused: " + reason;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "Resume ▸";
      btn.style.cssText =
        "font-size:14px;font-weight:600;padding:6px 16px;border:0;border-radius:6px;" +
        "background:#fff;color:#1a73e8;cursor:pointer";
      btn.addEventListener("click", () => {
        bar.setAttribute("data-resumed", "1"); // Feather polls for this over CDP
        bar.style.background = "#137333";
        span.textContent = "✓ Resumed — returning to the agent";
        btn.disabled = true;
      });
      bar.appendChild(span);
      bar.appendChild(btn);
      document.body.appendChild(bar);
    },
    { id: BANNER_ID, reason },
  );
}

/** True if the banner's Resume button has been clicked (the DOM flag is set). */
export async function bannerResumed(page: Page): Promise<boolean> {
  return page
    .evaluate((id: string) => document.getElementById(id)?.getAttribute("data-resumed") === "1", BANNER_ID)
    .catch(() => false);
}

/** Remove the Resume banner if present (no-op if the page navigated away). */
export async function removeBanner(page: Page): Promise<void> {
  await page.evaluate((id: string) => {
    document.getElementById(id)?.remove();
  }, BANNER_ID);
}
