import type { Page } from '@playwright/test';
import { test, expect } from './test';
import source from './fixtures/ant-design-menu-popup-render-reference.json' with { type: 'json' };

const menu = (page: Page) => page.getByRole('menu', { name: 'Popup render menu', exact: true });
const events = (page: Page) => page.getByLabel('Popup render events', { exact: true });
const shells = (page: Page) => page.locator('[data-menu-render-owner]');
const branch = (page: Page) => menu(page).getByRole('menuitem', { name: 'Branch', exact: true });
const samplePicker = (page: Page) =>
  page.getByRole('combobox', { name: 'Popup render sample', exact: true });

// Updates control openKeys without pointerdown outside the open submenu.
async function setOpen(page: Page, keys: readonly string[]) {
  await page.getByLabel('Popup render open keys', { exact: true }).evaluate(
    (input: HTMLInputElement, value) => {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    },
    keys.join(',')
  );
}

// Switches the prop by saving the focus and selection in the popup.
async function setFlag(page: Page, label: string, checked: boolean) {
  await page.getByRole('checkbox', { name: label, exact: true }).evaluate(
    (input: HTMLInputElement, value) => {
      input.checked = value;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    },
    checked
  );
}

// Extracts a limited public result in the initial measurement format.
async function contents(page: Page, visible = true) {
  return shells(page).filter({ visible }).evaluateAll(elements => elements.map(element => ({
    owner: element.getAttribute('data-menu-render-owner'),
    branch: element.getAttribute('data-menu-render-branch'),
    path: element.getAttribute('data-menu-render-path'),
    visible: Boolean(element.getClientRects().length)
      && getComputedStyle(element).visibility !== 'hidden',
    header: element.firstElementChild?.getAttribute('role') ?? null,
    children: [...element.querySelectorAll(
      ':scope > ul > [role="menuitem"], :scope > ul > li > [role="menuitem"]'
    )].map(entry => entry.textContent?.trim())
  })));
}

test.use({ viewport: { width: 1100, height: 900 }, reducedMotion: 'reduce' });
test.beforeEach(async ({ page }) => {
  await page.goto('/?fixture=menu-popup-render');
  await expect(menu(page)).toBeVisible();
});

for (const sample of source.cases) {
  const { id, width, mode, collapsed, empty } = sample.options;
  test(`matches original popup render and event paths for ${id}`, async ({ page }) => {
    await samplePicker(page).selectOption(id);
    const isInline = mode === 'inline' && !collapsed;

    if (!isInline) {
      await expect.poll(() => contents(page, false)).toEqual(sample.closed.owners);
    }
    else {
      await expect(shells(page)).toHaveCount(0);
    }

    const keys = width ? ['rc-menu-more', 'branch', 'inner'] : ['branch', 'inner'];
    await setOpen(page, keys);

    const shown = sample.opened.owners.filter(owner => owner.visible);
    await expect.poll(() => contents(page)).toEqual(shown);
    await expect(menu(page)).not.toHaveAttribute('popuprender');
    if (empty) {
      await expect(branch(page)).toHaveAttribute('aria-expanded', 'true');
      const controlled = await branch(page).getAttribute('aria-controls');
      await expect(page.locator(`[id="${controlled}"]`)).toHaveCount(1);
      await expect(page.getByRole('menuitem', { name: 'Child', exact: true })).toHaveCount(0);
    }
    else {
      await page.getByRole('menuitem', { name: 'Leaf', exact: true }).click();
    }
    await expect(events(page)).toHaveText(JSON.stringify(sample.selected.events));

    await setFlag(page, 'Update popup content', true);
    await setOpen(page, []);

    if (!isInline) {
      await expect.poll(() => contents(page, false)).toEqual(sample.reclosed.owners);
    }
    await expect(shells(page).filter({ visible: true })).toHaveCount(0);
  });
}

for (const plain of [false, true]) {
  test(`follows the displayed sibling order in ${plain ? 'a replacement' : 'the original'} list`,
    async ({ page }) => {
      await samplePicker(page).selectOption('replace-origin');
      await setFlag(page, 'Use a plain popup list', plain);
      await setFlag(page, 'Accept popup render keys', true);
      const expected = source.navigation.find(sample => sample.options.menuList);
      if (!expected) {
        throw new Error('Missing source navigation for a custom menu list');
      }

      await branch(page).focus();
      await branch(page).press('ArrowRight');

      const row = (name: string) => page.getByRole('menuitem', { name, exact: true });
      await expect(row(expected.navigation.enter)).toBeFocused();
      for (const [key, name] of [
        ['End', expected.navigation.last],
        ['Home', expected.navigation.first],
        ['ArrowDown', expected.navigation.down]
      ]) {
        await page.keyboard.press(key);

        await expect(row(name)).toBeFocused();
      }
      await page.keyboard.press('Escape');

      await expect(branch(page)).toBeFocused();
      await expect(shells(page).filter({ visible: true })).toHaveCount(0);
    });
}

test('retains portal editor focus and draft through live updates and reopening', async ({ page }) => {
  await page.getByRole('checkbox', { name: 'Use popup render container', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Accept popup render keys', exact: true }).check();
  await branch(page).click();
  const host = page.locator('#menu-popup-render-host');
  const draft = host.getByRole('textbox', { name: 'Menu draft branch', exact: true });
  const original = await draft.elementHandle();
  await draft.fill('Persistent draft');
  await draft.press('Home');

  await expect(draft).toBeFocused();
  expect(await draft.evaluate((input: HTMLInputElement) => input.selectionStart)).toBe(0);
  await draft.evaluate((input: HTMLInputElement) => input.setSelectionRange(1, 4));
  await setFlag(page, 'Update popup content', true);

  await expect(host.locator('[data-menu-render-branch="branch"]'))
    .toHaveAttribute('data-menu-render-owner', 'updated');
  await expect(draft).toBeFocused();
  expect(await draft.evaluate((input: HTMLInputElement, previous) => [
    input === previous, input.selectionStart, input.selectionEnd
  ], original)).toEqual([true, 1, 4]);

  await draft.press('Escape');

  await expect(draft).toBeHidden();
  await expect(branch(page)).toBeFocused();
  await branch(page).click();

  await expect(draft).toHaveValue('Persistent draft');
  expect(await draft.evaluate((node, previous) => node === previous, original)).toBe(true);
  await page.getByRole('checkbox', { name: 'Mount popup render menu', exact: true }).uncheck();

  await expect(host.locator('.menu-popup')).toHaveCount(0);
  await expect(page.getByLabel('Popup render mounted')).toHaveText('none');
});

test('restores the renderer chain and keeps native groups, refs and selection', async ({ page }) => {
  await samplePicker(page).selectOption('replace-origin');
  await setFlag(page, 'Add popup group', true);
  await setOpen(page, ['branch']);
  const pane = page.locator('[data-menu-render-path="branch"]');
  const command = pane.getByRole('menuitem', { name: 'Child', exact: true });
  const focusRef = page.getByRole('button', { name: 'Focus rendered Child', exact: true });

  await expect(pane.getByRole('separator')).toHaveCount(1);
  const disabled = pane.getByRole('menuitem', { name: 'Disabled', exact: true });
  await expect(disabled).toHaveAttribute('aria-disabled', 'true');
  await focusRef.evaluate((button: HTMLButtonElement) => button.click());

  await expect(command).toBeFocused();
  await command.press('Enter');

  await expect(events(page)).toHaveText(JSON.stringify([
    ['click', 'child', ['child', 'branch']],
    ['select', 'child', ['child']],
    ['open', []]
  ]));
  await setFlag(page, 'Override branch popup', false);
  await expect(pane).toHaveAttribute('data-menu-render-owner', 'root');

  await setFlag(page, 'Render root popups', false);

  await expect(shells(page)).toHaveCount(0);
  await expect(page.getByRole('menuitem', { name: 'Child', exact: true })).toBeVisible();
});
