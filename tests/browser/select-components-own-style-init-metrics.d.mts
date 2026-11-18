import type { SelectComponentsModesDOM } from './select-components-modes-metrics.mjs';
import type { SelectComponentsOwnStyleAction } from './select-components-own-style-init-cases.mjs';
export interface OwnStyleBox { x: number; y: number; width: number; height: number }
export interface OwnStyleProperty { name: string; value: string; priority: string }
export interface OwnStyleNode {
  identity: number; connected: boolean; tag: string; namespaceURI: string;
  attributes: string[][]; html: string; text: string | null; cssText: string;
  inlineProperties: OwnStyleProperty[]; computedProperties: OwnStyleProperty[];
  styleAttribute: string | null; css: Record<string, string>; box: OwnStyleBox; clientRects: OwnStyleBox[];
  metrics: Record<'offsetWidth' | 'clientWidth' | 'scrollWidth' | 'offsetHeight' | 'clientHeight' | 'scrollHeight' | 'scrollLeft' | 'scrollTop', number | null>;
  value: string | null; defaultValue: string | null;
  selection: [number | null, number | null, string | null] | null; focused: boolean;
  childNodes: Array<{ identity: number; type: number; name: string; text: string | null }>;
}
export interface OwnStyleRefObservation {
  tag: string; connected: boolean; cssText: string; inlineProperties: OwnStyleProperty[];
  computedProperties: OwnStyleProperty[]; attributes: string[][]; html: string; styleAttribute: string | null;
  value: string; defaultValue: string; box: OwnStyleBox;
  metrics: Record<'offsetWidth' | 'clientWidth' | 'scrollWidth' | 'offsetHeight' | 'clientHeight' | 'scrollHeight', number>;
}
export type OwnStyleAncestor = Omit<OwnStyleNode, 'identity' | 'html' | 'text' | 'childNodes'> & {
  identity: number | null; childNodes: null;
};
export interface OwnStyleDetails {
  root: OwnStyleNode | null; editor: OwnStyleNode | null; popup: OwnStyleNode | null;
  allRootDescendants: OwnStyleNode[]; allPopupDescendants: OwnStyleNode[]; ancestors: OwnStyleAncestor[];
  hydration: { kind: string; owner: boolean; root: boolean; editor: boolean;
    parsedRoot: OwnStyleNode | null; parsedEditor: OwnStyleNode | null; rootConnected: boolean; editorConnected: boolean } | null;
}
interface PublicRefs { control?: unknown; root?: HTMLElement | null; editor?: HTMLElement | null;
  authoredRoot?: HTMLElement | null; authoredInput?: HTMLElement | null }
interface RawOwnerAPI { read(): unknown; readRefs(): PublicRefs; update?(action: SelectComponentsOwnStyleAction, index?: number): void }
export interface OwnStylePoint { icons: SelectComponentsModesDOM; details: OwnStyleDetails; owner: unknown }
export interface OwnStyleProbe {
  kind: string; parsed: { owner: Element | null; root: Element | null; editor: HTMLInputElement | HTMLTextAreaElement | null };
  commit: OwnStylePoint | null; afterCall?: OwnStylePoint; hydrationCommitted?: boolean; ready?: boolean;
  observe?(): OwnStylePoint; flushUpdate?(action: SelectComponentsOwnStyleAction): void; dispose?(): Promise<void>;
}
declare global {
  interface Window { ownStyleProbe: OwnStyleProbe; raw: { current: RawOwnerAPI; iconsObserver?: unknown } }
}
export function initializeSelectOwnStyleProbe(kind: string): void;
export function readSelectIcons(): SelectComponentsModesDOM;
export function readSelectOwnStyleDetails(): OwnStyleDetails;
export function readSelectOwnStyleAuthoredRef(node: HTMLElement | null): OwnStyleRefObservation | null;
