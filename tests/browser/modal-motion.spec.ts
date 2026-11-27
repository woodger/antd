import type { Page } from '@playwright/test';
import { expect, test } from './test';
import reference from './fixtures/ant-design-modal-motion-reference.json' with { type: 'json' };

test.use({ viewport: { width: 1280, height: 720 }, reducedMotion: 'no-preference' });

/** Opens the panel with the same type of input and at the same point as the entry React. */
async function openMotion(page: Page, keyboard = false) {
  const opener = page.getByRole('button', { name: 'Open motion', exact: true });
  if (keyboard) {
    await opener.focus();
    await page.keyboard.press('Enter');
  }
  else {
    await opener.click({ position: { x: 12, y: 8 } });
  }
}

/** Closes the panel after the independent entrance of the mask, as in the standard. */
async function closeAfterMask(page: Page) {
  await page.evaluate(async () => {
    const mask = document.querySelector('dialog.motion-probe [data-ant-modal-mask]');
    await Promise.allSettled(mask?.getAnimations().map(animation => animation.finished) ?? []);
    document.getElementById('motion-close-request')?.click();
  });
}

/** Reads recorded events without reordering close callbacks. */
async function readCallbacks(page: Page) {
  const output = await page.locator('#motion-callbacks').textContent();
  return JSON.parse(output ?? '[]') as unknown[];
}

/** Compares valid animationstart regardless of the order of frames of different DOM-nodes. */
async function readAnimations(page: Page) {
  const output = await page.locator('#motion-animations').textContent();
  const records = JSON.parse(output ?? '[]') as { name: string; duration: number; role: string; }[];
  return records.sort((a, b) => a.name.localeCompare(b.name));
}

/** Retains only its own mask effect to check the closed panel. */
async function pauseMaskLeave(page: Page) {
  await page.waitForFunction(() => {
    const mask = document.querySelector('dialog.motion-probe [data-ant-modal-mask]');
    const leave = mask?.getAnimations().find(animation =>
      animation instanceof CSSAnimation && animation.animationName === 'mask-end');
    leave?.pause();
    return Boolean(leave);
  });
}

for (const sample of reference.cases) {
  test(`Modal reports the source motion and origin for ${sample.profile.id}`, async ({ page }) => {
    await page.goto(`/modal-motion.html?profile=${sample.profile.id}`);
    await expect(page.locator('#root')).toHaveAttribute('data-ready', 'true');
    await openMotion(page, sample.profile.input === 'keyboard');
    await expect(page.locator('#motion-point')).toHaveText(JSON.stringify(sample.point));
    await expect.poll(() => readCallbacks(page)).toEqual(sample.callbacks.slice(0, 1));

    const dialog = page.getByRole('dialog', { name: 'Motion probe' });
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate(node => node.matches(':modal'))).toBe(true);

    await closeAfterMask(page);
    await expect.poll(() => readCallbacks(page)).toEqual(sample.callbacks);
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Open motion' })).toBeFocused();
  });
}

for (const sample of reference.lifetimes) {
  test(`Modal keeps independently named surfaces for ${sample.profile.id}`, async ({ page }) => {
    await page.goto(`/modal-motion.html?profile=${sample.profile.id}&lifetime`);
    await expect(page.locator('#root')).toHaveAttribute('data-ready', 'true');
    await openMotion(page);
    await expect.poll(() => readCallbacks(page)).toEqual(sample.callbacks.slice(0, 1));

    await closeAfterMask(page);

    await expect.poll(() => readCallbacks(page)).toEqual(sample.callbacks);
    await expect(page.locator('dialog.motion-probe [data-ant-modal-mask]')).toHaveCount(0);
    await expect.poll(() => readAnimations(page)).toEqual(sample.animations);
    await expect(page.locator('#motion-editor')).toHaveCount(Number(sample.afterCallback.editor));
    await expect(page.locator('dialog.motion-probe:popover-open')).toHaveCount(0);
  });
}

test('reads the click before a conditionally rendered Modal has mounted', async ({ page }) => {
  await page.goto('/modal-motion.html?profile=conditional');
  await expect(page.locator('dialog.motion-probe')).toHaveCount(0);

  await openMotion(page);

  await expect.poll(() => readCallbacks(page)).toEqual([[true, '-306px 90px', false]]);
});

test('uses explicit page coordinates after scrolling the document', async ({ page }) => {
  await page.goto('/modal-motion.html?profile=explicit');
  await page.evaluate(() => {
    document.body.style.minHeight = '1800px';
    window.scrollTo(0, 420);
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(420);

  await openMotion(page);

  await expect.poll(() => readCallbacks(page)).toEqual([[true, '-260px -220px', false]]);
});

test('a nested native Modal lets its mask finish while the parent receives focus and clicks', async ({ page }) => {
  await page.goto('/modal-motion.html?profile=nested');
  await openMotion(page);
  await expect.poll(() => readCallbacks(page)).toHaveLength(1);
  const child = page.locator('dialog.motion-probe');
  const backdrop = child.locator('[data-ant-modal-mask]');
  const original = await backdrop.elementHandle();

  await closeAfterMask(page);
  await pauseMaskLeave(page);

  await expect.poll(() => readCallbacks(page)).toHaveLength(3);
  await expect(child).not.toHaveAttribute('open');
  await expect(child).toHaveAttribute('inert');
  await expect(child).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('dialog.motion-host:modal')).toHaveCount(1);
  await expect(page.locator('dialog.motion-probe:popover-open')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Open motion' })).toBeFocused();
  expect(await backdrop.evaluate((node, before) => node === before, original)).toBe(true);

  await openMotion(page);
  await expect.poll(() => readCallbacks(page)).toHaveLength(4);
  await expect(page.locator('dialog.motion-probe:modal')).toHaveCount(1);
  await expect(child).not.toHaveAttribute('inert');
  await expect(child).not.toHaveAttribute('aria-hidden');
  await expect(page.locator('#motion-opener-clicks')).toHaveText('2');
});

for (const [profile, keepLayer] of [['covered', false], ['raised', true]] as const) {
  test(`a closing mask respects native dialog presentation order for ${profile}`, async ({ page }) => {
    await page.goto(`/modal-motion.html?profile=${profile}`);
    await openMotion(page);
    await expect.poll(() => readCallbacks(page)).toHaveLength(1);
    await page.getByRole('button', { name: 'Open upper dialog' }).click();
    const upper = page.locator('dialog.motion-upper:modal');
    const editor = upper.getByRole('textbox', { name: 'Upper editor' });
    await expect(editor).toBeFocused();

    const first = page.locator('dialog.motion-probe');
    if (keepLayer) {
      await page.locator('#motion-mask-toggle').dispatchEvent('click');
      await expect(first.locator(':scope:modal')).toHaveCount(1);
    }

    await closeAfterMask(page);
    await pauseMaskLeave(page);
    await expect.poll(() => readCallbacks(page)).toHaveLength(3);

    await expect(first).not.toHaveAttribute('open');
    await expect(first.locator('[data-ant-modal-mask]')).toHaveCount(1);
    await expect(first.locator(':scope:popover-open')).toHaveCount(Number(keepLayer));
    await expect(editor).toBeFocused();
    await editor.fill('Top stays active');
    await expect(editor).toHaveValue('Top stays active');
  });
}

for (const profile of ['confirm', 'confirm-stock']) {
  test(`${profile} switches the next transition name through update()`, async ({ page }) => {
    await page.goto(`/modal-motion.html?profile=${profile}`);
    await openMotion(page);
    await expect.poll(() => readCallbacks(page)).toHaveLength(1);

    await page.locator('#motion-reset-names').dispatchEvent('click');
    await closeAfterMask(page);

    await expect.poll(() => readCallbacks(page)).toHaveLength(3);
    await expect.poll(() => readAnimations(page)).toContainEqual({
      name: 'panel-swap', role: 'panel', duration: 240
    });
    await expect(page.locator('dialog.motion-probe')).toHaveCount(0);
  });
}

test('a missing CSS rule releases the named panel and mask', async ({ page }) => {
  const source = reference.special.find(item => item.profile.id === 'missing-rules');
  expect(source?.opened).toEqual({ callbacks: [], effects: 0 });
  expect(source?.closed).toEqual({ callbacks: [], effects: 0, wrapperVisible: true });
  await page.goto('/modal-motion.html?profile=missing-rules');
  await openMotion(page);
  await expect.poll(() => readCallbacks(page)).toEqual([[true, '-306px 90px', false]]);

  await closeAfterMask(page);

  await expect.poll(() => readCallbacks(page)).toEqual([
    [true, '-306px 90px', false], 'close', [false, '-306px 90px', false]
  ]);
  await expect(page.locator('dialog.motion-probe:popover-open')).toHaveCount(0);
  await expect(page.locator('dialog.motion-probe [data-ant-modal-mask]')).toHaveCount(0);
});

test('CSS transitions use their own transitionend and report the source duration', async ({ page }) => {
  const source = reference.special.find(item => item.profile.id === 'css-transition');
  expect(source?.callbacks).toBeDefined();
  await page.goto('/modal-motion.html?profile=css-transition');
  await openMotion(page);
  await expect.poll(() => readCallbacks(page)).toHaveLength(1);

  await closeAfterMask(page);

  await expect.poll(() => readCallbacks(page)).toEqual(source?.callbacks);
  await expect.poll(() => readAnimations(page)).toEqual(source?.animations);
});

test('unmounting a passive mask releases the browser top layer and scroll lock', async ({ page }) => {
  await page.goto('/modal-motion.html?profile=custom');
  await openMotion(page);
  await expect.poll(() => readCallbacks(page)).toHaveLength(1);
  await closeAfterMask(page);
  await pauseMaskLeave(page);
  await expect(page.locator('dialog.motion-probe:popover-open')).toHaveCount(1);

  await page.locator('#motion-unmount').dispatchEvent('click');

  await expect(page.locator('dialog.motion-probe')).toHaveCount(0);
  await expect(page.locator(':popover-open')).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
  await expect(page.locator('#motion-probe-open')).toBeFocused();
});

test('toggling the mask animates it without a second opening of the panel', async ({ page }) => {
  await page.goto('/modal-motion.html?profile=live-mask');
  await openMotion(page);
  await expect.poll(() => readCallbacks(page)).toHaveLength(1);
  const editor = page.getByRole('textbox', { name: 'Motion editor' });
  await editor.fill('Edited');
  const original = await editor.elementHandle();

  await page.locator('#motion-mask-toggle').dispatchEvent('click');
  await expect.poll(() => readAnimations(page)).toContainEqual({
    name: 'mask-end', role: 'mask', duration: 300
  });
  await expect(page.locator('dialog.motion-probe[open]')).toHaveCount(1);
  await expect(page.locator('dialog.motion-probe [data-ant-modal-mask]')).toHaveCount(0);
  await expect.poll(() => readCallbacks(page)).toHaveLength(1);
  expect(await editor.evaluate((node, before) => node === before, original)).toBe(true);
  await expect(editor).toHaveValue('Edited');
});

test('enabling reduced motion during leave releases both named surfaces', async ({ page }) => {
  await page.goto('/modal-motion.html?profile=custom');
  await openMotion(page);
  await expect.poll(() => readCallbacks(page)).toHaveLength(1);
  await closeAfterMask(page);
  await expect(page.locator('dialog.motion-probe [data-ant-modal-mask]'))
    .toHaveClass(/probe-mask-leave/);

  await page.emulateMedia({ reducedMotion: 'reduce' });

  await expect.poll(() => readCallbacks(page)).toHaveLength(3);
  await expect(page.locator('dialog.motion-probe [data-ant-modal-mask]')).toHaveCount(0);
  await expect(page.locator('dialog.motion-probe:popover-open')).toHaveCount(0);
});

test('a reopen during named leave cancels the old close and retains the editor', async ({ page }) => {
  await page.goto('/modal-motion.html?profile=custom');
  await openMotion(page);
  await expect.poll(() => readCallbacks(page)).toHaveLength(1);
  const editor = page.getByRole('textbox', { name: 'Motion editor' });
  await editor.fill('Edited');
  const original = await editor.elementHandle();

  await closeAfterMask(page);
  await expect(page.locator('dialog.motion-probe [data-ant-modal-panel]'))
    .toHaveClass(/probe-panel-leave/);
  await page.locator('#motion-probe-open').dispatchEvent('click');

  await expect.poll(() => readCallbacks(page)).toHaveLength(2);
  const events = await readCallbacks(page);
  expect(events.every(event => Array.isArray(event) && event[0] === true)).toBe(true);
  await expect(editor).toHaveValue('Edited');
  expect(await editor.evaluate((node, before) => node === before, original)).toBe(true);
});
