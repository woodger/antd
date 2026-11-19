import { describe, expect, it } from 'vitest';
import reference from '../../tests/browser/fixtures/ant-design-select-sort-reference.json';
import { matchesSelectDataLabel } from './select.engine';
import { collectSelectData, emptySelectDataCache, filterSelectData, flattenSelectData,
  resolveSelectDataCache, selectDataContent, selectFields, sortSelectData } from './select-data.engine';
import { getSelectTagOptions } from './select-tags.engine';
import type { SelectSearchConfig } from './select.types';
const fields = selectFields();

describe('Select search sorting source boundaries', () => {
  for (const entry of reference.cases) {
    it(`retains source sorted options for ${entry.sample.id}`, () => {
      const sample = entry.sample;
      const options = sample.options;
      const field = 'field' in sample ? sample.field : undefined;
      const filter = 'filter' in sample ? sample.filter : true;
      const maps = collectSelectData(options, fields, field);
      const selected = resolveSelectDataCache(sample.values, maps, fields, emptySelectDataCache());
      const filtered = sample.mode === 'tags'
        ? getSelectTagOptions(options, selected.display, maps, fields, sample.search,
          { filterOption: filter, optionFilterProp: field })
        : filterSelectData(options, sample.search, fields,
          { filterOption: filter, optionFilterProp: field, defaultMatch: matchesSelectDataLabel });
      const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
      const sorter: SelectSearchConfig<string | number>['filterSort'] = sample.sort === 'none'
        ? undefined : (a, b, { searchValue }) => {
          if (sample.sort === 'equal') {
            return 0;
          }
          if (sample.sort === 'value') {
            return compare(String(a.value), String(b.value));
          }
          const order = compare(String(a.label).toLowerCase(), String(b.label).toLowerCase());
          return sample.sort === 'desc'
            || sample.sort === 'query' && searchValue.trim() === 'turn' ? -order : order;
        };
      const sorted = sortSelectData(filtered, sample.search, sorter);

      expect(flattenSelectData(sorted, fields).map(row => ({ ...row.data,
        label: String(selectDataContent(row)), disabled: Boolean(row.data.disabled) })))
        .toEqual(entry.options);
      expect(entry.ownerOptionsUnchanged).toBe(true);
    });
  }

  it('retains owner references and stable ties without changing frozen input', () => {
    const a = { value: 'a', label: 'A' };
    const b = { value: 'b', label: 'B' };
    const options = Object.freeze([b, a]);
    const queries: string[] = [];
    const sorted = sortSelectData(options, ' raw ', (first, second, info) => {
      queries.push(info.searchValue);
      expect(options.includes(first)).toBe(true);
      expect(options.includes(second)).toBe(true);
      return first.label < second.label ? -1 : 1;
    });

    expect(sorted).toEqual([a, b]);
    expect(sorted[0]).toBe(a);
    expect(options).toEqual([b, a]);
    expect(queries).toEqual([' raw ']);
    expect(sortSelectData(options, '', () => 0)).toEqual([b, a]);
    expect(sortSelectData(options, '')).toBe(options);
  });
});
