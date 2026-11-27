/** Public authorized inputs of the independent stage of the selected values Select. */
export type SelectValueLabel = 'omitted' | 'undefined' | 'null' | 'false' | 'empty' | 'zero' | 'text' | 'rich' | 'array';
export type SelectValueRenderer = 'omitted' | 'text' | 'undefined' | 'null' | 'false' | 'empty' | 'zero' | 'rich' | 'array';
export type SelectValueDataset = 'basic' | 'next' | 'removed' | 'rich' | 'disabled' | 'mapped' | 'mixed' | 'duplicates' | 'styled' | 'styled-next';
export type SelectValueInput = { kind: 'raw'; value: string | number | null }
  | { kind: 'labeled'; value: string | number | null; label: SelectValueLabel }
  | { kind: 'undefined' };
export type SelectValueModel = SelectValueInput | readonly SelectValueInput[];
export interface SelectValueSettings {
  dataset: SelectValueDataset;
  labelInValue: 'omitted' | 'false' | 'true';
  optionLabelProp: 'omitted' | 'undefined' | 'empty' | 'alternate' | 'title';
  renderer: SelectValueRenderer;
  filter: boolean;
}
export interface SelectValueSample extends SelectValueSettings {
  id: string;
  scenario: string;
  mode?: 'multiple' | 'tags';
  owner: 'value' | 'defaultValue';
  initial: SelectValueModel;
  tokens?: boolean;
}
export type SelectValueAction = { type: 'click' | 'outside' | 'clear' }
  | { type: 'choose' | 'remove'; text: string }
  | { type: 'fill' | 'query'; text: string }
  | { type: 'key'; key: string }
  | { type: 'caret'; start: number; end: number }
  | { type: 'props'; set: Partial<SelectValueSettings> }
  | { type: 'value'; value: SelectValueModel }
  | { type: 'open'; value: boolean };
export const selectValueGeometry = { viewport: { width: 1200, height: 900 },
  document: { width: 2200, height: 1800 }, root: { left: 300, top: 200, width: 280 } } as const;
export const selectValueNodeTokens = ['raw-alpha', 'raw-beta', 'supplied-alpha', 'rendered'] as const;
export type SelectValueNodeToken = typeof selectValueNodeTokens[number];
export function selectValueNodeRecipe(token: string) {
  return { tag: token === 'raw-alpha' ? 'strong' : 'em', text: token === 'raw-alpha' ? 'Rich Alpha'
    : token === 'raw-beta' ? 'Rich Beta' : token === 'supplied-alpha' ? 'Owner Alpha' : 'Rendered label',
  attributes: { 'data-select-value-node': token } };
}
export function selectValueLabel(kind: SelectValueLabel, rich: (token: string) => unknown): unknown {
  if (kind === 'omitted' || kind === 'undefined') return undefined;
  if (kind === 'null') return null;
  if (kind === 'false') return false;
  if (kind === 'empty') return '';
  if (kind === 'zero') return 0;
  if (kind === 'rich') return rich('supplied-alpha');
  if (kind === 'array') return [rich('supplied-alpha'), ' array ', 0];
  return 'Owner Alpha';
}
export function materializeSelectValue(input: SelectValueModel, rich: (token: string) => unknown): unknown {
  const item = (value: SelectValueInput) => {
    if (value.kind === 'undefined') return undefined;
    if (value.kind === 'raw') return value.value;
    const result: Record<string, unknown> = { value: value.value, key: 'owner-key',
      ownerExtra: { source: 'supplied-label' }, ownUndefined: undefined };
    if (value.label !== 'omitted') result.label = selectValueLabel(value.label, rich);
    return result;
  };
  return Array.isArray(input) ? input.map(item) : item(input as SelectValueInput);
}
export function selectValueFieldNames(dataset: SelectValueDataset) {
  return dataset === 'mapped' ? { value: 'uid', label: 'text', options: 'nodes', groupLabel: 'heading' } : undefined;
}
export function selectValueData(dataset: SelectValueDataset, rich: (token: string) => unknown): Record<string, unknown>[] {
  const raw = (token: string, values: Record<string, unknown>) => {
    const result = { auditToken: `${dataset}:${token}`, ...values,
      meta: { nested: `${dataset}:${token}`, tuple: [undefined, -0] }, ownUndefined: undefined };
    Object.defineProperty(result, 'hiddenAudit', { value: token, enumerable: false, configurable: true });
    return result;
  };
  const leaf = (value: string | number, label: unknown, extra: Record<string, unknown> = {}) => raw(String(value), {
    key: `key-${typeof value}-${value}`, value, label, alternate: `Alternate ${value}`,
    title: value === 'a' ? 'Alpha title' : undefined, 'data-audit-option': String(value), ...extra
  });
  if (dataset === 'mixed') return [leaf(0, 'Number zero'), leaf('0', 'String zero'), leaf('a', 'Alpha')];
  if (dataset === 'duplicates') return [
    leaf('a', 'First Alpha', { key: 'first-a', auditToken: 'duplicates:first-a', className: 'first-selected-style',
      style: { color: 'rgb(12, 34, 56)', fontStyle: 'italic' }, title: 'First title' }),
    leaf('a', 'Last Alpha', { key: 'last-a', auditToken: 'duplicates:last-a', className: 'last-selected-style',
      style: { color: 'rgb(65, 43, 21)' }, title: 'Last title' }), leaf('b', 'Beta')
  ];
  if (dataset === 'mapped') return [raw('group', { key: 'mapped-group', heading: 'Mapped values', nodes: [
    raw('a', { key: 'mapped-a', uid: 'a', text: 'Alpha', alternate: 'Alternate a', title: 'Alpha title', 'data-audit-option': 'a' }),
    raw('b', { key: 'mapped-b', uid: 'b', text: 'Beta', alternate: 'Alternate b', 'data-audit-option': 'b' })
  ] })];
  const options = [leaf('a', dataset === 'next' ? 'Alpha next' : dataset === 'rich' ? rich('raw-alpha') : 'Alpha', {
    disabled: dataset === 'disabled', ...(dataset === 'styled' || dataset === 'styled-next' ? {
      className: dataset === 'styled' ? 'authored-selected-a' : 'authored-selected-next',
      title: dataset === 'styled' ? 'Authored selected title' : 'Next selected title',
      style: { color: dataset === 'styled' ? 'rgb(10, 20, 30)' : 'rgb(30, 20, 10)',
        backgroundColor: 'rgb(230, 240, 250)', fontStyle: 'italic' }
    } : {})
  }), leaf('b', dataset === 'rich' ? rich('raw-beta') : 'Beta'), leaf('locked', 'Locked', { disabled: true })];
  return dataset === 'removed' ? options.slice(1) : options;
}

/** Lossless scalar/own-data encoding; known rich objects/functions use declared authored identity. */
export function encodeSelectValue(value: unknown, rich?: ReadonlyMap<unknown, string>, seen: object[] = []): unknown {
  if (rich?.has(value)) return { type: 'rich-node', token: rich.get(value), sameOriginal: true };
  if (value === null) return { type: 'null' };
  if (value === undefined) return { type: 'undefined' };
  if (typeof value === 'string' || typeof value === 'boolean') return { type: typeof value, value };
  if (typeof value === 'number') return { type: 'number', value: Object.is(value, -0) ? '-0' : String(value) };
  if (typeof value === 'bigint' || typeof value === 'symbol' || typeof value === 'function') return { type: typeof value, value: String(value) };
  if (typeof value !== 'object') return { type: typeof value, value: String(value) };
  if (seen.includes(value)) return { type: 'cycle', index: seen.indexOf(value) };
  const next = [...seen, value];
  const own = Object.getOwnPropertyDescriptors(value);
  if (Array.isArray(value)) return { type: 'array', items: Array.from({ length: value.length }, (_, index) =>
    Object.hasOwn(own, index) ? encodeSelectValue(own[index].value, rich, next) : { type: 'hole' }) };
  return { type: 'object', entries: Object.entries(own).filter(([, descriptor]) => descriptor.enumerable)
    .map(([key, descriptor]) => [key, 'value' in descriptor ? encodeSelectValue(descriptor.value, rich, next)
      : { type: 'accessor', get: Boolean(descriptor.get), set: Boolean(descriptor.set) }]) };
}
export function selectValueOwn(value: unknown) {
  if (!value || (typeof value !== 'object' && typeof value !== 'function')) return [];
  return Object.entries(Object.getOwnPropertyDescriptors(value)).map(([key, descriptor]) => ({ key,
    enumerable: Boolean(descriptor.enumerable), configurable: Boolean(descriptor.configurable),
    ...('value' in descriptor ? { kind: 'data', writable: Boolean(descriptor.writable) }
      : { kind: 'accessor', get: Boolean(descriptor.get), set: Boolean(descriptor.set) }) }));
}
export function selectValueRender(kind: SelectValueRenderer, item: Record<string, unknown>, rich: (token: string) => unknown): unknown {
  if (kind === 'undefined' || kind === 'omitted') return undefined;
  if (kind === 'null') return null;
  if (kind === 'false') return false;
  if (kind === 'empty') return '';
  if (kind === 'zero') return 0;
  if (kind === 'rich') return rich('rendered');
  if (kind === 'array') return [rich('rendered'), ' / ', item.value];
  return `Rendered ${String(item.value)}: ${typeof item.label === 'string' || typeof item.label === 'number' ? item.label : typeof item.label}`;
}

const defaults: SelectValueSettings = { dataset: 'basic', labelInValue: 'omitted', optionLabelProp: 'omitted', renderer: 'omitted', filter: false };
const rawA: SelectValueInput = { kind: 'raw', value: 'a' };
const labeled = (label: SelectValueLabel, value: string | number | null = 'a'): SelectValueInput => ({ kind: 'labeled', value, label });
function sample(id: string, changes: Partial<SelectValueSample> = {}): SelectValueSample {
  return { ...defaults, id: `select-value-${id}`, scenario: id, owner: 'value', initial: { kind: 'undefined' }, ...changes };
}
export const selectValueSamples: readonly SelectValueSample[] = [
  ...([undefined, 'multiple', 'tags'] as const).flatMap(mode => ['omitted', 'true'].map(labelInValue =>
    sample(`${mode ?? 'single'}-${labelInValue}`, { mode, labelInValue: labelInValue as 'omitted' | 'true', initial: mode ? [] : { kind: 'undefined' } }))),
  sample('single-false', { labelInValue: 'false' }),
  ...(['omitted', 'undefined', 'null', 'false', 'empty', 'zero', 'text', 'rich', 'array'] as const)
    .map(label => sample(`supplied-${label}`, { labelInValue: 'true', initial: labeled(label) })),
  ...(['alternate', 'empty', 'undefined'] as const).map(optionLabelProp => sample(`label-prop-${optionLabelProp}`,
    { optionLabelProp, labelInValue: 'true' })),
  sample('mapped-alternate', { dataset: 'mapped', optionLabelProp: 'alternate', labelInValue: 'true' }),
  ...(['text', 'undefined', 'null', 'false', 'empty', 'zero', 'rich', 'array'] as const).map(renderer =>
    sample(`render-${renderer}`, { renderer, labelInValue: 'true', initial: labeled('text') })),
  sample('live-render', { initial: rawA, renderer: 'text' }),
  sample('live-label-prop', { initial: rawA }),
  sample('live-data', { initial: labeled('omitted'), labelInValue: 'true', renderer: 'text' }),
  sample('cache-supplied', { initial: [labeled('text')], labelInValue: 'true', mode: 'multiple' }),
  sample('cache-rich', { initial: [labeled('rich')], labelInValue: 'true', mode: 'multiple', renderer: 'array' }),
  sample('cache-disabled', { dataset: 'disabled', initial: [labeled('omitted')], labelInValue: 'true', mode: 'multiple', renderer: 'text' }),
  sample('mixed', { dataset: 'mixed', initial: labeled('omitted', 0), labelInValue: 'true', renderer: 'text' }),
  sample('duplicates', { dataset: 'duplicates', initial: rawA, renderer: 'text' }),
  sample('styled', { dataset: 'styled', initial: rawA }),
  sample('default-value', { owner: 'defaultValue', labelInValue: 'true', initial: labeled('text') }),
  sample('multiple-rich', { dataset: 'rich', labelInValue: 'true', mode: 'multiple', initial: [labeled('rich')] }),
  sample('tags-mapped', { dataset: 'mapped', labelInValue: 'true', mode: 'tags', initial: [] }),
  sample('filtered-selected-style', { dataset: 'styled', initial: rawA, filter: true }),
  sample('default-label-snapshot', { owner: 'defaultValue' }),
  sample('cached-click', { mode: 'multiple', labelInValue: 'true', initial: [labeled('omitted')] }),
  sample('cached-token', { mode: 'multiple', labelInValue: 'true', initial: [labeled('omitted')], tokens: true }),
  ...(['remove', 'backspace', 'deselect'] as const).map(gesture => sample(`rendered-label-${gesture}`, {
    labelInValue: 'true', optionLabelProp: 'alternate', renderer: 'text', mode: 'multiple',
    initial: [labeled('omitted'), labeled('omitted', 'b')]
  })),
  sample('null-placeholder', { initial: { kind: 'raw', value: null }, renderer: 'text' })
];
export function selectValueActions(sample: SelectValueSample): readonly SelectValueAction[] {
  const click: SelectValueAction = { type: 'click' }, outside: SelectValueAction = { type: 'outside' };
  const choose = (text: string): SelectValueAction => ({ type: 'choose', text });
  const props = (set: Partial<SelectValueSettings>): SelectValueAction => ({ type: 'props', set });
  if (sample.scenario === 'live-render') return [click, props({ renderer: 'rich' }), props({ renderer: 'null' }),
    props({ renderer: 'omitted' }), outside];
  if (sample.scenario === 'live-label-prop' || sample.scenario === 'default-label-snapshot') return [click,
    choose('Beta'), props({ optionLabelProp: 'alternate' }), props({ optionLabelProp: 'empty' }), click, outside];
  if (sample.scenario === 'live-data') return [click, props({ dataset: 'next' }), props({ dataset: 'removed' }),
    props({ dataset: 'basic' }), choose('Beta'), outside];
  if (sample.scenario.startsWith('cache-')) return [click, props({ dataset: 'removed' }),
    { type: 'key', key: 'Backspace' }, { type: 'value', value: sample.initial }, { type: 'clear' }, outside];
  if (sample.scenario.startsWith('rendered-label-')) return [click,
    sample.scenario === 'rendered-label-remove' ? { type: 'remove', text: 'Rendered a: Alternate a' }
      : sample.scenario === 'rendered-label-backspace' ? { type: 'key', key: 'Backspace' } : choose('Alpha'),
    { type: 'clear' }, outside];
  if (sample.scenario === 'mixed') return [click, choose('String zero'), click, choose('Number zero'),
    { type: 'clear' }, outside];
  if (sample.scenario === 'duplicates') return [click, choose('First Alpha'), props({ optionLabelProp: 'alternate' }),
    click, choose('Last Alpha'), { type: 'clear' }, outside];
  if (sample.scenario === 'styled') return [click, props({ dataset: 'styled-next' }), props({ dataset: 'basic' }),
    props({ dataset: 'styled' }), outside];
  if (sample.scenario === 'filtered-selected-style') return [click, { type: 'fill', text: 'b' }, outside, click,
    { type: 'fill', text: '' }, outside];
  if (sample.scenario === 'cached-click' || sample.scenario === 'cached-token') return [click,
    props({ dataset: 'removed' }), sample.tokens ? { type: 'fill', text: 'Beta,' } : choose('Beta'), outside];
  if (sample.scenario === 'tags-mapped') return [click, { type: 'fill', text: 'new-tag' }, { type: 'key', key: 'Enter' },
    { type: 'fill', text: '' }, choose('Beta'), { type: 'remove', text: 'Beta' }, { type: 'clear' }, outside];
  if (sample.scenario === 'multiple-rich') return [click, choose('Rich Beta'), { type: 'remove', text: 'Owner Alpha' },
    { type: 'clear' }, outside];
  if (sample.mode) return [click, choose('Alpha'), choose('Beta'), { type: 'remove', text: 'Alpha' }, { type: 'clear' }, outside];
  return [click, choose('Alpha'), click, choose('Beta'), { type: 'clear' }, outside];
}
