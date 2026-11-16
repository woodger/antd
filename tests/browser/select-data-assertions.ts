import type { Page } from '@playwright/test';
import { expect } from './test';
import { drainSelectData } from './select-data-driver';
import { readSelectData } from './select-data-metrics';
import type { SelectDataSample } from './fixtures/select-data-cases';
import type { SelectDataSnapshot } from './select-data-reference';
import { selectDataMappedAriaFields, selectDataNativeView } from './select-data-native';

export async function settleSelectData(page: Page) {
  let previous = '', stable = 0;
  for (let attempt = 0; attempt < 90; attempt++) {
    await drainSelectData(page);
    const actual = await page.evaluate(readSelectData);
    const key = JSON.stringify(actual);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 3) return actual;
    previous = key;
  }
  throw Error('Select data inputs, physical list or complete callback ledger did not settle');
}
function rawCopyReceipt(value: unknown) {
  if (!value || typeof value !== 'object') throw Error('Missing actual raw option receipt');
  const receipt = value as { ownProperties: Array<Record<string, unknown>>; originalOwnProperties: Array<Record<string, unknown>> };
  const compatibility = receipt.ownProperties.find(property => property.key === 'props');
  if (!compatibility) return value;
  expect(compatibility).toEqual({ key: 'props', enumerable: false, configurable: false,
    kind: 'accessor', get: true, set: false });
  expect(receipt.originalOwnProperties.some(property => property.key === 'props')).toBe(false);
  // Только явно исключённый deprecated getter; данные и остальные descriptors проверяются целиком.
  return { ...receipt, ownProperties: receipt.ownProperties.filter(property => property.key !== 'props') };
}
function verifyArguments(actual: ReturnType<typeof readSelectData>, source: SelectDataSnapshot, label: string) {
  const current = actual.raw.eventArguments as unknown[][];
  const expected = source.raw.eventArguments as unknown[][];
  expect(current.length, `${label}: complete raw callback count`).toBe(expected.length);
  for (const [index, event] of expected.entries()) {
    if (!['change', 'select', 'deselect'].includes(String(event[0]))) {
      expect(current[index], `${label}: raw callback ${index}`).toEqual(event);
      continue;
    }
    const argument = Array.isArray(event[2]) ? event[2].map(rawCopyReceipt) : rawCopyReceipt(event[2]);
    expect(current[index], `${label}: shallow raw option ${index}`).toEqual([event[0], event[1], argument]);
  }
}
export function verifySelectData(actual: ReturnType<typeof readSelectData>, source: SelectDataSnapshot, sample: SelectDataSample, label: string) {
  for (const correction of selectDataMappedAriaFields(source.view, sample)) {
    const original = source.view.popup!.viewport.aria.find(listbox => listbox.id === correction.listbox)!
      .options.find(option => option.id === correction.id)!;
    const native = actual.view.popup?.viewport.aria.find(listbox => listbox.id === correction.listbox)
      ?.options.find(option => option.id === correction.id);
    expect(original.selected, `${label}: pinned Source mapped-ARIA contradiction`).toBe('false');
    expect(native?.selected, `${label}: Native logical mapped aria-selected ${correction.id}`).toBe('true');
  }
  expect(actual.view, `${label}: full Source view with explicit proven Native fields`).toEqual(selectDataNativeView(source.view, sample));
  expect(actual.view.leaks).toEqual([]);
  expect(actual.raw.methods).toEqual({ focus: true, blur: true, scrollTo: true });
  expect(actual.raw.publicRoot).toEqual({ tag: 'DIV', sameRoot: true });
  expect(actual.raw.publicEditor).toEqual({ tag: 'INPUT', sameEditor: true });
  verifyArguments(actual, source, label);
}
