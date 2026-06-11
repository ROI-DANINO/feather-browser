import type { CapabilityName } from "./grants";

// ── Dangerous-mode policy (Gate A / A1) ──────────────────────────────────────
// Dangerous capabilities are OFF by default and never enabled by token presence (ADR-0010 §5).
// Opt-in is explicit host configuration: FEATHER_DANGEROUS_CAPABILITIES="cookie-export,cdp-attach".
// Enabling a capability only opens the *request* path — every use still needs a human-approved grant.

const KNOWN: ReadonlySet<string> = new Set<CapabilityName>(["cdp-attach", "vault-unlock", "cookie-export"]);

export class DangerousModePolicy {
  private constructor(private readonly enabled: ReadonlySet<CapabilityName>) {}

  /** Parse the env allowlist. Unknown names are ignored — a typo must never widen access. */
  static fromEnv(env: Record<string, string | undefined>): DangerousModePolicy {
    const names = (env.FEATHER_DANGEROUS_CAPABILITIES ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s): s is CapabilityName => KNOWN.has(s));
    return new DangerousModePolicy(new Set(names));
  }

  isEnabled(capability: CapabilityName): boolean {
    return this.enabled.has(capability);
  }
}
