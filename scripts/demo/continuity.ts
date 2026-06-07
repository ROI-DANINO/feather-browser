
export type Target =
  | ({ by: "role"; role: string; name?: string; exact?: boolean } & { at?: "first" | "last" | number })
  | ({ by: "text"; text: string; exact?: boolean } & { at?: "first" | "last" | number })
  | ({ by: "placeholder"; text: string } & { at?: "first" | "last" | number })
  | ({ by: "testid"; testId: string } & { at?: "first" | "last" | number })
  | ({ by: "css"; selector: string } & { at?: "first" | "last" | number });

export interface ContinuityConfig {
  /** URL to check for authentication and to navigate to on each poll. */
  targetUrl: string;
  /** Elements that indicate a successful login — any one match = authenticated. */
  checkTargets: Target[];
  /** Sleep between poll attempts (default: 10 000 ms). */
  pollIntervalMs?: number;
  /** Total time to wait for login before giving up (default: 300 000 ms = 5 min). */
  timeoutMs?: number;
}

export interface IFeatherApi {
  request<T>(method: string, route: string, body?: unknown): Promise<T>;
}

/**
 * Ensures the session is authenticated before proceeding.
 *
 * Navigates to targetUrl, checks for a logged-in signal, and if absent waits
 * for the human to complete login by polling targetUrl until the signal appears.
 * The site's own redirect (e.g. Gmail → accounts.google.com → Gmail) handles the
 * login page — we never navigate away to a separate login URL.
 */
export async function ensureHumanAuth(
  api: IFeatherApi,
  sessionId: string,
  config: ContinuityConfig,
): Promise<void> {
  const timeoutMs = config.timeoutMs ?? 300000;
  const pollIntervalMs = config.pollIntervalMs ?? 10000;

  console.log(`\n[Continuity] Checking authentication at ${config.targetUrl}...`);

  await navigateTo(api, sessionId, config.targetUrl);

  if (await probeTargets(api, sessionId, config.checkTargets, 3000)) {
    console.log("[Continuity] Already authenticated. Proceeding...");
    return;
  }

  // Not logged in — the site redirected the browser to its own login page.
  // Tell the human; then poll by re-navigating to targetUrl each iteration.
  // Once login completes the site redirects back, and the probe finds the signal.
  console.log("\n  ⚠️  [CONTINUITY] Authentication required.");
  console.log("  → Log in in the browser window (it should be showing the login page now).");
  console.log(`  → Checking every ${Math.round(pollIntervalMs / 1000)}s — up to ${Math.round(timeoutMs / 1000 / 60)} minutes.\n`);

  // Poll by probing the CURRENT page — do NOT re-navigate while the human is
  // logging in. Re-navigating mid-login interrupts Google's OAuth redirect
  // chain, which bounces the tab to the workspace.google.com marketing page and
  // makes it look like the login "wasn't remembered" (forcing a second login).
  // After login, Google's own `continue=` redirect lands on the inbox, and this
  // probe detects the compose button. `wait until visible` returns as soon as
  // the element appears, so detection is near-instant — pollIntervalMs is only
  // the per-attempt ceiling.
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await probeTargets(api, sessionId, config.checkTargets, pollIntervalMs)) {
      console.log("[Continuity] ✓ Authenticated. Resuming demo.\n");
      return;
    }
  }

  throw new Error(`[Continuity] Authentication timed out after ${timeoutMs}ms.`);
}

async function navigateTo(api: IFeatherApi, sessionId: string, url: string): Promise<void> {
  try {
    await api.request("POST", `/v1/sessions/${sessionId}/navigate`, {
      url,
      waitUntil: "domcontentloaded",
      timeoutMs: 30000,
    });
  } catch {
    // Swallow — a redirect mid-login may cause a navigation error; probeTargets will fail cleanly.
  }
}

async function probeTargets(
  api: IFeatherApi,
  sessionId: string,
  targets: Target[],
  timeoutMs: number,
): Promise<boolean> {
  for (const target of targets) {
    try {
      await api.request("POST", `/v1/sessions/${sessionId}/wait`, {
        target,
        until: "visible",
        timeoutMs,
      });
      return true;
    } catch {
      // Try next candidate.
    }
  }
  return false;
}
