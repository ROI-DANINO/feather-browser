import { EventEmitter } from "events";
import type { EventName } from "./events";

export interface BusEvent {
  event: EventName;
  sessionId?: string;
  data?: Record<string, unknown>;
  ts: string;
}

const emitter = new EventEmitter();
emitter.setMaxListeners(100);

const BUS_CHANNEL = "bus";

export function emitBusEvent(evt: BusEvent): void {
  emitter.emit(BUS_CHANNEL, evt);
}

export function onBusEvent(handler: (evt: BusEvent) => void): () => void {
  emitter.on(BUS_CHANNEL, handler);
  return () => {
    emitter.off(BUS_CHANNEL, handler);
  };
}
