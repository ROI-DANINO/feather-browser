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
  | { by: "css"; selector: string }
  | { by: "ref"; ref: string };

/** How a command locates an element. `at` chooses which match when several match (default "first"). */
export type Target = TargetBy & { at?: "first" | "last" | number };

// --- Observe ---
export type ActionState = "actionable" | "covered" | "disabled" | "offscreen";

export interface ObserveAction {
  ref: string;                 // e0, e1, … — valid only until the next observe on this page
  role: string | null;
  name: string;
  tag: string;
  box: { x: number; y: number; w: number; h: number };
  state: ActionState;
  occludedBy?: { kind: "overlay" | "iframe" | "element"; name?: string };
  /** This element sits inside overlays[overlayIndex] — part of that popup. */
  overlayIndex?: number;
}

export interface Overlay {
  kind: "modal" | "banner" | "iframe";
  name: string;
  coverPct: number;
  blocking: boolean;
}

export interface ObserveDiffEntry { ref?: string; desc?: string; change?: string; was?: string; }
export interface ObserveDiff {
  added: ObserveDiffEntry[];
  removed: ObserveDiffEntry[];
  changed: ObserveDiffEntry[];
}

export interface ObserveInput {
  sessionId: string; pageId?: string;
  cap?: number; viewportOnly?: boolean; includeText?: boolean;
}
export interface ObserveResult {
  pageId: string; url: string; title: string; observeId: string;
  actions: ObserveAction[];
  overlays: Overlay[];
  diff: ObserveDiff | null;
  text?: string;
  stats: { totalInteractive: number; returned: number; elapsedMs: number };
}

export interface DismissInput { sessionId: string; pageId?: string; labels?: string[]; }
export interface DismissOutput {
  pageId: string;
  dismissed: { ref: string; name: string }[];   // verified-gone only; ref is already expired (the verify observe rolled the cache) — identifier only, do not act on it
  overlaysRemaining: number;                    // >0 ⇒ another wall is up: call again or adjust labels
  observation: ObserveResult;                   // the latest internal observe — fresh refs + diff, saves a round-trip
}

export interface ClickInput { sessionId: string; pageId?: string; target: Target; timeoutMs?: number; }
export interface ClickOutput { pageId: string; clicked: true; navigated?: true; }

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
  navigated?: true;
}

export interface TypeInput {
  sessionId: string; pageId?: string; target: Target; text: string;
  mode?: "fill" | "sequential"; delayMs?: number; timeoutMs?: number;
}
export interface TypeOutput { pageId: string; typed: true; }

export interface PressInput { sessionId: string; pageId?: string; target?: Target; key: string; timeoutMs?: number; }
export interface PressOutput { pageId: string; pressed: string; navigated?: true; }

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
  getObserveCache(pageId: string): import("./session").ObserveCacheEntry | undefined;
  setObserveCache(pageId: string, entry: import("./session").ObserveCacheEntry): void;
  clearObserveCache(pageId: string): void;
}
