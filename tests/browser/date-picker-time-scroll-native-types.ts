import type { Dayjs } from 'dayjs';
import type { DatePickerTimeConfig } from 'antd-svelte';
import type { createDatePickerPresetsRecorder } from './date-picker-presets-recorder.mjs';

export type Recorder = ReturnType<typeof createDatePickerPresetsRecorder>;
export type DateRole = 'value' | 'pickerValue' | 'nextPickerValue'
  | 'defaultOpenValue' | 'nextDefaultOpenValue';
export type ScrollAction = { type: 'input-open' }
  | { type: 'wheel-to-top'; column: 'hour' | 'meridiem'; deltaY: number }
  | { type: 'owner-open'; value: boolean }
  | { type: 'owner-template'; value: 'defaultOpenValue' | 'nextDefaultOpenValue' }
  | { type: 'owner-picker'; value: 'nextPickerValue' }
  | { type: 'owner-getter'; value: 'same-target-new-callback' | 'different-target-new-callback' };
export interface ScrollSample extends Record<DateRole, string> {
  id: string;
  format: string;
  portal: boolean;
  viewport: { width: number; height: number; };
  showTime: DatePickerTimeConfig & { showNow: false; changeOnScroll: false; };
  actions: ScrollAction[];
}
export interface NativeControl {
  focus(options?: FocusOptions & { cursor?: 'start' | 'end' | 'all'; }): void;
  blur(): void;
}
export interface NativeRefs {
  owner: HTMLElement | null;
  control: NativeControl | null;
  nativeElement: HTMLDivElement | null;
  targetA: HTMLDivElement | null;
  targetB: HTMLDivElement | null;
}
export interface OwnerCapture {
  recorder?: Recorder;
  read?: () => Record<string, unknown>;
  readRefs?: () => NativeRefs;
  setActionIndex?: (index: number) => void;
}
export interface NativeBridge {
  ready: boolean;
  getRecorder(): Recorder;
  read(): Record<string, unknown>;
  readRefs(): NativeRefs;
  setActionIndex(index: number): void;
  activateOwnerControl(kind: string, value: string | boolean): unknown;
  dispose(): Promise<void>;
}
export interface NativeObservation {
  preMountNodes: Set<Node>;
  retainedNodes: Set<Node>;
  initialRoot?: Element;
  initialInput?: Element;
  wheels: unknown[];
}
export type DateMap = Record<DateRole, Dayjs>;
declare global {
  interface Window {
    nativeTimeScroll: NativeBridge;
    nativeTimeScrollObservation: NativeObservation;
  }
}
