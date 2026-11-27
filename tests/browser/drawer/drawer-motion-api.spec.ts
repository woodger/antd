import type { ElementHandle, Locator, Page } from '@playwright/test';
import { expect, test } from '../test';
import reference from '../fixtures/ant-design-drawer-motion-api-reference.json' with { type: 'json' };

interface Lifecycle {
  panel: (string | boolean | null)[][];
  mask: (string | boolean | null)[][];
  afterOpen: boolean[];
}

/** Opens a separate instance for each set of settings. */
async function choose(page: Page, profile: string) {
  await page.goto('/?fixture=drawer-motion-api');
  await page.getByRole('combobox', { name: 'Drawer motion profile' }).selectOption(profile);
  return page.locator('#motion-root');
}

/** Transmits open and other props from the owner, including management with active modality. */
async function owner(page: Page, name: string) {
  await page.locator(`#motion-${name}`).evaluate(node => {
    if (node instanceof HTMLButtonElement) node.click();
  });
}

/** Receives a snapshot of observed phases and notifications. */
async function lifecycle(page: Page): Promise<Lifecycle> {
  const output = await page.locator('#motion-events').textContent();
  return JSON.parse(output ?? '{}');
}

/** Measures DOM of the completed mask and compares the knot with the first impression. */
async function maskState(dialog: Locator, original?: ElementHandle<Element>) {
  return dialog.evaluate((node, before) => {
    const mask = node.querySelector<HTMLDivElement>(':scope > [data-ant-drawer-mask]');
    return {
      present: Boolean(mask),
      display: mask?.style.display ?? null,
      leaveClass: Boolean(mask?.classList.contains('mask-after-leave')),
      same: Boolean(mask && mask === before)
    };
  }, original);
}

test.use({ reducedMotion: 'no-preference' });

for (const { profile, held, lifecycle: expected } of reference.cases) {
  test(`Drawer follows the pinned CSSMotion hooks for ${profile}`, async ({ page }) => {
    const dialog = await choose(page, profile);
    if (profile === 'immediate') {
      await expect.poll(() => lifecycle(page)).toEqual(held);
      await expect(dialog).toBeHidden();
    }

    const opener = page.locator('#motion-show');
    await opener.click();
    if (profile === 'hold-end') {
      const wrapper = dialog.locator('[data-ant-drawer-content-wrapper]').first();
      await expect.poll(async () => (await lifecycle(page)).panel).toContainEqual(
        ['Appear', 'end', true, 'deadline']
      );
      await expect(wrapper).toHaveClass(/own-panel-appear-active/);
      const hold = await wrapper.evaluate(node => {
        if (!(node instanceof HTMLDivElement)) throw new Error('Missing Drawer wrapper');
        return {
          active: node.style.getPropertyValue('--probe-active'),
          visible: Boolean(node.closest('dialog')?.open)
        };
      });
      const before = await lifecycle(page);
      await dialog.locator('#inside').dispatchEvent('transitionend', { bubbles: true });
      const after = await lifecycle(page);
      expect({
        ...hold, nestedIgnored: after.panel.length === before.panel.length,
        afterOpen: after.afterOpen
      }).toEqual(held);
      await dialog.locator('[data-ant-drawer-section]').dispatchEvent('transitionend');
    }
    if (profile === 'async-prepare') {
      await expect.poll(async () => (await lifecycle(page)).mask).toContainEqual(['visible', true]);
      const { panel, afterOpen } = await lifecycle(page);
      expect({ panel, afterOpen }).toEqual(held);
      await owner(page, 'release');
    }

    await expect.poll(async () => (await lifecycle(page)).afterOpen).toEqual([true]);
    await expect.poll(async () => (await lifecycle(page)).mask).toContainEqual(['visible', true]);
    await owner(page, 'hide');

    await expect(dialog).toBeHidden();
    await expect.poll(() => lifecycle(page)).toEqual(expected);
    await expect(page.locator('#motion-close')).toHaveText('{"open":false,"stillMounted":true}');
    await expect(opener).toBeFocused();
  });
}

for (const { kind, initial, hidden } of reference.masks) {
  test(`Drawer preserves the configured hidden mask state for ${kind}`, async ({ page }) => {
    const dialog = await choose(page, `mask-${kind}`);
    await page.locator('#motion-show').click();
    await expect(dialog).toBeVisible();
    await expect.poll(() => maskState(dialog)).toEqual(initial);

    await owner(page, 'mask-on');
    await expect.poll(async () => (await lifecycle(page)).mask).toEqual([['visible', true]]);
    const mask = await dialog.locator(':scope > [data-ant-drawer-mask]').elementHandle();
    await owner(page, 'mask-off');

    await expect.poll(async () => (await lifecycle(page)).mask)
      .toEqual([['visible', true], ['visible', false]]);
    await expect.poll(() => maskState(dialog, mask)).toEqual(hidden);
    await expect(dialog).toBeVisible();
  });
}

test('Drawer reduced motion runs prepare and skips CSS phases', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const dialog = await choose(page, 'reduced');
  const expected = reference.cases.find(sample => sample.profile === 'prepare-only')?.lifecycle;

  await page.locator('#motion-show').click();
  await expect.poll(async () => (await lifecycle(page)).afterOpen).toEqual([true]);
  await owner(page, 'hide');

  await expect(dialog).toBeHidden();
  await expect.poll(() => lifecycle(page)).toEqual(expected);
});

test('Drawer settles pending end when reduced motion switches on', async ({ page }) => {
  const dialog = await choose(page, 'hold-end');
  await page.locator('#motion-show').click();
  await expect.poll(async () => (await lifecycle(page)).panel)
    .toContainEqual(['Appear', 'end', true, 'deadline']);

  await page.emulateMedia({ reducedMotion: 'reduce' });

  await expect.poll(async () => (await lifecycle(page)).afterOpen).toEqual([true]);
  await expect(dialog.locator('[data-ant-drawer-content-wrapper]'))
    .not.toHaveClass(/own-panel-appear/);
});

test('Drawer settles an active appear when its flag changes', async ({ page }) => {
  const dialog = await choose(page, 'cutoff');
  await page.locator('#motion-show').click();
  await expect.poll(async () => (await lifecycle(page)).panel)
    .toContainEqual(['Appear', 'end', true, 'deadline']);

  await owner(page, 'cutoff');

  await expect.poll(async () => (await lifecycle(page)).afterOpen).toEqual([true]);
  await expect(dialog.locator('[data-ant-drawer-content-wrapper]'))
    .not.toHaveClass(/own-panel-appear/);
});

test('Drawer discards a prepared opening if closed and destroyed', async ({ page }) => {
  const dialog = await choose(page, 'interrupt');
  const opener = page.locator('#motion-show');
  await opener.click();
  await expect.poll(async () => (await lifecycle(page)).panel)
    .toEqual([['Appear', 'prepare', true]]);

  await owner(page, 'hide');
  await expect(dialog).toBeHidden();
  await expect(dialog.locator('#inside')).toHaveCount(0);
  await expect(opener).toBeFocused();
  await owner(page, 'release');
  await opener.click();
  await expect.poll(async () => (await lifecycle(page)).panel.filter(entry =>
    entry[0] === 'Appear')).toEqual([['Appear', 'prepare', true], ['Appear', 'prepare', true]]);

  await owner(page, 'release');

  await expect.poll(async () => (await lifecycle(page)).afterOpen).toEqual([false, true]);
  expect((await lifecycle(page)).panel.filter(entry => entry[0] === 'Appear' && entry[1] === 'start'))
    .toEqual([['Appear', 'start', true, true]]);
});

test('Drawer with custom panel timing leaves native mask animation independent', async ({ page }) => {
  const dialog = await choose(page, 'mixed');
  await page.locator('#motion-show').click();
  await expect.poll(async () => (await lifecycle(page)).afterOpen).toEqual([true]);

  expect(await dialog.locator('[data-ant-drawer-mask]').evaluate(node =>
    node.getAnimations().some(motion => motion.playState === 'running'))).toBe(true);
});
