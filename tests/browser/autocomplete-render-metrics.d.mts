export interface AutocompleteRenderNode {
  identity: number;
  tag: string;
  connected: boolean;
  text: string;
  innerHTML: string;
  outerHTML: string;
  attributes: string[][];
  classes: string[];
  cssText: string;
  inlineStyle: Array<{ name: string; value: string; priority: string }>;
  css: Record<string, string>;
  box: { x: number; y: number; width: number; height: number };
  scrollTop: number; scrollLeft: number; scrollWidth: number; scrollHeight: number;
  clientWidth: number; clientHeight: number; offsetWidth: number; offsetHeight: number;
  value: string | null;
  caret: [number | null, number | null] | null;
}
export interface AutocompleteRenderDOM {
  current: Record<'root' | 'editor' | 'child' | 'popup' | 'list', AutocompleteRenderNode | null>;
  original: Record<'root' | 'editor' | 'child' | 'popup' | 'list', AutocompleteRenderNode | null>;
  sameAsOriginal: Record<'root' | 'editor' | 'child' | 'popup' | 'list', boolean | null>;
  publicRefs: { rootMatches: boolean; childIsEditor: boolean | null; controlIdentity: number | null;
    focusIdentity: number | null; blurIdentity: number | null; scrollToIdentity: number | null; methodOwnKeys: PropertyKey[] };
  rows: Array<{
    node: AutocompleteRenderNode;
    content: AutocompleteRenderNode;
    authored: AutocompleteRenderNode[]
  }>;
  groups: AutocompleteRenderNode[];
  labels: AutocompleteRenderNode[];
  focus: { tag?: string; id?: string; role: string | null; isEditor: boolean; isRoot: boolean };
  popupCount: number;
  resources: Array<{ name: string; initiatorType: string }>;
}
export function readAutocompleteRender(): AutocompleteRenderDOM;
