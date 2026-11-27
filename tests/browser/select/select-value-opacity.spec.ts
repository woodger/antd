import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { test, expect } from '../test';
import { readSelectValueOpacity, type SelectValueOpacityView } from '../select-value-opacity-metrics.mjs';
import { actSelectValue, prepareSelectValue } from '../select-value-driver';
import { settleSelectValue, verifySelectValue } from '../select-value-assertions';
import { selectValueSamples } from '../fixtures/select-value-cases';
import { selectValueReference } from '../select-value-reference';

const referenceUrl = new URL(
  '../fixtures/ant-design-select-value-opacity-reference.json',
  import.meta.url
);
const bytes = readFileSync(referenceUrl);
if (createHash('sha256').update(bytes).digest('hex') !== 'e6ada4d37004ee45bef3b7c77cf632765d5b3b3ffd7301671fff5d9b90fd07bd') {
  throw Error('Original selected-label paint reference changed');
}
const paint = JSON.parse(bytes.toString('utf8')) as { reference: { revision: string;
  primaryCompleteRawProjectionDeepEqualAtAllSixPoints: boolean; errors: unknown[]; diagnostics: unknown[] };
  cases: Array<{
    id: string;
    initial: { view: SelectValueOpacityView };
    steps: Array<{ view: SelectValueOpacityView; action: unknown }>
  }> };

test.use({ viewport: selectValueReference.reference.viewport });
test('Selected label paint follows original opacity without double fading', async (
  { page },
  testInfo
) => {
  expect(paint.reference.revision).toBe(selectValueReference.reference.revision);
  expect(paint.reference.primaryCompleteRawProjectionDeepEqualAtAllSixPoints).toBe(true);
  expect(paint.reference.errors).toEqual([]);
  expect(paint.reference.diagnostics).toEqual([]);
  const source = selectValueReference.cases.find(entry => entry.id === 'select-value-styled')!;
  const sample = selectValueSamples.find(sample => sample.id === source.id)!;

  expect(paint.cases.map(entry => entry.id)).toEqual([source.id]);
  expect(paint.cases[0].steps.map(step => step.action)).toEqual(source.steps.map(step => step.action));
  const trace: unknown[] = [];
  await page.goto('/?fixture=select-value');
  await page.getByRole('combobox', { name: 'Select value sample', exact: true }).selectOption(source.id);
  await prepareSelectValue(page);
  try {
    for (const [index, snapshot] of [source.initial, ...source.steps].entries()) {
      if (index) {
        await actSelectValue(
          page,
          source.steps[index - 1].action as Parameters<typeof actSelectValue>[1]
        );
      }
      const actual = await settleSelectValue(page);
      verifySelectValue(actual, snapshot, sample, `paint/${index}`);
      const observed = await page.evaluate(readSelectValueOpacity);
      trace.push({ phase: index, actual, paint: observed });
      expect(observed.raw.inaccessibleSheets).toEqual([]);
      expect(observed.view).toEqual([paint.cases[0].initial, ...paint.cases[0].steps][index].view);
    }
  } finally {
    await testInfo.attach(
      'actual-label-paint',
      { body: JSON.stringify(trace, null, 2), contentType: 'application/json' }
    );
  }
});
