import { describe, it, expect, afterEach } from "vitest";
import { emitBusEvent, onBusEvent } from "../../../src/logs/bus";
import type { BusEvent } from "../../../src/logs/bus";
import { EVENTS } from "../../../src/logs/events";

describe("bus", () => {
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()!();
    }
  });

  it("emitBusEvent fires registered listener", () => {
    const received: BusEvent[] = [];
    const unsub = onBusEvent((evt) => received.push(evt));
    cleanups.push(unsub);

    const event: BusEvent = {
      event: EVENTS.SESSION_LAUNCH_COMPLETED,
      sessionId: "ses_001",
      ts: "2026-06-02T00:00:00.000Z",
    };
    emitBusEvent(event);

    expect(received).toHaveLength(1);
    expect(received[0].event).toBe(EVENTS.SESSION_LAUNCH_COMPLETED);
    expect(received[0].sessionId).toBe("ses_001");
    expect(received[0].ts).toBe("2026-06-02T00:00:00.000Z");
  });

  it("onBusEvent returns working unsubscribe function", () => {
    const received: BusEvent[] = [];
    const unsub = onBusEvent((evt) => received.push(evt));

    unsub();

    emitBusEvent({
      event: EVENTS.TAB_CREATED,
      ts: "2026-06-02T00:00:00.000Z",
    });

    expect(received).toHaveLength(0);
  });

  it("multiple listeners all receive the same event", () => {
    const receivedA: BusEvent[] = [];
    const receivedB: BusEvent[] = [];

    const unsubA = onBusEvent((evt) => receivedA.push(evt));
    const unsubB = onBusEvent((evt) => receivedB.push(evt));
    cleanups.push(unsubA, unsubB);

    const event: BusEvent = {
      event: EVENTS.SESSION_CLOSE_COMPLETED,
      ts: "2026-06-02T00:01:00.000Z",
    };
    emitBusEvent(event);

    expect(receivedA).toHaveLength(1);
    expect(receivedB).toHaveLength(1);
    expect(receivedA[0].event).toBe(EVENTS.SESSION_CLOSE_COMPLETED);
    expect(receivedB[0].event).toBe(EVENTS.SESSION_CLOSE_COMPLETED);
  });

  it("unsubscribing one listener does not affect others", () => {
    const receivedFirst: BusEvent[] = [];
    const receivedSecond: BusEvent[] = [];

    const unsubFirst = onBusEvent((evt) => receivedFirst.push(evt));
    const unsubSecond = onBusEvent((evt) => receivedSecond.push(evt));
    cleanups.push(unsubSecond);

    unsubFirst();

    emitBusEvent({
      event: EVENTS.TAB_CLOSED,
      ts: "2026-06-02T00:02:00.000Z",
    });

    expect(receivedFirst).toHaveLength(0);
    expect(receivedSecond).toHaveLength(1);
    expect(receivedSecond[0].event).toBe(EVENTS.TAB_CLOSED);
  });

  it("emitted event fields match exactly", () => {
    const received: BusEvent[] = [];
    const unsub = onBusEvent((evt) => received.push(evt));
    cleanups.push(unsub);

    const event: BusEvent = {
      event: EVENTS.PAGE_NAVIGATE_COMPLETED,
      sessionId: "ses_exact_001",
      data: { url: "https://example.com", durationMs: 42 },
      ts: "2026-06-02T12:34:56.789Z",
    };
    emitBusEvent(event);

    expect(received).toHaveLength(1);
    const got = received[0];
    expect(got.event).toBe("page.navigate.completed");
    expect(got.sessionId).toBe("ses_exact_001");
    expect(got.ts).toBe("2026-06-02T12:34:56.789Z");
    expect(got.data).toEqual({ url: "https://example.com", durationMs: 42 });
  });
});
