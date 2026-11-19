import type { createDatePickerPresetsRecorder } from './date-picker-presets-recorder.mjs';
import type { MonthYearOwner } from './date-picker-month-year-cases.mjs';
export type { MonthYearOwner } from './date-picker-month-year-cases.mjs';
export interface MonthYearControl {
  focus(options?: FocusOptions & { index?: 0 | 1; cursor?: 'start' | 'end' | 'all' }): void;
  blur(): void;
}
export interface MonthYearInvocation {
  index: number; actionIndex: number; name: string; actualArgumentCount: number;
  encodedArguments: unknown; rawArguments: unknown; dates: unknown[];
  receiver: { type: string; isUndefined: boolean; isNull: boolean; identity: number | null };
  returned?: boolean;
}
export interface MonthYearCursorDelta {
  cursor: number; next: number; rows: MonthYearInvocation[];
}
export interface MonthYearOwnerRead {
  id: MonthYearOwner; actionIndex: number; alive: boolean; picker: 'month' | 'year';
  open: boolean; needConfirm: boolean | undefined; limited: boolean; localized: boolean;
  order: boolean; witness: boolean; model: unknown; rawModel: unknown; modelDates: unknown[];
  producerCount: number; authoredDates: Record<string, unknown>; authoredProps: unknown;
  rawAuthoredProps: unknown; callbacks: MonthYearInvocation[]; ownerActions: unknown[];
  lifecycle: Array<{ phase: 'mount' | 'unmount' }>;
}
export interface MonthYearCapture {
  recorder?: ReturnType<typeof createDatePickerPresetsRecorder>;
  setActionIndex?: (index: number) => void;
  readRefs?: () => { owner: HTMLElement | null; control: MonthYearControl | null; root: HTMLDivElement | null };
  read?: () => MonthYearOwnerRead;
  readCallbacks?: (cursor?: number) => MonthYearCursorDelta;
  readProducers?: (cursor?: number) => MonthYearCursorDelta;
}
export interface MonthYearObservation {
  preMountNodes: Set<Element>; retainedNodes: Set<Element>; events: unknown[];
  initialOwner?: HTMLElement; initialRoot?: HTMLDivElement; initialInputs?: HTMLInputElement[];
}
export interface MonthYearNativeBridge {
  ready: boolean; getRecorder(): NonNullable<MonthYearCapture['recorder']>;
  read(): MonthYearOwnerRead;
  readRefs(): ReturnType<NonNullable<MonthYearCapture['readRefs']>>;
  setActionIndex(index: number): void;
  readCallbacks(cursor?: number): MonthYearCursorDelta;
  readProducers(cursor?: number): MonthYearCursorDelta;
  activateControl(value: string): unknown;
  dispose(): Promise<void>; stopEventObserver(): void;
}
declare global {
  interface Window {
    nativeMonthYear: MonthYearNativeBridge;
    nativeMonthYearObservation: MonthYearObservation;
  }
}
