import { type Page } from '@playwright/test';
import { expect, test } from './test';
import source from './fixtures/ant-design-table-popup-container-reference.json' with { type: 'json' };

test.use({ viewport: source.reference.viewport, locale: 'en-US' });
const fixture = '/?fixture=table-popup-container&profile=';
const filterName = 'Filter menu: Name';
const filterPanel = ':popover-open [data-ant-table-filter-part="dropdown"]';
const submenuPanel = '[data-menu-popup-path]:popover-open';

/** Читает видимые поверхности и контейнеры, куда они действительно подключены. */
function snapshot() {
  /** Встроенный popover без resolver сохраняет владельца в шапке таблицы. */
  function host(node: Element | null) {
    if (!node) {
      return null;
    }
    const explicit = node.closest<HTMLElement>('[data-popup-host]');
    return explicit?.dataset.popupHost ?? 'body';
  }

  const panel = document.querySelector(':popover-open [data-ant-table-filter-part="dropdown"]');
  const submenu = document.querySelector('[data-menu-popup-path]:popover-open');
  const tooltip = document.querySelector('[data-ant-tooltip]:popover-open [data-ant-tooltip-container]');
  const selection = document.querySelector('.ant-table-selection-extra')
    ? document.querySelector('[data-ant-dropdown-popup]:popover-open [role="menu"]') : null;
  const rows = document.querySelectorAll<HTMLElement>('[data-popup-main] tbody tr[data-row-key]');

  return {
    outer: host(panel),
    submenu: host(submenu),
    selection: host(selection),
    tooltip: host(tooltip),
    calls: JSON.parse(
      document.querySelector<HTMLElement>('[data-popup-resolvers]')?.dataset.popupResolvers ?? '[]'
    ),
    rows: Array.from(rows, row => row.dataset.rowKey),
    filters: JSON.parse(document.querySelector('[data-popup-filters]')?.textContent ?? '[]'),
    keys: JSON.parse(document.querySelector('[data-popup-keys]')?.textContent ?? '[]'),
    editor: panel?.querySelector<HTMLInputElement>('[data-custom-filter] input')?.value ?? null,
    choice: panel ? Boolean(panel.querySelector('input:checked')) : null
  };
}

type Sample = (typeof source.cases)[number];

/** Ждёт совпадения отрисованных владельцев и событий с соответствующим кадром React. */
async function expectFrame(page: Page, sample: Sample, index: number) {
  const state = sample.states[index];
  const expected = { ...state };
  if (state.outer === 'body' && sample.spec.kind === undefined) {
    // Svelte держит фильтр в th без resolver. React по умолчанию использует body.
    expected.outer = 'header';
  }
  await expect.poll(() => page.evaluate(snapshot), {
    message: `${sample.spec.id} frame ${index}`
  }).toEqual(expected);
}

for (const sample of source.cases) {
  const { spec } = sample;
  test(`Table matches Ant Design popup placement for ${spec.id}`, async ({ page }) => {
    await page.goto(fixture + spec.id);
    if (spec.kind === 'selection') {
      await page.getByRole('button', { name: 'Selection commands', exact: true }).hover();
      await expectFrame(page, sample, 0);

      await page.getByRole('menuitem', { name: 'Select all data', exact: true }).click();
      await expectFrame(page, sample, 1);
      return;
    }
    if (spec.kind === 'sorter') {
      await page.locator('.ant-table-column-sorters .ant-table-column-title').hover();
      await expectFrame(page, sample, 0);
      return;
    }

    const trigger = page.getByRole('button', { name: filterName, exact: true });
    const panel = page.locator(filterPanel);
    await trigger.click();
    await expectFrame(page, sample, 0);

    if (spec.grouped) {
      await panel.getByRole('menuitem', { name: 'Colors', exact: true }).hover();
      await expectFrame(page, sample, 1);

      await page.getByRole('menuitemcheckbox', { name: 'Green', exact: true }).click();
      await expect(panel).toBeVisible();
      await expect(page.locator('[data-popup-filters]')).toHaveText('[]');
      await panel.getByRole('button', { name: 'OK', exact: true }).click();
      await expectFrame(page, sample, 2);
    }
    if (spec.custom) {
      await panel.getByRole('textbox', { name: 'Editor', exact: true }).fill('Draft');
      await panel.getByRole('button', { name: 'Choose Green', exact: true }).click();
      await expectFrame(page, sample, 1);

      await panel.getByRole('button', { name: 'Apply', exact: true }).click();
      await expectFrame(page, sample, 2);
    }
    if (spec.update) {
      await panel.getByRole('checkbox', { name: 'Green', exact: true }).check();
      await page.getByRole('button', { name: 'Move popup', exact: true }).dispatchEvent('click');
      await expectFrame(page, sample, 1);

      await page.getByRole('button', { name: 'Remove override', exact: true })
        .dispatchEvent('click');
      await expectFrame(page, sample, 2);
    }
  });
}

test('Table keeps a portalled submenu in the filter focus and dismissal scope', async ({ page }) => {
  await page.goto(fixture + 'group-table');
  const trigger = page.getByRole('button', { name: filterName, exact: true });
  const panel = page.getByRole('dialog', { name: filterName, exact: true });
  const menu = panel.getByRole('menu', { name: filterName, exact: true });
  const group = menu.getByRole('menuitem', { name: 'Colors', exact: true });
  await trigger.press('Enter');
  await menu.press('Home');

  await group.press('ArrowRight');
  const submenu = page.locator('[data-popup-host="table"]').locator(submenuPanel);
  const red = submenu.getByRole('menuitemcheckbox', { name: 'Red', exact: true });
  await expect(red).toBeFocused();
  await red.press('Space');
  await expect(red).toHaveAttribute('aria-checked', 'true');
  await expect(panel).toBeVisible();

  await red.press('Escape');
  await expect(submenu).toBeHidden();
  await expect(group).toBeFocused();
  await expect(panel).toBeVisible();

  await group.press('Escape');
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.locator('[data-popup-filters]')).toHaveText('[]');
});

test('Table focuses built-in options and resolves peer panels independently', async ({ page }) => {
  await page.goto(fixture + 'table&peer');
  const trigger = page.locator('[data-popup-main]')
    .getByRole('button', { name: filterName, exact: true });
  const peer = page.locator('[data-popup-peer]')
    .getByRole('button', { name: filterName, exact: true });
  const mainPanel = page.locator('[data-popup-host="table"]')
    .getByRole('dialog', { name: filterName, exact: true });
  const peerPanel = page.locator('[data-popup-host="peer"]')
    .getByRole('dialog', { name: filterName, exact: true });

  await trigger.press('Space');
  await expect(mainPanel.getByRole('checkbox', { name: 'Red', exact: true })).toBeFocused();
  await expect(peerPanel).toBeHidden();

  await peer.click();
  await expect(mainPanel).toBeHidden();
  await expect(peerPanel.getByRole('checkbox', { name: 'Red', exact: true })).toBeFocused();
});

test('Table closes an obsolete portalled draft when the owner replaces the filter', async ({
  page
}) => {
  await page.goto(fixture + 'provider');
  const trigger = page.getByRole('button', { name: filterName, exact: true });
  const panel = page.locator('[data-popup-host="provider"]')
    .getByRole('dialog', { name: filterName, exact: true });
  const green = panel.getByRole('checkbox', { name: 'Green', exact: true });
  const red = panel.getByRole('checkbox', { name: 'Red', exact: true });
  const replace = page.getByRole('button', { name: 'Replace applied filter', exact: true });
  await trigger.click();
  await green.check();

  await replace.dispatchEvent('click');

  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.locator('tbody tr[data-row-key]')).toHaveAttribute('data-row-key', '1');
  await expect(page.locator('[data-popup-filters]')).toHaveText('[]');

  await trigger.click();

  await expect(red).toBeChecked();
  await expect(green).not.toBeChecked();
});
