import type { Locator, Page } from '@playwright/test';
import { test, expect } from './test';
import { dropdownMotionCases } from './dropdown-lifecycle-reference';

const fixture = '/?fixture=dropdown-lifecycle&sample=motion-';
test.use({ viewport: { width: 1000, height: 700 } });

// Fixture settings buttons update the owner without translating the focus.
function configure(page: Page, action: string) {
  return page.locator('#' + action).evaluate((button: HTMLButtonElement) => button.click());
}

// Real CSSAnimation is tested by phases, timing and key frames.
async function readMotion(page: Page) {
  const value = await page.waitForFunction(() => {
    const panel = document.querySelector('.subject-popup');
    const animation = panel?.getAnimations().find(item => item instanceof CSSAnimation);
    const effect = animation?.effect;
    if (!panel || !(animation instanceof CSSAnimation) || !(effect instanceof KeyframeEffect)) {
      return false;
    }

    const { duration, delay, easing, fill } = effect.getTiming();
    const keyframes = effect.getKeyframes().map(({ offset, opacity, transform }) =>
      ({ offset, opacity, transform }));
    return { name: animation.animationName, duration, delay, easing, fill, keyframes,
      classes: panel.className.split(/\s+/) };
  });
  return value.jsonValue();
}

// Returns the absence of the panel separately from the held DOM in a hidden state.
function visible(locator: Locator) {
  return locator.evaluateAll(nodes => nodes[0]?.checkVisibility() ?? null);
}

for (const { profile, frames } of dropdownMotionCases) {
  test(`Dropdown applies original CSS phases and lifecycle for ${profile.id}`, async ({ page }) => {
    await page.goto(fixture + profile.id);
    const popup = page.locator('.subject-popup');
    const trigger = page.locator('#trigger');
    const handles = new Map<number, Awaited<ReturnType<Locator['elementHandle']>>>();
    for (const { step, state, animation } of frames) {
      if (step === 'unmount') await configure(page, 'dispose');
      else if (step !== 'initial') await trigger.click();

      if (animation) {
        const seen = await readMotion(page);
        const phase = (tokens: string[]) => tokens.filter(name =>
          name.startsWith('ant-slide-') || name.startsWith('case-fade'));
        const { state: appearing, ...original } = animation;
        expect(seen, step).toEqual({ ...original,
          name: original.name.replace(/^css-[\w]+-/, ''), classes: expect.any(Array)
        });
        if (seen && appearing.popup) {
          expect(phase(seen.classes), step).toEqual(phase(appearing.popup.classes));
          const id = appearing.popup.identity;
          const first = handles.get(id);
          if (first) expect(await popup.evaluate((node, before) => node === before, first)).toBe(true);
          else handles.set(id, await popup.elementHandle());
        }
      }

      const nativeShell = step === 'initial' && !profile.destroyOnHidden && !profile.forceRender;
      const expected = nativeShell ? false : state.popup?.visible ?? null;
      await expect.poll(() => visible(popup), { message: step }).toBe(expected);
      if (state.popup) {
        await expect.poll(async () => popup.evaluate(node => node.getAnimations().length)).toBe(0);
        const id = state.popup.identity;
        const before = handles.get(id);
        if (before) expect(await popup.evaluate((node, handle) => node === handle, before)).toBe(true);
        else handles.set(id, await popup.elementHandle());
      }
      const events = state.events.map(([next, source]) => ['open', next, source]);
      await expect(page.locator('#lifecycle-events')).toHaveText(JSON.stringify(events));
    }
  });
}

test('Dropdown reopens a leaving panel and settles a later close when motion is disabled', async ({ page }) => {
  await page.goto(fixture + 'custom-destroy');
  const trigger = page.locator('#trigger');
  const popup = page.locator('.subject-popup');
  await trigger.click();
  await expect(popup).toBeVisible();
  const original = await popup.elementHandle();
  await trigger.click();
  await readMotion(page);
  await expect(popup).toHaveAttribute('inert');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  await trigger.click();

  await expect(popup.getByRole('menuitem', { name: 'First command' })).toBeVisible();
  expect(await popup.evaluate((node, before) => node === before, original)).toBe(true);
  await trigger.click();
  await readMotion(page);

  await configure(page, 'disable-motion');

  await expect(popup).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.locator('#lifecycle-events')).toHaveText(
    '[["open",true,"trigger"],["open",false,"trigger"],["open",true,"trigger"],["open",false,"trigger"]]'
  );
});

test('Dropdown respects reduced motion for a destroyable, initially forced popup', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(fixture + 'custom-force-destroy');
  const popup = page.locator('.subject-popup');
  const trigger = page.locator('#trigger');
  await expect(popup).toBeHidden();
  await expect(popup).toHaveCount(1);

  await trigger.click();

  await expect(popup).toBeVisible();
  expect(await popup.evaluate(node => node.getAnimations().length)).toBe(0);
  await trigger.click();
  await expect(popup).toBeHidden();
  await expect(popup).toHaveCount(1);
});
