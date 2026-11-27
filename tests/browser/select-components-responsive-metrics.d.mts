import type { SelectComponentsModesDOM, SelectComponentsModesNode } from './select-components-modes-metrics.mjs';

export type SelectComponentsResponsiveDOM = SelectComponentsModesDOM;
export type SelectComponentsResponsiveNode = SelectComponentsModesNode;
export interface SelectComponentsResponsiveBox { x: number; y: number; width: number; height: number }
export interface SelectComponentsResponsiveOverflowNode {
  identity: number | null;
  tag: string;
  connected: boolean;
  text: string | null;
  attributes: string[][];
  html: string;
  styleAttribute: string | null;
  cssText: string;
  inlineProperties: Array<{ name: string; value: string; priority: string }>;
  css: Record<string, string>;
  box: SelectComponentsResponsiveBox;
  clientRects: SelectComponentsResponsiveBox[];
  metrics: Record<'offsetWidth' | 'clientWidth' | 'scrollWidth' | 'offsetHeight' | 'clientHeight' | 'scrollHeight' | 'scrollLeft' | 'scrollTop', number>;
  value: string | null;
  caret: [number | null, number | null] | null;
  focused: boolean;
  childNodes: Array<{ type: number; tag: string | null; text: string | null }>;
}
export type SelectComponentsResponsiveAncestor = Pick<SelectComponentsResponsiveOverflowNode,
  'identity' | 'tag' | 'attributes' | 'styleAttribute' | 'cssText' | 'inlineProperties' | 'css' | 'box' | 'metrics'>;
export interface SelectComponentsResponsiveOverflow {
  root: SelectComponentsResponsiveOverflowNode | null;
  content: SelectComponentsResponsiveOverflowNode | null;
  editor: SelectComponentsResponsiveOverflowNode | null;
  suffix: SelectComponentsResponsiveOverflowNode | null;
  adornment: SelectComponentsResponsiveOverflowNode | null;
  contentChildren: SelectComponentsResponsiveOverflowNode[];
  suffixChildren: SelectComponentsResponsiveOverflowNode[];
  rests: SelectComponentsResponsiveOverflowNode[];
  ancestors: SelectComponentsResponsiveAncestor[];
  suffixContainsEditor: boolean;
  editorIsDirectSuffixChild: boolean;
  rootHasSamePublicEditor: boolean;
  allRootDescendants: SelectComponentsResponsiveOverflowNode[];
}
export function readSelectIcons(): SelectComponentsResponsiveDOM;
export function readSelectResponsiveOverflow(): SelectComponentsResponsiveOverflow;
