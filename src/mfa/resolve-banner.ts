import type { BrowserContext, Page } from "playwright";
import { showResolveBanner, resolveTabRequested, markBannerOpened, removeResolveBanner } from "../browser/pause-banner";

export interface ResolveBannerHandle {
  /** Stop polling, remove the banner. Idempotent. */
  dispose(): Promise<void>;
}

export interface ResolveBannerArgs {
  page: Page;
  context: BrowserContext;
  prompt: string;
  /** The token-bearing resolve URL. Opened by Feather over CDP — never placed in the watched page. */
  humanUrl: string;
}

const POLL_MS = 300;

/**
 * Show the MFA resolve banner on `page` and, when the human clicks it, open the resolve form in a NEW
 * tab over CDP. The bearer token lives only in `humanUrl` (which Feather navigates the new tab to) — it
 * never enters the watched page, whose JS cannot read another tab's URL. Best-effort: a failed inject or
 * a failed open never throws to the caller.
 */
export async function startResolveBanner({ page, context, prompt, humanUrl }: ResolveBannerArgs): Promise<ResolveBannerHandle> {
  let disposed = false;
  let opened = false;

  await showResolveBanner(page, prompt).catch(() => {});
  // A navigation replaces the document and destroys the banner; re-inject so the affordance follows the
  // human across page switches (showResolveBanner is idempotent). Same hook await-human uses.
  const reinject = (): void => { if (!opened) void showResolveBanner(page, prompt).catch(() => {}); };
  page.on("domcontentloaded", reinject);

  const poll = setInterval(() => {
    if (disposed || opened) return;
    void (async () => {
      if (!(await resolveTabRequested(page))) return;
      opened = true; // set before the await so a slow open can't double-fire on the next tick
      try {
        const tab = await context.newPage();
        await tab.goto(humanUrl).catch(() => {}); // a load failure still leaves the human on the right URL
        await markBannerOpened(page).catch(() => {});
      } catch {
        opened = false; // the open itself failed — let a later tick retry
      }
    })();
  }, POLL_MS);

  return {
    async dispose(): Promise<void> {
      if (disposed) return;
      disposed = true;
      clearInterval(poll);
      page.off("domcontentloaded", reinject);
      await removeResolveBanner(page).catch(() => {});
    },
  };
}

// ── Controller (resolves the real page/context from a session id) ─────────────

interface BannerSession {
  getPage(pageId?: string): { page: Page };
  getContext(): BrowserContext;
}
interface BannerSessionLookup {
  get(sessionId: string): BannerSession;
}

export interface ResolveBannerController {
  show(sessionId: string, pageId: string | undefined, prompt: string, humanUrl: string): Promise<ResolveBannerHandle>;
}

/** Wire a controller over the real SessionManager — used by the MFA manager (best-effort) at routes time. */
export function makeResolveBannerController(sessions: BannerSessionLookup): ResolveBannerController {
  return {
    async show(sessionId, pageId, prompt, humanUrl): Promise<ResolveBannerHandle> {
      const session = sessions.get(sessionId);
      const { page } = session.getPage(pageId);
      const context = session.getContext();
      return startResolveBanner({ page, context, prompt, humanUrl });
    },
  };
}
