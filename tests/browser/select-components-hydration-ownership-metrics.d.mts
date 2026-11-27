import type { SelectRef } from '@woodger/antd';
import type { HydrationOwnershipOwnerKey, HydrationOwnershipScenario, HydrationOwnershipTag, HydrationOwnershipUpdate } from './select-components-hydration-ownership-cases.mjs';
export interface HydrationOwnershipLocalRoot { identity: number; nodeType: number; name: string; mode: 'open' | 'closed' | null; hostIdentity: number | null }
export interface HydrationOwnershipNode {
  identity: number; nodeType: number; name: string; connected: boolean; ownerKey: string | null; namespaceURI: string | null;
  attributes: string[][] | null; cssText: string | null; inlineProperties: Array<{
    name: string;
    value: string;
    priority: string
  }> | null;
  styleAttribute: string | null; html: string | null; value: string | null; defaultValue: string | null;
  selection: [number | null, number | null, string | null] | null; documentFocused: boolean; scopeFocused: boolean;
  localRoot: HydrationOwnershipLocalRoot; box: {
    x: number;
    y: number;
    width: number;
    height: number
  } | null;
  childNodes: Array<{ identity: number; type: number; name: string; text: string | null }> | null;
}
export type HydrationOwnershipShallowNode = Pick<HydrationOwnershipNode, 'identity' | 'nodeType' | 'name' | 'connected' | 'attributes' | 'ownerKey' | 'localRoot'>;
export interface HydrationOwnershipOwnerState {
  ownerKey: HydrationOwnershipOwnerKey; controlKey: string; publicId: string; callerUID: string;
  query: string; model: unknown; rawModel: unknown; tag: HydrationOwnershipTag; open: false; alive: boolean;
  events: unknown[]; rawEvents: unknown[]; lifecycle: unknown[]; calls: unknown[];
  authoredSample: unknown; rawAuthoredSample: unknown; authoredProps: unknown; rawAuthoredProps: unknown;
  authoredInputProps: unknown; rawAuthoredInputProps: unknown; authoredProvider: unknown; rawAuthoredProvider: unknown;
}
export interface HydrationOwnershipRefs {
  control?: (SelectRef & { nativeElement?: HTMLElement }) | null;
  root?: HTMLElement | null; editor?: HTMLInputElement | HTMLTextAreaElement | null;
  authoredInput?: HTMLInputElement | HTMLTextAreaElement | null; outside?: HTMLButtonElement | null;
}
export interface HydrationOwnershipCapture {
  read?(): HydrationOwnershipOwnerState;
  readRefs?(): HydrationOwnershipRefs;
  update?(action: HydrationOwnershipUpdate): void;
  onCommit?(): void; onAuthoredRef?(node: HTMLInputElement | HTMLTextAreaElement | null): HydrationOwnershipNode | null;
}
export interface HydrationOwnershipRootPoint {
  target: {
    identity: number;
    nodeType: number;
    name: string;
    shadowMode: 'open' | 'closed' | null;
    host: HydrationOwnershipShallowNode | null;
    hostExposesSavedRoot: boolean | null
  };
  physical: Record<'owner' | 'root' | 'editor' | 'outside', HydrationOwnershipNode | null>;
  parsed: Record<'owner' | 'root' | 'editor' | 'outside', HydrationOwnershipNode | null>;
  identity: Record<'ownerSameAsParsed' | 'rootSameAsParsed' | 'editorSameAsParsed' | 'outsideSameAsParsed', boolean>;
  refs: { controlPresent: boolean; rootIdentity: number | null; editorIdentity: number | null; authoredInputIdentity: number | null; outsideIdentity: number | null;
    controlRootMatchesPhysical: boolean; rootMatchesPhysical: boolean; editorMatchesPhysical: boolean;
    rootInsideTarget: boolean; editorInsideTarget: boolean; editorOwnerKey: string | null; methods: Record<string, string> | null };
  focus: { scopeActiveElement: HydrationOwnershipShallowNode | null; editorIsScopeActive: boolean; editorIsDocumentActive: boolean;
    hostIsDocumentActive: boolean | null; ownsScopeFocus: boolean };
  ancestry: HydrationOwnershipShallowNode[]; ownerState: HydrationOwnershipOwnerState | null;
  hydrationCommitted: boolean; retainedOwnedConnections: Array<{
    identity: number;
    connected: boolean
  }>;
}
export interface HydrationOwnershipPoint {
  scenarioId: string; roots: Partial<Record<HydrationOwnershipOwnerKey, HydrationOwnershipRootPoint>>;
  documentActiveElement: HydrationOwnershipShallowNode | null;
  resources: { timing: unknown[]; ownedBrowserCounters: { measured: false; observers: null; mutations: null; frames: null;
    timers: null; ports: null; reason: string } };
}
export interface HydrationOwnershipRoot {
  key: HydrationOwnershipOwnerKey; target: Element | ShadowRoot; host: HTMLElement | null;
  raw: { current?: {
    read(): HydrationOwnershipOwnerState | null;
    readRefs(): HydrationOwnershipRefs;
    update(action: HydrationOwnershipUpdate): void
  };
    hydrationCommitted?: boolean; onCommit?(): void };
  app: Record<string, unknown> | null; committed: HydrationOwnershipPoint | null;
  parsed: {
    owner: Element | null;
    root: Element | null;
    editor: HTMLInputElement | HTMLTextAreaElement | null;
    outside: HTMLButtonElement | null
  };
}
export interface HydrationOwnershipProbe {
  scenario: HydrationOwnershipScenario; roots: Partial<Record<HydrationOwnershipOwnerKey, HydrationOwnershipRoot>>;
  identities: WeakMap<Node, number>; retained: Map<number, { node: Node; ownerKey: string | null }>;
  nextIdentity: number; serverCallerUIDs: Partial<Record<HydrationOwnershipOwnerKey, string>>;
}
export interface HydrationOwnershipNativeAPI {
  ready: true; hydrate(key: HydrationOwnershipOwnerKey): HydrationOwnershipPoint; tick(): Promise<void>;
  update(key: HydrationOwnershipOwnerKey, action: HydrationOwnershipUpdate): void;
  dispose(key: HydrationOwnershipOwnerKey): Promise<HydrationOwnershipPoint>;
}
declare global {
  interface Window { hydrationOwnershipProbe: HydrationOwnershipProbe; hydrationOwnershipNative: HydrationOwnershipNativeAPI }
}
export function initializeHydrationOwnershipProbe(config: { scenario: HydrationOwnershipScenario;
  htmlByOwner: Partial<Record<HydrationOwnershipOwnerKey, string>>; serverCallerUIDs: Partial<Record<HydrationOwnershipOwnerKey, string>> }): void;
export function readHydrationOwnership(): HydrationOwnershipPoint;
export function describeOwnershipNode(node: Node | null): HydrationOwnershipNode | null;
