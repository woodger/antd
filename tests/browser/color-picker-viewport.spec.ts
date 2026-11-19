import { test, expect } from './test';

test.use({ viewport: { width: 1280, height: 720 } });

for (const [top, popupTop] of [['343.64', 387], ['344', 388]] as const) {
  test(`ColorPicker retains the Source bottom placement on a scrollable page at ${top}`, async ({ page }) => {
    await page.goto('/?fixture=color-picker-viewport');
    await page.getByRole('combobox', { name: 'Viewport color top', exact: true }).selectOption(top);
    await page.getByRole('button', { name: 'Viewport color', exact: true }).click();
    const popup = page.getByRole('dialog', { name: 'Color picker', exact: true });
    const warm = page.getByRole('button', { name: 'Тёплая палитра', exact: true });

    await expect(popup).toHaveClass(/ant-popover-placement-bottomLeft/);
    await expect.poll(async () => (await popup.boundingBox())?.y).toBe(popupTop);
    await expect.poll(async () => (await popup.boundingBox())?.height).toBe(365);
    await expect(warm).toHaveAttribute('aria-expanded', 'false');
    expect((await warm.boundingBox())!.y).toBeGreaterThanOrEqual(720);

    await page.mouse.move(1000, 500);
    await page.mouse.wheel(0, 200);

    await expect.poll(() => page.evaluate(() => scrollY)).toBe(200);
    await expect.poll(async () => (await popup.boundingBox())?.y).toBe(popupTop - 200);
    await warm.click();

    await expect(warm).toHaveAttribute('aria-expanded', 'true');
    await expect(popup.getByRole('button', { name: 'rgb(250,173,20)', exact: true })).toBeVisible();
  });
}
