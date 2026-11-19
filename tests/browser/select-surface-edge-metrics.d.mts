export interface SelectSurfaceEdgeBox { x: number; y: number; width: number; height: number }
export interface SelectSurfaceEdgePaintNode {
  css: Record<string, string>;
  box: SelectSurfaceEdgeBox;
  opacity: number;
  effectiveVisible: boolean;
  suppressedByDisplay: boolean;
  textFillAlpha: number | null;
  effectiveTextVisible: boolean | null;
}
export interface SelectSurfaceEdgeMeasuredNode {
  tag: string;
  attributes: string[][];
  css: Record<string, string>;
  box: SelectSurfaceEdgeBox;
  outerHTML: string;
}
export interface SelectSurfaceEdgePaint {
  view: {
    input: SelectSurfaceEdgePaintNode & { value: string };
    placeholders: Array<SelectSurfaceEdgePaintNode & { text: string | null }>;
    passivePanels: Array<SelectSurfaceEdgeBox & { text: string | null }>;
  };
  raw: {
    input: SelectSurfaceEdgeMeasuredNode & { paintAncestors: SelectSurfaceEdgeMeasuredNode[] };
    placeholders: Array<SelectSurfaceEdgeMeasuredNode & { paintAncestors: SelectSurfaceEdgeMeasuredNode[] }>;
    rules: Array<{
      sheetIndex: number;
      context: string[];
      selector: string;
      cssText: string;
      matched: string[]
    }>;
    cssErrors: string[];
  };
}
export function readSelectSurfaceEdgePaint(): SelectSurfaceEdgePaint;
