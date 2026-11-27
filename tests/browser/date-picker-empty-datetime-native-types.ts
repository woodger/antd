import type { createDatePickerPresetsRecorder }
  from './date-picker-presets-recorder.mjs';

export type EmptyDatetimeOwner = 'single' | 'range';
export interface EmptyDatetimeControl {
  focus(options?: FocusOptions & { index?: 0 | 1; cursor?: 'start' | 'end' | 'all' }): void;
  blur(): void;
}
export interface EmptyDatetimeCapture {
  read?: () => unknown;
  readRefs?: () => { owner: HTMLElement | null; control: EmptyDatetimeControl | null;
    root: HTMLDivElement | null };
  setActionIndex?: (index: number) => void;
  recorder?: ReturnType<typeof createDatePickerPresetsRecorder>;
}

export interface EmptyDatetimeObservation {
  preMountNodes: Set<Element>;
  retainedNodes: Set<Element>;
  events: unknown[];
  initialOwner?: HTMLElement;
  initialRoot?: HTMLDivElement;
  initialInputs?: HTMLInputElement[];
}
export interface EmptyDatetimeNativeBridge {
  ready: boolean;
  getRecorder(): NonNullable<EmptyDatetimeCapture['recorder']>;
  read(): unknown;
  readRefs(): ReturnType<NonNullable<EmptyDatetimeCapture['readRefs']>>;
  setActionIndex(index: number): void;
  activateTemplate(): unknown;
  dispose(): Promise<void>;
  stopEventObserver(): void;
}
declare global {
  interface Window {
    nativeEmptyDatetime: EmptyDatetimeNativeBridge;
    nativeEmptyDatetimeObservation: EmptyDatetimeObservation;
  }
}
