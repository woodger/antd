import type { Page } from '@playwright/test';
import { expect, test } from '../test';
import source from '../fixtures/ant-design-table-selection-reference.json' with { type: 'json' };

test.use({ viewport: source.reference.viewport, locale: 'en-US' });
const root = '#table-selection-fixture';
const commands = 'Selection commands';

interface Action {
  click?: number;
  key?: number;
  arrow?: boolean;
  shift?: boolean;
  header?: boolean;
  command?: number;
  page?: number;
  data?: number;
  hide?: boolean;
  clear?: boolean;
  accept?: boolean;
}

/** Removes the state of public controllers and recorded callbacks. */
function snapshot() {
  const table = document.querySelector<HTMLTableElement>('#table-selection-fixture table');
  if (!table) {
    throw new Error('Missing Table selection fixture');
  }

  /** Mixed is checked on the input itself after the owner's reaction. */
  function control(cell: Element | null) {
    const input = cell?.querySelector('input');
    if (!input) return null;
    return {
      type: input.type,
      checked: input.checked,
      disabled: input.disabled,
      mixed: input.indeterminate,
      label: input.getAttribute('aria-label')
    };
  }

  const header = table.tHead?.querySelector('.ant-table-selection-column') ?? null;
  const rows = table.querySelectorAll<HTMLTableRowElement>('tr[data-row-key]');
  return {
    rows: Array.from(rows, row => ({
      key: Number(row.dataset.rowKey),
      selected: row.classList.contains('ant-table-row-selected'),
      ...control(row.querySelector('.ant-table-selection-column'))
    })),
    header: control(header),
    menu: Boolean(header?.querySelector('.ant-table-selection-extra')),
    events: JSON.parse(document.getElementById('table-selection-events')?.textContent ?? '[]')
  };
}

/** Performs actions through the real pointer, keys and controls of the owner. */
async function act(page: Page, action: Action) {
  if (action.click !== undefined || action.key !== undefined) {
    const target = page.getByLabel(`Choose ${action.click ?? action.key}`, { exact: true });
    if (action.key !== undefined) await target.press(action.arrow ? 'ArrowDown' : 'Space');
    else await target.click({ modifiers: action.shift ? ['Shift'] : [] });
  }
  else if (action.command !== undefined) {
    await page.getByRole('button', { name: commands }).click();
    await page.getByRole('menuitem').nth(action.command).click();
    await page.mouse.move(825, 500);
  }
  else if (action.header) {
    await page.getByLabel('Choose page', { exact: true }).click();
  }
  else if (action.page) {
    await page.getByRole('button', { name: `Page ${action.page}`, exact: true }).click();
  }
  else if (action.data !== undefined) {
    await page.getByTestId(`selection-data-${action.data}`).click();
  }
  else if (action.hide) {
    await page.getByTestId('selection-hide').click();
  }
  else if (action.accept) {
    await page.getByTestId('selection-accept').click();
  }
  else if (action.clear) {
    await page.getByTestId('selection-clear').click();
  }
}

/** Leaves the original browser results suitable for verification of two Svelte contracts. */
function expectedEvents(events: readonly (readonly unknown[])[]) {
  return events.map(event => {
    const [kind, ...data] = event;
    // Checkbox Svelte transmits its own native change. onSelect gets click.
    if (kind === 'title') return [kind, data[0], 'change'];
    // Contracts of Table return only known records, including those recovered from the cache.
    const index = kind === 'select' || kind === 'change' ? 2 : -1;
    const records = data[index];
    if (Array.isArray(records)) data[index] = records.filter(record => record !== null);
    return [kind, ...data];
  });
}

for (const { profile, states } of source.cases) {
  test(`Table row selection matches the ${profile.id} scenario`, async ({ page }) => {
    await page.goto(`/?fixture=table-selection&profile=${profile.id}`);
    await expect(page.locator(`${root} table`)).toHaveCount(1);

    for (const { action, state } of states) {
      if (action) await act(page, action);

      const expected = { ...state, events: expectedEvents(state.events) };
      await expect.poll(() => page.evaluate(snapshot)).toEqual(expected);
    }
  });
}

test('Table selection menu works by keyboard and restores trigger focus', async ({ page }) => {
  await page.goto('/?fixture=table-selection&profile=menu');
  const trigger = page.getByRole('button', { name: commands });

  await trigger.press('ArrowDown');
  const all = page.getByRole('menuitem', { name: 'Select all data' });
  await expect(all).toBeFocused();
  await all.press('Enter');

  await expect(trigger).toBeFocused();
  await expect(page.getByLabel('Choose 1')).toBeChecked();
  await expect(page.getByLabel('Choose 2')).toBeDisabled();
  await expect(page.locator('#table-selection-events')).toContainText(
    '["change","all",[0,1,3,4,5,7]'
  );
});

test('virtual Table keeps selection outside its DOM window and forwards control attributes', async ({
  page
}) => {
  await page.goto('/?fixture=table-selection&profile=range&virtual&attributes');
  const viewport = page.locator(`${root} [data-ant-table-virtual]`);
  const first = page.getByLabel('Choose 0');
  await first.check();
  await expect(first).toHaveAttribute('name', 'target-0');
  await expect(first).toHaveValue('0');
  await expect(first.locator('..')).toHaveAttribute('title', 'Row 0');
  const cell = viewport.locator('thead th.ant-table-selection-column');
  await expect(cell).toHaveCSS('text-align', 'right');
  expect((await cell.boundingBox())?.width).toBe(84);

  await viewport.press('End');
  await expect(first).toHaveCount(0);
  await viewport.press('Home');
  await expect(first).toBeChecked();
});

test('Table saves the record when a selection callback replaces the page immediately', async ({
  page
}) => {
  await page.goto('/?fixture=table-selection&profile=preserve&swap');
  await page.getByLabel('Choose 0').click();
  await expect(page.getByLabel('Choose 0')).toHaveCount(0);

  await page.getByLabel('Choose 11').check();

  await expect(page.locator('#table-selection-events')).toContainText(
    '["change","single",[0,11],[[0,0],[11,1]]]'
  );
});

test('Table resets the nested uncontrolled model when selection is toggled off', async ({ page }) => {
  await page.goto('/?fixture=table-selection&profile=range');
  const first = page.getByLabel('Choose 0');
  const toggle = page.getByTestId('selection-enable');
  await first.check();

  await toggle.click();
  await expect(first).toHaveCount(0);
  await toggle.click();

  await expect(first).not.toBeChecked();
  await expect(page.locator('#table-selection-events')).toHaveText(
    '[["select",0,true,[[0,0]],"click",false],["change","single",[0],[[0,0]]]]'
  );
});
