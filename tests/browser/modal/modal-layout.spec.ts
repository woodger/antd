import type { Page } from '@playwright/test';
import { expect, test } from '../test';
import reference from '../fixtures/ant-design-modal-layout-reference.json' with { type: 'json' };

/** Reads the visible panel together with its center, regardless of the parent of the portal. */
function geometry(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Layout probe', exact: true });
  const panel = dialog.locator(':scope > [data-ant-modal-panel]');
  return panel.evaluate(node => {
    const { left, top, width, height } = node.getBoundingClientRect();
    return { left, top, width, height, centerY: top + height / 2 };
  });
}

for (const sample of reference.cases) {
  test(`Modal sizing follows the pinned source for ${sample.profile.id}`, async ({ page }) => {
    await page.goto(`/modal-layout.html?profile=${sample.profile.id}`);
    const dialog = page.getByRole('dialog', { name: 'Layout probe' });
    if (sample.profile.confirm) {
      await page.getByRole('button', { name: 'Confirm layout' }).click();
    }
    if (sample.profile.id === 'zero') {
      await expect(dialog).toHaveAttribute('open', '');
    }
    else {
      await expect(dialog).toBeVisible();
    }

    for (const view of sample.views) {
      await page.setViewportSize({ width: view.viewport, height: 720 });
      // Regular Svelte Modal retains the agreed 16px inset on each side.
      const width = sample.profile.id === 'default' ? Math.min(520, view.viewport - 32) : view.width;
      const left = (view.viewport - width) / 2;
      await expect.poll(async () => (await geometry(page)).width).toBeCloseTo(width, 1);
      expect((await geometry(page)).left).toBeCloseTo(left, 1);

      if (sample.profile.props?.height !== undefined) {
        expect((await geometry(page)).height).toBeCloseTo(view.height, 1);
      }
      if (sample.profile.props?.centered === false) {
        expect((await geometry(page)).top).toBeCloseTo(view.top, 1);
      }
      else {
        expect((await geometry(page)).centerY).toBeCloseTo(360, 1);
      }
    }
  });
}

test('live dimensions and provider alignment keep the same editor and selection in a portal',
  async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/modal-layout.html?profile=live');
    const editor = page.getByRole('textbox', { name: 'Layout editor' });
    await editor.fill('Edited');
    await editor.evaluate((input: HTMLInputElement) => input.setSelectionRange(1, 4));
    const original = await editor.elementHandle();

    await page.getByRole('button', { name: 'Inherit alignment' }).dispatchEvent('click');
    await expect.poll(async () => (await geometry(page)).centerY).toBeCloseTo(360, 1);
    await expect(page.getByRole('dialog', { name: 'Layout probe' })).toHaveClass(/\bant-modal-centered\b/);
    await page.getByRole('button', { name: 'Use percentage width' }).dispatchEvent('click');
    await expect.poll(async () => (await geometry(page)).width).toBeCloseTo(640, 1);
    await page.getByRole('button', { name: 'Set fixed height' }).dispatchEvent('click');
    await expect.poll(async () => (await geometry(page)).height).toBeCloseTo(210, 1);

    expect(await editor.evaluate((node, before) => node === before, original)).toBe(true);
    expect(await editor.evaluate((node: HTMLInputElement) => [node.selectionStart, node.selectionEnd]))
      .toEqual([1, 4]);
    await expect(editor).toHaveValue('Edited');
    await expect(editor).toBeFocused();
    await expect(page.locator('#layout-host dialog')).toHaveCount(1);
  });

test('nested sparse breakpoints do not inherit the outer width or top placement', async ({ page }) => {
  await page.setViewportSize({ width: 700, height: 720 });
  await page.goto('/modal-layout.html?profile=nested');
  await page.getByRole('button', { name: 'Open nested layout' }).click();

  await expect.poll(() => geometry(page)).toMatchObject({ width: 684, left: 8, centerY: 360 });
  await expect(page.getByRole('button', { name: 'Закрыть', exact: true }).last()).toBeFocused();
});

test('top placement survives a switch to the managed dialog surface', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 360 });
  await page.goto('/modal-layout.html?profile=managed');
  const dialog = page.getByRole('dialog', { name: 'Layout probe' });
  const expected = { width: 359, left: 8, top: 108 };

  await expect.poll(() => geometry(page)).toMatchObject(expected);
  const original = await dialog.elementHandle();
  await page.getByRole('button', { name: 'Free layout focus' }).dispatchEvent('click');

  await expect(dialog).toHaveAttribute('data-ant-modal-managed', 'true');
  await expect.poll(() => geometry(page)).toMatchObject(expected);
  expect(await dialog.evaluate((node, before) => node === before, original)).toBe(true);
});
