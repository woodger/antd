import type { Locator, Page } from '@playwright/test';
import { expect, test } from './test';
import reference from './fixtures/ant-design-mentions-menu-focus-reference.json' with { type: 'json' };

type SourceState = (typeof reference.cases)[number]['steps'][number]['state'];

test.use({ viewport: { width: 960, height: 640 } });

/** Uploads one profile of the assembled package and opens the popup with a full-time key. */
async function openMenus(page: Page, profile: string) {
  await page.goto(`/select-components-hydration.html?mentions-menu=${profile}`);
  await page.addScriptTag({ type: 'module', url: '/mentions-menu.client.ts' });
  const editor = page.getByRole('combobox', { name: 'Menu editor' });
  await editor.press('@');
  await expect(page.getByRole('listbox').first()).toBeVisible();
  return editor;
}

/** Compares payload on the source keys of the options, without the suffix rc-mentions. */
function sourceSample(state: SourceState) {
  const menus = state.menus.map(menu => menu.options.map(({ text, disabled, highlight }) =>
    ({ text, disabled, highlight })));
  const ids = state.menus.flatMap(menu => menu.options.map(option => option.id));
  const events = state.events.map(event => event[0] === 'select'
    ? [...event.slice(0, 3), event[3].replace(/-:[^:]+:$/, ''), event[4]]
    : event);
  return {
    value: state.value, selection: state.selection, focus: state.focus, events, menus,
    distinctOptionIds: new Set(ids).size
  };
}

/** Removes the observed state of a closed or open popup and editor. */
function nativeSample(editor: Locator) {
  return editor.evaluate((node: HTMLTextAreaElement) => {
    const owner = node.closest('[data-ant-mentions-root]');
    const listboxes = [...owner?.querySelectorAll('[role="listbox"]') ?? []];
    const menus = listboxes.map(listbox => [...listbox.querySelectorAll('[role="option"]')].map(
      option => ({
        text: option.textContent,
        disabled: option.getAttribute('aria-disabled'),
        highlight: [...option.classList].some(name => name.endsWith('-item-active'))
      })
    ));
    const ids = listboxes.flatMap(listbox =>
      [...listbox.querySelectorAll('[role="option"]')].map(option => option.id));
    const focused = node.ownerDocument.activeElement;
    const log = node.ownerDocument.getElementById('menu-events');
    const focus = focused === node ? 'editor' : focused?.getAttribute('role') === 'option'
      ? `item:${focused.textContent}` : focused?.tagName.toLowerCase();

    return {
      value: node.value, selection: [node.selectionStart, node.selectionEnd], focus, menus,
      events: JSON.parse(log?.textContent ?? '[]'), distinctOptionIds: new Set(ids).size
    };
  });
}

for (const { profile, steps } of reference.cases.filter(sample => sample.profile.startsWith('copies'))) {
  test(`Mentions independently renders each Source menu instance for ${profile}`, async ({ page }) => {
    const editor = await openMenus(page, profile);
    const otherBeta = page.getByRole('option', { name: 'Other Beta', exact: true });

    for (const { action, state } of steps) {
      if (action === 'select:Other Beta') await otherBeta.click();
      else if (action === 'hover:Other Beta') await otherBeta.hover();
      else if (action === 'Enter') await editor.press('Enter');

      await expect.poll(() => nativeSample(editor)).toEqual(sourceSample(state));
    }
  });
}

test('Mentions links only mounted listboxes and keeps a surviving menu and active option usable', async ({ page }) => {
  const editor = await openMenus(page, 'copies-live');
  const primary = page.locator('[data-menu-copy="primary"]').getByRole('listbox');
  const secondary = page.locator('[data-menu-copy="secondary"]').getByRole('listbox');
  const toggle = page.getByRole('button', { name: 'Toggle primary menu' });
  const listboxes = page.getByRole('listbox');

  await expect(primary).toHaveAttribute('id', 'menu-owner-list');
  const secondId = await secondary.getAttribute('id') ?? '';
  expect(secondId).toMatch(/^menu-owner.*-list$/);
  expect(secondId).not.toBe('menu-owner-list');
  await expect(editor).toHaveAttribute('aria-controls', `menu-owner-list ${secondId}`);
  await expect(editor).toHaveAttribute('aria-activedescendant', 'menu-owner-option-0');
  const original = await secondary.elementHandle();

  await toggle.dispatchEvent('click');

  await expect(listboxes).toHaveCount(1);
  await expect(secondary).toHaveAttribute('id', secondId);
  await expect(editor).toHaveAttribute('aria-controls', secondId);
  const otherAlpha = secondary.getByRole('option', { name: 'Other Alpha' });
  await expect(editor).toHaveAttribute('aria-activedescendant', await otherAlpha.getAttribute('id') ?? '');

  await editor.press('ArrowDown');

  await expect(editor).not.toHaveAttribute('aria-activedescendant');

  await toggle.dispatchEvent('click');

  await expect(listboxes).toHaveCount(2);
  await expect(editor).toHaveAttribute('aria-activedescendant', 'menu-owner-option-2');
  expect(await secondary.evaluate((element, saved) => element === saved, original)).toBe(true);

  await page.getByRole('button', { name: 'Rename menu owner' }).dispatchEvent('click');

  await expect(editor).toHaveAttribute('id', 'other-menu-owner');
  await expect(secondary).toHaveAttribute('id', 'other-' + secondId);
  await expect(editor).toHaveAttribute('aria-controls', `other-${secondId} other-menu-owner-list`);
  await expect(editor).toHaveAttribute('aria-activedescendant', 'other-menu-owner-option-2');
  await expect(editor).toBeFocused();
});

test('Mentions Escape from a second listbox restores focus and selection without running selection callbacks', async ({ page }) => {
  const editor = await openMenus(page, 'copies-escape');
  const other = page.getByRole('option', { name: 'Other Beta' });
  await editor.evaluate((node: HTMLTextAreaElement) => node.setSelectionRange(0, 1, 'backward'));
  await other.focus();
  await expect(other).toBeFocused();

  await page.keyboard.press('Escape');

  await expect(editor).toBeFocused();
  await expect(editor).toHaveValue('@');
  await expect(editor).toHaveAttribute('aria-expanded', 'false');
  await expect(editor).not.toHaveAttribute('aria-controls');
  await expect(editor).not.toHaveAttribute('aria-activedescendant');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  const selection = await editor.evaluate((node: HTMLTextAreaElement) => [
    node.selectionStart, node.selectionEnd, node.selectionDirection
  ]);
  expect(selection).toEqual([0, 1, 'backward']);
  await expect(page.locator('#menu-events')).toHaveText(JSON.stringify([['change', '@']]));
});

test('Mentions outside dismissal leaves focus on the pressed control', async ({ page }) => {
  const editor = await openMenus(page, 'copies-outside');
  await page.getByRole('option', { name: 'Other Beta' }).focus();
  const outside = page.getByRole('button', { name: 'Outside menu' });

  await outside.click();

  await expect(outside).toBeFocused();
  await expect(editor).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#menu-events')).toHaveText(JSON.stringify([['change', '@'], ['blur']]));
});

for (const [key, option, value] of [
  ['Enter', 'Alpha', 'alpha'], ['Space', 'Beta', 'beta']
] as const) {
  test(`Mentions activates a focused native option with ${key} and restores the textarea`, async ({ page }) => {
    const editor = await openMenus(page, 'focus-item');
    const choice = page.getByRole('option', { name: option, exact: true });
    await choice.focus();
    await expect(choice).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(choice).toBeFocused();
    await page.keyboard.press(key);

    const text = `@${value} `;
    await expect(editor).toHaveValue(text);
    await expect(editor).toBeFocused();
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(page.locator('#menu-events')).toHaveText(JSON.stringify([
      ['change', '@'], ['change', text], ['select', value, option, `${value}-key`, '@']
    ]));
  });
}
