import type { BrowserContext, Page } from "playwright";
import { randomUUID } from "crypto";
import type { ChildProcess } from "child_process";
import type { DebugCapture } from "../debug/capture";
import type { DiffRow } from "../commands/perception/diff";
import type {
  BrowserMode,
  ProfileKind,
  SessionState,
  ProxySummary,
  PageInfo,
  SessionRecord,
  ISession,
} from "./types";

export interface ObserveCacheEntry {
  observeId: string;
  rows: DiffRow[];
  refs: Map<string, import("playwright").ElementHandle>;
}

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

export class CannotCloseLastTabError extends Error {
  readonly code = "CANNOT_CLOSE_LAST_TAB";
  constructor(sessionId: string) {
    super(`Session '${sessionId}' cannot close its last tab. Close the session instead.`);
    this.name = "CannotCloseLastTabError";
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
  private _observeCache: Map<string, ObserveCacheEntry> = new Map();
  private _childProcess: ChildProcess | null = null;
  private _debugCapture: DebugCapture | null = null;

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
      let title = "";
      let loadState = "unknown";
      try {
        loadState = await page.evaluate(() => document.readyState);
      } catch {
        /* best-effort: page may be closed/crashed */
      }
      try {
        title = await page.title();
      } catch {
        /* best-effort */
      }
      results.push({ pageId, url: page.url(), title, loadState });
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

  async closeTab(pageId: string): Promise<void> {
    const page = this._pages.get(pageId);
    if (!page) {
      throw new PageNotFoundError(pageId);
    }
    if (this._pages.size <= 1) {
      throw new CannotCloseLastTabError(this.sessionId);
    }
    // Remove from the maps first so the page list is consistent for callers
    // even if page.close() rejects (already-closed/crashed). The page "close"
    // event listener also calls removePage — idempotent, so the double call is safe.
    this.removePage(pageId);
    try {
      await page.close();
    } catch {
      /* page may already be closed/crashed; maps are already clean */
    }
  }

  addPage(page: Page): string {
    const existing = this._pageIds.get(page);
    if (existing) return existing;
    const pageId = newId("page");
    this._pages.set(pageId, page);
    this._pageIds.set(page, pageId);
    return pageId;
  }

  getPageIdFor(page: Page): string | undefined {
    return this._pageIds.get(page);
  }

  getPageCount(): number {
    return this._pages.size;
  }

  removePage(pageId: string): void {
    this.clearObserveCache(pageId);
    const page = this._pages.get(pageId);
    if (page) this._pageIds.delete(page);
    this._pages.delete(pageId);
  }

  getObserveCache(pageId: string): ObserveCacheEntry | undefined {
    return this._observeCache.get(pageId);
  }

  setObserveCache(pageId: string, entry: ObserveCacheEntry): void {
    const prev = this._observeCache.get(pageId);
    if (prev) for (const h of prev.refs.values()) void h.dispose().catch(() => {});
    this._observeCache.set(pageId, entry);
  }

  clearObserveCache(pageId: string): void {
    const prev = this._observeCache.get(pageId);
    if (prev) for (const h of prev.refs.values()) void h.dispose().catch(() => {});
    this._observeCache.delete(pageId);
  }

  setState(state: SessionState): void {
    this._state = state;
  }

  getState(): SessionState {
    return this._state;
  }

  setChildProcess(cp: ChildProcess): void {
    this._childProcess = cp;
  }

  getChildProcess(): ChildProcess | null {
    return this._childProcess;
  }

  setDebugCapture(capture: DebugCapture): void {
    this._debugCapture = capture;
  }

  getDebugCapture(): DebugCapture | null {
    return this._debugCapture;
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
