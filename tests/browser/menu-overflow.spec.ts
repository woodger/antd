import type { Locator, Page } from '@playwright/test';
import { test, expect } from './test';
import source from './fixtures/ant-design-menu-overflow-reference.json' with { type: 'json' };

const menu = (page: Page) => page.getByRole('menu', { name: 'Overflow menu', exact: true });
const more = (page: Page) => menu(page).getByRole('menuitem', { name: 'ellipsis', exact: true });
const popup = (page: Page) => page.locator('.custom-overflow-popup');
const events = (page: Page) => page.getByLabel('Menu overflow events');

test.use({ viewport: { width: 1440, height: 1000 } });

test.beforeEach(async ({ page }) => {
  await page.goto('/?fixture=menu-overflow');
  await expect(menu(page)).toBeVisible();
});

/** Изменяет ширину через публичный prop с сохранением фокуса в Menu. */
async function resize(page: Page, width: number) {
  await page.getByLabel('Menu width', { exact: true }).evaluate((input: HTMLInputElement, value) => {
    input.value = String(value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, width);
}

/** Снимает порядок и доступность строк; popup остаётся измерим после закрытия. */
async function snapshot(root: Locator) {
  return root.evaluate(node => {
    const row = node.querySelector<HTMLElement>(':scope > [data-menu-overflow-rest]');
    const title = row?.querySelector(':scope > [role="menuitem"]');
    const surface = document.querySelector<HTMLElement>('.custom-overflow-popup');

    /** Класс fixture связывает один и тот же тестовый элемент в обеих библиотеках. */
    function getKey(element: Element) {
      return [...element.classList].find(cls => cls.startsWith('sample-'))?.slice(7);
    }

    const entries = [...node.children].flatMap(element => {
      const key = getKey(element);
      if (key === undefined || !(element instanceof HTMLElement)) {
        return [];
      }
      const trigger = element.matches('[role=menuitem]') ? element
        : element.querySelector(':scope > [role=menuitem]');
      return [{
        key,
        width: element.offsetWidth,
        hidden: element.ariaHidden === 'true',
        items: element.hasAttribute('data-menu-overflow-item'),
        registered: trigger?.hasAttribute('data-menu-id') ?? false
      }];
    });
    return {
      available: node.clientWidth,
      entries,
      rest: row ? {
        visible: row.ariaHidden !== 'true',
        width: row.offsetWidth,
        selected: [...row.classList].some(cls => cls.endsWith('-submenu-selected')),
        disabled: [...row.classList].some(cls => cls.endsWith('-submenu-disabled')),
        title: title?.textContent?.trim() ?? null,
        icon: !!row.querySelector('.anticon-ellipsis'),
        open: title?.ariaExpanded === 'true'
      } : null,
      popup: surface ? {
        shown: surface.matches(':popover-open'),
        keys: [...surface.querySelector('ul')!.children].map(getKey),
        css: [...surface.classList].some(cls => cls.endsWith('-submenu-popup'))
      } : null
    };
  });
}

for (const reference of source.cases.filter(entry => !['under-ten', 'zero'].includes(entry.name))) {
  test(`matches original horizontal layout for ${reference.name}`, async ({ page }) => {
    await page.getByLabel('Menu indicator').selectOption(reference.indicator);
    if (reference.rtl) {
      await page.getByLabel('Menu RTL', { exact: true }).check();
      await page.getByLabel('Menu custom prefix').check();
    }
    if (reference.disabledOverflow) {
      await page.getByLabel('Disable menu overflow').check();
    }
    if (reference.mode) {
      await page.getByLabel('Menu mode').selectOption(reference.mode);
    }

    await resize(page, reference.width);
    await page.getByLabel('Force submenu render').check();

    const { active: _active, activeInHiddenRow: _hidden, events: _events, ...expected } = reference.result;
    await expect.poll(() => snapshot(menu(page))).toEqual(expected);
    await expect(menu(page)).not.toHaveAttribute('overflowedindicator');
    await expect(menu(page)).not.toHaveAttribute('disabledoverflow');
  });
}

test('matches original overflow open, nested selection and event paths', async ({ page }) => {
  await resize(page, 185);
  await expect(more(page)).toBeVisible();
  await more(page).focus();
  await more(page).press('ArrowDown');

  const branch = popup(page).getByRole('menuitem', { name: 'Branch', exact: true });
  await expect(branch).toBeFocused();
  await expect(events(page)).toHaveText(JSON.stringify(source.flows[0].events));
  await popup(page).getByRole('menuitem', { name: 'Last', exact: true }).click();

  await expect(popup(page)).toBeHidden();
  await expect(events(page)).toHaveText(JSON.stringify(source.flows[1].events));
  await more(page).click();
  await branch.click();

  await expect(events(page)).toHaveText(JSON.stringify(source.flows[2].events));
  await page.getByRole('menuitem', { name: 'Inner', exact: true }).click();
  await page.getByRole('link', { name: 'Leaf', exact: true }).focus();
  await page.getByRole('link', { name: 'Leaf', exact: true }).press('Enter');

  await expect(page).toHaveURL(/#menu-overflow-destination$/);
  await expect(events(page)).toHaveText(JSON.stringify(source.flows[3].events));
  await expect(popup(page)).toBeHidden();
});

test('relocates focus at width changes and keeps the mounted root rows', async ({ page }) => {
  const last = menu(page).getByRole('menuitem', { name: 'Last', exact: true });
  await last.focus();
  const original = await last.elementHandle();

  await resize(page, 190);

  await expect(more(page)).toBeFocused();
  await expect(menu(page).locator(':scope > .sample-last')).toHaveAttribute('inert', '');
  await more(page).click();
  await page.getByRole('button', { name: 'Focus last menu item' }).evaluate(button => {
    (button as HTMLButtonElement).click();
  });
  await expect(popup(page).getByRole('menuitem', { name: 'Last', exact: true })).toBeFocused();

  await resize(page, 420);

  await expect(last).toBeFocused();
  expect(await last.evaluate((node, previous) => node === previous, original)).toBe(true);
  await expect(popup(page)).toBeHidden();
  await expect(events(page)).toHaveText('[["open",["rc-menu-more"]]]');

  await resize(page, 190);

  await expect(popup(page).getByRole('menuitem', { name: 'Last', exact: true })).toBeFocused();
  await popup(page).getByRole('menuitem', { name: 'Last', exact: true }).press('Escape');

  await expect(more(page)).toBeFocused();
  await expect(popup(page)).toBeHidden();
});

test('keeps all commands reachable in a very narrow row and responds to new items', async ({
  page
}) => {
  await resize(page, 8);
  await expect(more(page)).toBeVisible();
  await more(page).click();
  await expect(popup(page).getByRole('menuitem', { name: 'First', exact: true })).toBeVisible();
  await page.getByLabel('Add menu item', { exact: true }).evaluate((input: HTMLInputElement) => {
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  await expect(popup(page).getByRole('menuitem', { name: 'Added', exact: true })).toBeVisible();

  await resize(page, 0);

  await expect(menu(page).locator('[data-menu-overflow-rest]')).toHaveAttribute('inert', '');
  await expect(popup(page)).toBeHidden();

  await resize(page, 420);
  await page.getByLabel('Disable menu overflow').check();
  await expect(menu(page).getByRole('menuitem', { name: 'Added', exact: true })).toBeVisible();
  await expect(popup(page)).toHaveCount(0);

  await page.getByLabel('Mount overflow menu').uncheck();
  await expect(menu(page)).toHaveCount(0);
  await expect(popup(page)).toHaveCount(0);
});

test('uses RTL root navigation and returns from a nested overflow popup', async ({ page }) => {
  await page.getByLabel('Menu RTL', { exact: true }).check();
  await resize(page, 190);
  const first = menu(page).getByRole('menuitem', { name: 'First', exact: true });
  await first.focus();
  await first.press('ArrowLeft');

  await expect(more(page)).toBeFocused();
  await more(page).press('ArrowDown');

  const branch = popup(page).getByRole('menuitem', { name: 'Branch', exact: true });
  await expect(branch).toBeFocused();
  await branch.press('ArrowLeft');

  const nested = page.getByRole('menuitem', { name: 'Nested', exact: true });
  await expect(nested).toBeFocused();
  await nested.press('ArrowRight');

  await expect(branch).toBeFocused();
  await branch.press('ArrowRight');

  await expect(more(page)).toBeFocused();
  await expect(popup(page)).toBeHidden();
});

test('moves groups as a whole and preserves the semantic slots of hidden commands', async ({
  page
}) => {
  await page.getByLabel('Group menu items').check();
  await resize(page, 65);
  await expect(more(page)).toBeVisible();
  await expect(menu(page).locator('.sample-group')).toHaveAttribute('inert', '');
  await more(page).click();

  const group = popup(page).getByRole('group');
  await expect(group.getByRole('menuitem', { name: 'G1' })).toHaveClass(/slot-first/);
  await expect(group.getByRole('menuitem')).toHaveCount(2);
  await expect(popup(page).getByRole('separator')).toHaveCount(1);
  await expect(popup(page).getByRole('menuitem', { name: 'Last' })).toHaveClass(/slot-first/);
  await popup(page).getByRole('menuitem', { name: 'Branch' }).click();
  await expect(page.getByRole('menuitem', { name: 'Nested', exact: true }))
    .toHaveClass(/slot-nested/);

  await group.getByRole('menuitem', { name: 'G1' }).click();

  await expect(events(page)).toContainText('"click","g1",["g1","rc-menu-more"],"g1"');
});

test('returns a command to the row when the custom indicator becomes narrower', async ({
  page
}) => {
  await resize(page, 240);
  const blocked = menu(page).getByRole('menuitem', { name: 'Blocked', exact: true });
  await expect(blocked).toBeVisible();

  await page.getByLabel('Menu indicator').selectOption('custom');

  await expect(blocked).toHaveCount(0);
  await expect(menu(page).getByRole('menuitem', { name: 'More', exact: true })).toBeVisible();

  await page.getByLabel('Menu indicator').selectOption('null');

  await expect(blocked).toBeVisible();
});
