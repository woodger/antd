import { expect, it } from 'vitest';
import { readSelectTagCloseHandlesCachedOptionCase, readSelectTagCloseHandlesCachedOptionManifest,
  validateSelectTagCloseHandlesCachedOptionCase } from '../browser/select-components-tag-close-handles-cached-option-reference';
import { readTagCloseHandleSourceArray } from '../browser/select-components-tag-close-handles-reference';
const source = readSelectTagCloseHandlesCachedOptionCase();

it('retains both complete independent cached-option counter captures without Native-derived data', () => {
  const manifest = readSelectTagCloseHandlesCachedOptionManifest();

  expect(manifest.SourceOnly).toBe(true);
  expect(manifest.NativeDataUsed).toBe(false);
  expect(manifest.rawPair.wholeByteEqual).toBe(true);
  expect(manifest.rawPair.first.sha256).toBe(manifest.rawPair.repeat.sha256);
  expect(manifest.serialization).toEqual({
    losslessWholeRawBytes: true,
    fieldsDropped: [],
    rewrittenValues: [],
    normalizedSourceFields: []
  });
});
it('keeps the actual cached deselect payload after current options drop the selected option', () => {
  expect(source.steps[0].owner.optionIdentities.map(option => option.value)).toEqual(['b']);
  expect([source.initial, ...source.steps].map(point => readTagCloseHandleSourceArray(point.owner.model))).toEqual([['a', 'b'], ['a', 'b'], ['b']]);
  const option = readTagCloseHandleSourceArray(source.ledger.events[2])[2] as { properties: Array<{
    key: string;
    value?: unknown;
    accessor?: unknown
  }> };

  expect(option.properties.filter(row => row.key !== 'props')).toEqual([
    { key: 'key', value: 'option-a' }, { key: 'value', value: 'a' }, {
      key: 'label',
      value: 'Alpha old'
    }, {
      key: 'marker',
      value: 'initial-a'
    }
  ]);
  expect(option.properties.find(row => row.key === 'props')?.accessor).toBeTruthy();
  expect(source.ledger.invocations[0].actualArgumentCount).toBe(1);
  expect(readTagCloseHandleSourceArray(source.ledger.invocations[0].arguments)).toEqual([{ $: 'undefined' }]);
  expect(source.ledger.invocations[0].result).toEqual({ $: 'undefined' });
});
it('rejects missing current-option replacement, altered cached payload or an incomplete counter', () => {
  expect(() => validateSelectTagCloseHandlesCachedOptionCase({
    ...source,
    steps: source.steps.slice(0, 1)
  })).toThrow();
  const events = structuredClone(source.ledger.events), values = readTagCloseHandleSourceArray(events[2]);
  const option = values[2] as { properties: Array<{ key: string; value?: unknown }> };
  option.properties.find(row => row.key === 'label')!.value = 'Alpha updated';

  expect(() => validateSelectTagCloseHandlesCachedOptionCase({
    ...source,
    ledger: { ...source.ledger, events }
  })).toThrow();
});
