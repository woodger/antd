import { expect } from '@playwright/test';
import { selectValueNodeRecipe, selectValueNodeTokens } from './fixtures/select-value-cases';

type Encoded = {
  type: string;
  token?: string;
  sameOriginal?: boolean;
  value?: unknown;
  entries?: Array<[string, Encoded]>;
  items?: Encoded[];
};

function field(value: Encoded, name: string) {
  return value.entries?.find(([key]) => key === name)?.[1];
}

/** Known authored React elements and Svelte Snippets retain separate raw representations. */
export function verifySelectValueEncoding(actual: unknown, source: unknown, semantic: unknown) {
  const common = semantic as Encoded;
  const current = actual as Encoded;
  const original = source as Encoded;
  if (common.type === 'rich-node') {
    expect(common.sameOriginal).toBe(true);
    expect(selectValueNodeTokens).toContain(common.token);
    const recipe = selectValueNodeRecipe(common.token!);
    expect(original.type).toBe('object');
    expect(field(original, '$$typeof')).toEqual({ type: 'symbol', value: 'Symbol(react.element)' });
    expect(field(original, 'type')).toEqual({ type: 'string', value: recipe.tag });
    const props = field(original, 'props')!;
    expect(field(props, 'data-select-value-node')).toEqual({ type: 'string', value: common.token });
    expect(field(props, 'children')).toEqual({ type: 'string', value: recipe.text });
    expect(current.type).toBe('function');
    expect(typeof current.value).toBe('string');
    return;
  }
  if (common.type === 'object') {
    expect(current.type).toBe('object');
    expect(original.type).toBe('object');
    const keys = common.entries!.map(([key]) => key);
    expect(current.entries!.map(([key]) => key)).toEqual(keys);
    expect(original.entries!.map(([key]) => key)).toEqual(keys);
    for (const [index, [, child]] of common.entries!.entries()) {
      verifySelectValueEncoding(current.entries![index][1], original.entries![index][1], child);
    }
    return;
  }
  if (common.type === 'array') {
    expect(current.type).toBe('array');
    expect(original.type).toBe('array');
    expect(current.items!.length).toBe(common.items!.length);
    expect(original.items!.length).toBe(common.items!.length);
    for (const [index, child] of common.items!.entries()) {
      verifySelectValueEncoding(current.items![index], original.items![index], child);
    }
    return;
  }
  expect(current).toEqual(original);
  expect(original).toEqual(common);
}

interface OptionReceipt {
  data: unknown;
  semanticData: unknown;
  ownProperties: Array<Record<string, unknown>>;
  originalOwnProperties: Array<Record<string, unknown>>;
}
function withoutDeprecatedGetter(receipt: OptionReceipt) {
  const compatibility = receipt.ownProperties.find(property => property.key === 'props');
  if (!compatibility) {
    return receipt;
  }
  expect(compatibility).toEqual({ key: 'props', enumerable: false, configurable: false,
    kind: 'accessor', get: true, set: false });
  expect(receipt.originalOwnProperties.some(property => property.key === 'props')).toBe(false);
  return {
    ...receipt,
    ownProperties: receipt.ownProperties.filter(property => property.key !== 'props')
  };
}
export function verifySelectValueOption(actual: unknown, source: unknown) {
  const { data: currentData, ...current } = actual as OptionReceipt;
  const { data: originalData, ...original } = withoutDeprecatedGetter(source as OptionReceipt);
  expect(current).toEqual(original);
  verifySelectValueEncoding(currentData, originalData, original.semanticData);
}

export function verifySelectValueReceipts(actual: unknown, source: unknown) {
  type Receipts = { options: { rows: Array<{ common: unknown; raw: OptionReceipt }> } };
  const { options: currentOptions, ...current } = actual as Receipts;
  const { options: originalOptions, ...original } = source as Receipts;
  expect(current).toEqual(original);
  const { rows: currentRows, ...currentData } = currentOptions;
  const { rows: originalRows, ...originalData } = originalOptions;
  expect(currentData).toEqual(originalData);
  expect(currentRows.length).toBe(originalRows.length);
  for (const [index, row] of originalRows.entries()) {
    expect(currentRows[index].common).toEqual(row.common);
    verifySelectValueOption(currentRows[index].raw, row.raw);
  }
}

export function verifySelectValueProducerCalls(actual: unknown[], source: unknown[]) {
  expect(actual.length).toBe(source.length);
  for (const [index, entry] of source.entries()) {
    type Producer = { argument: unknown; result: unknown; rawArgument: unknown; rawResult: unknown };
    const { rawArgument: currentArgument, rawResult: currentResult, ...current } = actual[index] as Producer;
    const { rawArgument: originalArgument, rawResult: originalResult, ...original } = entry as Producer;
    expect(current).toEqual(original);
    verifySelectValueEncoding(currentArgument, originalArgument, original.argument);
    verifySelectValueEncoding(currentResult, originalResult, original.result);
  }
}
