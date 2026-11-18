import { test, expect } from './test';
import reference from './fixtures/ant-design-date-picker-offgrid-scroll-source-reference.json' with { type: 'json' };

const source = reference.cases[0];
test.use({ viewport: source.viewport, locale: 'en-US', timezoneId: 'UTC' });

test('DatePicker retains manual time scroll when the selected minute has no row', async ({ page }) => {
  await page.goto('/?fixture=date-picker-offgrid-scroll');
  const input = page.locator('#offgrid-scroll-input');
  const minute = page.locator('.ant-picker-dropdown:visible ul[aria-label="minute"]');
  await input.click();
  await expect(minute.getByRole('button')).toHaveText(['00', '15', '30', '45']);
  await expect(minute.getByRole('button', { pressed: true })).toHaveCount(0);
  await expect(minute.getByRole('button', { name: 'minute 0', exact: true })).toBeEnabled();

  const wheel = minute.evaluate(node => new Promise<{ isTrusted: boolean; deltaY: number }>(resolve => {
    node.addEventListener('wheel', event => {
      const wheel = event as WheelEvent;
      resolve({ isTrusted: wheel.isTrusted, deltaY: wheel.deltaY });
    }, { once: true, passive: true });
  }));
  const rect = await minute.boundingBox();
  expect(rect).not.toBeNull();
  await page.mouse.move(rect!.x + rect!.width / 2, rect!.y + 12);
  await page.mouse.wheel(0, 28);
  expect(await wheel).toEqual({ isTrusted: true, deltaY: 28 });
  await page.mouse.move(1100, 750);
  await expect.poll(() => minute.evaluate(node => node.scrollTop))
    .toBe(source.first.afterWheel.minute.scrollTop);
  await expect(input).toHaveValue(source.first.afterWheel.inputValue);

  await page.getByRole('button', { name: 'Close off-grid picker', exact: true })
    .evaluate(button => (button as HTMLButtonElement).click());
  await expect(minute).toHaveCount(0);
  await page.getByRole('button', { name: 'Disable minute zero', exact: true })
    .evaluate(button => (button as HTMLButtonElement).click());
  await expect(minute).toHaveCount(0);
  await page.getByRole('button', { name: 'Reopen off-grid picker', exact: true })
    .evaluate(button => (button as HTMLButtonElement).click());

  await expect(minute.getByRole('button', { name: 'minute 0', exact: true })).toBeDisabled();
  await expect(minute.getByRole('button', { name: 'minute 15', exact: true })).toBeEnabled();
  await expect(minute.getByRole('button', { pressed: true })).toHaveCount(0);
  await expect.poll(() => minute.evaluate(node => node.scrollTop))
    .toBe(source.first.afterReopen.minute.scrollTop);
  await expect(input).toHaveValue(source.first.afterReopen.inputValue);
  await expect(page.getByRole('status', { name: 'Off-grid value changes' })).toHaveText('[]');
});
