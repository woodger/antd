import type { Locator, Page } from '@playwright/test';
import source from './fixtures/ant-design-table-sorter-tooltip-reference.json' with { type: 'json' };
import { expect, test } from './test';

test.use({ viewport: source.reference.viewport, locale: 'en-US' });

const fixture = '/?fixture=table-sorter-tooltip';
const root = '[data-table-sorter-tooltip-fixture]';
const header = `${root} th.ant-table-column-has-sorters`;
const button = `${header} button.ant-table-column-sorters`;

/** Relieves the position of the hint and the current public result of sorting. */
function snapshot() {
  const fixture = document.querySelector('[data-table-sorter-tooltip-fixture]');
  const header = fixture?.querySelector('th.ant-table-column-has-sorters');
  const sorter = header?.querySelector('button.ant-table-column-sorters');
  if (!fixture || !header || !sorter) {
    throw new Error('Missing sorter tooltip fixture');
  }

  const visible = document.querySelector<HTMLElement>('[data-ant-tooltip]:popover-open');
  const anchor = header.querySelector('.ant-tooltip-open');
  return {
    order: header.getAttribute('aria-sort'),
    iconTarget: sorter.classList.contains('ant-table-column-sorters-tooltip-target-sorter'),
    anchor: anchor?.classList.contains('ant-table-column-sorter') ? 'icon' : anchor ? 'header' : null,
    tooltip: visible?.querySelector('[data-ant-tooltip-container]')?.textContent ?? null,
    placement: visible?.getAttribute('data-ant-placement') ?? null,
    owner: visible?.parentElement?.id || null,
    custom: visible?.classList.contains('fixture-sorter-popup') ?? false,
    arrow: !!visible?.querySelector('[data-ant-tooltip-arrow]'),
    border: visible?.style.borderTopWidth || null,
    events: JSON.parse(fixture.querySelector('[data-sorter-tooltip-events]')?.textContent ?? '[]')
  };
}

/** Points the physical area, taking into account the overlapping CSS. */
async function hoverArea(page: Page, target: Locator, inset?: number) {
  const box = await target.boundingBox();
  if (!box) {
    throw new Error('Missing header geometry');
  }
  await page.mouse.move(box.x + (inset ?? box.width / 2), box.y + box.height / 2);
}

/** Repeats the action from an independent run on native elements. */
async function act(page: Page, action: string) {
  switch (action) {
    case 'title':
      await page.locator(`${button} .ant-table-column-title`).hover();
      return;
    case 'sort':
      await page.locator(`${button} .ant-table-column-title`).click();
      return;
    case 'icon':
      await hoverArea(page, page.locator(`${button} .ant-table-column-sorter`));
      return;
    case 'icon-click':
      await page.locator(`${button} .ant-table-column-sorter`).click();
      return;
    case 'padding':
      await hoverArea(page, page.locator(header), 4);
      return;
    case 'filter-hover':
      await page.locator(`${header} .ant-table-filter-trigger`).hover();
      return;
    case 'focus':
      await page.locator(button).focus();
      return;
    case 'blur':
      await page.locator(button).evaluate((element: HTMLButtonElement) => element.blur());
      return;
    case 'leave':
      await page.mouse.move(5, 5);
      return;
    default:
      throw new Error(`Unexpected sorter tooltip action ${action}`);
  }
}

for (const { profile, states } of source.cases) {
  test(`Table sorter tooltip matches Ant Design for ${profile.id}`, async ({ page }) => {
    await page.clock.install();
    await page.goto(`${fixture}&profile=${profile.id}`);
    await expect(page.locator(button)).toBeVisible();

    for (const { action, state } of states) {
      if (action) {
        await act(page, action);
      }
      // Source focus on th. The Native focus-trigger belongs to the button itself.
      const expected = profile.id === 'focus-only' && action === 'focus'
        ? { ...state, anchor: 'header', tooltip: 'Ascending', placement: 'top', arrow: true }
        : state;
      await page.clock.runFor(260);
      await expect.poll(() => page.evaluate(snapshot), {
        message: `${profile.id} ${action ?? 'initial'}`
      }).toEqual(expected);
    }
  });
}

test('Table cancels pending hints and preserves the sort button while changing targets',
  async ({ page }) => {
    await page.clock.install();
    await page.goto(`${fixture}&lifecycle`);
    const score = page.locator(button);
    const original = await score.elementHandle();
    const events = page.locator('[data-sorter-tooltip-events]');

    await score.focus();
    await act(page, 'title');
    await page.getByRole('button', { name: 'Use icon' }).dispatchEvent('click');
    await page.clock.runFor(260);

    await expect(page.locator('[data-ant-tooltip]')).toHaveCount(0);
    await expect(score).toBeFocused();
    await expect(events).toHaveText('[]');
    expect(await score.evaluate((node, before) => node === before, original)).toBe(true);

    await act(page, 'icon');
    await page.clock.runFor(260);
    await expect(page.getByRole('tooltip')).toHaveText('Ascending');
    await page.getByRole('button', { name: 'Disable hint' }).dispatchEvent('click');
    await expect(page.locator('[data-ant-tooltip]')).toHaveCount(0);
    await expect(score).toBeFocused();

    await score.press('Enter');

    await expect(page.locator(header)).toHaveAttribute('aria-sort', 'ascending');
    await expect(score).toHaveAccessibleDescription('Descending');
    await expect(events).toHaveText('[["tooltip",true],["sort","ascend"]]');
    await expect(score).toBeFocused();
    expect(await score.evaluate((node, before) => node === before, original)).toBe(true);
  });

test('Table hides pending and open sorter hints during loading', async ({ page }) => {
  await page.clock.install();
  await page.goto(`${fixture}&lifecycle`);
  const toggle = page.getByRole('button', { name: 'Toggle loading' });
  const score = page.locator(button);

  await act(page, 'title');
  await toggle.dispatchEvent('click');
  await page.clock.runFor(260);

  await expect(score).toBeDisabled();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await expect(page.locator('[data-sorter-tooltip-events]')).toHaveText('[]');

  await toggle.click();
  await act(page, 'title');
  await page.clock.runFor(260);
  await expect(page.getByRole('tooltip')).toHaveText('Ascending');
  await toggle.dispatchEvent('click');
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await expect(score).toBeDisabled();
});

test('Table resolves the sorter hint with its own Tooltip prefix', async ({ page }) => {
  await page.goto(`${fixture}&prefix`);
  const sorter = page.locator(`${root} button.sample-grid-column-sorters`);
  await expect(sorter).toHaveAccessibleDescription('Ascending');

  await sorter.hover();

  const tooltip = page.getByRole('tooltip');
  await expect(tooltip).toHaveText('Prefixed hint');
  await expect(tooltip).toHaveClass(/custom-sort-tip/);
  await expect(sorter).toHaveClass(/custom-sort-tip-open/);
  const id = await tooltip.getAttribute('id');
  expect(id).toBeTruthy();
  await expect(sorter).toHaveAttribute('aria-describedby', id ?? '');
  await expect(sorter).toHaveAccessibleDescription('Prefixed hint');

  await page.mouse.move(5, 5);

  await expect(tooltip).toBeHidden();
  await expect(sorter).toHaveAccessibleDescription('Ascending');
});
