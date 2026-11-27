export interface SelectSurfaceInputWidthOwnDOM {
  value: string;
  inlineWidth: string;
  inlineWidthProperty: string;
  inlineWidthPriority: string;
  cssomOwnWidth: boolean;
  inlineOrder: string[];
  inlineProperties: Array<{ name: string; value: string; priority: string }>;
  styleAttribute: string | null;
  cssText: string;
  inlineVariable: string;
  computedVariable: string;
  legacyInlineVariable: string;
  computedWidth: string;
  computedFont: string;
  computedFontSize: string;
  computedBoxSizing: string;
  computedMinWidth: string;
  computedMaxWidth: string;
  box: { x: number; y: number; width: number; height: number };
  scrollWidth: number;
  clientWidth: number;
  offsetWidth: number;
  editorAttributes: string[][];
  editorOuterHTML: string;
  rootAttributes: string[][];
  resourceEntries: Array<{ name: string; initiatorType: string }>;
}
export function readInputWidthOwn(): SelectSurfaceInputWidthOwnDOM;
