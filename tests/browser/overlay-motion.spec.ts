import type { Page } from '@playwright/test';
import { expect, test } from './test';
import reference from './fixtures/ant-design-overlay-motion-reference.json' with { type: 'json' };

type Sample = (typeof reference.cases)[number];
type Snapshot = Sample['initial'];

test.use({ viewport: { width: 960, height: 720 } });

/** Applies a stable native shell and content cache to the recorded Source image. */
function nativeSnapshot(expected: Snapshot, sample: Sample): Snapshot {
  const cached = sample.profile.mode !== 'destroy';
  return {
    mounted: true,
    visible: expected.visible,
    payload: expected.mounted ? expected.payload : cached,
    events: expected.events.map(event => ({
      ...event,
      mounted: true,
      payload: event.mounted ? event.payload : cached
    }))
  };
}

/** Updates the owner's condition without an additional outside event. */
async function ownerAction(page: Page, name: string) {
  await page.getByRole('button', { name, exact: true })
    .evaluate(button => (button as HTMLButtonElement).click());
}

/** Removes the actual top layer, the presence of content and accumulated callbacks. */
async function readSnapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(() => {
    const popup = document.querySelector('.motion-study-popup');
    const log = document.querySelector('[data-testid="motion-events"]')?.textContent ?? '[]';
    return {
      mounted: Boolean(popup),
      visible: Boolean(popup?.matches(':popover-open')),
      payload: Boolean(popup?.querySelector('[data-motion-payload]')),
      events: JSON.parse(log)
    };
  });
}

/** Saves the actual initial props from the profile, not from previous runs. */
async function selectCase(page: Page, index: number) {
  await page.goto('/?fixture=overlay-motion');
  await page.getByLabel('Overlay motion case').selectOption(String(index));
}

/** Verifies the beginning CSS animations separately from the completion of visibility. */
async function expectAnimation(page: Page, sample: Sample) {
  const expected = sample.activationMotion;
  const observed = page.getByTestId('motion-animation');
  if (!expected) {
    await expect(observed).toHaveText('null');
    return;
  }

  const name = sample.profile.motionName ? expected.name : 'ant-overlay-zoom-in';
  await expect(observed).toHaveText(JSON.stringify({ name, duration: expected.duration }));
}

for (const [index, sample] of reference.cases.entries()) {
  const { family, mode } = sample.profile;
  test(`${family} follows the pinned visibility lifecycle for ${mode}`, async ({ page }) => {
    await selectCase(page, index);
    const trigger = page.getByRole('button', { name: 'Toggle overlay', exact: true });
    const initial = nativeSnapshot(sample.initial, sample);
    await expect.poll(() => readSnapshot(page)).toEqual(initial);

    if (mode === 'controlled' || mode === 'interrupted') {
      await ownerAction(page, 'Open from owner');
    }
    else {
      await trigger.click();
    }

    await expectAnimation(page, sample);
    const activated = nativeSnapshot(sample.activated, sample);
    if (mode === 'interrupted') {
      await expect(page.getByTestId('motion-interrupted')).toHaveText(JSON.stringify(activated));
    }
    else {
      await expect.poll(() => readSnapshot(page)).toEqual({
        ...activated,
        events: [...initial.events, ...activated.events]
      });
    }

    switch (mode) {
      case 'interrupted':
        break;
      case 'controlled':
        await ownerAction(page, 'Close from owner');
        break;
      case 'disabled':
        await ownerAction(page, 'Disable from owner');
        break;
      case 'cancel':
        await page.locator('.motion-study-popup .ant-popconfirm-buttons button').first().click();
        break;
      default:
        await trigger.click();
    }

    const deactivated = nativeSnapshot(sample.deactivated, sample);
    if (mode === 'disabled' && family === 'Popconfirm') {
      // The public Svelte disabled hides the already open confirmation and retains raw open.
      deactivated.visible = false;
      deactivated.events = [{
        type: 'settled', open: false, mounted: true, visible: false, payload: true
      }];
    }
    await expect.poll(() => readSnapshot(page)).toEqual({
      ...deactivated,
      events: [...initial.events, ...activated.events, ...deactivated.events]
    });
  });
}

test('Popover leaves the focus order during motion and can reopen before settling closed',
  async ({ page }) => {
    const index = reference.cases.findIndex(({ profile }) =>
      profile.family === 'Popover' && profile.mode === 'animated');
    await selectCase(page, index);
    const trigger = page.getByRole('button', { name: 'Toggle overlay', exact: true });
    const editor = page.getByRole('textbox', { name: 'Popover editor' });
    const popup = page.locator('.motion-study-popup');
    await trigger.click();
    await expect.poll(async () => (await readSnapshot(page)).events.map(event => event.type))
      .toEqual(['request', 'settled']);

    await editor.focus();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(popup).toHaveAttribute('inert', '');

    await trigger.evaluate(button => (button as HTMLButtonElement).click());

    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(popup).not.toHaveAttribute('inert', '');
    await expect(editor).toBeFocused();
    await expect.poll(async () => (await readSnapshot(page)).events.map(({ type, open }) =>
      [type, open])).toEqual([
      ['request', true], ['settled', true], ['request', false], ['request', true], ['settled', true]
    ]);
  });

test('Tooltip settles without starting CSS animation for reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const index = reference.cases.findIndex(({ profile }) =>
    profile.family === 'Tooltip' && profile.mode === 'animated');
  await selectCase(page, index);

  await page.getByRole('button', { name: 'Toggle overlay', exact: true }).click();

  await expect.poll(async () => (await readSnapshot(page)).events.map(event => event.type))
    .toEqual(['request', 'settled']);
  await expect(page.getByTestId('motion-animation')).toHaveText('null');
});

test('Tooltip discards an unfinished notification when its owner unmounts', async ({ page }) => {
  const index = reference.cases.findIndex(({ profile }) =>
    profile.family === 'Tooltip' && profile.mode === 'animated');
  await selectCase(page, index);
  await page.clock.install();

  await ownerAction(page, 'Open from owner');
  await page.clock.runFor(60);
  await ownerAction(page, 'Remove overlay');
  await page.clock.runFor(1200);

  await expect(page.locator('.motion-study-popup')).toHaveCount(0);
  await expect(page.getByTestId('motion-events')).toHaveText('[]');
});

test('Tooltip realigns a moving trigger before reporting a completed opening', async ({ page }) => {
  const index = reference.cases.findIndex(({ profile }) =>
    profile.family === 'Tooltip' && profile.mode === 'animated');
  await selectCase(page, index);
  const popup = page.locator('.motion-study-popup');
  await popup.evaluate(surface => {
    const anchor = document.querySelector<HTMLElement>('#motion-trigger');
    const output = document.querySelector<HTMLElement>('[data-testid="motion-events"]');
    if (!anchor || !output) throw new Error('Missing overlay motion fixture');

    surface.addEventListener('animationstart', () => {
      anchor.style.translate = '100px';
    }, { once: true });
    const observer = new MutationObserver(() => {
      if (!output.textContent?.includes('"type":"settled"')) {
        return;
      }

      const target = anchor.getBoundingClientRect();
      const panel = surface.getBoundingClientRect();
      const delta = panel.left + panel.width / 2 - target.left - target.width / 2;
      output.dataset.centerDelta = String(Math.round(delta));
      observer.disconnect();
    });
    observer.observe(output, { subtree: true, characterData: true, childList: true });
  });

  await page.getByRole('button', { name: 'Toggle overlay', exact: true }).click();

  await expect(page.getByTestId('motion-events')).toHaveAttribute('data-center-delta', '0');
});

test('Tooltip waits for a custom motion deadline when the popup has no CSS end event',
  async ({ page }) => {
    const index = reference.cases.findIndex(({ profile }) =>
      profile.family === 'Tooltip' && profile.mode === 'custom');
    await selectCase(page, index);
    await page.addStyleTag({ content: '.study-pulse { animation: none !important; }' });
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));

    await ownerAction(page, 'Open from owner');
    await page.clock.runFor(200);
    await page.locator('[data-motion-payload]').dispatchEvent('animationend', { bubbles: true });
    await expect(page.getByTestId('motion-events')).toHaveText('[]');

    await page.clock.runFor(1000);

    await expect.poll(async () => (await readSnapshot(page)).events.map(({ type, open }) =>
      [type, open])).toEqual([['settled', true]]);
  });
