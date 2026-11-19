import type { createDatePickerPresetsRecorder } from './date-picker-presets-recorder.mjs';
import type { WeekOwner } from './date-picker-week-cases.mjs';
export type { WeekOwner } from './date-picker-week-cases.mjs';
export interface WeekControl {
  focus(options?: FocusOptions & { index?: 0 | 1; cursor?: 'start' | 'end' | 'all' }): void;
  blur(): void;
}
export interface WeekInvocation {
  index: number; actionIndex: number; name: string; actualArgumentCount: number;
  encodedArguments: unknown; rawArguments: unknown; dates: unknown[];
  receiver: { type: string; isUndefined: boolean; isNull: boolean; identity: number | null };
  returned?: boolean;
}
export interface WeekCursorDelta {
  cursor: number; next: number; rows: WeekInvocation[];
}
export interface WeekOwnerRead {
  id: WeekOwner; actionIndex: number; alive: boolean; picker: 'week';
  open: boolean; needConfirm: boolean | undefined; limited: boolean; localeName: 'us' | 'gb'; localized: boolean; weekNumbers: boolean | undefined;
  order: boolean; witness: boolean; model: unknown; rawModel: unknown; modelDates: unknown[];
  producerCount: number; authoredDates: Record<string, unknown>; authoredProps: unknown;
  rawAuthoredProps: unknown; callbacks: WeekInvocation[]; ownerActions: unknown[];
  lifecycle: Array<{ phase: 'mount' | 'unmount' }>;
}
export interface WeekCapture {
  recorder?: ReturnType<typeof createDatePickerPresetsRecorder>;
  setActionIndex?: (index: number) => void;
  readRefs?: () => { owner: HTMLElement | null; control: WeekControl | null; root: HTMLDivElement | null };
  read?: () => WeekOwnerRead;
  readCallbacks?: (cursor?: number) => WeekCursorDelta;
  readProducers?: (cursor?: number) => WeekCursorDelta;
}
export interface WeekObservation {
  preMountNodes: Set<Element>; retainedNodes: Set<Element>; events: unknown[];
  initialOwner?: HTMLElement; initialRoot?: HTMLDivElement; initialInputs?: HTMLInputElement[];
}
export interface WeekNativeBridge {
  ready: boolean; getRecorder(): NonNullable<WeekCapture['recorder']>;
  read(): WeekOwnerRead;
  readRefs(): ReturnType<NonNullable<WeekCapture['readRefs']>>;
  setActionIndex(index: number): void;
  readCallbacks(cursor?: number): WeekCursorDelta;
  readProducers(cursor?: number): WeekCursorDelta;
  activateControl(value: string): unknown;
  dispose(): Promise<void>; stopEventObserver(): void;
}
declare global {
  interface Window {
    nativeWeek: WeekNativeBridge;
    nativeWeekObservation: WeekObservation;
  }
}
