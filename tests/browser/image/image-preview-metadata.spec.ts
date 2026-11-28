import type { Page } from '@playwright/test';
import { test, expect } from '../test';
import reference from '../fixtures/ant-design-image-preview-metadata-reference.json' with { type: 'json' };
import { imageInvalid } from '../fixtures/image-data';

const dialog = (page: Page) => page.locator('dialog.image-metadata-viewer[open]');
type Observation = (typeof reference.cases)[number]['observed']
  | (typeof reference.dynamic)[number]['observed'];

test.use({ viewport: reference.viewport });

/** Mounts one measurement case through the public package fixture. */
async function choose(page: Page, id: string) {
  await page.goto('/?fixture=image-preview-metadata');
  await page.getByRole('combobox', { name: 'Image metadata case' }).selectOption(id);
  await expect(dialog(page)).toBeVisible();
}

/** Keeps the native label fallback, the existing item alt, and the absent empty src attribute. */
function expectedForNative(observed: Observation, itemAlt?: string) {
  const alt = itemAlt ?? observed.viewer.alt;
  const label = observed.viewer.label || alt || 'Preview fallback label';
  const src = observed.viewer.src === '' ? null : observed.viewer.src;

  return {
    ...observed,
    viewer: { ...observed.viewer, src, alt, label },
    imageRender: { ...observed.imageRender, alt },
    actionsRender: { ...observed.actionsRender, alt }
  };
}

/** Captures the native attributes and both renderer payloads in the same browser turn. */
async function observe(page: Page) {
  return page.evaluate(invalid => {
    const panel = document.querySelector('dialog.image-metadata-viewer[open]');
    const image = panel?.querySelector('[data-ant-image-preview-img]');
    const imageRender = panel?.querySelector('[data-image-render]')?.textContent;
    const actionsRender = panel?.querySelector('[data-image-actions]')?.textContent;
    const changes = document.getElementById('image-metadata-changes')?.textContent;
    if (!panel || !image || !imageRender || !actionsRender || !changes) {
      return null;
    }

    function sourceKey(src: string | null) {
      if (src === invalid) return 'invalid';
      return src?.split('#').at(-1) ?? null;
    }

    const thumbnail = document.getElementById('metadata-thumbnail');

    return {
      thumbnail: thumbnail ? {
        src: sourceKey(thumbnail.getAttribute('src')), alt: thumbnail.getAttribute('alt')
      } : null,
      viewer: {
        src: sourceKey(image.getAttribute('src')),
        alt: image.getAttribute('alt'),
        label: panel.getAttribute('aria-label'),
        decoding: image.getAttribute('decoding')
      },
      imageRender: JSON.parse(imageRender),
      actionsRender: JSON.parse(actionsRender),
      changes: JSON.parse(changes)
    };
  }, imageInvalid);
}

/** Updates the reactive owner without moving focus out of the modal dialog. */
async function control(page: Page, name: string) {
  await page.getByRole('button', { name, exact: true, includeHidden: true }).dispatchEvent('click');
}

for (const entry of reference.cases) {
  test(`Image preview renders the measured source and description for ${entry.id}`, async ({ page }) => {
    const defaultAlt = entry.child ? 'Thumbnail label' : 'First item';
    const itemAlt = entry.group && !Object.hasOwn(entry, 'alt') ? defaultAlt : undefined;
    const expected = expectedForNative(entry.observed, itemAlt);

    await choose(page, entry.id);

    await expect.poll(() => observe(page)).toEqual(expected);
    await expect(dialog(page)).toHaveAccessibleName(expected.viewer.label);
  });
}

test('Group metadata changes preserve controlled selection, the transform, and the focused toolbar', async ({
  page
}) => {
  await choose(page, 'group-default');
  const viewer = dialog(page);
  const zoom = viewer.getByRole('button', { name: 'zoomIn', exact: true });
  const originalViewer = await viewer.elementHandle();
  const picture = viewer.locator('[data-ant-image-preview-img]');
  let overriddenImage: Awaited<ReturnType<typeof picture.elementHandle>> | undefined;

  for (const step of reference.dynamic) {
    const action = step.action;
    if (action === 'zoom') {
      await zoom.click();
    }
    else if (action === 'override') {
      await control(page, 'Set group preview image');
    }
    else if (action === 'current') {
      await control(page, 'Select second item');
    }
    else if (action === 'clear') {
      await control(page, 'Clear group preview image');
    }
    else {
      expect(action).toBe('navigate');
      await viewer.getByRole('button', { name: 'prev', exact: true }).click();
    }

    const selectedAlt = step.observed.imageRender.current === 0 ? 'First item' : 'Second item';
    const itemAlt = step.observed.viewer.alt === null ? selectedAlt : undefined;
    const expected = expectedForNative(step.observed, itemAlt);
    await expect.poll(() => observe(page)).toEqual(expected);
    expect(await viewer.evaluate((node, previous) => node === previous, originalViewer)).toBe(true);
    if (action !== 'navigate') await expect(zoom).toBeFocused();
    if (action === 'override') overriddenImage = await picture.elementHandle();
    if (action === 'current') {
      expect(await picture.evaluate((node, previous) => node === previous, overriddenImage))
        .toBe(true);
    }
  }
});

test('Changing a single preview label keeps its thumbnail and the open image in place', async ({
  page
}) => {
  await choose(page, 'single-default');
  const viewer = dialog(page);
  const image = viewer.locator('[data-ant-image-preview-img]');
  const original = await image.elementHandle();

  await control(page, 'Rename preview image');

  await expect(viewer).toHaveAccessibleName('Updated viewer label');
  await expect(image).toHaveAttribute('alt', 'Updated viewer label');
  await expect(page.locator('#metadata-thumbnail')).toHaveAttribute('alt', 'Thumbnail label');

  await control(page, 'Restore thumbnail wording');

  await expect(viewer).toHaveAccessibleName('Thumbnail label');
  await expect(image).toHaveAttribute('alt', 'Thumbnail label');
  expect(await image.evaluate((node, before) => node === before, original)).toBe(true);
});
