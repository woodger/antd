import type { Locator } from '@playwright/test';
import { test, expect } from '../test';
import reference from '../fixtures/ant-design-image-semantics-reference.json' with { type: 'json' };

const popupSelectors = {
  root: null,
  mask: '.ant-image-preview-mask',
  body: '.ant-image-preview-body',
  footer: '.ant-image-preview-footer',
  actions: '.ant-image-preview-actions',
  close: '.ant-image-preview-close'
};

/** Reads the classes and declarations that distinguish provider and local styles. */
function readSlots(host: Locator, selectors: Record<string, string | null>) {
  return host.evaluate((host, selectors) => Object.fromEntries(
    Object.entries(selectors).map(([key, selector]) => {
      const node = selector === null ? host : host.querySelector(selector);
      if (!(node instanceof HTMLElement)) {
        return [key, null];
      }

      return [key, {
        classes: [...node.classList].filter(name => /^(provider|single|group|nested)-/.test(name)).sort(),
        rank: node.style.getPropertyValue('--rank'),
        rawProviderStyle: node.style.getPropertyValue('--provider-base'),
        providerSlotStyle: node.style.getPropertyValue('--provider-slot')
      }];
    })
  ), selectors);
}

/** Captures the six preview slots and appearance separately from native dialog markup. */
async function readViewer(viewer: Locator) {
  const slots = await readSlots(viewer, popupSelectors);
  const appearance = await viewer.evaluate(root => {
    const mask = root.querySelector('.ant-image-preview-mask');
    const close = root.querySelector('.ant-image-preview-close');

    return {
      zIndex: getComputedStyle(root).zIndex,
      blur: mask ? getComputedStyle(mask).backdropFilter : null,
      closeText: close?.textContent ?? null,
      ignoredPreviewClass: root.classList.contains('ignored-preview-class'),
      ignoredPreviewStyle: root.style.getPropertyValue('--ignored-preview-style')
    };
  });

  return { ...slots, ...appearance };
}

test('Image and ImagePreviewGroup apply the pinned semantic and provider layers', async ({ page }) => {
  await page.goto('/?fixture=image-semantics');
  const single = page.locator('.single-popup-root');
  const expected = reference.cases;

  await expect(single).toBeVisible();
  const thumb = await readSlots(page.locator('#single'), {
    root: '.ant-image', image: 'img', cover: '.ant-image-cover'
  });
  const popup = await readViewer(single);
  expect({ ...thumb, popup }).toEqual(expected.single);

  await single.locator('.ant-image-preview-mask').dispatchEvent('click');

  await expect(single).toBeVisible();
  await expect(page.getByLabel('Image open requests')).toHaveText(JSON.stringify(expected.maskCloseRequests));

  await page.locator('#open-group-image').dispatchEvent('click');

  const group = page.locator('.group-popup-root');
  await expect(group).toBeVisible();
  expect(await readViewer(group)).toEqual(expected.group);

  for (const id of ['inherited', 'reset', 'replaced'] as const) {
    const { image } = await readSlots(page.locator(`#${id}`), { image: 'img' });
    expect(image, `Image provider scope ${id}`).toEqual(expected[id]);
  }
  await expect(page.locator('#fallback img')).toHaveAttribute('src', /#fallback$/);
  await expect(page.locator('#local-fallback img')).toHaveAttribute('src', /#local$/);

  const progress = page.locator('#progress .ant-image-progress-wrapper');
  const snapshot = await readSlots(progress, { root: null });
  // The source flattens progress classes. The Svelte placeholder preserves both supported layers.
  expect(snapshot.root).toEqual({
    ...expected.progress, classes: [...expected.progress.classes, 'provider-progress', 'single-progress']
  });
  expect(await progress.evaluate(node => node.style.getPropertyValue('--provider-progress-only')))
    .toBe(expected.providerProgressStyle);

  await page.locator('#open-image-without-close').dispatchEvent('click');

  const noClose = page.locator('.null-close-observation');
  await expect(noClose).toBeVisible();
  await expect(noClose.locator('.ant-image-preview-close')).toHaveCount(0);
});

test('Image provider updates preserve the open viewer, transform, and focused action', async ({ page }) => {
  await page.goto('/?fixture=image-semantics');
  const viewer = page.getByRole('dialog', { name: 'Single', exact: true });
  const zoom = viewer.getByRole('button', { name: 'zoomIn', exact: true });
  const picture = viewer.locator('img');
  const mask = viewer.locator('.ant-image-preview-mask');
  await zoom.press('Enter');
  await expect(picture).toHaveCSS('transform', 'matrix(1.5, 0, 0, 1.5, 0, 0)');
  await expect(page.getByLabel('Transform callback receiver')).toHaveText('true');
  const originalDialog = await viewer.elementHandle();
  const originalPicture = await picture.elementHandle();

  await page.locator('#update-image-config').dispatchEvent('click');

  await expect(mask).toHaveClass(/provider-updated-mask/);
  await expect(mask).toHaveCSS('display', 'none');
  await expect(viewer.locator('.ant-image-preview-body')).toHaveCSS('--rank', 'mask-off');
  await expect(zoom).toBeFocused();
  await expect(picture).toHaveCSS('transform', 'matrix(1.5, 0, 0, 1.5, 0, 0)');
  expect(await viewer.evaluate((node, previous) => node === previous, originalDialog)).toBe(true);
  expect(await picture.evaluate((node, previous) => node === previous, originalPicture)).toBe(true);
  await expect(page.getByLabel('Image open requests')).toHaveText('[]');

  await zoom.press('Escape');

  await expect(viewer).toHaveCount(0);
  await expect(page.getByLabel('Image open requests')).toHaveText('[false]');
  await expect(page.getByLabel('Open callback receiver')).toHaveText('true');
});
