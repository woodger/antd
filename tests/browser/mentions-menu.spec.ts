import type { Locator, Page } from '@playwright/test';
import { expect, test } from './test';
import reference from './fixtures/ant-design-mentions-menu-reference.json' with { type: 'json' };

type Case = (typeof reference.cases)[number];
type Sample = Case['before' | 'after'];

test.use({ viewport: { width: 960, height: 640 } });

/** Приводит служебные ключи React к исходным значениям, с которыми работает Svelte. */
function readSourceKey(key: unknown) {
  if (typeof key !== 'string') {
    throw new Error('Missing option key in Source capture');
  }

  return key.replace(/-:[^:]+:$/, '');
}

/** React сохраняет последний вызов popupRender и после закрытия. Здесь он виден в открытом меню. */
function nativeSample(state: Sample) {
  const { args, events, ...rest } = state;
  return {
    ...rest,
    args: state.menu ? {
      ...args,
      options: args.options.map(([key, value, label, disabled]) => [
        value === 'ANTD_SEARCHING' ? null : readSourceKey(key), value, label, disabled
      ])
    } : null,
    events: events.map(event => event[0] === 'select'
      ? [...event.slice(0, 3), readSourceKey(event[3]), event[4]] : event)
  };
}

/** Считывает список, контекст, события и положение каретки из публичного компонента. */
function snapshot(editor: Locator) {
  return editor.evaluate((node: HTMLTextAreaElement) => {
    const root = node.closest('[data-ant-mentions-root]');
    const listbox = root?.querySelector('[role="listbox"]');
    const context = root?.querySelector('[data-menu-context]')?.textContent;
    const log = document.getElementById('menu-events');
    const options = [...listbox?.querySelectorAll('[role="option"]') ?? []];
    let menu = null;

    if (listbox?.checkVisibility()) {
      const entries = options.map(option => ({
        label: option.textContent,
        active: [...option.classList].some(name => name.endsWith('-item-active'))
      }));
      // Native empty content принадлежит listbox и исключено из клавиатурных вариантов.
      if (!entries.length) {
        entries.push({ label: listbox.textContent?.trim() ?? '', active: false });
      }
      menu = {
        className: [...listbox.classList].find(name => name.endsWith('-menu')),
        entries, scrolled: listbox.scrollTop > 0
      };
    }

    return {
      menu,
      value: node.value,
      focused: node === document.activeElement,
      selection: [node.selectionStart, node.selectionEnd],
      events: JSON.parse(log?.textContent ?? '[]'),
      args: menu && context ? JSON.parse(context) : null
    };
  });
}

/** Открывает popup через ввод, используя только браузерную сборку пакета. */
async function openMenu(page: Page, profile: string, text = '@') {
  await page.goto(`/select-components-hydration.html?mentions-menu=${profile}`);
  await page.addScriptTag({ type: 'module', url: '/mentions-menu.client.ts' });
  const editor = page.getByRole('combobox', { name: 'Menu editor' });
  await editor.pressSequentially(text);
  const menu = page.getByRole('listbox');
  await expect(menu).toBeVisible();

  return { editor, menu };
}

for (const { profile, opening, before, after } of reference.cases) {
  test(`Mentions popupRender options follow Source for ${profile}`, async ({ page }) => {
    const { editor, menu } = await openMenu(page, profile, before.value);
    if (opening) {
      const appearing = page.locator('.mention-menu-motion-appear-active');
      await expect(appearing).toBeVisible();
      await expect.poll(() => snapshot(editor)).toEqual(nativeSample(opening));
      await appearing.evaluate(node => {
        for (const animation of node.getAnimations()) animation.finish();
      });
    }
    if (profile === 'override-arrow') await editor.press('ArrowDown');
    if (profile === 'hover-enter') {
      await menu.getByRole('option', { name: 'Second in menu', exact: true }).hover();
    }

    await expect.poll(() => snapshot(editor)).toEqual(nativeSample(before));
    await expect(menu).toHaveAttribute('id', /.+/);
    await expect(editor).toHaveAttribute('aria-controls', await menu.getAttribute('id') ?? '');
    if (before.menu.entries.some(entry => entry.active)) {
      const option = menu.getByRole('option', { selected: true });
      await expect(option).toHaveAttribute('id', /.+/);
      await expect(editor).toHaveAttribute(
        'aria-activedescendant', await option.getAttribute('id') ?? ''
      );
    }
    else {
      await expect(editor).not.toHaveAttribute('aria-activedescendant');
    }

    if (profile === 'override-click' || profile === 'loading-click') {
      const name = profile === 'override-click' ? 'Only in menu' : 'From cache';
      await menu.getByRole('option', { name, exact: true }).click();
    }
    else if (profile.startsWith('scroll-')) {
      await editor.press('ArrowUp');
    }
    else {
      await editor.press('Enter');
    }

    await expect.poll(() => snapshot(editor)).toEqual(nativeSample(after));
  });
}

test('Mentions changes the visible menu in place without changing the editor option list', async ({ page }) => {
  const { editor, menu } = await openMenu(page, 'live');
  const originalMenu = await menu.elementHandle();
  const originalEditor = await editor.elementHandle();

  await page.getByRole('button', { name: 'Update menu options' }).dispatchEvent('click');

  await expect(menu.getByRole('option')).toHaveText(['New Alpha']);
  await expect(menu).toHaveClass(/(?:^|\s)caller-menu-menu(?:\s|$)/);
  expect(await menu.evaluate((element, previous) => element === previous, originalMenu)).toBe(true);
  expect(await editor.evaluate((element, previous) => element === previous, originalEditor)).toBe(true);
  await expect(editor).toBeFocused();

  await editor.press('Enter');

  await expect(editor).toHaveValue('@alpha ');
  await expect(menu).toHaveCount(0);
});
