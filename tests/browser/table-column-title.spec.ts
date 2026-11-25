import type { Page } from '@playwright/test';
import { expect, test } from './test';
import source from './fixtures/ant-design-table-column-title-reference.json' with { type: 'json' };

test.use({ viewport: source.reference.viewport, locale: 'en-US' });

const fixture = '/?fixture=table-column-title';
type SourceState = (typeof source.cases)[number]['states'][number]['state'];

/** Снимает видимый заголовок и контекст snippet независимо от кнопок в ячейке. */
function snapshot() {
  const root = document.getElementById('table-column-title-fixture');
  if (!root) {
    throw new Error('Missing Table column title fixture');
  }

  const headings = Array.from(root.querySelectorAll<HTMLElement>('thead [data-observed-header]'),
    node => {
      const sample = node.querySelector<HTMLElement>('[data-title-sample]');
      const title = sample ?? node.querySelector<HTMLElement>('.ant-table-column-title');
      return {
        key: node.dataset.observedHeader,
        text: title?.innerText.trim() ?? '',
        title: node.getAttribute('title'),
        sort: node.getAttribute('aria-sort'),
        info: sample ? JSON.parse(sample.getAttribute('data-title-sample') ?? 'null') : null
      };
    });
  const rows = Array.from(root.querySelectorAll<HTMLElement>('tbody tr[data-row-key]'),
    row => Number(row.dataset.rowKey));
  const changes = JSON.parse(root.querySelector('[data-title-changes]')?.textContent ?? '[]');
  return { headings, rows, changes };
}

/** Учитывает нативный title через onHeaderCell и активные ключи TableChange. */
function expectedState(state: SourceState) {
  const headings = state.headings.map(heading => heading.key === 'markup'
    ? { ...heading, title: null } : heading);
  const changes = state.changes.map(event => ({
    ...event,
    filters: Object.fromEntries(Object.entries(event.filters).filter(([, keys]) => keys?.length))
  }));
  return { headings, rows: state.rows, changes };
}

/** Повторяет действия исходного прогона с заголовком, фильтром и владельцем. */
async function act(page: Page, action: string) {
  if (action.startsWith('sort-')) {
    const key = action.slice(5);
    const head = page.locator(`[data-observed-header="${key}"]`);
    if (key === 'absent') {
      await head.getByRole('button', { name: 'absent', exact: true }).click();
    }
    else {
      await head.locator('.ant-table-column-title').click();
    }
    return;
  }
  if (action === 'filter') {
    await page.getByRole('button', { name: 'Filter: Score', exact: true }).click();
    return;
  }
  if (action === 'odd' || action === 'even') {
    const choice = action === 'odd' ? 'Odd score' : 'Even score';
    await page.getByRole('radio', { name: choice, exact: true }).check();
    return;
  }
  if (action === 'apply') {
    await page.getByRole('button', { name: 'Apply', exact: true }).click();
    return;
  }
  const button = action === 'owner-update' ? 'Owner update' : 'Owner reset';
  await page.getByRole('button', { name: button, exact: true }).click();
}

for (const { profile, states } of source.cases) {
  test(`Table column title receives Ant Design state for ${profile.id}`, async ({ page }) => {
    await page.goto(`${fixture}&profile=${profile.id}`);

    for (const { action, state } of states) {
      if (action) {
        await act(page, action);
      }

      await expect.poll(() => page.evaluate(snapshot), {
        message: `${profile.id} ${action ?? 'initial'}`
      }).toEqual(expectedState(state));
    }
  });
}

test('Controls in a heading keep their own actions alongside the sort button', async ({ page }) => {
  await page.goto(`${fixture}&profile=interactive`);
  const heading = page.locator('[data-observed-header="score"]');
  const details = heading.getByRole('button', { name: 'Details', exact: true });
  const note = heading.getByRole('textbox', { name: 'Header note', exact: true });
  const sort = heading.getByRole('button', { name: 'Score with details', exact: true });

  await details.click();
  await note.click();
  await note.fill('Draft');
  await expect(note).toBeFocused();

  const changes = page.locator('[data-title-changes]');
  await expect(changes).toHaveText('[]');
  await expect(page.locator('[data-detail-requests]')).toHaveText('1');
  await expect(page.locator('[data-heading-clicks]')).toHaveText('2');

  await sort.press('Enter');

  await expect(sort).toBeFocused();
  await expect(note).toHaveValue('Draft');
  await expect(heading).toHaveAttribute('aria-sort', 'ascending');
  await expect(changes).toHaveText(
    '[{"action":"sort","filters":{},"sorted":[{"key":"score","order":"ascend"}],"rows":[1,2,3,0]}]'
  );
  await expect(page.locator('[data-heading-clicks]')).toHaveText('3');
});

for (const kind of ['native', 'dropdown']) {
  test(`A ${kind} filter follows the live accessible name from its column title`, async ({ page }) => {
    await page.goto(`${fixture}&profile=filter-${kind}`);
    const trigger = page.getByRole('button', { name: 'Filter: Score', exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Filter: Score', exact: true });
    const original = await dialog.elementHandle();
    await expect(dialog.getByRole('group', { name: 'Filter: Score', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Rename heading', exact: true }).dispatchEvent('click');

    const renamed = page.getByRole('dialog', { name: 'Filter: Updated score', exact: true });
    await expect(renamed.getByRole('group', { name: 'Filter: Updated score', exact: true })).toBeVisible();
    expect(await renamed.evaluate((node, before) => node === before, original)).toBe(true);
    await expect(page.getByRole('button', { name: 'Filter: Updated score', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Updated score', exact: true })).toBeVisible();
  });
}

for (const target of ['full-header', 'sorter-icon']) {
  test(`Column title snippet respects the ${target} tooltip scope`, async ({ page }) => {
    const profile = target === 'full-header' ? 'tooltip' : 'tooltip-icon';
    await page.goto(`${fixture}&profile=${profile}`);
    const head = page.locator('[data-observed-header="score"]');
    const tooltip = page.getByRole('tooltip');

    await head.getByText('Score', { exact: true }).hover();

    if (target === 'full-header') {
      await expect(tooltip).toHaveText('Sort ascending');
    }
    else {
      await expect(tooltip).toBeHidden();
    }
    await head.locator('[data-ant-table-part="sorter"]').hover();
    await expect(tooltip).toHaveText('Sort ascending');
    await head.getByRole('button', { name: 'Filter: Score', exact: true }).hover();
    await expect(tooltip).toBeHidden();
  });
}

test('Shared and empty column titles keep native title overrides and accessible sorting', async ({ page }) => {
  await page.goto(`${fixture}&profile=empty-title`);

  const headers = page.locator('thead th');
  await expect(headers).toHaveText(['Rank', '', '', '']);
  await expect(headers.last()).toHaveAttribute('title', 'Explicit title');
  const sort = headers.last().getByRole('button', { name: 'empty', exact: true });
  await sort.press('Space');

  await expect(headers.last()).toHaveAttribute('aria-sort', 'ascending');
  await expect(sort).toBeFocused();
});
