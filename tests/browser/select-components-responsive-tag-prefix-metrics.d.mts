import type { SelectRef } from 'antd-svelte';
import type { SelectSurfaceProducerCall } from './select-surface-producers.mjs';
import type { SelectComponentsResponsiveDOM, SelectComponentsResponsiveOverflow, SelectComponentsResponsiveBox } from './select-components-responsive-metrics.mjs';
import type { SelectCustomTagPrefixUpdate } from './select-components-responsive-tag-prefix-cases.mjs';
export interface SelectCustomTagPrefixNode {
  identity: number | null; tag: string; connected: boolean; parentIdentity: number | null;
  html: string; text: string | null; attributes: string[][]; cssText: string; styleAttribute: string | null;
  inlineProperties: Array<{ name: string; value: string; priority: string }>;
  css: Record<string, string>; box: SelectComponentsResponsiveBox; clientRects: SelectComponentsResponsiveBox[];
  metrics: Record<'offsetWidth' | 'clientWidth' | 'scrollWidth' | 'offsetHeight' | 'clientHeight' | 'scrollHeight', number | null>;
  focused: boolean; value: string | null; defaultValue: string | null;
  selection: [number | null, number | null, string | null] | null;
  childNodes: Array<{ identity: number | null; type: number; tag: string | null; text: string | null }>;
}
export interface SelectCustomTagPrefixDetails {
  root: SelectCustomTagPrefixNode | null; editor: SelectCustomTagPrefixNode | null; content: SelectCustomTagPrefixNode | null;
  leadingPrefix: SelectCustomTagPrefixNode | null; prefixBody: SelectCustomTagPrefixNode | null;
  prefixTopology: { leadingPrefixIsDirectRootChild: boolean; leadingPrefixOutsideOverflow: boolean;
    leadingPrefixRootIndex: number | null; overflowRootIndex: number | null; overflowPrefixNodes: SelectCustomTagPrefixNode[] };
  rootChildren: SelectCustomTagPrefixNode[]; contentChildren: SelectCustomTagPrefixNode[];
  customTags: SelectCustomTagPrefixNode[]; customLabels: SelectCustomTagPrefixNode[]; customCloseButtons: SelectCustomTagPrefixNode[];
  rests: SelectCustomTagPrefixNode[]; suffix: SelectCustomTagPrefixNode | null; allRootElements: SelectCustomTagPrefixNode[];
  frame: SelectCustomTagPrefixNode | null;
  browserOwnedResourceCounters: { measured: false; observers: null; mutations: null; frames: null; timers: null; ports: null; reason: string };
}
export interface SelectCustomTagPrefixOwner {
  model: unknown; rawModel: unknown; open: boolean; query: string; alive: boolean; settings: unknown; rawSettings: unknown;
  context: unknown; rawContext: unknown; events: unknown[]; rawEvents: unknown[]; calls: SelectSurfaceProducerCall[];
  lifecycle: unknown[]; bodyActivity: unknown[]; componentObservations: unknown[];
  authoredSample: unknown; rawAuthoredSample: unknown; authoredProps: unknown; rawAuthoredProps: unknown;
  authoredProvider: unknown; rawAuthoredProvider: unknown;
}
export interface SelectCustomTagPrefixRefs {
  control?: SelectRef | null; root: HTMLElement | null; editor: HTMLInputElement | null; authoredRoot: null; authoredInput: HTMLInputElement | null;
}
export interface SelectCustomTagPrefixCapture {
  read?(): SelectCustomTagPrefixOwner; readRefs?(): SelectCustomTagPrefixRefs;
  update?(action: SelectCustomTagPrefixUpdate, index?: number): void;
}
export interface SelectCustomTagPrefixNativeAPI {
  ready: true; read(): SelectCustomTagPrefixOwner; readRefs(): SelectCustomTagPrefixRefs;
  update(action: SelectCustomTagPrefixUpdate, index?: number): void; dispose(): Promise<void>;
}
declare global { interface Window { customTagPrefixNative: SelectCustomTagPrefixNativeAPI } }
export function readSelectIcons(): SelectComponentsResponsiveDOM;
export function readSelectResponsiveOverflow(): SelectComponentsResponsiveOverflow;
export function readSelectCustomTagPrefix(): SelectCustomTagPrefixDetails;
