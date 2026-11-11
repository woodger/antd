export type TreeSelectSuffixLayoutKind = 'input' | 'textarea' | 'wrapped-dom-ref' | 'composite-ref' | 'fragment';
export type TreeSelectSuffixLayoutPoint = 'editor-start' | 'editor-bottom' | 'root-edge';
export type TreeSelectSuffixLayoutAction =
  | { type: 'resize' | 'prefix-resize' | 'rest-resize'; width: number }
  | { type: 'value'; count: number }
  | { type: 'focus' | 'outside' }
  | { type: 'fill'; text: string }
  | { type: 'caret'; start: number; end: number }
  | { type: 'click'; point: TreeSelectSuffixLayoutPoint };
export interface TreeSelectSuffixLayoutSample {
  id: string;
  kind: TreeSelectSuffixLayoutKind;
  direction: 'ltr' | 'rtl';
  size?: 'small' | 'large';
  /** Desired measured content width; the client applies its actual root chrome. */
  width: number;
  prefixWidth: number;
  restWidth: number;
  count: number;
  customTags?: false;
}
const kinds: readonly TreeSelectSuffixLayoutKind[] = ['input', 'textarea', 'wrapped-dom-ref', 'composite-ref', 'fragment'];
export const treeSelectSuffixLayoutSamples: readonly TreeSelectSuffixLayoutSample[] = [
  ...kinds.flatMap(kind => (['ltr', 'rtl'] as const).map(direction => ({
    id: `${kind}-${direction}`, kind, direction, width: 200, prefixWidth: 64, restWidth: 64, count: 4
  }))),
  { id: 'fragment-small', kind: 'fragment', direction: 'ltr', size: 'small', width: 200, prefixWidth: 64, restWidth: 64, count: 4 },
  { id: 'fragment-large', kind: 'fragment', direction: 'ltr', size: 'large', width: 200, prefixWidth: 64, restWidth: 64, count: 4 },
  { id: 'default-tags-ltr', kind: 'input', direction: 'ltr', customTags: false, width: 200, prefixWidth: 64, restWidth: 64, count: 4 },
  { id: 'default-tags-rtl', kind: 'wrapped-dom-ref', direction: 'rtl', customTags: false, width: 200, prefixWidth: 64, restWidth: 64, count: 4 },
  { id: 'fragment-boundary', kind: 'fragment', direction: 'rtl', width: 9, prefixWidth: 64, restWidth: 64, count: 4 }
];
export function treeSelectSuffixLayoutActions(sample: TreeSelectSuffixLayoutSample): readonly TreeSelectSuffixLayoutAction[] {
  return [
    { type: 'click', point: 'editor-start' },
    { type: 'fill', text: 'BetaWWW12345' },
    { type: 'caret', start: 1, end: 4 },
    { type: 'click', point: 'editor-bottom' },
    { type: 'resize', width: 160 },
    { type: 'fill', text: '' },
    { type: 'resize', width: 520 },
    { type: 'rest-resize', width: 160 },
    { type: 'resize', width: 200 },
    { type: 'rest-resize', width: 64 },
    ...(sample.kind === 'fragment' || sample.kind === 'wrapped-dom-ref' || sample.kind === 'composite-ref'
      ? [{ type: 'prefix-resize' as const, width: 96 }] : []),
    ...(sample.id === 'fragment-boundary' ? [
      { type: 'resize' as const, width: 8 }, { type: 'resize' as const, width: 10 }, { type: 'resize' as const, width: 200 }
    ] : []),
    { type: 'value', count: 0 },
    { type: 'value', count: 2 },
    { type: 'click', point: 'root-edge' },
    { type: 'outside' }
  ];
}
