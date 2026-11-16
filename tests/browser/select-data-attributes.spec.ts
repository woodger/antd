import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { test, expect } from './test';
import { actSelectData, prepareSelectData } from './select-data-driver';
import { settleSelectData } from './select-data-assertions';
import { readSelectDataAttributes } from './select-data-attribute-metrics';
import { selectDataFixtureSamples } from './fixtures/select-data-additive-cases';
import type { SelectDataAction } from './fixtures/select-data-cases';
import { selectDataSourceDiagnostic } from './select-data-reference';

type Snapshot = ReturnType<typeof readSelectDataAttributes>;
type Row = Snapshot['raw']['popups'][number]['physicalRows'][number];
const bytes = readFileSync(new URL('./fixtures/ant-design-select-data-attributes-reference.json', import.meta.url));
expect(createHash('sha256').update(bytes).digest('hex'))
  .toBe('95c56926369a18bb7f3b10ec13e8a697789b74e387a94f5ff5f87e4555162030');
const source = JSON.parse(bytes.toString('utf8')) as {
  reference: { revision: string; errors: unknown[]; diagnostics: unknown[]; viewport: { width: number; height: number } };
  cases: Array<{ id: string; sourceSampleId: string; publicGroupAttributeProbe: boolean;
    initial: Snapshot; steps: Array<Snapshot & { action: SelectDataAction }> }>;
};

function attributes(row: Row, native: boolean, physical: boolean) {
  const values: Record<string, string> = Object.fromEntries(row.attributes);
  // Native keeps button semantics, focus control and private Svelte/attachment markers.
  // Every Source data/ARIA/title attribute and every option-state class stays observable.
  if (native) for (const name of Object.keys(values)) {
    if (name.startsWith('data-ant-') || (physical && ['type', 'tabindex', 'disabled'].includes(name))) delete values[name];
  }
  if (values.class !== undefined) values.class = values.class.split(/\s+/)
    .filter(name => !native || !(/^(?:svelte-|s-[A-Za-z0-9]+$)/).test(name)).sort().join(' ');
  // Compare the actual CSS declarations through their computed effects below.
  delete values.style;
  return values;
}

function verify(actual: Snapshot, expected: Snapshot, visible: boolean) {
  expect(actual.view).toEqual(expected.view);
  expect(actual.raw.receipts).toEqual(expected.raw.receipts);
  if (!visible) return; // Retained closed Native markup is a separate existing lifecycle contract.
  expect(actual.raw.popups.length).toBe(expected.raw.popups.length);
  for (const [index, popup] of expected.raw.popups.entries()) {
    const current = actual.raw.popups[index];
    expect(current.physicalRows.length).toBe(popup.physicalRows.length);
    for (const [rowIndex, row] of popup.physicalRows.entries()) {
      const native = current.physicalRows[rowIndex];
      const group = Object.fromEntries(row.attributes).class?.split(' ').includes('ant-select-item-group');
      expect(row.tag).toBe('DIV');
      expect(native.tag).toBe(group ? 'DIV' : 'BUTTON');
      expect(attributes(native, true, true)).toEqual(attributes(row, false, true));
      expect(native.css).toEqual(row.css);
      expect(native.box).toEqual(row.box);
    }
    expect(current.listboxes.length).toBe(popup.listboxes.length);
    for (const [boxIndex, listbox] of popup.listboxes.entries()) {
      const rows = current.listboxes[boxIndex].rows;
      expect(rows.length).toBe(listbox.rows.length);
      for (const [rowIndex, row] of listbox.rows.entries()) {
        expect(attributes(rows[rowIndex], true, rows[rowIndex].tag === 'BUTTON')).toEqual(attributes(row, false, false));
      }
    }
  }
}

test.use({ viewport: source.reference.viewport });
test.beforeAll(() => {
  expect(source.reference.revision).toBe('984592267de88fbf9cdaecc96a56629e721c709d');
  expect(source.reference.errors).toEqual([]);
  expect(source.reference.diagnostics).toEqual([selectDataSourceDiagnostic]);
  expect(source.cases.length).toBe(10);
});
for (const entry of source.cases) {
  test(`Select data attributes follow actual Source for ${entry.id}`, async ({ page }, testInfo) => {
    expect(selectDataFixtureSamples.some(sample => sample.id === entry.id)).toBe(true);
    const trace: unknown[] = [];
    await page.goto('/?fixture=select-data');
    await page.getByRole('combobox', { name: 'Select data sample', exact: true }).selectOption(entry.id);
    await expect(page.locator('[data-select-data-case]')).toHaveAttribute('data-select-data-bound', 'true');
    await prepareSelectData(page);
    const capture = async (expected: Snapshot, action?: SelectDataAction) => {
      const settled = await settleSelectData(page);
      const actual = await page.evaluate(readSelectDataAttributes);
      trace.push({ action, actual });
      verify(actual, expected, settled.view.popup !== null);
      expect(settled.view.leaks).toEqual([]);
    };
    try {
      await capture(entry.initial);
      for (const step of entry.steps) {
        await actSelectData(page, step.action);
        await capture(step, step.action);
      }
    } finally {
      await testInfo.attach('actual-option-group-attributes', {
        body: JSON.stringify(trace, null, 2), contentType: 'application/json'
      });
    }
  });
}
