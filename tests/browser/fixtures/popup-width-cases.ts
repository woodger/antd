export type PopupWidthDescriptor = 'omitted' | 'undefined' | 'true' | 'false' | 'zero'
  | 'negative-zero' | 'small' | 'number' | 'wide' | 'negative' | 'nan' | 'infinity' | 'negative-infinity';
export type PopupWidthFamily = 'select' | 'auto-complete' | 'tree-select';
export type PopupWidthNestedFamily = 'pagination' | 'calendar' | 'color-picker' | 'cascader';
export type PopupWidthLayer = 'outer' | 'inner' | 'local';

export interface PopupWidthSample {
  id: string;
  family: PopupWidthFamily;
  outer: PopupWidthDescriptor;
  inner: PopupWidthDescriptor;
  local: PopupWidthDescriptor;
  layout: 'plain' | 'rtl' | 'scaled-shadow';
  count?: 40;
  live?: 'global' | 'local';
  history?: true;
}

export interface PopupWidthNestedSample extends Omit<PopupWidthSample, 'family'> {
  family: PopupWidthNestedFamily;
  container?: 'default' | 'undefined' | 'body';
}
export type PopupWidthAnySample = PopupWidthSample | PopupWidthNestedSample;
export type PopupWidthAction =
  | { type: 'click'; target?: 'year' | 'month' | 'format' }
  | { type: 'outside' | 'expand' }
  | { type: 'width'; layer: PopupWidthLayer; value: PopupWidthDescriptor }
  | { type: 'anchor'; width: number }
  | { type: 'open' | 'outer'; value: boolean }
  | { type: 'fill'; text: string }
  | { type: 'caret'; start: number; end: number }
  | { type: 'wheel'; delta: number };

export const popupWidthGeometry = {
  viewport: { width: 1200, height: 900 },
  document: { width: 2200, height: 1800 },
  plain: { left: 300, top: 200, width: 220 },
  rtl: { left: 1000, top: 200, width: 160 },
  surface: { left: 240, top: 160, width: 480, height: 300, scale: 1.25, rootLeft: 40, rootTop: 40 }
} as const;

export function popupWidthValue(descriptor: PopupWidthDescriptor): boolean | number | undefined {
  switch (descriptor) {
    case 'omitted': case 'undefined': return undefined;
    case 'true': return true;
    case 'false': return false;
    case 'zero': return 0;
    case 'negative-zero': return -0;
    case 'small': return 80;
    case 'number': return 360;
    case 'wide': return 1600;
    case 'negative': return -1;
    case 'nan': return NaN;
    case 'infinity': return Infinity;
    case 'negative-infinity': return -Infinity;
  }
}

export function popupWidthProps(descriptor: PopupWidthDescriptor): { popupMatchSelectWidth?: boolean | number } {
  return descriptor === 'omitted' ? {} : { popupMatchSelectWidth: popupWidthValue(descriptor) };
}

/** Receipts inspect the actual passed object, including signed zero, before recording its JSON-safe scalar. */
export function popupWidthReceipt(descriptor: PopupWidthDescriptor, props: { popupMatchSelectWidth?: unknown }) {
  const value = props.popupMatchSelectWidth;
  return { descriptor, keyPresent: Object.hasOwn(props, 'popupMatchSelectWidth'), type: typeof value,
    scalar: typeof value === 'number' ? Number.isNaN(value) ? 'NaN'
      : Object.is(value, -0) ? '-0' : String(value) : String(value),
    sameOriginal: Object.is(value, popupWidthValue(descriptor)) };
}

export function popupWidthData(sample: Pick<PopupWidthSample, 'count'>) {
  const wide = 'Alpha with a naturally wider popup label ' + 'w'.repeat(48);
  const flat = sample.count === 40
    ? Array.from({ length: 40 }, (_, index) => ({ value: `item-${index}`,
      label: index === 0 ? wide : `Item ${String(index + 1).padStart(2, '0')}` }))
    : [{ value: 'a', label: wide }, { value: 'b', label: 'Beta' }];
  return { flat, page: [{ value: 10, label: '10 / page' }, { value: 20, label: wide }, { value: 50, label: '50 / page' }],
    tree: flat.map(item => ({ value: item.value, title: item.label })),
    cascader: [{ value: 'p', label: 'Parent', children: flat }, { value: 'c', label: 'Gamma' }] };
}

function sample(family: PopupWidthFamily, suffix: string, settings: Partial<PopupWidthSample> = {}): PopupWidthSample {
  return { id: `${family}-${suffix}`, family, outer: 'omitted', inner: 'omitted', local: 'omitted',
    layout: 'plain', ...settings };
}
const readers: readonly PopupWidthFamily[] = ['select', 'auto-complete', 'tree-select'];
const numbers: readonly PopupWidthDescriptor[] = ['zero', 'negative-zero', 'small', 'number', 'wide', 'negative'];
const invalid: readonly PopupWidthDescriptor[] = ['nan', 'infinity', 'negative-infinity'];

export const popupWidthSamples: readonly PopupWidthSample[] = readers.flatMap(family => [
  sample(family, 'omitted'),
  sample(family, 'own-undefined', { inner: 'undefined', local: 'undefined' }),
  sample(family, 'global-true', { inner: 'true' }),
  sample(family, 'global-false', { inner: 'false' }),
  sample(family, 'nested-undefined', { outer: 'false', inner: 'undefined', local: 'undefined' }),
  sample(family, 'nested-reset-true', { outer: 'false', inner: 'true' }),
  sample(family, 'nested-reset-false', { outer: 'true', inner: 'false' }),
  sample(family, 'local-true-over-false', { inner: 'false', local: 'true' }),
  sample(family, 'local-false-over-true', { inner: 'true', local: 'false' }),
  ...numbers.map(local => sample(family, `local-${local}`, { inner: 'false', local })),
  sample(family, 'global-zero', { inner: 'zero' }),
  sample(family, 'global-number', { inner: 'number' }),
  ...invalid.map(local => sample(family, `local-${local}`, { local })),
  sample(family, 'live-global', { inner: 'true', live: 'global' }),
  sample(family, 'live-local', { inner: 'false', local: 'number', live: 'local' }),
  sample(family, 'rtl-natural', { inner: 'false', layout: 'rtl' }),
  sample(family, 'scaled-shadow', { inner: 'true', layout: 'scaled-shadow' }),
  sample(family, 'many-options', { inner: 'true', count: 40 })
]);

export const popupWidthHistorySamples: readonly PopupWidthSample[] = readers.map(family =>
  sample(family, 'history-numeric-close', { inner: 'false', local: 'number', history: true }));

export const popupWidthNestedSamples: readonly PopupWidthNestedSample[] = [
  { id: 'pagination-default-local-false', family: 'pagination', outer: 'omitted', inner: 'true', local: 'omitted', layout: 'plain' },
  { id: 'pagination-default-over-global-number', family: 'pagination', outer: 'omitted', inner: 'number', local: 'omitted', layout: 'plain' },
  { id: 'pagination-local-undefined', family: 'pagination', outer: 'omitted', inner: 'number', local: 'undefined', layout: 'plain' },
  { id: 'pagination-local-true', family: 'pagination', outer: 'omitted', inner: 'false', local: 'true', layout: 'plain' },
  { id: 'pagination-local-number-body', family: 'pagination', outer: 'omitted', inner: 'false', local: 'number', container: 'body', layout: 'plain' },
  { id: 'pagination-container-undefined', family: 'pagination', outer: 'omitted', inner: 'false', local: 'omitted', container: 'undefined', layout: 'plain' },
  { id: 'calendar-global-true', family: 'calendar', outer: 'omitted', inner: 'true', local: 'omitted', layout: 'plain' },
  { id: 'calendar-global-false', family: 'calendar', outer: 'omitted', inner: 'false', local: 'omitted', layout: 'plain' },
  { id: 'color-picker-global-true', family: 'color-picker', outer: 'omitted', inner: 'true', local: 'omitted', layout: 'plain' },
  { id: 'color-picker-global-false', family: 'color-picker', outer: 'omitted', inner: 'false', local: 'omitted', layout: 'plain' },
  { id: 'cascader-global-true', family: 'cascader', outer: 'omitted', inner: 'true', local: 'omitted', layout: 'plain' },
  { id: 'cascader-global-false', family: 'cascader', outer: 'omitted', inner: 'false', local: 'omitted', layout: 'plain' },
  { id: 'cascader-local-true', family: 'cascader', outer: 'omitted', inner: 'false', local: 'true', layout: 'plain' },
  { id: 'cascader-local-number', family: 'cascader', outer: 'omitted', inner: 'true', local: 'number', layout: 'plain' }
];

export function popupWidthActions(sample: PopupWidthAnySample): readonly PopupWidthAction[] {
  if (sample.history) return [{ type: 'width', layer: 'local', value: 'nan' }, { type: 'click' },
    { type: 'width', layer: 'local', value: 'number' },
    { type: 'width', layer: 'local', value: 'nan' },
    { type: 'width', layer: 'local', value: 'negative' },
    { type: 'width', layer: 'local', value: 'infinity' },
    { type: 'open', value: false }, { type: 'open', value: true },
    { type: 'open', value: false }, { type: 'width', layer: 'local', value: 'number' },
    { type: 'width', layer: 'local', value: 'false' }, { type: 'width', layer: 'local', value: 'nan' },
    { type: 'open', value: true }, { type: 'open', value: false },
    { type: 'width', layer: 'local', value: 'number' }, { type: 'width', layer: 'local', value: 'nan' },
    { type: 'open', value: true }, { type: 'width', layer: 'local', value: 'true' },
    { type: 'anchor', width: 120 }, { type: 'open', value: false },
    { type: 'width', layer: 'local', value: 'nan' }, { type: 'anchor', width: 80 },
    { type: 'open', value: true },
    { type: 'open', value: false }, { type: 'open', value: true }];
  if (sample.live === 'global') return [{ type: 'click' }, { type: 'fill', text: 'Kept query' },
    { type: 'caret', start: 1, end: 5 }, { type: 'width', layer: 'inner', value: 'false' },
    { type: 'width', layer: 'inner', value: 'number' }, { type: 'width', layer: 'inner', value: 'undefined' },
    { type: 'width', layer: 'inner', value: 'true' }, { type: 'anchor', width: 180 },
    { type: 'open', value: false }, { type: 'open', value: true }];
  if (sample.live === 'local') return [{ type: 'click' }, { type: 'fill', text: 'Kept query' },
    { type: 'caret', start: 1, end: 5 }, { type: 'width', layer: 'local', value: 'nan' },
    { type: 'width', layer: 'local', value: 'negative' }, { type: 'width', layer: 'local', value: 'infinity' },
    { type: 'width', layer: 'local', value: 'negative-infinity' }, { type: 'width', layer: 'local', value: 'false' },
    { type: 'width', layer: 'local', value: 'zero' }, { type: 'width', layer: 'local', value: 'negative-zero' },
    { type: 'width', layer: 'local', value: 'undefined' }, { type: 'width', layer: 'local', value: 'true' },
    { type: 'width', layer: 'local', value: 'nan' }, { type: 'anchor', width: 180 },
    { type: 'open', value: false }, { type: 'open', value: true }];
  if (sample.count === 40) return [{ type: 'click' }, { type: 'wheel', delta: 640 },
    { type: 'width', layer: 'inner', value: 'false' }, { type: 'wheel', delta: 640 },
    { type: 'width', layer: 'inner', value: 'zero' }, { type: 'outside' }];
  if (sample.family === 'calendar') return [{ type: 'click', target: 'year' }, { type: 'outside' },
    { type: 'click', target: 'month' }, { type: 'width', layer: 'inner', value: sample.inner === 'true' ? 'false' : 'true' },
    { type: 'outside' }];
  if (sample.family === 'color-picker') return [{ type: 'outer', value: true },
    { type: 'click', target: 'format' },
    { type: 'width', layer: 'inner', value: sample.inner === 'true' ? 'false' : 'true' }, { type: 'outside' }];
  if (sample.family === 'cascader') return [{ type: 'click' }, { type: 'expand' }, { type: 'outside' }];
  return [{ type: 'click' }, { type: 'anchor', width: 260 }, { type: 'outside' }];
}
