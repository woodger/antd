import type { Page } from '@playwright/test';
import { test, expect } from './test';
import source from './fixtures/ant-design-menu-motion-reference.json' with { type: 'json' };
import lifecycle from './fixtures/ant-design-menu-motion-lifecycle-reference.json'
  with { type: 'json' };
import optionsSource from './fixtures/ant-design-menu-motion-options-reference.json'
  with { type: 'json' };

interface Paint {
  phase: string;
  tag: string;
  height: string;
  opacity: string;
}

declare global {
  interface Window {
    menuMotionPaints?: Paint[];
  }
}

const fixture = (page: Page) => page.getByTestId('menu-motion-fixture');
const callbackLog = (page: Page) => page.getByLabel('Menu motion callbacks');
const surface = (page: Page) => page.locator('[data-ant-menu-motion]');

// Includes the CSS commit before the next frame, even during the short prepare-only phase.
async function watchPhases(page: Page) {
  await page.evaluate(() => {
    const paints: Paint[] = [];
    window.menuMotionPaints = paints;
    const observer = new MutationObserver(() => {
      for (const node of document.querySelectorAll<HTMLElement>('[data-ant-menu-motion]')) {
        const phase = [...node.classList].find(name =>
          /-(?:appear|enter|leave)-(?:prepare|start|active)$/.test(name)
        );
        if (!phase) continue;

        const paint = { phase, tag: node.tagName, height: node.style.height,
          opacity: node.style.opacity };
        if (!paints.some(value => value.phase === phase && value.tag === paint.tag
          && value.height === paint.height && value.opacity === paint.opacity)) {
          paints.push(paint);
        }
      }
    });
    observer.observe(document.body, {
      subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style']
    });
  });
}

// Toggles owner state without incidental mouseenter events on the control.
async function clickOwner(page: Page, name: string) {
  await fixture(page).getByRole('button', { name, exact: true }).evaluate((button: HTMLButtonElement) => {
    button.click();
  });
}

// Measures a series of phases after mode change or openKeys.
function resetPhases(page: Page) {
  return page.evaluate(() => { window.menuMotionPaints?.splice(0); });
}

// Compares only the phases of the delegate, which were rendered on the surface.
async function phases(page: Page) {
  const data = await page.evaluate(() => window.menuMotionPaints ?? []);
  return [...new Set(data.map(item => item.phase))].sort();
}

// Saves the line between callback CSSMotion and the browser rendering event.
function expectedCallbacks(sample: { events: (string | number | boolean | string[] | null)[][]; }) {
  return sample.events.filter(([name]) => typeof name === 'string'
    && !['transitionend', 'animationend', 'openKeys'].includes(name)).map(([name, value]) =>
    name === 'visible' ? [name, value] : [name]);
}

// Checks the real user log without internal events CSS.
async function callbacks(page: Page) {
  const log: unknown[][] = JSON.parse(await callbackLog(page).textContent() ?? '[]');
  return log.map(([name, value]) => name === 'visible' ? [name, value] : [name]);
}

// Checks the named phases and their clearing until the owner's next change.
async function expectFrame(
  page: Page,
  entries: readonly { node: number; phases?: readonly string[]; }[],
  interrupt = false,
  extraPopup = false
) {
  const phasesInFrame = entries.flatMap(entry => {
    const phase = entry.phases?.[1];
    // In one of the two Source runs when changing the mode there was an extra nested popup.
    return phase && !(extraPopup && phase === 'ant-zoom-big-appear-prepare') ? [phase] : [];
  });
  const expected = [...new Set(phasesInFrame)].sort();
  await expect.poll(() => phases(page)).toEqual(expected);
  if (!interrupt) {
    await expect(surface(page).filter({ visible: true })
      .and(page.locator('[class*="-prepare"],[class*="-start"],[class*="-active"]'))).toHaveCount(0);
  }
}

test.use({ viewport: { width: 960, height: 640 }, reducedMotion: 'no-preference' });
test.beforeEach(async ({ page }) => {
  await page.goto('/?fixture=menu-motion');
  await expect(fixture(page).getByRole('menu', { name: 'Motion Menu', exact: true })).toBeVisible();
  await watchPhases(page);
});

for (const { profile, initial, steps } of source.results) {
  test(`matches the pinned Menu motion phases for ${profile.id}`, async ({ page }) => {
    await page.getByRole('combobox', { name: 'Menu motion profile' }).selectOption(profile.id);
    await expectFrame(page, initial.trace);
    const expected = expectedCallbacks(initial);
    await expect.poll(() => callbacks(page)).toEqual(expected);

    for (const [index, step] of steps.entries()) {
      await resetPhases(page);
      await clickOwner(page, `Step ${index + 1}`);
      const action = profile.steps[index];
      const interrupt = 'interrupt' in action && action.interrupt === true;
      await expectFrame(page, step.trace, interrupt,
        profile.id === 'inline-collapse' && index === 2);
      expected.push(...expectedCallbacks(step));
      await expect.poll(() => callbacks(page)).toEqual(expected);
    }
  });
}

test('animates the real inline height and keeps the list mounted after closing', async ({ page }) => {
  const list = page.locator('.motion-branch > [data-ant-menu-inline-list]');
  await clickOwner(page, 'Step 1');
  const original = await list.elementHandle();
  await expect(list).toBeVisible();
  await expect.poll(() => phases(page)).toContain('ant-motion-collapse-enter-active');
  await expect(list).not.toHaveClass(/motion-collapse-enter/);
  const height = await list.evaluate((element: HTMLElement) => element.offsetHeight);
  const enter = await page.evaluate(() => window.menuMotionPaints ?? []);

  expect(enter).toContainEqual({
    phase: 'ant-motion-collapse-enter-start', tag: 'UL', height: '0px', opacity: '0'
  });
  expect(enter).toContainEqual({
    phase: 'ant-motion-collapse-enter-active', tag: 'UL', height: `${height}px`, opacity: '1'
  });
  await resetPhases(page);
  await clickOwner(page, 'Step 2');
  await expect(list).toHaveClass(/ant-motion-collapse-leave-active/);
  await expect(list).toHaveAttribute('inert');
  await expect(list).toBeHidden();
  const leave = await page.evaluate(() => window.menuMotionPaints ?? []);

  expect(leave).toContainEqual({
    phase: 'ant-motion-collapse-leave-start', tag: 'UL', height: `${height}px`, opacity: ''
  });
  expect(leave).toContainEqual({
    phase: 'ant-motion-collapse-leave-active', tag: 'UL', height: '0px', opacity: '0'
  });
  expect(await list.evaluate((element, before) => element === before, original)).toBe(true);
});

test('leaving popup keeps its placement and releases the row for keyboard navigation', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Menu motion profile' }).selectOption('leave-focus');
  await clickOwner(page, 'Step 1');
  const popup = page.locator('.motion-branch > .ant-menu-submenu-popup');
  const leaf = popup.getByRole('menuitem', { name: 'Leaf', exact: true });
  await expect(popup).toBeVisible();
  await expect.poll(() => phases(page)).toContain('ant-zoom-big-appear-active');
  await expect(popup).not.toHaveClass(/zoom-big-appear/);
  await leaf.focus();
  const coordinates = await popup.evaluate(node => [node.style.left, node.style.top]);

  await clickOwner(page, 'Step 2');
  await expect(popup).toHaveClass(/ant-zoom-big-leave-active/);
  await expect(popup).toHaveAttribute('inert');
  await expect(popup).toHaveCSS('pointer-events', 'none');
  await clickOwner(page, 'Read leaf ref');

  await expect(page.getByLabel('Menu leaf registered')).toHaveText('false');
  expect(await popup.evaluate(node => [node.style.left, node.style.top])).toEqual(coordinates);
  await expect(popup).toBeHidden();
});

test('drops a pending enter preparation when the owner closes the inline list', async ({ page }) => {
  const sample = lifecycle.passes[0].find(record => record.name === 'cancel-prepare');
  if (!sample) throw new Error('Missing Source cancellation observation');
  await page.getByRole('combobox', { name: 'Menu motion profile' }).selectOption('cancel-prepare');

  await clickOwner(page, 'Step 1');
  await expect(page.getByLabel('Menu pending preparations')).toHaveText('1');
  await clickOwner(page, 'Step 2');
  await clickOwner(page, 'Resolve prepare');

  const expected = sample.after.events.map(event => {
    if (Array.isArray(event) && event[0] === 'visible') {
      return event;
    }
    const name = typeof event === 'string' ? event : event[0];
    const callback = String(name).replace(/(^|-)([a-z])/g,
      (_part, _separator, letter: string) => letter.toUpperCase());
    return [callback];
  });
  await expect.poll(() => callbacks(page)).toEqual(expected);
  await expect(page.locator('.motion-branch > [data-ant-menu-inline-list]')).toBeHidden();
});

test('disabling motion clears the active phase without publishing a stale end', async ({ page }) => {
  await page.clock.install();
  await page.getByRole('combobox', { name: 'Menu motion profile' })
    .selectOption('motion-disabled-active');
  await clickOwner(page, 'Step 1');
  const list = page.locator('.motion-branch > [data-ant-menu-inline-list]');
  await expect(list).toHaveClass(/sample-motion-enter-active/);

  await clickOwner(page, 'Step 2');
  await page.clock.runFor(450);

  await expect(list).toBeVisible();
  await expect(list).not.toHaveClass(/sample-motion/);
  await expect.poll(() => callbacks(page)).toEqual([['EnterPrepare'], ['EnterStart'], ['EnterActive']]);
});

test('unmount invalidates a pending prepare Promise and its phase callbacks', async ({ page }) => {
  await page.clock.install();
  await page.getByRole('combobox', { name: 'Menu motion profile' }).selectOption('cancel-prepare');
  await clickOwner(page, 'Step 1');
  await expect(page.getByLabel('Menu pending preparations')).toHaveText('1');

  await clickOwner(page, 'Unmount Menu');
  await clickOwner(page, 'Resolve prepare');
  await page.clock.runFor(600);

  await expect(surface(page)).toHaveCount(0);
  expect(await callbacks(page)).toEqual([['EnterPrepare']]);
});

test('reduced motion keeps the popup accessible without an active animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('combobox', { name: 'Menu motion profile' }).selectOption('reduced-motion');

  await clickOwner(page, 'Step 1');
  const popup = page.locator('.motion-branch > .ant-menu-submenu-popup');

  await expect(popup).toBeVisible();
  await expect(popup).not.toHaveClass(/zoom-big/);
  await expect(popup.getByRole('menuitem', { name: 'Leaf', exact: true })).toBeVisible();
  expect((await phases(page)).some(phase => phase.endsWith('-active'))).toBe(false);
});

for (const { opts, first, opened, closed } of optionsSource.passes[0]) {
  test(`matches motion prop ownership for ${opts.id}`, async ({ page }) => {
    await page.getByRole('combobox', { name: 'Menu motion profile' }).selectOption(opts.id);
    const tag = opts.mode === 'inline' ? 'UL' : 'DIV';
    const list = page.locator(`.motion-branch > ${tag.toLowerCase()}[data-ant-menu-motion]`);
    const title = page.getByRole('menuitem', { name: 'Branch', exact: true });
    const events: (string | boolean)[][] = [];
    const frames = [first, opened, closed];

    for (const [index, frame] of frames.entries()) {
      if (index > 0) await clickOwner(page, `Step ${index}`);
      await expect(title).toHaveAttribute('aria-expanded', frame.expanded);
      events.push(...frame.events.map(value => ['visible', value]));
      await expect.poll(() => callbacks(page)).toEqual(events);

      // The absolute surface of the old forceSubMenuRender has a separate Native lifecycle.
      const expected = frame.surfaces.filter(entry => entry.tag === tag)
        .map(({ display: _display, ...entry }) => ({
          ...entry,
          // The Inline list retains a basic inherited color from its Menu.
          color: entry.color || (tag === 'UL' ? 'inherit' : '')
        }));
      await expect.poll(() => list.evaluateAll(nodes => nodes.map(node => ({
        tag: node.tagName,
        hidden: getComputedStyle(node).display === 'none',
        className: [...node.classList].filter(name => /hidden|event-owner/.test(name)),
        color: (node as HTMLElement).style.color
      })))).toEqual(expected);
    }
  });
}
