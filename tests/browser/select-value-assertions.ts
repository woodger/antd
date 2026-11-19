import type { Page } from '@playwright/test';
import { expect } from './test';
import { drainSelectValue } from './select-value-driver';
import { readSelectValue } from './select-value-metrics';
import { verifySelectValueEncoding, verifySelectValueOption, verifySelectValueProducerCalls,
  verifySelectValueReceipts } from './select-value-receipts';
import type { SelectValueSnapshot } from './select-value-reference';
import type { SelectValueSample } from './fixtures/select-value-cases';
import { selectValueNativeView, selectValuePublicClasses } from './select-value-native';

export async function settleSelectValue(page: Page) {
  let previous = '', stable = 0;
  for (let attempt = 0; attempt < 90; attempt++) {
    await drainSelectValue(page);
    const actual = await page.evaluate(readSelectValue);
    const key = JSON.stringify(actual);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 3) {
      return actual;
    }
    previous = key;
  }
  throw Error('Select value DOM, public owner and complete callback ledger did not settle');
}

export function verifySelectValue(actual: ReturnType<typeof readSelectValue>, source: SelectValueSnapshot,
  sample: SelectValueSample, label: string, options: { hydratedInitial?: boolean } = {}) {
  verifySelectValueReceipts(actual.view.receipts, source.view.receipts);
  expect(actual.raw.methods).toEqual({ focus: true, blur: true, scrollTo: true });
  expect(actual.raw.publicRoot).toEqual({ tag: 'DIV', sameRoot: true });
  expect(actual.raw.publicEditor).toEqual({ tag: 'INPUT', sameEditor: true });
  const currentEvents = actual.raw.eventArguments as unknown[][];
  const originalEvents = source.raw.eventArguments as unknown[][];
  expect(currentEvents.length, `${label}: every raw callback`).toBe(originalEvents.length);
  for (const [index, event] of originalEvents.entries()) {
    const current = currentEvents[index];
    if (!['change', 'select', 'deselect'].includes(String(event[0]))) {
      expect(current).toEqual(event);
      continue;
    }
    expect(current[0]).toBe(event[0]);
    expect(current[3]).toEqual(event[3]);
    const semantics = event[3] as { semanticValue: unknown };
    verifySelectValueEncoding(current[1], event[1], semantics.semanticValue);
    if (Array.isArray(event[2])) {
      expect(Array.isArray(current[2])).toBe(true);
      expect((current[2] as unknown[]).length).toBe(event[2].length);
      for (const [item, option] of event[2].entries()) {
        verifySelectValueOption(
          (current[2] as unknown[])[item],
          option
        );
      }
    }
    else verifySelectValueOption(current[2], event[2]);
  }
  // Client render scheduling differs between React and Svelte. Every invocation remains
  // in raw evidence; compare all semantic invocations and every raw argument/result.
  type Producer = { rawArgument: unknown; rawResult: unknown };
  const originals = source.raw.producerCalls as Array<Producer>;
  for (const entry of actual.raw.producerCalls as Array<Producer>) {
    const { rawArgument: _argument, rawResult: _result, ...common } = entry;
    const match = originals.find(candidate => {
      const { rawArgument: _argument, rawResult: _result, ...semantic } = candidate;
      return JSON.stringify(common) === JSON.stringify(semantic);
    });
    expect(match, `${label}: actual renderer invocation belongs to original trace`).toBeDefined();
    verifySelectValueProducerCalls([entry], [match!]);
  }
  const { receipts: _current, ...current } = selectValuePublicClasses(actual);
  const { receipts: _original, ...original } = selectValueNativeView(source.view, sample, options);
  if (options.hydratedInitial) {
    expect(source.view.events).toEqual([]);
    expect(source.view.editor).toMatchObject({ expanded: 'false', focused: false });
    expect(actual.view.editor.caret).toEqual([0, 0]);
  }
  expect(
    current,
    `${label}: complete selected-value Source view with measured Native editor contract`
  ).toEqual(original);
}
