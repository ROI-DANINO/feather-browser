// tower/core/adapters/feather.test.ts
import { describe, it, expect, vi } from "vitest";
import { featherAdapter } from "./feather";
import type { BrowserSessionClient } from "./feather-client";
import type { Observation } from "../agent/brain";

const OBS: Observation = { url: "https://x.test", title: "X", elements: [] };

function fakeClient(over: Partial<BrowserSessionClient> = {}): BrowserSessionClient & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    createSession: vi.fn(async () => { calls.push("create"); return "ses_1"; }),
    navigate: vi.fn(async (_s: string, url: string) => { calls.push(`navigate:${url}`); }),
    observe: vi.fn(async () => OBS),
    click: vi.fn(async () => {}),
    type: vi.fn(async () => {}),
    close: vi.fn(async (s: string) => { calls.push(`close:${s}`); }),
    ...over,
  };
}

describe("featherAdapter", () => {
  it("has the registry id adapter.feather", () => {
    expect(featherAdapter({ client: fakeClient(), decide: vi.fn(async () => ({ kind: "done" })) }).id).toBe("adapter.feather");
  });

  it("creates a session, navigates to the task url, drives, and closes", async () => {
    const client = fakeClient();
    const decide = vi.fn(async () => ({ kind: "done" as const }));
    await featherAdapter({ client, decide }).run({ levelId: "L", url: "https://x.test/go", goal: "do it" });
    expect(client.calls).toEqual(["create", "navigate:https://x.test/go", "close:ses_1"]);
    expect(client.observe).toHaveBeenCalledTimes(1);
  });

  it("closes the session even when the drive throws", async () => {
    const client = fakeClient({ navigate: vi.fn(async () => { throw new Error("nav boom"); }) });
    const decide = vi.fn(async () => ({ kind: "done" as const }));
    await expect(featherAdapter({ client, decide }).run({ levelId: "L", url: "u", goal: "g" })).rejects.toThrow("nav boom");
    expect(client.close).toHaveBeenCalledWith("ses_1");
  });
});
