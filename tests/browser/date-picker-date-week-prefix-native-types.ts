import type { createDatePickerPresetsRecorder } from './date-picker-presets-recorder.mjs';
import type { DateWeekPrefixOwner } from './date-picker-date-week-prefix-cases.mjs';
export type { DateWeekPrefixOwner } from './date-picker-date-week-prefix-cases.mjs';
export interface DateWeekPrefixControl {
  focus(options?: FocusOptions & { index?: 0 | 1; cursor?: 'start' | 'end' | 'all' }): void;
  blur(): void;
}
export interface DateWeekPrefixInvocation {
  index: number; actionIndex: number; name: string; actualArgumentCount: number;
  encodedArguments: unknown; rawArguments: unknown; dates: unknown[];
  receiver: { type: string; isUndefined: boolean; isNull: boolean; identity: number | null };
  returned?: boolean;
}
export interface DateWeekPrefixCursorDelta {
  cursor: number; next: number; rows: DateWeekPrefixInvocation[];
}
export interface DateWeekPrefixOwnerRead {
  id: DateWeekPrefixOwner; actionIndex: number; alive: boolean; picker: 'date';
  open: boolean; weekNumbers: boolean; localeName: 'us' | 'gb'; localized: boolean;
  model: unknown; rawModel: unknown; modelDates: unknown[]; producerCount: number;
  authoredDates: Record<string, unknown>; authoredProps: unknown; rawAuthoredProps: unknown;
  callbacks: DateWeekPrefixInvocation[]; ownerActions: unknown[];
  lifecycle: Array<{ phase: 'mount' | 'unmount' }>;
}
export interface DateWeekPrefixCapture {
  recorder?: ReturnType<typeof createDatePickerPresetsRecorder>;
  setActionIndex?: (index: number) => void;
  readRefs?: () => { owner: HTMLElement | null; control: DateWeekPrefixControl | null; root: HTMLDivElement | null };
  read?: () => DateWeekPrefixOwnerRead;
  readCallbacks?: (cursor?: number) => DateWeekPrefixCursorDelta;
  readProducers?: (cursor?: number) => DateWeekPrefixCursorDelta;
}
export interface DateWeekPrefixObservation {
  preMountNodes: Set<Element>; retainedNodes: Set<Element>; events: unknown[];
  initialOwner?: HTMLElement; initialRoot?: HTMLDivElement; initialInputs?: HTMLInputElement[];
}
export interface DateWeekPrefixNativeBridge {
  ready: boolean; getRecorder(): NonNullable<DateWeekPrefixCapture['recorder']>;
  read(): DateWeekPrefixOwnerRead;
  readRefs(): ReturnType<NonNullable<DateWeekPrefixCapture['readRefs']>>;
  setActionIndex(index: number): void;
  readCallbacks(cursor?: number): DateWeekPrefixCursorDelta;
  readProducers(cursor?: number): DateWeekPrefixCursorDelta;
  activateControl(value: string): unknown;
  dispose(): Promise<void>; stopEventObserver(): void;
}
declare global {
  interface Window {
    nativeDateWeekPrefix: DateWeekPrefixNativeBridge;
    nativeDateWeekPrefixObservation: DateWeekPrefixObservation;
  }
}
