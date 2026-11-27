import type { Page } from '@playwright/test';
import source from './fixtures/ant-design-table-sorter-reference.json' with { type: 'json' };
import { expect, test } from './test';

test.use({ viewport: source.reference.viewport, locale: 'en-US' });

const root = '[data-table-sorter-fixture]';

/** Reads the actual directions, arrows, strings and list of queries to the owner. */
function snapshot() {
  const fixture = document.querySelector('[data-table-sorter-fixture]');
  if (!fixture) {
    throw new Error('Missing sorter fixture');
  }

  return {
    headings: Array.from(fixture.querySelectorAll('thead th'), node => ({
      key: [...node.classList].find(name => name.startsWith('fixture-col-'))?.slice(12) ?? null,
      order: node.getAttribute('aria-sort'),
      arrows: ['up', 'down'].filter(direction =>
        node.querySelector(`.ant-table-column-sorter-${direction}`)),
      icon: node.querySelector('[data-sort-icon]')?.getAttribute('data-sort-icon') ?? null
    })),
    rows: Array.from(
      fixture.querySelectorAll<HTMLTableRowElement>('tbody tr[data-row-key]'),
      row => Number(row.dataset.rowKey)
    ),
    events: JSON.parse(fixture.querySelector('[data-sort-events]')?.textContent ?? '[]')
  };
}

/** Performs an action through a public button or window width from the profile. */
async function act(page: Page, action: string) {
  if (action === 'wide') {
    await page.setViewportSize({ width: 1100, height: source.reference.viewport.height });
  }
  else if (action === 'update') {
    await page.getByRole('button', { name: 'Update', exact: true }).click();
  }
  else {
    await page.locator(`${root} th.fixture-col-${action} button`).click();
  }
}

for (const { profile, states } of source.cases) {
  test(`Table matches the Ant Design sorting profile ${profile.id}`, async ({ page }) => {
    await page.goto(`/?fixture=table-sorter&profile=${profile.id}`);
    await expect(page.locator(`${root} table`)).toBeVisible();

    for (const { action, state } of states) {
      if (action) {
        await act(page, action);
      }
      await expect.poll(() => page.evaluate(snapshot), {
        message: `${profile.id} after ${action ?? 'mount'}`
      }).toEqual(state);
    }
  });
}
