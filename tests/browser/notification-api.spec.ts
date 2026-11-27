import type { Page } from '@playwright/test';
import reference from './fixtures/ant-design-notification-api-reference.json' with { type: 'json' };
import { expect, test } from './test';

type Sample = typeof reference.cases[number];
type Frame = Sample['frames'][number];

/** Removes the current slots and position of the cards on the screen after the popover is opened. */
function readFrame(page: Page, nativePlainOrder: boolean) {
  const parts = ['title', 'description', 'wrapper', 'section', 'icon', 'actions', 'close', 'progress'];
  return page.evaluate(({ parts, nativePlainOrder }) => {
    /** Service classes and tokens of the theme remain outside the measurement of custom slots. */
    function appearance(node: HTMLElement | null) {
      if (!node) {
        return null;
      }

      const classes = [...node.classList].filter(name => /^(provider|holder|notice)-/.test(name));
      const names = [...node.style].filter(name => /^--(provider|holder|notice|winner|inline.*)$/.test(name));
      const styles = Object.fromEntries(names.map(name => [name, node.style.getPropertyValue(name).trim()]));
      return { classes: classes.sort(), styles };
    }

    const roots = [...document.querySelectorAll<HTMLElement>(
      ':popover-open > [data-ant-notification-list]'
    )];
    return roots.map(list => {
      const prefix = list.dataset.antNotificationPrefix;
      const placement = list.dataset.placement;
      const surface = list.parentElement;
      const target = surface?.closest('[id]')?.id ?? 'body';
      const content = list.querySelector<HTMLElement>('[data-ant-notification-content]');
      const nodes = [...list.querySelectorAll<HTMLElement>('[data-ant-notification-notice]')];
      const notices = nodes.map(node => {
        const slots = Object.fromEntries(parts.map(slot => [
          slot, node.querySelector<HTMLElement>(`[data-ant-notification-notice-${slot}]`)
        ]));
        const progress = node.querySelector<HTMLProgressElement>(
          'progress[data-ant-notification-notice-progress]'
        );
        const opacity = getComputedStyle(node).opacity;
        const type = ['warning', 'info'].find(value =>
          node.classList.contains(`${prefix}-notice-${value}`));
        return {
          title: slots.title?.textContent ?? null,
          description: slots.description?.textContent ?? null,
          role: node.getAttribute('role'),
          rect: nativePlainOrder || opacity === '0' ? null : Math.round(node.getBoundingClientRect().top),
          opacity,
          type: type ?? null,
          native: [node.id, node.title, node.getAttribute('aria-label')],
          close: slots.close && [slots.close.textContent, slots.close.getAttribute('aria-label')],
          progress: progress && [progress.tagName, progress.max],
          styles: { root: appearance(node), ...Object.fromEntries(parts.map(slot =>
            [slot, appearance(slots[slot])])) }
        };
      });
      return {
        prefix, placement, notices, list: appearance(list), listContent: appearance(content),
        stack: list.classList.contains(`${prefix}-stack`),
        expanded: list.classList.contains(`${prefix}-stack-expanded`),
        rtl: list.classList.contains(`${prefix}-rtl`),
        top: list.style.getPropertyValue('--notification-top'),
        bottom: list.style.getPropertyValue('--notification-bottom'),
        target
      };
    }).sort((first, second) => String(first.placement).localeCompare(String(second.placement)));
  }, { parts, nativePlainOrder });
}

/** The internal --notification-y was replaced with CSS-folding, the order of the usual list is saved. */
function expectedFrame(frame: Frame, nativePlainOrder: boolean) {
  return frame.map(list => ({
    ...list,
    target: list.target === 'body' ? 'app' : list.target,
    notices: list.notices.map(({ offset: _offset, ...notice }) => ({
      ...notice, rect: nativePlainOrder || notice.opacity === '0' ? null : notice.rect
    }))
  }));
}

/** Compares the active <progress> to the pause and after the same hour interval. */
async function readProgressTiming(page: Page) {
  const value = () => page.locator('progress').evaluate((node: HTMLProgressElement) => node.value);
  await page.clock.runFor(320);
  const running = await value();
  await page.getByText('Timed', { exact: true }).hover();
  await page.clock.runFor(80);
  const paused = await value();
  await page.clock.runFor(380);
  const during = await value();
  await page.mouse.move(20, 440);
  await page.clock.runFor(220);
  const resumed = await value();
  await page.clock.runFor(2300);

  await expect(page.locator('progress')).toHaveCount(0);
  return { moved: running < 100, stableWhileHovered: paused === during, resumed: resumed < during };
}

/** Restores the missing fields of the original JSON and leaves separate getter calls. */
function readEvents(page: Page) {
  return page.evaluate(() => {
    const { containers, events, arguments: args } = window.notificationProbe;
    return {
      containers: [...new Map(containers.map(row => [row.join(':'), row])).values()],
      events,
      args: Object.fromEntries(Object.entries(args).map(([name, props]) =>
        [name, Object.fromEntries(Object.entries(props).map(([key, value]) => [key, value ?? null]))]))
    };
  });
}

for (const sample of reference.cases) {
  test(`matches Source Notification for ${sample.kind}`, async ({ page }) => {
    const nativePlainOrder = sample.kind === 'closable' || sample.kind === 'progress';
    const frames = sample.frames.map(frame => expectedFrame(frame, nativePlainOrder));
    await page.setViewportSize({ width: 1100, height: 700 });
    if (sample.kind === 'progress') await page.clock.install();
    await page.goto(`/notification-api.html?kind=${sample.kind}`);

    await expect.poll(() => readFrame(page, nativePlainOrder)).toEqual(frames[0]);
    if (sample.kind === 'portal' || sample.kind === 'app') {
      const label = sample.kind === 'app' ? 'Old default' : 'Top';
      const title = page.getByText(label, { exact: true });
      const original = await title.elementHandle();
      const editor = page.getByRole('textbox', { name: 'Outside editor' });
      await editor.evaluate((node: HTMLInputElement) => {
        node.focus();
        node.setSelectionRange(2, 6);
      });

      await page.evaluate(async () => window.notificationProbe.move?.());

      await expect.poll(() => readFrame(page, nativePlainOrder)).toEqual(frames[1]);
      expect(await title.evaluate((node, before) => node === before, original)).toBe(sample.sameNode);
      await expect(editor).toBeFocused();
      expect(await editor.evaluate((node: HTMLInputElement) =>
        [node.selectionStart, node.selectionEnd])).toEqual([2, 6]);
      if (sample.kind === 'app') {
        await page.evaluate(() => window.notificationProbe.finish());
        await expect(page.locator('[data-ant-notification-notice]')).toHaveCount(0);
      }
    }
    else if (sample.kind === 'stack-default') {
      await page.getByText('Four', { exact: true }).hover();
      await expect.poll(() => readFrame(page, nativePlainOrder)).toEqual(frames[1]);
    }
    else if (sample.kind === 'semantics') {
      await page.getByRole('button', { name: 'Action', exact: true }).click();
      await page.locator('#semantic-notice').getByRole('button', { name: 'Close', exact: true }).click();
    }
    else if (sample.kind === 'closable') {
      await page.getByRole('button', { name: 'Local close button', exact: true }).click();
    }
    else if (sample.kind === 'progress') {
      expect(await readProgressTiming(page)).toEqual(sample.timing);
      await expect(page.getByText('No timeout', { exact: true })).toBeVisible();
    }

    // Native save the callback at FIFO, including a record ousted to its first render.
    const events = sample.kind === 'placement' ? ['evicted'] : sample.events;
    await expect.poll(() => readEvents(page)).toEqual({
      args: sample.args, containers: sample.containers, events
    });
  });
}

test('expands Notification on keyboard focus and pauses only the hovered placement', async ({ page }) => {
  await page.clock.install();
  await page.goto('/notification-api.html?kind=stack-focus');
  const top = page.locator('[data-placement="topRight"]');
  const bottom = page.locator('[data-placement="bottomLeft"]');
  const visible = top.getByRole('alert').filter({ hasText: 'Four' });
  const close = visible.getByRole('button', { name: 'Close', exact: true });
  await expect(top).not.toHaveClass(/\bant-notification-stack-expanded\b/);
  await expect(top.getByRole('alert')).toHaveCount(3);

  await close.focus();
  await expect(close).toBeFocused();
  await expect(top).toHaveClass(/\bant-notification-stack-expanded\b/);
  await expect(top.getByRole('alert')).toHaveCount(4);
  await visible.hover();
  await page.clock.fastForward(3000);

  await expect(bottom).toHaveCount(0);
  await expect(top.getByRole('alert')).toHaveCount(4);
  const editor = page.getByRole('textbox', { name: 'Outside editor' });
  await editor.hover();
  await editor.focus();
  await page.clock.fastForward(3000);

  await expect(page.locator('[data-ant-notification-list]')).toHaveCount(0);
  await expect(editor).toBeFocused();
});
