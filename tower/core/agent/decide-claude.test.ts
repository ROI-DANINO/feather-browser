// tower/core/agent/decide-claude.test.ts
import { describe, it, expect } from "vitest";
import { makeClaudeDecide } from "./decide-claude";
import type { Observation } from "./brain";

const OBS: Observation = {
  url: "https://x.test/login",
  title: "Login",
  elements: [{ ref: "obs.e1", role: "button", name: "Log in", tag: "BUTTON", state: "actionable" }],
};

/** Fake Anthropic client whose messages.create returns a single scripted content array. */
function fakeClient(content: unknown[]) {
  return { messages: { create: async () => ({ content }) } } as any;
}

describe("makeClaudeDecide", () => {
  it("maps a tool_use block to a validated Action", async () => {
    const client = fakeClient([{ type: "tool_use", name: "click", input: { ref: "obs.e1", reason: "log in" } }]);
    const decide = makeClaudeDecide(client, "claude-opus-4-8");
    const action = await decide({ goal: "log in", observation: OBS, step: 0 });
    expect(action).toEqual({ kind: "click", ref: "obs.e1", reason: "log in" });
  });

  it("maps a done tool_use with no fields", async () => {
    const client = fakeClient([{ type: "text", text: "ok" }, { type: "tool_use", name: "done", input: {} }]);
    const decide = makeClaudeDecide(client, "claude-opus-4-8");
    expect(await decide({ goal: "x", observation: OBS, step: 1 })).toEqual({ kind: "done" });
  });

  it("throws when the model chose no action", async () => {
    const client = fakeClient([{ type: "text", text: "thinking out loud" }]);
    const decide = makeClaudeDecide(client, "claude-opus-4-8");
    await expect(decide({ goal: "x", observation: OBS, step: 0 })).rejects.toThrow(/did not choose/i);
  });
});
