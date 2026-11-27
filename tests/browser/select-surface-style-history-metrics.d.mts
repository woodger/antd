export interface SelectSurfaceStyleHistoryNode {
  tag: string;
  attributes: string[][];
  styleAttribute: string | null;
  inlineCssText: string;
  inlineProperties: Array<{ name: string; value: string; priority: string }>;
  inlineBorder: Record<string, string>;
  computed: Record<string, string>;
  box: { x: number; y: number; width: number; height: number };
  outerHTML: string;
}
export interface SelectSurfaceStyleHistoryDOM {
  root: SelectSurfaceStyleHistoryNode;
  input: SelectSurfaceStyleHistoryNode;
  popup: SelectSurfaceStyleHistoryNode | null;
}
export function readSelectSurfaceStyleHistory(): SelectSurfaceStyleHistoryDOM;
