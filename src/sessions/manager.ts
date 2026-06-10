import * as fs from "fs";
import * as path from "path";
import { chromium, type BrowserContext, type Page } from "playwright";
import { FeatherSession, SessionNotFoundError } from "./session";
import { buildLaunchOptions, spawnAndConnect } from "../browser/modes";
import { DebugCapture } from "../debug/capture";
import { resolveChromiumExecutable } from "../config";
import { redactProxy, redactUrl } from "../logs/redact";
import { FeatherLogger } from "../logs/logger";
import { EVENTS } from "../logs/events";
import type { FeatherPaths } from "../fs-layout";
import type { ProfileLock } from "../profiles/lock";
import type { WorkspaceMetadata } from "../profiles/workspace";
import type {
  BrowserMode,
  PageInfo,
  ProfileKind,
  ProxyConfig,
  ProxySummary,
  ISession,
} from "./types";

const CLOSE_TIMEOUT_MS = 10_000;

async function closeContextWithTimeout(context: BrowserContext, timeoutMs: number): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`context.close() timed out after ${timeoutMs}ms`)),
      timeoutMs
    );
  });
  try {
    await Promise.race([context.close(), timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

export interface LaunchSessionInput {
  workspaceId?: string;
  profile: { kind: ProfileKind };
  browserMode?: BrowserMode;
  viewport?: { width: number; height: number };
  proxy?: ProxyConfig | null;
  debug?: { trace?: boolean; screenshots?: boolean };
}

export interface CloseTabResult {
  sessionId: string;
  closedPageId: string;
  pages: PageInfo[];
}

export interface ISessionManager {
  launch(input: LaunchSessionInput): Promise<ISession>;
  get(sessionId: string): ISession;
  list(): ISession[];
  close(sessionId: string, opts?: { force?: boolean; quarantineDisposableProfile?: boolean }): Promise<void>;
  openTab(sessionId: string): Promise<PageInfo>;
  closeTab(sessionId: string, pageId: string): Promise<CloseTabResult>;
  listTabs(sessionId: string): Promise<{ sessionId: string; pages: PageInfo[] }>;
}

export class SessionManager implements ISessionManager {
  private readonly registry: Map<string, FeatherSession> = new Map();
  private readonly logger: FeatherLogger;

  constructor(
    private readonly paths: FeatherPaths,
    private readonly lock: ProfileLock,
    private readonly workspace: WorkspaceMetadata
  ) {
    this.logger = new FeatherLogger(paths);
  }

  async launch(input: LaunchSessionInput): Promise<FeatherSession> {
    const workspaceId = input.workspaceId ?? "default";
    const browserMode: BrowserMode = input.browserMode ?? "chromium-new-headless";
    const profileKind = input.profile.kind;
    const proxy = input.proxy ?? null;
    const proxySummary: ProxySummary | null = proxy ? redactProxy(proxy) : null;

    const session = new FeatherSession({
      workspaceId,
      profileKind,
      browserMode,
      profilePath: "",
      debugDir: this.paths.debugDir("placeholder"),
      proxy: proxySummary,
    });

    const profilePath =
      profileKind === "persistent"
        ? this.paths.profileDir(workspaceId)
        : this.paths.disposableProfileDir(session.sessionId);

    const debugDir = this.paths.debugDir(session.sessionId);

    Object.defineProperty(session, "profilePath", { value: profilePath });
    Object.defineProperty(session, "debugDir", { value: debugDir });

    await fs.promises.mkdir(profilePath, { recursive: true });
    await fs.promises.mkdir(debugDir, { recursive: true });

    if (profileKind === "persistent") {
      await this.lock.create(workspaceId, session.sessionId, browserMode, proxySummary);
      await this.workspace.ensureExists(workspaceId);
    }

    await this.logger.log({
      ts: new Date().toISOString(),
      level: "info",
      event: EVENTS.SESSION_LAUNCH_REQUESTED,
      sessionId: session.sessionId,
      data: { workspaceId, profileKind, browserMode, proxy: proxySummary },
    });

    let context: BrowserContext;
    if (browserMode === "chromium-headed-cdp") {
      if (proxy) {
        await this.logger.log({
          ts: new Date().toISOString(),
          level: "warn",
          event: EVENTS.SESSION_OPTION_IGNORED,
          sessionId: session.sessionId,
          data: { option: "proxy", reason: "proxy is not applied in chromium-headed-cdp mode" },
        });
      }
      const { context: cdpContext, childProcess } = await spawnAndConnect({
        profilePath,
        executablePath: resolveChromiumExecutable(chromium.executablePath()),
        viewport: input.viewport,
      });
      context = cdpContext;
      session.setChildProcess(childProcess);
    } else {
      const launchOpts = buildLaunchOptions(browserMode, proxy ?? undefined, input.viewport);
      context = await chromium.launchPersistentContext(profilePath, launchOpts);
    }

    session.setContext(context);

    if (input.debug) {
      const capture = new DebugCapture(context, debugDir, input.debug);
      await capture.start();
      session.setDebugCapture(capture);
    }

    context.on("page", (page) => {
      const pageId = session.addPage(page);
      void this.logger.log({
        ts: new Date().toISOString(),
        level: "info",
        event: EVENTS.TAB_CREATED,
        sessionId: session.sessionId,
        data: { pageId },
      });
      this.attachPageListeners(session, pageId, page);
    });

    // Initial page(s) present at launch are added by session.setContext()
    // and never flow through context.on("page") — attach their lifecycle
    // listeners here so closing the initial tab reaps it too.
    for (const page of context.pages()) {
      this.attachPageListeners(session, session.addPage(page), page);
    }

    this.registry.set(session.sessionId, session);

    await this.logger.log({
      ts: new Date().toISOString(),
      level: "info",
      event: EVENTS.SESSION_LAUNCH_COMPLETED,
      sessionId: session.sessionId,
      data: {
        workspaceId,
        profileKind,
        browserMode,
        proxy: proxySummary,
      },
    });

    return session;
  }

  get(sessionId: string): FeatherSession {
    const session = this.registry.get(sessionId);
    if (!session) throw new SessionNotFoundError(sessionId);
    return session;
  }

  list(): FeatherSession[] {
    return Array.from(this.registry.values());
  }

  async openTab(sessionId: string): Promise<PageInfo> {
    const session = this.get(sessionId);
    const { pageId, page } = await session.openTab();
    await this.logger.log({
      ts: new Date().toISOString(),
      level: "info",
      event: EVENTS.TAB_OPENED,
      sessionId,
      data: { pageId },
    });
    const loadState = await page.evaluate(() => document.readyState);
    return { pageId, url: page.url(), title: await page.title(), loadState };
  }

  async listTabs(sessionId: string): Promise<{ sessionId: string; pages: PageInfo[] }> {
    const session = this.get(sessionId);
    return { sessionId, pages: await session.getPageInfoList() };
  }

  async closeTab(sessionId: string, pageId: string): Promise<CloseTabResult> {
    const session = this.get(sessionId);
    await session.closeTab(pageId);
    // tab.closed is emitted by the page "close" listener (single source of truth).
    const pages = await session.getPageInfoList();
    return { sessionId, closedPageId: pageId, pages };
  }

  private attachPageListeners(session: FeatherSession, pageId: string, page: Page): void {
    page.on("close", () => {
      session.removePage(pageId);
      void this.logger.log({
        ts: new Date().toISOString(),
        level: "info",
        event: EVENTS.TAB_CLOSED,
        sessionId: session.sessionId,
        data: { pageId },
      });
    });
    page.on("framenavigated", async (frame) => {
      if (frame !== page.mainFrame()) return;          // main frame only
      session.clearObserveCache(pageId);               // perception is stale after a real navigation
      const target = page.url();                       // capture target URL
      try {
        await page.waitForLoadState("domcontentloaded");
      } catch {
        /* best-effort: resolves instantly when already settled (SPA case) */
      }
      if (page.url() !== target) return;               // superseded by a newer navigation
      let title = "";
      let loadState = "unknown";
      try {
        title = await page.title();
      } catch {
        /* best-effort */
      }
      try {
        loadState = await page.evaluate(() => document.readyState);
      } catch {
        /* best-effort */
      }
      void this.logger.log({
        ts: new Date().toISOString(),
        level: "info",
        event: EVENTS.TAB_UPDATED,
        sessionId: session.sessionId,
        data: { pageId, url: redactUrl(page.url()), title, loadState },
      });
    });
  }

  async close(
    sessionId: string,
    opts?: { force?: boolean; quarantineDisposableProfile?: boolean }
  ): Promise<void> {
    const session = this.get(sessionId);
    session.setState("closing");

    await this.logger.log({
      ts: new Date().toISOString(),
      level: "info",
      event: EVENTS.SESSION_CLOSE_REQUESTED,
      sessionId: session.sessionId,
    });

    try {
      const context = session.getContext();
      const capture = session.getDebugCapture();
      if (capture) {
        try {
          await capture.finalize();
        } catch (err) {
          await this.logger.log({
            ts: new Date().toISOString(),
            level: "warn",
            event: EVENTS.DEBUG_CAPTURE_FINALIZE_FAILED,
            sessionId: session.sessionId,
            data: { error: (err as any)?.message ?? "unknown" },
          });
        }
      }
      if (opts?.force) {
        try { await closeContextWithTimeout(context, CLOSE_TIMEOUT_MS); } catch { /* ignore */ }
      } else {
        await closeContextWithTimeout(context, CLOSE_TIMEOUT_MS);
      }
    } catch (err) {
      session.setState("failed");
      session.getChildProcess()?.kill();
      await this.logger.log({
        ts: new Date().toISOString(),
        level: "error",
        event: EVENTS.SESSION_CLOSE_FAILED,
        sessionId: session.sessionId,
        data: { error: (err as any)?.message ?? "unknown" },
      });
      throw err;
    }

    session.setState("closed");
    session.getChildProcess()?.kill();

    await this.logger.log({
      ts: new Date().toISOString(),
      level: "info",
      event: EVENTS.SESSION_CLOSE_COMPLETED,
      sessionId: session.sessionId,
    });

    if (session.profileKind === "persistent") {
      await this.lock.release(session.workspaceId);
    }

    if (session.profileKind === "disposable") {
      const child = session.getChildProcess();
      if (child) {
        // Chromium may still be writing files after kill(); wait for the process
        // to fully exit before we delete the profile dir to avoid ENOTEMPTY races.
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, 3000); // don't wait forever
          child.once("exit", () => { clearTimeout(timer); resolve(); });
        });
      }

      const sessionDir = this.paths.disposableSessionDir(sessionId);
      if (opts?.quarantineDisposableProfile) {
        const quarantineDir = this.paths.quarantinedProfileDir(sessionId);
        await fs.promises.mkdir(path.dirname(quarantineDir), { recursive: true });
        try {
          await fs.promises.rename(session.profilePath, quarantineDir);
        } catch (err) {
          // Same discipline as the rm branch: a failed quarantine loses the forensic profile —
          // that must leave a trace, not vanish. (Missing profile dir lands here too; benign.)
          await this.logger.log({
            ts: new Date().toISOString(),
            level: "warn",
            event: EVENTS.PROFILE_CLEANUP_FAILED,
            sessionId: session.sessionId,
            data: { error: (err as any)?.message ?? "unknown", dir: session.profilePath, op: "quarantine-rename" },
          });
        }
      } else {
        // Chromium can still be flushing profile files as we delete (the 3s exit-wait above is
        // best-effort and Playwright-managed modes have no child handle at all) — Node's built-in
        // retries cover exactly the ENOTEMPTY/EBUSY race. If it still fails, the session is
        // closed and the dir lives under the cache tmp area: log, don't fail the close.
        try {
          await fs.promises.rm(sessionDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
        } catch (err) {
          await this.logger.log({
            ts: new Date().toISOString(),
            level: "warn",
            event: EVENTS.PROFILE_CLEANUP_FAILED,
            sessionId: session.sessionId,
            data: { error: (err as any)?.message ?? "unknown", dir: sessionDir },
          });
        }
      }
    }

    this.registry.delete(sessionId);
  }
}
