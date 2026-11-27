import type { Page } from '@playwright/test';
import { expect, test } from '../test';
import source from '../fixtures/ant-design-table-cell-update-reference.json' with { type: 'json' };

const fixture = '/?fixture=table-cell-update&profile=';
test.use({ viewport: { width: 880, height: 480 }, reducedMotion: 'reduce' });

/** Observes the contents regardless of the attributes transmitted through onCell. */
function snapshot() {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-row-key]'), row => [
    row.dataset.rowKey,
    Array.from(row.querySelectorAll<HTMLElement>('[data-probe-content]'), cell => [
      cell.dataset.probeContent, cell.textContent
    ])
  ]);
}

/** Compares the changed records without reference to the number of passes React and Svelte. */
function changedRecords(comparisons: readonly string[][]) {
  const changed = comparisons.filter(([, next, previous]) => next !== previous);
  const keys = changed.map(pair => JSON.stringify(pair));
  return [...new Set(keys)].sort();
}

/** The record of arguments is expected after updating props Table. */
async function act(page: Page, action: string) {
  await page.getByRole('button', { name: action, exact: true }).dispatchEvent('click');
  await expect(page.getByLabel('Compared records')).toHaveAttribute('data-action', action);
}

for (const { profile, states } of source.cases) {
  test(`Table updates cell content conditionally in the ${profile.id} layout`, async ({ page }) => {
    await page.goto(fixture + profile.id);

    for (const { action, state } of states) {
      const message = `${profile.id} ${action ?? 'initial'}`;
      if (action) {
        await act(page, action);
      }

      await expect.poll(() => page.evaluate(snapshot), { message }).toEqual(state.rows);
      const compared = await page.getByLabel('Compared records').innerText();
      expect(changedRecords(JSON.parse(compared)), message).toEqual(changedRecords(state.pairs));
    }
  });
}

test('virtual Table reads the latest content when a row remounts', async ({ page }) => {
  await page.goto(fixture + 'virtual-window');
  const nextWindow = page.locator('[data-row-key="row-32"]');

  for (const { action, row } of source.virtualWindow.snapshots) {
    if (action) {
      await act(page, action);
    }
    if (action === 'leave') {
      await expect(nextWindow).toHaveCount(1);
    }

    await expect.poll(async () => {
      const rows = await page.evaluate(snapshot);
      return rows.find(([key]) => key === 'a') ?? null;
    }, { message: action ?? 'initial' }).toEqual(row);
  }
});

test('Table keeps a rejected editor focused while onCell and snippet state remain live',
  async ({ page }) => {
    await page.goto(fixture + 'ordinary&editor');
    const row = page.locator('[data-row-key="a"]');
    const plain = row.locator('[data-probe-content^="plain/"]');
    const editor = row.getByRole('textbox', { name: 'Cell editor', exact: true });
    const original = await editor.elementHandle();
    await editor.fill('Draft text');
    await editor.evaluate((input: HTMLInputElement) => input.setSelectionRange(2, 7));

    await act(page, 'reject');
    await act(page, 'new-renderer');
    await act(page, 'local-state');
    await row.locator('[data-probe-content^="custom/"]').dispatchEvent('click');

    await expect(row.locator('[data-local-version]')).toHaveText('1');
    await expect(page.getByLabel('Clicked record')).toHaveText('A1');
    await expect(plain).toHaveAttribute('data-probe-content', 'plain/A1/0');
    await expect(plain).toHaveText('A0');
    await expect(plain).toHaveAttribute('title', 'A0');
    await expect(editor).toBeFocused();
    await expect(editor).toHaveValue('Draft text');
    expect(await editor.evaluate((node, before) => node === before, original)).toBe(true);
    expect(await editor.evaluate((input: HTMLInputElement) => [
      input.selectionStart, input.selectionEnd
    ])).toEqual([2, 7]);

    await act(page, 'no-title');

    await expect(plain).not.toHaveAttribute('title');
    await expect(plain).toHaveText('A0');

    await act(page, 'empty-title');

    await expect(plain).toHaveAttribute('title', '');
    await expect(plain).toHaveText('A0');
  }
);
