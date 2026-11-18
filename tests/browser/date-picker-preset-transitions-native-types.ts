import type {
  DatePickerPresetTransitionSample
} from './date-picker-preset-transitions-cases.mjs';
export type {
  DatePickerPresetTransitionAction, DatePickerPresetTransitionSample
} from './date-picker-preset-transitions-cases.mjs';

export interface DatePickerPresetTransitionDate {
  encoded: unknown;
  raw: unknown;
  temporal: null | {
    isDayjs: boolean; valid: boolean; epoch: number; iso: string | null;
    utcOffset: number; fields: number[];
  };
  identity: number | null;
  sameAsAuthoredDates: Record<string, boolean>;
}
export interface DatePickerPresetTransitionReceiver {
  isUndefined: boolean; isNull: boolean; type: string;
}
export interface DatePickerPresetTransitionCallback {
  name: string; actionIndex: number; actualArgumentCount: number;
  arguments: unknown; rawArguments: unknown;
  receiver: DatePickerPresetTransitionReceiver;
  nativeFocus?: {
    type: string; isTrusted: boolean; ownerAlive: boolean;
    targetTag: string | null; targetId: string | null; targetConnected: boolean | null;
    currentTargetTag: string | null; currentTargetMatchesTarget: boolean;
    relatedTargetTag: string | null;
  };
}
export interface DatePickerPresetTransitionDateCallback {
  name: string; actionIndex: number; value: DatePickerPresetTransitionDate;
  text: unknown; info: unknown; rawInfo: unknown; ownInfo: unknown;
}
export interface DatePickerPresetTransitionBefore {
  open: boolean; format: string; preview: DatePickerPresetTransitionSample['preview'];
  value: DatePickerPresetTransitionDate; pickerValue: DatePickerPresetTransitionDate;
  minDate: DatePickerPresetTransitionDate;
}
export interface DatePickerPresetTransitionOwnerAction {
  actionIndex: number; kind: DatePickerPresetTransitionOwnerControl; value: string | boolean;
  event: { type: string; isTrusted: boolean; nativeIsTrusted: boolean };
  before: DatePickerPresetTransitionBefore;
  nativeMouse: {
    actualArgumentCount: number; arguments: unknown; rawArguments: unknown;
    targetTag: string | null; currentTargetTag: string | null;
    currentTargetMatchesTarget: boolean; nativeEventWrapperPresent: boolean;
  };
}
export interface DatePickerPresetTransitionOwner {
  alive: boolean; open: boolean; format: string;
  preview: DatePickerPresetTransitionSample['preview'];
  pickerOwner: DatePickerPresetTransitionSample['pickerOwner'];
  value: DatePickerPresetTransitionDate; pickerValue: DatePickerPresetTransitionDate;
  minDate: DatePickerPresetTransitionDate;
  events: unknown[]; rawEvents: unknown[];
  callbackInvocations: DatePickerPresetTransitionCallback[];
  callbackDates: DatePickerPresetTransitionDateCallback[]; calls: unknown[];
  ownerActions: DatePickerPresetTransitionOwnerAction[];
  lifecycle: Array<{ phase: 'mount' | 'unmount' }>;
  authoredProps: unknown; rawAuthoredProps: unknown;
  authoredPresets: unknown; rawAuthoredPresets: unknown;
  authoredSample: unknown; rawAuthoredSample: unknown;
  authoredProvider: unknown; rawAuthoredProvider: unknown;
  authoredDates: Record<string, DatePickerPresetTransitionDate>;
}
export interface DatePickerPresetTransitionControl {
  focus(options?: FocusOptions & { cursor?: 'start' | 'end' | 'all' }): void;
  blur(): void;
}
export interface DatePickerPresetTransitionRefs {
  control: DatePickerPresetTransitionControl | null;
  root: HTMLDivElement | null;
  owner: HTMLElement | null;
}
export interface DatePickerPresetTransitionCapture {
  read?: () => DatePickerPresetTransitionOwner;
  readRefs?: () => DatePickerPresetTransitionRefs;
  setActionIndex?: (index: number) => void;
}
export type DatePickerPresetTransitionOwnerControl = 'open' | 'format' | 'preview' | 'min-date';

export interface DatePickerPresetTransitionNode {
  identity: number; tag: string; connected: boolean; parentIdentity: number | null;
  attributes: Array<[string, string]>; styleAttribute: string | null; cssText: string;
  inlineProperties: Array<[string, string, string]>; css: Array<[string, string]>;
  box: { x: number; y: number; width: number; height: number };
  metrics: Array<[string, number | null | undefined]>;
  html: string | null; text: string | null;
  children: Array<{ identity: number; type: number; name: string; text: string | null }> | null;
  value: unknown; defaultValue: unknown;
  selection: [number | null, number | null, string | null] | null;
  focused: boolean;
}
export interface DatePickerPresetTransitionCorePoint {
  owner: DatePickerPresetTransitionOwner;
  root: DatePickerPresetTransitionNode | null; input: DatePickerPresetTransitionNode | null;
  sameRoot: boolean; sameInput: boolean;
  publicRef: { controlPresent: boolean; nativeElementIdentity: number | null };
  rootElements: DatePickerPresetTransitionNode[];
  popups: Array<{ node: DatePickerPresetTransitionNode; visible: boolean; allElements: DatePickerPresetTransitionNode[] }>;
  popupAncestors: Array<{ node: DatePickerPresetTransitionNode; presentBeforeSourceMount: boolean | null; ownedAsPostMountPopupAncestor: boolean }>;
  presets: DatePickerPresetTransitionNode[]; cells: DatePickerPresetTransitionNode[];
  clear: DatePickerPresetTransitionNode | null; authoredLabels: DatePickerPresetTransitionNode[];
  activeElement: DatePickerPresetTransitionNode | null;
  browserOwnedResourceCounters: { measured: false; observers: null; mutations: null; frames: null; timers: null; ports: null };
  environment: { timezone: string }; resourceTiming: unknown[];
}
export interface DatePickerPresetTransitionPoint extends DatePickerPresetTransitionCorePoint {
  publicRefDetails: {
    controlIdentity: number | null; focusIdentity: number | null; blurIdentity: number | null;
    sameControl: boolean; sameFocus: boolean; sameBlur: boolean; controlOwnKeys: string[];
  };
  form: null | { connected: boolean; attributes: Array<[string, string]>; entries: Array<[string, FormDataEntryValue]> };
  calendarHeaders: Array<{ text: string | null; html: string }>;
  timeColumns: Array<{
    type: string | null; scrollTop: number; scrollHeight: number; clientHeight: number;
    cells: Array<{ value: string | null; text: string | null; attributes: Array<[string, string]>; selected: boolean; disabled: boolean }>;
  }>;
}
export interface DatePickerPresetTransitionCleanup {
  owner: DatePickerPresetTransitionOwner; refs: Record<keyof DatePickerPresetTransitionRefs, boolean>;
  retained: Array<{ identity: number; name: string; connected: boolean; owned: boolean; ownershipEvidence: unknown }>;
  ownerCount: number; popupCount: number;
  activeElement: { name: string; connected: boolean } | null;
  browserOwnedResourceCounters: DatePickerPresetTransitionCorePoint['browserOwnedResourceCounters'];
  resourceTiming: unknown[];
}
export interface DatePickerPresetTransitionOwnerAPI {
  read: () => DatePickerPresetTransitionOwner;
  readRefs: () => DatePickerPresetTransitionRefs;
  setActionIndex: (index: number) => void;
}
export interface DatePickerPresetTransitionRaw {
  sample: DatePickerPresetTransitionSample;
  current: DatePickerPresetTransitionOwnerAPI;
  preMountElements: Set<Element>;
  pickerProbe?: unknown;
  transitionRefProbe?: unknown;
}
export interface DatePickerPresetTransitionNativeAPI extends DatePickerPresetTransitionOwnerAPI {
  ready: boolean;
  activateOwnerControl: (kind: DatePickerPresetTransitionOwnerControl, value: string | boolean) => void;
  readDOM: () => DatePickerPresetTransitionPoint;
  readCleanup: () => DatePickerPresetTransitionCleanup;
  dispose: () => Promise<void>;
}

declare global {
  interface Window {
    readPresetTransitionsCore: () => DatePickerPresetTransitionCorePoint;
    datePickerPresetTransitionsNative: DatePickerPresetTransitionNativeAPI;
  }
}
