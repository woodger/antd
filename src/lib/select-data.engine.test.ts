import { describe, expect, it, vi } from 'vitest';
import {
  collectSelectData, copySelectData, emptySelectDataCache, filterSelectData, flattenSelectData,
  resolveSelectDataCache, selectDataAttributes, selectDataContent, selectDataTitle,
  selectFields, selectOptionLabel, selectOptionValue, sortSelectData
} from './select-data.engine';
import type { SelectDataRow } from './select-data.types';

const fields = selectFields();
const mapped = selectFields({ value: 'uid', label: 'text', options: 'nodes', groupLabel: 'heading' });

describe('Select raw mapping and lookup', () => {
  it('keeps an earlier own token label when a later inherited label wins Source lookup', () => {
    const own = { uid: 'own', text: 'Shared label' };
    const inherited = Object.assign(Object.create({ text: 'Shared label' }) as { text: string },
      { uid: 'inherited' });
    const maps = collectSelectData([own, inherited], mapped);

    expect(maps.labelOptions.get('Shared label')).toBe(inherited);
    expect(maps.nativeLabelOptions.get('Shared label')).toBe(own);
    expect(maps.valueOptions.get('inherited')).toBe(inherited);
  });

  it('reads a label accessor once while populating both lookup policies', () => {
    const read = vi.fn(() => 'Alpha');
    const option = { value: 'a', get label() { return read(); } };
    const maps = collectSelectData([option], fields);

    expect(maps.labelOptions.get('Alpha')).toBe(option);
    expect(maps.nativeLabelOptions.get('Alpha')).toBe(option);
    expect(read).toHaveBeenCalledTimes(1);
  });

  it('fills all four field names using truthy fallback and the merged label', () => {
    expect(selectFields()).toEqual({ label: 'label', value: 'value', options: 'options', groupLabel: 'label' });
    expect(selectFields({ label: 'text' })).toEqual({ label: 'text', value: 'value', options: 'options', groupLabel: 'text' });
    expect(selectFields({ label: '', value: '', options: '', groupLabel: '' })).toEqual(fields);
    const raw = { uid: 0, text: false, value: 'literal', label: 'Literal' };
    expect(selectOptionValue(raw, mapped)).toBe(0);
    expect(selectOptionLabel(raw, mapped)).toBe(false);
  });

  it('keeps raw records and one group level while separating mapped values from literal keys', () => {
    const children = Object.freeze([
      { uid: 'a', text: 'Alpha', key: '' },
      { uid: 'b', text: 0, value: 'literal-b' },
      { uid: 'c', text: 'Terminal', nodes: [{ uid: 'grand', text: 'Grandchild' }] }
    ]);
    const group = Object.freeze({ heading: 'Heading', text: 'Search label', nodes: children });
    const rows = flattenSelectData([group], mapped);

    expect(rows.map(row => [row.key, row.value, row.label, row.group, row.groupOption])).toEqual([
      ['rc-index-key-0', undefined, 'Heading', true, undefined],
      ['', 'a', 'Alpha', undefined, true], ['literal-b', 'b', 0, undefined, true],
      ['rc-index-key-3', 'c', 'Terminal', undefined, true]
    ]);
    expect(rows[0].data).toBe(group);
    expect(rows[3].data).toBe(children[2]);
    expect(Object.keys(rows[0])).toEqual(['key', 'group', 'data', 'label']);
    expect(Object.keys(rows[1])).toEqual(['key', 'groupOption', 'data', 'label', 'value']);
    expect(group.nodes).toBe(children);
  });

  it('preserves empty, zero and bigint keys without using mapped value as a fallback', () => {
    const input = [
      { uid: 'a', text: 'A', key: 0 }, { uid: 'b', text: 'B', key: 9n },
      { uid: 'c', text: 'C', key: null, value: '' }, { uid: 'd', text: 'D' }
    ];
    expect(flattenSelectData(input, mapped).map(row => row.key)).toEqual([0, 9n, '', 'rc-index-key-3']);
  });

  it.each([undefined, null, false, []])('separates child-property flattening from truthy lookup (%s)', nodes => {
    const orphan = { uid: 'a', text: 'Mapped orphan', heading: 'Own group', nodes };
    const beta = { uid: 'b', text: 'Beta' };
    const rows = flattenSelectData([orphan, beta], mapped);
    const maps = collectSelectData([orphan, beta], mapped);

    expect(rows.map(row => [row.group ?? false, row.label])).toEqual([[true, 'Own group'], [false, 'Beta']]);
    expect(maps.valueOptions.get('a')).toBe(Array.isArray(nodes) ? undefined : orphan);
    expect(maps.valueOptions.get('b')).toBe(beta);
  });

  it('uses inherited children for grouping and makes a nested child terminal in both scans', () => {
    const nested = { uid: 'nested', text: 'Terminal', nodes: [{ uid: 'grand', text: 'Grandchild' }] };
    const group = Object.assign(Object.create({ nodes: [nested] }) as { nodes: typeof nested[] }, { heading: 'Group' });
    expect(flattenSelectData([group], mapped).map(row => row.value)).toEqual([undefined, 'nested']);
    const lookup = collectSelectData([group], mapped).valueOptions;
    expect(lookup.get('nested')).toBe(nested);
    expect(lookup.has('grand')).toBe(false);
  });

  it('keeps the last duplicate raw value, typed values and every configured raw label key', () => {
    const first = { value: 0, label: 'First', search: 'Alias' };
    const last = { value: 0, label: 'Last', search: 'Alias', caption: 'Caption' };
    const string = { value: '0', label: undefined, search: 'String' };
    const maps = collectSelectData([first, last, string], fields, ['search', ''], 'caption');

    expect(maps.valueOptions.get(0)).toBe(last);
    expect(maps.valueOptions.get('0')).toBe(string);
    expect(maps.labelOptions.get('First')).toBe(first);
    expect(maps.labelOptions.get('Alias')).toBe(last);
    expect(maps.labelOptions.get('Caption')).toBe(last);
    expect(maps.labelOptions.get(undefined)).toBe(string);
    expect(flattenSelectData([first, last], fields).map(row => row.data)).toEqual([first, last]);
  });
});

describe('Select raw filter and sorter', () => {
  const alpha = Object.freeze({ uid: 'a', text: 'Alpha', meta: { nested: true } });
  const beta = Object.freeze({ uid: 'b', text: 'Beta', disabled: true });
  const group = Object.freeze({ heading: 'Visual heading', text: 'Search group', nodes: Object.freeze([alpha, beta]) });

  it('keeps matching groups whole and copies only partially matched groups under mapped children', () => {
    const whole = filterSelectData([group], 'Search group', mapped);
    const partial = filterSelectData([group], 'b', mapped);

    expect(whole[0]).toBe(group);
    expect(whole[0].nodes).toBe(group.nodes);
    expect(partial[0]).not.toBe(group);
    expect(partial[0].nodes).toEqual([beta]);
    expect(partial[0].nodes[0]).toBe(beta);
    expect(group.nodes).toEqual([alpha, beta]);
    expect(filterSelectData([group], 'Visual heading', mapped)).toEqual([]);
  });

  it('uses terminal nested-child truthiness for default filtering without recursive flattening', () => {
    const nested = { uid: 'nested', text: 'Match nested label', nodes: [{ uid: 'grand', text: 'Grandchild' }] };
    const outer = { text: 'Outer', nodes: [nested] };
    const result = filterSelectData([outer], 'Match nested', mapped);
    expect(result[0].nodes).toEqual([nested]);
    expect(flattenSelectData(result, mapped).map(row => row.value)).toEqual([undefined, 'nested']);
  });

  it('passes fresh enumerable shallow copies to predicates without a legacy props getter', () => {
    const hidden = Object.defineProperty({ ...group, meta: alpha.meta }, 'hidden', { value: 'secret' });
    const filter = vi.fn((search: string, item: object) => Reflect.get(item, 'uid') === search);
    const result = filterSelectData([hidden], 'a', mapped, { filterOption: filter });

    expect(filter.mock.calls).toHaveLength(3);
    expect(filter.mock.calls[0][1]).not.toBe(hidden);
    expect(filter.mock.calls[1][1]).not.toBe(alpha);
    expect(Reflect.get(filter.mock.calls[1][1], 'meta')).toBe(alpha.meta);
    expect(Object.hasOwn(filter.mock.calls[0][1], 'hidden')).toBe(false);
    expect(Object.hasOwn(filter.mock.calls[0][1], 'props')).toBe(false);
    expect(result[0]).not.toBe(hidden);
    expect(result[0].nodes[0]).toBe(alpha);
    const untouched = [hidden];
    expect(filterSelectData(untouched, '', mapped, { filterOption: filter })).toBe(untouched);
    expect(filterSelectData(untouched, 'a', mapped, { filterOption: false })).toBe(untouched);
    expect(filter.mock.calls).toHaveLength(3);
  });

  it('keeps implicit Native matching separate from authoritative predicates and explicit OR fields', () => {
    const data = [{ value: 'a', label: 'Café', alias: ['A', 'B'] }, { value: 'b', label: 'Other' }];
    const native = vi.fn((text: string, item: typeof data[number]) => item.label.normalize('NFKD')
      .toLowerCase().includes(text.trim().normalize('NFKD').toLowerCase()));
    expect(filterSelectData(data, ' CAFE ', fields, { defaultMatch: native })).toEqual([data[0]]);
    expect(filterSelectData(data, 'AB', fields, { defaultMatch: native, optionFilterProp: ['value', 'alias'] }))
      .toEqual([data[0]]);
    expect(native).toHaveBeenCalledTimes(2);
    expect(filterSelectData(data, ' Other ', fields, { optionFilterProp: 'label' })).toEqual([]);
    expect(filterSelectData(data, 'function', fields, { optionFilterProp: 'constructor' })).toEqual([]);
    expect(filterSelectData(data, 'anything', fields, { optionFilterProp: 'missing',
      filterOption: (_, item) => item.value === 'b' })).toEqual([data[1]]);
  });

  it('sorts copied literal options recursively while leaving mapped nodes untouched', () => {
    const nodes = Object.freeze([{ uid: 'b', text: 'Beta', rank: 2 }, { uid: 'a', text: 'Alpha', rank: 1 }]);
    const shadows = Object.freeze([{ value: 'shadow-b', rank: 2 }, { value: 'shadow-a', rank: 1 }]);
    const second = Object.freeze({ key: 'second', rank: 2, heading: 'Two', nodes, options: shadows, meta: {} });
    const first = Object.freeze({ key: 'first', rank: 1, heading: 'One', nodes: [] });
    const input = Object.freeze([second, first]);
    const compare = vi.fn((left: { rank: number }, right: { rank: number }, info: { searchValue: string }) => {
      expect(info).toEqual({ searchValue: 'query' });
      return left.rank - right.rank;
    });
    const result = sortSelectData(input, 'query', compare);

    expect(result.map(item => item.key)).toEqual(['first', 'second']);
    expect(result[0]).toBe(first);
    expect(result[1]).not.toBe(second);
    expect(Reflect.get(result[1], 'options')).toEqual([shadows[1], shadows[0]]);
    expect(result[1].nodes).toBe(nodes);
    expect(Reflect.get(result[1], 'meta')).toBe(second.meta);
    expect(flattenSelectData(result, mapped).map(row => row.value)).toEqual([undefined, undefined, 'b', 'a']);
    expect(compare).toHaveBeenCalledTimes(2);
    expect(sortSelectData(input, 'query')).toBe(input);
    expect(second.options).toBe(shadows);
  });
});

describe('Select raw content and attributes', () => {
  it('copies callback data without changing nested values, descriptors or original records', () => {
    const marker = Symbol('owner');
    const raw = Object.freeze(Object.defineProperty({ value: 'a', label: 'Alpha', ownUndefined: undefined,
      zero: -0, meta: {}, [marker]: 'symbol' }, 'hidden', { value: 'secret' }));
    const copy = copySelectData(raw);
    expect(copy).not.toBe(raw);
    expect(copy.meta).toBe(raw.meta);
    expect(copy[marker]).toBe('symbol');
    expect(Object.is(copy.zero, -0)).toBe(true);
    expect(Object.hasOwn(copy, 'ownUndefined')).toBe(true);
    expect(Object.hasOwn(copy, 'hidden')).toBe(false);
    expect(Object.hasOwn(copy, 'props')).toBe(false);
    expect(Object.getOwnPropertyDescriptor(copy, 'value')?.writable).toBe(true);
    expect(copySelectData(undefined)).toEqual({});
    const explicit = { props: { native: true } };
    expect(copySelectData(explicit).props).toBe(explicit.props);
  });

  it.each([undefined, '', null, false, 0])('uses raw leaf content and title fallbacks (%s)', label => {
    const row = flattenSelectData([{ value: 'a', label }], fields)[0];
    expect(row.label).toBe(label);
    expect(selectDataContent(row)).toBe(label === 0 ? 0 : 'a');
    expect(selectDataTitle(row)).toBe(label === 0 ? '0' : 'a');
    expect(selectDataTitle({ ...row, data: { ...row.data, title: null } })).toBeNull();
  });

  it('does not invoke rich content and keeps group fallback distinct from leaf content', () => {
    const label = vi.fn();
    const row = flattenSelectData([{ value: 'a', label }], fields)[0];
    expect(selectDataContent(row)).toBe(label);
    expect(selectDataTitle(row)).toBeUndefined();
    expect(label).not.toHaveBeenCalled();
    const [group] = flattenSelectData([{ key: 'raw-key', options: [] }], fields);
    expect(selectDataContent(group)).toBe('raw-key');
    expect(selectDataTitle(group)).toBeUndefined();
    const zero = { ...group, label: 0, data: { ...group.data, title: null } };
    expect(selectDataContent(zero)).toBe(0);
    expect(selectDataTitle(zero)).toBe('0');
    expect(selectDataContent({ ...group, label: false })).toBe(false);
  });

  it('forwards Source whitelisted leaf DOM attrs while keeping aria-only raw attributes separate', () => {
    const click = vi.fn(), focus = vi.fn(), double = vi.fn();
    const aliasFields = selectFields({ value: 'id', label: 'aria-label', options: 'nodes', groupLabel: 'data-hidden' });
    const data = { id: 'a', 'aria-label': 'Alpha', 'aria-description': 'Description', role: 'custom',
      'data-extra': 'kept', 'data-hidden': 'mapped', audit: 'private', key: 'key-a',
      children: 'private', nodes: undefined, disabled: true, title: 'Title', style: {},
      className: 'raw-class', class: 'native-class', readOnly: true, tabIndex: 3,
      onClick: click, onFocus: focus, onDoubleClick: double, onAnything: click };
    const row: SelectDataRow<string, typeof data> = { key: 'key-a', data, value: 'a', label: 'Alpha' };

    expect(selectDataAttributes(row, aliasFields)).toEqual({
      physical: { 'aria-description': 'Description', role: 'custom', 'data-extra': 'kept',
        readonly: true, tabindex: 3, onclick: click, onfocusin: focus, ondblclick: double },
      aria: { 'aria-label': 'Alpha', 'aria-description': 'Description', role: 'custom' }
    });
    expect(selectDataAttributes({ ...row, group: true }, aliasFields)).toEqual({
      physical: {}, aria: { 'aria-label': 'Alpha', 'aria-description': 'Description', role: 'custom' }
    });
  });
});

describe('Select stable selected-data cache', () => {
  it('converges by identity and separates removed Native disabled/raw data from the current title', () => {
    const raw = { value: 'a', label: 'Alpha', disabled: true, title: 'Alpha title' };
    const empty = emptySelectDataCache<string, typeof raw>();
    expect(resolveSelectDataCache([], collectSelectData([raw], fields), fields, empty)).toBe(empty);
    const selected = resolveSelectDataCache(['a'], collectSelectData([raw], fields), fields, empty);
    expect(selected.display[0]).toEqual({ value: 'a', label: 'Alpha', data: raw, disabled: true, title: 'Alpha title' });
    expect(resolveSelectDataCache(['a'], collectSelectData([raw], fields), fields, selected)).toBe(selected);
    const removed = resolveSelectDataCache(['a'], collectSelectData([], fields), fields, selected);
    expect(removed).not.toBe(selected);
    expect(removed.labels).toBe(selected.labels);
    expect(removed.options).toBe(selected.options);
    expect(removed.display[0].disabled).toBe(true);
    expect(removed.display[0].title).toBeUndefined();
    expect(removed.options.get('a')).toBe(raw);
    expect(removed.options.get('a')?.title).toBe('Alpha title');
    expect(resolveSelectDataCache(['a'], collectSelectData([], fields), fields, removed)).toBe(removed);
    const cleared = resolveSelectDataCache([], collectSelectData([], fields), fields, removed);
    expect(cleared.labels.size).toBe(0);
    expect(cleared.options.size).toBe(0);
    expect(cleared.display).toEqual([]);
    expect(resolveSelectDataCache([], collectSelectData([], fields), fields, cleared)).toBe(cleared);
  });

  it('patches only undefined labels while replacing the current raw record and metadata', () => {
    type Data = { uid: string; text?: unknown; disabled?: boolean; title?: string };
    const original: Data = { uid: 'a', text: 'Alpha', disabled: true, title: 'Old title' };
    const before = resolveSelectDataCache(['a'], collectSelectData([original], mapped), mapped,
      emptySelectDataCache<string, Data>());
    const replacement: Data = { uid: 'a' };
    const after = resolveSelectDataCache(['a'], collectSelectData([replacement], mapped), mapped, before);
    expect(after.display[0]).toEqual({ value: 'a', label: 'Alpha', data: replacement,
      disabled: undefined, title: undefined });
    expect(after.options.get('a')).toBe(replacement);
    for (const label of [null, false, '', 0]) {
      const current: Data = { uid: 'a', text: label };
      expect(resolveSelectDataCache(['a'], collectSelectData([current], mapped), mapped, after).labels.get('a'))
        .toBe(label);
    }
  });

  it('preserves typed selected order and reuses unchanged entries across reordering', () => {
    const raw = [{ value: 0, label: 'Numeric zero' }, { value: '0', label: 'String zero' }];
    const maps = collectSelectData(raw, fields);
    const first = resolveSelectDataCache([0, '0'], maps, fields, emptySelectDataCache<string | number, typeof raw[number]>());
    const reversed = resolveSelectDataCache(['0', 0], maps, fields, first);
    expect([...reversed.options.keys()]).toEqual(['0', 0]);
    expect(reversed.display[0]).toBe(first.display[1]);
    expect(reversed.display[1]).toBe(first.display[0]);
    expect(resolveSelectDataCache(['0', 0], collectSelectData(raw, fields), fields, reversed)).toBe(reversed);
  });

  it('observes negative zero labels without cloning unchanged raw callback data', () => {
    const raw = { value: 'a', label: 0 };
    const previous = resolveSelectDataCache(['a'], collectSelectData([raw], fields), fields,
      emptySelectDataCache<string, typeof raw>());
    raw.label = -0;
    const next = resolveSelectDataCache(['a'], collectSelectData([raw], fields), fields, previous);
    expect(next).not.toBe(previous);
    expect(Object.is(next.labels.get('a'), -0)).toBe(true);
    expect(next.options).toBe(previous.options);
    expect(next.display[0].data).toBe(raw);
  });
});
