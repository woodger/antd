import type { Locator } from '@playwright/test';
import { expect, test } from './test';

const dark = {
  surface: 'rgb(31, 31, 31)',
  text: 'rgba(255, 255, 255, 0.85)',
  primary: 'rgb(22, 119, 255)'
};
const accent = { ...dark, primary: 'rgb(211, 32, 41)' };

/** Снимает CSS панели, заголовка и кнопки. Все три зависят от темы провайдера. */
function readColors(dialog: Locator, title: string) {
  return dialog.evaluate((node, title) => {
    const surface = node.querySelector('[data-ant-modal-container]');
    const heading = [...node.querySelectorAll('[class*="-title"]')]
      .find(element => element.textContent?.trim() === title
        && [...element.classList].some(name => name.endsWith('-title')));
    const button = node.querySelector('.ant-btn-primary');
    if (!surface || !heading || !button) {
      return null;
    }

    return {
      surface: getComputedStyle(surface).backgroundColor,
      text: getComputedStyle(heading).color,
      primary: getComputedStyle(button).backgroundColor
    };
  }, title);
}

for (const profile of ['dark', 'dark-accent', 'holder-dark', 'holder-accent', 'local']) {
  test(`preserves Modal confirmation colors for ${profile}`, async ({ page }) => {
    await page.goto(`/modal-static-theme.html?profile=${profile}`);
    const dialog = page.locator('dialog[open]');
    const regular = page.getByRole('button', { name: 'Open regular modal' });
    const opener = page.getByRole('button', { name: 'Open static modal' });
    const bodyChildren = await page.locator('body').evaluate(node => node.children.length);
    await regular.click();
    await expect.poll(() => readColors(dialog, 'Regular modal')).toEqual(
      profile.endsWith('accent') ? accent : dark
    );
    const expected = await readColors(dialog, 'Regular modal');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);

    await opener.click();
    await expect(dialog).toHaveCount(1);
    expect(await dialog.evaluate(node =>
      node.parentElement === document.body ? 'body' : node.parentElement?.id
    )).toBe(profile === 'local' ? 'theme-container' : 'body');
    await expect.poll(() => readColors(dialog, 'Static modal')).toEqual(expected);

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
    await expect.poll(() => page.locator('body').evaluate(node => node.children.length))
      .toBe(bodyChildren);
  });
}

test('applies updated global Modal tokens to an open confirmation', async ({ page }) => {
  await page.goto('/modal-static-theme.html?profile=dark');
  const dialog = page.locator('body > dialog[open]');
  await page.getByRole('button', { name: 'Open static modal' }).click();
  await expect.poll(() => readColors(dialog, 'Static modal')).toEqual(dark);
  const original = await dialog.elementHandle();
  const button = dialog.locator('.ant-btn-primary');
  await button.focus();

  await page.getByRole('button', { name: 'Update static theme', includeHidden: true })
    .dispatchEvent('click');

  await expect.poll(() => readColors(dialog, 'Updated modal')).toEqual(accent);
  expect(await dialog.evaluate((node, previous) => node === previous, original)).toBe(true);
  await expect(button).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});
