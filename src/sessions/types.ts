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
