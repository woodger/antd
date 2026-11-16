export type PopupOverflowDescriptor = 'omitted' | 'undefined' | 'viewport' | 'scroll';
export type PopupOverflowFamily = 'tree-select' | 'select' | 'auto-complete' | 'cascader';
export type PopupOverflowSmokeFamily = 'pagination' | 'calendar' | 'color-picker'
  | 'tooltip' | 'date-picker' | 'mentions' | 'cascader-panel';
export type PopupOverflowLayout = 'edge' | 'clip' | 'document' | 'right';

export interface PopupOverflowAlign {
  points?: readonly string[];
  offset?: readonly (number | string)[];
  targetOffset?: readonly (number | string)[];
  htmlRegion?: 'visible' | 'scroll' | 'visibleFirst';
  dynamicInset?: boolean;
  overflow?: { adjustX?: boolean | number; adjustY?: boolean | number;
    shiftX?: boolean | number; shiftY?: boolean | number };
}

export interface PopupOverflowSettings {
  outer: PopupOverflowDescriptor;
  inner: PopupOverflowDescriptor;
  direction?: 'ltr' | 'rtl';
  placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
  popupAlign?: PopupOverflowAlign;
  builtinPlacements?: Readonly<Record<string, PopupOverflowAlign>>;
}

export interface PopupOverflowSample extends PopupOverflowSettings {
  id: string;
  family: PopupOverflowFamily;
  layout: PopupOverflowLayout;
  globalContainer?: 'body' | 'shadow' | 'clip';
  live?: boolean;
  customTrigger?: boolean;
  wideLabels?: boolean;
  popupMatchSelectWidth?: boolean | number;
}

export interface PopupOverflowSmokeSample extends Omit<PopupOverflowSample, 'family'> {
  family: PopupOverflowSmokeFamily;
  reader: boolean;
}

export type PopupOverflowAction =
  | { type: 'click' | 'outside' }
  | { type: 'open'; value: boolean }
  | { type: 'context'; layer: 'outer' | 'inner'; value: PopupOverflowDescriptor }
  | { type: 'viewport'; width: number; height: number }
  | { type: 'scroll'; target: 'window' | 'clip'; left: number; top: number }
  | { type: 'expand' | 'choose'; value: 'p' | 'a' }
  | { type: 'fill'; text: string }
  | { type: 'caret'; start: number; end: number };

/** Authored public fixture geometry, never used to calculate expected alignment. */
export const popupOverflowGeometry = {
  viewport: { width: 1200, height: 800 },
  document: { width: 2200, height: 2000 },
  edge: { left: 300, top: 740, width: 220 },
  documentRoot: { left: 300, top: 1140, width: 220, initialScrollTop: 400 },
  right: { left: 1000, top: 740, width: 160 },
  clip: { left: 260, top: 600, width: 500, height: 160,
    contentWidth: 1000, contentHeight: 600, rootLeft: 40, rootTop: 120, rootWidth: 220 }
} as const;

function sample(
  family: PopupOverflowFamily, suffix: string,
  settings: Partial<Omit<PopupOverflowSample, 'id' | 'family'>> = {}
): PopupOverflowSample {
  return { id: `${family}-${suffix}`, family, outer: 'omitted', inner: 'omitted', layout: 'edge', ...settings };
}

const families: readonly PopupOverflowFamily[] = ['tree-select', 'select', 'auto-complete', 'cascader'];
const selectedMap: Readonly<Record<string, PopupOverflowAlign>> = {
  bottomLeft: { points: ['tl', 'bl'], offset: [0, 4], htmlRegion: 'visible', dynamicInset: true,
    overflow: { adjustX: true, adjustY: true, shiftY: true } }
};

export const popupOverflowSamples: readonly PopupOverflowSample[] = [
  ...families.flatMap(family => [
    sample(family, 'omitted'),
    sample(family, 'own-undefined', { inner: 'undefined' }),
    sample(family, 'viewport', { inner: 'viewport' }),
    sample(family, 'scroll', { inner: 'scroll' }),
    sample(family, 'nested-undefined-inherits', { outer: 'scroll', inner: 'undefined' }),
    sample(family, 'nested-viewport-resets', { outer: 'scroll', inner: 'viewport' }),
    sample(family, 'global-body', { inner: 'scroll', globalContainer: 'body' }),
    sample(family, 'global-shadow', { inner: 'scroll', globalContainer: 'shadow' }),
    sample(family, 'clip-viewport', { inner: 'viewport', globalContainer: 'clip', layout: 'clip' }),
    sample(family, 'clip-scroll', { inner: 'scroll', globalContainer: 'clip', layout: 'clip' }),
    sample(family, 'live-cache', { inner: 'viewport', live: true })
  ]),
  sample('select', 'document-viewport', { inner: 'viewport', layout: 'document' }),
  sample('select', 'document-scroll', { inner: 'scroll', layout: 'document' }),
  sample('tree-select', 'right-rtl-viewport', { inner: 'viewport', layout: 'right', direction: 'rtl',
    popupMatchSelectWidth: false, wideLabels: true }),
  sample('tree-select', 'right-rtl-scroll', { inner: 'scroll', layout: 'right', direction: 'rtl',
    popupMatchSelectWidth: false, wideLabels: true }),
  sample('cascader', 'right-rtl-viewport', { inner: 'viewport', layout: 'right', direction: 'rtl' }),
  sample('cascader', 'right-rtl-scroll', { inner: 'scroll', layout: 'right', direction: 'rtl' }),
  sample('tree-select', 'explicit-visible-map', { inner: 'scroll', builtinPlacements: selectedMap }),
  sample('tree-select', 'empty-map', { inner: 'scroll', builtinPlacements: {} }),
  sample('tree-select', 'align-scroll-over-viewport', { inner: 'viewport',
    popupAlign: { htmlRegion: 'scroll', overflow: { adjustY: true } } }),
  sample('tree-select', 'align-visible-over-scroll', { inner: 'scroll',
    popupAlign: { htmlRegion: 'visible', overflow: { adjustY: true } } }),
  sample('tree-select', 'align-replaces-overflow', { inner: 'scroll',
    popupAlign: { overflow: { adjustY: true } } }),
  sample('cascader', 'custom-trigger-viewport', { inner: 'viewport', customTrigger: true }),
  sample('cascader', 'custom-trigger-scroll', { inner: 'scroll', customTrigger: true }),
  sample('auto-complete', 'numeric-wide-viewport', { inner: 'viewport', popupMatchSelectWidth: 1600 }),
  sample('auto-complete', 'numeric-wide-scroll', { inner: 'scroll', popupMatchSelectWidth: 1600 }),
  sample('cascader', 'numeric-wide-viewport', { inner: 'viewport', popupMatchSelectWidth: 1600 }),
  sample('cascader', 'numeric-wide-scroll', { inner: 'scroll', popupMatchSelectWidth: 1600 })
];

export const popupOverflowSmokeSamples: readonly PopupOverflowSmokeSample[] =
  (['pagination', 'calendar', 'color-picker', 'tooltip', 'date-picker', 'mentions', 'cascader-panel'] as const)
    .flatMap(family => (['viewport', 'scroll'] as const).map(inner => ({
      id: `${family}-${inner}`, family, outer: 'omitted' as const, inner, layout: 'edge' as const,
      reader: ['pagination', 'calendar', 'color-picker'].includes(family)
    })));

export function popupOverflowData(sample: Pick<PopupOverflowSample, 'wideLabels'>) {
  const alpha = sample.wideLabels ? 'Alpha with a naturally wider popup label' : 'Alpha';
  const flat = [{ value: 'a', label: alpha }, { value: 'b', label: 'Beta' }];
  return {
    flat,
    tree: flat.map(option => ({ value: option.value, title: option.label })),
    cascader: [{ value: 'p', label: 'Parent', children: flat }, { value: 'c', label: 'Gamma' }]
  };
}

export function popupOverflowActions(sample: PopupOverflowSample | PopupOverflowSmokeSample): readonly PopupOverflowAction[] {
  if ('reader' in sample) {
    if (sample.family === 'cascader-panel') return [
      { type: 'context', layer: 'inner', value: sample.inner === 'scroll' ? 'viewport' : 'scroll' },
      { type: 'viewport', width: 1200, height: 820 }
    ];
    return [{ type: 'click' }, { type: 'viewport', width: 1200, height: 820 }, { type: 'outside' }];
  }
  if (sample.live) return [
    { type: 'click' }, { type: 'fill', text: 'Kept query' }, { type: 'caret', start: 1, end: 5 },
    { type: 'context', layer: 'inner', value: 'scroll' },
    ...(sample.family === 'cascader' ? [{ type: 'viewport' as const, width: 200, height: 820 }] : []),
    { type: 'viewport', width: 1200, height: 820 },
    { type: 'context', layer: 'inner', value: 'viewport' },
    { type: 'scroll', target: 'window', left: 0, top: 32 },
    { type: 'open', value: false }, { type: 'open', value: true }
  ];
  if (sample.family === 'cascader' && (sample.layout === 'right' || sample.customTrigger))
    return [{ type: 'click' }, { type: 'expand', value: 'p' },
      { type: 'viewport', width: 1200, height: 820 }, { type: 'outside' }];
  if (sample.layout === 'document') return [{ type: 'click' },
    { type: 'scroll', target: 'window', left: 0, top: 432 }, { type: 'outside' }];
  if (sample.layout === 'clip') return [{ type: 'click' },
    { type: 'scroll', target: 'clip', left: 0, top: 16 }, { type: 'outside' }];
  return [{ type: 'click' }, { type: 'viewport', width: 1200, height: 820 }, { type: 'outside' }];
}
