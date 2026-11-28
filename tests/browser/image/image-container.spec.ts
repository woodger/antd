import type { Page } from '@playwright/test';
import { test, expect } from '../test';
import reference from '../fixtures/ant-design-image-container-reference.json' with { type: 'json' };

const panel = (page: Page) => page.locator('dialog.image-container-viewer');
const thumbnail = (page: Page) => page.getByRole('button', { name: 'Container sample', exact: true });
const afterOpen = (page: Page) => page.getByLabel('Image after visibility', { exact: true });
const requested = (page: Page) => page.getByLabel('Image requested visibility', { exact: true });

test.use({ viewport: reference.viewport });

/** Instantiates a single viewer fixture with the requested container settings. */
async function chooseCase(page: Page, name: string) {
  await page.goto('/?fixture=image-container');
  await page.getByRole('combobox', { name: 'Image container case', exact: true }).selectOption(name);
}

/** Updates the controlled owner while a native preview makes its controls inert. */
async function control(page: Page, name: string) {
  await page.getByRole('button', { name, exact: true, includeHidden: true }).dispatchEvent('click');
}

/** Reads getter calls with their source and argument count. */
async function getterCalls(page: Page): Promise<[string, number][]> {
  const output = await page.getByLabel('Image container calls', { exact: true }).textContent();
  return JSON.parse(output ?? '[]');
}

for (const sample of reference.cases) {
  test(`Image preview resolves ${sample.name} as in the pinned React build`, async ({ page }) => {
    await chooseCase(page, sample.name);
    if (sample.open === false) {
      await expect(panel(page)).toHaveCount(0);
      await expect.poll(async () => (await getterCalls(page)).length > 0)
        .toBe(sample.getterCallsAtMount > 0);
      if (sample.groupDisabled) {
        await thumbnail(page).click();
      }
      else {
        await page.getByRole('button', { name: 'Open case viewer', exact: true }).click();
      }
    }

    const viewer = panel(page);
    await expect(viewer).toBeVisible();
    const observed = await viewer.evaluate(node => {
      const host = node.closest<HTMLElement>('[data-image-container]');
      const bounds = node.getBoundingClientRect();
      return {
        target: host?.dataset.imageContainer ?? (node.parentElement === document.body ? 'body' : 'other'),
        width: bounds.width,
        height: bounds.height
      };
    });
    // React loses preview styles for group preview=false. Svelte keeps the native fullscreen panel.
    const size = sample.groupDisabled ? reference.viewport : { width: sample.width, height: sample.height };
    expect(observed).toEqual({ target: sample.target, ...size });
    const calls = await getterCalls(page);
    expect(calls.every(([, count]) => count === 0)).toBe(true);
    const distinctCalls = new Map(calls);
    expect([...distinctCalls]).toEqual(sample.getter);
    if (!sample.group) {
      await expect(page.locator('[data-image-container="source-owner"] .ant-image'))
        .toHaveClass(/image-resolved-container/);
    }
    if (!sample.groupDisabled) {
      await expect(afterOpen(page)).toHaveText('[true]');
      await expect(page.getByLabel('Image shown at', { exact: true }))
        .toHaveText(JSON.stringify([sample.target]));
    }

    if (sample.name === 'late-selector') {
      await page.keyboard.press('Escape');

      await expect(viewer).toBeHidden();
      await expect(page.locator('#image-container-late')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Open case viewer', exact: true })).toBeFocused();
      await expect(afterOpen(page)).toHaveText('[true,false]');
    }
  });
}

for (const name of ['retarget', 'group-retarget']) {
  test(`Image ${name} keeps preview state and restores the original opener`, async ({ page }) => {
    await chooseCase(page, name);
    const trigger = thumbnail(page);
    await trigger.click();
    const viewer = panel(page);
    await expect(viewer).toBeVisible();
    if (name === 'group-retarget') {
      await viewer.getByRole('button', { name: 'next', exact: true }).click();
      await expect(viewer.getByText('2 / 2', { exact: true })).toBeVisible();
    }
    const zoom = viewer.getByRole('button', { name: 'zoomIn', exact: true });
    await zoom.click();
    const image = viewer.locator('[data-ant-image-preview-img]');
    await expect(image).toHaveCSS('transform', reference.relocation.transform);
    const original = await viewer.elementHandle();
    await control(page, 'Clear case events');

    await control(page, 'Renew case getter');

    expect(await viewer.evaluate((node, old) => node === old, original)).toBe(true);
    await expect(zoom).toBeFocused();
    await expect(afterOpen(page)).toHaveText('[]');

    await control(page, 'Move case viewer');

    await expect(page.locator(`#image-container-${reference.relocation.target}`)
      .locator(viewer)).toBeVisible();
    expect(await viewer.evaluate((node, old) => node === old, original))
      .toBe(reference.relocation.sameViewer);
    await expect(viewer).toHaveCount(1);
    await expect(image).toHaveCSS('transform', reference.relocation.transform);
    await expect(requested(page)).toHaveText(JSON.stringify(reference.relocation.requested));
    await expect(afterOpen(page)).toHaveText(JSON.stringify(reference.relocation.afterOpen));
    if (name === 'group-retarget') {
      await expect(viewer.getByText('2 / 2', { exact: true })).toBeVisible();
      await expect(image).toHaveAttribute('alt', 'Next container image');
    }

    await control(page, 'Close case viewer');

    await expect(viewer).toBeHidden();
    await expect(viewer).toHaveCount(1);
    await expect(trigger).toBeFocused();
    await expect(afterOpen(page)).toHaveText(JSON.stringify(reference.close.afterOpen));
    await expect(requested(page)).toHaveText('[]');
  });
}

test('Image portal updates the owner theme while retaining local root styles and removes its DOM on unmount', async ({ page }) => {
  await chooseCase(page, 'theme');
  await thumbnail(page).click();

  const viewer = panel(page);
  const mask = viewer.locator('.ant-image-preview-mask');
  const zoom = viewer.getByRole('button', { name: 'zoomIn', exact: true });
  await expect(page.locator('#image-container-selected').locator(viewer)).toBeVisible();
  await expect(mask).toHaveCSS('background-color', 'rgb(28, 38, 64)');
  await expect(zoom).toHaveCSS('font-size', '24px');
  await expect(viewer).toHaveCSS('--image-owner-theme', 'active');
  await expect(viewer).toHaveCSS('--preview-rank', 'local');
  expect(await viewer.evaluate(node => (node as HTMLElement).style.pointerEvents)).toBe('auto');
  const original = await viewer.elementHandle();
  await zoom.focus();

  await control(page, 'Switch owner theme');

  await expect(mask).toHaveCSS('background-color', 'rgb(209, 224, 255)');
  await expect(zoom).toHaveCSS('font-size', '30px');
  await expect(zoom).toBeFocused();
  await expect(viewer).toHaveCSS('--preview-rank', 'local');
  expect(await viewer.evaluate((node, old) => node === old, original)).toBe(true);

  await control(page, 'Unmount case viewer');

  await expect(viewer).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
});

for (const name of ['detached', 'fragment']) {
  test(`Image preview waits for its ${name} destination to join the document`, async ({ page }) => {
    await chooseCase(page, name);
    const trigger = thumbnail(page);
    await trigger.press('Enter');

    await expect(requested(page)).toHaveText('[true]');
    await expect(afterOpen(page)).toHaveText('[]');
    await expect(panel(page)).toHaveCount(0);

    await control(page, 'Insert case target');

    const viewer = page.locator('[data-image-container="staged"]').locator(panel(page));
    await expect(viewer).toBeVisible();
    await expect(afterOpen(page)).toHaveText('[true]');

    await page.keyboard.press('Escape');

    await expect(viewer).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(afterOpen(page)).toHaveText('[true,false]');
  });
}

test('ImagePreviewGroup handles keyboard focus and scroll lock in an external ShadowRoot', async ({ page }) => {
  await chooseCase(page, 'shadow');
  const trigger = thumbnail(page);
  await trigger.press('Enter');

  const viewer = page.locator('#image-container-shadow').locator(panel(page));
  await expect(viewer).toBeVisible();
  const lock = page.locator('style[data-ant-dialog-lock]');
  await expect(lock).toHaveCount(1);
  expect(await lock.evaluate(node => (node as HTMLStyleElement).nonce)).toBe('image-container');
  await expect(page.locator('html')).toHaveCSS('overflow', 'hidden');
  expect(await viewer.evaluate(node => (node.getRootNode() as ShadowRoot).activeElement === node)).toBe(true);

  await page.keyboard.press('ArrowRight');

  await expect(viewer.locator('img')).toHaveAttribute('alt', 'Next container image');
  await expect(viewer.getByText('2 / 2', { exact: true })).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(viewer).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(lock).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
});

test('Image default container keeps a non-modal preview interactive inside its native host dialog', async ({ page }) => {
  await chooseCase(page, 'nested');
  await page.getByRole('button', { name: 'Open viewer host', exact: true }).click();
  const host = page.getByRole('dialog', { name: 'Viewer host', exact: true });
  const trigger = host.getByRole('button', { name: 'Container sample', exact: true });
  await trigger.click();

  const viewer = host.locator(panel(page));
  await expect(viewer).toBeVisible();
  expect(await viewer.evaluate(node => node.matches(':modal'))).toBe(false);
  await viewer.getByRole('button', { name: 'zoomIn', exact: true }).click();
  await expect(viewer.locator('[data-ant-image-preview-img]'))
    .toHaveCSS('transform', reference.relocation.transform);

  await page.keyboard.press('Escape');

  await expect(viewer).toBeHidden();
  await expect(host).toBeVisible();
  await expect(trigger).toBeFocused();
});
