// tower/core/agent/brain.test.ts
import { describe, it, expect, vi } from "vitest";
import { driveToGoal, type BrowserDriver, type Observation, type Action } from "./brain";

const OBS: Observation = {
  url: "https://x.test/login",
  title: "Login",
  elements: [
    { ref: "obs.e0", role: "textbox", name: "Email", tag: "INPUT", state: "actionable" },
    { ref: "obs.e1", role: "button", name: "Log in", tag: "BUTTON", state: "actionable" },
  ],
};

function fakeDriver(): BrowserDriver & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    observe: vi.fn(async () => OBS),
    click: vi.fn(async (ref: string) => { calls.push(`click:${ref}`); }),
    type: vi.fn(async (ref: string, text: string) => { calls.push(`type:${ref}:${text}`); }),
  };
}

/** A Decide that returns each scripted action in order. */
function scripted(actions: Action[]) {
  let i = 0;
  return vi.fn(async () => actions[Math.min(i++, actions.length - 1)]);
}

describe("driveToGoal", () => {
  it("stops immediately on done", async () => {
    const d = fakeDriver();
    const res = await driveToGoal(d, "log in", scripted([{ kind: "done" }]));
    expect(res).toEqual({ outcome: "done", steps: 1 });
    expect(d.observe).toHaveBeenCalledTimes(1);
    expect(d.calls).toEqual([]);
  });

  it("executes type then click then done, in order", async () => {
    const d = fakeDriver();
    const res = await driveToGoal(d, "log in", scripted([
      { kind: "type", ref: "obs.e0", text: "alice" },
      { kind: "click", ref: "obs.e1" },
      { kind: "done" },
    ]));
    expect(res).toEqual({ outcome: "done", steps: 3 });
    expect(d.calls).toEqual(["type:obs.e0:alice", "click:obs.e1"]);
  });

  it("reports gave_up on give_up", async () => {
    const d = fakeDriver();
    const res = await driveToGoal(d, "log in", scripted([{ kind: "give_up", reason: "x" }]));
    expect(res).toEqual({ outcome: "gave_up", steps: 1 });
  });

  it("exhausts the step budget when the goal is never reached", async () => {
    const d = fakeDriver();
    const res = await driveToGoal(d, "log in", scripted([{ kind: "click", ref: "obs.e1" }]), { maxSteps: 3 });
    expect(res).toEqual({ outcome: "budget_exhausted", steps: 3 });
    expect(d.click).toHaveBeenCalledTimes(3);
  });

  it("invokes onStep for each decided action", async () => {
    const d = fakeDriver();
    const seen: Action[] = [];
    await driveToGoal(d, "log in", scripted([{ kind: "click", ref: "obs.e1" }, { kind: "done" }]),
      { onStep: ({ action }) => seen.push(action) });
    expect(seen).toEqual([{ kind: "click", ref: "obs.e1" }, { kind: "done" }]);
  });

  it("returns timed_out when wall-clock deadline is exceeded, stops calling driver", async () => {
    // Fake clock: starts at 0, each call advances by 100ms
    let t = 0;
    const now = () => (t += 100);
    const d = fakeDriver();
    // Never-finishing: always clicks, never done — same as budget test
    const res = await driveToGoal(
      d,
      "log in",
      scripted([{ kind: "click", ref: "obs.e1" }]),
      { maxSteps: 20, timeoutMs: 250, now },
    );
    // now() is called once before loop (t=100 = startTime), then once at top of each
    // iteration: iter0→t=200 (200-100=100 < 250, runs), iter1→t=300 (300-100=200 < 250, runs),
    // iter2→t=400 (400-100=300 >= 250, timed_out with steps=2)
    expect(res.outcome).toBe("timed_out");
    expect(res.steps).toBe(2);
    // Driver should have been called exactly as many steps as completed
    expect(d.observe).toHaveBeenCalledTimes(2);
  });

  it("behaves identically to before when timeoutMs is unset", async () => {
    const d = fakeDriver();
    const res = await driveToGoal(d, "log in", scripted([{ kind: "click", ref: "obs.e1" }]), { maxSteps: 3 });
    expect(res).toEqual({ outcome: "budget_exhausted", steps: 3 });
  });
});
