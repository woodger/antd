import type { Page } from '@playwright/test';
import { expect, test } from './test';
import reference from './fixtures/ant-design-drawer-geometry-reference.json' with { type: 'json' };

const handle = '#geometry-drawer-a > [data-ant-drawer-content-wrapper] > [data-ant-drawer-dragger]';
const wrapper = '#geometry-drawer-a > [data-ant-drawer-content-wrapper]';

/** Select a profile before opening the modal dialog. */
async function select(page: Page, profile: string) {
  await page.goto('/?fixture=drawer-geometry');
  await page.getByRole('combobox', { name: 'Drawer profile' }).selectOption(profile);
}

/** Specifies the openness of the owner without interaction with the inert background. */
async function setOwner(page: Page, action: string) {
  await page.getByTestId(action).evaluate(button => {
    if (button instanceof HTMLButtonElement) button.click();
  });
}

/** Measures the wrapper and the handle through DOM. Empty SSR shell is projected in the absence of a panel. */
async function panels(page: Page, phase = false) {
  return page.evaluate(phase => ['a', 'b', 'c'].map(id => {
    const dialog = document.getElementById(`geometry-drawer-${id}`);
    const content = document.getElementById(`geometry-draft-${id}`);
    if (!(dialog instanceof HTMLDialogElement) || !dialog.open && !content) {
      return null;
    }

    const state = { visible: dialog.open, mounted: Boolean(content) };
    if (!dialog.open || phase) {
      return state;
    }

    const wrapper = dialog.querySelector(':scope > [data-ant-drawer-content-wrapper]');
    if (!wrapper) {
      throw new Error('Missing visible Drawer wrapper');
    }
    const rect = wrapper.getBoundingClientRect();
    const handle = wrapper.querySelector(':scope > [data-ant-drawer-dragger]');
    const bounds = handle?.getBoundingClientRect();
    const horizontal = dialog.matches('[data-ant-drawer-placement="left"], [data-ant-drawer-placement="right"]');

    return {
      ...state,
      rect: [rect.x, rect.y, rect.width, rect.height],
      handle: bounds ? horizontal ? bounds.width : bounds.height : null,
      dragging: wrapper.hasAttribute('data-ant-drawer-dragging')
    };
  }), phase);
}

/** Begins a real drag in the middle of the visible handle and retains it pointerId. */
async function begin(page: Page) {
  const element = page.locator(handle);
  await expect(element).toBeVisible();
  await element.evaluate(node => node.addEventListener('pointerdown', event => {
    if (event instanceof PointerEvent) node.setAttribute('data-probe-pointer', String(event.pointerId));
  }, { once: true }));
  const bounds = await element.boundingBox();
  if (!bounds) {
    throw new Error('Missing Drawer resize handle bounds');
  }

  const x = Math.floor(bounds.x + bounds.width / 2);
  const y = Math.floor(bounds.y + bounds.height / 2);
  await page.mouse.move(x, y);
  await page.mouse.down();
  const pointerId = Number(await element.getAttribute('data-probe-pointer'));
  expect(pointerId).toBeGreaterThan(0);

  return { x, y, pointerId };
}

/** Sends a one-time pointer exit for viewport with the identity of the gesture started. */
async function moveBeyondViewport(page: Page, point: { x: number; y: number; pointerId: number; }) {
  await page.evaluate(({ x, y, pointerId }) => {
    document.dispatchEvent(new PointerEvent('pointermove', {
      clientX: x, clientY: y, pointerId, bubbles: true
    }));
  }, point);
}

/** Stops the current level Drawer animation to check the interrupted leave. */
async function pauseLeave(page: Page) {
  await expect.poll(() => page.locator(wrapper).evaluate(node => {
    const animations = node.getAnimations();
    for (const animation of animations) animation.pause();
    return animations.length;
  })).toBeGreaterThan(0);
}

test.use({ viewport: { width: 960, height: 720 } });

for (const { profile, frames } of reference.cases) {
  test(`Drawer follows pinned geometry and events for ${profile.name}`, async ({ page }) => {
    await select(page, profile.name);
    let start: Awaited<ReturnType<typeof begin>> | undefined;
    const events: unknown[][] = [];

    for (const frame of frames) {
      const action = frame.action;
      if (action === 'start') {
        start = await begin(page);
      }
      else if (start && action.startsWith('move:')) {
        const delta = Number(action.slice(5));
        const horizontal = profile.placement === 'left' || profile.placement === 'right';
        const x = horizontal ? start.x + delta : start.x;
        const y = horizontal ? start.y : start.y + delta;
        if (x >= 960) {
          await moveBeyondViewport(page, { x, y, pointerId: start.pointerId });
        }
        else {
          await page.mouse.move(x, y);
        }
      }
      else if (action === 'end') {
        await page.mouse.up();
        start = undefined;
      }
      else if (action === 'close-before-motion') {
        await setOwner(page, 'close-a');
        await pauseLeave(page);
      }
      else if (action === 'reopen-before-motion') {
        await setOwner(page, 'open-a');
      }
      else if (action === 'end-motion') {
        await page.locator('#geometry-drawer-a').evaluate(node => {
          for (const animation of node.getAnimations({ subtree: true })) animation.finish();
        });
      }
      else if (/^(open|close):/.test(action)) {
        await setOwner(page, action.replace(':', '-'));
      }

      const expected = [...frame.panels];
      if (profile.name === 'push-two-children' && action === 'close:b') {
        // Source resets the push when any child is closed. The panel c is still open.
        const twoOpen = frames.find(frame => frame.action === 'open:c');
        expect(twoOpen).toBeDefined();
        expected[0] = twoOpen?.panels[0] ?? null;
      }
      events.push(...frame.events);

      await expect.poll(() => panels(page, action.endsWith('-before-motion'))).toEqual(expected);
      await expect(page.getByTestId('geometry-events')).toHaveText(JSON.stringify(events));
    }
  });
}

test('Drawer uses the last proposed size when the owner removes controlled size', async ({ page }) => {
  await select(page, 'resize-bottom-rejected');
  const start = await begin(page);
  await page.mouse.move(start.x, start.y - 50);
  await page.mouse.up();
  await expect(page.locator(wrapper)).toHaveCSS('height', '200px');

  await setOwner(page, 'remove-size');

  await expect(page.locator(wrapper)).toHaveCSS('height', '250px');
  await expect(page.getByTestId('geometry-events')).toHaveText(JSON.stringify([
    ['settled', 'a', true, true], ['start', 200], ['resize', 250], ['end', 200]
  ]));
});

for (const action of ['close-a', 'stop-resize', 'remove-drawer']) {
  test(`Drawer disposes an active resize on ${action}`, async ({ page }) => {
    await select(page, 'resize-right-max');
    const focused = page.locator('#geometry-draft-a');
    await focused.focus();
    const start = await begin(page);
    await expect(focused).toBeFocused();
    await page.mouse.move(start.x - 24, start.y);

    await setOwner(page, action);
    await page.mouse.move(start.x - 72, start.y);
    await page.mouse.up();

    const events: unknown[][] = [['settled', 'a', true, true], ['start', 378], ['resize', 402]];
    if (action === 'close-a') events.push(['settled', 'a', false, true]);
    await expect(page.getByTestId('geometry-events')).toHaveText(JSON.stringify(events));
    await expect(page.locator('[data-ant-drawer-dragging]')).toHaveCount(0);
  });
}
