import type { DatePickerPresetSample } from './date-picker-presets-cases.mjs';
export interface DatePickerPresetTemporal {
  isDayjs: boolean; valid: boolean; epoch: number; iso: string | null; utcOffset: number; fields: number[];
}
export interface DatePickerPresetValue {
  encoded: unknown; raw: unknown; temporal: DatePickerPresetTemporal | null; identity: number | null; sameAsLazyReturns: boolean[];
}
export interface DatePickerPresetLifecycle { slot: 'label'; id: string; event: 'mount' | 'unmount' }
export interface DatePickerPresetCallbackInvocation {
  name: string; actionIndex: number; actualArgumentCount: number; arguments: unknown; rawArguments: unknown;
  nativeFocus?: {
    type: string; isTrusted: boolean; ownerAlive: boolean;
    targetTag: string | null; targetId: string | null; targetConnected: boolean | null;
    currentTargetTag: string | null; currentTargetMatchesTarget: boolean; relatedTargetTag: string | null;
  };
}
export interface DatePickerPresetOwner {
  alive: boolean; open: boolean; preview: DatePickerPresetSample['preview']; value: DatePickerPresetValue;
  events: unknown[]; rawEvents: unknown[]; callbackInvocations: DatePickerPresetCallbackInvocation[];
  lazyCalls: unknown[]; calls: unknown[]; callbackDates: unknown[];
  lifecycle: DatePickerPresetLifecycle[]; bodyActivity: Array<{ id: string; text: string }>;
  authoredProps: unknown; rawAuthoredProps: unknown; authoredPresets: unknown; rawAuthoredPresets: unknown;
  authoredSample: unknown; rawAuthoredSample: unknown; authoredProvider: unknown; rawAuthoredProvider: unknown;
}
export interface DatePickerPresetControl { focus(options?: FocusOptions & { cursor?: 'start' | 'end' | 'all' }): void; blur(): void }
export interface DatePickerPresetRefs { control: DatePickerPresetControl | null; root: HTMLDivElement | null; owner: HTMLElement | null }
export interface DatePickerPresetCapture {
  read?: () => DatePickerPresetOwner; readRefs?: () => DatePickerPresetRefs; setActionIndex?: (index: number) => void;
  setPreview?: (value: 'hover' | false) => void;
}
export interface DatePickerPresetNode {
  identity: number; tag: string; connected: boolean; parentIdentity: number | null;
  attributes: Array<[string, string]>; styleAttribute: string | null; cssText: string;
  inlineProperties: Array<[string, string, string]>; css: Array<[string, string]>;
  box: { x: number; y: number; width: number; height: number }; metrics: Array<[string, number | null | undefined]>;
  html: string | null; text: string | null;
  children: Array<{ identity: number; type: number; name: string; text: string | null }> | null;
  value: string | null; defaultValue: string | null; selection: [number | null, number | null, string | null] | null; focused: boolean;
}
export interface DatePickerPresetPoint {
  owner: DatePickerPresetOwner; root: DatePickerPresetNode | null; input: DatePickerPresetNode | null; sameRoot: boolean; sameInput: boolean;
  publicRef: { controlPresent: boolean; nativeElementIdentity: number | null }; rootElements: DatePickerPresetNode[];
  popups: Array<{
    node: DatePickerPresetNode;
    visible: boolean;
    allElements: DatePickerPresetNode[]
  }>;
  popupAncestors: Array<{
    node: DatePickerPresetNode;
    presentBeforeSourceMount: boolean | null;
    ownedAsPostMountPopupAncestor: boolean
  }>;
  presets: DatePickerPresetNode[]; cells: DatePickerPresetNode[]; clear: DatePickerPresetNode | null;
  authoredLabels: DatePickerPresetNode[]; activeElement: DatePickerPresetNode | null;
  browserOwnedResourceCounters: {
    measured: false;
    observers: null;
    mutations: null;
    frames: null;
    timers: null;
    ports: null
  };
  environment: { timezone: string }; resourceTiming: unknown[];
}
export function readDatePickerPresets(): DatePickerPresetPoint;
export function readDatePickerPresetsCleanup(): {
  owner: DatePickerPresetOwner; refs: Record<keyof DatePickerPresetRefs, boolean>;
  retained: Array<{
    identity: number;
    name: string;
    connected: boolean;
    owned: boolean;
    ownershipEvidence: unknown
  }>;
  ownerCount: number; popupCount: number; activeElement: { name: string; connected: boolean } | null;
  browserOwnedResourceCounters: DatePickerPresetPoint['browserOwnedResourceCounters']; resourceTiming: unknown[];
};
declare global {
  interface Window {
    datePickerPresetsNative: { ready: boolean; read: () => DatePickerPresetOwner; readRefs: () => DatePickerPresetRefs;
      setActionIndex: (index: number) => void; setPreview: (value: 'hover' | false) => void; dispose: () => Promise<void> };
  }
}
