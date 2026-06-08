// The control server's own base URL (e.g. http://127.0.0.1:44197), known only after listen().
// Used to build absolute resume URLs for cross-origin banner forms injected into working pages.
let baseUrl = "";

export function setBaseUrl(url: string): void {
  baseUrl = url;
}

export function getBaseUrl(): string {
  return baseUrl;
}
