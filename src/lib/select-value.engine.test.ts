import { describe, expect, it } from 'vitest';
import { collectSelectData, selectFields } from './select-data.engine';
import { convertSelectValues, emptySelectValueCache, resolveSelectValueCache,
  selectValueDrafts, selectValueEvent, selectValueOutput, selectValueRaw, keepSelectSuppliedValue, hasSelectLabelFeatures,
  selectValueText, selectValueTitle } from './select-value.engine';

describe('Select labeled values', () => {
  const fields = selectFields({ value: 'uid', label: 'text' });
  const meta = { owner: 'raw' };
  interface RawOption { uid: string | number; text?: unknown; caption?: unknown; disabled?: boolean; title?: string; meta?: object }
  const data: readonly RawOption[] = Object.freeze([
    Object.freeze({ uid: 'a', text: 'Alpha', caption: 'Caption', disabled: true, title: 'Raw title', meta }),
    Object.freeze({ uid: 0, text: 0, caption: null, meta }),
    Object.freeze({ uid: '0', text: false, caption: '', meta })
  ]);
  const maps = collectSelectData<string | number, RawOption>(data, fields);

  it('fills only undefined supplied labels and ignores supplied internal metadata', () => {
    const drafts = [{ value: 'a', label: undefined, key: 'authored', title: 'Ignored', disabled: false },
      { value: 0, label: null }, { value: '0', label: false }];
    const result = convertSelectValues(drafts, maps, fields, 'caption');

    expect(result).toEqual([
      { label: 'Caption', value: 'a', key: 'a', disabled: true, title: 'Raw title' },
      { label: null, value: 0, key: 0, disabled: undefined, title: undefined },
      { label: false, value: '0', key: '0', disabled: undefined, title: undefined }
    ]);
    expect(Object.keys(result[0])).toEqual(['label', 'value', 'key', 'disabled', 'title']);
    expect(drafts[0].key).toBe('authored');
    expect(data[0].meta).toBe(meta);
  });

  it('preserves empty and numeric labels and uses mapped label for an empty optionLabelProp', () => {
    expect(convertSelectValues(['a', 0, '0'], maps, fields, '').map(item => item.label))
      .toEqual(['Alpha', 0, false]);
    expect(convertSelectValues([{ value: 'a', label: '' }, { value: 0, label: 0 }], maps, fields)
      .map(item => item.label)).toEqual(['', 0]);
  });

  it('normalizes explicit null and keeps Native distinct numeric and string selections', () => {
    const input = Object.freeze([0, '0', { value: 0, label: 'Duplicate' }, { value: 'a', label: 'Supplied' }]);
    expect(selectValueDrafts(null, false)).toEqual([]);
    expect(selectValueDrafts(null, true)).toEqual([]);
    expect(selectValueDrafts(undefined, false)).toEqual([]);
    expect(selectValueDrafts(input, true)).toEqual([0, '0', input[3]]);
    expect(selectValueRaw({ value: 0 })).toBe(0);
    expect(selectValueRaw({ value: '0' })).toBe('0');
    expect(selectValueRaw({ value: { nested: true } })).toBeUndefined();
  });

  it('emits only label and value in labeled outputs and keeps ordinary primitive callbacks', () => {
    const items = convertSelectValues([{ value: 'a', label: meta }, 0], maps, fields);
    const labeled = selectValueOutput(items, true, true);
    expect(labeled).toEqual([{ label: meta, value: 'a' }, { label: 0, value: 0 }]);
    expect(Object.keys((labeled as object[])[0])).toEqual(['label', 'value']);
    expect((labeled as Array<{ label: unknown }>)[0].label).toBe(meta);
    expect(selectValueOutput(items, false, false)).toBe('a');
    expect(selectValueOutput(items, true, false)).toEqual(['a', 0]);
    expect(selectValueOutput([], false, true)).toBeUndefined();
    expect(selectValueOutput([], true, true)).toEqual([]);
  });

  it('gets select and deselect labels from the mapped raw option independently of outgoing change labels', () => {
    expect(selectValueEvent('a', data[0], fields, true)).toEqual({ label: 'Alpha', value: 'a' });
    expect(selectValueEvent('a', data[0], fields, false)).toBe('a');
    expect(selectValueEvent('free', undefined, fields, true)).toEqual({ label: undefined, value: 'free' });
  });

  it('keeps supplied controlled labels on raw-noop reselect without changing ordinary Native local shadows', () => {
    const supplied = { value: 'a', label: 'Supplied' };
    expect(keepSelectSuppliedValue(supplied, supplied, 'a')).toBe(true);
    expect(keepSelectSuppliedValue({ value: 0, label: false }, { value: 0, label: false }, 0)).toBe(true);
    expect(keepSelectSuppliedValue(supplied, undefined, 'a')).toBe(false);
    expect(keepSelectSuppliedValue('a', 'a', 'a')).toBe(false);
    expect(keepSelectSuppliedValue({ value: 'b' }, supplied, 'b')).toBe(false);
    expect(keepSelectSuppliedValue({ value: '0' }, { value: 0 }, '0')).toBe(false);
    expect(keepSelectSuppliedValue(undefined, {}, undefined)).toBe(false);
  });

  it('enables labeled snapshots for explicit features and rich drafts but leaves ordinary primitive refresh active', () => {
    const snapshot = [{ label: 'Beta' }];
    expect(hasSelectLabelFeatures(undefined, undefined, undefined, ['b'], snapshot)).toBe(false);
    expect(hasSelectLabelFeatures(undefined, 'alternate', undefined, ['b'], snapshot)).toBe(true);
    expect(hasSelectLabelFeatures(undefined, '', undefined, ['b'], snapshot)).toBe(true);
    expect(hasSelectLabelFeatures(false, undefined, undefined, ['b'], snapshot)).toBe(true);
    expect(hasSelectLabelFeatures(undefined, undefined, () => null, ['b'], snapshot)).toBe(true);
    expect(hasSelectLabelFeatures(undefined, undefined, undefined, [{ value: 'b', label: 'Owner' }])).toBe(true);
    expect(hasSelectLabelFeatures(undefined, undefined, undefined, ['b'], [{ label: ['Beta'] }])).toBe(true);
    expect(hasSelectLabelFeatures(undefined, undefined, undefined, ['b'], [{ label: () => null }])).toBe(true);
  });

  it('keeps the interaction label available for a later optionLabelProp change', () => {
    const initial = convertSelectValues(['a'], maps, fields);
    const selected = convertSelectValues(['0'], maps, fields);
    const stored = resolveSelectValueCache(selected, maps, fields,
      resolveSelectValueCache(initial, maps, fields, emptySelectValueCache()), 'caption');
    expect(stored.values[0].label).toBe(false);
    expect(convertSelectValues(['0'], maps, fields, 'caption')[0].label).toBe('');
  });

  it('caches the display label and raw option independently of current renderer metadata', () => {
    const initial = resolveSelectValueCache(['a'], maps, fields, emptySelectValueCache(), 'caption');
    const removed = resolveSelectValueCache(['a'], collectSelectData([], fields), fields, initial, 'caption');

    expect(removed.values).toEqual([{ label: 'Caption', value: 'a', key: 'a', disabled: undefined, title: undefined }]);
    expect(removed.display[0]).toEqual({ label: 'Caption', value: 'a', disabled: true, title: undefined, data: data[0] });
    expect(removed.options.get('a')).toBe(data[0]);
    expect(removed.options.get('a')?.title).toBe('Raw title');
    expect(convertSelectValues(['a'], collectSelectData([], fields), fields)[0].label).toBeUndefined();
    expect(resolveSelectValueCache([], maps, fields, removed).options.size).toBe(0);
  });

  it('refreshes current metadata and lets null or false replace an old cached label', () => {
    const initial = resolveSelectValueCache(['a'], maps, fields, emptySelectValueCache());
    const update = collectSelectData<string | number, RawOption>([{ uid: 'a', text: undefined, disabled: false, title: 'Next' }], fields);
    const cached = resolveSelectValueCache(['a'], update, fields, initial);
    expect(cached.values[0]).toEqual({ label: 'Alpha', value: 'a', key: 'a', disabled: false, title: 'Next' });
    const cleared = resolveSelectValueCache([{ value: 'a', label: null }], update, fields, cached);
    expect(cleared.values[0].label).toBeNull();
    expect(resolveSelectValueCache([{ value: 'a', label: false }], update, fields, cleared).values[0].label).toBe(false);
  });

  it('converges cache identity without erasing supplied rich label identity', () => {
    const draft = [{ value: 'a', label: meta }];
    const initial = resolveSelectValueCache(draft, maps, fields, emptySelectValueCache());
    const again = resolveSelectValueCache(draft, maps, fields, initial);
    expect(again).toBe(initial);
    expect(again.values).toBe(initial.values);
    expect(again.display).toBe(initial.display);
    expect(again.values[0].label).toBe(meta);
  });

  it('reads plain text without invoking opaque snippets and follows scalar title fallbacks', () => {
    const snippet = () => { throw Error('Snippet is a renderer, not an editor text getter'); };
    expect(selectValueText(['Alpha', 0, [false, null, undefined, snippet, 'Beta']])).toBe('Alpha0Beta');
    expect(selectValueText(snippet)).toBe('');
    expect(selectValueTitle({ title: 0, label: 'Label' })).toBe('0');
    expect(selectValueTitle({ title: null, label: 'Label' })).toBe('Label');
    expect(selectValueTitle({ label: snippet })).toBeUndefined();
  });
});
