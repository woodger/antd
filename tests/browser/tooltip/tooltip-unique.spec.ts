import type { Page } from '@playwright/test';
import { expect, test } from '../test';
import reference from '../fixtures/ant-design-tooltip-unique-reference.json' with { type: 'json' };

type Frame = (typeof reference.cases)[number]['snapshots'][number];
type Callback = Frame['callbacks'][number];
const popup = '.study-unique-popup';
const background = '[data-ant-tooltip-unique-background]';

/** He selects the script in an independent document with the same viewport as the record UMD. */
async function select(page: Page, mode: string) {
  await page.goto('/?fixture=tooltip-unique');
  await page.getByRole('combobox', { name: 'Unique case', exact: true }).selectOption(mode);
}

/** Transmits open to the owner without moving the index and outside. */
async function ownerAction(page: Page, name: string) {
  await page.getByRole('button', { name, exact: true })
    .evaluate(button => (button as HTMLButtonElement).click());
}

/** Serves a separate action of the owner, pointer or virtual clock step. */
async function act(page: Page, action: string) {
  const [kind, target] = action.split(':');
  if (kind === 'hover') {
    await page.locator(target === 'outside' ? '#unique-outside' : `#unique-trigger-${target}`).hover();
  }
  else if (kind === 'escape') {
    await page.keyboard.press('Escape');
  }
  else if (kind === 'open') {
    const buttons: Record<string, string> = {
      a: 'Open A', b: 'Open B', both: 'Open both', none: 'Close both'
    };
    const button = buttons[target];
    if (!button) throw new Error(`Unknown owner action ${action}`);
    await ownerAction(page, button);
  }
  else if (kind === 'remove') {
    await ownerAction(page, 'Remove A');
  }
  else if (kind === 'advance') {
    await page.clock.runFor(Number(target));
  }
  else if (kind === 'point' || kind === 'leave') {
    await page.locator(`#unique-trigger-${target}`).locator('..').dispatchEvent(
      kind === 'point' ? 'pointerenter' : 'pointerleave', { pointerType: 'mouse' }
    );
  }
}

/** Projects the shared surface and the visible stand-alone panel to the general observed fields. */
function sourcePanels(frame: Frame) {
  return frame.panels
    .filter(panel => panel.visible || panel.classes.some(name => name.endsWith('-unique-controlled')))
    .map(({ contents, visible, classes, arrows }) => ({ contents, visible, classes, arrows }))
    .sort((a, b) => (a.contents ?? '').localeCompare(b.contents ?? ''));
}

/** Reads actual native panels and CSS classes, including a hidden common shell. */
async function nativePanels(page: Page) {
  return page.locator(popup).evaluateAll(nodes => nodes
    .filter(node => node.matches('[data-ant-tooltip-unique], :popover-open'))
    .map(node => ({
      contents: node.querySelector('[data-study-content]')?.getAttribute('data-study-content') ?? null,
      visible: node.matches(':popover-open'),
      classes: [...node.classList].filter(name => /-(unique-controlled|placement-.+)$/.test(name)),
      arrows: node.querySelectorAll('[data-ant-tooltip-arrow]').length
    }))
    .sort((a, b) => (a.contents ?? '').localeCompare(b.contents ?? '')));
}

test.use({ viewport: { width: 960, height: 720 } });

for (const sample of reference.cases) {
  const mode = sample.profile.mode;
  if (mode === 'nested-popup' || mode === 'animated-switch' || mode === 'animated-cancel') continue;

  test(`Tooltip.UniqueProvider follows the pinned ${mode} profile`, async ({ page }) => {
    await select(page, mode);
    if (mode === 'delays') {
      const clockStart = new Date('2026-01-01T00:00:00Z');
      await page.clock.install({ time: clockStart });
      const pauseTime = new Date('2026-01-01T00:00:01Z');
      await page.clock.pauseAt(pauseTime);
    }
    const events: Callback[] = [];

    for (const frame of sample.snapshots) {
      await act(page, frame.action);
      events.push(...frame.callbacks);

      // Removing active trigger releases Native panel and delayed callbacks.
      const removed = frame.action === 'remove:a';
      await expect.poll(() => nativePanels(page)).toEqual(removed ? [] : sourcePanels(frame));
      await expect(page.locator(background)).toHaveCount(removed ? 0 : frame.backgrounds.length);
      await expect(page.getByTestId('unique-events')).toHaveText(JSON.stringify(events));
    }

    const getters = page.getByTestId('unique-getters');
    if (mode === 'opt-out') {
      await expect(getters).toHaveText(/^[1-9][0-9]*$/);
      await expect(page.locator('#unique-requested-container [data-ant-tooltip]')).toHaveCount(1);
    }
    else {
      await expect(getters).toHaveText('0');
    }
  });
}

test('Tooltip.UniqueProvider transfers the same shell and background with the active description',
  async ({ page }) => {
    await select(page, 'switch');
    const first = page.locator('#unique-trigger-a');
    const second = page.locator('#unique-trigger-b');
    const shell = page.locator(`${popup}[data-ant-tooltip-unique]`);
    await first.hover();
    await expect(first).toHaveAttribute('aria-describedby', 'external-id-a');
    await expect(shell).toHaveAttribute('id', 'external-id-a');
    await expect(page.locator(background)).toHaveCSS('background-color', 'rgb(22, 119, 255)');
    const originalShell = await shell.elementHandle();
    const originalBackground = await page.locator(background).elementHandle();

    await second.hover();

    await expect(second).toHaveAttribute('aria-describedby', 'external-id-b');
    await expect(first).not.toHaveAttribute('aria-describedby');
    await expect(shell).toHaveAttribute('id', 'external-id-b');
    await expect(page.getByTestId('unique-refs')).toHaveText('[null,"external-id-b"]');
    await expect(page.locator(background)).toHaveCSS('background-color', 'rgb(128, 48, 160)');
    expect(await shell.evaluate((node, original) => node === original, originalShell)).toBe(true);
    expect(await page.locator(background).evaluate((node, original) => node === original,
      originalBackground)).toBe(true);
  });

test('Tooltip.UniqueProvider hides unavailable content before its leave delay', async ({ page }) => {
  await select(page, 'empty-content');
  const trigger = page.locator('#unique-trigger-a');
  await trigger.hover();
  const shell = page.locator(`${popup}[data-ant-tooltip-unique]`);
  await expect(shell).toBeVisible();

  await ownerAction(page, 'Clear title');

  await expect(shell).toBeHidden();
  await expect(trigger).not.toHaveAttribute('aria-describedby');
});

test('Tooltip inside a Popover keeps its own popup and closes before the parent', async ({ page }) => {
  await select(page, 'nested-popup');
  await page.locator('#unique-parent').click();
  const parent = page.getByRole('dialog', { name: 'Parent overlay', exact: true });
  await parent.locator('#unique-trigger-a').hover();
  const tooltip = page.getByRole('tooltip').filter({ hasText: 'Payload a' });
  await expect(tooltip).toBeVisible();
  await expect(page.locator(background)).toHaveCount(0);

  await page.keyboard.press('Escape');
  await expect(tooltip).toBeHidden();
  await expect(parent).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(parent).toBeHidden();
});

test('Tooltip.UniqueProvider forwards the selected ConfigProvider to the panel and its snippet',
  async ({ page }) => {
    await select(page, 'theme');
    const shell = page.locator(`${popup}[data-ant-tooltip-unique]`);
    await page.locator('#unique-trigger-a').hover();
    await expect(shell.locator('.inner-a-typography')).toHaveText('Theme for a');
    await expect(page.locator(background)).toHaveCSS('background-color', 'rgb(55, 66, 147)');

    await ownerAction(page, 'Retheme A');
    await expect(page.locator(background)).toHaveCSS('background-color', 'rgb(186, 69, 84)');

    await page.locator('#unique-trigger-b').hover();
    await expect(shell.locator('.inner-b-typography')).toHaveText('Theme for b');
    await expect(page.locator(background)).toHaveCSS('background-color', 'rgb(57, 163, 68)');
  });

test('Slider and ellipsis Tooltip share the active surface', async ({ page }) => {
  await select(page, 'consumers');
  const shell = page.locator('[data-ant-tooltip-unique]');
  await expect(shell).toHaveText('34');
  const original = await shell.elementHandle();

  await page.locator('.unique-ellipsis-trigger').hover();

  await expect(shell).toHaveText('Text payload');
  await expect(page.locator('[data-ant-tooltip]:popover-open')).toHaveCount(1);
  expect(await shell.evaluate((node, previous) => node === previous, original)).toBe(true);
});

test('Slider and ellipsis Tooltip can opt out of the provider', async ({ page }) => {
  await select(page, 'consumers-opt-out');
  await page.locator('.unique-ellipsis-trigger').hover();

  await expect(page.getByRole('tooltip', { name: '34', exact: true })).toBeVisible();
  await expect(page.getByRole('tooltip', { name: 'Text payload', exact: true })).toBeVisible();
  await expect(page.locator(background)).toHaveCount(0);
});

/** Transmits a new target to the group inside the animationstart and can immediately cancel this request. */
async function retargetDuringEnter(page: Page, cancel: boolean) {
  await page.evaluate(cancel => {
    const log = document.querySelector<HTMLElement>('[data-testid="unique-events"]');
    if (!log) throw new Error('Fixture log is missing');

    // Sending the switch exactly inside the first zoom, with no network latency at the test.
    const retarget = (event: AnimationEvent) => {
      const panel = event.target;
      if (!(panel instanceof HTMLElement) || !panel.matches('[data-ant-tooltip-unique]')) return;

      document.removeEventListener('animationstart', retarget);
      const first = document.getElementById('unique-trigger-a');
      const second = document.getElementById('unique-trigger-b');
      const before = panel.querySelector('[data-study-content]')?.getAttribute('data-study-content');
      first?.parentElement?.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
      second?.parentElement?.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
      requestAnimationFrame(() => {
        const after = panel.querySelector('[data-study-content]')?.getAttribute('data-study-content');
        log.dataset.firstMotion = `${before}:${after}`;
        if (cancel) {
          second?.parentElement?.dispatchEvent(new PointerEvent('pointerleave', {
            pointerType: 'mouse'
          }));
        }
      });

      if (cancel) return;

      const observer = new MutationObserver(() => {
        const next = panel.querySelector('[data-study-content="b"]');
        if (!next) return;
        observer.disconnect();
        requestAnimationFrame(() => {
          const background = panel.querySelector('[data-ant-tooltip-unique-background]');
          const timing = background?.getAnimations()[0]?.effect?.getTiming();
          const delta = Math.abs((background?.getBoundingClientRect().left ?? 0)
            - panel.getBoundingClientRect().left);
          log.dataset.backgroundMotion = `${timing?.duration}:${delta > 20}`;
        });
      });
      observer.observe(panel, { childList: true, subtree: true });
    };

    document.addEventListener('animationstart', retarget);
  }, cancel);
}

test('Tooltip.UniqueProvider queues a new owner during enter and animates the background to it',
  async ({ page }) => {
    await select(page, 'animated-switch');
    await retargetDuringEnter(page, false);

    await page.locator('#unique-trigger-a').hover();

    await expect(page.getByTestId('unique-events')).toHaveAttribute('data-first-motion', 'a:a');
    await expect(page.locator(popup)).toHaveText('Payload b');
    await expect(page.getByTestId('unique-events')).toHaveAttribute(
      'data-background-motion', '300:true'
    );
    await expect.poll(() => page.locator(background).evaluate(node => {
      const current = node.getBoundingClientRect();
      const content = node.parentElement?.getBoundingClientRect();
      return content && Math.abs(current.left - content.left);
    })).toBeLessThan(1);
  });

test('Tooltip.UniqueProvider closes when a queued target leaves before enter completes',
  async ({ page }) => {
    const sample = reference.cases.find(item => item.profile.mode === 'animated-cancel');
    const observed = sample?.snapshots.find(frame => frame.action === 'during-enter:b');
    if (!observed || !('atStart' in observed) || !observed.atStart) {
      throw new Error('Missing canceled retarget sample');
    }

    await select(page, 'animated-cancel');
    await retargetDuringEnter(page, true);
    await page.locator('#unique-trigger-a').hover();

    const expected = [...observed.atStart.callbacks, ...observed.callbacks];
    await expect(page.getByTestId('unique-events')).toHaveText(JSON.stringify(expected));
    await expect(page.locator(popup)).toBeHidden();
    await expect(page.locator(popup)).toHaveCount(1);
    await expect(page.locator('#unique-trigger-a')).not.toHaveAttribute('aria-describedby');
    await expect(page.locator('#unique-trigger-b')).not.toHaveAttribute('aria-describedby');
  });

test('Tooltip.UniqueProvider repositions without CSS or background motion for reduced motion',
  async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await select(page, 'animated-switch');
    await page.locator('#unique-trigger-a').hover();
    await expect(page.locator(popup)).toHaveText('Payload a');

    await page.locator('#unique-trigger-b').hover();
    await expect(page.locator(popup)).toHaveText('Payload b');

    expect(await page.locator(popup).evaluate(
      node => node.getAnimations({ subtree: true }).length
    )).toBe(0);
  });
