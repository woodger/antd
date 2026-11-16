/** Чистые публичные входы этапа raw data Select/AutoComplete. */
export type SelectDataFamily = 'select' | 'auto-complete';
export type SelectDataMapping = 'omitted' | 'undefined' | 'empty' | 'label' | 'mapped' | 'mapped-no-group' | 'empty-strings';
export type SelectDataDataset = 'flat' | 'flat-next' | 'groups' | 'mapped' | 'mapped-next' | 'keys'
  | 'attrs' | 'duplicates' | 'many' | 'sort-default' | 'sort-mapped' | 'cache' | 'cache-disabled'
  | 'cache-removed' | 'tags' | 'undefined-children' | 'null-children' | 'false-children'
  | 'empty-children' | 'nested-group' | 'null-value';
export interface SelectDataFieldNames { label?: string; value?: string; options?: string; groupLabel?: string }
export interface SelectDataSettings {
  dataset: SelectDataDataset;
  mapping: SelectDataMapping;
  filter: 'off' | 'on' | 'custom';
  sort: boolean;
  virtual: 'omitted' | 'false';
}
export interface SelectDataSample extends SelectDataSettings {
  id: string;
  family: SelectDataFamily;
  scenario: string;
  mode?: 'multiple' | 'tags';
  initialValue?: string | string[];
  render?: boolean;
  tokens?: boolean;
  diagnostic?: boolean;
}
export type SelectDataKey = string | number | { bigint: string };
export type SelectDataAction =
  | { type: 'click' | 'outside' | 'clear' }
  | { type: 'choose' | 'hover' | 'remove'; text: string }
  | { type: 'fill' | 'query'; text: string }
  | { type: 'caret'; start: number; end: number }
  | { type: 'key'; key: string }
  | { type: 'open'; value: boolean }
  | { type: 'value'; value: string | string[] | null }
  | { type: 'props'; set: Partial<SelectDataSettings> }
  | { type: 'ref'; target: { kind: 'number' | 'index'; index: number; align?: 'top' | 'bottom'; offset?: number }
      | { kind: 'key'; key: SelectDataKey; align?: 'top' | 'bottom'; offset?: number | 'get-size' } };

export const selectDataGeometry = { viewport: { width: 1200, height: 900 },
  document: { width: 2200, height: 1800 }, root: { left: 300, top: 200, width: 240 } } as const;
export const selectDataDefaults: SelectDataSettings = {
  dataset: 'flat', mapping: 'omitted', filter: 'off', sort: false, virtual: 'omitted'
};

export function selectDataFieldNames(mapping: SelectDataMapping): SelectDataFieldNames | undefined {
  if (mapping === 'omitted' || mapping === 'undefined') return undefined;
  if (mapping === 'empty') return {};
  if (mapping === 'label') return { label: 'text' };
  if (mapping === 'empty-strings') return { label: '', value: '', options: '', groupLabel: '' };
  if (mapping === 'mapped-no-group') return { label: 'text', value: 'uid', options: 'nodes' };
  return { label: 'text', value: 'uid', options: 'nodes', groupLabel: 'heading' };
}

/** Значения остаются исходными JS values до явного кодирования наблюдений. */
export function selectDataRaw(dataset: SelectDataDataset): Record<string, unknown>[] {
  const raw = (token: string, fields: Record<string, unknown>): Record<string, unknown> => {
    const record = { auditToken: `${dataset}:${token}`, ...fields,
      meta: { owner: `${dataset}:${token}`, tuple: ['nested', 0, -0, undefined] }, ownUndefined: undefined };
    Object.defineProperty(record, 'hiddenAudit', { value: `hidden:${dataset}:${token}`,
      enumerable: false, writable: true, configurable: true });
    return record;
  };
  const leaf = (value: string, label: unknown, mapped = false, extra: Record<string, unknown> = {}) =>
    raw(value, { key: `key-${value}`, ...(mapped ? { uid: value, text: label } : { value, label }),
      'data-audit-option': value, searchToken: value, ...extra });
  const mapped = dataset.startsWith('mapped') || ['keys', 'duplicates', 'many', 'sort-mapped', 'tags',
    'undefined-children', 'null-children', 'false-children', 'empty-children', 'nested-group'].includes(dataset);
  if (dataset === 'keys') return [
    leaf('a', 'Alpha', true), leaf('b', 'Beta', true, { key: '' }),
    raw('c', { uid: 'c', text: 'Gamma', value: 'literal-c', 'data-audit-option': 'c' }),
    leaf('d', 'Delta bigint', true, { key: BigInt('9007199254740993') }),
    raw('e', { uid: 'e', text: 'Epsilon positional', 'data-audit-option': 'e' }),
    leaf('f', 'Zeta zero', true, { key: 0 }), leaf('g', 'Eta number', true, { key: 42 })
  ];
  if (dataset === 'attrs') return [
    leaf('a', undefined, false, { title: 'Explicit title', className: 'data-audit-option-class',
      style: { minHeight: 40 }, 'aria-label': 'Custom Alpha', 'aria-description': 'Raw description', 'data-extra': 'kept' }),
    leaf('b', '', false), leaf('c', 0, false), leaf('d', null, false)
  ];
  if (dataset === 'duplicates') return [
    raw('first', { key: 'first', uid: 'a', text: 'First Alpha', 'data-audit-option': 'first' }),
    raw('last', { key: 'last', uid: 'a', text: 'Last Alpha', 'data-audit-option': 'last' }), leaf('b', 'Beta', true)
  ];
  if (dataset.endsWith('-children')) return [raw('orphan', { uid: 'a', text: 'Mapped orphan', heading: 'Own children group',
    nodes: dataset === 'undefined-children' ? undefined : dataset === 'null-children' ? null
      : dataset === 'false-children' ? false : [] }), leaf('b', 'Beta', true)];
  if (dataset === 'nested-group') return [raw('outer', { key: 'outer', heading: 'Outer group', text: 'Outer search',
    nodes: [raw('nested', { key: 'nested', uid: 'nested', text: 'Nested terminal', heading: 'Nested group',
      nodes: [leaf('grand', 'Grandchild not flattened', true)] })] })];
  if (dataset === 'null-value') return [raw('null', { key: 'null', value: null, label: 'Null option' }), leaf('b', 'Beta')];
  if (dataset === 'many') return Array.from({ length: 5 }, (_, group) => raw(`group-${group}`, {
    key: `group-${group}`, heading: `Heading ${group}`, text: `Group search ${group}`,
    nodes: Array.from({ length: 8 }, (_, child) => {
      const value = `v-${String(group * 8 + child).padStart(2, '0')}`;
      return leaf(value, `Option ${value}`, true, { disabled: child === 3 });
    }) }));
  if (dataset === 'sort-default' || dataset === 'sort-mapped') {
    const options = [leaf('b', 'Beta', mapped, { rank: 2 }), leaf('a', 'Alpha', mapped, { rank: 1 })];
    return [raw('rank-2', { key: 'rank-2', rank: 2,
      ...(mapped ? { heading: 'Group Two', text: 'Search Two', nodes: options,
        options: [raw('shadow-b', { value: 'shadow-b', label: 'Shadow B', rank: 2 }),
          raw('shadow-a', { value: 'shadow-a', label: 'Shadow A', rank: 1 })] }
        : { label: 'Group Two', options }) }),
    raw('rank-1', { key: 'rank-1', rank: 1,
      ...(mapped ? { heading: 'Group One', text: 'Search One', nodes: [leaf('c', 'Gamma', true)] }
        : { label: 'Group One', options: [leaf('c', 'Gamma')] }) })];
  }
  const children = [leaf('a', dataset === 'flat-next' || dataset === 'mapped-next' ? 'Alpha next' : 'Alpha', mapped,
    { disabled: dataset === 'cache-disabled', title: 'Alpha title' }), leaf('b', 'Beta', mapped),
  leaf('c', 'Gamma disabled', mapped, { disabled: dataset !== 'tags' })];
  if (dataset === 'cache-removed') return children.slice(1);
  if (dataset === 'groups' || dataset === 'mapped' || dataset === 'mapped-next') return [
    leaf('x', 'Standalone', mapped),
    raw('group-a', { key: 'group-a', title: 'Group title', className: 'data-audit-group-class',
      ...(mapped ? { heading: 'Heading A', text: 'First group', nodes: children }
        : { label: 'First group', options: children }) }),
    raw('empty', { key: 'empty', ...(mapped ? { heading: 'Empty group', text: 'Empty search', nodes: [] }
      : { label: 'Empty group', options: [] }) }),
    raw('disabled-group', { key: 'disabled-group', disabled: true,
      ...(mapped ? { heading: 'Disabled group', text: 'Disabled search', nodes: [leaf('d', 'Delta enabled', true)] }
        : { label: 'Disabled group', options: [leaf('d', 'Delta enabled')] }) })
  ];
  if (dataset === 'flat' && !mapped) for (const item of children) item.text = item.label;
  return children;
}

/** JSON сохраняет bigint, -0, undefined и нечисловые значения через явные tags. */
export function encodeSelectData(value: unknown, seen: object[] = []): unknown {
  if (value === null) return { type: 'null' };
  if (typeof value === 'undefined') return { type: 'undefined' };
  if (typeof value === 'string' || typeof value === 'boolean') return { type: typeof value, value };
  if (typeof value === 'number') return { type: 'number', value: Object.is(value, -0) ? '-0' : String(value) };
  if (typeof value === 'bigint') return { type: 'bigint', value: String(value) };
  if (typeof value !== 'object') return { type: typeof value, value: String(value) };
  if (seen.includes(value)) return { type: 'cycle', index: seen.indexOf(value) };
  const next = [...seen, value];
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Array.isArray(value)) return { type: 'array', items: Array.from({ length: value.length }, (_, index) =>
    Object.hasOwn(descriptors, index) ? encodeSelectData(descriptors[index].value, next) : { type: 'hole' }) };
  return { type: 'object', entries: Object.entries(descriptors).filter(([, descriptor]) => descriptor.enumerable)
    .map(([key, descriptor]) => [key, 'value' in descriptor ? encodeSelectData(descriptor.value, next)
      : { type: 'accessor', get: Boolean(descriptor.get), set: Boolean(descriptor.set) }]) };
}
export function selectDataOwn(value: unknown) {
  if (!value || typeof value !== 'object') return [];
  return Object.entries(Object.getOwnPropertyDescriptors(value)).map(([key, descriptor]) => ({ key,
    enumerable: Boolean(descriptor.enumerable), configurable: Boolean(descriptor.configurable),
    ...('value' in descriptor ? { kind: 'data', writable: Boolean(descriptor.writable) }
      : { kind: 'accessor', get: Boolean(descriptor.get), set: Boolean(descriptor.set) }) }));
}
export function selectDataKeyValue(key: SelectDataKey) {
  return typeof key === 'object' ? BigInt(key.bigint) : key;
}

const sharedScenarios = ['default-flat', 'own-undefined', 'empty-map', 'partial-label', 'all-four-mapped',
  'group-label-live', 'empty-string-mappings', 'empty-disabled-groups', 'keys-and-index', 'live-open-remap',
  'live-closed-remap', 'filter-group-match', 'filter-child-match', 'custom-filter-data',
  'duplicate-value-unique-key', 'many-group-refs', 'raw-attrs-labels'] as const;
function sample(family: SelectDataFamily, scenario: string): SelectDataSample {
  const variations: Record<string, Partial<SelectDataSettings>> = {
    'own-undefined': { mapping: 'undefined' }, 'empty-map': { mapping: 'empty' },
    'partial-label': { mapping: 'label' }, 'all-four-mapped': { mapping: 'mapped', dataset: 'mapped' },
    'group-label-live': { mapping: 'mapped-no-group', dataset: 'mapped' },
    'empty-string-mappings': { mapping: 'empty-strings', dataset: 'groups' },
    'empty-disabled-groups': { dataset: 'groups' },
    'keys-and-index': { mapping: 'mapped', dataset: 'keys' },
    'filter-group-match': { dataset: 'groups', filter: 'on' },
    'filter-child-match': { dataset: 'groups', filter: 'on' },
    'custom-filter-data': { mapping: 'mapped', dataset: 'mapped', filter: 'custom' },
    'duplicate-value-unique-key': { mapping: 'mapped', dataset: 'duplicates' },
    'many-group-refs': { mapping: 'mapped', dataset: 'many' }, 'raw-attrs-labels': { dataset: 'attrs' },
    'mapped-tags-render': { mapping: 'mapped', dataset: 'tags' },
    'group-sort-default': { dataset: 'sort-default', sort: true },
    'group-sort-mapped': { mapping: 'mapped', dataset: 'sort-mapped', sort: true },
    'selected-cache': { dataset: 'cache' }
  };
  const settings = variations[scenario] ?? {};
  return { ...selectDataDefaults, ...settings, id: `${family}-${scenario}`, family, scenario,
    ...(family === 'select' && ['keys-and-index', 'mapped-tags-render'].includes(scenario) ? { render: true } : {}),
    ...(scenario === 'multiple-callbacks' || scenario === 'selected-cache' ? { mode: 'multiple' as const } : {}),
    ...(scenario === 'mapped-tags-render' ? { mode: 'tags' as const } : {}) };
}
export const selectDataSamples: readonly SelectDataSample[] = [
  ...(['select', 'auto-complete'] as const).flatMap(family => sharedScenarios.map(scenario => sample(family, scenario))),
  ...['single-callbacks', 'multiple-callbacks', 'mapped-tags-render', 'group-sort-default', 'group-sort-mapped',
    'selected-cache'].map(scenario => sample('select', scenario))
];
export const selectDataDiagnosticSamples: readonly SelectDataSample[] = [
  { ...sample('select', 'diagnostic-own-children'), diagnostic: true, mapping: 'mapped', dataset: 'undefined-children', initialValue: 'a' },
  { ...sample('select', 'diagnostic-nested-group'), diagnostic: true, mapping: 'mapped', dataset: 'nested-group', render: true },
  { ...sample('select', 'diagnostic-null-value'), diagnostic: true, dataset: 'null-value' },
  { ...sample('select', 'diagnostic-mapped-token-split'), diagnostic: true, mapping: 'mapped', dataset: 'mapped', mode: 'multiple', tokens: true }
];
export function selectDataActions(sample: SelectDataSample): readonly SelectDataAction[] {
  const click: SelectDataAction = { type: 'click' }, outside: SelectDataAction = { type: 'outside' };
  const scenario = sample.scenario;
  if (scenario === 'diagnostic-own-children') return [click,
    ...(['null-children', 'false-children', 'empty-children'] as const).map(dataset =>
      ({ type: 'props', set: { dataset } }) as SelectDataAction), outside];
  if (scenario === 'diagnostic-nested-group') return [click, { type: 'choose', text: 'Nested terminal' }, click, outside];
  if (scenario === 'diagnostic-null-value') return [click, { type: 'choose', text: 'Null option' }, click, outside];
  if (scenario === 'diagnostic-mapped-token-split') return [click, { type: 'fill', text: 'Alpha,' }, outside];
  if (scenario === 'empty-disabled-groups') return [click,
    { type: 'ref', target: { kind: 'index', index: 7, align: 'top' } },
    { type: 'choose', text: 'Delta enabled' }, outside];
  if (scenario === 'group-label-live') return [click, { type: 'props', set: { mapping: 'mapped' } },
    { type: 'choose', text: 'Beta' }, outside];
  if (scenario === 'keys-and-index') return [click,
    { type: 'ref', target: { kind: 'key', key: { bigint: '9007199254740993' }, align: 'top' } },
    { type: 'ref', target: { kind: 'key', key: 'literal-c', align: 'top' } },
    { type: 'ref', target: { kind: 'index', index: 4, align: 'top' } }, outside];
  if (scenario === 'live-open-remap') return [click, { type: 'fill', text: 'Kept query' },
    { type: 'caret', start: 1, end: 5 }, { type: 'props', set: { dataset: 'mapped', mapping: 'mapped' } },
    { type: 'props', set: { dataset: 'mapped-next' } }, { type: 'props', set: { dataset: 'mapped' } }, outside];
  if (scenario === 'live-closed-remap') return [click, { type: 'choose', text: 'Alpha' },
    { type: 'props', set: { dataset: 'mapped-next', mapping: 'mapped' } }, click, outside];
  if (scenario === 'filter-group-match' || scenario === 'filter-child-match') return [click,
    { type: 'fill', text: scenario === 'filter-group-match' ? 'First group' : 'b' }, outside];
  if (scenario === 'custom-filter-data') return [click, { type: 'fill', text: 'a' }, { type: 'fill', text: 'b' }, outside];
  if (scenario === 'duplicate-value-unique-key') return [click, { type: 'choose', text: 'First Alpha' },
    click, { type: 'choose', text: 'Last Alpha' }, outside];
  if (scenario === 'many-group-refs') return [click,
    { type: 'ref', target: { kind: 'number', index: 20 } },
    { type: 'ref', target: { kind: 'key', key: 'key-v-24', align: 'top', offset: 'get-size' } },
    { type: 'key', key: 'ArrowDown' }, { type: 'props', set: { virtual: 'false' } }, outside];
  if (scenario === 'raw-attrs-labels') return [click, { type: 'key', key: 'ArrowDown' }, outside];
  if (scenario === 'single-callbacks') return [click, { type: 'choose', text: 'Alpha' }, click,
    { type: 'choose', text: 'Alpha' }, { type: 'clear' }, outside];
  if (scenario === 'multiple-callbacks') return [click, { type: 'choose', text: 'Alpha' },
    { type: 'choose', text: 'Beta' }, { type: 'choose', text: 'Alpha' },
    { type: 'remove', text: 'Beta' }, { type: 'choose', text: 'Alpha' }, { type: 'clear' }, outside];
  if (scenario === 'mapped-tags-render') return [click, { type: 'fill', text: 'new-tag' },
    { type: 'key', key: 'Enter' }, { type: 'fill', text: '' }, { type: 'choose', text: 'Beta' },
    { type: 'remove', text: 'Beta' }, outside];
  if (scenario === 'selected-cache') return [click, { type: 'choose', text: 'Alpha' },
    { type: 'props', set: { dataset: 'cache-disabled' } }, { type: 'props', set: { dataset: 'cache-removed' } },
    { type: 'key', key: 'Backspace' }, outside];
  if (scenario === 'group-sort-default' || scenario === 'group-sort-mapped') return [click,
    { type: 'props', set: { sort: false } }, { type: 'props', set: { sort: true } }, outside];
  return [click, { type: 'choose', text: 'Beta' }, outside];
}
