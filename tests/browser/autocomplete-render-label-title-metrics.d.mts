export interface LabelTitleNode {
  identity: number; connected: boolean; tag: string; attributes: string[][]; text: string;
  html: string; innerHTML: string; title: string | null; classes: string[]; cssText: string;
  inlineProperties: Array<{ name: string; value: string; priority: string }>;
  css: Record<string, string>; box: { x: number; y: number; width: number; height: number };
  value: string | null; caret: [number | null, number | null] | null;
}
export interface LabelTitleDOM {
  current: Record<'root' | 'editor' | 'child' | 'content' | 'popup', LabelTitleNode | null>;
  original: Partial<LabelTitleDOM['current']>;
  sameAsOriginal: Record<keyof LabelTitleDOM['current'], boolean | null>;
  contentChildren: Array<{
    identity: number;
    nodeType: number;
    nodeName: string;
    text: string;
    html: string | null;
    isEditor: boolean
  }>;
  publicRefs: { rootMatches: boolean; childIsEditor: boolean | null };
  focus: { tag?: string; id?: string; isEditor: boolean };
  popupCount: number; resources: Array<{ name: string; initiatorType: string }>;
}
export function readAutocompleteLabelTitle(): LabelTitleDOM;
