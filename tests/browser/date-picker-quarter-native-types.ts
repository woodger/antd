import type { createDatePickerPresetsRecorder } from './date-picker-presets-recorder.mjs';
import type { QuarterOwner } from './date-picker-quarter-cases.mjs';
export type { QuarterOwner } from './date-picker-quarter-cases.mjs';
export interface QuarterControl {
  focus(options?: FocusOptions & { index?: 0 | 1; cursor?: 'start' | 'end' | 'all' }): void;
  blur(): void;
}
export interface QuarterInvocation {
  index: number; actionIndex: number; name: string; actualArgumentCount: number;
  encodedArguments: unknown; rawArguments: unknown; dates: unknown[];
  receiver: { type: string; isUndefined: boolean; isNull: boolean; identity: number | null };
  returned?: boolean; boundary?: 'first' | 'last';
}
export interface QuarterCursorDelta {
  cursor: number; next: number; rows: QuarterInvocation[];
}
export interface QuarterOwnerRead {
  id: QuarterOwner; actionIndex: number; alive: boolean; picker: 'quarter';
  open: boolean; needConfirm: boolean | undefined; limited: boolean; disabledBoundary: 'first' | 'last'; localized: boolean;
  order: boolean; witness: boolean; model: unknown; rawModel: unknown; modelDates: unknown[];
  producerCount: number; authoredDates: Record<string, unknown>; authoredProps: unknown;
  rawAuthoredProps: unknown; callbacks: QuarterInvocation[]; ownerActions: unknown[];
  lifecycle: Array<{ phase: 'mount' | 'unmount' }>;
}
export interface QuarterCapture {
  recorder?: ReturnType<typeof createDatePickerPresetsRecorder>;
  setActionIndex?: (index: number) => void;
  readRefs?: () => { owner: HTMLElement | null; control: QuarterControl | null; root: HTMLDivElement | null };
  read?: () => QuarterOwnerRead;
  readCallbacks?: (cursor?: number) => QuarterCursorDelta;
  readProducers?: (cursor?: number) => QuarterCursorDelta;
}
export interface QuarterObservation {
  preMountNodes: Set<Element>; retainedNodes: Set<Element>; events: unknown[];
  initialOwner?: HTMLElement; initialRoot?: HTMLDivElement; initialInputs?: HTMLInputElement[];
}
export interface QuarterNativeBridge {
  ready: boolean; getRecorder(): NonNullable<QuarterCapture['recorder']>;
  read(): QuarterOwnerRead;
  readRefs(): ReturnType<NonNullable<QuarterCapture['readRefs']>>;
  setActionIndex(index: number): void;
  readCallbacks(cursor?: number): QuarterCursorDelta;
  readProducers(cursor?: number): QuarterCursorDelta;
  activateControl(value: string): unknown;
  dispose(): Promise<void>; stopEventObserver(): void;
}
declare global {
  interface Window {
    nativeQuarter: QuarterNativeBridge;
    nativeQuarterObservation: QuarterObservation;
  }
}
