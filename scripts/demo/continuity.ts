
export type Target =
  | ({ by: "role"; role: string; name?: string; exact?: boolean } & { at?: "first" | "last" | number })
  | ({ by: "text"; text: string; exact?: boolean } & { at?: "first" | "last" | number })
  | ({ by: "placeholder"; text: string } & { at?: "first" | "last" | number })
  | ({ by: "testid"; testId: string } & { at?: "first" | "last" | number })
  | ({ by: "css"; selector: string } & { at?: "first" | "last" | number });

export interface ContinuityConfig {
  /** URL to check for authentication and to navigate to first. */
  targetUrl: string;
  /** Elements that indicate a successful login — any one match = authenticated. */
  checkTargets: Target[];
  /** Total time to wait for the human handoff before giving up (default: 300 000 ms = 5 min). */
  timeoutMs?: number;
}

export interface IFeatherApi {
  request<T>(method: string, route: string, body?: unknown): Promise<T>;
}

/**
 * Ensures the session is authenticated before proceeding.
 *
 * Navigates to targetUrl and checks for a logged-in signal. If absent, hands off to the human using
 * Feather's shipped await-human mechanism: an on-page Resume banner appears (and re-injects across the
 * login redirect chain), the human logs in — completing any 2-step / 2FA in the same window — and the
 * handoff resolves either via the `resumeOn` signal (the inbox loads) or a manual Resume click.
 * The Cookie-Mine pattern: the agent piggybacks on the human's trust.
 */
export async function ensureHumanAuth(
  api: IFeatherApi,
  sessionId: string,
  config: ContinuityConfig,
): Promise<void> {
  const timeoutMs = config.timeoutMs ?? 300000;

  console.log(`\n[Continuity] Checking authentication at ${config.targetUrl}...`);
  await navigateTo(api, sessionId, config.targetUrl);

  if (await probeTargets(api, sessionId, config.checkTargets, 3000)) {
    console.log("[Continuity] Already authenticated. Proceeding...");
    return;
  }

  // Not logged in — hand off to the human with Feather's on-page Resume banner.
  console.log("\n  ⏸  [CONTINUITY] Login required — Feather is paused.");
  console.log("  → Log into Google in the browser window (finish any 2-step / 2FA).");
  console.log("  → Feather resumes automatically once you're in (or click Resume on the page).\n");

  await api.request("POST", `/v1/sessions/${sessionId}/await-human`, {
    reason: "Log into Google here — finish any 2-step / 2FA — then I'll continue (or click Resume)",
    resumeOn: { target: config.checkTargets[0], until: "visible" },
    banner: true,
    timeoutMs,
  });

  // A premature Resume click — or a server-side timeout — resolves the handoff before login finishes.
  if (!(await probeTargets(api, sessionId, config.checkTargets, 5000))) {
    throw new Error(
      "[Continuity] Resumed but Google is not authenticated yet — log in fully, then re-run.",
    );
  }
  console.log("[Continuity] ✓ Authenticated. Resuming demo.\n");
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
