import { describe, expect, it } from "vitest";
import {
  buildDraftBody,
  endpointFileFromEnv,
  envelopeData,
  redactPathForDisplay,
} from "../../../scripts/demo/hero-chatgpt-gmail";

describe("hero ChatGPT to Gmail demo helpers", () => {
  it("resolves the endpoint file from an explicit override", () => {
    expect(endpointFileFromEnv({
      FEATHER_ENDPOINT_FILE: "/tmp/feather-endpoint.json",
      XDG_RUNTIME_DIR: "/run/user/1000",
      HOME: "/home/tester",
    })).toBe("/tmp/feather-endpoint.json");
  });

  it("resolves the endpoint file from XDG_RUNTIME_DIR before HOME state", () => {
    expect(endpointFileFromEnv({
      XDG_RUNTIME_DIR: "/run/user/1000",
      HOME: "/home/tester",
    })).toBe("/run/user/1000/feather/run/endpoint.json");
  });

  it("throws a clear error for failed Feather envelopes", () => {
    expect(() => envelopeData({
      ok: false,
      error: { code: "ELEMENT_NOT_FOUND", message: "selector drifted" },
    })).toThrow("Feather API error ELEMENT_NOT_FOUND: selector drifted");
  });

  it("builds a draft body without adding credentials or cookies", () => {
    expect(buildDraftBody("Hello back.")).toBe([
      "ChatGPT replied to `hello world`:",
      "",
      "Hello back.",
      "",
      "--",
      "Draft prepared by Feather Browser's headed hero demo. Not sent automatically.",
    ].join("\n"));
  });

  it("redacts home paths in display-only output", () => {
    expect(redactPathForDisplay("/home/roking/.local/share/feather/profiles/primary/profile", "/home/roking"))
      .toBe("~/.local/share/feather/profiles/primary/profile");
  });
});

