import { treeSelectSuffixLayoutSamples } from './tree-select-suffix-layout-cases.ts';

export type TreeSelectSuffixContainerAction =
  | { type: 'click'; point: 'editor-start' }
  | { type: 'fill'; text: string }
  | { type: 'move-host' | 'ancestor-scroll'; top: number; left: number }
  | { type: 'window-resize'; width: number; height: number };

export const treeSelectSuffixContainerViewport = { width: 1200, height: 1000 };
export const treeSelectSuffixContainerSamples = treeSelectSuffixLayoutSamples.filter(sample =>
  ['input-ltr', 'input-rtl', 'fragment-ltr', 'fragment-rtl'].includes(sample.id));

export const treeSelectSuffixContainerActions: readonly TreeSelectSuffixContainerAction[] = [
  { type: 'click', point: 'editor-start' },
  { type: 'fill', text: 'BetaWWW12345' },
  { type: 'move-host', top: 20, left: 16 },
  { type: 'window-resize', width: 1280, height: 1040 },
  { type: 'fill', text: '' },
  { type: 'ancestor-scroll', top: 32, left: 24 },
  { type: 'fill', text: 'BetaWWW12345' },
  { type: 'ancestor-scroll', top: 48, left: 36 },
  { type: 'move-host', top: 35, left: 27 },
  { type: 'window-resize', width: 1200, height: 1000 }
];
