import type { ProxyConfig, ProxySummary } from "../sessions/types";

export function redactProxy(proxy: ProxyConfig): ProxySummary {
  return {
    server: proxy.server,
    hasCredentials: !!(proxy.username || proxy.password),
    ...(proxy.bypass !== undefined ? { bypass: proxy.bypass } : {}),
  };
}

export function redactUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const hadTrailingSlash = url.endsWith("/") || parsed.pathname !== "/";
    parsed.username = "";
    parsed.password = "";
    parsed.search = "";
    parsed.hash = "";
    const result = parsed.toString();
    // URL.toString() always adds a trailing slash for bare host:port URLs;
    // strip it only when the original URL had no path beyond the root.
    if (!hadTrailingSlash && result.endsWith("/")) {
      return result.slice(0, -1);
    }
    return result;
  } catch {
    return url;
  }
}
