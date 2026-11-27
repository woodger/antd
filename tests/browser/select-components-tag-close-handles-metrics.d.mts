import type { SelectRef } from '@woodger/antd';
import type { SelectSurfaceProducerCall } from './select-surface-producers.mjs';
export interface SelectTagCloseHandleOwner {
  model: unknown; rawModel: unknown; options: unknown; rawOptions: unknown;
  modelIdentity: number | null; optionsIdentity: number; optionIdentities: Array<{ value: string; identity: number }>;
  disabled: boolean; open: boolean; alive: boolean; actionIndex: number;
  events: unknown[]; rawEvents: unknown[]; calls: SelectSurfaceProducerCall[]; invocations: unknown[];
  retention: unknown[]; lifecycle: unknown[]; bodyActivity: unknown[]; componentObservations: unknown[];
  lastProducedInvocableHandles: unknown[]; retainedHandles: unknown[];
  authoredSample: unknown; rawAuthoredSample: unknown; authoredProps: unknown; rawAuthoredProps: unknown;
  authoredProvider: unknown; rawAuthoredProvider: unknown;
}
export interface SelectTagCloseHandleRefs {
  control?: SelectRef | null; root: HTMLDivElement | null; editor: HTMLInputElement | null;
  authoredInput: HTMLInputElement | null;
}
export interface SelectTagCloseHandleCapture {
  read?(): SelectTagCloseHandleOwner; readRefs?(): SelectTagCloseHandleRefs; setActionIndex?(value: number): void;
}
export interface SelectTagCloseHandleNativeAPI {
  ready: true; read(): SelectTagCloseHandleOwner; readRefs(): SelectTagCloseHandleRefs;
  setActionIndex(value: number): void; click(actionId: string, index: number): void; dispose(): Promise<void>;
}
export interface SelectTagCloseHandleNode {
  identity: number | null; tag: string; connected: boolean; parentIdentity: number | null;
  attributes: string[][]; html: string; styleAttribute: string | null; cssText: string;
  inlineProperties: Array<{ name: string; value: string; priority: string }>; css: Record<string, string>;
  box: { x: number; y: number; width: number; height: number }; metrics: Record<string, number | null>;
  value: string | null; defaultValue: string | null; selection: [number | null, number | null, string | null] | null;
  focused: boolean; textContent: string | null;
  childNodes: Array<{ identity: number | null; type: number; name: string; text: string | null }>;
}
export interface SelectTagCloseHandleDOM {
  root: SelectTagCloseHandleNode | null; editor: SelectTagCloseHandleNode | null;
  sameRoot: boolean; sameEditor: boolean; publicRootMatches: boolean;
  tags: SelectTagCloseHandleNode[]; buttons: SelectTagCloseHandleNode[]; allRootElements: SelectTagCloseHandleNode[];
  activeElement: { identity: number | null; tag: string; connected: boolean; attributes: string[][] } | null;
  popupCount: number; ownerCount: number;
  browserOwnedResourceCounters: { measured: false; observers: null; mutations: null; frames: null; timers: null; ports: null };
  resourceTiming: Record<string, unknown>[];
}
export function readSelectTagCloseHandleDOM(): SelectTagCloseHandleDOM;
declare global { interface Window { tagCloseHandlesNative: SelectTagCloseHandleNativeAPI } }
