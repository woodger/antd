import { describe, expect, it } from 'vitest';
import reference from '../../tests/browser/fixtures/ant-design-select-token-separators-reference.json';
import { resolveSelectTokenOptions, splitSelectTokens } from './select-token.engine';
import { collectSelectData, selectFields } from './select-data.engine';
import type { SelectOption } from './types';

const options: readonly SelectOption<string | number>[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'locked', label: 'Locked', disabled: true },
  { value: 0, label: 'Zero' }
];
const names = selectFields();
function resolve<Data extends object>(
  input: readonly Data[],
  words: readonly string[],
  tags: boolean,
  properties?: string | readonly string[]
) {
  return resolveSelectTokenOptions(collectSelectData(input, names, properties), words, tags, names);
}

describe('Select token separation source boundaries', () => {
  it('resolves mapped labels to mapped primitive values without injecting canonical fields', () => {
    const fields = selectFields({ value: 'uid', label: 'text', options: 'nodes' });
    const option = Object.freeze({ uid: 'a', text: 'Alpha', meta: { owner: true } });
    const group = { text: 'Group', nodes: [option] };
    const maps = collectSelectData([group], fields);

    expect(resolveSelectTokenOptions(maps, ['Alpha'], false, fields))
      .toEqual([{ value: 'a', data: option }]);
    expect(Object.hasOwn(option, 'value')).toBe(false);
    expect(Object.hasOwn(option, 'label')).toBe(false);
  });

  it('uses the last value record for callbacks while retaining the matched raw label', () => {
    const first = { value: 'a', label: 'First Alpha' };
    const last = { value: 'a', label: 'Last Alpha' };

    expect(resolve([first, last], ['First Alpha'], false))
      .toEqual([{ value: 'a', data: last }]);
    expect(first.label).toBe('First Alpha');
  });

  it('retains an own alias when a later inherited alias shadows Source lookup', () => {
    const first = { value: 'a', label: 'A', alias: 'Alias' };
    const inherited = Object.assign(Object.create({ alias: 'Alias' }), { value: 'b', label: 'B' });

    expect(resolve([first, inherited], ['Alias'], false, 'alias'))
      .toEqual([{ value: 'a', data: first }]);
  });

  for (const entry of reference.cases) {
    it(`resolves source separated values for ${entry.sample.id}`, () => {
      const sample = entry.sample;
      const separators = 'separators' in sample ? sample.separators
        : 'splitter' in sample && sample.splitter === 'csv' ? (text: string) => text.split(',')
          : 'splitter' in sample && sample.splitter === 'spaces' ? (text: string) => text.split(/\s+/)
            : 'splitter' in sample && sample.splitter === 'empty' ? () => []
              : (text: string) => [text];
      const words = splitSelectTokens(sample.text, separators);
      const values = new Set<string | number>('values' in sample ? sample.values : []);
      if (words !== null) {
        const multiple = 'mode' in sample && sample.mode === 'multiple';
        const fields = 'optionFilterProp' in sample ? sample.optionFilterProp : undefined;
        for (const option of resolve(options, words, !multiple, fields)) {
          values.add(option.value);
        }
      }
      const corrected = ['multiple-disabled', 'multiple-explicit-value', 'whitespace-token']
        .includes(sample.id);
      const expected = corrected ? entry.result.values.filter(value => value !== 'locked'
        && value !== '   ') : entry.result.values;

      expect([...values]).toEqual(expected);
    });
  }

  it('preserves raw segments and delimiter order without mutating the owner array', () => {
    const separators = Object.freeze([',', '::']);

    expect(splitSelectTokens(' a,::b::', separators)).toEqual([' a', 'b']);
    expect(splitSelectTokens('a,b', ['', ','])).toBeNull();
    expect(splitSelectTokens(',,', [','])).toEqual([]);
    expect(splitSelectTokens('a', [])).toBeNull();
    expect(separators).toEqual([',', '::']);
  });

  it('distinguishes numeric values, raw labels, explicit fields and last duplicate labels', () => {
    const duplicates = [...options, { value: 'last', label: 'Alpha' }];

    expect(resolve(duplicates, ['Alpha', '0'], false))
      .toEqual([{ value: 'last', data: duplicates.at(-1) }]);
    expect(resolve(options, ['0', 'a'], false, ['value']))
      .toEqual([{ value: 'a', data: options[0] }]);
    expect(resolve(options, ['Zero'], false)).toEqual([{ value: 0, data: options[2] }]);
    expect(resolve(options, ['0'], true)).toEqual([{ value: '0', data: undefined }]);
  });

  it('rejects implicit blank tags while accepting explicit whitespace options and padded values', () => {
    const explicit = { value: ' ', label: 'Space' };

    expect(resolve([explicit], [' ', '   ', ' padded '], true))
      .toEqual([{ value: ' ', data: explicit }, { value: ' padded ', data: undefined }]);
  });

  it('ignores inherited option fields and disabled additions in both modes', () => {
    const inherited = Object.assign(Object.create({ alias: 'Alias' }), options[0]);

    expect(resolve([inherited], ['Alias'], false, 'alias')).toEqual([]);
    expect(resolve(options, ['Locked'], false)).toEqual([]);
    expect(resolve(options, ['locked'], true)).toEqual([]);
  });
});
