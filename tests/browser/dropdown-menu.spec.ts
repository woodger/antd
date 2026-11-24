import type { Page } from '@playwright/test';
import { test, expect } from './test';
import reference from './fixtures/ant-design-dropdown-menu-reference.json' with { type: 'json' };

interface SourceClick {
  key: string;
  keyPath: string[];
  domEvent: { type: string; defaultPrevented: boolean; };
  selectedKeys?: string[];
}

// Читает полный журнал, чтобы отличить повтор события от смены его аргументов.
async function readEvents(page: Page): Promise<unknown[][]> {
  const json = await page.locator('#dropdown-menu-events').textContent();
  return JSON.parse(json ?? '[]');
}

// Сверяет события Menu и trigger. Закрытие командой в Svelte обновляет binding без callback.
function expectedEvents(events: readonly (readonly unknown[])[]) {
  return events.flatMap(([type, value, source]) => {
    if (type === 'dropdown') return source === 'trigger' ? [['trigger', value]] : [];
    if (type === 'branches') return [[type, value]];
    if (type === 'title-click') {
      const { key, type: domType } = value as { key: string; type: string; };
      return [[type, key, domType]];
    }
    const info = value as SourceClick;
    return [[type, info.key, info.keyPath, info.domEvent.type,
      info.domEvent.defaultPrevented, info.selectedKeys ?? null]];
  });
}

// Действия владельца обновляют props без перемещения фокуса в тестовую панель.
function update(page: Page, name: string) {
  return page.getByRole('button', { name, exact: true }).dispatchEvent('click');
}

// Выполняет те же действия клавиатурой и мышью, что в сохранённой записи React.
async function perform(page: Page, action: string) {
  if (action === 'trigger') return page.getByRole('button', { name: 'Commands' }).click();
  if (action === 'dispose') return update(page, 'Unmount Dropdown');
  if (action === 'active-alpha') return update(page, 'Activate Alpha');
  if (action === 'active-none') return update(page, 'Release active key');
  if (action === 'focus-branch') return page.getByRole('menuitem', { name: 'Branch' }).focus();
  if (action.startsWith('Arrow') || action === 'Escape') return page.keyboard.press(action);

  const key = action === 'leaf' ? '4' : action;
  const row = page.locator(`[data-dropdown-key="${key}"]`);
  if (action === 'blocked') {
    // Нативный disabled control не принимается locator.click, hit testing идёт через мышь.
    const bounds = await row.boundingBox();
    if (!bounds) throw new Error('Disabled Dropdown row must be displayed');
    return page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  }
  return row.click();
}

test.use({ viewport: { width: 1000, height: 650 } });
test.beforeEach(async ({ page }) => {
  await page.goto('/?fixture=dropdown-menu');
});

for (const { profile, frames } of reference.passes[0]) {
  if (profile.id === 'prevented') continue;

  test(`Dropdown delegates the ${profile.id} menu to the shared Menu model`, async ({ page }) => {
    await page.getByLabel('Dropdown menu profile', { exact: true }).selectOption(profile.id);
    const popup = page.locator('.source-dropdown');
    const menu = page.locator('#source-menu');
    const leaf = page.locator('[data-dropdown-key="4"]');
    const expected: unknown[][] = [];

    for (const { action, state } of frames) {
      if (action !== 'initial') await perform(page, action);
      if (state.popupVisible) await expect(popup, action).toBeVisible();
      else await expect(popup, action).toBeHidden();

      expected.push(...expectedEvents(state.events));
      await expect.poll(() => readEvents(page), { message: action }).toEqual(expected);
      const sourceLeaf = state.rows.find(row => row.key === '4');
      if (state.popupVisible && sourceLeaf?.visible) await expect(leaf).toBeVisible();
      if (state.popupVisible && sourceLeaf && !sourceLeaf.visible) await expect(leaf).toBeHidden();

      if (state.popupVisible && profile.id === 'semantics') {
        await expect(menu).toHaveClass(/\bcustom-nested-vertical\b/);
        await expect(menu).toHaveClass(/\bprovider-root\b/);
        await expect(menu).not.toHaveClass(/\bmenu-local-root\b/);
        const command = menu.getByRole('menuitem', { name: 'Alpha' });
        await expect(command).toHaveClass(/\bprovider-item\b/);
        await expect(command).toHaveClass(/\bdropdown-item\b/);
        await expect(command).not.toHaveClass(/\bmenu-local-item\b/);
        const sourceCommand = state.rows.find(row => row.key === 'alpha');
        if (!sourceCommand?.fontSize) throw new Error('Missing source style for Alpha');
        await expect(command).toHaveCSS('font-size', sourceCommand.fontSize);
      }
      if (profile.id === 'active-live' && (action === 'trigger' || action === 'active-alpha')) {
        const name = action === 'trigger' ? 'Omega' : 'Alpha';
        await expect(menu.getByRole('menuitem', { name })).toHaveClass(/-item-active\b/);
        await expect(menu.getByRole('menuitem', { name: 'Alpha' })).toBeFocused();
      }
      if (profile.id === 'nested-portal' && action === 'branch') {
        await expect(page.locator('#submenu-host').locator(leaf)).toBeVisible();
        await expect(leaf).toHaveAttribute('data-menu-payload', 'command-4');
      }
      if (profile.id === 'keyboard-rtl' && action === 'ArrowLeft') await expect(leaf).toBeFocused();
      if (profile.id === 'keyboard-rtl' && action === 'ArrowRight') {
        await expect(menu.getByRole('menuitem', { name: 'Branch' })).toBeFocused();
      }
    }
    await expect(page.locator('#dropdown-menu-shared-info')).toHaveText('true');
    await expect(leaf).toHaveCount(0);
  });
}

test('keeps the existing cancellation of a Dropdown item click', async ({ page }) => {
  await page.getByLabel('Dropdown menu profile', { exact: true }).selectOption('prevented');
  await perform(page, 'trigger');
  await perform(page, 'alpha');

  await expect(page.locator('.source-dropdown')).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Alpha' })).toBeFocused();
  await expect.poll(() => readEvents(page)).toEqual([
    ['trigger', true], ['item-click', 'alpha', ['alpha'], 'click', false, null]
  ]);
});

test('keeps nested popovers in open Shadow DOM inside the Dropdown focus boundary', async ({ page }) => {
  await page.getByLabel('Dropdown menu profile', { exact: true }).selectOption('shadow-portal');
  await perform(page, 'trigger');
  await page.getByRole('menuitem', { name: 'Branch' }).press('ArrowRight');

  const leaf = page.locator('#submenu-shadow').getByRole('menuitem', { name: 'Leaf' });
  await expect(leaf).toBeFocused();
  await expect(page.locator('.source-dropdown')).toBeVisible();
  await leaf.press('Enter');

  await expect(page.locator('.source-dropdown')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Commands' })).toBeFocused();
  await expect.poll(async () => (await readEvents(page)).map(event => event[0])).toEqual([
    'trigger', 'branches', 'item-click', 'branch-click', 'menu-click', 'branches'
  ]);
});

test('navigates a nested native Dropdown link through Space', async ({ page }) => {
  await page.getByLabel('Dropdown menu profile', { exact: true }).selectOption('nested-link');
  await perform(page, 'trigger');
  await perform(page, 'branch');

  const leaf = page.getByRole('menuitem', { name: 'Leaf' });
  await expect(leaf).toHaveAttribute('href', '#dropdown-nested-link');
  await leaf.press('Space');

  await expect(page).toHaveURL(/#dropdown-nested-link$/);
  await expect(page.locator('.source-dropdown')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Link destination' })).toBeFocused();
});

test('focuses the active Menu command during external or trigger opening with autoFocus', async ({
  page
}) => {
  await page.getByLabel('Dropdown menu profile', { exact: true }).selectOption('external-autofocus');
  await page.getByRole('button', { name: 'Open externally', exact: true }).click();

  const active = page.getByRole('menuitem', { name: 'Omega' });
  await expect(active).toBeFocused();
  await update(page, 'Close externally');

  await expect(page.locator('.source-dropdown')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Commands' })).toBeFocused();
  await expect.poll(() => readEvents(page)).toEqual([]);

  await perform(page, 'trigger');
  await expect(active).toBeFocused();
  await expect.poll(() => readEvents(page)).toEqual([['trigger', true]]);
});

test('leaves browser key combinations to the focused Dropdown command', async ({ page }) => {
  await perform(page, 'trigger');
  const first = page.getByRole('menuitem', { name: 'Alpha' });

  await first.press('Control+ArrowDown');
  await expect(first).toBeFocused();

  await first.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Omega' })).toBeFocused();
});

test('updates delegated Menu prefix and slots on the same native controls', async ({ page }) => {
  await page.getByLabel('Dropdown menu profile', { exact: true }).selectOption('semantics');
  await perform(page, 'trigger');
  await perform(page, 'branch');
  const leaf = page.getByRole('menuitem', { name: 'Leaf' });
  await leaf.focus();
  const before = await leaf.elementHandle();

  await update(page, 'Change Dropdown menu styling');

  await expect(leaf).toBeFocused();
  await expect(leaf).toHaveClass(/\bchanged-nested-item\b/);
  await expect(leaf).toHaveCSS('font-size', '19px');
  expect(await leaf.evaluate((node, previous) => node === previous, before)).toBe(true);
});
