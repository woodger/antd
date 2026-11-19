export interface SelectTagClosePortRecord { id: number; phase: string; closed: boolean; }
export interface SelectTagClosePortSnapshot {
  createdPorts: number; closedPorts: number; activePorts: number; records: SelectTagClosePortRecord[];
}
declare global {
  interface Window {
    selectTagClosePorts: { mark(phase: string): void; snapshot(): SelectTagClosePortSnapshot };
  }
}
/** Native-only constructor/close tracking, matching the existing hydration specs. */
export function installSelectTagClosePortTracker() {
  const NativeMessageChannel = window.MessageChannel, active = new Set<MessagePort>();
  const records: SelectTagClosePortRecord[] = [];
  let phase = 'bootstrap', closedPorts = 0;
  window.MessageChannel = class extends NativeMessageChannel {
    constructor() {
      super();
      for (const port of [this.port1, this.port2]) {
        const record = { id: records.length, phase, closed: false };
        records.push(record);
        active.add(port);
        const close = port.close.bind(port);
        port.close = () => {
          close();
          if (active.delete(port)) {
            record.closed = true;
            closedPorts++;
          }
        };
      }
    }
  };
  window.selectTagClosePorts = { mark: value => { phase = value; },
    snapshot: () => ({
      createdPorts: records.length,
      closedPorts,
      activePorts: active.size,
      records: structuredClone(records)
    }) };
}
