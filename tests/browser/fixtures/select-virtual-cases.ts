export type SelectVirtualFamily = 'select' | 'auto-complete';
export type SelectVirtualBoolean = 'omitted' | 'undefined' | 'true' | 'false';
export type SelectVirtualWidth = SelectVirtualBoolean | 'zero';
export type SelectVirtualSize = 'omitted' | 'undefined' | 'small' | 'zero';
export type SelectVirtualScrollbar = SelectVirtualBoolean | 'optional';
export type SelectVirtualAlign = 'top' | 'bottom' | 'auto';
export type SelectVirtualOffset = number | 'get-size';

export interface SelectVirtualSettings {
  outer: SelectVirtualBoolean;
  inner: SelectVirtualBoolean;
  virtual: SelectVirtualBoolean;
  width: SelectVirtualWidth;
  height: SelectVirtualSize;
  itemHeight: SelectVirtualSize;
  scrollbar: SelectVirtualScrollbar;
  count: number;
}
export interface SelectVirtualSample extends SelectVirtualSettings {
  id: string;
  family: SelectVirtualFamily;
  scenario: 'basic' | 'live' | 'refs' | 'closed' | 'selected' | 'search' | 'focus' | 'scrollbar' | 'mode';
  layout: 'plain' | 'rtl' | 'scaled-shadow';
  groups?: true;
  variable?: true;
  mode?: 'multiple' | 'tags';
  initialValue?: string | string[];
}
export type SelectVirtualScrollTarget =
  | { kind: 'number'; value: number }
  | { kind: 'index'; index: number; align?: SelectVirtualAlign; offset?: SelectVirtualOffset }
  | { kind: 'key'; key: string | number; align?: SelectVirtualAlign; offset?: SelectVirtualOffset }
  | { kind: 'position'; top?: number; left?: number }
  | { kind: 'null' | 'undefined' };
export type SelectVirtualAction =
  | { type: 'click' | 'outside' }
  | { type: 'props'; set: Partial<SelectVirtualSettings> }
  | { type: 'open'; value: boolean }
  | { type: 'value'; value: string | string[] | null }
  | { type: 'query'; text: string }
  | { type: 'fill'; text: string }
  | { type: 'caret'; start: number; end: number }
  | { type: 'key'; key: 'ArrowUp' | 'ArrowDown' | 'Enter' | 'Escape' }
  | { type: 'hover'; text: string }
  | { type: 'wheel'; delta: number }
  | { type: 'scroll'; top: number }
  | { type: 'drag'; to: 'middle' | 'end' }
  | { type: 'wait'; time: number }
  | { type: 'ref'; method: 'scrollTo'; target: SelectVirtualScrollTarget }
  | { type: 'ref'; method: 'focus'; options?: { preventScroll: boolean } }
  | { type: 'ref'; method: 'blur' };

export const selectVirtualGeometry = {
  viewport: { width: 1200, height: 900 }, document: { width: 2200, height: 1800 },
  plain: { left: 300, top: 200, width: 220 }, rtl: { left: 940, top: 200, width: 220 },
  surface: { left: 240, top: 160, width: 480, height: 300, scale: 1.25, rootLeft: 40, rootTop: 40 }
} as const;

export const selectVirtualDefaults: SelectVirtualSettings = {
  outer: 'omitted', inner: 'omitted', virtual: 'omitted', width: 'omitted',
  height: 'omitted', itemHeight: 'omitted', scrollbar: 'omitted', count: 100
};
export function selectVirtualBooleanValue(value: SelectVirtualBoolean) {
  return value === 'true' ? true : value === 'false' ? false : undefined;
}
export function selectVirtualProviderProps(value: SelectVirtualBoolean): { virtual?: boolean } {
  return value === 'omitted' ? {} : { virtual: selectVirtualBooleanValue(value) };
}
export function selectVirtualProps(settings: SelectVirtualSettings) {
  const props: { virtual?: boolean; popupMatchSelectWidth?: boolean | number;
    listHeight?: number; listItemHeight?: number; showScrollBar?: boolean | 'optional' } = {};
  if (settings.virtual !== 'omitted') props.virtual = selectVirtualBooleanValue(settings.virtual);
  if (settings.width !== 'omitted') props.popupMatchSelectWidth = settings.width === 'zero' ? 0
    : selectVirtualBooleanValue(settings.width);
  if (settings.height !== 'omitted') props.listHeight = settings.height === 'small' ? 100
    : settings.height === 'zero' ? 0 : undefined;
  if (settings.itemHeight !== 'omitted') props.listItemHeight = settings.itemHeight === 'small' ? 16
    : settings.itemHeight === 'zero' ? 0 : undefined;
  if (settings.scrollbar !== 'omitted') props.showScrollBar = settings.scrollbar === 'optional' ? 'optional'
    : selectVirtualBooleanValue(settings.scrollbar);
  return props;
}
/** Inspect actual passed objects; omitted and own undefined remain separate receipts. */
export function selectVirtualReceipts(settings: SelectVirtualSettings,
  outer: { virtual?: unknown }, inner: { virtual?: unknown }, local: Record<string, unknown>) {
  const receipt = (props: object, key: string, original: unknown) => {
    const value = (props as Record<string, unknown>)[key];
    return { keyPresent: Object.hasOwn(props, key), type: typeof value,
      value: value === undefined ? 'undefined' : value,
      sameOriginal: Object.is(value, original) };
  };
  const expected = selectVirtualProps(settings);
  return { outer: receipt(outer, 'virtual', selectVirtualBooleanValue(settings.outer)),
    inner: receipt(inner, 'virtual', selectVirtualBooleanValue(settings.inner)),
    local: Object.fromEntries(['virtual', 'popupMatchSelectWidth', 'listHeight', 'listItemHeight', 'showScrollBar']
      .map(key => [key, receipt(local, key, expected[key as keyof typeof expected])])) };
}
export interface SelectVirtualOption<Label = string> { key: string; value: string; label: Label; disabled: boolean }
export function selectVirtualData() {
  return Array.from({ length: 100 }, (_, index): SelectVirtualOption => ({
    key: `k-${String(index).padStart(3, '0')}`, value: `v-${String(index).padStart(3, '0')}`,
    label: `Option ${String(index).padStart(3, '0')}`, disabled: index % 17 === 3
  }));
}
export function selectVirtualOptions<Option extends SelectVirtualOption<unknown>>(data: readonly Option[], count: number, groups = false) {
  const options = data.slice(0, count);
  return groups ? Array.from({ length: Math.ceil(options.length / 25) }, (_, index) => ({
    key: `g-${index}`, label: `Group ${index + 1}`, options: options.slice(index * 25, (index + 1) * 25)
  })) : options;
}
/** The public renderer/label counterpart uses this literal child height; the option is measured normally. */
export function selectVirtualChildHeight(index: number) { return [16, 40, 64][index % 3]; }

function sample(family: SelectVirtualFamily, suffix: string, settings: Partial<SelectVirtualSample> = {}): SelectVirtualSample {
  return { ...selectVirtualDefaults, id: `${family}-${suffix}`, family, scenario: 'basic', layout: 'plain', ...settings };
}
const families: readonly SelectVirtualFamily[] = ['select', 'auto-complete'];
export const selectVirtualSamples: readonly SelectVirtualSample[] = [
  ...families.flatMap(family => [
    sample(family, 'default'),
    sample(family, 'local-undefined', { virtual: 'undefined' }),
    sample(family, 'local-true', { virtual: 'true' }),
    sample(family, 'local-false', { virtual: 'false' }),
    sample(family, 'provider-false', { inner: 'false' }),
    sample(family, 'provider-true', { inner: 'true' }),
    sample(family, 'provider-false-local-undefined', { inner: 'false', virtual: 'undefined' }),
    sample(family, 'provider-false-local-true', { inner: 'false', virtual: 'true' }),
    sample(family, 'provider-true-local-false', { inner: 'true', virtual: 'false' }),
    sample(family, 'nested-undefined', { outer: 'false', inner: 'undefined' }),
    sample(family, 'nested-reset-true', { outer: 'false', inner: 'true' }),
    sample(family, 'nested-reset-false', { outer: 'true', inner: 'false' }),
    sample(family, 'width-false', { width: 'false' }),
    sample(family, 'width-zero', { width: 'zero' }),
    sample(family, 'height-100', { height: 'small' }),
    sample(family, 'height-zero', { height: 'zero' }),
    sample(family, 'height-undefined', { height: 'undefined' }),
    sample(family, 'item-height-16', { itemHeight: 'small' }),
    sample(family, 'item-height-zero', { itemHeight: 'zero' }),
    sample(family, 'item-height-undefined', { itemHeight: 'undefined' }),
    sample(family, 'scrollbar-true', { scenario: 'scrollbar', scrollbar: 'true', height: 'small' }),
    sample(family, 'scrollbar-false', { scenario: 'scrollbar', scrollbar: 'false', height: 'small' }),
    sample(family, 'scrollbar-optional', { scenario: 'scrollbar', scrollbar: 'optional', height: 'small' }),
    sample(family, 'live-props', { scenario: 'live' }),
    sample(family, 'ref-targets', { scenario: 'refs', height: 'small' }),
    sample(family, 'ref-closed', { scenario: 'closed', height: 'small' }),
    sample(family, 'selected-open', { scenario: 'selected', initialValue: 'v-060', height: 'small' }),
    sample(family, 'search-shrink', { scenario: 'search', height: 'small' }),
    sample(family, 'empty', { count: 0 }),
    sample(family, 'small-fit', { count: 3 }),
    sample(family, 'focus-ref', { scenario: 'focus', height: 'small' })
  ]),
  sample('select', 'variable-option', { variable: true, height: 'small' }),
  sample('select', 'variable-option-nonvirtual', { variable: true, virtual: 'false', height: 'small' }),
  sample('select', 'multiple', { scenario: 'mode', mode: 'multiple', initialValue: ['v-060'], height: 'small' }),
  sample('select', 'tags', { scenario: 'mode', mode: 'tags', initialValue: ['custom-tag'], height: 'small' }),
  sample('auto-complete', 'groups', { groups: true, height: 'small' }),
  sample('auto-complete', 'groups-variable', { groups: true, variable: true, height: 'small' }),
  ...families.flatMap(family => [sample(family, 'rtl', { layout: 'rtl', height: 'small' }),
    sample(family, 'scaled-shadow', { layout: 'scaled-shadow', height: 'small' })])
];

export function selectVirtualActions(sample: SelectVirtualSample): readonly SelectVirtualAction[] {
  if (sample.scenario === 'scrollbar') return [{ type: 'click' },
    { type: 'ref', method: 'scrollTo', target: { kind: 'undefined' } }, { type: 'wait', time: 3100 },
    { type: 'wheel', delta: 480 },
    ...(sample.scrollbar === 'false' ? [] : [{ type: 'drag', to: 'end' } as const]),
    { type: 'scroll', top: 0 }, { type: 'outside' }];
  if (sample.scenario === 'refs') return [{ type: 'click' }, { type: 'hover', text: 'Option 002' },
    { type: 'key', key: 'ArrowDown' },
    { type: 'ref', method: 'scrollTo', target: { kind: 'number', value: 20 } },
    { type: 'ref', method: 'scrollTo', target: { kind: 'index', index: 0 } },
    { type: 'ref', method: 'scrollTo', target: { kind: 'index', index: 20 } },
    { type: 'ref', method: 'scrollTo', target: { kind: 'key', key: 'k-060', align: 'top', offset: 11 } },
    { type: 'ref', method: 'scrollTo', target: { kind: 'index', index: 40, align: 'bottom', offset: 7 } },
    { type: 'ref', method: 'scrollTo', target: { kind: 'key', key: 'k-020', align: 'auto', offset: 'get-size' } },
    { type: 'ref', method: 'scrollTo', target: { kind: 'position', top: 64, left: 9 } },
    { type: 'ref', method: 'scrollTo', target: { kind: 'null' } },
    { type: 'ref', method: 'scrollTo', target: { kind: 'undefined' } }, { type: 'outside' }];
  if (sample.scenario === 'closed') return [
    { type: 'ref', method: 'scrollTo', target: { kind: 'index', index: 20 } },
    { type: 'click' }, { type: 'ref', method: 'scrollTo', target: { kind: 'number', value: 20 } },
    { type: 'open', value: false },
    { type: 'ref', method: 'scrollTo', target: { kind: 'index', index: 60, align: 'top' } },
    { type: 'open', value: true }, { type: 'ref', method: 'scrollTo', target: { kind: 'number', value: 20 } },
    { type: 'open', value: false }, { type: 'ref', method: 'scrollTo', target: { kind: 'position', top: 500 } },
    { type: 'open', value: true }, { type: 'ref', method: 'scrollTo', target: { kind: 'number', value: 20 } },
    { type: 'open', value: false }, { type: 'ref', method: 'scrollTo', target: { kind: 'null' } },
    { type: 'open', value: true }, { type: 'ref', method: 'scrollTo', target: { kind: 'number', value: 20 } },
    { type: 'open', value: false }, { type: 'ref', method: 'scrollTo', target: { kind: 'undefined' } },
    { type: 'open', value: true }, { type: 'open', value: false },
    { type: 'props', set: { count: 32 } }, { type: 'query', text: '09' },
    { type: 'ref', method: 'scrollTo', target: { kind: 'index', index: 20 } },
    { type: 'open', value: true }, { type: 'query', text: '' }, { type: 'outside' }];
  if (sample.scenario === 'selected') return [{ type: 'click' },
    { type: 'hover', text: 'Option 062' }, { type: 'key', key: 'ArrowDown' },
    { type: 'open', value: false }, { type: 'open', value: true }, { type: 'outside' }];
  if (sample.scenario === 'search') return [{ type: 'click' },
    { type: 'ref', method: 'scrollTo', target: { kind: 'index', index: 80 } },
    { type: 'fill', text: '09' }, { type: 'caret', start: 0, end: 2 },
    { type: 'props', set: { count: 96 } }, { type: 'key', key: 'ArrowDown' },
    { type: 'ref', method: 'scrollTo', target: { kind: 'index', index: 5 } },
    { type: 'props', set: { count: 4 } }, { type: 'fill', text: '' }, { type: 'outside' }];
  if (sample.scenario === 'focus') return [
    { type: 'ref', method: 'focus', options: { preventScroll: true } }, { type: 'click' },
    { type: 'hover', text: 'Option 002' }, { type: 'key', key: 'ArrowDown' },
    { type: 'ref', method: 'blur' }, { type: 'ref', method: 'focus', options: { preventScroll: true } },
    { type: 'outside' }];
  if (sample.scenario === 'live') return [{ type: 'click' }, { type: 'fill', text: 'Kept query' },
    { type: 'caret', start: 1, end: 5 }, { type: 'props', set: { inner: 'false' } },
    { type: 'props', set: { virtual: 'undefined' } }, { type: 'props', set: { height: 'small' } },
    { type: 'props', set: { itemHeight: 'small' } }, { type: 'props', set: { virtual: 'false' } },
    { type: 'props', set: { width: 'zero' } }, { type: 'props', set: { virtual: 'omitted' } },
    { type: 'props', set: { itemHeight: 'zero' } }, { type: 'props', set: { itemHeight: 'undefined' } },
    { type: 'props', set: { height: 'zero' } }, { type: 'props', set: { height: 'small' } },
    { type: 'open', value: false }, { type: 'props', set: { count: 32, height: 'undefined' } },
    { type: 'open', value: true }, { type: 'outside' }];
  if (sample.scenario === 'mode') return [{ type: 'click' }, { type: 'wheel', delta: 480 },
    { type: 'ref', method: 'scrollTo', target: { kind: 'key', key: sample.mode === 'tags' ? 'custom-tag' : 'k-060', align: 'top' } },
    { type: 'value', value: sample.mode === 'tags' ? ['custom-tag', 'v-080'] : ['v-060', 'v-080'] },
    { type: 'key', key: 'ArrowDown' }, { type: 'open', value: false }, { type: 'open', value: true },
    { type: 'outside' }];
  return [{ type: 'click' }, { type: 'ref', method: 'scrollTo', target: { kind: 'number', value: 20 } },
    { type: 'ref', method: 'scrollTo', target: { kind: 'index', index: 0 } }, { type: 'outside' }];
}
