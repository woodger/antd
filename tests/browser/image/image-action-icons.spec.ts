import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../test';
import reference from '../fixtures/ant-design-image-action-icons-reference.json' with {
  type: 'json'
};

const panel = (page: Page) => page.locator('dialog.ant-image-preview[open]');
const thumbnail = (page: Page) => page.getByRole('button', { name: 'First', exact: true });

test.use({ viewport: reference.viewport });

/** Loads an independent preview, ready for a controlled open or a thumbnail click. */
async function choose(page: Page, name: string) {
  await page.goto('/?fixture=image-action-icons');
  await page.getByRole('combobox', { name: 'Image icon case', exact: true }).selectOption(name);
}

/** Reads the render-info buttons independently from the original toolbar. */
function buttons(toolbar: Locator) {
  return toolbar.evaluate((root, keys) => Object.fromEntries(keys.map(key => {
    const action = key.slice(0, -'Icon'.length);
    const control = root.querySelector<HTMLButtonElement>(`:scope > button[aria-label="${action}"]`);
    if (!control) return [key, null];

    const classes = [...control.classList].filter(name => name.startsWith('ant-image-preview-'));
    return [key, {
      tag: control.localName,
      type: control.type,
      label: control.getAttribute('aria-label'),
      className: classes.join(' '),
      disabled: control.disabled
    }];
  })), reference.toolbar.keys);
}

/** Distinguishes custom artwork, existing SVG paths, and buttons without a glyph. */
function artwork(viewer: Locator) {
  return viewer.evaluate(root => {
    function icon(selector: string) {
      const control = root.querySelector(selector);
      if (!control) return null;

      const marker = control.querySelector<HTMLElement>('[data-custom-icon]');
      const path = control.querySelector('svg path');
      return {
        custom: marker?.dataset.customIcon ?? null,
        artwork: path?.getAttribute('d')?.slice(0, 36) ?? null
      };
    }

    return {
      custom: [...root.querySelectorAll<HTMLElement>('[data-custom-icon]')]
        .map(node => node.dataset.customIcon),
      close: icon('.ant-image-preview-close'),
      prev: icon('.ant-image-preview-switch-prev'),
      next: icon('.ant-image-preview-switch-next'),
      zoomIn: icon('.ant-image-preview-actions-action-zoomIn'),
      untouchedGlyph: icon('.ant-image-preview-actions-action-rotateRight')
    };
  });
}

for (const sample of reference.cases) {
  test(`Image preview artwork and actionsRender buttons match the reference for ${sample.name}`, async ({ page }) => {
    await choose(page, sample.name);
    if (sample.config) await thumbnail(page).click();

    const viewer = panel(page);
    await expect(viewer).toBeVisible();
    expect(await artwork(viewer)).toEqual(sample.artwork);

    if (sample.semanticIcons) {
      const classes = await page.locator('#image-action-icons-fixture .ant-image').evaluate(node =>
        [...node.classList].filter(name => name.startsWith('semantic-preview-icon-')));
      const keys = sample.semanticIcons.keys.map(key => {
        if (key === 'left') return 'prev';
        if (key === 'right') return 'next';
        return key;
      });
      expect(classes).toEqual(keys.map(key => `semantic-preview-icon-${key}`));
      const origin = sample.semanticIcons.suppliedZoomIn ? 'supplied-zoom-icon' : 'builtin-zoom-icon';
      await expect(page.locator('#image-action-icons-fixture .ant-image')).toHaveClass(new RegExp(origin));
    }

    const toolbar = viewer.locator('[data-reference-toolbar]');
    if (!sample.info) {
      await expect(toolbar).toHaveCount(0);
      return;
    }
    const { toolbar: referenceToolbar } = reference;
    await expect(toolbar).toHaveAttribute('data-fields', JSON.stringify(referenceToolbar.fields));
    await expect(toolbar).toHaveAttribute('data-icon-keys', JSON.stringify(referenceToolbar.keys));
    await expect(toolbar).toHaveAttribute('data-current', String(sample.info.current));
    await expect(toolbar).toHaveAttribute('data-total', String(sample.info.total));
    const original = await toolbar.locator('[data-original-toolbar] button').evaluateAll(nodes =>
      nodes.map(node => node.getAttribute('aria-label')));
    expect(original).toEqual(referenceToolbar.order);
    const expected = sample.info.total > 1 ? referenceToolbar.multiple : referenceToolbar.standard;
    expect(await buttons(toolbar)).toEqual(expected);

    if (!sample.result) return;

    const action = (name: string) => toolbar.locator(`:scope > button[aria-label="${name}"]`);
    const transformations = page.getByLabel('Image action events', { exact: true });
    const changes = page.getByLabel('Image action index changes', { exact: true });
    const steps = sample.group ? ['zoomIn'] : sample.result.actions.slice(0, -1).map(value => value[0]);
    for (const name of steps) {
      await action(String(name)).click();
      await expect.poll(async () => {
        const events: [string, unknown][] = JSON.parse(await transformations.innerText());
        return events.at(-1)?.[0];
      }).toBe(name);
    }
    await expect(action('zoomIn')).toBeDisabled();
    await action('zoomIn').evaluate((node: HTMLButtonElement) => node.click());

    await action(sample.group ? 'next' : 'zoomOut').press('Enter');

    await expect(toolbar).toHaveAttribute('data-current', String(sample.result.current));
    await expect(transformations).toHaveText(JSON.stringify(sample.result.actions));
    await expect(changes).toHaveText(JSON.stringify(sample.result.changes));
    await expect.poll(() => buttons(toolbar)).toEqual(sample.result.controls);
  });
}

test('ImagePreviewGroup custom artwork remains decorative and the RTL controls operate the viewer', async ({ page }) => {
  await choose(page, 'group-false-rtl');
  const trigger = thumbnail(page);
  await trigger.press('Enter');
  const viewer = panel(page);
  await expect(viewer).toBeVisible();

  await viewer.getByRole('button', { name: 'next', exact: true }).click();

  await expect(viewer.locator('[data-ant-image-preview-img]')).toHaveAttribute('alt', 'Second');
  await expect(viewer.getByRole('button', { name: 'next', exact: true })).toBeDisabled();

  await viewer.locator('.ant-image-preview-close').click();

  await expect(viewer).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
