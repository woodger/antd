import { describe, it, expect } from 'vitest';
import { autoCompleteMatchesData, autoCompleteNext } from './auto-complete.engine';
import { filterSelectData, flattenSelectData, selectFields } from '../select/select-data.engine';
import type { AutoCompleteItem } from './auto-complete.types';
import type { SelectDataFilter } from '../select/select-data.types';
const fields = selectFields();
function filterOptions(
  search: string,
  filterOption: SelectDataFilter<AutoCompleteItem>['filterOption'] = false
) {
  return filterSelectData(
    options,
    search,
    fields,
    { filterOption, defaultMatch: autoCompleteMatchesData }
  );
}
const options: AutoCompleteItem[] = [
  {
    label: 'Team',
    options: [{ value: 'alpha', label: 'Other' }, { value: 'beta', disabled: true }]
  },
  { value: 'gamma' }
];
describe('AutoComplete source options', () => {
  it(
    'keeps unfiltered suggestions by default and filters values without trimming or accent folding',
    () => {
      expect(filterOptions('missing')).toBe(options);
      expect(
        flattenSelectData(filterOptions('ALP', true), fields).map(
          entry => entry.key
        )
      ).toEqual(
        ['rc-index-key-0', 'alpha']
      );
      expect(filterOptions(' alp', true)).toEqual([]);
    }
  );
  it(
    'keeps a matching group whole and filters by original raw fields',
    () => {
      expect(filterOptions('team', true)).toEqual([options[0]]);
      expect(filterOptions('Other', (text, item) => item
        .label === text))
        .toEqual(
          [{ label: 'Team', options: [{ value: 'alpha', label: 'Other' }] }]
        );
    }
  );
  it('skips group headers and disabled options and wraps in either direction', () => {
    const entries = flattenSelectData(options, fields);

    expect(autoCompleteNext(entries, -1, 1)).toBe(1);
    expect(autoCompleteNext(entries, 1, 1)).toBe(3);
    expect(autoCompleteNext(entries, 1, -1)).toBe(3);
    expect(autoCompleteNext([], -1, 1)).toBe(-1);
  });
});
