import { test, expect } from '../test';
import reference from '../fixtures/ant-design-progress-circle-reference.json' with { type: 'json' };
import { snapshotProgressCircle } from '../progress-circle-metrics';
import miniReference from '../fixtures/ant-design-progress-mini-tooltip-reference.json' with { type: 'json' };

const root = '[data-progress-circle] > [data-ant-progress-root]';
test.use({ viewport: reference.viewport });
test.beforeEach(async ({ page }) => {
  await page.goto('/?fixture=progress-circle');

  expect(await page.evaluate(() => document.compatMode)).toBe(reference.reference.documentMode);
  await expect(page.getByRole('heading', { name: 'Source Progress circle', exact: true }))
    .toBeVisible();
});

for (const sample of reference.cases) {
  test(`Progress circle matches the source for ${sample.name}`, async ({ page }) => {
    await page.getByRole('combobox', { name: 'Progress circle case', exact: true })
      .selectOption(sample.name);

    await expect.poll(() => page.evaluate(snapshotProgressCircle,
      sample.props.prefixCls || 'ant-progress')).toEqual(sample.snapshot);
    await expect(page.getByLabel('Progress circle ref', { exact: true })).toHaveText('true');
  });
}

test('Progress circle retains root, values and focus across segments, gaps and prefix changes', async ({ page }) => {
  const original = await page.locator(root).elementHandle();
  const input = page.getByRole('textbox', { name: 'Progress circle draft', exact: true });
  await input.fill('Retained draft');
  await input.focus();

  for (const name of ['Update circle percent', 'Update circle success', 'Change circular gap',
    'Change circular prefix', 'Toggle circle RTL']) {
    await page.getByRole('button', { name, exact: true }).dispatchEvent('click');
  }

  await expect(page.locator(root)).toHaveAttribute('aria-valuenow', '80');
  await expect(page.locator(root)).toHaveAttribute('dir', 'rtl');
  await expect(page.locator(root).locator('.live-progress-circle-path')).toHaveCount(2);
  expect(await page.locator(root).evaluate((node, old) => node === old, original)).toBe(true);
  await expect(input).toHaveValue('Retained draft');
  await expect(input).toBeFocused();
});

test('Progress circular steps and gradients update without retaining old masks', async ({ page }) => {
  const original = await page.locator(root).elementHandle();
  await page.getByRole('button', { name: 'Toggle circular gradient', exact: true }).click();

  await expect(page.locator(root).locator('mask')).toHaveCount(1);
  await expect(page.locator(root).locator('foreignObject')).toHaveCount(1);
  await page.getByRole('button', { name: 'Set circular steps', exact: true }).click();

  await expect(page.locator(root).locator('.ant-progress-circle-path')).toHaveCount(8);
  await expect(page.locator(root).locator('mask')).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear circular steps', exact: true }).click();

  await expect(page.locator(root).locator('mask')).toHaveCount(1);
  expect(await page.locator(root).evaluate((node, old) => node === old, original)).toBe(true);
});

test('Tiny circular progress shows its live indicator in Tooltip and retains passive focus order', async ({ page }) => {
  await page.getByRole('button', { name: 'Shrink circular progress', exact: true }).click();
  const body = page.locator(root).locator('[data-ant-progress-circle-body]');

  await expect(page.locator(root).locator('[data-ant-progress-part="indicator"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Before circle', exact: true }).focus();
  await page.keyboard.press('Tab');

  await expect(page.getByRole('button', { name: 'After circle', exact: true })).toBeFocused();
  await body.hover();
  const tooltip = page.getByRole('tooltip');

  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveText('25%');
  await page.getByRole('button', { name: 'Update circle percent', exact: true }).dispatchEvent('click');

  await expect(tooltip).toHaveText('80%');
  await page.getByRole('button', { name: 'Grow circular progress', exact: true }).click();

  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await expect(page.locator(root).locator('[data-ant-progress-part="indicator"]')).toHaveText('80%');
});

test('Progress circle respects reduced motion and cleans refs and popup on unmount', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Update circle percent', exact: true }).click();

  for (const path of await page.locator(root).locator('.ant-progress-circle-path').all()) {
    await expect(path).toHaveCSS('transition-duration', '0s');
  }
  await page.getByRole('button', { name: 'Shrink circular progress', exact: true }).click();
  await page.locator(root).locator('[data-ant-progress-circle-body]').hover();

  await expect(page.getByRole('tooltip')).toBeVisible();
  await page.getByRole('button', { name: 'Toggle circle mount', exact: true }).dispatchEvent('click');

  await expect(page.locator(root)).toHaveCount(0);
  await expect(page.getByLabel('Progress circle ref', { exact: true })).toHaveText('false');
  await expect(page.getByRole('tooltip')).toHaveCount(0);
});

test('Progress circle matches source transition durations for rapid and spaced updates', async ({ page }) => {
  const clockStart = new Date('2030-01-01T00:00:00Z');
  await page.clock.install({ time: clockStart });
  // install continues the course of hours; pauseAt separates the application intervals from the delays DOM/CDP.
  const pauseTime = new Date('2030-01-01T00:00:01Z');
  await page.clock.pauseAt(pauseTime);
  const select = page.getByRole('combobox', { name: 'Progress circle case', exact: true });
  await select.selectOption('empty');
  await select.selectOption('quarter');
  const durations = () => page.locator(root).locator('.ant-progress-circle-path')
    .evaluateAll(nodes => nodes.map(node => getComputedStyle(node).transitionDuration));

  await expect.poll(durations).toEqual(reference.transitionTrace[0]);
  await page.clock.runFor(20);
  await page.getByRole('button', { name: 'Update circle percent', exact: true }).dispatchEvent('click');

  await expect.poll(durations).toEqual(reference.transitionTrace[1]);
  await page.clock.runFor(150);
  await page.getByRole('button', { name: 'Update circle percent', exact: true }).dispatchEvent('click');

  await expect.poll(durations).toEqual(reference.transitionTrace[2]);
});


// Values are taken from the independent first and repeated measurements of Ant Design 6.6.8.
// Provider and Snippet inspect retained contracts Native.
for (const sample of miniReference.cases) {
  test(`Tiny Progress Tooltip matches Source CSS and AX for ${sample.name}`, async ({ page }) => {
    await page.getByLabel('Mount tiny Progress cases', { exact: true }).check();
    const card = page.locator(`[data-mini-progress="${sample.name}"]`);
    const progress = card.locator('[data-ant-progress-root]');
    const original = await progress.elementHandle();

    await expect(progress).toHaveAttribute('aria-valuenow', String(sample.props.percent));
    await expect(progress).toHaveAttribute('aria-label', 'Miniature circle');
    await card.locator('[data-ant-progress-circle-body]').hover();
    const tooltip = page.getByRole('tooltip', { name: sample.snapshot.tooltipName, exact: true });

    await expect(tooltip).toBeVisible();
    expect(await tooltip.evaluate(node => node.parentElement === node.ownerDocument.body))
      .toBe(true);
    const indicator = tooltip.locator('[data-ant-progress-part="indicator"]');

    await expect(indicator).not.toHaveAttribute('aria-hidden');
    for (const [name, value] of Object.entries(sample.snapshot.indicator.css)) {
      await expect(indicator).toHaveCSS(name, value);
    }
    const container = tooltip.locator('[data-ant-tooltip-container]');
    for (const [name, value] of Object.entries(sample.snapshot.container.css)) {
      await expect(container).toHaveCSS(name, value);
    }
    await expect(tooltip.getByRole('img')).toHaveCount(sample.snapshot.iconLabels.length);
    for (const name of sample.snapshot.iconLabels) {
      await expect(tooltip.getByRole('img', { name, exact: true })).toBeVisible();
      await expect(tooltip.getByRole('img', { name, exact: true }).locator('svg'))
        .toHaveAttribute('aria-hidden', 'true');
    }
    const session = await page.context().newCDPSession(page);
    try {
      const tree = await session.send('Accessibility.getFullAXTree');
      expect(tree.nodes.filter(node => !node.ignored && node.role?.value === 'tooltip')
        .map(node => node.name?.value)).toEqual([sample.snapshot.tooltipName]);
    } finally {
      await session.detach();
    }
    expect(await progress.evaluate((node, old) => node === old, original)).toBe(true);
    await expect(progress).toHaveAttribute('aria-valuenow', String(sample.props.percent));
  });
}

test('Tiny Progress respects the existing provider target and stable portal lifecycle',
  async ({ page }) => {
    await page.getByLabel('Mount tiny Progress cases', { exact: true }).check();
    const calls = page.getByLabel('Tiny Progress getter calls', { exact: true });

    await expect(calls).toHaveText('0');
    await page.locator('[data-mini-progress="provider"] [data-ant-progress-circle-body]').hover();
    const tooltip = page.getByRole('tooltip', { name: '60%', exact: true });

    await expect(tooltip).toBeVisible();
    expect(await tooltip.evaluate(node => node.parentElement?.hasAttribute(
      'data-mini-progress-target'
    ))).toBe(true);
    await expect(page.getByLabel('Tiny Progress getter trigger', { exact: true }))
      .toHaveText('true');
    await expect.poll(async () => Number(await calls.textContent())).toBeGreaterThan(0);
    const original = await tooltip.elementHandle();
    const indicator = tooltip.locator('[data-ant-progress-part="indicator"]');

    await expect(indicator).toHaveCSS('color', 'rgb(255, 255, 255)');
    await page.getByRole('button', { name: 'Replace tiny Progress getter', exact: true })
      .evaluate(node => (node as HTMLButtonElement).click());

    expect(await tooltip.evaluate((node, old) => node === old, original)).toBe(true);
    expect(await tooltip.evaluate(node => node.parentElement?.hasAttribute(
      'data-mini-progress-target'
    ))).toBe(true);
    await page.getByRole('button', { name: 'Unmount tiny Progress cases', exact: true })
      .evaluate(node => (node as HTMLButtonElement).click());

    await expect(page.locator('[data-mini-progress-target] [data-ant-tooltip]')).toHaveCount(0);
    await expect(page.locator('[data-ant-tooltip]')).toHaveCount(0);
  });

test('Tiny Progress keeps formatter Snippet lazy and retained with custom prefix and styles',
  async ({ page }) => {
    await page.getByLabel('Mount tiny Progress cases', { exact: true }).check();
    const mounts = page.getByLabel('Tiny Progress snippet mounts', { exact: true });
    const unmounts = page.getByLabel('Tiny Progress snippet unmounts', { exact: true });

    await expect(mounts).toHaveText('0');
    await expect(unmounts).toHaveText('0');
    await expect(page.locator('[data-mini-progress-caption]')).toHaveCount(0);
    const card = page.locator('[data-mini-progress="snippet"]');
    const body = card.locator('[data-ant-progress-circle-body]');
    await body.hover();
    const tooltip = page.getByRole('tooltip', { name: 'Lazy caption', exact: true });

    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainClass('suite-tooltip');
    await expect(mounts).toHaveText('1');
    const caption = page.locator('[data-mini-progress-caption]');
    const original = await caption.elementHandle();
    const indicator = tooltip.locator('.tiny-progress-indicator.tiny-caption');

    await expect(indicator).toHaveCSS('color', 'rgb(102, 34, 170)');
    await expect(indicator).toHaveCSS('font-size', '19px');
    await page.getByRole('button', { name: 'Update tiny Progress percent', exact: true })
      .evaluate(node => (node as HTMLButtonElement).click());

    await expect(card.locator('[data-ant-progress-root]')).toHaveAttribute('aria-valuenow', '80');
    expect(await caption.evaluate((node, old) => node === old, original)).toBe(true);
    await page.mouse.move(5, 5);

    await expect(tooltip).toBeHidden();
    await expect(mounts).toHaveText('1');
    await expect(unmounts).toHaveText('0');
    await body.hover();

    await expect(tooltip).toBeVisible();
    expect(await caption.evaluate((node, old) => node === old, original)).toBe(true);
    await expect(mounts).toHaveText('1');
    await page.getByRole('button', { name: 'Unmount tiny Progress cases', exact: true })
      .evaluate(node => (node as HTMLButtonElement).click());

    await expect(page.locator('[data-ant-tooltip]')).toHaveCount(0);
    await expect(unmounts).toHaveText('1');
  });

test('Tiny Progress keeps its default Tooltip within a native modal', async ({ page }) => {
  await page.getByLabel('Mount tiny Progress cases', { exact: true }).check();
  await page.getByRole('button', { name: 'Open tiny Progress modal', exact: true }).click();
  const modal = page.getByRole('dialog');
  await modal.getByRole('progressbar', { name: 'Modal miniature circle', exact: true })
    .locator('[data-ant-progress-circle-body]').hover();
  const tooltip = modal.getByRole('tooltip', { name: '60%', exact: true });

  await expect(tooltip).toBeVisible();
  await expect(tooltip.locator('[data-ant-progress-part="indicator"]'))
    .toHaveCSS('color', 'rgb(255, 255, 255)');
  await page.getByRole('button', { name: 'Close tiny Progress modal', exact: true }).click();

  await expect(modal).toBeHidden();
});
