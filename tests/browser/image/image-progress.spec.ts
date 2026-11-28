import { test, expect } from '../test';
import reference from '../fixtures/ant-design-image-progress-reference.json' with { type: 'json' };

test('Image progress matches the pinned React placeholder and its semantic styles', async ({ page }) => {
  await page.goto('/?fixture=image-progress');

  for (const { id, ...expected } of reference.cases) {
    const fixture = page.locator(`[data-image-progress="${id}"]`);

    await expect.poll(() => fixture.evaluate((section, id) => {
      const prefix = id === 'custom' ? 'photo' : 'ant-image';
      const root = section.querySelector(`.${prefix}-progress-wrapper`);
      const ink = root?.querySelector(`.${prefix}-progress-ink-1`);
      const content = root?.querySelector(`.${prefix}-progress-content`);
      if (!root || !ink || !content) {
        return undefined;
      }

      const rail = root.querySelector<HTMLElement>(`.${prefix}-progress-rail`);
      const css = getComputedStyle(root);
      const railStyles = rail ? getComputedStyle(rail) : undefined;

      return {
        role: root.getAttribute('role'),
        label: root.getAttribute('aria-label'),
        now: root.getAttribute('aria-valuenow'),
        busy: root.getAttribute('aria-busy'),
        liveText: root.querySelector('[role="status"]')?.textContent ?? null,
        content: content.textContent?.trim(),
        percentStyle: rail?.style.getPropertyValue('--progress-percent') ?? null,
        images: section.querySelectorAll('img').length,
        styles: {
          width: css.width,
          height: css.height,
          display: css.display,
          overflow: css.overflow,
          backgroundColor: css.backgroundColor,
          backdropFilter: css.backdropFilter,
          inkName: getComputedStyle(ink).animationName,
          inkDuration: getComputedStyle(ink).animationDuration,
          railHeight: railStyles?.height ?? null,
          railAnimation: rail ? getComputedStyle(rail, '::before').animationName : null
        }
      };
    }, id), { message: `Image progress ${id}` }).toEqual({
      ...expected,
      styles: {
        ...expected.styles,
        // The static stylesheet uses the source keyframe names without the CSS-in-JS hash.
        inkName: expected.styles.inkName.replace(/^css-[\w]+-/, ''),
        railAnimation: expected.styles.railAnimation?.replace(/^css-[\w]+-/, '') ?? null
      }
    });
  }

  const custom = page.locator('[data-image-progress="custom"]');
  await expect(custom.getByRole('progressbar', { name: '13%' })).toHaveClass(/progress-root/);
  await expect(custom.locator('.photo-progress-rail')).toHaveClass(/progress-rail/);
});

test('Image percent updates retain the placeholder and finishing it loads the thumbnail', async ({ page }) => {
  let requests = 0;
  const response = Promise.withResolvers<void>();
  await page.route('**/image-progress.svg', async route => {
    requests++;
    await response.promise;
    await route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 4"><path d="M0 0h4v4H0Z"/></svg>'
    });
  });
  const dynamic = page.locator('[data-image-progress="dynamic"]');
  const progress = dynamic.getByRole('progressbar');

  try {
    await page.goto('/?fixture=image-progress', { waitUntil: 'domcontentloaded' });
    const original = await progress.elementHandle();

    await expect(progress).toHaveAccessibleName('20%');
    const ink = dynamic.locator('.ant-image-progress-ink-1');
    await expect(ink).toHaveCSS('animation-duration', '5s');
    await expect(page.getByLabel('Thumbnail ref')).toHaveText('none');
    expect(requests).toBe(0);

    await page.getByRole('button', { name: 'Advance image progress' }).click();

    await expect(progress).toHaveAccessibleName('65%');
    const retained = await progress.evaluate((current, previous) => current === previous, original);
    expect(retained).toBe(true);
    expect(requests).toBe(0);

    await page.getByRole('button', { name: 'Toggle image progress' }).click();

    await expect(progress).toHaveCount(0);
    await expect(dynamic.getByText('Thumbnail loading')).toBeVisible();
    await expect(page.getByLabel('Thumbnail ref')).toHaveText('IMG');
  }
  finally {
    response.resolve();
  }

  await expect(page.getByLabel('Thumbnail load count')).toHaveText('1');
  await expect(dynamic.getByText('Thumbnail loading')).toHaveCount(0);
  expect(requests).toBeGreaterThan(0);

  await dynamic.getByRole('button', { name: 'Prepared thumbnail' }).click();
  await expect(page.getByRole('dialog', { name: 'Prepared thumbnail' })).toBeVisible();
});
