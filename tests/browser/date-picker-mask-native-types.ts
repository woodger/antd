import type { createDatePickerPresetsRecorder } from './date-picker-presets-recorder.mjs';
import type { MaskOwner, MaskFamily, MaskKind, MaskFormatProfile, MaskAuthoredDateName }
  from './date-picker-mask-cases.mjs';
export type { MaskOwner } from './date-picker-mask-cases.mjs';
export interface MaskControl {
  focus(options?: FocusOptions & { index?: 0 | 1; cursor?: 'start' | 'end' | 'all' }): void;
  blur(): void;
}
export interface MaskInvocation {
  index: number; actionIndex: number; substepIndex: number; name: string; actualArgumentCount: number;
  encodedArguments: unknown; rawArguments: unknown; dates: unknown[];
  receiver: { type: string; isUndefined: boolean; isNull: boolean; identity: number | null };
  returned?: unknown; rawReturned?: unknown; returnedIdentity?: number | null;
}
export interface MaskCursorDelta { cursor: number; next: number; rows: MaskInvocation[]; }
export interface MaskOwnerRead {
  id: MaskOwner; family: MaskFamily; kind: MaskKind; picker: 'date' | 'time';
  actionIndex: number; substepIndex: number; alive: boolean; open: boolean; formatProfile: MaskFormatProfile;
  model: unknown; rawModel: unknown; modelDates: unknown[]; producerCount: number;
  formatValue: { type: string; identity: number | null; encoded: unknown; raw: unknown };
  authoredDates: Record<MaskAuthoredDateName, unknown>; authoredProps: unknown; rawAuthoredProps: unknown;
  callbacks: MaskInvocation[]; ownerActions: unknown[]; lifecycle: Array<{ phase: 'mount' | 'unmount' }>;
}
export interface MaskCapture {
  recorder?: ReturnType<typeof createDatePickerPresetsRecorder>;
  setActionIndex?: (index: number) => void; setSubstepIndex?: (index: number) => void;
  readRefs?: () => {
    owner: HTMLElement | null;
    control: MaskControl | null;
    root: HTMLDivElement | null
  };
  read?: () => MaskOwnerRead;
  readCallbacks?: (cursor?: number) => MaskCursorDelta;
  readProducers?: (cursor?: number) => MaskCursorDelta;
}
export interface MaskObservation {
  preMountNodes: Set<Element>; retainedNodes: Set<Element>; events: unknown[];
  initialOwner?: HTMLElement; initialRoot?: HTMLDivElement; initialInputs?: HTMLInputElement[];
}
export interface MaskNativeBridge {
  ready: boolean; getRecorder(): NonNullable<MaskCapture['recorder']>;
  read(): MaskOwnerRead; readRefs(): ReturnType<NonNullable<MaskCapture['readRefs']>>;
  setActionIndex(index: number): void; setSubstepIndex(index: number): void;
  readCallbacks(cursor?: number): MaskCursorDelta; readProducers(cursor?: number): MaskCursorDelta;
  activateControl(value: string): unknown; dispose(): Promise<void>; stopEventObserver(): void;
}
declare global {
  interface Window { nativeMask: MaskNativeBridge; nativeMaskObservation: MaskObservation; }
}
