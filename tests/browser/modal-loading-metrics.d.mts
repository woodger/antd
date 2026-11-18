import type { ModalLoadingSample, ModalLoadingUpdate } from './modal-loading-cases.mjs';
export interface ModalLoadingNode {
  identity: number; nodeType: number; name: string; connected: boolean;
  attributes: Array<[string, string]> | null;
  inlineStyle: Array<[string, string, string]> | null;
  cssText: string | null; computed: Array<[string, string]> | null;
  box: { x: number; y: number; width: number; height: number } | null;
  client: [number, number, number, number] | null;
  text: string | null; html: string | null;
  children: Array<{ identity: number; nodeType: number; name: string; text: string | null }> | null;
  value: string | null; defaultValue: string | null;
  selection: [number | null, number | null, 'forward' | 'backward' | 'none' | null] | null;
  focused: boolean;
}
export type ModalLoadingRefSlot = 'owner' | 'body' | 'editor' | 'footer';
export type ModalLoadingRefs = Record<ModalLoadingRefSlot, HTMLElement | null>;
export interface ModalLoadingLifecycle {
  slot: ModalLoadingRefSlot; event: 'attach' | 'detach' | 'mount' | 'unmount';
  observation?: ModalLoadingNode | null;
}
export type ModalLoadingActivity = { kind: 'body-render' | 'footer-render' };
export interface ModalLoadingOwner {
  alive: boolean; open: boolean; loading: boolean; footer: ModalLoadingSample['footer']; prefixCls: string;
  events: unknown[]; rawEvents: unknown[]; lifecycle: ModalLoadingLifecycle[]; activity: ModalLoadingActivity[];
  props: unknown; rawProps: unknown;
}
export interface ModalLoadingCapture {
  read?: () => ModalLoadingOwner;
  readRefs?: () => ModalLoadingRefs;
  update?: (action: ModalLoadingUpdate) => void;
  observeRef?: (node: HTMLElement | null) => ModalLoadingNode | null;
}
export interface ModalLoadingProbe {
  describe: (node: Node | null, html?: boolean) => ModalLoadingNode | null;
  retained: Map<number, Node>;
  initial: Map<string, Node>;
}
export type ModalLoadingRole = ModalLoadingRefSlot | 'dialog' | 'header' | 'title' | 'close' | 'authoredBody'
  | 'authoredFooter' | 'skeleton' | 'skeletonTitle' | 'skeletonParagraph';
export interface ModalLoadingResourceCounters {
  measured: false; observers: null; mutations: null; frames: null; timers: null; ports: null;
}
export interface ModalLoadingPoint {
  owner: ModalLoadingOwner;
  nodes: Record<Exclude<ModalLoadingRole, 'owner'> | 'owner', ModalLoadingNode | null>;
  initialIdentity: Record<ModalLoadingRole, boolean | null>;
  skeletonRows: ModalLoadingNode[]; allElements: ModalLoadingNode[];
  activeElement: ModalLoadingNode | null; browserOwnedResourceCounters: ModalLoadingResourceCounters;
}
export interface ModalLoadingCleanup {
  owner: ModalLoadingOwner; refs: Record<ModalLoadingRefSlot, boolean>;
  retained: Array<{ identity: number; nodeType: number; name: string; connected: boolean }>;
  ownerCount: number; dialogCount: number; activeElement: ModalLoadingNode | null;
  browserOwnedResourceCounters: ModalLoadingResourceCounters; resourceTiming: unknown[];
}
export function initializeModalLoadingProbe(): void;
export function readModalLoading(): ModalLoadingPoint;
export function readModalLoadingCleanup(): ModalLoadingCleanup;
declare global {
  interface Window {
    modalLoadingNative: {
      ready: boolean;
      read: () => ModalLoadingOwner;
      readRefs: () => ModalLoadingRefs;
      update: (action: ModalLoadingUpdate) => void;
      dispose: () => Promise<void>;
    };
  }
}
