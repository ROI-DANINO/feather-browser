import type { BrowserContext, Page } from "playwright";
import { randomUUID } from "crypto";
import type {
  BrowserMode,
  ProfileKind,
  SessionState,
  ProxySummary,
  PageInfo,
  SessionRecord,
  ISession,
} from "./types";

const newId = (prefix: string): string =>
  `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;

export class SessionNotFoundError extends Error {
  readonly code = "SESSION_NOT_FOUND";
  constructor(sessionId: string) {
    super(`Session '${sessionId}' not found.`);
    this.name = "SessionNotFoundError";
  }
}

export class PageNotFoundError extends Error {
  readonly code = "PAGE_NOT_FOUND";
  constructor(pageId: string) {
    super(`Page '${pageId}' not found.`);
    this.name = "PageNotFoundError";
  }
}

export class SessionNotRunningError extends Error {
  readonly code = "SESSION_NOT_RUNNING";
  constructor(sessionId: string, state: string) {
    super(`Session '${sessionId}' cannot open a tab: state is "${state}".`);
    this.name = "SessionNotRunningError";
  }
}

export class FeatherSession implements ISession {
  readonly sessionId: string;
  readonly workspaceId: string;
  readonly profileKind: ProfileKind;
  readonly browserMode: BrowserMode;
  readonly profilePath: string;
  readonly debugDir: string;
  readonly proxy: ProxySummary | null;
  readonly startedAt: string;

  private _state: SessionState;
  private _context: BrowserContext | null;
  private _pages: Map<string, Page>;
  private _pageIds: Map<Page, string>;

  constructor(opts: {
    workspaceId: string;
    profileKind: ProfileKind;
    browserMode: BrowserMode;
    profilePath: string;
    debugDir: string;
    proxy: ProxySummary | null;
  }) {
    this.sessionId = newId("ses");
    this.workspaceId = opts.workspaceId;
    this.profileKind = opts.profileKind;
    this.browserMode = opts.browserMode;
    this.profilePath = opts.profilePath;
    this.debugDir = opts.debugDir;
    this.proxy = opts.proxy;
    this.startedAt = new Date().toISOString();
    this._state = "launching";
    this._context = null;
    this._pages = new Map();
    this._pageIds = new Map();
  }

  setContext(context: BrowserContext): void {
    this._context = context;
    for (const page of context.pages()) {
      this.addPage(page);
    }
    this._state = "running";
  }

  getContext(): BrowserContext {
    if (!this._context) {
      throw new Error("BrowserContext is not yet available.");
    }
    return this._context;
  }

  getPage(pageId?: string): { pageId: string; page: Page } {
    if (!pageId) {
      const first = Array.from(this._pages.entries())[0];
      if (!first) {
        throw new PageNotFoundError("(default)");
      }
      return { pageId: first[0], page: first[1] };
    }
    const page = this._pages.get(pageId);
    if (!page) {
      throw new PageNotFoundError(pageId);
    }
    return { pageId, page };
  }

  getDefaultPageId(): string | undefined {
    return Array.from(this._pages.keys())[0];
  }

  async getPageInfoList(): Promise<PageInfo[]> {
    const results: PageInfo[] = [];
    for (const [pageId, page] of this._pages.entries()) {
      const loadState = await page.evaluate(() => document.readyState);
      results.push({
        pageId,
        url: page.url(),
        title: await page.title(),
        loadState,
      });
    }
    return results;
  }

  async openTab(): Promise<{ pageId: string; page: Page }> {
    if (this._state !== "running") {
      throw new SessionNotRunningError(this.sessionId, this._state);
    }
    const page = await this._context!.newPage();
    const pageId = this.addPage(page);
    return { pageId, page };
  }

  addPage(page: Page): string {
    const existing = this._pageIds.get(page);
    if (existing) return existing;
    const pageId = newId("page");
    this._pages.set(pageId, page);
    this._pageIds.set(page, pageId);
    return pageId;
  }

  removePage(pageId: string): void {
    const page = this._pages.get(pageId);
    if (page) this._pageIds.delete(page);
    this._pages.delete(pageId);
  }

  setState(state: SessionState): void {
    this._state = state;
  }

  getState(): SessionState {
    return this._state;
  }

  toRecord(): Omit<SessionRecord, "pages"> {
    return {
      sessionId: this.sessionId,
      workspaceId: this.workspaceId,
      profileKind: this.profileKind,
      browserMode: this.browserMode,
      state: this._state,
      profilePath: this.profilePath,
      debugDir: this.debugDir,
      proxy: this.proxy,
      startedAt: this.startedAt,
      profileLocked: this.profileKind === "persistent",
    };
  }
}
