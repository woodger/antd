import { expect, test } from '../test';
import source from '../fixtures/ant-design-auxiliary-z-index-context-reference.json' with { type: 'json' };

test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const fixture = '/?fixture=auxiliary-z-index-context&profile=';
type Profile = (typeof source.cases)[number];

/** Reads the layer at each surface and its nested clue. */
function snapshot() {
  const surfaces = {
    tour: '.zi-tour.ant-tour',
    tourMask: '.zi-tour.ant-tour-mask',
    tourTooltip: '.zi-tour-tooltip',
    color: '.zi-color',
    colorTooltip: '.zi-color-tooltip',
    float: '.zi-float',
    floatTooltip: '.zi-float-tooltip',
    floatSemantic: '.zi-float-semantic',
    floatGroup: '.zi-float-group',
    floatItem: '.zi-float-item',
    floatTrigger: '.zi-float-group .ant-float-btn-group-trigger',
    floatBackTop: '.zi-float-back-top',
    image: 'dialog.zi-image',
    imageTooltip: '.zi-image-tooltip',
    imageGroup: 'dialog.zi-image-group',
    table: '.zi-table-filter',
    tableTooltip: '.zi-table-tooltip',
    tableDefault: '.filter-popover.zi-table-default',
    tableTriggerTip: '.zi-table-icon-tooltip'
  };

  return Object.fromEntries(Object.entries(surfaces).map(([name, selector]) => {
    const node = document.querySelector<HTMLElement>(selector);
    const layer = node && {
      computed: getComputedStyle(node).zIndex,
      inline: node.style.zIndex || null
    };
    return [name, layer];
  }));
}

/** Takes into account two fixed CSS-contract Svelte, measuring the remaining layers by React. */
function expectedLayers(profile: Profile['profile'], observed: Profile['initial']) {
  const layers = { ...observed };
  if (profile.child === undefined) {
    // Slot styles.root remains CSS layer FloatButton and overrides the value from the context.
    layers.floatSemantic = { computed: '1660', inline: '1660' };
  }

  if (profile.child === 0) {
    // Native viewer applies a numerical preview.zIndex, including an explicit 0.
    layers.image = { computed: '0', inline: '0' };
    layers.imageGroup = { computed: '0', inline: '0' };
  }

  return layers;
}

for (const { profile, initial, updated } of source.cases) {
  test(`Auxiliary surfaces inherit the Ant Design layer in ${profile.id}`, async ({ page }) => {
    await page.goto(fixture + profile.id);
    const defaultFilter = page.locator('.zi-table-default [data-ant-table-filter-part="trigger"]');
    await defaultFilter.dispatchEvent('click');
    const filter = page.locator('.filter-popover.zi-table-default');
    await expect(filter).toBeVisible();

    await expect.poll(() => page.evaluate(snapshot)).toEqual(expectedLayers(profile, initial));

    if (updated) {
      const originalFilter = await filter.elementHandle();
      const color = page.locator('.zi-color');
      const originalColor = await color.elementHandle();
      const view = page.locator('dialog.zi-image');
      const originalView = await view.elementHandle();

      await page.locator('[data-update-auxiliary-layer]').dispatchEvent('click');

      await expect.poll(() => page.evaluate(snapshot)).toEqual(expectedLayers(profile, updated));
      expect(await filter.evaluate((node, before) => node === before, originalFilter)).toBe(true);
      expect(await color.evaluate((node, before) => node === before, originalColor)).toBe(true);
      expect(await view.evaluate((node, before) => node === before, originalView)).toBe(true);
    }
  });
}

test('ColorPicker keeps its portal and draft when the inherited layer changes', async ({ page }) => {
  await page.goto(fixture + 'palette');
  const owner = page.getByRole('dialog', { name: 'Layer owner', exact: true });
  const trigger = owner.locator('[aria-haspopup="dialog"]').first();
  await trigger.press('Enter');
  const palette = owner.locator('[data-palette-portal] .zi-keyboard-palette');
  const editor = palette.getByRole('textbox', { name: 'Palette draft', exact: true });
  await editor.fill('Keep this note');
  await editor.evaluate(node => (node as HTMLInputElement).setSelectionRange(2, 8));
  await expect(palette).toHaveCSS('z-index', '1600');
  const original = await palette.elementHandle();

  await owner.getByRole('button', { name: 'Raise owner layer', exact: true }).dispatchEvent('click');

  await expect(palette).toHaveCSS('z-index', '1800');
  const toggle = owner.getByRole('button', { name: 'Toggle palette layer', exact: true });
  await toggle.dispatchEvent('click');
  await expect(palette).toHaveCSS('z-index', '0');
  expect(await palette.evaluate(node => node.style.getPropertyPriority('z-index'))).toBe('important');
  await toggle.dispatchEvent('click');

  await expect(palette).toHaveCSS('z-index', '1800');
  await expect(editor).toBeFocused();
  await expect(editor).toHaveValue('Keep this note');
  expect(await palette.evaluate((node, before) => node === before, original)).toBe(true);
  expect(await editor.evaluate(node => {
    const input = node as HTMLInputElement;
    return [input.selectionStart, input.selectionEnd];
  })).toEqual([2, 8]);
  await editor.press('Escape');

  await expect(palette).toBeHidden();
  await expect(owner).toBeVisible();
  await expect(trigger).toBeFocused();
});
