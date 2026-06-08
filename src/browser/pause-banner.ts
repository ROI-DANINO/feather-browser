import type { Page } from "playwright";

export const BANNER_ID = "__feather_pause_banner__";

/**
 * Inject a fixed Resume banner at the top of the working page. The button is a cross-origin form
 * POST (target=_blank) to the resume route — one click resumes, confirmation opens in a new tab,
 * the working page keeps its state. `reason` is set via textContent (no HTML injection).
 */
export async function showBanner(page: Page, reason: string, resumeUrl: string): Promise<void> {
  await page.evaluate(
    ({ id, reason, url }: { id: string; reason: string; url: string }) => {
      if (!document.body || document.getElementById(id)) return;
      const bar = document.createElement("div");
      bar.id = id;
      bar.style.cssText =
        "position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#1a73e8;color:#fff;" +
        "font-family:system-ui,sans-serif;font-size:14px;padding:10px 16px;display:flex;" +
        "align-items:center;justify-content:center;gap:16px;box-shadow:0 2px 8px rgba(0,0,0,.35)";
      const span = document.createElement("span");
      span.textContent = "⏸ Feather paused: " + reason;
      const form = document.createElement("form");
      form.method = "POST";
      form.action = url;
      form.target = "_blank";
      form.style.margin = "0";
      const btn = document.createElement("button");
      btn.type = "submit";
      btn.textContent = "Resume ▸";
      btn.style.cssText =
        "font-size:14px;font-weight:600;padding:6px 16px;border:0;border-radius:6px;" +
        "background:#fff;color:#1a73e8;cursor:pointer";
      form.appendChild(btn);
      bar.appendChild(span);
      bar.appendChild(form);
      document.body.appendChild(bar);
    },
    { id: BANNER_ID, reason, url: resumeUrl },
  );
}

/** Remove the Resume banner if present (no-op if the page navigated away). */
export async function removeBanner(page: Page): Promise<void> {
  await page.evaluate((id: string) => {
    document.getElementById(id)?.remove();
  }, BANNER_ID);
}
