import type { Page } from "playwright";

export type BrowserMode = "chromium-new-headless" | "chromium-headless-shell" | "chromium-headed-cdp";
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
  limits: { textChars: number; links: number; markdownChars: number };
  markdown: string;
}

type TargetBy =
  | { by: "role"; role: string; name?: string; exact?: boolean }
  | { by: "text"; text: string; exact?: boolean }
  | { by: "placeholder"; text: string }
  | { by: "testid"; testId: string }
  | { by: "css"; selector: string };

/** How a command locates an element. `at` chooses which match when several match (default "first"). */
export type Target = TargetBy & { at?: "first" | "last" | number };

export interface ClickInput { sessionId: string; pageId?: string; target: Target; timeoutMs?: number; }
export interface ClickOutput { pageId: string; clicked: true; }

export interface SelectOptionInput {
  sessionId: string;
  pageId?: string;
  target: Target;
  values: string | string[];
  timeoutMs?: number;
}
export interface SelectOptionOutput {
  pageId: string;
  selected: string[];
}

export interface TypeInput {
  sessionId: string; pageId?: string; target: Target; text: string;
  mode?: "fill" | "sequential"; delayMs?: number; timeoutMs?: number;
}
export interface TypeOutput { pageId: string; typed: true; }

export interface PressInput { sessionId: string; pageId?: string; target?: Target; key: string; timeoutMs?: number; }
export interface PressOutput { pageId: string; pressed: string; }

export type WaitInput =
  | { sessionId: string; pageId?: string; target: Target; until: "visible" | "hidden" | "attached" | "detached"; timeoutMs?: number }
  | { sessionId: string; pageId?: string; target: Target; until: "stable"; quietMs?: number; pollMs?: number; timeoutMs?: number };

export type WaitOutput =
  | { pageId: string; matched: true }
  | { pageId: string; settled: true; elapsedMs: number; text: string };

export interface AwaitHumanInput {
  sessionId: string;
  pageId?: string;
  reason: string;
  resumeOn?: { target: Target; until: "visible" | "hidden" | "attached" | "detached" };
  timeoutMs?: number;
  /** Inject an on-page Resume banner into the working page (default true). false = off-page only. */
  banner?: boolean;
}
export interface AwaitHumanOutput {
  pageId: string;
  resumedBy: "human" | "signal" | "timeout";
  elapsedMs: number;
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
  closeTab(pageId: string): Promise<void>;
  toRecord(): Omit<SessionRecord, "pages">;
  addPage(page: Page): string;
  removePage(pageId: string): void;
}
