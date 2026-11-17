export interface SelectSurfaceContextNode {
  tag: string;
  text: string | null;
  attributes: string[][];
  classes: string[];
  css: Record<string, string>;
  box: { x: number; y: number; width: number; height: number };
  outerHTML: string;
  value: string | null;
  disabled: boolean | null;
}
export interface SelectSurfaceContextDOM {
  parent: SelectSurfaceContextNode;
  editor: SelectSurfaceContextNode;
  controls: Array<{ slot: string; nodes: SelectSurfaceContextNode[] }>;
  status: Array<{ side: string; value: unknown; raw: SelectSurfaceContextNode }>;
  popup: SelectSurfaceContextNode[];
  active: string | null;
}
export function readSelectSurfaceContext(): SelectSurfaceContextDOM;
