import type { Locator } from '@playwright/test';
import { test, expect } from './test';
import { readMenuConfig } from './menu-config-metrics';
import source from './fixtures/ant-design-menu-config-reference.json' with { type: 'json' };

test.use({ viewport: { width: 1440, height: 1000 } });

/** Applies existing adaptations of DOM to a copy of the reference measurement. */
function expectedMenuConfig(snapshot: typeof source.cases[number]) {
  const { calls, nodes } = structuredClone(snapshot);
  nodes.parentTitle.tag = 'button';
  nodes.nestedTitle.tag = 'button';
  if (snapshot.name === 'horizontal') {
    // Rc-overflow records opacity:1 to visible points, outside the semantic layers.
    delete nodes.leaf.styles.opacity;
    delete nodes.parent.styles.opacity;
    delete nodes.rootGroupItem.styles.opacity;
    // Native button resets the internal indent of the first horizontal trigger.
    nodes.parentTitle.styles = { 'padding-inline-start': '0px' };
  }

  return { calls, nodes };
}

/** Changes the configuration without transferring the keyboard focus from the menu. */
async function toggle(locator: Locator, checked: boolean) {
  await locator.evaluate((node: HTMLInputElement, checked) => {
    node.checked = checked;
    node.dispatchEvent(new Event('change', { bubbles: true }));
  }, checked);
}

for (const reference of source.cases) {
  test(`matches original Menu semantic slots and callback props for ${reference.name}`, async ({
    page
  }) => {
    const fixture = reference.name === 'inline' ? 'menu-config' : `menu-config-${reference.name}`;
    await page.goto(`/?fixture=${fixture}`);
    await page.mouse.move(1400, 950);
    await expect(page.getByLabel('Menu config ref')).toHaveText('mounted');
    const expected = expectedMenuConfig(reference);
    await expect.poll(async () => {
      const sample = await page.evaluate(readMenuConfig);
      if (!sample) {
        return null;
      }
      for (const slot of ['parentList', 'nestedList']) {
        // Svelte synchronizes the color and font of a separate list with the theme.
        const styles = sample.nodes[slot]?.styles;
        if (styles?.color === 'inherit') {
          delete styles.color;
        }
        if (styles?.['font-weight'] === 'inherit') {
          delete styles['font-weight'];
        }
      }
      return sample;
    }).toEqual(expected);
  });
}

test('updates popup semantic style, positioning and icons on the same focused branch', async ({
  page
}) => {
  await page.goto('/?fixture=menu-config-vertical');
  await page.mouse.move(1400, 950);
  const popup = page.locator('.x-popup-parent');
  const menu = page.getByRole('menu', { name: 'Semantic menu' });
  const title = menu.getByRole('menuitem', { name: /Parent/ });
  const child = popup.getByRole('menuitem', { name: 'C Child', exact: true });
  await expect(popup).toBeVisible();
  await expect(child).toBeVisible();
  await child.focus();
  const previousPopup = await popup.elementHandle();
  const previousChild = await child.elementHandle();

  await page.getByLabel('Menu theme').selectOption('dark');

  await expect(menu).toHaveClass(/ant-menu-dark/);
  await expect.poll(async () => {
    const sample = await page.evaluate(readMenuConfig);
    return sample?.calls.localClasses;
  }).toMatchObject({ theme: 'dark' });
  await child.focus();

  await toggle(page.getByLabel('Update menu styles'), true);

  await expect(menu).toHaveClass(/l-root-live/);
  await expect(popup).toHaveClass(/l-root-live/);
  await expect(popup).toHaveCSS('background-color', 'rgb(119, 102, 85)');
  await expect(popup).toHaveCSS('z-index', '3023');
  await expect(child).toBeFocused();

  await toggle(page.getByLabel('Position menu popup'), true);

  await expect(popup).toHaveCSS('left', '640px');
  await expect(popup).toHaveCSS('top', '320px');
  await expect(popup).toHaveCSS('max-width', '212px');
  await expect(child).toBeFocused();

  await toggle(page.getByLabel('Position menu popup'), false);

  await expect(popup).not.toHaveCSS('left', '640px');
  await expect(popup).not.toHaveCSS('top', '320px');
  await expect(popup).not.toHaveCSS('max-width', '212px');
  expect(await popup.evaluate((node, original) => node === original, previousPopup)).toBe(true);
  expect(await child.evaluate((node, original) => node === original, previousChild)).toBe(true);
  await expect(child).toBeFocused();

  await expect(title.locator('.provider-expand')).toHaveText('+');
  await toggle(page.getByLabel('Hide menu expand icon'), true);

  await expect(title.locator('.provider-expand')).toHaveCount(0);
  await expect(title.locator('.ant-menu-submenu-arrow')).toHaveCount(0);
  await expect(popup.locator('.provider-expand')).toHaveText('item-nested');
  await expect(child).toBeFocused();

  await toggle(page.getByLabel('Hide menu expand icon'), false);
  await title.click();

  await expect(title).toHaveAttribute('aria-expanded', 'false');
  await expect(title.locator('.provider-expand')).toHaveText('-');
});
