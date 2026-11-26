import { createHash } from 'node:crypto';
import { readReferenceBytes } from './reference-bytes';
import { test, expect } from './test';
import { selectDataDiagnosticSamples, selectDataActions } from './fixtures/select-data-cases';
import { actSelectData, prepareSelectData } from './select-data-driver';
import { settleSelectData, verifySelectData } from './select-data-assertions';
import { readSelectDataAriaIntegrity } from './select-data-native';
import type { SelectDataSourceCase } from './select-data-reference';

const bytes = readReferenceBytes('ant-design-select-data-diagnostic-reference.json.gz');
expect(createHash('sha256').update(bytes).digest('hex'))
  .toBe('ff98cfb57e40d5fd5938d3c24ffdfeb056e604f2e121f586fbf29ca92f8473d6');
const source = JSON.parse(bytes.toString('utf8')) as {
  reference: {
    revision: string;
    errors: unknown[];
    diagnostics: unknown[];
    viewport: { width: number; height: number }
  };
  cases: SelectDataSourceCase[];
};
test.use({ viewport: source.reference.viewport });
test.beforeAll(() => {
  expect(source.reference.revision).toBe('984592267de88fbf9cdaecc96a56629e721c709d');
  expect(source.reference.errors).toEqual([]);
  expect(source.reference.diagnostics).toEqual([{ current: {
    id: 'select-diagnostic-null-value',
    action: 'mount'
  },
    message: 'Warning: `value` in Select options should not be `null`.' }]);
  expect(source.cases.map(entry => entry.id)).toEqual(selectDataDiagnosticSamples.map(sample => sample.id));
});
for (const sample of selectDataDiagnosticSamples.filter(sample =>
  ['diagnostic-own-children', 'diagnostic-nested-group'].includes(sample.scenario))) {
  test(`Select raw data preserves Source boundary for ${sample.id}`, async ({ page }, testInfo) => {
    const entry = source.cases.find(entry => entry.id === sample.id)!;

    expect(entry.steps.map(step => step.action)).toEqual(selectDataActions(sample));
    const trace: unknown[] = [];
    await page.goto('/?fixture=select-data');
    await page.getByRole('combobox', { name: 'Select data sample', exact: true }).selectOption(sample.id);

    await expect(page.locator('[data-select-data-case]')).toHaveAttribute(
      'data-select-data-bound',
      'true'
    );
    await prepareSelectData(page);
    try {
      const initial = await settleSelectData(page);
      trace.push({ phase: 'initial', actual: initial });
      verifySelectData(initial, entry.initial, sample, `${sample.id}/initial`);
      for (const step of entry.steps) {
        await actSelectData(page, step.action);
        const actual = await settleSelectData(page);
        trace.push({ action: step.action, actual });
        verifySelectData(actual, step, sample, `${sample.id}/${JSON.stringify(step.action)}`);
        expect(await page.evaluate(readSelectDataAriaIntegrity)).toBe(true);
      }
    } finally {
      await testInfo.attach(
        'raw-diagnostic-boundary',
        { body: JSON.stringify(trace, null, 2), contentType: 'application/json' }
      );
    }
  });
}

test('Select token separators resolve mapped logical value and preserve its raw callback record', async ({ page }) => {
  const sample = selectDataDiagnosticSamples.find(sample => sample.scenario === 'diagnostic-mapped-token-split')!;
  const entry = source.cases.find(entry => entry.id === sample.id)!;
  // Actual original bug remains frozen: the label is consumed but literal option.value is absent.
  expect(entry.steps[1].view.model).toEqual({ type: 'array', items: [] });
  expect(entry.steps[1].view.query).toBe('');
  expect((entry.steps[1].view.events as unknown[][]).map(event => event[0])).toEqual(['open', 'active', 'open']);
  await page.goto('/?fixture=select-data');
  await page.getByRole('combobox', { name: 'Select data sample', exact: true }).selectOption(sample.id);

  await expect(page.locator('[data-select-data-case]')).toHaveAttribute(
    'data-select-data-bound',
    'true'
  );
  await prepareSelectData(page);
  verifySelectData(await settleSelectData(page), entry.initial, sample, 'mapped-token/initial');
  await actSelectData(page, entry.steps[0].action);
  verifySelectData(await settleSelectData(page), entry.steps[0], sample, 'mapped-token/open');
  await actSelectData(page, entry.steps[1].action);
  const actual = await settleSelectData(page);
  const value = { type: 'string', value: 'a' };
  const model = { type: 'array', items: [value] };
  type Original = { common: Record<string, unknown>;
    raw: Record<string, unknown> & { ownProperties: Array<{ enumerable: boolean }> } };
  const originals = entry.initial.view.receipts.options.rows as Original[];
  const original = originals.find(row => row.common.originalToken === 'mapped:a')!;
  const common = { ...original.common, sameOriginal: false };
  const receipt = { ...original.raw, sameOriginal: false,
    ownProperties: original.raw.ownProperties.filter(property => property.enumerable) };

  expect(actual.view.model).toEqual(model);
  expect(actual.view.query).toBe('');
  expect(actual.view.editor?.value).toBe('');
  expect(actual.view.selected).toEqual([{
    label: 'Alpha',
    title: 'Alpha title',
    disabled: false,
    remove: true
  }]);
  expect(actual.view.events).toEqual([...entry.steps[0].view.events,
    ['change', model, [common]], ['select', value, common], ['open', false]]);
  expect(actual.raw.eventArguments).toEqual([...entry.steps[0].raw.eventArguments,
    ['change', model, [receipt]], ['select', value, receipt], ['open', false]]);
  expect(actual.view.leaks).toEqual([]);
  await actSelectData(page, entry.steps[2].action);

  expect((await settleSelectData(page)).view.events).toEqual(actual.view.events);
});
