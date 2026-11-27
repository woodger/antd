import { describe, expect, it } from 'vitest';
import reference from '../../../tests/browser/fixtures/ant-design-select-tags-options-reference.json';
import { collectSelectData, emptySelectDataCache, flattenSelectData, resolveSelectDataCache,
  selectDataContent, selectFields } from './select-data.engine';
import { getSelectTagOptions } from './select-tags.engine';
import type { SelectOption } from '../types';
const names = selectFields();

describe('Select tag option source boundaries', () => {
  it('pins the official renderer and studied dependency without the deprecated tags prop', () => {
    expect(reference.reference.version).toBe('6.6.8');
    expect(reference.reference.revision).toBe('984592267de88fbf9cdaecc96a56629e721c709d');
    expect(reference.reference.rcSelectStudyVersion).toBe('1.10.1');
    expect(reference.cases).toHaveLength(28);
  });

  for (const entry of reference.cases) {
    it(`resolves source tag options for ${entry.sample.id}`, () => {
      const options: readonly SelectOption<string | number>[] = entry.sample.options;
      const filter = 'filter' in entry.sample ? entry.sample.filter : undefined;
      const predicate = filter === 'none' ? () => false
        : filter === 'label' ? (search: string, option: SelectOption<string | number>) =>
          option.label.includes(search) : filter === false ? false : true;
      const fields = 'optionFilterProp' in entry.sample ? entry.sample.optionFilterProp : undefined;
      const maps = collectSelectData<string | number, SelectOption<string | number>>(
        options,
        names,
        fields
      );
      const selected = resolveSelectDataCache(
        entry.sample.values,
        maps,
        names,
        emptySelectDataCache()
      );
      const result = flattenSelectData(getSelectTagOptions(
        options, selected.display, maps, names, entry.sample.search,
        { filterOption: predicate, optionFilterProp: fields }
      ), names).map(row => ({
        ...row.data,
        label: String(selectDataContent(row)),
        disabled: Boolean(row.data.disabled)
      }));

      if (entry.sample.id === 'whitespace') {
        expect(entry.options).toEqual([{ value: '   ', label: '   ', disabled: false }]);
        expect(result).toEqual([]);
      }
      else {
        expect(result).toEqual(entry.options);
      }
    });
  }

  it('retains cached selected labels/disabled state and never mutates owner options', () => {
    const options = Object.freeze([{ value: 'a', label: 'Alpha' }]);
    const locked = { value: 'locked', label: 'Retained', disabled: true };
    const cached = resolveSelectDataCache(
      ['locked'],
      collectSelectData([locked], names),
      names,
      emptySelectDataCache()
    );
    const maps = collectSelectData(options, names);
    const selected = resolveSelectDataCache(['locked'], maps, names, cached);
    const result = getSelectTagOptions(options, selected.display, maps, names, '');

    expect(result).toEqual([options[0], locked]);
    expect(options).toHaveLength(1);
    expect(cached.options.size).toBe(1);
  });
});
