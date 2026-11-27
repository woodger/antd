import type { Page } from '@playwright/test';
import { test, expect } from '../test';
import reference from '../fixtures/ant-design-menu-tooltip-reference.json' with { type: 'json' };
import optionsReference from '../fixtures/ant-design-menu-tooltip-options-reference.json'
  with { type: 'json' };

const row = (page: Page) => page.locator('.tooltip-leaf').filter({ visible: true });
const surface = (page: Page) => page.locator('.ant-menu-inline-collapsed-tooltip:popover-open');
const menu = (page: Page) => page.getByRole('menu', { name: 'Tooltip menu' });
const events = (page: Page) => page.getByLabel('Menu tooltip events');
const selectSample = (page: Page, id: string) =>
  page.getByRole('combobox', { name: 'Menu tooltip sample' }).selectOption(id);

// Performs an external update of props without pointer events on an open prompt.
async function ownerAction(page: Page, label: string) {
  await page.getByRole('button', { name: label }).evaluate((button: HTMLButtonElement) => {
    button.click();
  });
}

// Gives the position and description attributes to complete the connection to the line.
function afterPaint(page: Page) {
  return page.evaluate(() => new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

// He reads the text and belonging of the visible surface for comparison with the original Tooltip.
async function tooltip(page: Page) {
  const values = await surface(page).evaluateAll(elements => elements.map(element => ({
    text: element.querySelector('[data-ant-tooltip-container]')?.textContent ?? '',
    placement: [...element.classList].find(name => name.includes('-placement-')),
    menuClass: element.classList.contains('ant-menu-inline-collapsed-tooltip'),
    arrow: Boolean(element.querySelector('[data-ant-tooltip-arrow]'))
  })));
  expect(values.length).toBeLessThanOrEqual(1);
  return values[0] ?? null;
}

// Is the native item, including HTML title and the temporary description Tooltip.
async function itemMetrics(page: Page) {
  return row(page).evaluate(element => ({
    title: element.getAttribute('title'),
    text: element.textContent?.trim(),
    role: element.getAttribute('role'),
    describedBy: Boolean(element.getAttribute('aria-describedby'))
  }));
}

test.use({ viewport: { width: 1000, height: 700 }, reducedMotion: 'reduce' });
test.beforeEach(async ({ page }) => {
  await page.goto('/?fixture=menu-tooltip');
  await expect(menu(page)).toBeVisible();
});

for (const { sample, initial, active, inactive } of reference.results) {
  test(`matches the collapsed React Tooltip for ${sample.id}`, async ({ page }) => {
    await selectSample(page, sample.id);
    await expect(row(page)).toBeVisible();
    const { same: _initial, ...initialItem } = initial.item;
    const { same: _active, ...activeItem } = active.item;
    const { same: _inactive, ...inactiveItem } = inactive.item;
    const original = await row(page).elementHandle();
    await expect.poll(() => tooltip(page)).toEqual(initial.tooltip);
    await expect.poll(() => itemMetrics(page)).toEqual(initialItem);
    await expect(menu(page)).not.toHaveAttribute('tooltip');

    if (sample.activate === 'focus') {
      await row(page).focus();
    }
    else {
      await row(page).hover();
    }
    await afterPaint(page);

    await expect.poll(() => tooltip(page)).toEqual(active.tooltip);
    await expect.poll(() => itemMetrics(page)).toEqual(activeItem);
    await expect(events(page)).toHaveText(JSON.stringify(active.changes));
    await page.mouse.move(0, 0);
    await row(page).evaluate((element: HTMLElement) => element.blur());
    await afterPaint(page);

    await expect.poll(() => tooltip(page)).toEqual(inactive.tooltip);
    await expect.poll(() => itemMetrics(page)).toEqual(inactiveItem);
    if (sample.id === 'open-controlled') {
      // rc-trigger causes both branches of pointerleave and mouseleave at the same controlled open.
      expect(inactive.changes).toEqual([false, false]);
      await expect(events(page)).toHaveText('[false]');
    }
    else {
      await expect(events(page)).toHaveText(JSON.stringify(inactive.changes));
    }
    expect(await row(page).evaluate((element, before) => element === before, original)).toBe(true);
  });
}

test('controlled tooltip follows collapse without replacing the focused row', async ({ page }) => {
  await selectSample(page, 'open-controlled');
  await expect(surface(page)).toHaveText('Controlled');
  await row(page).focus();
  const original = await row(page).elementHandle();

  await ownerAction(page, 'Toggle collapse');

  await expect(surface(page)).toHaveCount(0);
  await expect(row(page)).not.toHaveAttribute('aria-describedby');
  await expect(row(page)).toHaveText('Warehouse');
  await expect(row(page)).toBeFocused();
  expect(await row(page).evaluate((element, before) => element === before, original)).toBe(true);

  await ownerAction(page, 'Toggle collapse');

  await expect(surface(page)).toHaveText('Controlled');
  await expect(row(page)).toBeFocused();
  await ownerAction(page, 'Remove menu');

  await expect(page.locator('.ant-menu-inline-collapsed-tooltip')).toHaveCount(0);
});

test('composes the tooltip click before the row callback and selection', async ({ page }) => {
  const source = optionsReference.results.find(result => result.kind === 'click');
  if (!source || !source.again) {
    throw new Error('Missing source click observation');
  }
  const sequence = page.getByLabel('Menu tooltip sequence');
  await selectSample(page, 'click');

  await row(page).click();

  await expect(surface(page)).toHaveText('Warehouse');
  await expect(sequence).toHaveText(JSON.stringify(source.after.events));

  await row(page).click();

  await expect(surface(page)).toHaveCount(0);
  await expect(sequence).toHaveText(JSON.stringify(source.again.events));
  await expect(row(page)).toBeFocused();
});

test('resolves semantic slots and passes the actual li to the custom portal', async ({ page }) => {
  const source = optionsReference.results.find(result => result.kind === 'semantic-portal')?.after;
  if (!source?.popup) {
    throw new Error('Missing source portal observation');
  }
  await selectSample(page, 'semantic-portal');
  const popup = page.locator('#tooltip-container .ant-menu-inline-collapsed-tooltip');
  await expect(page.getByLabel('Menu tooltip containers')).toHaveText('[]');

  await row(page).hover();

  await expect(popup).toHaveText(source.popup.text);
  for (const className of source.popup.classes) {
    await expect(popup).toHaveClass(new RegExp(`\\b${className}\\b`));
  }
  await expect(popup).not.toHaveClass(/\btooltip-plain\b/);
  await expect(popup).toHaveCSS('padding-top', source.popup.paddingTop);
  await expect(popup).toHaveCSS('pointer-events', source.popup.pointerEvents);
  await expect(popup.locator('.tooltip-text')).toHaveCSS('font-size', source.popup.fontSize);
  await expect(page.getByLabel('Menu tooltip containers')).toHaveText(JSON.stringify(source.containers));
  await expect(row(page)).toHaveAttribute('aria-describedby', 'owned-hint');
  await expect(popup).toHaveAttribute('id', 'owned-hint');
});

test('preserves semantic props with the default tooltip portal', async ({ page }) => {
  const source = optionsReference.results.find(result => result.kind === 'semantic-implicit-portal')
    ?.after.popup;
  if (!source) {
    throw new Error('Missing source observation for the default portal');
  }
  await selectSample(page, 'semantic-implicit-portal');
  const popup = page.locator('body > .ant-menu-inline-collapsed-tooltip:popover-open');

  await row(page).hover();

  await expect(popup).toHaveText(source.text);
  await expect(popup).toHaveClass(/\btooltip-implicit\b/);
  await expect(popup.locator('[data-ant-tooltip-container]')).toHaveCSS('font-size', source.fontSize);
});

test('uses the label and zero-valued extra as default tooltip content', async ({ page }) => {
  const source = optionsReference.results.find(result => result.kind === 'extra-zero')?.after.popup;
  if (!source) {
    throw new Error('Missing source label and extra observation');
  }
  await selectSample(page, 'extra-zero');

  await row(page).hover();

  await expect(surface(page)).toHaveText(source.text);
  await expect(surface(page).locator('.ant-menu-item-extra')).toHaveText('0');
  await expect(row(page)).toHaveAccessibleName('Warehouse');
});

test('forceRender mounts the empty, hidden tooltip for an expanded row', async ({ page }) => {
  await selectSample(page, 'force-expanded');
  const popup = page.locator('#tooltip-container [role=tooltip]');
  await expect(popup).toHaveCount(1);

  await row(page).hover();

  await expect(popup).toBeHidden();
  await expect(popup).toHaveText('');
  await expect(row(page)).not.toHaveAttribute('aria-describedby');
  await expect(events(page)).toHaveText('[]');
});

test('a collapsed LayoutSider enables tooltip even with an expanded Menu row', async ({ page }) => {
  await selectSample(page, 'sider');
  await expect(row(page)).toHaveText('Warehouse');

  await row(page).hover();

  await expect(surface(page)).toHaveText('Warehouse');
});

test('cancels a queued hover when collapse is switched off and back on', async ({ page }) => {
  await page.clock.install();
  await selectSample(page, 'pending-collapse');
  await row(page).hover();
  await expect(events(page)).toHaveText('[]');

  await ownerAction(page, 'Toggle collapse');
  await expect(row(page)).toHaveText('Warehouse');
  await ownerAction(page, 'Toggle collapse');
  await page.clock.runFor(400);

  await expect(surface(page)).toHaveCount(0);
  await expect(events(page)).toHaveText('[]');
});

test('keeps a default Menu tooltip in its native modal', async ({ page }) => {
  await selectSample(page, 'modal');
  const dialog = page.getByRole('dialog', { name: 'Modal with collapsed Menu' });
  await expect(dialog).toBeVisible();

  await row(page).hover();

  await expect(dialog.locator('.ant-menu-inline-collapsed-tooltip:popover-open'))
    .toHaveText('Warehouse');
});
