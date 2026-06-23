import { describe, it, expect } from "vitest";
import {
  MfaChallengeNotFoundError,
  MfaNotPendingError,
  MfaValidationError,
  requireTargetForType,
  requireCodeForType,
} from "../../../src/mfa/types";

describe("mfa error classes", () => {
  it("carry stable codes", () => {
    expect(new MfaChallengeNotFoundError("x").code).toBe("MFA_NOT_FOUND");
    expect(new MfaNotPendingError("x").code).toBe("MFA_NOT_PENDING");
    expect(new MfaValidationError("x").code).toBe("VALIDATION_ERROR");
  });
});

describe("requireTargetForType", () => {
  const target = { by: "css", selector: "#code" } as const;
  it("requires a target for totp and sms", () => {
    expect(() => requireTargetForType("totp", undefined)).toThrow(MfaValidationError);
    expect(() => requireTargetForType("sms", undefined)).toThrow(MfaValidationError);
    expect(() => requireTargetForType("totp", target)).not.toThrow();
  });
  it("forbids a target for push", () => {
    expect(() => requireTargetForType("push", target)).toThrow(MfaValidationError);
    expect(() => requireTargetForType("push", undefined)).not.toThrow();
  });
});

describe("requireCodeForType", () => {
  it("requires a non-empty code for totp and sms", () => {
    expect(() => requireCodeForType("totp", undefined)).toThrow(MfaValidationError);
    expect(() => requireCodeForType("sms", "")).toThrow(MfaValidationError);
    expect(() => requireCodeForType("totp", "123456")).not.toThrow();
  });
  it("ignores code for push", () => {
    expect(() => requireCodeForType("push", undefined)).not.toThrow();
    expect(() => requireCodeForType("push", "anything")).not.toThrow();
  });
});
