import type { SelectComponentsHydrationAction } from './fixtures/select-components-hydration-cases.mjs';
export interface ComponentsHydrationNode {
  identity: number; connected: boolean; tag: string; attributes: Array<[string, string]>;
  value: string | null; defaultValue: string | null; textContent: string | null;
  selection: [number | null, number | null, string | null] | null; focused: boolean;
  box: { x: number; y: number; width: number; height: number };
}
export interface ComponentsHydrationOwner {
  model: unknown; open: boolean; slot: string; alive: boolean; revision: number;
  events: unknown[]; methods: unknown[]; lifecycle: Array<{
    event: string;
    tag?: string | null;
    editor?: string
  }>;
}
export interface ComponentsHydrationPoint {
  root: ComponentsHydrationNode | null; editor: ComponentsHydrationNode | null;
  identity: {
    owner: boolean;
    root: boolean;
    editor: boolean;
    rootConnected: boolean;
    editorConnected: boolean
  };
  refs: { control: boolean; rootIdentity: number | null; editorIdentity: number | null;
    rootMatchesDOM: boolean; editorMatchesDOM: boolean };
  owner: ComponentsHydrationOwner | null; popupCount: number;
  parsedRoot: ComponentsHydrationNode | null; parsedEditor: ComponentsHydrationNode | null;
}
export interface ComponentsHydrationAPI {
  read(): ComponentsHydrationOwner | null | undefined;
  readRefs(): { control?: { focus(options?: FocusOptions): void; blur(): void } | null;
    root?: HTMLElement | null; editor?: HTMLElement | null };
  update(action: SelectComponentsHydrationAction | { type: 'alive'; value: boolean }): void;
}
export interface ComponentsHydrationProbe {
  api?: ComponentsHydrationAPI;
  nodeIds: WeakMap<Element, number>; lastNodeId: number;
  parsed: {
    owner: Element | null;
    root: Element | null;
    editor: HTMLInputElement | HTMLTextAreaElement | null
  };
  commitSnapshot?: ComponentsHydrationPoint; afterCall?: ComponentsHydrationPoint;
  observe?(): ComponentsHydrationPoint;
  readNativeRefChecks?(): Array<{ kind: string; tag: string; markerPresent: boolean;
    contextKeys?: string[]; contextHasMarker?: boolean }>;
  readNativeBlurChecks?(): unknown[];
  hydrationCommitted?: boolean; ready?: boolean;
  flushUpdate?(action: SelectComponentsHydrationAction | { type: 'alive'; value: boolean }): void;
  dispose?(): Promise<void>;
}
declare global { interface Window { componentsHydrationProbe: ComponentsHydrationProbe } }
export function initializeSelectComponentsHydrationProbe(): void;
export function readSelectComponentsHydration(): ComponentsHydrationPoint;
