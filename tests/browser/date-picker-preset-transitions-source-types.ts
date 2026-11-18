import type { DatePickerPresetTransitionSample } from './date-picker-preset-transitions-cases.mjs';

/** Original React capture shapes. These interfaces do not describe the Svelte caller API. */
export interface DatePickerPresetTransitionsSourceTemporal {
  isDayjs: boolean; valid: boolean; epoch: number; iso: string | null; utcOffset: number;
  fields: number[];
}
export type DatePickerPresetTransitionsAuthoredDate = 'initialValue' | 'defaultPickerValue'
  | 'initialPickerValue' | 'initialMinDate' | 'updatedMinDate' | 'maxDate' | 'presetValue';
export interface DatePickerPresetTransitionsSourceValue {
  encoded: unknown; raw: unknown; temporal: DatePickerPresetTransitionsSourceTemporal | null;
  identity: number | null;
  sameAsAuthoredDates: Record<DatePickerPresetTransitionsAuthoredDate, boolean>;
}
export interface DatePickerPresetTransitionsSourceInvocation {
  name: string; actionIndex: number; actualArgumentCount: number;
  arguments: unknown; rawArguments: unknown;
  receiver: { isUndefined: boolean; isNull: boolean; type: string };
}
export interface DatePickerPresetTransitionsSourceDateCallback {
  name: string; actionIndex: number; value: DatePickerPresetTransitionsSourceValue;
  text?: string; info: unknown; rawInfo: unknown; ownInfo: unknown;
}
export interface DatePickerPresetTransitionsSourceOwner {
  alive: boolean; open: boolean; format: string;
  preview: DatePickerPresetTransitionSample['preview'];
  pickerOwner: DatePickerPresetTransitionSample['pickerOwner'];
  value: DatePickerPresetTransitionsSourceValue; pickerValue: DatePickerPresetTransitionsSourceValue;
  minDate: DatePickerPresetTransitionsSourceValue;
  events: unknown[]; rawEvents: unknown[];
  callbackInvocations: DatePickerPresetTransitionsSourceInvocation[];
  callbackDates: DatePickerPresetTransitionsSourceDateCallback[];
  calls: Array<Record<string, unknown>>; ownerActions: Array<Record<string, unknown>>;
  lifecycle: Array<{ phase: 'mount' | 'unmount' }>;
  authoredProps: unknown; rawAuthoredProps: unknown;
  authoredPresets: unknown; rawAuthoredPresets: unknown;
  authoredSample: unknown; rawAuthoredSample: unknown;
  authoredProvider: unknown; rawAuthoredProvider: unknown;
  authoredDates: Record<DatePickerPresetTransitionsAuthoredDate, DatePickerPresetTransitionsSourceValue>;
}
export interface DatePickerPresetTransitionsSourceNode {
  identity: number; tag: string; connected: boolean; parentIdentity: number | null;
  attributes: Array<[string, string]>; styleAttribute: string | null; cssText: string;
  inlineProperties: Array<[string, string, string]>; css: Array<[string, string]>;
  box: { x: number; y: number; width: number; height: number };
  metrics: Array<[string, number | null]>; html: string | null; text: string | null;
  children: Array<{ identity: number; type: number; name: string; text: string | null }> | null;
  value: string | null; defaultValue: string | null;
  selection: [number | null, number | null, string | null] | null; focused: boolean;
}
export interface DatePickerPresetTransitionsUnmeasuredCounters {
  measured: false; observers: null; mutations: null; frames: null; timers: null; ports: null;
}
export interface DatePickerPresetTransitionsSourceCorePoint {
  owner: DatePickerPresetTransitionsSourceOwner;
  root: DatePickerPresetTransitionsSourceNode | null;
  input: DatePickerPresetTransitionsSourceNode | null; sameRoot: boolean; sameInput: boolean;
  publicRef: { controlPresent: boolean; nativeElementIdentity: number | null };
  rootElements: DatePickerPresetTransitionsSourceNode[];
  popups: Array<{ node: DatePickerPresetTransitionsSourceNode; visible: boolean;
    allElements: DatePickerPresetTransitionsSourceNode[] }>;
  popupAncestors: Array<{ node: DatePickerPresetTransitionsSourceNode;
    presentBeforeSourceMount: boolean | null; ownedAsPostMountPopupAncestor: boolean }>;
  presets: DatePickerPresetTransitionsSourceNode[]; cells: DatePickerPresetTransitionsSourceNode[];
  clear: DatePickerPresetTransitionsSourceNode | null;
  authoredLabels: DatePickerPresetTransitionsSourceNode[];
  activeElement: DatePickerPresetTransitionsSourceNode | null;
  browserOwnedResourceCounters: DatePickerPresetTransitionsUnmeasuredCounters;
  environment: { timezone: string }; resourceTiming: unknown[];
}
export interface DatePickerPresetTransitionsSourcePoint extends DatePickerPresetTransitionsSourceCorePoint {
  publicRefDetails: { controlIdentity: number | null; focusIdentity: number | null;
    blurIdentity: number | null; sameControl: boolean; sameFocus: boolean; sameBlur: boolean;
    controlOwnKeys: string[] };
  form: { connected: boolean; attributes: Array<[string, string]>;
    entries: Array<[string, string]> } | null;
  calendarHeaders: Array<{ text: string | null; html: string }>;
  timeColumns: Array<{ type: string | null; scrollTop: number; scrollHeight: number;
    clientHeight: number; cells: Array<{ value: string | null; text: string | null;
      attributes: Array<[string, string]>; selected: boolean; disabled: boolean }> }>;
}
export interface DatePickerPresetTransitionsSourceCleanup {
  owner: DatePickerPresetTransitionsSourceOwner;
  refs: Record<'control' | 'root' | 'owner', boolean>;
  retained: Array<{ identity: number; name: string; connected: boolean; owned: boolean;
    ownershipEvidence: unknown }>;
  ownerCount: number; popupCount: number;
  activeElement: { name: string; connected: boolean } | null;
  browserOwnedResourceCounters: DatePickerPresetTransitionsUnmeasuredCounters; resourceTiming: unknown[];
}
