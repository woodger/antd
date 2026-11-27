import type { Page } from '@playwright/test';
import { expect, test } from './test';
import source from './fixtures/ant-design-table-column-key-reference.json' with { type: 'json' };
import { expectedColumnState } from './fixtures/table-column-key-reference';

const fixture = '/?fixture=table-column-keys&profile=';
const target = '[data-probe-title="column"]';
const peer = '[data-probe-title="peer"]';

test.use({ viewport: { width: 880, height: 550 }, reducedMotion: 'reduce' });

/** Observes the header key, line order and event of the owner Table. */
function snapshot() {
  const root = document.getElementById('table-column-keys-fixture');
  if (!root) {
    throw new Error('Missing Table column keys fixture');
  }

  const column = root.querySelector('[data-probe-title="column"]');
  const peer = root.querySelector('[data-probe-title="peer"]');
  const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-row-key]'), row => [
    row.dataset.rowKey, row.querySelector('[data-probe-cell]')?.textContent ?? null
  ]);
  return {
    key: column?.getAttribute('data-probe-key') ?? null,
    peerKey: peer?.getAttribute('data-probe-key') ?? null,
    sort: column?.getAttribute('aria-sort') ?? null,
    peerSort: peer?.getAttribute('aria-sort') ?? null,
    rows,
    changes: JSON.parse(root.querySelector('[data-probe-events]')?.textContent ?? '[]')
  };
}

/** Confirms the filter through custom controls. */
async function filterProbe(page: Page) {
  const name = 'Filter menu: Probe column';
  await page.getByRole('button', { name, exact: true }).click();
  const panel = page.getByRole('dialog', { name, exact: true });
  await panel.getByRole('checkbox', { name: 'Keep record A', exact: true }).check();
  await panel.getByRole('button', { name: 'OK', exact: true }).click();
}

for (const sample of source.cases) {
  const { profile } = sample;
  const mode = profile.virtual ? 'virtual' : 'ordinary';
  test(`Table resolves the ${profile.id} column key in the ${mode} layout`, async ({ page }) => {
    await page.goto(fixture + profile.id + (profile.virtual ? '&virtual' : ''));

    await expect.poll(() => page.evaluate(snapshot)).toEqual(expectedColumnState(sample, 'initial'));

    await page.getByRole('button', { name: 'Probe column', exact: true }).click();

    const sorted = expectedColumnState(sample, 'sorted');
    await expect.poll(() => page.evaluate(snapshot)).toEqual(sorted);
    await expect(page.locator('[data-probe-sorter]'))
      .toHaveText(JSON.stringify(sorted.changes[0].sorter));

    await filterProbe(page);

    const filtered = expectedColumnState(sample, 'filtered');
    await expect.poll(() => page.evaluate(snapshot)).toEqual(filtered);
    await expect(page.locator('[data-probe-filters]'))
      .toHaveText(JSON.stringify(filtered.changes[1].filters));
  });
}

test('Table retains a resolved key and the editor when its explicit-key peer is hidden', async ({
  page
}) => {
  await page.goto(fixture + 'explicit-collision&editor');
  await page.getByRole('button', { name: 'Probe column', exact: true }).click();
  const editor = page.getByRole('textbox', { name: 'Cell draft', exact: true });
  const original = await editor.elementHandle();
  await editor.fill('Edited field');
  await editor.evaluate((field: HTMLInputElement) => field.setSelectionRange(2, 6));

  await page.getByRole('button', { name: 'Toggle peer', exact: true }).dispatchEvent('click');

  await expect(page.locator(peer)).toHaveCount(0);
  await expect(page.locator(target)).toHaveAttribute('data-probe-key', 'label_next');
  await expect(page.locator(target)).toHaveAttribute('aria-sort', 'ascending');
  const state = await page.evaluate(snapshot);
  expect(state.changes).toHaveLength(1);
  await expect(editor).toBeFocused();
  await expect(editor).toHaveValue('Edited field');
  expect(await editor.evaluate((node, before) => node === before, original)).toBe(true);
  expect(await editor.evaluate((field: HTMLInputElement) => [
    field.selectionStart, field.selectionEnd
  ])).toEqual([2, 6]);
});

test('virtual Table applies bound sorting and filtering to an inferred path', async ({ page }) => {
  await page.goto(fixture + 'nested-field&virtual');

  await page.getByRole('button', { name: 'Set bound sort and filter' }).click();

  await expect(page.locator(target)).toHaveAttribute('aria-sort', 'descending');
  const rows = page.locator('[data-row-key]');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toHaveAttribute('data-row-key', 'a');
  await expect(page.locator('[data-probe-events]')).toHaveText('[]');
});
