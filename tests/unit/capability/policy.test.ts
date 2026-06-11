import { describe, it, expect } from "vitest";
import { DangerousModePolicy } from "../../../src/capability/policy";

describe("DangerousModePolicy", () => {
  it("defaults to everything disabled — dangerous capabilities are opt-in", () => {
    const policy = DangerousModePolicy.fromEnv({});
    expect(policy.isEnabled("cookie-export")).toBe(false);
    expect(policy.isEnabled("cdp-attach")).toBe(false);
    expect(policy.isEnabled("vault-unlock")).toBe(false);
  });

  it("enables exactly the capabilities named in FEATHER_DANGEROUS_CAPABILITIES", () => {
    const policy = DangerousModePolicy.fromEnv({
      FEATHER_DANGEROUS_CAPABILITIES: "cookie-export, cdp-attach",
    });
    expect(policy.isEnabled("cookie-export")).toBe(true);
    expect(policy.isEnabled("cdp-attach")).toBe(true);
    expect(policy.isEnabled("vault-unlock")).toBe(false);
  });

  it("ignores unknown names instead of widening anything", () => {
    const policy = DangerousModePolicy.fromEnv({
      FEATHER_DANGEROUS_CAPABILITIES: "all, *, everything,cookie-export",
    });
    expect(policy.isEnabled("cookie-export")).toBe(true);
    expect(policy.isEnabled("cdp-attach")).toBe(false);
  });

  it("treats an empty or whitespace value as disabled", () => {
    expect(DangerousModePolicy.fromEnv({ FEATHER_DANGEROUS_CAPABILITIES: "  " }).isEnabled("cookie-export")).toBe(false);
    expect(DangerousModePolicy.fromEnv({ FEATHER_DANGEROUS_CAPABILITIES: "" }).isEnabled("cookie-export")).toBe(false);
  });
});
