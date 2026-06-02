import type { Page } from "playwright";

export type BrowserMode = "chromium-new-headless" | "chromium-headless-shell";
export type ProfileKind = "persistent" | "disposable";
export type SessionState = "launching" | "running" | "closing" | "closed" | "failed";

export interface ProxyConfig {
  server: string;
  username?: string;
  password?: string;
  bypass?: string;
}

export interface ProxySummary {
  server: string;
  hasCredentials: boolean;
  bypass?: string;
}

export interface PageInfo {
  pageId: string;
  url: string;
  title: string;
  loadState: string;
}

export interface SessionRecord {
  sessionId: string;
  workspaceId: string;
  profileKind: ProfileKind;
  browserMode: BrowserMode;
  state: SessionState;
  profilePath: string;
  debugDir: string;
  proxy: ProxySummary | null;
  startedAt: string;
  pages: PageInfo[];
  profileLocked: boolean;
}

export interface ExtractField {
  selector: string;
  type: "text" | "attribute";
  attribute?: string;
}

export interface ExtractRecipe {
  fields: Record<string, ExtractField>;
  limits?: { items?: number; textChars?: number };
}

export interface SnapshotResult {
  pageId: string;
  url: string;
  title: string;
  text: string;
  links: Array<{ text: string; href: string }>;
  meta: { description: string };
  limits: { textChars: number; links: number };
}

export interface CommandContext {
  requestId: string;
}

export interface ISession {
  readonly sessionId: string;
  readonly workspaceId: string;
  readonly profileKind: ProfileKind;
  readonly browserMode: BrowserMode;
  readonly proxy: ProxySummary | null;
  readonly profilePath: string;
  readonly startedAt: string;
  readonly debugDir: string;
  getPage(pageId?: string): { pageId: string; page: Page };
  getPageInfoList(): Promise<PageInfo[]>;
  openTab(): Promise<{ pageId: string; page: Page }>;
  toRecord(): Omit<SessionRecord, "pages">;
  addPage(page: Page): string;
  removePage(pageId: string): void;
}
