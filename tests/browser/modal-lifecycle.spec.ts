import type { ElementHandle, Page } from '@playwright/test';
import { expect, test } from './test';
import reference from './fixtures/ant-design-modal-lifecycle-reference.json' with { type: 'json' };

/** Removes events together with physical presence and identity editable input. */
async function observe(page: Page, previous?: ElementHandle) {
  return page.evaluate(oldEditor => {
    const editor = document.querySelector<HTMLInputElement>('#lifecycle-editor');
    const output = document.getElementById('lifecycle-events');

    return {
      mounted: Boolean(editor),
      kept: Boolean(editor && editor === oldEditor),
      value: editor?.value ?? null,
      events: JSON.parse(output?.textContent ?? '[]') as unknown[]
    };
  }, previous ?? null);
}

/** Observes the actual effects of the panel and the visible mask, including native ::backdrop. */
async function motionFrame(page: Page, phase: 'enter' | 'leave') {
  const waiting = await page.waitForFunction(direction => {
    const dialog = document.querySelector('dialog[open]');
    const panel = dialog?.querySelector('[data-ant-modal-panel]');
    const mask = dialog?.querySelector('[data-ant-modal-mask]');
    const panelAnimation = panel?.getAnimations()[0];
    const maskAnimation = mask ? mask.getAnimations()[0]
      : dialog?.getAnimations({ subtree: true }).find(({ effect }) =>
        effect instanceof KeyframeEffect && effect.pseudoElement === '::backdrop');
    const panelEffect = panelAnimation?.effect;
    const maskEffect = maskAnimation?.effect;
    if (!(panelEffect instanceof KeyframeEffect) || !(maskEffect instanceof KeyframeEffect)) {
      return undefined;
    }
    const lastFrame = panelEffect.getKeyframes().at(-1);
    if ((lastFrame?.opacity === '0') !== (direction === 'leave')) {
      return undefined;
    }

    return {
      panelDuration: panelEffect.getTiming().duration,
      maskDuration: maskEffect.getTiming().duration,
      editorMounted: Boolean(document.getElementById('lifecycle-editor')),
      events: JSON.parse(document.getElementById('lifecycle-events')?.textContent ?? '[]') as unknown[]
    };
  }, phase);
  return waiting.jsonValue();
}

for (const sample of reference.cases) {
  test(`Modal lifecycle matches the pinned source for ${sample.profile.id}`, async ({ page }) => {
    await page.goto(`/modal-lifecycle.html?profile=${sample.profile.id}`);
    await expect(page.locator('#root')).toHaveAttribute('data-ready', 'true');
    const opener = page.getByRole('button', { name: 'Open lifecycle' });
    const editor = page.getByLabel('Lifecycle editor', { exact: true });

    await expect.poll(() => observe(page)).toEqual(sample.initial);

    await opener.click();
    if (sample.entering) {
      const { panel: _panel, mask: _mask, ...start } = sample.entering;
      expect(await motionFrame(page, 'enter')).toEqual(start);
    }
    await expect.poll(() => observe(page)).toEqual(sample.opened);
    await editor.fill('Edited');
    const original = await editor.elementHandle();

    await page.getByRole('button', { name: 'Close lifecycle' }).click();
    if (sample.leaving) {
      const { panel: _panel, mask: _mask, ...end } = sample.leaving;
      expect(await motionFrame(page, 'leave')).toEqual(end);
    }
    await expect.poll(() => observe(page, original)).toEqual(sample.closed);
    await expect(opener).toBeFocused();
    await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');

    if (sample.keptClosed) {
      await page.getByRole('button', { name: 'Keep hidden' }).click();
      await expect.poll(() => observe(page, original)).toEqual(sample.keptClosed);
    }

    await opener.click();
    await expect.poll(() => observe(page, original)).toEqual(sample.reopened);
  });
}

test('keeps the ordinary closed Svelte Modal mounted before the first open', async ({ page }) => {
  await page.goto('/modal-lifecycle.html?profile=ordinary');

  await expect.poll(() => observe(page)).toEqual({
    mounted: true,
    kept: false,
    value: 'Seed',
    events: ['mount']
  });
  await expect(page.locator('dialog')).not.toHaveAttribute('open');
});

for (const sample of reference.updates) {
  test(`Modal forceRender change and leave reversal ${sample.profile.id}`, async ({ page }) => {
    await page.goto(`/modal-lifecycle.html?profile=${sample.profile.id}`);
    await expect(page.locator('#root')).toHaveAttribute('data-ready', 'true');
    const opener = page.getByRole('button', { name: 'Open lifecycle' });
    const editor = page.getByLabel('Lifecycle editor', { exact: true });

    await page.getByRole('button', { name: 'Disable preload' }).click();
    await expect.poll(() => observe(page)).toEqual(sample.afterUnforce);

    await opener.click();
    await expect(page.locator('#lifecycle-events')).toContainText('["afterOpenChange",true]');
    await editor.fill('Edited');
    const original = await editor.elementHandle();

    await page.getByRole('button', { name: 'Close lifecycle' }).click();
    await motionFrame(page, 'leave');
    await opener.dispatchEvent('click');

    await expect.poll(() => observe(page, original)).toEqual(sample.renewed);
    await expect(page.locator('html')).toHaveCSS('overflow', 'hidden');
  });
}

test('reduced motion finishes an active close in a managed modal', async ({ page }) => {
  await page.goto('/modal-lifecycle.html?profile=motion-destroy&managed');
  const opener = page.getByRole('button', { name: 'Open lifecycle' });
  const events = page.locator('#lifecycle-events');
  await opener.click();
  await expect(events).toHaveText('["mount",["afterOpenChange",true]]');

  await page.getByRole('button', { name: 'Close lifecycle' }).click();
  await motionFrame(page, 'leave');
  await page.emulateMedia({ reducedMotion: 'reduce' });

  await expect(page.locator('dialog')).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(events).toHaveText(
    '["mount",["afterOpenChange",true],"destroy",["afterClose",false,true],["afterOpenChange",false]]'
  );
});

test('disabling theme motion settles a pending open once', async ({ page }) => {
  await page.goto('/modal-lifecycle.html?profile=motion-destroy');
  const events = page.locator('#lifecycle-events');
  await page.getByRole('button', { name: 'Open lifecycle' }).click();
  await motionFrame(page, 'enter');

  await page.locator('#lifecycle-disable-motion').dispatchEvent('click');

  await expect(events).toHaveText('["mount",["afterOpenChange",true]]');
  const dialog = page.locator('dialog[open]');
  expect(await dialog.evaluate(node => node.getAnimations({ subtree: true }).length)).toBe(0);
});

test('unmounting during leave releases modality without completing its callbacks', async ({ page }) => {
  await page.goto('/modal-lifecycle.html?profile=motion-destroy');
  const opener = page.getByRole('button', { name: 'Open lifecycle' });
  const events = page.locator('#lifecycle-events');
  await opener.click();
  await expect(events).toHaveText('["mount",["afterOpenChange",true]]');

  await page.getByRole('button', { name: 'Close lifecycle' }).click();
  await motionFrame(page, 'leave');
  await page.locator('#lifecycle-unmount').dispatchEvent('click');

  await expect(page.locator('dialog')).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
  await expect(opener).toBeFocused();
  await expect(events).toHaveText('["mount",["afterOpenChange",true],"destroy"]');
});
