export interface SelectIconNode {
  identity: number; connected: boolean; tag: string; text: string; attributes: string[][]; classes: string[];
  html: string; styleAttribute: string | null; cssText: string;
  inlineProperties: Array<{ name: string; value: string; priority: string }>;
  css: Record<string, string>; box: { x: number; y: number; width: number; height: number } | null;
  geometryBoundary: string; value: string | null; caret: [number | null, number | null] | null; focused: boolean;
}
export interface SelectIconsDOM {
  current: Record<'root' | 'editor' | 'suffix' | 'clear' | 'popup' | 'list', SelectIconNode | null>;
  original: Partial<SelectIconsDOM['current']>; sameAsOriginal: Record<keyof SelectIconsDOM['current'], boolean | null>;
  nodes: SelectIconNode[]; svg: SelectIconNode[];
  publicRefs: { rootMatches: boolean; authoredRoot: SelectIconNode | null; authoredInput: SelectIconNode | null; methods: Record<string, string> | null };
  resources: Array<{ name: string; initiatorType: string }>; popupCount: number;
  active: { tag?: string; id?: string; attributes: string[][] };
}
export function readSelectIcons(): SelectIconsDOM;
