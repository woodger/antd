import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../test';
import reference from '../fixtures/ant-design-image-motion-reference.json' with { type: 'json' };

const viewer = (page: Page) => page.locator('dialog.image-motion-probe');
const trigger = (page: Page) => page.getByRole('button', {
  name: 'Motion sample', exact: true, includeHidden: true
});
const completed = (page: Page) => page.getByLabel('Preview completions', { exact: true });
const requested = (page: Page) => page.getByLabel('Preview requests', { exact: true });
const restored = (page: Page) => page.getByLabel('Focus on completion', { exact: true });

interface MotionTrace {
  phases: {
    className: string;
    namedClass: boolean;
    origin: string;
    duration: string;
    transform: string;
    animation: string;
    locked: boolean;
    completed: boolean[];
  }[];
  rootEnd: { kind: string; property: string; }[];
}

test.use({ viewport: reference.viewport });

/** Locates the measurements and fails if their case was removed. */
function sample(name: string) {
  const found = reference.cases.find(item => item.name === name);
  if (!found) {
    throw new Error(`Missing Image motion reference for ${name}`);
  }

  return found;
}

/** Records the short start frame and the browser's own completion events. */
async function observeMotion(page: Page) {
  await page.evaluate(() => {
    const output = document.createElement('script');
    output.id = 'motion-trace';
    output.type = 'application/json';
    document.head.append(output);
    const trace: MotionTrace = { phases: [], rootEnd: [] };
    output.textContent = JSON.stringify(trace);

    const panel = () => document.querySelector<HTMLDialogElement>('dialog.image-motion-probe');
    const observer = new MutationObserver(() => {
      const root = panel();
      const body = root?.querySelector<HTMLElement>('.image-motion-body');
      const className = Array.from(root?.classList ?? [])
        .find(value => /-(appear|enter|leave)-(start|active)$/.test(value));
      if (!root || !body || !className || trace.phases.at(-1)?.className === className) return;

      const details = getComputedStyle(root);
      const name = className.replace(/-(appear|enter|leave)-(start|active)$/, '');
      const completed = document.querySelector('[aria-label="Preview completions"]')?.textContent;
      trace.phases.push({
        className,
        namedClass: root.classList.contains(name),
        origin: body.style.transformOrigin,
        duration: details.transitionDuration,
        transform: getComputedStyle(body).transform,
        animation: details.animationName,
        locked: getComputedStyle(document.documentElement).overflow === 'hidden',
        completed: JSON.parse(completed ?? '[]')
      });
      output.textContent = JSON.stringify(trace);
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    document.addEventListener('transitionend', event => {
      if (event.target !== panel()) return;
      trace.rootEnd.push({ kind: event.type, property: event.propertyName });
      output.textContent = JSON.stringify(trace);
    }, true);
    document.addEventListener('animationend', event => {
      if (event.target !== panel()) return;
      trace.rootEnd.push({ kind: event.type, property: event.animationName });
      output.textContent = JSON.stringify(trace);
    }, true);
  });
}

/** Reads the trace after the case reports that its last phase has ended. */
async function readTrace(page: Page): Promise<MotionTrace> {
  return JSON.parse(await page.locator('#motion-trace').textContent() ?? '{}');
}

/** Starts with a fresh component and begins capturing phases before it can mount the viewer. */
async function choose(page: Page, name: string) {
  await page.goto('/?fixture=image-motion');
  await observeMotion(page);
  await page.getByRole('combobox', { name: 'Preview motion case' }).selectOption(name);
}

/** Changes the controlled owner from outside the native modal's focus scope. */
async function control(page: Page, name: string) {
  await page.getByRole('button', { name, exact: true, includeHidden: true }).dispatchEvent('click');
}

/** Formats the event target's center in viewport coordinates, including fractional pixels. */
async function center(node: Locator) {
  return node.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    return `${bounds.x + bounds.width / 2}px ${bounds.y + bounds.height / 2}px`;
  });
}

for (const name of ['pointer', 'group-keyboard', 'custom']) {
  test(`Image motion matches the reference phases and completion order for ${name}`, async ({ page }) => {
    const expected = sample(name);
    await choose(page, name);
    const thumb = trigger(page);
    let origin = expected.settledOrigin;
    if (expected.trigger === 'pointer') {
      const image = thumb.locator('img');
      origin = await center(image);
      await image.click({ position: { x: 12, y: 8 } });
    }
    else if (expected.trigger === 'keyboard') {
      origin = await center(thumb);
      await thumb.press('Enter');
    }
    await expect(completed(page)).toHaveText('[true]');

    const dialog = viewer(page);
    const body = dialog.locator('.image-motion-body');
    await expect(dialog).toBeVisible();
    await expect.poll(() => body.evaluate(node => (node as HTMLElement).style.transformOrigin))
      .toBe(origin);
    await expect(body).toHaveCSS('--body-marker', 'configured');
    if (expected.inline) {
      await expect(page.locator('#image-motion-fixture').locator(dialog)).toHaveCount(1);
      await control(page, 'Close motion preview');
    }
    else {
      await dialog.getByRole('button', { name: 'zoomIn' }).click();
      await expect(page.getByLabel('Preview transforms')).toHaveText('["zoomIn"]');
      await page.keyboard.press('Escape');
      await expect(page.getByLabel('Preview transforms')).toHaveText('["zoomIn","close"]');
    }
    await expect(completed(page)).toHaveText('[true,false]');
    await expect(dialog).toBeHidden();
    await expect(dialog).toHaveCount(1);
    await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
    if (!expected.inline) {
      await expect(thumb).toBeFocused();
      await expect(restored(page)).toHaveText('["Motion sample"]');
    }

    await control(page, 'Open motion preview');

    await expect(completed(page)).toHaveText(JSON.stringify(expected.reported));
    await expect(requested(page)).toHaveText(JSON.stringify(expected.requested));
    const trace = await readTrace(page);
    expect(trace.rootEnd).toEqual(expected.rootEnd);
    const alignedPhases = trace.phases.map(({ className, namedClass, duration, animation }) => ({
      className, namedClass, duration, animation
    }));
    expect(alignedPhases).toEqual(expected.phases.map(
      ({ className, namedClass, duration, animation }) => ({ className, namedClass, duration, animation })
    ));
    expect(trace.phases[0]).toMatchObject({ origin, completed: [], locked: true });
    expect(trace.phases[3]).toMatchObject({
      origin: expected.group ? expected.phases[3].origin : origin,
      completed: [true],
      locked: true
    });
    expect(trace.phases[5]).toMatchObject({
      origin: expected.group || expected.inline ? expected.repeatOrigin : origin,
      completed: [true, false]
    });
    if (expected.trigger) {
      expect(trace.phases[0].transform).toBe(expected.phases[0].transform);
    }
  });
}

for (const name of ['no-motion', 'theme-disabled', 'preference']) {
  test(`Image settles both visibility changes without motion for ${name}`, async ({ page }) => {
    const expected = sample(name);
    if (expected.reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
    await choose(page, name);
    await trigger(page).press('Space');
    await expect(completed(page)).toHaveText('[true]');

    await page.keyboard.press('Escape');

    await expect(completed(page)).toHaveText(JSON.stringify(expected.reported));
    await expect(viewer(page)).toBeHidden();
    await expect(trigger(page)).toBeFocused();
    await expect(requested(page)).toHaveText(JSON.stringify(expected.requested));
    expect(await readTrace(page)).toEqual({ phases: [], rootEnd: [] });
  });
}

for (const name of ['undefined-name', 'unknown-name', 'group-disabled']) {
  test(`Image finishes preview even when ${name} produces no CSS effect`, async ({ page }) => {
    const expected = sample(name);
    expect(expected.closedAfterWait).toBe(false);
    await choose(page, name);
    await trigger(page).click();
    await expect(viewer(page)).toBeVisible();
    await expect(viewer(page)).not.toHaveClass(/-appear-(start|active)/);

    await page.keyboard.press('Escape');

    await expect(viewer(page)).toBeHidden();
    await expect(trigger(page)).toBeFocused();
    if (!expected.disabled) await expect(completed(page)).toHaveText('[true,false]');
    const trace = await readTrace(page);
    expect(trace.phases.map(phase => phase.className))
      .toEqual(expected.phases.map(phase => phase.className));
    expect(trace.rootEnd).toEqual(expected.rootEnd);
  });
}

test('Image reuses the root and reports only the latest visibility when motion reverses', async ({ page }) => {
  const expected = sample('interrupt');
  await choose(page, expected.name);
  await trigger(page).click();
  const dialog = viewer(page);
  const root = await dialog.elementHandle();
  await expect(dialog).toHaveClass(/photo-motion-appear-active/);

  await control(page, 'Close motion preview');
  await expect(dialog).toHaveClass(/photo-motion-leave-active/);
  await control(page, 'Open motion preview');
  await expect(dialog).toHaveClass(/photo-motion-enter-active/);
  await expect(completed(page)).toHaveText('[true]');
  expect(await dialog.evaluate((node, original) => node === original, root)).toBe(true);

  await control(page, 'Close motion preview');

  await expect(dialog).toBeHidden();
  await expect(completed(page)).toHaveText(JSON.stringify(expected.reported));
  await expect(trigger(page)).toBeFocused();
  const trace = await readTrace(page);
  expect(trace.rootEnd).toEqual(expected.rootEnd);
  expect(trace.phases.map(phase => phase.className))
    .toEqual(expected.phases.map(phase => phase.className));
});

test('Image keeps the upstream fade name and scales the independently named viewer body', async ({ page }) => {
  const expected = sample('independent-prefix');
  await choose(page, expected.name);
  const thumb = trigger(page);
  await expect(thumb).toHaveClass(/fixture-motion:ant-image-preview-fade/);
  await thumb.click();
  await expect(completed(page)).toHaveText('[true]');
  await expect(viewer(page)).toHaveClass(/viewer-name/);

  await control(page, 'Close motion preview');

  await expect(completed(page)).toHaveText(JSON.stringify(expected.reported));
  const trace = await readTrace(page);
  expect(trace.phases.map(phase => phase.className))
    .toEqual(expected.phases.map(phase => phase.className));
  expect(trace.phases[0].transform).toBe('matrix(0, 0, 0, 0, 0, 0)');
  expect(trace.rootEnd).toEqual(expected.rootEnd);
});

test('Image releases focus and scroll if the owner removes the target during leave', async ({ page }) => {
  await choose(page, 'detached-target');
  await trigger(page).click();
  await expect(completed(page)).toHaveText('[true]');
  await page.keyboard.press('Escape');
  await expect(viewer(page)).toHaveClass(/ant-image-preview-fade-leave-active/);

  await control(page, 'Remove preview target');

  await expect(viewer(page)).toHaveCount(0);
  await expect(trigger(page)).toBeFocused();
  await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
  await expect(completed(page)).toHaveText('[true,false]');
  await expect(restored(page)).toHaveText('["Motion sample"]');
});

test('Image ignores the old motion when the owner retargets the viewer during leave', async ({ page }) => {
  await choose(page, 'pointer');
  await trigger(page).click();
  await expect(completed(page)).toHaveText('[true]');
  await page.keyboard.press('Escape');
  await expect(viewer(page)).toHaveClass(/ant-image-preview-fade-leave-active/);

  await control(page, 'Retarget motion preview');

  await expect(page.locator('#image-motion-retargeted').locator(viewer(page))).toBeHidden();
  await expect(trigger(page)).toBeFocused();
  await expect(completed(page)).toHaveText('[true,false]');
  await control(page, 'Open motion preview');
  await expect(page.locator('#image-motion-retargeted').locator(viewer(page))).toBeVisible();
  await expect(completed(page)).toHaveText('[true,false,true]');
});

test('Image settles a visible leave if reduced motion is enabled during that phase', async ({ page }) => {
  await choose(page, 'custom');
  await expect(completed(page)).toHaveText('[true]');
  await control(page, 'Close motion preview');
  await expect(viewer(page)).toHaveClass(/photo-motion-leave-active/);

  await page.emulateMedia({ reducedMotion: 'reduce' });

  await expect(completed(page)).toHaveText('[true,false]');
  await expect(viewer(page)).toBeHidden();
  expect((await readTrace(page)).rootEnd).toEqual(sample('custom').rootEnd.slice(0, 1));
});
