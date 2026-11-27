export type SelectSurfaceOmissionNodeName = 'root' | 'editor' | 'popupShell' | 'wrap' | 'footer' | 'footerInput' | 'list';
export interface SelectSurfaceOmissionNode {
  identity: number;
  connected: boolean;
  tag: string;
  text: string | null;
  attributes: string[][];
  classes: string[];
  styleAttribute: string | null;
  cssText: string;
  inlineProperties: Array<{ name: string; value: string; priority: string }>;
  inputWidthVariable: string;
  legacyInputWidthVariable: string;
  css: Record<string, string>;
  box: { x: number; y: number; width: number; height: number };
  scrollWidth: number;
  clientWidth: number;
  offsetWidth: number;
  value: string | null;
  caret: Array<number | null> | null;
  outerHTML: string;
}
export interface SelectSurfaceOmissionDOM {
  ownerAttributes: string[][];
  current: Record<SelectSurfaceOmissionNodeName, SelectSurfaceOmissionNode | null>;
  original: Record<SelectSurfaceOmissionNodeName, SelectSurfaceOmissionNode | null>;
  sameAsOriginal: Record<SelectSurfaceOmissionNodeName, boolean | null>;
  publicRefs: { rootMatches: boolean; footerMatches: boolean; wrapMatches: boolean };
  popupCount: number;
  footerCount: number;
}
export function readSelectSurfaceOmission(): SelectSurfaceOmissionDOM;
