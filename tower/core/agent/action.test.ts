// tower/core/agent/action.test.ts
import { describe, it, expect } from "vitest";
import { Action } from "./action";

describe("Action", () => {
  it("parses a click action", () => {
    expect(Action.parse({ kind: "click", ref: "obs.e1", reason: "the login button" }))
      .toEqual({ kind: "click", ref: "obs.e1", reason: "the login button" });
  });

  it("parses a type action (ref + text required)", () => {
    expect(Action.parse({ kind: "type", ref: "obs.e0", text: "alice@example.com" }))
      .toEqual({ kind: "type", ref: "obs.e0", text: "alice@example.com" });
  });

  it("parses done and give_up with no extra fields", () => {
    expect(Action.parse({ kind: "done" })).toEqual({ kind: "done" });
    expect(Action.parse({ kind: "give_up", reason: "no path" })).toEqual({ kind: "give_up", reason: "no path" });
  });

  it("rejects a type action missing text", () => {
    expect(Action.safeParse({ kind: "type", ref: "obs.e0" }).success).toBe(false);
  });

  it("rejects an unknown kind", () => {
    expect(Action.safeParse({ kind: "scroll", ref: "obs.e0" }).success).toBe(false);
  });
});
